import { describe, it, expect } from 'vitest';
import { generateMatrixMultiplicationTask, generateMatrixMultiplication } from '../../services/math/matrixMultiplication';

describe('Matrix Multiplication Math Generator', () => {
  it('should generate a valid matrix multiplication task structure', () => {
    const task = generateMatrixMultiplicationTask();

    expect(task.type).toBe('lin_alg_matmul');
    expect(task.matrixA.length).toBeGreaterThanOrEqual(2);
    expect(task.matrixA.length).toBeLessThanOrEqual(4);

    expect(task.matrixB.length).toBe(task.matrixA[0].length); // compatible dimensions
    expect(task.matrixB[0].length).toBeGreaterThanOrEqual(2);
    expect(task.matrixB[0].length).toBeLessThanOrEqual(4);

    expect(task.matrixC.length).toBe(task.matrixA.length);
    expect(task.matrixC[0].length).toBe(task.matrixB[0].length);

    // Verify matrix multiplication output
    const A = task.matrixA;
    const B = task.matrixB;
    const C = task.matrixC;
    const n = A.length;
    const m = A[0].length;
    const k = B[0].length;

    for (let i = 0; i < n; i++) {
      for (let j = 0; j < k; j++) {
        let expectedSum = 0;
        for (let p = 0; p < m; p++) {
          expectedSum += A[i][p] * B[p][j];
        }
        expect(C[i][j]).toBe(expectedSum);
      }
    }

    // Verify correct answers formatting (e.g. "1,2;3,4")
    const expectedAnswer = C.map(row => row.join(',')).join(';');
    expect(task.answer).toBe(expectedAnswer);

    // Verify LaTeX representations
    expect(task.latexA).toContain('\\begin{pmatrix}');
    expect(task.latexB).toContain('\\begin{pmatrix}');
    expect(task.latexC).toContain('\\begin{pmatrix}');
    expect(task.steps.length).toBeGreaterThan(0);
  });

  it('should return unified TaskData shape via generateMatrixMultiplication', () => {
    const task = generateMatrixMultiplication();
    expect(task.type).toBe('lin_alg_matmul');
    expect(task).toHaveProperty('mathQuery');
    expect(task).toHaveProperty('answer');
    expect(typeof task.answer).toBe('string');
    expect(Array.isArray(task.explanation)).toBe(true);
    expect(task.prompt).toContain('Matrixprodukt');
    expect(task.inputHint).toContain('Semikolon');
  });
});
