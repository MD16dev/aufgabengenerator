import { taskGenerators } from '../math/registry';

/**
 * Metadata describing how a task type participates in an exam.
 * `category` groups tasks into meaningful exam sections; `workloadMin` is the
 * estimated working time for one instance of the task; `maxPoints` is the points
 * it contributes to the exam total. `autoGraded` mirrors the client's
 * `isAutoGraded` rule: a task is auto-graded when it carries an `answer` or
 * `choices` field (so the system can check it), otherwise the user grades it
 * manually against the model solution.
 */
export interface ExamTaskMeta {
  taskTypeId: string;
  category: string;
  workloadMin: number;
  maxPoints: number;
  autoGraded: boolean;
}

/**
 * Per-task-type metadata. Workload and points are heuristic initial estimates
 * and can be tuned later. Categories group related tasks into exam sections.
 */
const TASK_META: Record<string, Omit<ExamTaskMeta, 'taskTypeId'>> = {
  // ---- Lineare Algebra ----
  'lin_alg_det': { category: 'Determinanten', workloadMin: 3, maxPoints: 2, autoGraded: true },
  'lin_alg_det3x3': { category: 'Determinanten', workloadMin: 4, maxPoints: 2, autoGraded: true },
  'lin_alg_matmul': { category: 'Matrizen', workloadMin: 4, maxPoints: 2, autoGraded: true },
  'calc_gl_n_cardinality': { category: 'Endliche Körper', workloadMin: 5, maxPoints: 3, autoGraded: true },
  'calc_param_determinant_finite_field': { category: 'Endliche Körper', workloadMin: 6, maxPoints: 3, autoGraded: true },
  'calc_poly_mapping_matrix': { category: 'Lineare Abbildungen', workloadMin: 6, maxPoints: 3, autoGraded: true },
  'calc_eigenbasis': { category: 'Eigenwerte & Eigenräume', workloadMin: 7, maxPoints: 4, autoGraded: true },
  'calc_linear_code_parameters': { category: 'Lineare Codes', workloadMin: 6, maxPoints: 3, autoGraded: true },
  'calc_param_matrix_invertible': { category: 'Matrizen über F_p', workloadMin: 5, maxPoints: 3, autoGraded: true },
  'calc_param_matrix_rank': { category: 'Matrizen über F_p', workloadMin: 5, maxPoints: 3, autoGraded: true },
  'calc_param_matrix_kernel': { category: 'Matrizen über F_p', workloadMin: 6, maxPoints: 3, autoGraded: true },
  'calc_param_matrix_solution_count': { category: 'Matrizen über F_p', workloadMin: 6, maxPoints: 3, autoGraded: true },
  'calc_poly_apply': { category: 'Lineare Abbildungen', workloadMin: 5, maxPoints: 3, autoGraded: true },
  'calc_poly_image_basis': { category: 'Lineare Abbildungen', workloadMin: 6, maxPoints: 3, autoGraded: true },
  'calc_poly_defect': { category: 'Lineare Abbildungen', workloadMin: 5, maxPoints: 3, autoGraded: true },
  'calc_poly_composition': { category: 'Lineare Abbildungen', workloadMin: 6, maxPoints: 3, autoGraded: true },
  'calc_charpoly_expanded': { category: 'Eigenwerte & Eigenräume', workloadMin: 5, maxPoints: 3, autoGraded: true },
  'calc_charpoly_factored': { category: 'Eigenwerte & Eigenräume', workloadMin: 5, maxPoints: 3, autoGraded: true },
  'calc_eigenvalues': { category: 'Eigenwerte & Eigenräume', workloadMin: 5, maxPoints: 3, autoGraded: true },
  'calc_eigenspace': { category: 'Eigenwerte & Eigenräume', workloadMin: 6, maxPoints: 3, autoGraded: true },
  'calc_diagonalizable': { category: 'Eigenwerte & Eigenräume', workloadMin: 6, maxPoints: 3, autoGraded: true },
  'calc_linear_code_parity_check': { category: 'Lineare Codes', workloadMin: 5, maxPoints: 3, autoGraded: true },
  'calc_linear_code_nearest_neighbor': { category: 'Lineare Codes', workloadMin: 5, maxPoints: 3, autoGraded: true },
  'calc_field_vecspace_size': { category: 'Endliche Körper', workloadMin: 4, maxPoints: 2, autoGraded: true },
  'calc_field_symmetric_count': { category: 'Endliche Körper', workloadMin: 4, maxPoints: 2, autoGraded: true },
  'calc_field_rref_rank_count': { category: 'Endliche Körper', workloadMin: 4, maxPoints: 2, autoGraded: true },
  'calc_matrix_inverse_field': { category: 'Matrizen über F_p', workloadMin: 5, maxPoints: 3, autoGraded: true },
  'calc_preimage_field': { category: 'Lineare Abbildungen', workloadMin: 6, maxPoints: 3, autoGraded: true },

  // ---- Algorithmen & Datenstrukturen ----
  // Auto-graded DSAL tasks (carry an `answer`): hashing, optimization.
  'dsal_hash_div_open': { category: 'Hashverfahren', workloadMin: 5, maxPoints: 3, autoGraded: true },
  'dsal_hash_div_linear': { category: 'Hashverfahren', workloadMin: 5, maxPoints: 3, autoGraded: true },
  'dsal_hash_div_quadratic': { category: 'Hashverfahren', workloadMin: 5, maxPoints: 3, autoGraded: true },
  'dsal_hash_mul_open': { category: 'Hashverfahren', workloadMin: 5, maxPoints: 3, autoGraded: true },
  'dsal_hash_mul_linear': { category: 'Hashverfahren', workloadMin: 5, maxPoints: 3, autoGraded: true },
  'dsal_hash_mul_quadratic': { category: 'Hashverfahren', workloadMin: 5, maxPoints: 3, autoGraded: true },
  'dsal_opt_knapsack': { category: 'Dynamische Optimierung', workloadMin: 6, maxPoints: 3, autoGraded: true },
  'dsal_opt_lcs': { category: 'Dynamische Optimierung', workloadMin: 6, maxPoints: 3, autoGraded: true },
  'dsal_opt_simplex': { category: 'Lineare Optimierung', workloadMin: 7, maxPoints: 4, autoGraded: true },
  // Manually graded DSAL tasks (tree/graph/sort — no `answer`): user grades.
  'dsal_bst_insert': { category: 'Bäume', workloadMin: 6, maxPoints: 3, autoGraded: false },
  'dsal_bst_delete': { category: 'Bäume', workloadMin: 7, maxPoints: 3, autoGraded: false },
  'dsal_avl_insert': { category: 'Bäume', workloadMin: 8, maxPoints: 4, autoGraded: false },
  'dsal_avl_delete': { category: 'Bäume', workloadMin: 9, maxPoints: 4, autoGraded: false },
  'dsal_rb_insert': { category: 'Bäume', workloadMin: 9, maxPoints: 4, autoGraded: false },
  'dsal_rb_delete': { category: 'Bäume', workloadMin: 10, maxPoints: 4, autoGraded: false },
  'dsal_btree_insert': { category: 'Bäume', workloadMin: 8, maxPoints: 4, autoGraded: false },
  'dsal_btree_delete': { category: 'Bäume', workloadMin: 9, maxPoints: 4, autoGraded: false },
  'dsal_sort_bubble': { category: 'Sortierverfahren', workloadMin: 4, maxPoints: 2, autoGraded: false },
  'dsal_sort_insertion': { category: 'Sortierverfahren', workloadMin: 4, maxPoints: 2, autoGraded: false },
  'dsal_sort_selection': { category: 'Sortierverfahren', workloadMin: 4, maxPoints: 2, autoGraded: false },
  'dsal_sort_quick': { category: 'Sortierverfahren', workloadMin: 6, maxPoints: 3, autoGraded: false },
  'dsal_sort_merge': { category: 'Sortierverfahren', workloadMin: 6, maxPoints: 3, autoGraded: false },
  'dsal_sort_heap': { category: 'Sortierverfahren', workloadMin: 6, maxPoints: 3, autoGraded: false },
  'dsal_sort_counting': { category: 'Sortierverfahren', workloadMin: 5, maxPoints: 3, autoGraded: false },
  'dsal_sort_bucket': { category: 'Sortierverfahren', workloadMin: 5, maxPoints: 3, autoGraded: false },
  'dsal_graph_bfs': { category: 'Graphenalgorithmen', workloadMin: 5, maxPoints: 3, autoGraded: false },
  'dsal_graph_dfs': { category: 'Graphenalgorithmen', workloadMin: 5, maxPoints: 3, autoGraded: false },
  'dsal_graph_topo': { category: 'Graphenalgorithmen', workloadMin: 5, maxPoints: 3, autoGraded: false },
  'dsal_graph_dijkstra': { category: 'Graphenalgorithmen', workloadMin: 7, maxPoints: 4, autoGraded: false },
  'dsal_graph_bellmanford': { category: 'Graphenalgorithmen', workloadMin: 7, maxPoints: 4, autoGraded: false },
  'dsal_graph_prim': { category: 'Graphenalgorithmen', workloadMin: 6, maxPoints: 3, autoGraded: false },
  'dsal_graph_kruskal': { category: 'Graphenalgorithmen', workloadMin: 6, maxPoints: 3, autoGraded: false },
  'dsal_graph_unionfind': { category: 'Graphenalgorithmen', workloadMin: 5, maxPoints: 3, autoGraded: false },
  'dsal_graph_kosaraju': { category: 'Graphenalgorithmen', workloadMin: 7, maxPoints: 4, autoGraded: false },
  'dsal_graph_floydwarshall': { category: 'Graphenalgorithmen', workloadMin: 7, maxPoints: 4, autoGraded: false },
};

