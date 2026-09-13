// packages/db/src/auth/session.ts
import { createHmac, randomBytes } from 'crypto';

// Secret key generated locally in memory per workstation session (never hardcoded, no cloud secret)
const LOCAL_SESSION_SECRET = process.env.IRIS_SESSION_SECRET || randomBytes(32).toString('hex');

export interface SessionPayload {
  userId: string;
  institutionId: string;
  role: 'admin' | 'scientist_l2' | 'scientist_l1' | 'operator' | 'viewer';
  fullName: string;
  mlscnNumber?: string;
  issuedAt: number;
  expiresAt: number;
}

export interface SessionTokenResult {
  token: string;
  expiresAt: number;
}

const EIGHT_HOURS_MS = 8 * 60 * 60 * 1000;
export const TEN_MINUTES_MS = 10 * 60 * 1000;

/**
 * Creates a signed local session token with an 8-hour expiration.
 */
export function createLocalSession(
  user: Omit<SessionPayload, 'issuedAt' | 'expiresAt'>
): SessionTokenResult {
  const now = Date.now();
  const expiresAt = now + EIGHT_HOURS_MS;

  const payload: SessionPayload = {
    ...user,
    issuedAt: now,
    expiresAt,
  };

  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = createHmac('sha256', LOCAL_SESSION_SECRET)
    .update(encodedPayload)
    .digest('base64url');

  return {
    token: `${encodedPayload}.${signature}`,
    expiresAt,
  };
}

/**
 * Verifies a local session token and ensures it has not expired.
 */
export function verifyLocalSession(token: string): SessionPayload | null {
  try {
    const [encodedPayload, signature] = token.split('.');
    if (!encodedPayload || !signature) return null;

    const expectedSignature = createHmac('sha256', LOCAL_SESSION_SECRET)
      .update(encodedPayload)
      .digest('base64url');

    if (signature !== expectedSignature) return null;

    const payload: SessionPayload = JSON.parse(
      Buffer.from(encodedPayload, 'base64url').toString('utf8')
    );

    if (Date.now() > payload.expiresAt) {
      return null; // Expired
    }

    return payload;
  } catch {
    return null;
  }
}