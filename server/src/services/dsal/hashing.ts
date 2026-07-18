import { TaskData } from '../math/types';

/**
 * Hashing exercise generators, translated from the official exercisegenerator
 * (exgen/src/main/java/exercisegenerator/algorithms/hashing/*.java).
 *
 * The official exercise inserts a list of values into a hash table of length m
 * using a hash function (division or multiplication) with either open hashing
 * (chaining — each slot is a list) or closed hashing (linear/quadratic probing).
 * Our single-answer format asks for the final occupied slots, i.e. for each
 * table index the list of values that landed there (or the single value for
 * probing). We render the result as "i: [v1, v2]; j: [v3]; …".
 */

type Slot = number[]; // values stored at a given index (chaining) or single value (probing)

interface HashConfig {
  capacity: number;
  hash: (value: number) => number;
  probing?: (iteration: number) => number; // offset for closed hashing
}

function getRandomInt(min: number, max: number): number {
  if (max < min) return min;
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

const CAPACITIES = [5, 7, 8, 11, 13, 16, 17, 19, 23, 29, 31, 32];

function pickCapacity(numValues: number): number {
  const minLen = Math.ceil(numValues * 1.25);
  const candidates = CAPACITIES.filter((c) => c >= minLen);
  if (candidates.length === 0) return CAPACITIES[CAPACITIES.length - 1];
  return candidates[getRandomInt(0, candidates.length - 1)];
}

function divisionHash(capacity: number): (v: number) => number {
  return (v: number) => ((v % capacity) + capacity) % capacity;
}

/** Multiplication method: floor( capacity * frac(c * value) ). */
function multiplicationHash(capacity: number, factor: number): (v: number) => number {
  return (v: number) => {
    const product = factor * v;
    const frac = product - Math.floor(product);
    return Math.floor(capacity * frac);
  };
}

function linearProbing(): (i: number) => number {
  return (i: number) => i;
}

function quadraticProbing(c1: number, c2: number): (i: number) => number {
  return (i: number) => Math.floor(c1 * i + c2 * i * i);
}

/** Run the official hashing algorithm and return the final table. */
function hashValues(values: number[], cfg: HashConfig): Slot[] {
  const table: Slot[] = Array.from({ length: cfg.capacity }, () => []);
  if (cfg.probing) {
    // Closed hashing: each slot holds at most one value.
    for (const value of values) {
      const initial = cfg.hash(value);
      let pos = initial;
      let iteration = 0;
      while (table[pos].length > 0) {
        iteration++;
        pos = (initial + cfg.probing(iteration)) % cfg.capacity;
        if (iteration > cfg.capacity) break; // safety
      }
      table[pos] = [value];
    }
  } else {
    // Open hashing (chaining): append to the slot list.
    for (const value of values) {
      const pos = cfg.hash(value);
      table[pos].push(value);
    }
  }
  return table;
}

function tableToAnswer(table: Slot[]): string {
  return table.map((slot, i) => `${i}: [${slot.join(', ')}]`).join('; ');
}

function randomValues(count: number, lo: number, hi: number): number[] {
  const vals: number[] = [];
  for (let i = 0; i < count; i++) vals.push(getRandomInt(lo, hi));
  return vals;
}

/* ------------------------------- Generators ------------------------------- */

export function generateHashingDivisionOpen(): TaskData {
  const numValues = getRandomInt(5, 9);
  const capacity = pickCapacity(numValues);
  const values = randomValues(numValues, 1, 99);
  const table = hashValues(values, { capacity, hash: divisionHash(capacity) });
  return {
    type: 'dsal_hash_div_open',
    mathQuery: `m = ${capacity} \\text{ (Divisionsmethode, Verkettung)}. Werte: {${values.join(', ')}}.`,
    answer: tableToAnswer(table),
    prompt: `Fügen Sie die Werte nacheinander mit der Divisionsmethode (ohne Sondierung, also Verkettung) in eine Hash-Tabelle der Länge ${capacity} ein.`,
    inputHint: 'Format: "0: [a, b]; 1: [c]; 2: []; …".',
    explanation: [`Finale Belegung: ${tableToAnswer(table)}.`],
  };
}

export function generateHashingDivisionLinear(): TaskData {
  const numValues = getRandomInt(5, 9);
  const capacity = pickCapacity(numValues);
  const values = randomValues(numValues, 1, 99);
  const table = hashValues(values, { capacity, hash: divisionHash(capacity), probing: linearProbing() });
  return {
    type: 'dsal_hash_div_linear',
    mathQuery: `m = ${capacity} \\text{ (Divisionsmethode, lineare Sondierung)}. Werte: {${values.join(', ')}}.`,
    answer: tableToAnswer(table),
    prompt: `Fügen Sie die Werte nacheinander mit der Divisionsmethode und linearer Sondierung in eine Hash-Tabelle der Länge ${capacity} ein.`,
    inputHint: 'Format: "0: [a]; 1: [b]; 2: []; …".',
    explanation: [`Finale Belegung: ${tableToAnswer(table)}.`],
  };
}

export function generateHashingDivisionQuadratic(): TaskData {
  const numValues = getRandomInt(5, 9);
  const capacity = pickCapacity(numValues);
  const c1 = getRandomInt(0, 10);
  const c2 = getRandomInt(1, 10);
  const values = randomValues(numValues, 1, 99);
  const table = hashValues(values, { capacity, hash: divisionHash(capacity), probing: quadraticProbing(c1, c2) });
  return {
    type: 'dsal_hash_div_quadratic',
    mathQuery: `m = ${capacity}, c_1 = ${c1}, c_2 = ${c2} \\text{ (Divisionsmethode, quadratische Sondierung)}. Werte: {${values.join(', ')}}.`,
    answer: tableToAnswer(table),
    prompt: `Fügen Sie die Werte nacheinander mit der Divisionsmethode und quadratischer Sondierung (c₁=${c1}, c₂=${c2}) in eine Hash-Tabelle der Länge ${capacity} ein.`,
    inputHint: 'Format: "0: [a]; 1: [b]; 2: []; …".',
    explanation: [`Finale Belegung: ${tableToAnswer(table)}.`],
  };
}

export function generateHashingMultiplicationOpen(): TaskData {
  const numValues = getRandomInt(5, 9);
  const capacity = pickCapacity(numValues);
  const factor = (getRandomInt(1, 99) + 1) / 100; // c in (0,1)
  const values = randomValues(numValues, 1, 99);
  const table = hashValues(values, { capacity, hash: multiplicationHash(capacity, factor) });
  return {
    type: 'dsal_hash_mul_open',
    mathQuery: `m = ${capacity}, c = ${factor} \\text{ (Multiplikationsmethode, Verkettung)}. Werte: {${values.join(', ')}}.`,
    answer: tableToAnswer(table),
    prompt: `Fügen Sie die Werte nacheinander mit der Multiplikationsmethode (c=${factor}, ohne Sondierung) in eine Hash-Tabelle der Länge ${capacity} ein.`,
    inputHint: 'Format: "0: [a, b]; 1: [c]; 2: []; …".',
    explanation: [`Finale Belegung: ${tableToAnswer(table)}.`],
  };
}

export function generateHashingMultiplicationLinear(): TaskData {
  const numValues = getRandomInt(5, 9);
  const capacity = pickCapacity(numValues);
  const factor = (getRandomInt(1, 99) + 1) / 100;
  const values = randomValues(numValues, 1, 99);
  const table = hashValues(values, { capacity, hash: multiplicationHash(capacity, factor), probing: linearProbing() });
  return {
    type: 'dsal_hash_mul_linear',
    mathQuery: `m = ${capacity}, c = ${factor} \\text{ (Multiplikationsmethode, lineare Sondierung)}. Werte: {${values.join(', ')}}.`,
    answer: tableToAnswer(table),
    prompt: `Fügen Sie die Werte nacheinander mit der Multiplikationsmethode (c=${factor}) und linearer Sondierung in eine Hash-Tabelle der Länge ${capacity} ein.`,
    inputHint: 'Format: "0: [a]; 1: [b]; 2: []; …".',
    explanation: [`Finale Belegung: ${tableToAnswer(table)}.`],
  };
}

export function generateHashingMultiplicationQuadratic(): TaskData {
  const numValues = getRandomInt(5, 9);
  const capacity = pickCapacity(numValues);
  const factor = (getRandomInt(1, 99) + 1) / 100;
  const c1 = getRandomInt(0, 10);
  const c2 = getRandomInt(1, 10);
  const values = randomValues(numValues, 1, 99);
  const table = hashValues(values, { capacity, hash: multiplicationHash(capacity, factor), probing: quadraticProbing(c1, c2) });
  return {
    type: 'dsal_hash_mul_quadratic',
    mathQuery: `m = ${capacity}, c = ${factor}, c_1 = ${c1}, c_2 = ${c2} \\text{ (Multiplikationsmethode, quadratische Sondierung)}. Werte: {${values.join(', ')}}.`,
    answer: tableToAnswer(table),
    prompt: `Fügen Sie die Werte nacheinander mit der Multiplikationsmethode (c=${factor}) und quadratischer Sondierung (c₁=${c1}, c₂=${c2}) in eine Hash-Tabelle der Länge ${capacity} ein.`,
    inputHint: 'Format: "0: [a]; 1: [b]; 2: []; …".',
    explanation: [`Finale Belegung: ${tableToAnswer(table)}.`],
  };
}
