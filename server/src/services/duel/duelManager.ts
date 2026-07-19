import { Server, Socket } from 'socket.io';
import { prisma } from '../../utils/db';
import { getTaskGenerator } from '../math/registry';
import { TaskData } from '../math/types';
import {
  DuelMode,
  DuelLimit,
  QueueKey,
  QueuePlayer,
  QueueCounts,
  queueKeyString,
  parseQueueKey,
  eloFieldForModule,
} from './types';
import { computeElo } from './elo';

/**
 * In-memory state for the duel system. The queue is ephemeral (live players
 * only); active duels hold the shared task state until finished.
 */

interface ActiveDuel {
  id: string;
  key: QueueKey;
  players: {
    userId: string;
    username: string;
    socketId: string;
    score: number;
    eloBefore: number;
  }[];
  currentRound: {
    roundId: string;
    taskData: TaskData;
  } | null;
  status: 'countdown' | 'active' | 'finished';
}

// queueKeyString -> list of waiting players
const queues = new Map<string, QueuePlayer[]>();
// socketId -> queueKeyString (so a disconnect can remove the player)
const socketToQueue = new Map<string, string>();
// duelId -> ActiveDuel
const activeDuels = new Map<string, ActiveDuel>();
// socketId -> duelId
const socketToDuel = new Map<string, string>();

let io: Server | null = null;

export function initDuelManager(server: Server) {
  io = server;
}

function broadcastQueueCounts() {
  if (!io) return;
  const counts: QueueCounts = {};
  for (const [key, players] of queues.entries()) {
    counts[key] = players.length;
  }
  io.emit('queue:update', counts);
}

function getQueue(key: QueueKey): QueuePlayer[] {
  const k = queueKeyString(key);
  if (!queues.has(k)) queues.set(k, []);
  return queues.get(k)!;
}

/**
 * Add a player to a queue. Returns true if a match was found and the duel
 * started (the player is then removed from the queue).
 */
export async function joinQueue(
  socket: Socket,
  key: QueueKey,
  user: { userId: string; username: string; elo: number }
): Promise<{ matched: boolean; duelId?: string }> {
  const k = queueKeyString(key);
  const queue = getQueue(key);

  // Remove this player from any other queue first
  leaveAllQueues(socket.id);

  const player: QueuePlayer = {
    userId: user.userId,
    username: user.username,
    socketId: socket.id,
    elo: user.elo,
    joinedAt: Date.now(),
  };

  // Try to find an opponent (closest Elo, not the same user)
  queue.sort((a, b) => Math.abs(a.elo - user.elo) - Math.abs(b.elo - user.elo));
  const opponentIndex = queue.findIndex((p) => p.userId !== user.userId);
  if (opponentIndex >= 0) {
    const opponent = queue.splice(opponentIndex, 1)[0];
    socketToQueue.delete(opponent.socketId);
    const duel = await createDuel(key, player, opponent);
    broadcastQueueCounts();
    return { matched: true, duelId: duel.id };
  }

  queue.push(player);
  socketToQueue.set(socket.id, k);
  broadcastQueueCounts();
  return { matched: false };
}

/** Remove a player from all queues (e.g. on disconnect or cancel). */
export function leaveAllQueues(socketId: string): boolean {
  const k = socketToQueue.get(socketId);
  if (!k) return false;
  const queue = queues.get(k);
  if (queue) {
    const idx = queue.findIndex((p) => p.socketId === socketId);
    if (idx >= 0) queue.splice(idx, 1);
  }
  socketToQueue.delete(socketId);
  broadcastQueueCounts();
  return true;
}

async function createDuel(key: QueueKey, p1: QueuePlayer, p2: QueuePlayer): Promise<ActiveDuel> {
  const duel = await prisma.duel.create({
    data: {
      mode: key.mode,
      moduleId: key.moduleId,
      taskTypeId: key.taskTypeId,
      limit: key.limit,
      status: 'pending',
      participants: {
        create: [
          { userId: p1.userId, eloBefore: p1.elo },
          { userId: p2.userId, eloBefore: p2.elo },
        ],
      },
    },
    include: { participants: true },
  });

  const active: ActiveDuel = {
    id: duel.id,
    key,
    players: duel.participants.map((part, i) => ({
      userId: part.userId,
      username: i === 0 ? p1.username : p2.username,
      socketId: i === 0 ? p1.socketId : p2.socketId,
      score: 0,
      eloBefore: part.eloBefore,
    })),
    currentRound: null,
    status: 'countdown',
  };

  activeDuels.set(duel.id, active);
  socketToDuel.set(p1.socketId, duel.id);
  socketToDuel.set(p2.socketId, duel.id);

  // Notify both players and start the countdown
  const payload = {
    duelId: duel.id,
    mode: key.mode,
    moduleId: key.moduleId,
    taskTypeId: key.taskTypeId,
    limit: key.limit,
    opponent: null as { userId: string; username: string; elo: number } | null,
  };
  io?.to(p1.socketId).emit('duel:start', { ...payload, opponent: { userId: p2.userId, username: p2.username, elo: p2.elo } });
  io?.to(p2.socketId).emit('duel:start', { ...payload, opponent: { userId: p1.userId, username: p1.username, elo: p1.elo } });

  startCountdown(active);
  return active;
}

