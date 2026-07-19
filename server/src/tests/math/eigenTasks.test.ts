import { describe, it, expect } from 'vitest';
import {
  generateCharPolyExpanded,
  generateCharPolyFactored,
  generateEigenvalues,
  generateEigenspace,
  generateDiagonalizable,
} from '../../services/math/eigenTasks';

describe('Eigenvalues & Eigenvectors Task Generators', () => {
  it('should generate valid charpoly expanded task', () => {
    const task = generateCharPolyExpanded();
    expect(task.type).toBe('calc_charpoly_expanded');
    expect(task.mathQuery).toContain('begin{pmatrix}');
    expect(task.answer).toContain('X^3');
  });

  it('should generate valid charpoly factored task', () => {
    const task = generateCharPolyFactored();
    expect(task.type).toBe('calc_charpoly_factored');
    expect(task.mathQuery).toContain('begin{pmatrix}');
    expect(task.answer).toContain('(X');
  });

  it('should generate valid eigenvalues task', () => {
    const task = generateEigenvalues();
    expect(task.type).toBe('calc_eigenvalues');
    expect(task.mathQuery).toContain('begin{pmatrix}');
    expect(task.answer).toMatch(/^(-?\d+ \(\d+\))(, -?\d+ \(\d+\))*$/);
  });

  it('should generate valid eigenspace task', () => {
    const task = generateEigenspace();
    expect(task.type).toBe('calc_eigenspace');
    expect(task.mathQuery).toContain('begin{pmatrix}');
    expect(task.answer).toMatch(/^\(-?\d+,-?\d+,-?\d+\)$/);
  });

  it('should generate valid diagonalizable task (both ja and nein)', () => {
    let hadJa = false;
    let hadNein = false;
    for (let i = 0; i < 50; i++) {
      const task = generateDiagonalizable();
      expect(task.type).toBe('calc_diagonalizable');
      expect(task.mathQuery).toContain('begin{pmatrix}');
      expect(['ja', 'nein']).toContain(task.answer);
      if (task.answer === 'ja') hadJa = true;
      if (task.answer === 'nein') hadNein = true;
    }
    expect(hadJa).toBe(true);
    expect(hadNein).toBe(true);
  });
});
