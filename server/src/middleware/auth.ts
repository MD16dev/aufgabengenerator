import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/crypto';

export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    username: string;
    isAdmin: boolean;
  };
}

/**
 * Authentication middleware that intercepts requests, checks for a Bearer JWT,
 * verifies it, and appends the user context to the request object.
 */
export const authMiddleware = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: { message: 'Nicht autorisiert. Kein Authentifizierungstoken vorhanden.' }
      });
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);
    
    req.user = {
      userId: decoded.userId,
      username: decoded.username,
      isAdmin: decoded.isAdmin === true
    };
    
    next();
  } catch (error) {
    return res.status(401).json({
      error: { message: 'Nicht autorisiert. Token ist ungültig oder abgelaufen.' }
    });
  }
};

/**
 * Optional authentication middleware that parses the JWT token if present,
 * but does not reject the request if the token is missing or invalid.
 */
export const optionalAuthMiddleware = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const decoded = verifyToken(token);
      req.user = {
        userId: decoded.userId,
        username: decoded.username,
        isAdmin: decoded.isAdmin === true
      };
    }
  } catch (error) {
    // Silently continue as guest
  }
  next();
};
