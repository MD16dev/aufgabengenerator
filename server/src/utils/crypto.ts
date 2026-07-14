import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'dev-key-keep-it-secret';
const TOKEN_EXPIRY = '24h'; // Safest default standard session lifespan

/**
 * Secures a password using PBKDF2 with a unique salt.
 * Returns the salt and hash formatted as: "salt:hash"
 */
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

/**
 * Compares an incoming plain password with the stored "salt:hash" string.
 */
export function verifyPassword(password: string, storedHash: string): boolean {
  const [salt, hash] = storedHash.split(':');
  if (!salt || !hash) return false;

  const checkHash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  return hash === checkHash;
}

/**
 * Generates a signed JWT token for the user.
 */
export function generateToken(userId: string, username: string): string {
  return jwt.sign({ userId, username }, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });
}

/**
 * Verifies a JWT token. Returns the decoded payload or throws an error.
 */
export function verifyToken(token: string): any {
  return jwt.verify(token, JWT_SECRET);
}
