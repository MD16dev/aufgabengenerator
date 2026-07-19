import { describe, it, expect } from 'vitest';
import {
  generateBubbleSort,
  generateInsertionSort,
  generateSelectionSort,
  generateQuickSort,
  generateMergeSort,
  generateHeapSort,
  generateCountingSort,
  generateBucketSort,
} from '../../services/dsal/sorting';

function isSorted(a: number[]): boolean {
  for (let i = 1; i < a.length; i++) if (a[i - 1] > a[i]) return false;
  return true;
}

function parseArr(s: string): number[] {
  return s
    .replace(/[\[\]\s]/g, '')
    .split(',')
    .filter((x) => x.length > 0)
    .map((x) => parseInt(x, 10));
}

/** Two arrays are permutations of each other iff they have the same multiset. */
function sameMultiset(a: number[], b: number[]): boolean {
  if (a.length !== b.length) return false;
  const sa = [...a].sort((x, y) => x - y);
  const sb = [...b].sort((x, y) => x - y);
  return sa.every((v, i) => v === sb[i]);
}

/** Extract the initial array from the mathQuery "Array: [..]". */
function initialFromTask(task: { mathQuery: string }): number[] {
  const m = task.mathQuery.match(/\[([^\]]*)\]/);
  if (!m) throw new Error('no array in mathQuery');
  return parseArr(m[0]);
}

const comparisonGens = [
  generateBubbleSort,
  generateInsertionSort,
  generateSelectionSort,
  generateQuickSort,
  generateMergeSort,
  generateHeapSort,
];

describe('DSAL sorting generators (stepwise)', () => {
  it('comparison sorts: every step is a permutation of the input and the last step is sorted', () => {
    for (const g of comparisonGens) {
      for (let t = 0; t < 20; t++) {
        const task = g();
        const initial = initialFromTask(task);
        expect(task.steps).toBeDefined();
        expect(task.steps!.length).toBeGreaterThan(0);
        expect(task.answer).toBe('');
        for (const s of task.steps!) {
          expect(s.kind).toBe('array');
          expect(sameMultiset(s.array!, initial)).toBe(true);
        }
        const last = task.steps![task.steps!.length - 1].array!;
        expect(isSorted(last)).toBe(true);
      }
    }
  });

  it('counting sort: first step is the counts array, last step is the sorted array (values 0..9)', () => {
    for (let t = 0; t < 20; t++) {
      const task = generateCountingSort();
      const initial = initialFromTask(task);
      expect(task.steps!.length).toBe(2);
      const counts = task.steps![0].array!;
      expect(counts.length).toBe(10);
      expect(counts.reduce((a, b) => a + b, 0)).toBe(initial.length);
      const sorted = task.steps![1].array!;
      expect(isSorted(sorted)).toBe(true);
      expect(sameMultiset(sorted, initial)).toBe(true);
      for (const v of sorted) {
        expect(v).toBeGreaterThanOrEqual(0);
        expect(v).toBeLessThanOrEqual(9);
      }
    }
  });

  it('bucket sort: last step is the sorted array (values 0..99)', () => {
    for (let t = 0; t < 20; t++) {
      const task = generateBucketSort();
      const initial = initialFromTask(task);
      expect(task.steps!.length).toBeGreaterThan(0);
      const sorted = task.steps![task.steps!.length - 1].array!;
      expect(isSorted(sorted)).toBe(true);
      expect(sameMultiset(sorted, initial)).toBe(true);
      for (const v of sorted) {
        expect(v).toBeGreaterThanOrEqual(0);
        expect(v).toBeLessThanOrEqual(99);
      }
    }
  });

  it('all sorting tasks produce stepwise tasks with a prompt', () => {
    const gens = [...comparisonGens, generateCountingSort, generateBucketSort];
    for (const g of gens) {
      const task = g();
      expect(task.steps).toBeDefined();
      expect(task.steps!.length).toBeGreaterThan(0);
      expect(task.prompt).toBeTruthy();
    }
  });
});
