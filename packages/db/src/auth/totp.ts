import * as QRCode from 'qrcode';
import * as crypto from 'crypto';
import base32 from 'thirty-two';

export interface TOTPSetupResult {
  secret: string;
  qrCodeDataUrl: string;
}

export async function generateTOTPSetup(
  userEmail: string, 
  institutionName: string = 'IRIS Desktop'
): Promise<TOTPSetupResult> {
  const secretBytes = crypto.randomBytes(20);
  const secret = base32.encode(secretBytes).toString().replace(/=/g, '');
  
  const otpauthUrl = `otpauth://totp/${encodeURIComponent(institutionName)}:${encodeURIComponent(userEmail)}?secret=${secret}&issuer=${encodeURIComponent(institutionName)}`;
  
  const qrCodeDataUrl = await QRCode.toDataURL(otpauthUrl);
  
  return {
    secret,
    qrCodeDataUrl,
  };
}

function getHOTP(secret: string, counter: number): string {
  const decodedSecret = base32.decode(secret);
  const buffer = Buffer.alloc(8);
  for (let i = 0; i < 8; i++) {
    buffer[7 - i] = counter & 0xff;
    counter = counter >> 8;
  }
  
  const hmac = crypto.createHmac('sha1', decodedSecret);
  hmac.update(buffer);
  const hmacResult = hmac.digest();
  
  const offset = hmacResult[hmacResult.length - 1] & 0xf;
  const code = (hmacResult[offset] & 0x7f) << 24 |
    (hmacResult[offset + 1] & 0xff) << 16 |
    (hmacResult[offset + 2] & 0xff) << 8 |
    (hmacResult[offset + 3] & 0xff);
    
  return (code % 1000000).toString().padStart(6, '0');
}

export function verifyTOTPToken(token: string, secret: string): boolean {
  if (!token || !secret) return false;
  try {
    const timeStep = 30;
    const currentCounter = Math.floor(Date.now() / 1000 / timeStep);
    // Allow window of -1, 0, 1 (90 seconds total)
    for (let i = -1; i <= 1; i++) {
      const generatedToken = getHOTP(secret, currentCounter + i);
      if (crypto.timingSafeEqual(Buffer.from(token), Buffer.from(generatedToken))) {
        return true;
      }
    }
  } catch (err) {
    return false;
  }
  return false;
}
