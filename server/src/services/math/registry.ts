import { TaskData } from './types';
import { generateDeterminant, generateDeterminant3x3 } from './determinant';
import { generateMatrixMultiplication } from './matrixMultiplication';
import { generateGLnCardinality } from './glCardinality';
import { generateParamDeterminantFiniteField } from './paramDeterminant';
import { generatePolyMappingMatrix } from './polyMappingMatrix';
import { generateEigenbasis } from './eigenbasis';
import { generateLinearCodeParameters } from './linearCodeParameters';
import {
  generateParamMatrixInvertible,
  generateParamMatrixRank,
  generateParamMatrixKernel,
  generateParamMatrixSolutionCount,
} from './paramMatrixField';
import {
  generatePolyApply,
  generatePolyImageBasis,
  generatePolyDefect,
  generatePolyComposition,
} from './polyMappingTasks';
import {
  generateCharPolyExpanded,
  generateCharPolyFactored,
  generateEigenvalues,
  generateEigenspace,
  generateDiagonalizable,
} from './eigenTasks';
import {
  generateParityCheckMatrix,
  generateNearestNeighborDecoding,
} from './linearCodeTasks';
import {
  generateVectorSpaceSize,
  generateSymmetricMatrixCount,
  generateRREFRankCount,
} from './fieldCombinatorics';
import {
  generateMatrixInverseField,
  generatePreimageField,
} from './matrixInverseField';
import { generateBusAnkiTask } from './osBusAnki';
import { generatePageTableTask } from './osPageTable';
import { generateSchedulingGanttTask } from './osSchedulingGantt';
import { generateSchedulingWaitTask } from './osSchedulingWait';
import { generateBSTInsertion, generateBSTDeletion } from '../dsal/bst';
import { generateAVLInsertion, generateAVLDeletion } from '../dsal/avl';
import { generateRedBlackInsertion, generateRedBlackDeletion } from '../dsal/redblack';
import { generateBTreeInsertion, generateBTreeDeletion } from '../dsal/btree';
import {
  generateBubbleSort,
  generateInsertionSort,
  generateSelectionSort,
  generateQuickSort,
  generateMergeSort,
  generateHeapSort,
  generateCountingSort,
  generateBucketSort,
} from '../dsal/sorting';
import {
  generateBFS,
  generateDFS,
  generateTopoSort,
  generateDijkstra,
  generateBellmanFord,
  generatePrim,
  generateKruskal,
  generateUnionFind,
  generateKosaraju,
  generateFloydWarshall,
} from '../dsal/graphs';
import {
  generateHashingDivisionOpen,
  generateHashingDivisionLinear,
  generateHashingDivisionQuadratic,
  generateHashingMultiplicationOpen,
  generateHashingMultiplicationLinear,
  generateHashingMultiplicationQuadratic,
} from '../dsal/hashing';
import {
  generateKnapsack,
  generateLCS,
  generateSimplex,
} from '../dsal/optimization';

/**
 * Registry mapping a task type id (sent by the frontend) to its generator
 * function. To add a new task type, implement the generator in its own module
 * and register it here — no controller or route changes required.
 */
