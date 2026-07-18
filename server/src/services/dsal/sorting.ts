import { TaskData } from '../math/types';

/**
 * Sorting exercise generators, translated from the official exercisegenerator
 * (exgen/src/main/java/exercisegenerator/algorithms/sorting/*.java).
 *
 * The official exercises ask: "Sort the array using X. Give the array after
 * each operation." Our single-answer format maps that to: given the initial
 * array, give the array after the k-th operation (for comparison sorts) or the
 * final sorted result array (for counting/bucket sort). The answer is the
 * canonical array string, e.g. "[3, 1, 4, 2]".
 *
 * Each `apply` below reproduces the official algorithm step-for-step so the
 * produced intermediate states match the official generator exactly.
 */

function getRandomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function copyArray(a: number[]): number[] {
  return a.slice();
}

function swap(a: number[], i: number, j: number): void {
  const t = a[i];
  a[i] = a[j];
  a[j] = t;
}

/** Canonical array string used both for the answer and for display. */
function arrStr(a: number[]): string {
  return `[${a.join(', ')}]`;
}

/** Generate a random array of length 5..10 with values in [lo, hi]. */
function randomArray(lo: number, hi: number, minLen = 5, maxLen = 10): number[] {
  const len = getRandomInt(minLen, maxLen);
  const a: number[] = [];
  for (let i = 0; i < len; i++) a.push(getRandomInt(lo, hi));
  return a;
}

/* ------------------------------- Bubble sort ------------------------------ */

function bubbleSortSteps(initial: number[]): number[][] {
  const result: number[][] = [copyArray(initial)];
  const a = copyArray(initial);
  let unsortedLength = a.length;
  while (unsortedLength > 1) {
    let lowestIndexNotSwapped = 1;
    for (let i = 0; i < unsortedLength - 1; i++) {
      if (a[i] > a[i + 1]) {
        swap(a, i, i + 1);
        result.push(copyArray(a));
        lowestIndexNotSwapped = i + 1;
      }
    }
    unsortedLength = lowestIndexNotSwapped;
  }
  return result;
}

/* ----------------------------- Insertion sort ----------------------------- */

function insertionSortSteps(initial: number[]): number[][] {
  const result: number[][] = [copyArray(initial)];
  const a = copyArray(initial);
  for (let i = 1; i < a.length; i++) {
    const insert = a[i];
    let j = i;
    while (j > 0 && a[j - 1] > insert) {
      a[j] = a[j - 1];
      j--;
    }
    a[j] = insert;
    result.push(copyArray(a));
  }
  return result;
}

/* ----------------------------- Selection sort ----------------------------- */

function selectionSortSteps(initial: number[]): number[][] {
  const result: number[][] = [copyArray(initial)];
  const a = copyArray(initial);
  for (let i = 0; i < a.length - 1; i++) {
    let min = i;
    for (let j = i + 1; j < a.length; j++) {
      if (a[j] < a[min]) min = j;
    }
    if (i !== min) {
      swap(a, i, min);
      result.push(copyArray(a));
    }
  }
  return result;
}

/* ------------------------------- Quick sort ------------------------------- */

// Partition mode EQUAL_RIGHT (the official default).
function forwardLeft(left: number, pivot: number): boolean {
  return left < pivot;
}
function forwardRight(right: number, pivot: number): boolean {
  return right >= pivot;
}

function quickPartition(a: number[], from: number, to: number): number {
  let left = from - 1;
  let right = to;
  const pivot = a[to];
  while (left < right) {
    left++;
    while (forwardLeft(a[left], pivot)) left++;
    right--;
    while (right > from && forwardRight(a[right], pivot)) right--;
    swap(a, left, right);
  }
  swap(a, left, right);
  swap(a, left, to);
  return left;
}

function quickSortRec(a: number[], start: number, end: number, result: number[][]): void {
  if (start >= end) return;
  const middle = quickPartition(a, start, end);
  result.push(copyArray(a));
  quickSortRec(a, start, middle - 1, result);
  quickSortRec(a, middle + 1, end, result);
}

function quickSortSteps(initial: number[]): number[][] {
  const result: number[][] = [copyArray(initial)];
  const a = copyArray(initial);
  quickSortRec(a, 0, a.length - 1, result);
  return result;
}

