import { describe, it, expect } from 'vitest';
import {
  generatePolyApply,
  generatePolyImageBasis,
  generatePolyDefect,
  generatePolyComposition,
} from '../../services/math/polyMappingTasks';

describe('Polynomial Mapping Tasks Generators', () => {
  it('should generate valid apply task', () => {
    const task = generatePolyApply();
    expect(task.type).toBe('calc_poly_apply');
    expect(task.mathQuery).toContain('\\varphi(p(X))');
    expect(typeof task.answer).toBe('string');
  });

  it('should generate valid image basis task', () => {
    const task = generatePolyImageBasis();
    expect(task.type).toBe('calc_poly_image_basis');
    expect(task.mathQuery).toBe('\\operatorname{Basis}\\left(\\operatorname{Bild}(\\varphi)\\right)');
    expect(task.answer).toContain('[');
  });

  it('should generate valid defect task', () => {
    const task = generatePolyDefect();
    expect(task.type).toBe('calc_poly_defect');
    expect(task.mathQuery).toBe('\\operatorname{Def}(\\varphi)');
    const defVal = parseInt(task.answer, 10);
    expect(defVal).toBeGreaterThanOrEqual(0);
    expect(defVal).toBeLessThanOrEqual(4);
  });

  it('should generate valid composition task', () => {
    const task = generatePolyComposition();
    expect(task.type).toBe('calc_poly_composition');
    expect(task.mathQuery).toBe('\\operatorname{Basis}\\left(\\operatorname{Bild}(\\varphi^3)\\right)');
    expect(task.answer).toContain('[');
  });
});