function startCountdown(duel: ActiveDuel) {
  let count = 3;
  io?.to(duel.players.map((p) => p.socketId)).emit('duel:countdown', count);
  const timer = setInterval(async () => {
    count -= 1;
    if (count > 0) {
      io?.to(duel.players.map((p) => p.socketId)).emit('duel:countdown', count);
    } else {
      clearInterval(timer);
      duel.status = 'active';
      await prisma.duel.update({ where: { id: duel.id }, data: { status: 'active' } });
      io?.to(duel.players.map((p) => p.socketId)).emit('duel:countdown', 0); // GO!
      await nextRound(duel);
    }
  }, 1000);
}

async function nextRound(duel: ActiveDuel) {
  const generator = getTaskGenerator(duel.key.taskTypeId);
  if (!generator) return;
  const taskData: TaskData = await generator();
  const round = await prisma.duelRound.create({
    data: {
      duelId: duel.id,
      taskType: duel.key.taskTypeId,
      taskData: JSON.stringify(taskData),
    },
  });
  duel.currentRound = { roundId: round.id, taskData };
  io?.to(duel.players.map((p) => p.socketId)).emit('duel:task', {
    roundId: round.id,
    task: taskData,
  });
}

/**
 * Handle a player submitting an answer. If correct, increments their score
 * and checks win conditions. Returns the updated duel state.
 */
export async function submitAnswer(
  socketId: string,
  answer: string
): Promise<void> {
  const duelId = socketToDuel.get(socketId);
  if (!duelId) return;
  const duel = activeDuels.get(duelId);
  if (!duel || duel.status !== 'active' || !duel.currentRound) return;

  const player = duel.players.find((p) => p.socketId === socketId);
  if (!player) return;

  const normalized = answer.trim().replace(/\s+/g, '');
  const expected = duel.currentRound.taskData.answer.trim().replace(/\s+/g, '');
  const isCorrect = normalized === expected;

  if (!isCorrect) {
    io?.to(socketId).emit('duel:answer_result', { correct: false });
    return;
  }

  player.score += 1;
  io?.to(socketId).emit('duel:answer_result', { correct: true });
  io?.to(duel.players.map((p) => p.socketId)).emit('duel:score', {
    scores: duel.players.map((p) => ({ userId: p.userId, username: p.username, score: p.score })),
  });

  // Win conditions: reached limit, or +2 lead
  const [a, b] = duel.players;
  const reachedLimit = a.score >= duel.key.limit || b.score >= duel.key.limit;
  const lead = Math.abs(a.score - b.score) >= 2;
  if (reachedLimit || lead) {
    const winner = a.score > b.score ? a : b;
    const loser = a.score > b.score ? b : a;
    await finishDuel(duel, winner, loser);
    return;
  }

  await nextRound(duel);
}

async function finishDuel(duel: ActiveDuel, winner: ActiveDuel['players'][number], loser: ActiveDuel['players'][number]) {
  duel.status = 'finished';
  const { winnerElo, loserElo } = computeElo(winner.eloBefore, loser.eloBefore);

  const eloField = eloFieldForModule(duel.key.moduleId);
  await prisma.$transaction([
    prisma.duel.update({
      where: { id: duel.id },
      data: { status: 'finished', winnerId: winner.userId, loserId: loser.userId, finishedAt: new Date() },
    }),
    prisma.duelParticipant.updateMany({
      where: { duelId: duel.id, userId: winner.userId },
      data: { eloAfter: winnerElo },
    }),
    prisma.duelParticipant.updateMany({
      where: { duelId: duel.id, userId: loser.userId },
      data: { eloAfter: loserElo },
    }),
    prisma.user.update({
      where: { id: winner.userId },
      data: { [eloField]: winnerElo, elo: winnerElo, duelWins: { increment: 1 } } as any,
    }),
    prisma.user.update({
      where: { id: loser.userId },
      data: { [eloField]: loserElo, elo: loserElo, duelLosses: { increment: 1 } } as any,
    }),
  ]);

  io?.to(duel.players.map((p) => p.socketId)).emit('duel:finished', {
    winnerId: winner.userId,
    winnerUsername: winner.username,
    loserId: loser.userId,
    loserUsername: loser.username,
    eloChanges: {
      [winner.userId]: winnerElo - winner.eloBefore,
      [loser.userId]: loserElo - loser.eloBefore,
    },
  });

  cleanupDuel(duel.id);
}

function cleanupDuel(duelId: string) {
  const duel = activeDuels.get(duelId);
  if (duel) {
    for (const p of duel.players) socketToDuel.delete(p.socketId);
  }
  activeDuels.delete(duelId);
}

/** Handle a disconnect: leave queues and forfeit any active duel. */
export async function handleDisconnect(socketId: string) {
  leaveAllQueues(socketId);
  const duelId = socketToDuel.get(socketId);
  if (duelId) {
    const duel = activeDuels.get(duelId);
    if (duel) {
      const quitter = duel.players.find((p) => p.socketId === socketId);
      const opponent = duel.players.find((p) => p.socketId !== socketId);
      if (quitter && opponent) {
        await finishDuel(duel, opponent, quitter);
      }
    }
  }
}

/** Get current queue counts (for initial client sync). */
export function getQueueCounts(): QueueCounts {
  const counts: QueueCounts = {};
  for (const [key, players] of queues.entries()) {
    counts[key] = players.length;
  }
  return counts;
}

export { parseQueueKey, queueKeyString };
export type { DuelMode, DuelLimit, QueueKey };
