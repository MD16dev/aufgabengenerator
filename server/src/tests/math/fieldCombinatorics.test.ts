import { describe, it, expect } from 'vitest';
import {
  generateVectorSpaceSize,
  generateSymmetricMatrixCount,
  generateRREFRankCount,
} from '../../services/math/fieldCombinatorics';

describe('Field Combinatorics Task Generators', () => {
  it('should generate valid vector space size task', () => {
    const task = generateVectorSpaceSize();
    expect(task.type).toBe('calc_field_vecspace_size');
    expect(task.mathQuery).toContain('\\mathbb{F}');
    const val = parseInt(task.answer, 10);
    expect(val).toBeGreaterThan(0);
  });

  it('should generate valid symmetric matrix count task', () => {
    const task = generateSymmetricMatrixCount();
    expect(task.type).toBe('calc_field_symmetric_count');
    expect(task.mathQuery).toContain('A^{T} = A');
    const val = parseInt(task.answer, 10);
    expect(val).toBeGreaterThan(0);
  });

  it('should generate valid RREF rank count task', () => {
    const task = generateRREFRankCount();
    expect(task.type).toBe('calc_field_rref_rank_count');
    expect(task.mathQuery).toContain('\\operatorname{rank}');
    const val = parseInt(task.answer, 10);
    expect(val).toBeGreaterThan(0);
  });
});
