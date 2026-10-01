import { ipcMain } from 'electron';
import { db } from '../db';
import { verifyLocalSession } from '../../../../../packages/db/src/auth/session';

export function registerProtectedIPC(channel: string, listener: any, isPublic: boolean = false) {
  ipcMain.handle(channel, async (event, ...args) => {
    const senderUrl = event.senderFrame?.url || event.event?.senderFrame?.url || event.sender.getURL();
    const isTrusted = senderUrl === 'http://localhost:5174/' || senderUrl === 'http://localhost:5174' || senderUrl.startsWith('file://');
    
    if (!isTrusted) return { success: false, error: 'Unauthorized: Untrusted origin.' };

    if (isPublic) return listener(event, ...args);

    const lastArg = args[args.length - 1];
    const token = lastArg?.__token;
    const session = verifyLocalSession(token);
    
    if (!session) return { success: false, error: 'Unauthorized: Valid session token required.' };

    const activeUser = db.prepare('SELECT institution_id, role, full_name, is_active FROM users WHERE id = ?').get(session.userId) as any;
    if (!activeUser || activeUser.is_active !== 1 || activeUser.institution_id !== session.institutionId || activeUser.role !== session.role) {
      return { success: false, error: 'Unauthorized: Account access has changed.' };
    }

    if (args.length === 1) { args = [undefined, session]; } else { args[args.length - 1] = session; }
    return listener(event, ...args);
  });
}
