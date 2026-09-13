// packages/db/src/auth/totp.ts
import { authenticator } from 'otplib';
import * as QRCode from 'qrcode';

export interface TOTPSetupResult {
  secret: string;
  qrCodeDataUrl: string;
}

/**
 * Generates a new TOTP secret and a local QR code data URL.
 * The QR code can be displayed directly in the React frontend (no internet required).
 */
export async function generateTOTPSetup(
  userEmail: string, 
  institutionName: string = 'IRIS Desktop'
): Promise<TOTPSetupResult> {
  // Generates a secure, RFC 6238-compliant base32 secret
  const secret = authenticator.generateSecret();
  
  // Creates the standard otpauth:// URI for authenticator apps
  const otpauthUrl = authenticator.keyuri(userEmail, institutionName, secret);
  
  // Generates a base64 encoded PNG of the QR code to render in the UI
  const qrCodeDataUrl = await QRCode.toDataURL(otpauthUrl);
  
  return {
    secret,
    qrCodeDataUrl,
  };
}

/**
 * Verifies a 6-digit TOTP token against the user's stored secret.
 * Handles slight clock drift automatically.
 */
export function verifyTOTPToken(token: string, secret: string): boolean {
  try {
    return authenticator.verify({ token, secret });
  } catch (err) {
    return false;
  }
}