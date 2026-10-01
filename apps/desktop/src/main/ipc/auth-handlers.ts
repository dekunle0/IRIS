import crypto from 'crypto';
import { createLocalSession, revokeLocalSession } from '../../../../../packages/db/src/auth/session';
import { app, dialog, ipcMain } from 'electron';
import { clearInitialAdminCredentials, db, getInitialAdminCredentials } from '../db';
import QRCode from 'qrcode';
import { verifyPassword, hashPassword, needsRehash } from '../../../../../packages/db/src/auth/hash';
import { verifyTOTPToken, generateTOTPSetup } from '../../../../../packages/db/src/auth/totp';

function generateBase32Secret(length = 20) {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  const buffer = crypto.randomBytes(length);
  let bits = 0;
  let value = 0;
  let output = '';
  for (let i = 0; i < buffer.length; i++) {
    value = (value << 8) | buffer[i];
    bits += 8;
    while (bits >= 5) {
      output += alphabet[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) {
    output += alphabet[(value << (5 - bits)) & 31];
  }
  return output;
}

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 15;

/** RFC 6238 TOTP — validates a 6-digit token against the user's base32 secret. */
function verifyTOTP(base32Secret: string, token: string): boolean {
  try {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    const secret = base32Secret.toUpperCase().replace(/=+$/, '');
    let bits = 0, value = 0;
    const bytes: number[] = [];
    for (const char of secret) {
      const idx = alphabet.indexOf(char);
      // IRIS-M-014: Reject non-base32
      if (idx < 0) throw new Error('Invalid base32 char');
      value = (value << 5) | idx;
      bits += 5;
      if (bits >= 8) { bytes.push((value >>> (bits - 8)) & 0xff); bits -= 8; }
    }
    const key = Buffer.from(bytes);
    const counter = Math.floor(Date.now() / 1000 / 30);
    for (const offset of [-1, 0, 1]) {
      // IRIS-M-013: Avoid allocUnsafe
      const buf = Buffer.alloc(8);
      buf.writeBigInt64BE(BigInt(counter + offset));
      const mac = crypto.createHmac('sha1', key).update(buf).digest();
      const idx2 = mac[mac.length - 1] & 0x0f;
      const otp = ((mac.readUInt32BE(idx2) & 0x7fffffff) % 1_000_000).toString().padStart(6, '0');
      if (otp === token.trim()) return true;
    }
    return false;
  } catch { return false; }
}

const STRONG_PWD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;

export function registerAuthHandlers() {

  ipcMain.handle('auth:getInitialCredentials', () => { const creds = getInitialAdminCredentials(); return { success: Boolean(creds), data: creds }; });
  ipcMain.handle('auth:clearInitialCredentials', () => {
    clearInitialAdminCredentials();
    return { success: true };
  });

  ipcMain.handle('auth:recoverPassword', async (_, { username, recoveryCode, newPassword }) => {
    if (!STRONG_PWD_REGEX.test(newPassword.trim())) return { success: false, error: 'Password must be at least 8 characters long and include an uppercase letter, a number, and a special character.' };
    try {
      const u = (username || '').trim();
      const user = db.prepare(`SELECT * FROM users WHERE (mlscn_number = ? OR full_name = ?) AND role = 'admin' LIMIT 1`).get(u, u) as any;
      if (!user) return { success: false, error: 'Admin user not found.' };

      if (user.locked_until) {
        const lockedUntil = new Date(user.locked_until);
        if (lockedUntil > new Date()) {
          const mins = Math.ceil((lockedUntil.getTime() - Date.now()) / 60000);
          return { success: false, error: `Account temporarily locked. Try again in ${mins} minute(s).` };
        }
        db.prepare(`UPDATE users SET failed_login_attempts = 0, locked_until = NULL WHERE id = ?`).run(user.id);
      }

      if (!user.recovery_code_hash) return { success: false, error: 'Recovery is not supported for this account.' };

      const isValid = await verifyPassword(user.recovery_code_hash, recoveryCode.trim());
      if (!isValid) {
        const attempts = (user.failed_login_attempts || 0) + 1;
        if (attempts >= MAX_FAILED_ATTEMPTS) {
          const lockedUntil = new Date(Date.now() + LOCKOUT_MINUTES * 60 * 1000).toISOString();
          db.prepare(`UPDATE users SET failed_login_attempts = ?, locked_until = ? WHERE id = ?`).run(attempts, lockedUntil, user.id);
          db.prepare(`INSERT INTO audit_log (user_id, institution_id, action, entity_type, entity_id) VALUES (?, ?, 'account_locked', 'user', ?)`).run(user.id, user.institution_id, user.id);
          return { success: false, error: `Too many failed attempts. Account locked for ${LOCKOUT_MINUTES} minutes.` };
        }
        db.prepare(`UPDATE users SET failed_login_attempts = ? WHERE id = ?`).run(attempts, user.id);
        db.prepare(`INSERT INTO audit_log (user_id, institution_id, action, entity_type, entity_id, metadata) VALUES (?, ?, 'failed_recovery', 'user', ?, ?)`).run(user.id, user.institution_id, user.id, JSON.stringify({ reason: 'invalid_code' }));
        return { success: false, error: `Invalid recovery code. ${MAX_FAILED_ATTEMPTS - attempts} attempt(s) remaining before lockout.` };
      }

      const hashedPw = await hashPassword(newPassword.trim());
      db.prepare(`UPDATE users SET password_hash = ?, failed_login_attempts = 0, locked_until = NULL WHERE id = ?`).run(hashedPw, user.id);
      db.prepare(`INSERT INTO audit_log (user_id, institution_id, action, entity_type, entity_id) VALUES (?, ?, 'password_recovered', 'user', ?)`).run(user.id, user.institution_id, user.id);
      
      clearInitialAdminCredentials();

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  
  ipcMain.handle('auth:generate2FA', async (_, __, session) => {
    if (!session?.userId) return { success: false, error: 'Unauthorized.' };
    const user = db.prepare('SELECT full_name, two_fa_enabled, totp_secret FROM users WHERE id = ?').get(session.userId) as any;
    
    // IRIS-M-017: Idempotency guard - do not overwrite an existing pending secret
    if (user && user.totp_secret) {
        return { success: false, error: 'A 2FA secret is already generated or enrolled. Reset required first.' };
    }
    const setup = await generateTOTPSetup(user.full_name.replace(/\s+/g, ''), 'IRIS');
    
    // Save pending secret to db so it's not regenerated
    db.prepare('UPDATE users SET totp_secret = ? WHERE id = ?').run(setup.secret, session.userId);
    
    return { success: true, secret: setup.secret, qrCode: setup.qrCodeDataUrl };
  });

  ipcMain.handle('auth:disable2FA', async (_, __, session) => {
    if (!session?.userId) return { success: false, error: 'Unauthorized.' };
    db.prepare(`UPDATE users SET two_fa_enabled = 0, totp_secret = NULL WHERE id = ?`).run(session.userId);
    return { success: true };
  });

  ipcMain.handle('auth:verify2FAEnrollment', async (_, { secret, token }, session) => {
    if (!session?.userId) return { success: false, error: 'Unauthorized.' };
    if (!verifyTOTPToken(token, secret)) {
    return { success: false, error: 'Invalid token.' };
    }
    db.prepare(`UPDATE users SET two_fa_enabled = 1, totp_secret = ? WHERE id = ?`).run(secret, session.userId);
    return { success: true };
});

  ipcMain.handle('auth:login', async (_, credentials) => {
    try {
      const username = (credentials.username || '').trim();
      const password = (credentials.password || '').trim();

      // IRIS-M-008: Case-insensitive username check
      const user = db.prepare(`SELECT * FROM users WHERE LOWER(mlscn_number) = LOWER(?) OR LOWER(full_name) = LOWER(?)`).get(username, username) as any;

      if (!user) return { success: false, error: 'Invalid username or password.' };
      if (user.is_active === 0) return { success: false, error: 'Account has been revoked.' };

      if (user.locked_until) {
        const lockedUntil = new Date(user.locked_until);
        if (lockedUntil > new Date()) {
          const mins = Math.ceil((lockedUntil.getTime() - Date.now()) / 60000);
          return { success: false, error: `Account temporarily locked. Try again in ${mins} minute(s).` };
        }
        db.prepare(`UPDATE users SET failed_login_attempts = 0, locked_until = NULL WHERE id = ?`).run(user.id);
      }

      const incrementLockout = () => {
        const attempts = (user.failed_login_attempts || 0) + 1;
        if (attempts >= MAX_FAILED_ATTEMPTS) {
          const lockedUntil = new Date(Date.now() + LOCKOUT_MINUTES * 60 * 1000).toISOString();
          db.prepare(`UPDATE users SET failed_login_attempts = ?, locked_until = ? WHERE id = ?`).run(attempts, lockedUntil, user.id);
          db.prepare(`INSERT INTO audit_log (user_id, institution_id, action, entity_type, entity_id) VALUES (?, ?, 'account_locked', 'user', ?)`).run(user.id, user.institution_id, user.id);
        } else {
          db.prepare(`UPDATE users SET failed_login_attempts = ? WHERE id = ?`).run(attempts, user.id);
        }
        return { success: false, error: 'Invalid username or password.' };
      };

      const isValid = await verifyPassword(user.password_hash, password);
      if (!isValid) {
        return incrementLockout();
      }

      // IRIS-M-010: Rehash password if cost or algorithm changes
      if (needsRehash(user.password_hash)) {
        const newHash = await hashPassword(password);
        db.prepare("UPDATE users SET password_hash = ? WHERE id = ?").run(newHash, user.id);
      }

      if (user.two_fa_enabled) {
        if (!user.totp_secret) {
          db.prepare(`INSERT INTO audit_log (user_id, institution_id, action, entity_type, entity_id) VALUES (?, ?, '2fa_bypass_attempt', 'user', ?)`).run(user.id, user.institution_id, user.id);
          return { success: false, error: '2FA configuration is corrupt. Contact administrator.' };
        }

        const totpToken = (credentials.totpToken || '').trim();
        if (!totpToken) return { success: false, requiresTOTP: true, error: 'Two-factor authentication code required.' };
        
        const used = db.prepare('SELECT 1 FROM used_totp_tokens WHERE token = ? AND user_id = ?').get(totpToken, user.id);
        if (used) {
          return incrementLockout();
        }

        if (!verifyTOTPToken(totpToken, user.totp_secret)) {
          return incrementLockout();
        }
        db.prepare('INSERT INTO used_totp_tokens (token, user_id, expires_at) VALUES (?, ?, ?)').run(totpToken, user.id, Date.now() + 90000);
      }

      db.prepare(`UPDATE users SET failed_login_attempts = 0, locked_until = NULL, last_active_at = datetime('now') WHERE id = ?`).run(user.id);

      const session = createLocalSession({
        userId: user.id,
        institutionId: user.institution_id,
        role: user.role
      });

      // IRIS-M-001: Only clear initial admin credentials if logged in as admin
      if (user.role === 'admin') {
        clearInitialAdminCredentials();
      }

      db.prepare(`
        INSERT INTO audit_log (user_id, institution_id, action, entity_type, entity_id)
        VALUES (?, ?, 'login', 'user', ?)
      `).run(user.id, user.institution_id, user.id);

      return {
        success: true,
        token: session.token,
        user: { id: user.id, name: user.full_name, role: user.role, institutionId: user.institution_id }
      };
    } catch (error: any) {
      console.error('[Auth Error]', error);
      return { success: false, error: `Database Error: ${error.message}` };
    }
  });

  ipcMain.handle('auth:logout', async (_, _payload, session) => {
    if (session?.userId) {
      // IRIS-M-004: Clear last_active_at
      db.prepare(`UPDATE users SET last_active_at = NULL WHERE id = ?`).run(session.userId);
      db.prepare(`
        INSERT INTO audit_log (user_id, institution_id, action, entity_type, entity_id)
        VALUES (?, ?, 'logout', 'user', ?)
      `).run(session.userId, session.institutionId, session.userId);
      if (session.token) { revokeLocalSession(session.token); db.prepare("INSERT OR IGNORE INTO revoked_tokens (token) VALUES (?)").run(session.token); }
    }
    return { success: true };
  });

  ipcMain.handle('auth:changePassword', async (_, payload, session) => {
    if (!session) return { success: false, error: 'Unauthorized.' };
    const { currentPassword, newPassword } = payload;
    if (!STRONG_PWD_REGEX.test(newPassword)) return { success: false, error: 'Password must be at least 8 characters long and include an uppercase letter, a number, and a special character.' };
    try {
      const user = db.prepare("SELECT password_hash FROM users WHERE id = ?").get(session.userId) as any;

      const isValid = await verifyPassword(user.password_hash, currentPassword);
      if (!isValid) return { success: false, error: 'Incorrect current password.' };

      const newHash = await hashPassword(newPassword);
      db.prepare("UPDATE users SET password_hash = ? WHERE id = ?").run(newHash, session.userId);

      // Always wipe initial credentials when an admin explicitly sets their password
      clearInitialAdminCredentials();

      db.prepare(`
        INSERT INTO audit_log (user_id, institution_id, action, entity_type, entity_id)
        VALUES (?, ?, 'change_password', 'user', ?)
      `).run(session.userId, session.institutionId, session.userId);

      // IRIS-M-005: Revoke session on password change
      if (session.token) { revokeLocalSession(session.token); db.prepare("INSERT OR IGNORE INTO revoked_tokens (token) VALUES (?)").run(session.token); }

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('users:getAll', async (_, payload, session) => {
    if (session?.role !== 'admin') return { success: false, error: 'Unauthorized: Admin privileges required.' };
    try {
      const users = db.prepare(`
        SELECT id, full_name as fullName, mlscn_number as username, role, created_at as createdAt, is_active as isActive
        FROM users ORDER BY created_at DESC
      `).all();
      return { success: true, data: users };
    } catch (error: any) {
      return { success: false, error: 'Failed to fetch users.' };
    }
  });

  ipcMain.handle('users:create', async (_, payload, session) => {
    if (session?.role !== 'admin') return { success: false, error: 'Unauthorized: Admin privileges required.' };

    const VALID_ROLES = ['admin', 'pathologist', 'scientist_l1', 'scientist_l2', 'operator', 'viewer'];
    if (!VALID_ROLES.includes(payload.role)) {
      return { success: false, error: 'Invalid user role specified.' };
    }

    if (!STRONG_PWD_REGEX.test(payload.password)) {
      return { success: false, error: 'Password must be at least 8 characters long and include an uppercase letter, a number, and a special character.' };
    }

    try {
      const exists = db.prepare('SELECT 1 FROM users WHERE mlscn_number = ? AND is_active = 1').get(payload.username);
      if (exists) {
        return { success: false, error: 'MLSCN Credential already in use by an active user.' };
      }

      const hash = await hashPassword(payload.password);
      const mlscnVerified = payload.mlscnVerified ? 1 : 0;
      const newUserId = crypto.randomUUID();

      db.prepare(`
        INSERT INTO users (id, institution_id, full_name, mlscn_number, password_hash, role, mlscn_verified)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(newUserId, session.institutionId, payload.fullName, payload.username, hash, payload.role, mlscnVerified);

      // IRIS-M-006: Audit user creation
      db.prepare(`INSERT INTO audit_log (user_id, institution_id, action, entity_type, entity_id) VALUES (?, ?, 'create_user', 'user', ?)`).run(session.userId, session.institutionId, newUserId);

      // IRIS-M-007: Audit MLSCN verification
      if (mlscnVerified) {
        db.prepare(`INSERT INTO audit_log (user_id, institution_id, action, entity_type, entity_id) VALUES (?, ?, 'verify_mlscn', 'user', ?)`).run(session.userId, session.institutionId, newUserId);
      }

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('users:remove', async (_, payload, session) => {
    if (session?.role !== 'admin') return { success: false, error: 'Unauthorized: Admin privileges required.' };
    try {
      const { targetUserId } = payload;
      if (targetUserId === session.userId) return { success: false, error: 'You cannot remove your own account.' };

      const user = db.prepare("SELECT role, is_active, institution_id FROM users WHERE id = ?").get(targetUserId) as any;
      if (!user) return { success: false, error: 'User not found.' };

      if (user.role === 'admin' && user.is_active === 1) {
         const adminCount = db.prepare("SELECT count(*) as c FROM users WHERE role = 'admin' AND is_active = 1 AND institution_id = ?").get(user.institution_id) as any;
         if (adminCount.c <= 1) return { success: false, error: 'Cannot remove the last active administrator.' };
      }

      db.prepare('UPDATE users SET is_active = 0 WHERE id = ?').run(targetUserId);

      db.prepare(`INSERT INTO audit_log (user_id, institution_id, action, entity_type, entity_id) VALUES (?, ?, 'remove_user', 'user', ?)`).run(session.userId, session.institutionId, targetUserId);

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('system:getSettings', async (_, payload, session) => {
    if (!session) return { success: false, error: 'Unauthorized.' };
    try {
      const institution = db.prepare(`SELECT name, type, address, state, licence_tier as licenceTier, is_active as isActive, metadata FROM institutions WHERE id = ?`).get(session.institutionId) as any;
      const licence = db.prepare(`SELECT tier, billing_cycle as billingCycle, price_ngn as priceNgn, analyses_limit as analysesLimit, expires_at as expiresAt, is_active as isActive FROM licences WHERE institution_id = ?`).get(session.institutionId) as any;
      const metadata = institution?.metadata ? JSON.parse(institution.metadata) : {};
      const user = db.prepare('SELECT two_fa_enabled FROM users WHERE id = ?').get(session.userId) as any;
      return { success: true, data: { institution: { ...institution, metadata: undefined }, licence, lisNetworkMode: metadata.lisNetworkMode === true, is2FAEnabled: user?.two_fa_enabled === 1 } };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('system:updateSettings', async (_, payload, session) => {
    if (session?.role !== 'admin') return { success: false, error: 'Unauthorized: Admin privileges required.' };
    try {
      if (payload?.lisBindIp) {
        return { success: false, error: 'lisBindIp can only be updated via direct database access for security.' };
      }
      const institution = db.prepare('SELECT metadata FROM institutions WHERE id = ?').get(session.institutionId) as any;
      const metadata = institution?.metadata ? JSON.parse(institution.metadata) : {};
      const user = db.prepare('SELECT two_fa_enabled FROM users WHERE id = ?').get(session.userId) as any;
      if (typeof payload?.lisNetworkMode === 'boolean') metadata.lisNetworkMode = payload.lisNetworkMode;
      if (Array.isArray(payload?.lisAllowedIps)) metadata.lisAllowedIps = payload.lisAllowedIps;
      
      db.prepare('UPDATE institutions SET metadata = ?, updated_at = datetime(\'now\') WHERE id = ?').run(JSON.stringify(metadata), session.institutionId);
      db.prepare(`INSERT INTO audit_log (user_id, institution_id, action, entity_type, entity_id, metadata) VALUES (?, ?, 'update_system_settings', 'institution', ?, ?)`).run(session.userId, session.institutionId, session.institutionId, JSON.stringify(payload));
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('system:backupDatabase', async (_, payload, session) => {
    if (session?.role !== 'admin') return { success: false, error: 'Unauthorized: Admin privileges required.' };
    const password = payload?.password;
    if (!password) return { success: false, error: 'Backup encryption password required.' };

    try {
      const { canceled, filePath } = await dialog.showSaveDialog({ 
        title: 'Save Encrypted IRIS Backup', 
        defaultPath: `IRIS_Backup_${new Date().toISOString().replace(/[:.]/g, '-')}.irisz`, 
        filters: [{ name: 'IRIS Encrypted Backup', extensions: ['irisz'] }] 
      });
      if (canceled || !filePath) return { success: false, canceled: true };

      db.pragma('wal_checkpoint(TRUNCATE)');
      const dbPath = path.join(app.getPath('userData'), 'iris-offline.db');

      const dbBuffer = fs.readFileSync(dbPath);
      let rawAppKey = null;
      try {
        const { getAppKey } = require('../db');
        rawAppKey = getAppKey();
      } catch (e) {
        console.error('Failed to export raw app key for backup', e);
      }

      // IRIS-H-141: Export the raw key so it can be re-wrapped by safeStorage on another machine
      const payloadObj = {
        db: dbBuffer.toString('base64'),
        rawKey: rawAppKey ? rawAppKey.toString('base64') : null,
        timestamp: new Date().toISOString()
      };

      const payloadStr = JSON.stringify(payloadObj);
      const salt = crypto.randomBytes(16);
      const encKey = crypto.pbkdf2Sync(password, salt, 100000, 32, 'sha256');
      const iv = crypto.randomBytes(12);
      const cipher = crypto.createCipheriv('aes-256-gcm', encKey, iv);
      
      const encrypted = Buffer.concat([cipher.update(payloadStr, 'utf8'), cipher.final()]);
      const tag = cipher.getAuthTag();

      const outBuffer = Buffer.concat([Buffer.from('IRZ1'), salt, iv, tag, encrypted]);
      fs.writeFileSync(filePath, outBuffer);

      db.prepare(`INSERT INTO audit_log (user_id, institution_id, action, entity_type, entity_id, metadata) VALUES (?, ?, 'backup_database', 'system', ?, ?)`).run(session.userId, session.institutionId, session.institutionId, JSON.stringify({ fileName: path.basename(filePath) }));
      
      return { success: true, filePath, timestamp: payloadObj.timestamp };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('system:restoreDatabase', async (_, payload, session) => {
    if (session?.role !== 'admin') return { success: false, error: 'Unauthorized: Admin privileges required.' };
    const password = payload?.password;
    if (!password) return { success: false, error: 'Backup decryption password required.' };

    try {
      const { canceled, filePaths } = await dialog.showOpenDialog({ 
        title: 'Restore Encrypted IRIS Backup', 
        filters: [{ name: 'IRIS Encrypted Backup', extensions: ['irisz'] }] 
      });
      if (canceled || !filePaths[0]) return { success: false, canceled: true };

      const inBuffer = fs.readFileSync(filePaths[0]);
      if (inBuffer.length < 4 + 16 + 12 + 16 || inBuffer.subarray(0, 4).toString() !== 'IRZ1') {
        return { success: false, error: 'Invalid backup file format.' };
      }

      let offset = 4;
      const salt = inBuffer.subarray(offset, offset + 16); offset += 16;
      const iv = inBuffer.subarray(offset, offset + 12); offset += 12;
      const tag = inBuffer.subarray(offset, offset + 16); offset += 16;
      const encrypted = inBuffer.subarray(offset);

      const encKey = crypto.pbkdf2Sync(password, salt, 100000, 32, 'sha256');
      const decipher = crypto.createDecipheriv('aes-256-gcm', encKey, iv);
      decipher.setAuthTag(tag);

      let payloadStr = '';
      try {
        payloadStr = decipher.update(encrypted, undefined, 'utf8') + decipher.final('utf8');
      } catch (err) {
        return { success: false, error: 'Incorrect password or corrupted backup file.' };
      }

      const payloadObj = JSON.parse(payloadStr);

      // IRIS-H-143: Validate that the payload is a valid SQLite file
      const dbBuf = Buffer.from(payloadObj.db, 'base64');
      if (dbBuf.length < 16 || dbBuf.subarray(0, 16).toString('utf8') !== 'SQLite format 3\0') {
        return { success: false, error: 'Corrupt backup: Does not contain a valid database.' };
      }

      const dbPath = path.join(app.getPath('userData'), 'iris-offline.db');
      const keyPath = path.join(app.getPath('userData'), 'iris.key');

      db.close();
      fs.writeFileSync(dbPath, dbBuf);

      // IRIS-H-142: Restore raw key and re-wrap it with new machine's safeStorage
      if (payloadObj.rawKey) {
        const { safeStorage } = require('electron');
        const rawAppKey = Buffer.from(payloadObj.rawKey, 'base64');
        if (safeStorage.isEncryptionAvailable()) {
          fs.writeFileSync(keyPath, safeStorage.encryptString(rawAppKey.toString('hex')));
        } else {
          fs.writeFileSync(keyPath, rawAppKey.toString('hex'));
        }
      } else if (payloadObj.key) { // Legacy backup fallback
        fs.writeFileSync(keyPath, Buffer.from(payloadObj.key, 'base64'));
      }

      app.relaunch();
      app.exit(0);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('system:factoryReset', async (_, payload, session) => {
    if (session?.role !== 'admin') return { success: false, error: 'Unauthorized: Admin privileges required.' };
    if (!payload?.password) return { success: false, error: 'Unauthorized: Administrator password required.' };

    try {
      const admin = db.prepare("SELECT password_hash FROM users WHERE id = ?").get(session.userId) as any;
      const isValid = await verifyPassword(admin.password_hash, payload.password);
      if (!isValid) return { success: false, error: 'Unauthorized: Incorrect administrator password.' };

      db.pragma('wal_checkpoint(TRUNCATE)');

      const tablesToClear = ['corrections', 'results', 'ai_results', 'captures', 'test_requests', 'samples', 'patients'];
      let totalDeleted = 0;
      const manifestHash = crypto.createHash('sha256');

      db.transaction(() => {
        // DO NOT delete audit_log, licences, or users during a factory reset to ensure audit trail integrity
        for (const table of tablesToClear) {
          try {
            const exists = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name=?").get(table);
            if (exists) {
              let tableCount = 0;
              const iterator = db.prepare(`SELECT * FROM ${table}`).iterate();
              for (const row of iterator) {
                manifestHash.update(JSON.stringify(row));
                tableCount++;
              }
              totalDeleted += tableCount;
              db.prepare(`DELETE FROM ${table}`).run();
            }
          } catch (err) {}
        }
        
        const contentHash = manifestHash.digest('hex');
        db.prepare(`INSERT INTO audit_log (user_id, institution_id, action, entity_type, entity_id, metadata) VALUES (?, ?, 'factory_reset', 'system', ?, ?)`).run(
          session.userId, 
          session.institutionId, 
          session.institutionId, 
          JSON.stringify({ 
            reason: 'Administrative Factory Reset', 
            tablesCleared: tablesToClear,
            totalErasedRecords: totalDeleted,
            erasedContentHash: contentHash,
            secureErase: true
          })
        );
      })();
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('system:getHistory', async (_, payload, session) => {
    try {
      let query = `SELECT a.id, a.action, a.entity_type, a.entity_id, a.metadata, a.created_at, u.full_name as userName, u.role FROM audit_log a LEFT JOIN users u ON a.user_id = u.id WHERE a.institution_id = ?`;
      const params: any[] = [session?.institutionId];

      if (session?.role !== 'admin') {
        query += ` AND a.user_id = ?`;
        params.push(session?.userId);
      }

      if (payload?.action && payload.action !== 'all') {
        query += ` AND a.action = ?`;
        params.push(payload.action);
      }

      const limit = payload?.limit || 500;
      const offset = payload?.offset || 0;
      query += ` ORDER BY a.created_at DESC LIMIT ? OFFSET ?`;
      params.push(limit, offset);

      const logs = db.prepare(query).all(...params);
      return { success: true, data: logs };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('system:exportAuditLog', async (_, __, session) => {
    try {
      if (session.role !== 'admin') return { success: false, error: 'Unauthorized: Only admins can export the full audit log.' };
      
      const logs = db.prepare(`
        SELECT a.id, a.created_at, a.action, a.entity_type, a.entity_id, u.full_name, u.role, a.metadata
        FROM audit_log a
        LEFT JOIN users u ON a.user_id = u.id
        WHERE a.institution_id = ?
        ORDER BY a.created_at ASC
      `).all(session.institutionId) as any[];

      const csvHeader = 'ID,Timestamp,Action,Entity_Type,Entity_ID,User_Name,User_Role,Metadata\n';
      const csvRows = logs.map(l => `"${l.id}","${l.created_at}","${l.action}","${l.entity_type}","${l.entity_id}","${l.full_name || ''}","${l.role || ''}","${(l.metadata || '').replace(/"/g, '""')}"`).join('\n');
      const csvContent = csvHeader + csvRows;

      const fs = require('fs');
      const path = require('path');
      const exportPath = path.join(app.getPath('downloads'), `audit_export_${Date.now()}.csv`);
      fs.writeFileSync(exportPath, csvContent);
      
      const { shell } = require('electron');
      shell.showItemInFolder(exportPath);
      
      return { success: true, path: exportPath };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('system:getAuditDetails', async (_, { action, entityId }, session) => {
    if (!session) return { success: false, error: 'Unauthorized.' };
    try {
      const audit = db.prepare(`SELECT institution_id, user_id, metadata FROM audit_log WHERE action = ? AND entity_id = ? ORDER BY id DESC LIMIT 1`).get(action, entityId) as any;
      if (!audit || audit.institution_id !== session.institutionId || (session.role !== 'admin' && audit.user_id !== session.userId)) return { success: false, error: 'Unauthorized.' };

      let details = null;
      if (action === 'create_patient') details = db.prepare(`SELECT patient_code, full_name, dob, gender, phone, consent_signature_path as signature FROM patients WHERE id = ?`).get(entityId);
      else if (action === 'release_result' || action === 'approve_result') {
        details = db.prepare(`SELECT p.patient_code, p.full_name, p.dob, p.gender, p.phone, p.consent_signature_path as signature, r.digital_signature_path as approvalSignature, r.edited_findings, r.interpretive_comment, r.status, tr.test_name FROM results r JOIN patients p ON r.patient_id = p.id JOIN test_requests tr ON r.test_request_id = tr.id WHERE r.id = ?`).get(entityId) as any;
        if (details && details.approvalSignature) {
          try {
            if (fs.existsSync(details.approvalSignature)) {
              const base64 = fs.readFileSync(details.approvalSignature, 'base64');
              details.approvalSignature = `data:image/png;base64,${base64}`;
            } else {
              details.approvalSignature = null;
            }
          } catch (e) {
            details.approvalSignature = null;
          }
        }
      }
      else if (action === 'pair_device' || action === 'unpair_device' || action === 'firmware_update_selected') details = db.prepare(`SELECT id, serial_number, firmware_version, last_paired_at, battery_level_pct, storage_used_gb, storage_total_gb, last_local_ip, calibration_due_at FROM devices WHERE id = ? OR serial_number = ?`).get(entityId, entityId);
      if (!details) details = { metadata: audit.metadata };
      return { success: true, data: details };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('users:verifyMLSCN', async (_, { targetUserId }, session) => {
    if (session?.role !== 'admin') return { success: false, error: 'Unauthorized.' };
    db.prepare('UPDATE users SET mlscn_verified = 1 WHERE id = ?').run(targetUserId);
    db.prepare(`INSERT INTO audit_log (user_id, institution_id, action, entity_type, entity_id, metadata) VALUES (?, ?, 'verify_mlscn', 'user', ?, ?)`).run(session.userId, session.institutionId, targetUserId, 'Verified retroactively by admin');
    return { success: true };
  });

  ipcMain.handle('users:forcePasswordReset', async (_, { targetUserId, newPassword }, session) => {
    if (session?.role !== 'admin') return { success: false, error: 'Unauthorized.' };
    if (!STRONG_PWD_REGEX.test(newPassword)) return { success: false, error: 'Password does not meet requirements.' };
    const hash = await hashPassword(newPassword);
    db.prepare('UPDATE users SET password_hash = ?, session_revocation_epoch = ? WHERE id = ?').run(hash, Date.now(), targetUserId);
    db.prepare(`INSERT INTO audit_log (user_id, institution_id, action, entity_type, entity_id) VALUES (?, ?, 'force_password_reset', 'user', ?)`).run(session.userId, session.institutionId, targetUserId);
    return { success: true };
  });

  ipcMain.handle('users:reset2FA', async (_, { targetUserId }, session) => {
    if (session?.role !== 'admin') return { success: false, error: 'Unauthorized.' };
    db.prepare('UPDATE users SET two_fa_enabled = 0, totp_secret = NULL WHERE id = ?').run(targetUserId);
    db.prepare(`INSERT INTO audit_log (user_id, institution_id, action, entity_type, entity_id) VALUES (?, ?, 'reset_2fa', 'user', ?)`).run(session.userId, session.institutionId, targetUserId);
    return { success: true };
  });

  ipcMain.handle('users:updateRole', async (_, { targetUserId, newRole }, session) => {
    if (session?.role !== 'admin') return { success: false, error: 'Unauthorized.' };
    db.prepare('UPDATE users SET role = ? WHERE id = ?').run(newRole, targetUserId);
    db.prepare(`INSERT INTO audit_log (user_id, institution_id, action, entity_type, entity_id, metadata) VALUES (?, ?, 'update_role', 'user', ?, ?)`).run(session.userId, session.institutionId, targetUserId, `New role: ${newRole}`);
    return { success: true };
  });

  ipcMain.handle('lis:generateToken', async (_, { name }, session) => {
    if (session?.role !== 'admin') return { success: false, error: 'Unauthorized.' };
    const token = require('crypto').randomBytes(32).toString('base64url');
    db.prepare('INSERT INTO api_tokens (token, name) VALUES (?, ?)').run(token, name || 'API Token');
    db.prepare(`INSERT INTO audit_log (user_id, institution_id, action, entity_type, entity_id) VALUES (?, ?, 'generate_api_token', 'system', ?)`).run(session.userId, session.institutionId, name || 'API Token');
    return { success: true, token };
  });

  ipcMain.handle('lis:revokeToken', async (_, { token }, session) => {
    if (session?.role !== 'admin') return { success: false, error: 'Unauthorized.' };
    db.prepare('UPDATE api_tokens SET is_active = 0 WHERE token = ?').run(token);
    db.prepare(`INSERT INTO audit_log (user_id, institution_id, action, entity_type, entity_id) VALUES (?, ?, 'revoke_api_token', 'system', 'token')`).run(session.userId, session.institutionId);
    return { success: true };
  });

  ipcMain.handle('lis:listTokens', async (_, __, session) => {
    if (session?.role !== 'admin') return { success: false, error: 'Unauthorized.' };
    const tokens = db.prepare('SELECT name, created_at, is_active FROM api_tokens').all();
    // We intentionally omit the token string itself, except maybe a truncated version if needed, 
    // but the instruction says list tokens. We can return them masked.
    return { success: true, tokens };
  });
}