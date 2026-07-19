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

    const { taskTypeId, outcome, points } = req.body;
    if (!taskTypeId) {
      return res.status(400).json({ error: { message: 'Bitte taskTypeId angeben.' } });
    }

    // outcome: "solved" (correct on first try) or "revealed" (solution shown,
    // user self-reported whether they had it right). "skipped" is not recorded.
    const resolvedOutcome =
      outcome === 'revealed' ? 'revealed' : 'solved';
    // Points: a genuine solve is worth 1 point. A revealed task is worth 1 point
    // ONLY when the user self-reported "Ich hatte es richtig" (outcome "revealed"
    // with the optional `correct` flag). This keeps the leaderboard reachable for
    // every task type (stepwise tasks can only be self-assessed) while still
    // distinguishing genuine solves from self-reported ones in the data.
    const selfReportedCorrect = outcome === 'revealed' && req.body.correct === true;
    const resolvedPoints = resolvedOutcome === 'solved' || selfReportedCorrect ? 1 : 0;

    // Auto-create/upsert the TaskType in the DB to ensure constraints match
    const isLinAlg = (taskTypeId === 'lin_alg_det' || taskTypeId === 'lin_alg_det3x3' || taskTypeId === 'lin_alg_matmul'
      || taskTypeId === 'calc_gl_n_cardinality' || taskTypeId === 'calc_param_determinant_finite_field'
      || taskTypeId === 'calc_poly_mapping_matrix' || taskTypeId === 'calc_eigenbasis'
      || taskTypeId === 'calc_linear_code_parameters');
    const isDSAL = taskTypeId.startsWith('dsal_');

    const taskType = await prisma.taskType.upsert({
      where: { id: taskTypeId },
      update: {},
      create: {
        id: taskTypeId,
        name: taskTypeId === 'lin_alg_det' 
          ? '2x2 Determinante' 
          : taskTypeId === 'lin_alg_det3x3' 
          ? '3x3 Determinante (Sarrus)' 
          : taskTypeId === 'lin_alg_matmul'
          ? 'Matrizenmultiplikation'
          : taskTypeId === 'calc_gl_n_cardinality'
          ? 'Kardinalität GL_n(F_p)'
          : taskTypeId === 'calc_param_determinant_finite_field'
          ? 'Determinante mit Parameter (F_p)'
          : taskTypeId === 'calc_poly_mapping_matrix'
          ? 'Darstellungsmatrix (Polynomräume)'
          : taskTypeId === 'calc_eigenbasis'
          ? 'Eigenbasis berechnen'
          : taskTypeId === 'calc_linear_code_parameters'
          ? 'Parameter linearer Codes'
          : taskTypeId === 'os_bus_anki'
          ? 'BUS Quizfragen'
          : taskTypeId === 'os_page_table'
          ? 'Adressübersetzung'
          : taskTypeId === 'dsal_bst_insert'
          ? 'BST: Wert einfügen'
          : taskTypeId === 'dsal_avl_insert'
          ? 'AVL-Baum: Wert einfügen'
          : taskTypeId === 'dsal_rb_insert'
          ? 'Rot-Schwarz-Baum: Wert einfügen'
          : taskTypeId === 'dsal_btree_insert'
          ? 'B-Baum: Wert einfügen'
          : taskTypeId === 'dsal_bst_delete'
          ? 'BST: Wert löschen'
          : taskTypeId === 'dsal_avl_delete'
          ? 'AVL-Baum: Wert löschen'
          : taskTypeId === 'dsal_rb_delete'
          ? 'Rot-Schwarz-Baum: Wert löschen'
          : taskTypeId === 'dsal_btree_delete'
          ? 'B-Baum: Wert löschen'
          : taskTypeId === 'dsal_sort_bubble'
          ? 'Bubblesort'
          : taskTypeId === 'dsal_sort_insertion'
          ? 'Insertionsort'
          : taskTypeId === 'dsal_sort_selection'
          ? 'Selectionsort'
          : taskTypeId === 'dsal_sort_quick'
          ? 'Quicksort'
          : taskTypeId === 'dsal_sort_merge'
          ? 'Mergesort'
          : taskTypeId === 'dsal_sort_heap'
          ? 'Heapsort'
          : taskTypeId === 'dsal_sort_counting'
          ? 'Countingsort'
          : taskTypeId === 'dsal_sort_bucket'
          ? 'Bucketsort'
          : taskTypeId === 'dsal_graph_bfs'
          ? 'Breitensuche (BFS)'
          : taskTypeId === 'dsal_graph_dfs'
          ? 'Tiefensuche (DFS)'
          : taskTypeId === 'dsal_graph_topo'
          ? 'Topologische Sortierung'
          : taskTypeId === 'dsal_graph_dijkstra'
          ? 'Dijkstra'
          : taskTypeId === 'dsal_graph_bellmanford'
          ? 'Bellman-Ford'
          : taskTypeId === 'dsal_graph_prim'
          ? 'Prim (Minimalbaum)'
          : taskTypeId === 'dsal_graph_kruskal'
          ? 'Kruskal (Minimalbaum)'
          : taskTypeId === 'dsal_graph_unionfind'
          ? 'Union-Find'
          : taskTypeId === 'dsal_graph_kosaraju'
          ? 'Kosaraju-Sharir'
          : taskTypeId === 'dsal_graph_floydwarshall'
          ? 'Floyd-Warshall'
          : taskTypeId === 'dsal_hash_div_open'
          ? 'Hashing: Division + Verkettung'
          : taskTypeId === 'dsal_hash_div_linear'
          ? 'Hashing: Division + lineare Sondierung'
          : taskTypeId === 'dsal_hash_div_quadratic'
          ? 'Hashing: Division + quadratische Sondierung'
          : taskTypeId === 'dsal_hash_mul_open'
          ? 'Hashing: Multiplikation + Verkettung'
          : taskTypeId === 'dsal_hash_mul_linear'
          ? 'Hashing: Multiplikation + lineare Sondierung'
          : taskTypeId === 'dsal_hash_mul_quadratic'
          ? 'Hashing: Multiplikation + quadratische Sondierung'
          : taskTypeId === 'dsal_opt_knapsack'
          ? 'Rucksackproblem (DP)'
          : taskTypeId === 'dsal_opt_lcs'
          ? 'Längste gemeinsame Teilfolge (DP)'
          : taskTypeId === 'dsal_opt_simplex'
          ? 'Simplex-Algorithmus'
          : 'Aufgabe',
        module: isLinAlg
          ? 'Lineare Algebra'
          : isDSAL
          ? 'Algorithmen & Datenstrukturen'
          : taskTypeId.startsWith('os')
          ? 'Betriebssysteme'
          : 'Allgemein'
      }
    });

    // Create the SolvedTask record linked to the user
    await prisma.solvedTask.create({
      data: {
        userId: req.user.userId,
        taskTypeId: taskType.id,
        outcome: resolvedOutcome,
        points: resolvedPoints,
      }
    });

    // Count new score for this user (only genuine solves count toward the leaderboard)
    const solvedCount = await prisma.solvedTask.count({
      where: { userId: req.user.userId, outcome: 'solved' }
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
            outcome: true,
            points: true,
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
      // Points already encode what counts: genuine solves (outcome "solved")
      // and self-reported-correct reveals (outcome "revealed", correct:true)
      // both carry points = 1. Summing points therefore includes both.
      const solvedCount = user.solvedTasks.reduce((sum, s) => sum + s.points, 0);
      const revealedCount = user.solvedTasks.filter((s) => s.outcome === 'revealed').length;
      const lastSolvedModule = user.solvedTasks
        .filter((s) => s.points > 0)
        .slice(-1)[0]?.taskType.module || 'Keines';
      
      return {
        username: user.username,
        displayName: user.displayName || user.username,
        profilePic: user.profilePic,
        solvedCount,
        revealedCount,
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

/**
 * Retrieve the Elo leaderboard. Optional ?module=lin_alg|os|formal_sys|algo_struct
 * selects the per-module Elo column; without it the general `elo` is used.
 */
export const getEloLeaderboard = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { module } = req.query;

    const eloField = (() => {
      switch (String(module || '')) {
        case 'lin_alg': return 'eloLinAlg';
        case 'os': return 'eloOs';
        case 'formal_sys': return 'eloFormalSys';
        case 'algo_struct': return 'eloAlgoStruct';
        default: return 'elo';
      }
    })();

    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        displayName: true,
        profilePic: true,
        elo: true,
        eloLinAlg: true,
        eloOs: true,
        eloFormalSys: true,
        eloAlgoStruct: true,
        duelWins: true,
        duelLosses: true,
      },
    });

    const leaderboard = users
      .map((user) => ({
        username: user.username,
        displayName: user.displayName || user.username,
        profilePic: user.profilePic,
        elo: user[eloField as keyof typeof user] as number,
        eloLinAlg: user.eloLinAlg,
        eloOs: user.eloOs,
        eloFormalSys: user.eloFormalSys,
        eloAlgoStruct: user.eloAlgoStruct,
        duelWins: user.duelWins,
        duelLosses: user.duelLosses,
        isUser: req.user ? req.user.userId === user.id : false,
      }))
      .filter((item) => item.elo > 0 || item.isUser)
      .sort((a, b) => b.elo - a.elo);

    res.json(leaderboard);
  } catch (error) {
    next(error);
  }
};
