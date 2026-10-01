import bcrypt from 'bcryptjs';

export async function hashPassword(plainText: string): Promise<string> {
  // IRIS-M-011: Use truly async hash
  return bcrypt.hash(plainText, 10);
}

export async function verifyPassword(hash: string, plainText: string): Promise<boolean> {
  // IRIS-M-009: Do not suppress throws for malformed hashes
  return bcrypt.compare(plainText, hash);
}

export function needsRehash(hash: string): boolean {
  // Bcrypt hashes start with algorithm and cost, e.g., $2a$10$ or $2b$10$
  return !hash.startsWith('$2a$10$') && !hash.startsWith('$2b$10$');
}