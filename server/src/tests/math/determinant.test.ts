import { describe, it, expect } from 'vitest';
import { generate2x2DeterminantTask, generateDeterminant, generate3x3DeterminantTask, generateDeterminant3x3 } from '../../services/math/determinant';

describe('2x2 Determinant Math Generator', () => {
  it('should generate a valid 2x2 determinant task structure', () => {
    const task = generate2x2DeterminantTask();
    
    expect(task.type).toBe('lin_alg_det');
    expect(task.matrix).toHaveLength(2);
    expect(task.matrix[0]).toHaveLength(2);
    expect(task.matrix[1]).toHaveLength(2);
    
    const [[a, b], [c, d]] = task.matrix;
    expect(task.answer).toBe(a * d - b * c);
    expect(task.latex).toBe(`\\begin{pmatrix} ${a} & ${b} \\\\ ${c} & ${d} \\end{pmatrix}`);
    expect(task.steps.length).toBeGreaterThan(0);
  });
  
  it('should generate multiple random distinct tasks', () => {
    const tasks = Array.from({ length: 5 }, () => generate2x2DeterminantTask());
    const matrices = tasks.map(t => JSON.stringify(t.matrix));
    // Since values are random, it's very unlikely all 5 generated matrices are identical
    const uniqueMatrices = new Set(matrices);
    expect(uniqueMatrices.size).toBeGreaterThan(1);
  });

  it('should return the unified TaskData shape via generateDeterminant', () => {
    const task = generateDeterminant();
    expect(task.type).toBe('lin_alg_det');
    expect(task).toHaveProperty('mathQuery');
    expect(task).toHaveProperty('answer');
    expect(typeof task.answer).toBe('string');
    expect(Array.isArray(task.explanation)).toBe(true);
  });
});

describe('3x3 Determinant Math Generator', () => {
  it('should generate a valid 3x3 determinant task structure', () => {
    const task = generate3x3DeterminantTask();
    
    expect(task.type).toBe('lin_alg_det3x3');
    expect(task.matrix).toHaveLength(3);
    expect(task.matrix[0]).toHaveLength(3);
    expect(task.matrix[1]).toHaveLength(3);
    expect(task.matrix[2]).toHaveLength(3);
    
    const [
      [a, b, c],
      [d, e, f],
      [g, h, i]
    ] = task.matrix;
    const expected = (a * e * i + b * f * g + c * d * h) - (g * e * c + h * f * a + i * d * b);
    expect(task.answer).toBe(expected);
    expect(task.latex).toBe(`\\begin{pmatrix} ${a} & ${b} & ${c} \\\\ ${d} & ${e} & ${f} \\\\ ${g} & ${h} & ${i} \\end{pmatrix}`);
    expect(task.steps.length).toBeGreaterThan(0);
  });

  it('should return the unified TaskData shape via generateDeterminant3x3', () => {
    const task = generateDeterminant3x3();
    expect(task.type).toBe('lin_alg_det3x3');
    expect(task).toHaveProperty('mathQuery');
    expect(task).toHaveProperty('answer');
    expect(typeof task.answer).toBe('string');
    expect(Array.isArray(task.explanation)).toBe(true);
  });
});
