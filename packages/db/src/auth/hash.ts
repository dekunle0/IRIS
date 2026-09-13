// packages/db/src/auth/hash.ts
import * as argon2 from 'argon2';

/**
 * Argon2id configuration specified in IRIS Playbook §D-3:
 * - type: argon2id
 * - timeCost: 3 iterations
 * - memoryCost: 64MB (65536 KB)
 * - parallelism: 1 thread
 */
const ARGON2_OPTIONS: argon2.Options = {
  type: argon2.argon2id,
  timeCost: 3,
  memoryCost: 64 * 1024, // 64 MB in KB
  parallelism: 1,
};

/**
 * Hash a plain-text password using Argon2id.
 */
export async function hashPassword(plainText: string): Promise<string> {
  return argon2.hash(plainText, ARGON2_OPTIONS);
}

/**
 * Verify a plain-text password against an existing Argon2id hash.
 */
export async function verifyPassword(hash: string, plainText: string): Promise<boolean> {
  try {
    return await argon2.verify(hash, plainText);
  } catch {
    return false;
  }
}

/**
 * Check whether a stored hash conforms to current cost parameters.
 */
export function needsRehash(hash: string): boolean {
  return argon2.needsRehash(hash, ARGON2_OPTIONS);
}