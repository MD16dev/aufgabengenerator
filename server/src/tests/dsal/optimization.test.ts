import { describe, it, expect } from 'vitest';
import {
  generateKnapsack,
  generateLCS,
  generateSimplex,
} from '../../services/dsal/optimization';

describe('DSAL optimization generators', () => {
  it('knapsack: answer reports a non-negative value and valid item set', () => {
    for (let t = 0; t < 30; t++) {
      const task = generateKnapsack();
      expect(task.answer).toMatch(/^Wert: \d+, Gegenstände: \{.*\}$/);
      const m = task.answer.match(/Wert: (\d+), Gegenstände: \{([^}]*)\}/)!;
      const value = parseInt(m[1], 10);
      expect(value).toBeGreaterThanOrEqual(0);
      const items = m[2].length ? m[2].split(',').map((s) => parseInt(s.trim(), 10)) : [];
      // items must be distinct and 1-indexed within a plausible range
      expect(new Set(items).size).toBe(items.length);
      for (const it of items) expect(it).toBeGreaterThanOrEqual(1);
      expect(task.type).toBe('dsal_opt_knapsack');
    }
  });

  it('LCS: answer is a subsequence of both input words', () => {
    for (let t = 0; t < 30; t++) {
      const task = generateLCS();
      const m = task.mathQuery.match(/w_1 = \\text{([^}]+)},\\ w_2 = \\text{([^}]+)}/)!;
      const w1 = m[1];
      const w2 = m[2];
      const lcs = task.answer;
      expect(task.type).toBe('dsal_opt_lcs');
      // lcs must be a subsequence of both
      expect(isSubsequence(lcs, w1)).toBe(true);
      expect(isSubsequence(lcs, w2)).toBe(true);
      expect(lcs.length).toBeGreaterThanOrEqual(0);
    }
  });

  it('simplex: answer is either unbounded/unlösbar or a valid assignment with z', () => {
    for (let t = 0; t < 30; t++) {
      const task = generateSimplex();
      expect(task.type).toBe('dsal_opt_simplex');
      if (task.answer === 'unbeschränkt' || task.answer === 'unlösbar') {
        continue;
      }
      // format: x1* = a, x2* = b, z = c
      expect(task.answer).toMatch(/^x\d+\* = [^,]+, (x\d+\* = [^,]+, )*z = .+$/);
      // all values parse as rationals
      for (const part of task.answer.split(',')) {
        const val = part.split('=')[1].trim();
        expect(val).toMatch(/^-?\d+(\/\d+)?$/);
      }
    }
  });
});

function isSubsequence(sub: string, full: string): boolean {
  let i = 0;
  for (let j = 0; j < full.length && i < sub.length; j++) {
    if (sub[i] === full[j]) i++;
  }
  return i === sub.length;
}
