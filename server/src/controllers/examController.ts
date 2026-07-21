import { Request, Response, NextFunction } from 'express';
import { prisma } from '../utils/db';
import { AuthenticatedRequest } from '../middleware/auth';
import { buildExamPlan, gradeFromPercentage, ExamPlanItem } from '../services/exam/examService';
import { getExamLeaderboard } from '../services/exam/examLeaderboard';

const VALID_MODULES = ['lin_alg', 'algo_struct', 'os', 'formal_sys'];
const VALID_DURATIONS = [20, 30, 45, 60, 90, 120, 180];

/**
 * POST /api/exam/generate
 * Body: { moduleId, durationMin }
 * Returns: { plan: ExamPlanItem[] }
 */
export const generateExam = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: { message: 'Nicht authentifiziert.' } });
    }
    const { moduleId, durationMin } = req.body;
    if (!VALID_MODULES.includes(moduleId)) {
      return res.status(400).json({ error: { message: 'Ungültiges Modul.' } });
    }
    if (!VALID_DURATIONS.includes(Number(durationMin))) {
      return res.status(400).json({ error: { message: 'Ungültige Prüfungsdauer.' } });
    }

    let plan: ExamPlanItem[];
    try {
      plan = buildExamPlan(moduleId, Number(durationMin));
    } catch (e: any) {
      return res.status(400).json({ error: { message: e.message || 'Prüfung konnte nicht erstellt werden.' } });
    }

    res.json({ plan });
  } catch (error) {
    next(error);
  }
};

interface SubmitTask {
  taskTypeId: string;
  userPoints: number;
  maxPoints: number;
}

/**
 * POST /api/exam/submit
 * Body: { moduleId, durationMin, tasks: SubmitTask[] }
 * Persists the attempt and returns { scorePct, grade, passed, attemptId }.
 */
export const submitExam = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: { message: 'Nicht authentifiziert.' } });
    }
    const { moduleId, durationMin, tasks } = req.body;
    if (!VALID_MODULES.includes(moduleId)) {
      return res.status(400).json({ error: { message: 'Ungültiges Modul.' } });
    }
    if (!Array.isArray(tasks) || tasks.length === 0) {
      return res.status(400).json({ error: { message: 'Keine Aufgaben übermittelt.' } });
    }

    const maxPoints = tasks.reduce((s: number, t: SubmitTask) => s + (Number(t.maxPoints) || 0), 0);
    const earnedPoints = tasks.reduce(
      (s: number, t: SubmitTask) => s + Math.max(0, Math.min(Number(t.maxPoints) || 0, Number(t.userPoints) || 0)),
      0
    );
    const scorePct = maxPoints > 0 ? (earnedPoints / maxPoints) * 100 : 0;
    const { grade, passed } = gradeFromPercentage(scorePct);

    const attempt = await prisma.examAttempt.create({
      data: {
        userId: req.user.userId,
        moduleId,
        durationMin: Number(durationMin),
        maxPoints,
        earnedPoints,
        scorePct,
        grade,
        passed,
        tasks: {
          create: tasks.map((t: SubmitTask) => ({
            taskTypeId: t.taskTypeId,
            category: '', // category is informational; filled from plan if needed later
            workloadMin: 0,
            autoGraded: true,
            maxPoints: Number(t.maxPoints) || 0,
            userPoints: Math.max(0, Math.min(Number(t.maxPoints) || 0, Number(t.userPoints) || 0)),
          })),
        },
      },
    });

    res.status(201).json({
      scorePct,
      grade,
      passed,
      attemptId: attempt.id,
      tasks: tasks.map((t: SubmitTask) => ({
        taskTypeId: t.taskTypeId,
        userPoints: Math.max(0, Math.min(Number(t.maxPoints) || 0, Number(t.userPoints) || 0)),
        maxPoints: Number(t.maxPoints) || 0,
      })),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/exam/leaderboard?module=lin_alg
 * Returns the per-module exam leaderboard (best 30% average per user).
 */
export const getExamLeaderboardHandler = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { module } = req.query;
    const moduleId = typeof module === 'string' && VALID_MODULES.includes(module) ? module : 'lin_alg';
    const leaderboard = await getExamLeaderboard(moduleId, req.user?.userId);
    res.json(leaderboard);
  } catch (error) {
    next(error);
  }
};
