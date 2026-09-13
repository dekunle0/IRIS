// apps/desktop/src/main/ipc/ai-handlers.ts
import { ipcMain } from 'electron';
import { db } from '../db';
import crypto from 'crypto';

export function registerAIHandlers() {
  ipcMain.handle('ai:analyze', async (_, payload) => {
    console.log(`[Main Process] Triggering Local AI Analysis for test: ${payload.testType}`);
    
    try {
      // 1. Send the data to the local Python FastAPI service (packages/ai/main.py)
      // Node 18+ has native fetch, so we don't need external libraries
      const response = await fetch('http://127.0.0.1:8000/analyse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          capture_path: payload.videoPath,
          test_type: payload.testType,
          patient_context: payload.patientContext
        })
      });

      if (!response.ok) {
        throw new Error(`AI Service responded with status: ${response.status}`);
      }

      const aiResult = await response.json();
      
      // 2. Save the AI's result directly into the local SQLite database
      const aiResultId = crypto.randomUUID();
      db.prepare(`
        INSERT INTO ai_results (
          id, capture_id, model_version, test_type, findings, 
          confidence_scores, uncertain_cells_pct
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(
        aiResultId, 
        payload.captureId, 
        aiResult.model_version || 'v1.0.0', 
        payload.testType, 
        JSON.stringify(aiResult.findings), 
        JSON.stringify(aiResult.confidence_scores),
        aiResult.uncertain_cells_pct || 0
      );

      return { success: true, data: { aiResultId, findings: aiResult.findings } };

    } catch (error) {
      console.error('[Main Process] Local AI connection failed:', error);
      return { 
        success: false, 
        error: 'Failed to connect to local AI engine. Ensure the Python service is running.' 
      };
    }
  });
}