import { Request, Response, NextFunction } from 'express';
import { prisma } from '../utils/db';
import { hashPassword, verifyPassword, generateToken, isAdminUsername } from '../utils/crypto';
import { AuthenticatedRequest } from '../middleware/auth';

/**
 * Handle user registration.
 */
export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { username, password, displayName } = req.body;

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
    const isAdmin = isAdminUsername(username);
    const user = await prisma.user.create({
      data: {
        username: username.trim(),
        displayName: (displayName && displayName.trim()) || username.trim(),
        passwordHash,
        isAdmin,
      },
    });

    const token = generateToken(user.id, user.username, user.isAdmin);

    res.status(201).json({
      token,
      user: {
        id: user.id,
        username: user.username,
        displayName: user.displayName,
        isAdmin: user.isAdmin,
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

    // Keep the persisted admin flag in sync: a user is admin if either the
    // database flag is already set (e.g. promoted manually) or their username
    // is configured via ADMIN_USERNAMES. This never downgrades a manually
    // promoted admin just because their name isn't in the env list.
    const computedIsAdmin = user.isAdmin || isAdminUsername(user.username);
    if (computedIsAdmin !== user.isAdmin) {
      await prisma.user.update({
        where: { id: user.id },
        data: { isAdmin: computedIsAdmin },
      });
      user.isAdmin = computedIsAdmin;
    }

    const token = generateToken(user.id, user.username, user.isAdmin);

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        displayName: user.displayName,
        isAdmin: user.isAdmin,
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
      isAdmin: user.isAdmin,
      createdAt: user.createdAt,
      solvedCount: user._count.solvedTasks,
      elo: user.elo,
      eloLinAlg: user.eloLinAlg,
      eloOs: user.eloOs,
      eloFormalSys: user.eloFormalSys,
      eloAlgoStruct: user.eloAlgoStruct,
      duelWins: user.duelWins,
      duelLosses: user.duelLosses
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
        profilePic: updatedUser.profilePic,
        isAdmin: updatedUser.isAdmin
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * List all users (Admin only). Excludes password hashes and returns the
 * admin flag so the admin panel can manage roles.
 */
export const listUsers = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user?.isAdmin) {
      return res.status(403).json({ error: { message: 'Nicht autorisiert. Nur Administratoren haben Zugriff.' } });
    }

    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        username: true,
        displayName: true,
        isAdmin: true,
        createdAt: true,
        _count: {
          select: { solvedTasks: true }
        }
      }
    });

    res.json(users.map((u) => ({
      id: u.id,
      username: u.username,
      displayName: u.displayName,
      isAdmin: u.isAdmin,
      createdAt: u.createdAt,
      solvedCount: u._count.solvedTasks
    })));
  } catch (error) {
    next(error);
  }
};

/**
 * Promote or demote a user (Admin only). The acting admin cannot remove their
 * own admin rights to avoid locking themselves out.
 */
export const setUserAdmin = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user?.isAdmin) {
      return res.status(403).json({ error: { message: 'Nicht autorisiert. Nur Administratoren haben Zugriff.' } });
    }

    const { id } = req.params;
    const { isAdmin } = req.body;

    if (typeof isAdmin !== 'boolean') {
      return res.status(400).json({ error: { message: 'isAdmin muss ein Boolean sein.' } });
    }

    if (req.user.userId === id) {
      return res.status(400).json({ error: { message: 'Du kannst deine eigenen Admin-Rechte nicht ändern.' } });
    }

    const target = await prisma.user.findUnique({ where: { id } });
    if (!target) {
      return res.status(404).json({ error: { message: 'Benutzer nicht gefunden.' } });
    }

    const updated = await prisma.user.update({
      where: { id },
      data: { isAdmin },
      select: {
        id: true,
        username: true,
        displayName: true,
        isAdmin: true
      }
    });

    res.json({ success: true, user: updated });
  } catch (error) {
    next(error);
  }
};