/** Map a module id to the task types that belong to it. */
function taskTypesForModule(moduleId: string): string[] {
  const ids = Object.keys(TASK_META);
  switch (moduleId) {
    case 'lin_alg':
      return ids.filter((id) => id.startsWith('lin_alg') || id.startsWith('calc_'));
    case 'algo_struct':
      return ids.filter((id) => id.startsWith('dsal_'));
    // BUS / FOSAP are not yet implemented for exam mode.
    default:
      return [];
  }
}

export interface ExamPlanItem {
  taskTypeId: string;
  category: string;
  workloadMin: number;
  autoGraded: boolean;
  maxPoints: number;
}

/**
 * Build an exam plan for the given module and duration.
 *
 * Strategy:
 *  - We aim to fill a target working time that is slightly below the real-time
 *    limit (e.g. 80%) so the exam feels like a real Klausur with time pressure.
 *  - Tasks are drawn randomly (without replacement) from the module's pool.
 *  - The NUMBER of tasks taken from each category is roughly proportional to
 *    that category's pool size (so no category is over- or under-represented),
 *    with a small random jitter of ±1 task. Within each category the chosen
 *    tasks are randomly shuffled, so both WHICH tasks and HOW MANY per category
 *    are random while proportions stay balanced.
 *  - The final plan is sorted by category (grouped by Themenbereich), keeping
 *    the random selection order within each category.
 *  - Each selected task is verified to actually exist in the registry.
 */
