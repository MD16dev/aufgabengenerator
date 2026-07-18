import { TaskData } from './types';
import { generateDeterminant, generateDeterminant3x3 } from './determinant';
import { generateMatrixMultiplication } from './matrixMultiplication';
import { generateGLnCardinality } from './glCardinality';
import { generateParamDeterminantFiniteField } from './paramDeterminant';
import { generatePolyMappingMatrix } from './polyMappingMatrix';
import { generateEigenbasis } from './eigenbasis';
import { generateLinearCodeParameters } from './linearCodeParameters';
import { generateBSTInsertion } from '../dsal/bst';
import { generateAVLInsertion } from '../dsal/avl';
import { generateRedBlackInsertion } from '../dsal/redblack';
import { generateBTreeInsertion } from '../dsal/btree';
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

/**
 * Registry mapping a task type id (sent by the frontend) to its generator
 * function. To add a new task type, implement the generator in its own module
 * and register it here — no controller or route changes required.
 */
export const taskGenerators: Record<string, () => TaskData> = {
  'lin_alg_det': generateDeterminant,
  'lin_alg_det3x3': generateDeterminant3x3,
  'lin_alg_matmul': generateMatrixMultiplication,
  'calc_gl_n_cardinality': generateGLnCardinality,
  'calc_param_determinant_finite_field': generateParamDeterminantFiniteField,
  'calc_poly_mapping_matrix': generatePolyMappingMatrix,
  'calc_eigenbasis': generateEigenbasis,
  'calc_linear_code_parameters': generateLinearCodeParameters,
  // 'os_page_table': generatePageTable,
  // DSAL — Algorithmen & Datenstrukturen (translated from exercisegenerator)
  'dsal_bst_insert': generateBSTInsertion,
  'dsal_avl_insert': generateAVLInsertion,
  'dsal_rb_insert': generateRedBlackInsertion,
  'dsal_btree_insert': generateBTreeInsertion,
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
  // ...new task types go here
};

export function getTaskGenerator(type: string): (() => TaskData) | undefined {
  return taskGenerators[type];
}
