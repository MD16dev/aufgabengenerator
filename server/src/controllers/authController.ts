import { Request, Response, NextFunction } from 'express';
import { prisma } from '../utils/db';
import { hashPassword, verifyPassword, generateToken } from '../utils/crypto';
import { AuthenticatedRequest } from '../middleware/auth';

/**
 * Handle user registration.
 */
export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: { message: 'Bitte Benutzername und Passwort eingeben.' } });
    }

    if (username.trim().length < 3) {
      return res.status(400).json({ error: { message: 'Der Benutzername muss mindestens 3 Zeichen lang sein.' } });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: { message: 'Das Passwort muss mindestens 6 Zeichen lang sein.' } });
    }

    // Check unique username constraint
    const existingUser = await prisma.user.findUnique({
      where: { username: username.trim() },
    });

    if (existingUser) {
      return res.status(400).json({ error: { message: 'Dieser Benutzername ist bereits vergeben.' } });
    }

    // Hash and store user credentials, defaulting displayName to username
    const passwordHash = hashPassword(password);
    const user = await prisma.user.create({
      data: {
        username: username.trim(),
        displayName: username.trim(),
        passwordHash,
      },
    });

    const token = generateToken(user.id, user.username);

    res.status(201).json({
      token,
      user: {
        id: user.id,
        username: user.username,
        displayName: user.displayName,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Handle user login.
 */
export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: { message: 'Bitte Benutzername und Passwort eingeben.' } });
    }

    const user = await prisma.user.findUnique({
      where: { username: username.trim() },
    });

    if (!user || !verifyPassword(password, user.passwordHash)) {
      return res.status(401).json({ error: { message: 'Ungültiger Benutzername oder Passwort.' } });
    }

    const token = generateToken(user.id, user.username);

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        displayName: user.displayName,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Retrieve current user profile context along with database scores and avatar.
 */
export const getMe = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: { message: 'Nicht authentifiziert.' } });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      include: {
        _count: {
          select: { solvedTasks: true }
        }
      }
    });

    if (!user) {
      return res.status(404).json({ error: { message: 'Benutzer nicht gefunden.' } });
    }

    res.json({
      id: user.id,
      username: user.username,
      displayName: user.displayName || user.username,
      profilePic: user.profilePic,
      createdAt: user.createdAt,
      solvedCount: user._count.solvedTasks
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update user profile details (displayName, password change, and base64 avatar).
 */
export const updateProfile = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: { message: 'Nicht authentifiziert.' } });
    }

    const { displayName, profilePic, newPassword } = req.body;
    const updateData: any = {};

    if (displayName !== undefined) {
      if (displayName.trim().length < 2) {
        return res.status(400).json({ error: { message: 'Der Anzeigename muss mindestens 2 Zeichen lang sein.' } });
      }
      updateData.displayName = displayName.trim();
    }

    if (profilePic !== undefined) {
      updateData.profilePic = profilePic;
    }

    if (newPassword !== undefined && newPassword !== '') {
      if (newPassword.length < 6) {
        return res.status(400).json({ error: { message: 'Das neue Passwort muss mindestens 6 Zeichen lang sein.' } });
      }
      updateData.passwordHash = hashPassword(newPassword);
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ error: { message: 'Keine Aktualisierungsdaten angegeben.' } });
    }

    const updatedUser = await prisma.user.update({
      where: { id: req.user.userId },
      data: updateData,
    });

    res.json({
      success: true,
      user: {
        id: updatedUser.id,
        username: updatedUser.username,
        displayName: updatedUser.displayName,
        profilePic: updatedUser.profilePic
      }
    });
  } catch (error) {
    next(error);
  }
};
