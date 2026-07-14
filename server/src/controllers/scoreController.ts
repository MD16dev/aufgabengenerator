import { Response, NextFunction } from 'express';
import { prisma } from '../utils/db';
import { AuthenticatedRequest } from '../middleware/auth';

/**
 * Record a correctly solved task for an authenticated user.
 */
export const solveTask = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: { message: 'Nicht authentifiziert.' } });
    }

    const { taskTypeId } = req.body;
    if (!taskTypeId) {
      return res.status(400).json({ error: { message: 'Bitte taskTypeId angeben.' } });
    }

    // Auto-create/upsert the TaskType in the DB to ensure constraints match
    const taskType = await prisma.taskType.upsert({
      where: { id: taskTypeId },
      update: {},
      create: {
        id: taskTypeId,
        name: taskTypeId === 'lin_alg_det' ? 'Determinante bestimmen' : 'Aufgabe',
        module: taskTypeId === 'lin_alg_det' ? 'Lineare Algebra' : 'Allgemein'
      }
    });

    // Create the SolvedTask record linked to the user
    await prisma.solvedTask.create({
      data: {
        userId: req.user.userId,
        taskTypeId: taskType.id
      }
    });

    // Count new score for this user
    const solvedCount = await prisma.solvedTask.count({
      where: { userId: req.user.userId }
    });

    res.status(201).json({
      success: true,
      solvedCount
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Retrieve the highscore leaderboard list. Supports optional filters ?module=... or ?taskId=...
 */
export const getLeaderboard = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { module, taskId } = req.query;

    // Build the conditional filter clause for solvedTasks
    const solvedTasksWhereClause: any = {};
    if (taskId) {
      solvedTasksWhereClause.taskTypeId = String(taskId);
    } else if (module) {
      solvedTasksWhereClause.taskType = {
        module: String(module)
      };
    }

    // Get all users with filtered solved task counts
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        displayName: true,
        profilePic: true,
        solvedTasks: {
          where: solvedTasksWhereClause,
          select: {
            taskType: {
              select: {
                module: true
              }
            }
          }
        }
      }
    });

    // Map details to rank items
    const leaderboard = users.map(user => {
      const solvedCount = user.solvedTasks.length;
      const lastSolvedModule = user.solvedTasks[solvedCount - 1]?.taskType.module || 'Keines';
      
      return {
        username: user.username,
        displayName: user.displayName || user.username,
        profilePic: user.profilePic,
        solvedCount,
        module: lastSolvedModule,
        isUser: req.user ? req.user.userId === user.id : false
      };
    })
    // For specific leaderboards, filter out users who haven't solved any tasks in that category
    .filter(item => item.solvedCount > 0 || (!taskId && !module))
    .sort((a, b) => b.solvedCount - a.solvedCount);

    res.json(leaderboard);
  } catch (error) {
    next(error);
  }
};
