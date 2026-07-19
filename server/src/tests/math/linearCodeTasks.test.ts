import { describe, it, expect } from 'vitest';
import {
  generateParityCheckMatrix,
  generateNearestNeighborDecoding,
} from '../../services/math/linearCodeTasks';

describe('Linear Codes Task Generators', () => {
  it('should generate valid parity check matrix task', () => {
    const task = generateParityCheckMatrix();
    expect(task.type).toBe('calc_linear_code_parity_check');
    expect(task.mathQuery).toContain('begin{pmatrix}');
    expect(task.answer).toContain('[');
  });

  it('should generate valid nearest neighbor decoding task with unique nearest codeword', () => {
    for (let i = 0; i < 20; i++) {
      const task = generateNearestNeighborDecoding();
      expect(task.type).toBe('calc_linear_code_nearest_neighbor');
      expect(task.mathQuery).toContain('begin{pmatrix}');
      expect(task.answer).not.toContain('|');
      expect(task.answer.split(',').length).toBeGreaterThanOrEqual(4);
    }
  });
});
