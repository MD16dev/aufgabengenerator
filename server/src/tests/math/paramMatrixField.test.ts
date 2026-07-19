import { describe, it, expect } from 'vitest';
import {
  generateParamMatrixInvertible,
  generateParamMatrixRank,
  generateParamMatrixKernel,
  generateParamMatrixSolutionCount,
} from '../../services/math/paramMatrixField';

describe('Parameterised Matrix over F_p Generators', () => {
  it('should generate valid invertible task', () => {
    const task = generateParamMatrixInvertible();
    expect(task.type).toBe('calc_param_matrix_invertible');
    expect(task.mathQuery).toContain('begin{pmatrix}');
    expect(task.answer).toMatch(/^\{[\d,]*\}$/);
    expect(Array.isArray(task.explanation)).toBe(true);
  });

  it('should generate valid rank task', () => {
    const task = generateParamMatrixRank();
    expect(task.type).toBe('calc_param_matrix_rank');
    expect(task.mathQuery).toContain('begin{pmatrix}');
    const rankVal = parseInt(task.answer, 10);
    expect(rankVal).toBeGreaterThanOrEqual(0);
    expect(rankVal).toBeLessThanOrEqual(3);
  });

  it('should generate valid kernel task', () => {
    const task = generateParamMatrixKernel();
    expect(task.type).toBe('calc_param_matrix_kernel');
    expect(task.mathQuery).toContain('begin{pmatrix}');
    expect(task.answer).toContain('[');
  });

  it('should generate valid solution count task', () => {
    const task = generateParamMatrixSolutionCount();
    expect(task.type).toBe('calc_param_matrix_solution_count');
    expect(task.mathQuery).toContain('begin{pmatrix}');
    const countVal = parseInt(task.answer, 10);
    expect([0, 1, 3, 5, 7, 9, 25, 27, 49, 125, 243, 343]).toContain(countVal);
  });
});
