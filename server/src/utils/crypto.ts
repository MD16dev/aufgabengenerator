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
export function generateToken(userId: string, username: string, isAdmin: boolean): string {
  return jwt.sign({ userId, username, isAdmin }, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });
}

/**
 * Determines whether a given username is configured as an administrator via
 * environment variables. Supports a comma-separated ADMIN_USERNAMES list
 * (e.g. "MD16,alice,bob") and falls back to the single ADMIN_USERNAME value,
 * then to "MD16". This is only a bootstrap guarantee so the configured account
 * can never be locked out; the persisted isAdmin flag in the database is the
 * authoritative source for authorization.
 */
export function isAdminUsername(username: string): boolean {
  const raw = process.env.ADMIN_USERNAMES || process.env.ADMIN_USERNAME || 'MD16';
  const admins = raw.split(',').map((u) => u.trim()).filter(Boolean);
  return admins.includes(username.trim());
}

/**
 * Verifies a JWT token. Returns the decoded payload or throws an error.
 */
export function verifyToken(token: string): any {
  return jwt.verify(token, JWT_SECRET);
}

