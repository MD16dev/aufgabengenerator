import { prisma } from '../../utils/db';
import { gradeFromPercentage } from './examService';

export interface ExamLeaderboardEntry {
  username: string;
  displayName: string;
  profilePic?: string;
  /** Arithmetic mean of the best 30% of the user's exam percentages. */
  avgScorePct: number;
  /** Arithmetic mean of the grades for those same best attempts (lower = better). */
  avgGrade: number;
  attemptsCount: number;
  isUser: boolean;
}

/**
 * Exam leaderboard per module.
 *
 * For each user we take their exam attempts in the given module, sort them by
 * `scorePct` descending, keep the best 30% (at least one), and report the
 * arithmetic mean of those percentages (and the corresponding grades). This
 * rewards consistent high performance rather than a single lucky run.
 */
export async function getExamLeaderboard(
  moduleId: string,
  userId?: string
): Promise<ExamLeaderboardEntry[]> {
  const attempts = await prisma.examAttempt.findMany({
    where: { moduleId },
    select: {
      scorePct: true,
      grade: true,
      userId: true,
      user: {
        select: {
          username: true,
          displayName: true,
          profilePic: true,
        },
      },
    },
    orderBy: { scorePct: 'desc' },
  });

  // Group by user.
  const byUser = new Map<
    string,
    { username: string; displayName: string; profilePic?: string; pcts: number[]; grades: number[] }
  >();
  for (const a of attempts) {
    if (!byUser.has(a.userId)) {
      byUser.set(a.userId, {
        username: a.user.username,
        displayName: a.user.displayName || a.user.username,
        profilePic: a.user.profilePic || undefined,
        pcts: [],
        grades: [],
      });
    }
    const u = byUser.get(a.userId)!;
    u.pcts.push(a.scorePct);
    u.grades.push(a.grade);
  }

  const entries: ExamLeaderboardEntry[] = [];
  for (const [uid, u] of byUser) {
    const n = u.pcts.length;
    const keep = Math.max(1, Math.ceil(n * 0.3));
    const bestPcts = u.pcts.slice(0, keep);
    const bestGrades = u.grades.slice(0, keep);
    const avgScorePct = bestPcts.reduce((s, v) => s + v, 0) / bestPcts.length;
    const avgGrade = bestGrades.reduce((s, v) => s + v, 0) / bestGrades.length;
    entries.push({
      username: u.username,
      displayName: u.displayName,
      profilePic: u.profilePic,
      avgScorePct,
      avgGrade,
      attemptsCount: n,
      isUser: userId ? userId === uid : false,
    });
  }

  // Rank by average percentage, descending.
  entries.sort((a, b) => b.avgScorePct - a.avgScorePct);
  return entries;
}

export { gradeFromPercentage };
