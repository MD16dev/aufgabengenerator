import { describe, it, expect } from 'vitest';
import {
  generateMatrixInverseField,
  generatePreimageField,
} from '../../services/math/matrixInverseField';

describe('Matrix Inverse and Preimage over Finite Fields Generators', () => {
  it('should generate valid matrix inverse task', () => {
    const task = generateMatrixInverseField();
    expect(task.type).toBe('calc_matrix_inverse_field');
    expect(task.mathQuery).toContain('A^{-1}');
    expect(task.answer).toContain('[');
    expect(task.explanation.join(' ')).toContain('\\left(\\begin{array}');
  });

  it('should generate valid preimage task', () => {
    const task = generatePreimageField();
    expect(task.type).toBe('calc_preimage_field');
    expect(task.mathQuery).toContain('\\varphi^{-1}');
    expect(task.answer).toContain('[');
  });
});
