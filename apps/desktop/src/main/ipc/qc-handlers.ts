import { ipcMain, dialog, shell } from 'electron';
import { db } from '../db';
import fs from 'fs';
import crypto from 'crypto';

export function registerQCHandlers() {
  ipcMain.handle('qc:getStats', async (_, payload, session) => {
    try {
      const periodFilter = payload?.period === '7d' ? `AND r.approved_at >= datetime('now', '-7 days')` :
                           payload?.period === '30d' ? `AND r.approved_at >= datetime('now', '-30 days')` : '';
                           
      const completedResults = db.prepare(`SELECT count(*) as count FROM results r WHERE r.institution_id = ? AND r.status IN ('approved', 'released', 'amended') ${periodFilter}`).get(session.institutionId) as { count: number };
      const totalCorrections = db.prepare(`SELECT count(*) as count FROM corrections c JOIN results r ON c.result_id = r.id WHERE r.institution_id = ? ${periodFilter}`).get(session.institutionId) as { count: number };

      // IRIS-H-122: Field-level agreement rate (assuming ~5 fields per test on average)
      const estimatedTotalFields = completedResults.count * 5;
      const agreementRate = estimatedTotalFields > 0
        ? Math.max(0, Math.round(((estimatedTotalFields - totalCorrections.count) / estimatedTotalFields) * 100))
        : 100;

      // IRIS-H-120: Use capture_datetime (c.created_at) instead of test request created_at
      const turnaround = db.prepare(`
        SELECT ROUND(AVG((julianday(r.approved_at) - julianday(cap.created_at)) * 24 * 60), 1) as avg
        FROM results r
        JOIN test_requests tr ON r.test_request_id = tr.id
        LEFT JOIN (SELECT test_request_id, MIN(capture_datetime) as created_at FROM captures GROUP BY test_request_id) cap ON cap.test_request_id = tr.id
        WHERE r.status IN ('approved', 'released', 'amended') AND r.institution_id = ? ${periodFilter}
      `).get(session.institutionId) as { avg: number | null };
      const avgTurnaroundMin = turnaround.avg || 0;

      // IRIS-H-118: Fix row inflation using COUNT(DISTINCT r.id)
      const scientistWorkload = db.prepare(`
        SELECT
          u.id,
          u.full_name as name,
          u.role,
          COUNT(DISTINCT r.id) as analyses,
          ROUND(AVG((julianday(r.approved_at) - julianday(cap.created_at)) * 24 * 60), 1) as avgTimeMin,
          COUNT(c.id) as overrides
        FROM users u
        LEFT JOIN results r ON u.id = r.approved_by AND r.institution_id = ? ${periodFilter}
        LEFT JOIN (SELECT test_request_id, MIN(capture_datetime) as created_at FROM captures GROUP BY test_request_id) cap ON cap.test_request_id = r.test_request_id
        LEFT JOIN corrections c ON r.id = c.result_id
        WHERE u.is_active = 1 AND u.role != 'viewer' AND u.institution_id = ?
        GROUP BY u.id
      `).all(session.institutionId, session.institutionId).map((row: any) => ({
        ...row,
        avgTime: row.avgTimeMin ? `${row.avgTimeMin}m` : '0m',
        correctionRate: row.analyses > 0 ? `${Math.round((row.overrides / (row.analyses * 5)) * 100)}%` : '0%'
      }));

      let chartData = db.prepare(`
        SELECT
          tr.test_name as name,
          COUNT(c.id) as corrections
        FROM corrections c
        JOIN results r ON c.result_id = r.id
        JOIN test_requests tr ON r.test_request_id = tr.id
        WHERE r.institution_id = ? ${periodFilter}
        GROUP BY tr.test_name
      `).all(session.institutionId);

      return {
        success: true,
        data: {
          totalAnalyses: completedResults.count,
          agreementRate: agreementRate,
          avgTurnaroundMin: avgTurnaroundMin,
          totalCorrections: totalCorrections.count,
          scientistWorkload,
          chartData
        }
      };
    } catch (error) {
      console.error('[Main Process] Failed to fetch QC metrics:', error);
      return { success: false, error: 'Database query failed' };
    }
  });

  ipcMain.handle('qc:exportSummary', async (_, payload, session) => {
    try {
      const { canceled, filePath } = await dialog.showSaveDialog({
        title: 'Export QC Summary',
        defaultPath: `QC_Summary_${new Date().toISOString().split('T')[0]}.csv`,
        filters: [{ name: 'CSV Files', extensions: ['csv'] }]
      });

      if (canceled || !filePath) return { success: false, canceled: true };

      const periodFilter = payload?.period === '7d' ? `AND r.approved_at >= datetime('now', '-7 days')` :
                           payload?.period === '30d' ? `AND r.approved_at >= datetime('now', '-30 days')` : '';

      const completed = db.prepare(`SELECT count(*) as count FROM results r WHERE r.status IN ('approved', 'released', 'amended') AND r.institution_id = ? ${periodFilter}`).get(session.institutionId) as { count: number };
      const corrections = db.prepare(`SELECT count(*) as count FROM corrections c JOIN results r ON c.result_id = r.id WHERE r.institution_id = ? ${periodFilter}`).get(session.institutionId) as { count: number };
      
      const estimatedTotalFields = completed.count * 5;
      const rate = estimatedTotalFields > 0 ? Math.max(0, Math.round(((estimatedTotalFields - corrections.count) / estimatedTotalFields) * 100)) : 100;

      const workload = db.prepare(`
        SELECT
          u.full_name,
          u.role,
          COUNT(DISTINCT r.id) as analyses,
          COUNT(c.id) as overrides
        FROM users u
        LEFT JOIN results r ON u.id = r.approved_by AND r.status IN ('approved', 'released', 'amended') AND r.institution_id = ? ${periodFilter}
        LEFT JOIN corrections c ON r.id = c.result_id
        WHERE u.is_active = 1 AND u.role != 'viewer' AND u.institution_id = ?
        GROUP BY u.id
      `).all(session.institutionId, session.institutionId);

      const csvContent = [
        'IRIS Clinical Workstation - QC Summary',
        `Export Date,${new Date().toLocaleDateString()}`,
        '',
        'Key Performance Indicators',
        `Total Analyses,${completed.count}`,
        `Total Corrections,${corrections.count}`,
        `AI Agreement Rate,${rate}%`,
        '',
        'Reviewer Workload Performance',
        'Scientist Name,Role,Total Analyses,Corrections Made'
      ];

      workload.forEach((w: any) => {
        // IRIS-H-125: Handle embedded newlines
        let escapedName = w.full_name ? w.full_name.replace(/"/g, '""').replace(/\r?\n/g, ' ') : '';
        let escapedRole = w.role ? w.role.replace(/"/g, '""').replace(/\r?\n/g, ' ') : '';
        csvContent.push(`"${escapedName}","${escapedRole}",${w.analyses || 0},${w.overrides || 0}`);
      });

      // IRIS-H-124: UTF-8 BOM
      fs.writeFileSync(filePath, '\uFEFF' + csvContent.join('\n'), 'utf8');

      // IRIS-H-123: Audit export
      db.prepare(`
        INSERT INTO audit_log (id, user_id, institution_id, action, entity_type, entity_id, metadata, created_at)
        VALUES (?, ?, ?, 'export_qc', 'system', 'qc_summary', ?, datetime('now'))
      `).run(crypto.randomUUID(), session.userId, session.institutionId, JSON.stringify({ filePath, period: payload?.period || 'all' }));

      // IRIS-H-126: Check shell.openPath
      const openErr = await shell.openPath(filePath);
      if (openErr) {
        return { success: false, error: `Export succeeded, but failed to open file: ${openErr}` };
      }

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });
}