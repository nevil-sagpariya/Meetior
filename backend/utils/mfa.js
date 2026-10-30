'use strict';
const crypto = require('crypto');

// RFC 4648 Base32 alphabet
const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

function base32Encode(buffer) {
  let bits = 0;
  let value = 0;
  let output = '';

  for (let i = 0; i < buffer.length; i++) {
    value = (value << 8) | buffer[i];
    bits += 8;

    while (bits >= 5) {
      output += BASE32_ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }

  if (bits > 0) {
    output += BASE32_ALPHABET[(value << (5 - bits)) & 31];
  }

  return output;
}

function base32Decode(base32Str) {
  const cleaned = base32Str.toUpperCase().replace(/=+$/, '');
  let bits = 0;
  let value = 0;
  const bytes = [];

  for (let i = 0; i < cleaned.length; i++) {
    const idx = BASE32_ALPHABET.indexOf(cleaned[i]);
    if (idx === -1) continue; // skip invalid chars/spaces

    value = (value << 5) | idx;
    bits += 5;

    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }

  return Buffer.from(bytes);
}

/**
 * Generate a cryptographically secure Base32 TOTP secret
 */
function generateSecret(length = 20) {
  const randomBytes = crypto.randomBytes(length);
  return base32Encode(randomBytes);
}

/**
 * Generate a 6-digit TOTP code for a secret at a given counter
 */
function generateToken(secret, counter = null) {
  if (counter === null) {
    counter = Math.floor(Date.now() / 1000 / 30);
  }

  const key = base32Decode(secret);
  const buffer = Buffer.alloc(8);
  buffer.writeBigInt64BE(BigInt(counter));

  const hmac = crypto.createHmac('sha1', key);
  hmac.update(buffer);
  const digest = hmac.digest();

  const offset = digest[digest.length - 1] & 0x0f;
  const code = (
    ((digest[offset] & 0x7f) << 24) |
    ((digest[offset + 1] & 0xff) << 16) |
    ((digest[offset + 2] & 0xff) << 8) |
    (digest[offset + 3] & 0xff)
  ) % 1000000;

  return code.toString().padStart(6, '0');
}

/**
 * Verify a 6-digit TOTP code against a secret with +/- window steps
 */
function verifyToken(secret, token, window = 1) {
  if (!secret || !token) return false;
  const cleanToken = token.toString().trim();
  if (cleanToken.length !== 6 || !/^\d{6}$/.test(cleanToken)) return false;

  const currentStep = Math.floor(Date.now() / 1000 / 30);

  for (let step = -window; step <= window; step++) {
    const expected = generateToken(secret, currentStep + step);
    if (crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(cleanToken))) {
      return true;
    }
  }

  return false;
}

/**
 * Build standard otpauth URL for Google Authenticator / Authy
 */
function getOtpAuthUrl(secret, email, issuer = 'Meetior Super Admin') {
  const label = encodeURIComponent(`${issuer}:${email}`);
  const encIssuer = encodeURIComponent(issuer);
  return `otpauth://totp/${label}?secret=${secret}&issuer=${encIssuer}&algorithm=SHA1&digits=6&period=30`;
}

module.exports = {
  generateSecret,
  generateToken,
  verifyToken,
  getOtpAuthUrl,
};