/* ------------------------------- Merge sort ------------------------------- */

function mergeSortMerge(a: number[], start: number, middle: number, end: number): void {
  const copy: number[] = new Array(end - start + 1);
  let i = 0;
  let j = start;
  let k = middle + 1;
  while (j <= middle && k <= end) {
    if (a[j] <= a[k]) copy[i++] = a[j++];
    else copy[i++] = a[k++];
  }
  while (j <= middle) copy[i++] = a[j++];
  while (k <= end) copy[i++] = a[k++];
  for (let idx = 0; idx < copy.length; idx++) a[start + idx] = copy[idx];
}

function mergeSortRec(a: number[], start: number, end: number, result: number[][]): void {
  if (start >= end) return;
  const middle = Math.floor((start + end) / 2);
  mergeSortRec(a, start, middle, result);
  mergeSortRec(a, middle + 1, end, result);
  mergeSortMerge(a, start, middle, end);
  result.push(copyArray(a));
}

function mergeSortSteps(initial: number[]): number[][] {
  const result: number[][] = [copyArray(initial)];
  const a = copyArray(initial);
  mergeSortRec(a, 0, a.length - 1, result);
  return result;
}

/* ------------------------------- Heap sort -------------------------------- */

function heapify(a: number[], from: number, to: number, result: number[][]): void {
  let i = from;
  while (i <= Math.floor(to / 2)) {
    let j = 2 * i;
    if (j < to && a[j] > a[j - 1]) j++;
    if (a[j - 1] <= a[i - 1]) break;
    swap(a, j - 1, i - 1);
    result.push(copyArray(a));
    i = j;
  }
}

function heapSortSteps(initial: number[]): number[][] {
  const result: number[][] = [copyArray(initial)];
  const a = copyArray(initial);
  for (let i = Math.floor(a.length / 2); i > 0; i--) {
    heapify(a, i, a.length, result);
  }
  for (let i = a.length - 1; i > 0; i--) {
    swap(a, 0, i);
    result.push(copyArray(a));
    heapify(a, 1, i, result);
  }
  return result;
}

/* ------------------------------ Counting sort ----------------------------- */

function countingSortResult(initial: number[], lo: number, hi: number): number[] {
  const a = new Array(initial.length).fill(0);
  const count = new Array(hi - lo + 1).fill(0);
  for (const v of initial) count[v - lo]++;
  let index = 0;
  for (let i = 0; i < count.length; i++) {
    while (count[i] > 0) {
      a[index++] = i + lo;
      count[i]--;
    }
  }
  return a;
}

/* ------------------------------- Bucket sort ------------------------------ */

function bucketSortResult(initial: number[], lo: number, hi: number, buckets: number): number[] {
  const ranges: number[][] = Array.from({ length: buckets }, () => []);
  const span = (hi - lo + 1) / buckets;
  for (const v of initial) {
    const b = Math.floor((v - lo) / span);
    ranges[Math.min(b, buckets - 1)].push(v);
  }
  const a: number[] = [];
  for (const bucket of ranges) {
    bucket.sort((x, y) => x - y);
    for (const v of bucket) a.push(v);
  }
  return a;
}

/* --------------------------- Task construction ---------------------------- */

interface SortMeta {
  type: string;
  algoName: string;
  /** German name of one operation, used in the prompt. */
  operation: string;
  /** Whether to ask for an intermediate step (comparison sorts) or final result. */
  intermediate: boolean;
}

/**
 * Build a comparison-sort task asking for the array after the k-th operation.
 * Regenerates the array until at least one operation occurs.
 */
function buildComparisonTask(
  meta: SortMeta,
  stepsFn: (a: number[]) => number[][],
): TaskData {
  let steps: number[][];
  let initial: number[];
  // Ensure at least one operation happens (avoid already-sorted arrays).
  do {
    initial = randomArray(0, 30);
    steps = stepsFn(initial);
  } while (steps.length < 2);

  const k = getRandomInt(1, steps.length - 1);
  const answerArr = steps[k];

  return {
    type: meta.type,
    mathQuery: `\\text{Array: } ${arrStr(initial)}`,
    answer: arrStr(answerArr),
    prompt: `Sortieren Sie das Array mit ${meta.algoName}. Geben Sie das Array nach der ${k}-ten ${meta.operation} an.`,
    inputHint: 'Gib das Array in der Form [a, b, c, …] an.',
    explanation: [
      `Startarray: ${arrStr(initial)}.`,
      `Angewandter Algorithmus: ${meta.algoName}.`,
      `Nach der ${k}-ten ${meta.operation} lautet das Array: ${arrStr(answerArr)}.`,
      `Das Endergebnis (vollständig sortiert) wäre: ${arrStr(steps[steps.length - 1])}.`,
    ],
  };
}

