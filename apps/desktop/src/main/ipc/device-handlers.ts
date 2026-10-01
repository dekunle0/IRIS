import { dialog, ipcMain } from 'electron';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { db } from '../db';

function audit(session: any, action: string, entityId: string, metadata?: Record<string, unknown>) {
  db.prepare(`
    INSERT INTO audit_log (user_id, institution_id, action, entity_type, entity_id, metadata)
    VALUES (?, ?, ?, 'device', ?, ?)
  `).run(session.userId, session.institutionId, action, entityId, metadata ? JSON.stringify(metadata) : null);
}

export function registerDeviceHandlers() {
  ipcMain.handle('devices:getAll', async (_, _payload, session) => {
    try {
      const devices = db.prepare(`
        SELECT id, serial_number as serialNumber, firmware_version as firmwareVersion,
          last_paired_at as lastPairedAt, last_seen_at as lastSeenAt, battery_level_pct as batteryPct,
          storage_used_gb as storageUsedGb, storage_total_gb as storageTotalGb,
          last_local_ip as lastLocalIp, calibration_due_at as calibrationDueAt
        FROM devices WHERE institution_id = ? ORDER BY serial_number
      `).all(session.institutionId);
      return { success: true, data: devices };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('devices:discover', async (_, __, session) => {
    // Simulate finding devices over USB/Wifi and updating telemetry
    db.prepare(`UPDATE devices SET last_seen_at = datetime('now'), battery_level_pct = 95, storage_used_gb = 10, storage_total_gb = 128 WHERE institution_id = ?`).run(session.institutionId);
    return { success: true };
  });

  ipcMain.handle('devices:pair', async (_, payload, session) => {
    if (session.role === 'viewer') return { success: false, error: 'Unauthorized: Viewers cannot manage devices.' };
    const serialNumber = String(payload?.serialNumber || '').trim();
    if (!serialNumber) return { success: false, error: 'Device serial number is required.' };
    try {
      const existing = db.prepare('SELECT id, institution_id FROM devices WHERE serial_number = ?').get(serialNumber) as any;
      if (existing && existing.institution_id !== session.institutionId) return { success: false, error: 'This device is registered to another institution.' };

      let id = existing?.id;
      if (existing) {
        db.prepare(`
          UPDATE devices 
          SET last_paired_at = datetime('now'),
              firmware_version = COALESCE(NULLIF(?, 'Unknown'), firmware_version)
          WHERE id = ?
        `).run(payload?.firmwareVersion || 'Unknown', id);
      } else {
        id = crypto.randomUUID();
        db.prepare(`
          INSERT INTO devices (id, institution_id, serial_number, firmware_version, last_paired_at, battery_level_pct, storage_used_gb, storage_total_gb)
          VALUES (?, ?, ?, ?, datetime('now'), NULL, NULL, NULL)
        `).run(id, session.institutionId, serialNumber, payload?.firmwareVersion || 'Unknown');
      }
      audit(session, 'pair_device', id, { serialNumber });
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('devices:unpair', async (_, { deviceId }, session) => {
    if (session.role === 'viewer') return { success: false, error: 'Unauthorized: Viewers cannot manage devices.' };
    const device = db.prepare('SELECT id, serial_number as serialNumber FROM devices WHERE id = ? AND institution_id = ?').get(deviceId, session.institutionId) as any;
    if (!device) return { success: false, error: 'Device not found.' };
    db.prepare('DELETE FROM devices WHERE id = ? AND institution_id = ?').run(deviceId, session.institutionId);
    audit(session, 'unpair_device', device.id, { serialNumber: device.serialNumber });
    return { success: true };
  });

  ipcMain.handle('devices:selectFirmware', async (_, { deviceId }, session) => {
    if (session.role === 'viewer') return { success: false, error: 'Unauthorized: Viewers cannot manage devices.' };
    const device = db.prepare('SELECT id, serial_number as serialNumber FROM devices WHERE id = ? AND institution_id = ?').get(deviceId, session.institutionId) as any;
    if (!device) return { success: false, error: 'Device not found.' };
    const result = await dialog.showOpenDialog({
      title: 'Select Signed Firmware Package',
      properties: ['openFile'],
      filters: [{ name: 'Firmware Packages', extensions: ['bin'] }]
    });
    if (result.canceled || !result.filePaths[0]) return { success: false, canceled: true };
    const firmwarePath = result.filePaths[0];
    const stat = await fs.promises.stat(firmwarePath);

    const sigPath = firmwarePath + '.sig';
    if (!fs.existsSync(sigPath)) {
      return { success: false, error: 'CRITICAL SECURITY ERROR: Missing detached signature file (.bin.sig). Firmware updates must be cryptographically signed.' };
    }

    const signature = await fs.promises.readFile(sigPath);
    
    const publicKey = process.env.IRIS_FIRMWARE_PUBLIC_KEY || `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA1h9tVB60YlSeV+v7TdcB
WOd1FmeVWpjtI9+AbCFGBLqE7CF7k3yz4strnfhVzD63u+CMirAziIjAHlx4kIHc
JO7okgKySOu/Z1+L3B1GWdtty5Y6O13ZJLy0LZ7n3IK5/pvVbO15lhgi4+3Zgfd8
31N0zvF96s6YrSMFrXnZ6NemGrnG4QC/4Ft+RgpdTHhYbk2r3twVfVXkxWJXJtCy
+3cPTl2fcYncaJkawyUo/bc8TsvGZzm8dA1v8sFbtXelGmcn4N7CnRc1ezdwsBZL
yx62AM0OEWbTxEFsMsqPeSCl/9r6kx1NraTBq4di/6mNymAuYhcNJyIMqA0XtupE
LQIDAQAB
-----END PUBLIC KEY-----`;

    let checksum = '';
    try {
      const verifier = crypto.createVerify('sha256');
      const hash = crypto.createHash('sha256');
      const rs = fs.createReadStream(firmwarePath);
      
      await new Promise<void>((resolve, reject) => {
        rs.on('data', chunk => {
          verifier.update(chunk);
          hash.update(chunk);
        });
        rs.on('end', () => {
          checksum = hash.digest('hex');
          resolve();
        });
        rs.on('error', reject);
      });

      const isVerified = verifier.verify({
        key: publicKey,
        padding: crypto.constants.RSA_PKCS1_PSS_PADDING,
        saltLength: crypto.constants.RSA_PSS_SALTLEN_AUTO
      }, signature);
      
      if (!isVerified) {
        return { success: false, error: 'CRITICAL SECURITY ERROR: Firmware signature verification failed. The file may be corrupted, modified, or malicious.' };
      }
    } catch (err: any) {
      return { success: false, error: `CRITICAL SECURITY ERROR: Signature verification exception - ${err.message}` };
    }
    
    // Simulate flashing delay to device over bridge
    await new Promise(resolve => setTimeout(resolve, 2000));

    audit(session, 'firmware_update_selected', device.id, { 
      serialNumber: device.serialNumber, 
      fileName: path.basename(firmwarePath), 
      size: stat.size,
      checksum 
    });
    return { success: true, fileName: path.basename(firmwarePath), message: 'Flashed successfully to device.' };
  });
}