import { describe, it, expect } from 'vitest';
import {
  generateHashingDivisionOpen,
  generateHashingDivisionLinear,
  generateHashingDivisionQuadratic,
  generateHashingMultiplicationOpen,
  generateHashingMultiplicationLinear,
  generateHashingMultiplicationQuadratic,
} from '../../services/dsal/hashing';

function parseTable(answer: string): Map<number, number[]> {
  const map = new Map<number, number[]>();
  for (const part of answer.split(';')) {
    const [idxStr, valsStr] = part.split(':');
    const idx = parseInt(idxStr.trim(), 10);
    const vals = valsStr
      .replace(/[\[\]]/g, '')
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0)
      .map((s) => parseInt(s, 10));
    map.set(idx, vals);
  }
  return map;
}

describe('DSAL hashing generators', () => {
  const gens = [
    generateHashingDivisionOpen,
    generateHashingDivisionLinear,
    generateHashingDivisionQuadratic,
    generateHashingMultiplicationOpen,
    generateHashingMultiplicationLinear,
    generateHashingMultiplicationQuadratic,
  ];

  it('all hashing tasks produce a non-empty answer and prompt', () => {
    for (const g of gens) {
      const task = g();
      expect(task.answer.length).toBeGreaterThan(0);
      expect(task.prompt).toBeTruthy();
      expect(task.type.startsWith('dsal_hash_')).toBe(true);
    }
  });

  it('open hashing (chaining): every value appears exactly once across slots', () => {
    for (let t = 0; t < 20; t++) {
      const task = generateHashingDivisionOpen();
      const table = parseTable(task.answer);
      const all = [...table.values()].flat();
      // The values in the mathQuery must all be present (as a multiset).
      const m = task.mathQuery.match(/Werte: \{([^}]*)\}/);
      const inputVals = m![1].split(',').map((s) => parseInt(s.trim(), 10)).sort((a, b) => a - b);
      const resultVals = [...all].sort((a, b) => a - b);
      expect(resultVals).toEqual(inputVals);
    }
  });

  it('closed hashing (probing): each slot holds at most one value, all values placed', () => {
    for (let t = 0; t < 20; t++) {
      const task = generateHashingDivisionLinear();
      const table = parseTable(task.answer);
      const all = [...table.values()].flat();
      for (const slot of table.values()) expect(slot.length).toBeLessThanOrEqual(1);
      const m = task.mathQuery.match(/Werte: \{([^}]*)\}/);
      const inputVals = m![1].split(',').map((s) => parseInt(s.trim(), 10)).sort((a, b) => a - b);
      const resultVals = [...all].sort((a, b) => a - b);
      expect(resultVals).toEqual(inputVals);
    }
  });

  it('multiplication hashing: values are placed in valid indices', () => {
    for (let t = 0; t < 20; t++) {
      const task = generateHashingMultiplicationOpen();
      const table = parseTable(task.answer);
      const maxIdx = Math.max(...table.keys());
      expect(maxIdx).toBeLessThan(100); // capacity is small
      const all = [...table.values()].flat();
      expect(all.length).toBeGreaterThan(0);
    }
  });
});