export const taskGenerators: Record<string, () => TaskData | Promise<TaskData>> = {
  'lin_alg_det': generateDeterminant,
  'lin_alg_det3x3': generateDeterminant3x3,
  'lin_alg_matmul': generateMatrixMultiplication,
  'calc_gl_n_cardinality': generateGLnCardinality,
  'calc_param_determinant_finite_field': generateParamDeterminantFiniteField,
  'calc_poly_mapping_matrix': generatePolyMappingMatrix,
  'calc_eigenbasis': generateEigenbasis,
  'calc_linear_code_parameters': generateLinearCodeParameters,
  // LA — parametrisierte Matrizen über F_p (Kategorie 1)
  'calc_param_matrix_invertible': generateParamMatrixInvertible,
  'calc_param_matrix_rank': generateParamMatrixRank,
  'calc_param_matrix_kernel': generateParamMatrixKernel,
  'calc_param_matrix_solution_count': generateParamMatrixSolutionCount,
  // LA — lineare Abbildungen auf Polynomräumen (Kategorie 2)
  'calc_poly_apply': generatePolyApply,
  'calc_poly_image_basis': generatePolyImageBasis,
  'calc_poly_defect': generatePolyDefect,
  'calc_poly_composition': generatePolyComposition,
  // LA — Eigenwerte, Eigenvektoren, Diagonalisierbarkeit (Kategorie 3)
  'calc_charpoly_expanded': generateCharPolyExpanded,
  'calc_charpoly_factored': generateCharPolyFactored,
  'calc_eigenvalues': generateEigenvalues,
  'calc_eigenspace': generateEigenspace,
  'calc_diagonalizable': generateDiagonalizable,
  // LA — lineare Codes (Kategorie 4)
  'calc_linear_code_parity_check': generateParityCheckMatrix,
  'calc_linear_code_nearest_neighbor': generateNearestNeighborDecoding,
  // LA — Kombinatorik über F_q (Kategorie 5)
  'calc_field_vecspace_size': generateVectorSpaceSize,
  'calc_field_symmetric_count': generateSymmetricMatrixCount,
  'calc_field_rref_rank_count': generateRREFRankCount,
  // LA — Matrizeninversion & Basiswechsel über F_p (Kategorie 6)
  'calc_matrix_inverse_field': generateMatrixInverseField,
  'calc_preimage_field': generatePreimageField,
  'os_bus_anki': generateBusAnkiTask,
  'os_page_table': generatePageTableTask,
  'os_scheduling_gantt': generateSchedulingGanttTask,
  'os_scheduling_wait': generateSchedulingWaitTask,
  // DSAL — Algorithmen & Datenstrukturen (translated from exercisegenerator)
  'dsal_bst_insert': generateBSTInsertion,
  'dsal_bst_delete': generateBSTDeletion,
  'dsal_avl_insert': generateAVLInsertion,
  'dsal_avl_delete': generateAVLDeletion,
  'dsal_rb_insert': generateRedBlackInsertion,
  'dsal_rb_delete': generateRedBlackDeletion,
  'dsal_btree_insert': generateBTreeInsertion,
  'dsal_btree_delete': generateBTreeDeletion,
  // DSAL — sorting (translated from exercisegenerator)
  'dsal_sort_bubble': generateBubbleSort,
  'dsal_sort_insertion': generateInsertionSort,
  'dsal_sort_selection': generateSelectionSort,
  'dsal_sort_quick': generateQuickSort,
  'dsal_sort_merge': generateMergeSort,
  'dsal_sort_heap': generateHeapSort,
  'dsal_sort_counting': generateCountingSort,
  'dsal_sort_bucket': generateBucketSort,
  // DSAL — graph algorithms (translated from exercisegenerator)
  'dsal_graph_bfs': generateBFS,
  'dsal_graph_dfs': generateDFS,
  'dsal_graph_topo': generateTopoSort,
  'dsal_graph_dijkstra': generateDijkstra,
  'dsal_graph_bellmanford': generateBellmanFord,
  'dsal_graph_prim': generatePrim,
  'dsal_graph_kruskal': generateKruskal,
  'dsal_graph_unionfind': generateUnionFind,
  'dsal_graph_kosaraju': generateKosaraju,
  'dsal_graph_floydwarshall': generateFloydWarshall,
  // DSAL — hashing (translated from exercisegenerator)
  'dsal_hash_div_open': generateHashingDivisionOpen,
  'dsal_hash_div_linear': generateHashingDivisionLinear,
  'dsal_hash_div_quadratic': generateHashingDivisionQuadratic,
  'dsal_hash_mul_open': generateHashingMultiplicationOpen,
  'dsal_hash_mul_linear': generateHashingMultiplicationLinear,
  'dsal_hash_mul_quadratic': generateHashingMultiplicationQuadratic,
  // DSAL — optimization (dynamic programming + linear programming)
  'dsal_opt_knapsack': generateKnapsack,
  'dsal_opt_lcs': generateLCS,
  'dsal_opt_simplex': generateSimplex,
  // ...new task types go here
};

export function getTaskGenerator(type: string): (() => TaskData | Promise<TaskData>) | undefined {
  return taskGenerators[type];
}
