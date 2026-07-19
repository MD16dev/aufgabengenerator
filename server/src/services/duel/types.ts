/**
 * Shared types for the real-time duel system.
 */

/** Duel modes. Currently only "same_task" is implemented. */
export type DuelMode = 'same_task';

/** Allowed win limits (number of solved tasks to win a duel). */
export const DUEL_LIMITS = [3, 5, 10] as const;
export type DuelLimit = (typeof DUEL_LIMITS)[number];

/** A queue key uniquely identifies a matchmaking bucket. */
export interface QueueKey {
  moduleId: string;
  taskTypeId: string;
  mode: DuelMode;
  limit: DuelLimit;
}

/** A player waiting in a queue. */
export interface QueuePlayer {
  userId: string;
  username: string;
  socketId: string;
  /** Elo rating for the module this queue belongs to. */
  elo: number;
  joinedAt: number;
}

/** Live queue counts broadcast to clients. */
export interface QueueCounts {
  [queueKey: string]: number;
}

/** Build a stable string key from a QueueKey. */
export function queueKeyString(k: QueueKey): string {
  return `${k.moduleId}::${k.taskTypeId}::${k.mode}::${k.limit}`;
}

/** Parse a queue key string back into a QueueKey. */
export function parseQueueKey(s: string): QueueKey {
  const [moduleId, taskTypeId, mode, limit] = s.split('::');
  return { moduleId, taskTypeId, mode: mode as DuelMode, limit: Number(limit) as DuelLimit };
}

/** Map a module id to the corresponding Elo field name on the User model. */
export function eloFieldForModule(moduleId: string): string {
  switch (moduleId) {
    case 'lin_alg': return 'eloLinAlg';
    case 'os': return 'eloOs';
    case 'formal_sys': return 'eloFormalSys';
    case 'algo_struct': return 'eloAlgoStruct';
    default: return 'elo';
  }
}
