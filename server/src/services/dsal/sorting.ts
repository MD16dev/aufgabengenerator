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

/* (counting sort logic lives in countingSortSteps below) */

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
  /** German noun for one operation, used in step instructions. */
  operation: string;
}

/**
 * Build a stepwise comparison-sort task: every intermediate state becomes a
 * solution step, but the upfront task description is a single sentence
 * ("Sortiere mit X"), not a per-swap list. Regenerates until at least one
 * operation occurs (avoids already-sorted arrays).
 */
function buildStepwiseTask(meta: SortMeta, stepsFn: (a: number[]) => number[][]): TaskData {
  let states: number[][];
  let initial: number[];
  do {
    initial = randomArray(0, 30);
    states = stepsFn(initial);
  } while (states.length < 2);

  const steps: TaskData['steps'] = states.slice(1).map((state, i) => ({
    instruction: `Array nach dem ${i + 1}-ten ${meta.operation} (${meta.algoName})`,
    kind: 'array',
    array: state,
  }));

  return {
    type: meta.type,
    mathQuery: `\\text{Array: } ${arrStr(initial)}`,
    answer: '',
    prompt: `Sortieren Sie das Array mit ${meta.algoName}.`,
    inputHint: 'Die Lösung zeigt das Array nach jedem Schritt.',
    taskList: [`Sortiere das Array mit ${meta.algoName}.`],
    steps,
    explanation: [
      `Startarray: ${arrStr(initial)}.`,
      `Angewandter Algorithmus: ${meta.algoName}.`,
      `Das vollständig sortierte Endergebnis lautet: ${arrStr(states[states.length - 1])}.`,
    ],
  };
}

/** Counting sort with intermediate states (counts array, then sorted result). */
function countingSortSteps(initial: number[], lo: number, hi: number): { counts: number[]; sorted: number[] } {
  const counts = new Array(hi - lo + 1).fill(0);
  for (const v of initial) counts[v - lo]++;
  const countsSnapshot = [...counts];
  const sorted: number[] = [];
  for (let i = 0; i < counts.length; i++) {
    while (counts[i] > 0) {
      sorted.push(i + lo);
      counts[i]--;
    }
  }
  return { counts: countsSnapshot, sorted };
}

/* ------------------------------- Exports ---------------------------------- */

export function generateBubbleSort(): TaskData {
  return buildStepwiseTask(
    { type: 'dsal_sort_bubble', algoName: 'Bubblesort', operation: 'Swap' },
    bubbleSortSteps,
  );
}

export function generateInsertionSort(): TaskData {
  return buildStepwiseTask(
    { type: 'dsal_sort_insertion', algoName: 'Insertionsort', operation: 'Verschieben' },
    insertionSortSteps,
  );
}

export function generateSelectionSort(): TaskData {
  return buildStepwiseTask(
    { type: 'dsal_sort_selection', algoName: 'Selectionsort', operation: 'Swap' },
    selectionSortSteps,
  );
}

export function generateQuickSort(): TaskData {
  return buildStepwiseTask(
    { type: 'dsal_sort_quick', algoName: 'Quicksort', operation: 'Partition' },
    quickSortSteps,
  );
}

export function generateMergeSort(): TaskData {
  return buildStepwiseTask(
    { type: 'dsal_sort_merge', algoName: 'Mergesort', operation: 'Merge' },
    mergeSortSteps,
  );
}

export function generateHeapSort(): TaskData {
  return buildStepwiseTask(
    { type: 'dsal_sort_heap', algoName: 'Heapsort', operation: 'Swap' },
    heapSortSteps,
  );
}

export function generateCountingSort(): TaskData {
  // Official range is 0..9.
  const initial = randomArray(0, 9);
  const { counts, sorted } = countingSortSteps(initial, 0, 9);
  return {
    type: 'dsal_sort_counting',
    mathQuery: `\\text{Array: } ${arrStr(initial)}`,
    answer: '',
    prompt: 'Sortieren Sie das Array mit Countingsort (Werte 0…9).',
    inputHint: 'Die Lösung zeigt das Zähl-Array und das sortierte Ergebnis.',
    taskList: ['Sortiere das Array mit Countingsort (Werte 0…9).'],
    steps: [
      { instruction: 'Zähle, wie oft jeder Wert (0…9) vorkommt', kind: 'array', array: counts },
      { instruction: 'Gib das sortierte Ergebnisarray an', kind: 'array', array: sorted },
    ],
    explanation: [
      `Startarray: ${arrStr(initial)} (Werte im Bereich 0…9).`,
      `Zähl-Array: ${arrStr(counts)}.`,
      `Angewandter Algorithmus: Countingsort.`,
      `Das sortierte Ergebnisarray lautet: ${arrStr(sorted)}.`,
    ],
  };
}

export function generateBucketSort(): TaskData {
  // Official: values 0..99, 10 buckets.
  const initial = randomArray(0, 99, 6, 9);
  const result = bucketSortResult(initial, 0, 99, 10);
  // Build per-bucket contents for intermediate steps.
  const buckets = 10;
  const span = (99 - 0 + 1) / buckets;
  const ranges: number[][] = Array.from({ length: buckets }, () => []);
  for (const v of initial) {
    const b = Math.min(Math.floor((v - 0) / span), buckets - 1);
    ranges[b].push(v);
  }
  const steps: TaskData['steps'] = [];
  ranges.forEach((bucket, i) => {
    if (bucket.length > 0) {
      steps.push({ instruction: `Inhalt von Bucket ${i} (Werte ${Math.floor(i * span)}…${Math.floor((i + 1) * span) - 1})`, kind: 'array', array: [...bucket].sort((x, y) => x - y) });
    }
  });
  steps.push({ instruction: 'Gib das sortierte Ergebnisarray an', kind: 'array', array: result });
  return {
    type: 'dsal_sort_bucket',
    mathQuery: `\\text{Array: } ${arrStr(initial)}`,
    answer: '',
    prompt: 'Sortieren Sie das Array mit Bucketsort (10 Buckets, Werte 0…99).',
    inputHint: 'Die Lösung zeigt die Bucket-Inhalte und das sortierte Ergebnis.',
    taskList: ['Sortiere das Array mit Bucketsort (10 Buckets, Werte 0…99).'],
    steps,
    explanation: [
      `Startarray: ${arrStr(initial)} (Werte im Bereich 0…99, 10 Buckets).`,
      `Angewandter Algorithmus: Bucketsort.`,
      `Das sortierte Ergebnisarray lautet: ${arrStr(result)}.`,
    ],
  };
}
