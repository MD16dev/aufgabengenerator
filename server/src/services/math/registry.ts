import { TaskData } from './types';
import { generateDeterminant, generateDeterminant3x3 } from './determinant';
import { generateMatrixMultiplication } from './matrixMultiplication';
import { generateGLnCardinality } from './glCardinality';
import { generateParamDeterminantFiniteField } from './paramDeterminant';
import { generatePolyMappingMatrix } from './polyMappingMatrix';
import { generateEigenbasis } from './eigenbasis';
import { generateLinearCodeParameters } from './linearCodeParameters';

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
  // ...new task types go here
};

export function getTaskGenerator(type: string): (() => TaskData) | undefined {
  return taskGenerators[type];
}
