import { createHmac, randomBytes, timingSafeEqual, hkdfSync } from 'crypto';

let LOCAL_SESSION_SECRET: Buffer | string = process.env.IRIS_SESSION_SECRET || randomBytes(32).toString('hex');
let SESSION_SIGNING_KEY = process.env.IRIS_SESSION_SECRET 
  ? Buffer.from(hkdfSync('sha256', Buffer.from(process.env.IRIS_SESSION_SECRET, 'hex'), Buffer.alloc(0), Buffer.from('session-signing-key'), 32))
  : randomBytes(32);

// IRIS-M-003: Session secret operates on raw bytes
export function setLocalSessionSecret(secret: Buffer) {
  LOCAL_SESSION_SECRET = secret;
  // IRIS-H-001: Derive a separate signing key to prevent key reuse with PII encryption
  SESSION_SIGNING_KEY = Buffer.from(hkdfSync('sha256', secret, Buffer.alloc(0), Buffer.from('session-signing-key'), 32));
}
const revokedTokens = new Set<string>();

// IRIS-M-002: Session tokens carry no PII
export interface SessionPayload {
  userId: string;
  institutionId: string;
  role: 'admin' | 'pathologist' | 'scientist_l2' | 'scientist_l1' | 'operator' | 'viewer';
  issuedAt: number;
  expiresAt: number;
  token?: string;
}

export interface SessionTokenResult {
  token: string;
  expiresAt: number;
}

const EIGHT_HOURS_MS = 8 * 60 * 60 * 1000;
export const TEN_MINUTES_MS = 10 * 60 * 1000;

export function createLocalSession(
  user: Omit<SessionPayload, 'issuedAt' | 'expiresAt' | 'token'>
): SessionTokenResult {
  const now = Date.now();
  const expiresAt = now + EIGHT_HOURS_MS;
  const payload: SessionPayload = { ...user, issuedAt: now, expiresAt };
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = createHmac('sha256', SESSION_SIGNING_KEY)
    .update(encodedPayload)
    .digest('base64url');
  const token = `${encodedPayload}.${signature}`;
  return { token, expiresAt };
}

export function revokeLocalSession(token: string): void {
  if (token) revokedTokens.add(token);
}

export function verifyLocalSession(token: string): SessionPayload | null {
  try {
    if (!token || revokedTokens.has(token)) return null;
    const [encodedPayload, signature] = token.split('.');
    if (!encodedPayload || !signature) return null;
    const expectedSignature = createHmac('sha256', SESSION_SIGNING_KEY)
      .update(encodedPayload)
      .digest('base64url');
    // IRIS-H-002: Constant-time comparison
    const sigBuf = Buffer.from(signature, 'base64url');
    const expBuf = Buffer.from(expectedSignature, 'base64url');
    if (sigBuf.length !== expBuf.length || !timingSafeEqual(sigBuf, expBuf)) return null;
    const payload: SessionPayload = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString('utf8'));
    if (Date.now() > payload.expiresAt) return null;
    return { ...payload, token };
  } catch {
    return null;
  }
}
