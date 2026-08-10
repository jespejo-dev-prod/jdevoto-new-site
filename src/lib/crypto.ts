import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const PREFIX = 'v1';

/**
 * Gets the encryption key from the environment.
 * Validates that it is a 32-byte key provided as a 64-character hex string.
 */
function getEncryptionKey(): Buffer {
  const keyHex = process.env.ENCRYPTION_KEY;
  if (!keyHex) {
    throw new Error('Missing ENCRYPTION_KEY in environment variables');
  }

  const key = Buffer.from(keyHex, 'hex');
  if (key.length !== 32) {
    throw new Error('Invalid ENCRYPTION_KEY: must be exactly 32 bytes (64 hex characters)');
  }

  return key;
}

/**
 * Encrypts a string using AES-256-GCM.
 * @param text The plaintext string to encrypt
 * @returns The encrypted string in the format `v1:iv:authTag:ciphertext`
 */
export function encryptData(text: string): string {
  if (!text) return text;

  const key = getEncryptionKey();
  const iv = crypto.randomBytes(12); // 96 bits for GCM
  
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  
  let ciphertext = cipher.update(text, 'utf8', 'hex');
  ciphertext += cipher.final('hex');
  
  const authTag = cipher.getAuthTag().toString('hex');
  const ivHex = iv.toString('hex');

  return `${PREFIX}:${ivHex}:${authTag}:${ciphertext}`;
}

/**
 * Decrypts a string encrypted with AES-256-GCM.
 * @param encryptedText The encrypted string in the format `v1:iv:authTag:ciphertext`
 * @returns The decrypted plaintext string
 */
export function decryptData(encryptedText: string): string {
  if (!encryptedText || !encryptedText.startsWith(`${PREFIX}:`)) {
    return encryptedText; // Return as is if it's not encrypted with our format
  }

  const parts = encryptedText.split(':');
  if (parts.length !== 4) {
    throw new Error('Invalid encrypted text format');
  }

  const [, ivHex, authTagHex, ciphertext] = parts;
  
  const key = getEncryptionKey();
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  let plaintext = decipher.update(ciphertext, 'hex', 'utf8');
  plaintext += decipher.final('utf8');

  return plaintext;
}

/**
 * Checks if a string is encrypted with the current standard.
 */
export function isEncrypted(text: string): boolean {
  return typeof text === 'string' && text.startsWith(`${PREFIX}:`);
}
