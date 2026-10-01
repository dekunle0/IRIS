import * as http from 'http';
import { ipcMain, app } from 'electron';
import { db } from '../db';
import crypto from 'crypto';
import path from 'path';
import fs from 'fs';
import { getAppKey } from '../db';

export function encryptBuffer(buffer: Buffer): Buffer {
  const key = getAppKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(buffer), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, encrypted]);
}

export function decryptBuffer(buffer: Buffer): Buffer {
  const key = getAppKey();
  const iv = buffer.subarray(0, 12);
  const tag = buffer.subarray(12, 28);
  const data = buffer.subarray(28);
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(data), decipher.final()]);
}

export function registerAIHandlers() {
  
  ipcMain.handle('ai:saveLiveCapture', async (_, arrayBuffer) => {
    try {
      const capturesDir = path.join(app.getPath('userData'), 'ai_captures');
      if (!fs.existsSync(capturesDir)) fs.mkdirSync(capturesDir, { recursive: true });
      const filePath = path.join(capturesDir, `capture_${Date.now()}.enc`);
      fs.writeFileSync(filePath, encryptBuffer(Buffer.from(arrayBuffer)));
      return { success: true, filePath };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('ai:analyze', async (_, payload, session) => {
    console.log(`[Main Process] Triggering Local AI Analysis for Request: ${payload.testRequestId}`);

    // IRIS-H-194: Wait for AI readiness before beginning
    let isReady = false;
    for (let i = 0; i < 30; i++) {
      try {
        const res = await new Promise<http.IncomingMessage>((resolve, reject) => {
          const req = http.request('http://127.0.0.1:8005/health', { method: 'GET', timeout: 1000 }, resolve);
          req.on('error', reject);
          req.on('timeout', () => req.destroy());
          req.end();
        });
        if (res.statusCode === 200) { isReady = true; break; }
      } catch (e) {}
      await new Promise(r => setTimeout(r, 1000));
    }
    if (!isReady) return { success: false, error: 'AI Service is starting or currently unresponsive. Please try again in a moment.' };

    const tempDirBase = path.join(app.getPath('userData'), 'tmp_ai_processing');
    if (!fs.existsSync(tempDirBase)) fs.mkdirSync(tempDirBase, { recursive: true, mode: 0o700 });

    const captureId = crypto.randomUUID();
    const tempVideoPath = path.join(tempDirBase, `${captureId}.webm`);
    const tempFramesDir = path.join(tempDirBase, `frames_${captureId}`);

    try {
      const request = db.prepare(`SELECT tr.id FROM test_requests tr JOIN samples s ON tr.sample_id = s.id WHERE tr.id = ? AND s.institution_id = ?`).get(payload.testRequestId, session.institutionId);
      if (!request) return { success: false, error: 'Unauthorized or test request not found.' };
      
      db.prepare(`
        INSERT INTO captures (id, test_request_id, video_local_path, created_by)
        VALUES (?, ?, ?, ?)
      `).run(captureId, payload.testRequestId, payload.videoPath, session.userId);

      // Decrypt video to temp location for Python analysis
      if (fs.existsSync(payload.videoPath)) {
        const encryptedVideo = fs.readFileSync(payload.videoPath);
        fs.writeFileSync(tempVideoPath, decryptBuffer(encryptedVideo), { mode: 0o600 });
      } else {
        throw new Error('Capture file missing');
      }

      if (!fs.existsSync(tempFramesDir)) fs.mkdirSync(tempFramesDir, { recursive: true, mode: 0o700 });

      const payloadBody = JSON.stringify({
        capture_id: captureId,
        capture_path: tempVideoPath,
        output_dir: tempFramesDir,
        test_type: payload.testType,
        patient_context: payload.patientContext
      });

      const aiResult = await new Promise<any>((resolve, reject) => {
        // IRIS-H-197: Use agent with keepAlive: false
        const agent = new http.Agent({ keepAlive: false });
        // IRIS-H-195: AbortController for cancel
        const abortController = new AbortController();
        const timeoutTimer = setTimeout(() => abortController.abort('timeout'), 15 * 60 * 1000); // 15 mins
        
        // Expose abort mechanism if a global cancel is called (using IPC)
        ipcMain.once('ai:cancelAnalysis', () => {
          abortController.abort('user_cancelled');
          const { killAIService, startAIService } = require('../index');
          // IRIS-H-196: Kill the Python service to stop computation
          killAIService();
          setTimeout(startAIService, 1000);
        });

        const req = http.request('http://127.0.0.1:8005/analyse', {
          method: 'POST',
          agent,
          signal: abortController.signal,
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(payloadBody),
            'Authorization': `Bearer ${process.env.IRIS_AI_TOKEN || ''}`,
            'Connection': 'close' // IRIS-H-197
          }
        }, (res) => {
          clearTimeout(timeoutTimer);
          let data = '';
          res.on('data', (chunk) => { data += chunk; });
          res.on('end', () => {
            if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
              try { resolve(JSON.parse(data)); } catch(e) { reject(new Error(`Failed to parse AI response: ${data}`)); }
            } else {
              reject(new Error(`AI Service connection failed with HTTP status: ${res.statusCode}`));
            }
          });
        });
        
        req.on('error', (err: any) => {
          clearTimeout(timeoutTimer);
          if (err.name === 'AbortError') {
            if (abortController.signal.reason === 'timeout') {
              reject(new Error('AI Service request timed out after 15 minutes'));
            } else {
              reject(new Error('Analysis was cancelled by user.'));
            }
          } else {
            reject(err);
          }
        });
        
        req.write(payloadBody);
        req.end();
      });

      // Encrypt frames from Python and move to permanent storage
      const finalFramesDir = path.join(app.getPath('userData'), 'ai_frames');
      if (!fs.existsSync(finalFramesDir)) fs.mkdirSync(finalFramesDir, { recursive: true });

      if (aiResult.findings && aiResult.findings.frame_paths) {
        const encryptedFramePaths: string[] = [];
        for (const framePath of aiResult.findings.frame_paths) {
          if (fs.existsSync(framePath)) {
            const frameData = fs.readFileSync(framePath);
            const encryptedFrame = encryptBuffer(frameData);
            const encPath = path.join(finalFramesDir, `${path.basename(framePath)}.enc`);
            fs.writeFileSync(encPath, encryptedFrame);
            encryptedFramePaths.push(encPath);
          }
        }
        aiResult.findings.frame_paths = encryptedFramePaths;
      }

      if (aiResult.status === 'unable_to_analyse') {
        const unableResultId = crypto.randomUUID();
        db.transaction(() => {
          db.prepare(`INSERT INTO ai_results (id,capture_id,model_version,test_type,findings,confidence_scores,uncertain_cells_pct) VALUES (?,?,?,?,?,?,?)`).run(
            unableResultId, captureId, aiResult.model_version||'v1.0.0', payload.testType,
            JSON.stringify({status:'unable_to_analyse',reason:aiResult.reason||'Insufficient sample quality.'}),
            JSON.stringify({}), 100
          );
          db.prepare(`UPDATE test_requests SET status = 'unable_to_analyse' WHERE id = ?`).run(payload.testRequestId);
        })();
        return { success:false, unableToAnalyse:true, error: aiResult.reason||'Sample could not be analysed. Please recapture or escalate.' };
      }
      
      if (aiResult.status === 'error') throw new Error(aiResult.reason||'AI service internal error.');

      const aiResultId = crypto.randomUUID();
      db.transaction(() => {
        db.prepare(`
          INSERT INTO ai_results (
            id, capture_id, model_version, test_type, findings,
            confidence_scores, uncertain_cells_pct, flagged_for_review,
            dataset_version, model_checksum, preprocessing_version, calibration_version
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          aiResultId, captureId, aiResult.model_version || 'v1.0.0',
          aiResult.findings?.test_type || payload.testType, JSON.stringify(aiResult.findings),
          JSON.stringify(aiResult.confidence_scores), aiResult.uncertain_cells_pct || 0,
          aiResult.flagged_for_review ? 1 : 0,
          aiResult.dataset_version || null,
          aiResult.model_checksum || null,
          aiResult.preprocessing_version || null,
          aiResult.calibration_version || null
        );

        db.prepare(`UPDATE test_requests SET status = 'review' WHERE id = ?`).run(payload.testRequestId);
      })();

      return { success: true, data: { aiResultId, findings: aiResult.findings } };

    } catch (error: any) {
      console.error('[Main Process] Local AI Analysis error:', error);
      return { success: false, error: error.message || 'The analysis service could not be reached.' };
    } finally {
      // Secure cleanup of transient plaintext files
      try {
        if (fs.existsSync(tempVideoPath)) fs.unlinkSync(tempVideoPath);
        if (fs.existsSync(tempFramesDir)) fs.rmSync(tempFramesDir, { recursive: true, force: true });
      } catch (cleanupErr) {
        console.error('[Main Process] Failed to cleanup AI temporary files:', cleanupErr);
      }
    }
  });
}