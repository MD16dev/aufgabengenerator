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

describe('DSAL sorting generators', () => {
  it('bubble sort: answer is a permutation of the input', () => {
    for (let t = 0; t < 20; t++) {
      const task = generateBubbleSort();
      expect(task.type).toBe('dsal_sort_bubble');
      const ans = parseArr(task.answer);
      expect(ans.length).toBeGreaterThan(0);
      expect(sameMultiset(ans, initialFromTask(task))).toBe(true);
    }
  });

  it('insertion sort: answer is a permutation of the input', () => {
    for (let t = 0; t < 20; t++) {
      const task = generateInsertionSort();
      expect(sameMultiset(parseArr(task.answer), initialFromTask(task))).toBe(true);
    }
  });

  it('selection sort: answer is a permutation of the input', () => {
    for (let t = 0; t < 20; t++) {
      const task = generateSelectionSort();
      expect(sameMultiset(parseArr(task.answer), initialFromTask(task))).toBe(true);
    }
  });

  it('quick sort: answer is a permutation of the input', () => {
    for (let t = 0; t < 20; t++) {
      const task = generateQuickSort();
      expect(sameMultiset(parseArr(task.answer), initialFromTask(task))).toBe(true);
    }
  });

  it('merge sort: answer is a permutation of the input', () => {
    for (let t = 0; t < 20; t++) {
      const task = generateMergeSort();
      expect(sameMultiset(parseArr(task.answer), initialFromTask(task))).toBe(true);
    }
  });

  it('heap sort: answer is a permutation of the input', () => {
    for (let t = 0; t < 20; t++) {
      const task = generateHeapSort();
      expect(sameMultiset(parseArr(task.answer), initialFromTask(task))).toBe(true);
    }
  });

  it('counting sort: answer is the fully sorted array (values 0..9)', () => {
    for (let t = 0; t < 20; t++) {
      const task = generateCountingSort();
      const ans = parseArr(task.answer);
      expect(isSorted(ans)).toBe(true);
      expect(sameMultiset(ans, initialFromTask(task))).toBe(true);
      for (const v of ans) {
        expect(v).toBeGreaterThanOrEqual(0);
        expect(v).toBeLessThanOrEqual(9);
      }
    }
  });

  it('bucket sort: answer is the fully sorted array (values 0..99)', () => {
    for (let t = 0; t < 20; t++) {
      const task = generateBucketSort();
      const ans = parseArr(task.answer);
      expect(isSorted(ans)).toBe(true);
      expect(sameMultiset(ans, initialFromTask(task))).toBe(true);
      for (const v of ans) {
        expect(v).toBeGreaterThanOrEqual(0);
        expect(v).toBeLessThanOrEqual(99);
      }
    }
  });

  it('all sorting tasks produce a bracketed array answer', () => {
    const gens = [
      generateBubbleSort,
      generateInsertionSort,
      generateSelectionSort,
      generateQuickSort,
      generateMergeSort,
      generateHeapSort,
      generateCountingSort,
      generateBucketSort,
    ];
    for (const g of gens) {
      const task = g();
      expect(task.answer.startsWith('[')).toBe(true);
      expect(task.answer.endsWith(']')).toBe(true);
      expect(task.prompt).toBeTruthy();
    }
  });
});
