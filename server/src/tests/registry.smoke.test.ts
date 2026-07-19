import { describe, it, expect } from 'vitest';
import { taskGenerators, getTaskGenerator } from '../services/math/registry';
import type { TaskData } from '../services/math/types';

/**
 * Smoke test over the ENTIRE registry: every registered generator must run
 * without throwing and return a structurally valid TaskData. This guards
 * against "forgotten wiring" — e.g. a generator that is registered but throws,
 * or returns a shape the frontend cannot render.
 */
describe('Registry smoke test (all generators)', () => {
  const ids = Object.keys(taskGenerators);

  it('has at least the known DSAL tree generators registered', () => {
    for (const id of [
      'dsal_bst_insert', 'dsal_bst_delete',
      'dsal_avl_insert', 'dsal_avl_delete',
      'dsal_rb_insert', 'dsal_rb_delete',
      'dsal_btree_insert', 'dsal_btree_delete',
    ]) {
      expect(taskGenerators[id], `missing generator for ${id}`).toBeDefined();
    }
  });

  it.each(ids)('generator "%s" produces a valid TaskData', (id) => {
    const gen = getTaskGenerator(id)!;
    let task: TaskData;
    // Run a few times since generators are randomized.
    for (let i = 0; i < 5; i++) {
      expect(() => { task = gen(); }).not.toThrow();
      task = gen();
      expect(task.type).toBe(id);
      expect(typeof task.mathQuery).toBe('string');
      expect(typeof task.answer).toBe('string');
      // Either free-text answer OR choices OR stepwise (steps) must be present
      // so the frontend has something to render/grade.
      const hasAnswer = task.answer.length > 0;
      const hasChoices = Array.isArray(task.choices) && task.choices.length > 0;
      const hasSteps = Array.isArray(task.steps) && task.steps.length > 0;
      expect(hasAnswer || hasChoices || hasSteps).toBe(true);
      // If renderMode is 'tree', a tree (or steps with trees) must exist.
      if (task.renderMode === 'tree') {
        const treeOk = task.tree !== undefined || (task.steps ?? []).every((s) => s.kind !== 'tree' || s.tree !== undefined);
        expect(treeOk).toBe(true);
      }
    }
  });
});