/** Build a counting/bucket sort task asking for the final sorted result array. */
function buildResultTask(
  meta: SortMeta,
  initial: number[],
  lo: number,
  hi: number,
  resultFn: (a: number[], lo: number, hi: number) => number[],
): TaskData {
  const result = resultFn(initial, lo, hi);
  return {
    type: meta.type,
    mathQuery: `\\text{Array: } ${arrStr(initial)}`,
    answer: arrStr(result),
    prompt: `Sortieren Sie das Array mit ${meta.algoName}. Geben Sie das sortierte Ergebnisarray an.`,
    inputHint: 'Gib das Array in der Form [a, b, c, …] an.',
    explanation: [
      `Startarray: ${arrStr(initial)} (Werte im Bereich ${lo}…${hi}).`,
      `Angewandter Algorithmus: ${meta.algoName}.`,
      `Das sortierte Ergebnisarray lautet: ${arrStr(result)}.`,
    ],
  };
}

/* ------------------------------- Exports ---------------------------------- */

export function generateBubbleSort(): TaskData {
  return buildComparisonTask(
    { type: 'dsal_sort_bubble', algoName: 'Bubblesort', operation: 'Swap-Operation', intermediate: true },
    bubbleSortSteps,
  );
}

export function generateInsertionSort(): TaskData {
  return buildComparisonTask(
    { type: 'dsal_sort_insertion', algoName: 'Insertionsort', operation: 'Iteration der äußeren Schleife', intermediate: true },
    insertionSortSteps,
  );
}

export function generateSelectionSort(): TaskData {
  return buildComparisonTask(
    { type: 'dsal_sort_selection', algoName: 'Selectionsort', operation: 'Swap-Operation', intermediate: true },
    selectionSortSteps,
  );
}

export function generateQuickSort(): TaskData {
  return buildComparisonTask(
    { type: 'dsal_sort_quick', algoName: 'Quicksort', operation: 'Partition-Operation', intermediate: true },
    quickSortSteps,
  );
}

export function generateMergeSort(): TaskData {
  return buildComparisonTask(
    { type: 'dsal_sort_merge', algoName: 'Mergesort', operation: 'Merge-Operation', intermediate: true },
    mergeSortSteps,
  );
}

export function generateHeapSort(): TaskData {
  return buildComparisonTask(
    { type: 'dsal_sort_heap', algoName: 'Heapsort', operation: 'Swap-Operation', intermediate: true },
    heapSortSteps,
  );
}

export function generateCountingSort(): TaskData {
  // Official range is 0..9.
  const initial = randomArray(0, 9);
  return buildResultTask(
    { type: 'dsal_sort_counting', algoName: 'Countingsort', operation: '', intermediate: false },
    initial,
    0,
    9,
    countingSortResult,
  );
}

export function generateBucketSort(): TaskData {
  // Official: values 0..99, 10 buckets.
  const initial = randomArray(0, 99, 6, 9);
  const result = bucketSortResult(initial, 0, 99, 10);
  return {
    type: 'dsal_sort_bucket',
    mathQuery: `\\text{Array: } ${arrStr(initial)}`,
    answer: arrStr(result),
    prompt: `Sortieren Sie das Array mit Bucketsort (10 Buckets, Werte 0…99). Geben Sie das sortierte Ergebnisarray an.`,
    inputHint: 'Gib das Array in der Form [a, b, c, …] an.',
    explanation: [
      `Startarray: ${arrStr(initial)} (Werte im Bereich 0…99, 10 Buckets).`,
      `Angewandter Algorithmus: Bucketsort.`,
      `Das sortierte Ergebnisarray lautet: ${arrStr(result)}.`,
    ],
  };
}
