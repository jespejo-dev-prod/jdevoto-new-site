import crypto from 'crypto';

/**
 * Decodifica una cadena en base32 a un Buffer de bytes.
 * El alfabeto estándar de Base32 es A-Z y 2-7.
 */
function base32Decode(base32: string): Buffer {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  const cleaned = base32.toUpperCase().replace(/=+$/, '');
  let bits = '';
  
  for (let i = 0; i < cleaned.length; i++) {
    const val = alphabet.indexOf(cleaned[i]);
    if (val === -1) {
      throw new Error('Carácter base32 inválido');
    }
    bits += val.toString(2).padStart(5, '0');
  }
  
  const bytes = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) {
    bytes.push(parseInt(bits.substring(i, i + 8), 2));
  }
  
  return Buffer.from(bytes);
}

/**
 * Genera un secreto aleatorio en Base32.
 */
export function generateBase32Secret(length = 16): string {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let secret = '';
  const bytes = crypto.randomBytes(length);
  for (let i = 0; i < length; i++) {
    secret += alphabet[bytes[i] % 32];
  }
  return secret;
}

/**
 * Valida un código TOTP dinámico de 6 dígitos para un secreto Base32.
 * Soporta una ventana de tolerancia para desfase de reloj (por defecto, 1 paso = 30 segundos).
 */
export function verifyTOTP(token: string, secret: string, window = 1): boolean {
  try {
    const key = base32Decode(secret);
    const epoch = Math.floor(Date.now() / 1000);
    const currentTime = Math.floor(epoch / 30);

    for (let i = -window; i <= window; i++) {
      const time = currentTime + i;
      const buffer = Buffer.alloc(8);
      // Escribir el tiempo como entero de 64 bits (high 32 bits son 0)
      buffer.writeUInt32BE(0, 0);
      buffer.writeUInt32BE(time, 4);

      const hmac = crypto.createHmac('sha1', key).update(buffer).digest();
      const offset = hmac[hmac.length - 1] & 0xf;
      const code = (
        ((hmac[offset] & 0x7f) << 24) |
        ((hmac[offset + 1] & 0xff) << 16) |
        ((hmac[offset + 2] & 0xff) << 8) |
        (hmac[offset + 3] & 0xff)
      ) % 1000000;

      if (code.toString().padStart(6, '0') === token) {
        return true;
      }
    }
  } catch (err) {
    console.error('Error al validar TOTP:', err);
  }
  return false;
}
