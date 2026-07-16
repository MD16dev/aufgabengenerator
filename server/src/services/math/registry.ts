import { TaskData } from './types';
import { generateDeterminant } from './determinant';

/**
 * Registry mapping a task type id (sent by the frontend) to its generator
 * function. To add a new task type, implement the generator in its own module
 * and register it here — no controller or route changes required.
 */
export const taskGenerators: Record<string, () => TaskData> = {
  'lin_alg_det': generateDeterminant,
  // 'lin_alg_det3x3': generateDeterminant3x3,
  // 'os_page_table': generatePageTable,
  // ...new task types go here
};

export function getTaskGenerator(type: string): (() => TaskData) | undefined {
  return taskGenerators[type];
}