export function buildExamPlan(moduleId: string, durationMin: number): ExamPlanItem[] {
  const pool = taskTypesForModule(moduleId);
  if (pool.length === 0) {
    throw new Error('Für dieses Modul ist der Prüfungsmodus noch nicht verfügbar.');
  }

  // Verify every candidate actually has a generator registered.
  const available = pool.filter((id) => typeof taskGenerators[id] === 'function');
  if (available.length === 0) {
    throw new Error('Keine Aufgaben für dieses Modul verfügbar.');
  }

  // Target working time: 80% of the real-time limit leaves room for pressure.
  const targetWorkload = Math.max(5, Math.round(durationMin * 0.8));

  // Group available task ids by category.
  const byCategory = new Map<string, string[]>();
  for (const id of available) {
    const cat = TASK_META[id].category;
    if (!byCategory.has(cat)) byCategory.set(cat, []);
    byCategory.get(cat)!.push(id);
  }

  // Shuffle each category's pool so the chosen tasks are random.
  for (const ids of byCategory.values()) {
    for (let i = ids.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [ids[i], ids[j]] = [ids[j], ids[i]];
    }
  }

  // Determine a desired total task count from the workload target and the
  // average workload per task, so the exam roughly fills the target time.
  const avgWorkload =
    available.reduce((sum, id) => sum + TASK_META[id].workloadMin, 0) / available.length;
  const desiredTotal = Math.max(
    byCategory.size, // every category gets at least one task if possible
    Math.ceil(targetWorkload / avgWorkload),
  );

  const totalPoolSize = available.length;
  const categories = [...byCategory.keys()];

  // Assign each category a quota roughly proportional to its pool size, with a
  // small random jitter of ±1 task. Every category with tasks gets at least 1
  // (when the exam is large enough), and no category dominates.
  const quotas = new Map<string, number>();
  let assigned = 0;
  categories.forEach((cat, idx) => {
    const poolSize = byCategory.get(cat)!.length;
    let quota = Math.max(1, Math.round((poolSize / totalPoolSize) * desiredTotal));
    // Apply a small random jitter of ±1 (but keep at least 1).
    const jitter = Math.floor(Math.random() * 3) - 1; // -1, 0, or +1
    quota = Math.max(1, quota + jitter);
    // Never take more than the category actually offers.
    quota = Math.min(quota, poolSize);
    // On the last category, absorb any remaining budget so we don't overshoot
    // the desired total by too much.
    if (idx === categories.length - 1) {
      const remainingBudget = Math.max(0, desiredTotal - assigned);
      quota = Math.min(quota, poolSize, remainingBudget + 1);
    }
    quotas.set(cat, quota);
    assigned += quota;
  });

  // Collect the chosen tasks, then fill up to the workload target if needed.
  const chosen: string[] = [];
  for (const cat of categories) {
    const ids = byCategory.get(cat)!;
    const quota = quotas.get(cat)!;
    chosen.push(...ids.slice(0, quota));
  }

  // Build the plan, accumulating workload and topping up if we're short.
  const plan: ExamPlanItem[] = [];
  let accumulated = 0;

  const pushItem = (id: string) => {
    const meta = TASK_META[id];
    plan.push({
      taskTypeId: id,
      category: meta.category,
      workloadMin: meta.workloadMin,
      autoGraded: meta.autoGraded,
      maxPoints: meta.maxPoints,
    });
    accumulated += meta.workloadMin;
  };

  // First pass: respect the per-category quotas (already grouped by category).
  for (const id of chosen) {
    pushItem(id);
  }

  // Top-up pass: if we haven't reached the target workload, draw additional
  // random tasks (still grouped by category) until we do or run out.
  if (accumulated < targetWorkload) {
    for (const cat of categories) {
      const ids = byCategory.get(cat)!;
      const quota = quotas.get(cat)!;
      for (let k = quota; k < ids.length && accumulated < targetWorkload; k++) {
        pushItem(ids[k]);
      }
      if (accumulated >= targetWorkload) break;
    }
  }

  // Sort the final plan by category (grouped by Themenbereich), preserving the
  // random selection order within each category.
  plan.sort((a, b) => {
    if (a.category === b.category) return 0;
    return a.category < b.category ? -1 : 1;
  });

  return plan;
}

export interface ExamGrade {
  scorePct: number;
  grade: number;
  passed: boolean;
}

/**
 * German university grading table (1.0 = best, 5.0 = failed).
 * Boundaries are inclusive on the lower edge, exclusive on the upper edge,
 * matching the spec: 100–94.9 → 1.0, <94.9–89.5 → 1.3, … <50 → 5.0.
 */
export function gradeFromPercentage(scorePct: number): ExamGrade {
  const pct = Math.max(0, Math.min(100, scorePct));
  let grade: number;
  if (pct >= 94.9) grade = 1.0;
  else if (pct >= 89.5) grade = 1.3;
  else if (pct >= 84.3) grade = 1.7;
  else if (pct >= 79.0) grade = 2.0;
  else if (pct >= 73.7) grade = 2.3;
  else if (pct >= 68.2) grade = 2.7;
  else if (pct >= 63.1) grade = 3.0;
  else if (pct >= 57.9) grade = 3.3;
  else if (pct >= 52.6) grade = 3.7;
  else if (pct >= 50.0) grade = 4.0;
  else grade = 5.0;

  return { scorePct: pct, grade, passed: grade < 5.0 };
}
