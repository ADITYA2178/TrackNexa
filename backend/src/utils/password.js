import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
  timingSafeEqual,
} from "crypto"
import { aesKey } from "../config/index.js"
const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 12

function getKey() {
  if (!aesKey || aesKey.length !== 64) {
    throw new Error(
      'AES_SECRET_KEY must be a 64-character hex string (32 bytes)',
    )
  }
  return Buffer.from(aesKey, 'hex')
}

/**
 * Encrypt a password with AES-256-GCM (OpenSSL via Node crypto).
 * Format: aes-256-gcm:<iv_hex>:<authTag_hex>:<ciphertext_hex>
 */
function encryptPassword(password) {
  const iv = randomBytes(IV_LENGTH)
  const cipher = createCipheriv(ALGORITHM, getKey(), iv)

  const encrypted = Buffer.concat([
    cipher.update(password, 'utf8'),
    cipher.final(),
  ])
  const authTag = cipher.getAuthTag()

  return [
    'aes-256-gcm',
    iv.toString('hex'),
    authTag.toString('hex'),
    encrypted.toString('hex'),
  ].join(':')
}

/** Decrypt a password stored with encryptPassword. */
function decryptPassword(storedValue) {
  const parts = storedValue.split(':')
  if (parts.length !== 4 || parts[0] !== 'aes-256-gcm') {
    throw new Error('Invalid encrypted password format')
  }

  const [, ivHex, authTagHex, dataHex] = parts
  const decipher = createDecipheriv(
    ALGORITHM,
    getKey(),
    Buffer.from(ivHex, 'hex'),
  )
  decipher.setAuthTag(Buffer.from(authTagHex, 'hex'))

  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(dataHex, 'hex')),
    decipher.final(),
  ])

  return decrypted.toString('utf8')
}

/** Compare a plain password with an AES-encrypted stored value. */
function verifyPassword(password, storedValue) {
  try {
    const decrypted = decryptPassword(storedValue)
    const a = Buffer.from(password)
    const b = Buffer.from(decrypted)
    if (a.length !== b.length) return false
    return timingSafeEqual(a, b)
  } catch {
    return false
  }
}

/**
 * Strong password rules:
 * - min 8 characters
 * - at least 1 uppercase letter
 * - at least 1 lowercase letter
 * - at least 1 number
 * - at least 1 special character
 */
function validatePasswordStrength(password) {
  const rules = [
    {
      test: (value) => typeof value === 'string' && value.length >= 8,
      message: 'Password must be at least 8 characters long',
    },
    {
      test: (value) => /[A-Z]/.test(value),
      message: 'Password must include at least one uppercase letter',
    },
    {
      test: (value) => /[a-z]/.test(value),
      message: 'Password must include at least one lowercase letter',
    },
    {
      test: (value) => /[0-9]/.test(value),
      message: 'Password must include at least one number',
    },
    {
      test: (value) => /[^A-Za-z0-9]/.test(value),
      message: 'Password must include at least one special character',
    },
  ]

  const failed = rules.filter((rule) => !rule.test(password)).map((r) => r.message)

  return {
    valid: failed.length === 0,
    errors: failed,
  }
}

export { encryptPassword, decryptPassword, verifyPassword, validatePasswordStrength }