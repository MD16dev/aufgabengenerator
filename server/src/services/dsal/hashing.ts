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
  probeType?: 'linear' | 'quadratic';
  c1?: number;
  c2?: number;
}

interface HashResult {
  table: Slot[];
  /** Probe walkthrough (German, LaTeX) for the first collision, for didactics. */
  walkthrough: string[];
  /** True iff every value was placed without silently overwriting another. */
  success: boolean;
  /** True iff at least one collision occurred (a value landed in an occupied slot). */
  collision: boolean;
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

/**
 * Run the official hashing algorithm and return the final table plus a
 * didactic probe walkthrough for the first collision.
 *
 * Robustness: after building the table we verify that EVERY inserted value is
 * actually present. Quadratic probing with arbitrary c1,c2 and a non-prime m
 * does not necessarily visit all slots, so the probe loop can fail to find an
 * empty slot and would otherwise silently overwrite an existing entry. Callers
 * regenerate (with fresh random parameters) until `success` is true. For the
 * quadratic variants we additionally restrict m to a prime with load factor <
 * 0.5, which guarantees quadratic probing always finds a free slot — so the
 * regenerate loop is only a safety net.
 */
function hashValues(values: number[], cfg: HashConfig): HashResult {
  const table: Slot[] = Array.from({ length: cfg.capacity }, () => []);
  const walkthrough: string[] = [];
  let recordedFirstCollision = false;
  let collision = false;

  if (cfg.probing) {
    const probeType = cfg.probeType ?? 'linear';
    const c1 = cfg.c1 ?? 0;
    const c2 = cfg.c2 ?? 0;
    for (const value of values) {
      const initial = cfg.hash(value);
      let pos = initial;
      let iteration = 0;
      const steps: string[] = [];
      const collided = table[pos].length > 0;
      if (collided) collision = true;
      while (table[pos].length > 0) {
        iteration++;
        const offset = cfg.probing(iteration);
        const next = (initial + offset) % cfg.capacity;
        const occupied = table[next].length > 0;
        if (!recordedFirstCollision) {
          steps.push(formatProbeStep(initial, iteration, probeType, c1, c2, next, occupied, cfg.capacity));
        }
        pos = next;
        if (iteration > cfg.capacity) break; // safety: no free slot found
      }
      if (!recordedFirstCollision && collided) {
        walkthrough.push(...steps);
        recordedFirstCollision = true;
      }
      table[pos] = [value];
    }
  } else {
    // Open hashing (chaining): append to the slot list. A collision occurs when
    // a slot already holds at least one value before this insert.
    for (const value of values) {
      const pos = cfg.hash(value);
      if (table[pos].length > 0) collision = true;
      table[pos].push(value);
    }
  }

  const flat = table.flat();
  // success requires that EVERY inserted value is present AND that no value was
  // silently overwritten (the safety break above can otherwise drop a value).
  const success = values.every((v) => flat.includes(v)) && flat.length === values.length;
  return { table, walkthrough, success, collision };
}

function tableToAnswer(table: Slot[]): string {
  return table.map((slot, i) => `${i}: [${slot.join(', ')}]`).join('; ');
}

function isPrime(n: number): boolean {
  if (n < 2) return false;
  for (let d = 2; d * d <= n; d++) if (n % d === 0) return false;
  return true;
}

/** Prime capacity with load factor < 0.5 — guarantees quadratic probing succeeds. */
function pickPrimeCapacity(numValues: number): number {
  const minLen = numValues * 2; // load factor <= 0.5 (strictly < 0.5: primes are odd > 2)
  const candidates = CAPACITIES.filter((c) => c >= minLen && isPrime(c));
  if (candidates.length === 0) {
    const primes = CAPACITIES.filter(isPrime);
    return primes[primes.length - 1];
  }
  return candidates[getRandomInt(0, candidates.length - 1)];
}

function formatProbeStep(
  initial: number,
  i: number,
  probeType: 'linear' | 'quadratic',
  c1: number,
  c2: number,
  next: number,
  occupied: boolean,
  capacity: number,
): string {
  const term =
    probeType === 'linear'
      ? `${initial} + ${i} \\equiv ${next}`
      : `${initial} + c_1 \\cdot ${i} + c_2 \\cdot ${i}^2 \\equiv ${next}`;
  const verdict = occupied ? 'belegt' : 'frei \\rightarrow Wert dort';
  return `i=${i}: ${term} \\pmod{${capacity}} \\rightarrow ${verdict}`;
}

function buildExplanation(opts: {
  formula: string;
  walkthrough: string[];
  table: Slot[];
  chaining: boolean;
  values: number[];
  hash: (v: number) => number;
  capacity: number;
}): string[] {
  // Wrap the LaTeX bits in $...$ / $$...$$ so the frontend LatexTextRenderer
  // actually renders them with KaTeX (otherwise they show as literal text).
  const lines = [`Formel: $$${opts.formula}$$`];
  // Explain WHY a collision happens: group values by their initial hash slot.
  const bySlot = new Map<number, number[]>();
  for (const v of opts.values) {
    const h = opts.hash(v);
    if (!bySlot.has(h)) bySlot.set(h, []);
    bySlot.get(h)!.push(v);
  }
  const collisions = [...bySlot.entries()].filter(([, vs]) => vs.length > 1);
  if (collisions.length > 0) {
    const desc = collisions
      .map(([slot, vs]) => `Slot ${slot} (wegen $h(k)=${slot}$): ${vs.join(', ')}`)
      .join('; ');
    lines.push(`Kollision: Mehrere Werte landen im selben Slot — ${desc}.`);
  }
  if (opts.chaining) {
    lines.push('Verkettung: Werte mit gleichem $h(k)$ werden im selben Slot aneinandergehängt.');
  } else if (opts.walkthrough.length > 0) {
    lines.push(`Sondierung der ersten Kollision: $$${opts.walkthrough.join('; ')}$$`);
  } else {
    lines.push('Keine Kollision: jeder Wert fand direkt einen freien Platz.');
  }
  lines.push(`Finale Belegung: ${tableToAnswer(opts.table)}.`);
  return lines;
}

function randomValues(count: number, lo: number, hi: number): number[] {
  const vals: number[] = [];
  for (let i = 0; i < count; i++) vals.push(getRandomInt(lo, hi));
  return vals;
}

/* ------------------------------- Generators ------------------------------- */

export function generateHashingDivisionOpen(): TaskData {
  let result: HashResult;
  let capacity: number;
  let values: number[];
  do {
    const numValues = getRandomInt(5, 9);
    capacity = pickCapacity(numValues);
    values = randomValues(numValues, 1, 99);
    result = hashValues(values, { capacity, hash: divisionHash(capacity) });
  } while (!result.success || !result.collision);
  const table = result.table;
  return {
    type: 'dsal_hash_div_open',
    mathQuery: [
      `m = ${capacity}`,
      `\\text{Divisionsmethode, Verkettung}`,
      `\\text{Werte: }\\{${values.join(', ')}\\}`,
    ].join(' \\\\ '),
    answer: tableToAnswer(table),
    prompt: `Fügen Sie die Werte nacheinander mit der Divisionsmethode (ohne Sondierung, also Verkettung) in eine Hash-Tabelle der Länge ${capacity} ein.`,
    inputHint: 'Format: "0: [a, b]; 1: [c]; 2: []; …".',
    explanation: buildExplanation({ formula: 'h(k) = k \bmod m', walkthrough: result.walkthrough, table, chaining: true, values, hash: divisionHash(capacity), capacity }),
  };
}

export function generateHashingDivisionLinear(): TaskData {
  let result: HashResult;
  let capacity: number;
  let values: number[];
  do {
    const numValues = getRandomInt(5, 9);
    capacity = pickCapacity(numValues);
    values = randomValues(numValues, 1, 99);
    result = hashValues(values, { capacity, hash: divisionHash(capacity), probing: linearProbing(), probeType: 'linear' });
  } while (!result.success || !result.collision);
  const table = result.table;
  return {
    type: 'dsal_hash_div_linear',
    mathQuery: [
      `m = ${capacity}`,
      `\\text{Divisionsmethode, lineare Sondierung}`,
      `\\text{Werte: }\\{${values.join(', ')}\\}`,
    ].join(' \\\\ '),
    answer: tableToAnswer(table),
    prompt: `Fügen Sie die Werte nacheinander mit der Divisionsmethode und linearer Sondierung in eine Hash-Tabelle der Länge ${capacity} ein.`,
    inputHint: 'Format: "0: [a]; 1: [b]; 2: []; …".',
    explanation: buildExplanation({ formula: 'h(k) = k \bmod m,\ h(k) + i', walkthrough: result.walkthrough, table, chaining: false, values, hash: divisionHash(capacity), capacity }),
  };
}

export function generateHashingDivisionQuadratic(): TaskData {
  let result: HashResult;
  let capacity: number;
  let c1: number;
  let c2: number;
  let values: number[];
  do {
    const numValues = getRandomInt(5, 9);
    capacity = pickPrimeCapacity(numValues);
    c1 = getRandomInt(0, 10);
    c2 = getRandomInt(1, 10);
    values = randomValues(numValues, 1, 99);
    result = hashValues(values, {
      capacity,
      hash: divisionHash(capacity),
      probing: quadraticProbing(c1, c2),
      probeType: 'quadratic',
      c1,
      c2,
    });
  } while (!result.success || !result.collision);
  const table = result.table;
  return {
    type: 'dsal_hash_div_quadratic',
    mathQuery: [
      `m = ${capacity},\\ c_1 = ${c1},\\ c_2 = ${c2}`,
      `\\text{Divisionsmethode, quadratische Sondierung}`,
      `\\text{Werte: }\\{${values.join(', ')}\\}`,
    ].join(' \\\\ '),
    answer: tableToAnswer(table),
    prompt: `Fügen Sie die Werte nacheinander mit der Divisionsmethode und quadratischer Sondierung (c₁=${c1}, c₂=${c2}) in eine Hash-Tabelle der Länge ${capacity} ein.`,
    inputHint: 'Format: "0: [a]; 1: [b]; 2: []; …".',
    explanation: buildExplanation({ formula: 'h(k) = k \bmod m,\ h(k) + c_1 i + c_2 i^2', walkthrough: result.walkthrough, table, chaining: false, values, hash: divisionHash(capacity), capacity }),
  };
}

export function generateHashingMultiplicationOpen(): TaskData {
  let result: HashResult;
  let capacity: number;
  let factor: number;
  let values: number[];
  do {
    const numValues = getRandomInt(5, 9);
    capacity = pickCapacity(numValues);
    factor = (getRandomInt(0, 98) + 1) / 100; // c in (0,1), strictly < 1
    values = randomValues(numValues, 1, 99);
    result = hashValues(values, { capacity, hash: multiplicationHash(capacity, factor) });
  } while (!result.success || !result.collision);
  const table = result.table;
  return {
    type: 'dsal_hash_mul_open',
    mathQuery: [
      `m = ${capacity},\\ c = ${factor}`,
      `\\text{Multiplikationsmethode, Verkettung}`,
      `\\text{Werte: }\\{${values.join(', ')}\\}`,
    ].join(' \\\\ '),
    answer: tableToAnswer(table),
    prompt: `Fügen Sie die Werte nacheinander mit der Multiplikationsmethode (c=${factor}, ohne Sondierung) in eine Hash-Tabelle der Länge ${capacity} ein.`,
    inputHint: 'Format: "0: [a, b]; 1: [c]; 2: []; …".',
    explanation: buildExplanation({ formula: 'h(k) = \lfloor m \cdot \operatorname{frac}(c \cdot k) \rfloor', walkthrough: result.walkthrough, table, chaining: true, values, hash: multiplicationHash(capacity, factor), capacity }),
  };
}

export function generateHashingMultiplicationLinear(): TaskData {
  let result: HashResult;
  let capacity: number;
  let factor: number;
  let values: number[];
  do {
    const numValues = getRandomInt(5, 9);
    capacity = pickCapacity(numValues);
    factor = (getRandomInt(0, 98) + 1) / 100;
    values = randomValues(numValues, 1, 99);
    result = hashValues(values, { capacity, hash: multiplicationHash(capacity, factor), probing: linearProbing(), probeType: 'linear' });
  } while (!result.success || !result.collision);
  const table = result.table;
  return {
    type: 'dsal_hash_mul_linear',
    mathQuery: [
      `m = ${capacity},\\ c = ${factor}`,
      `\\text{Multiplikationsmethode, lineare Sondierung}`,
      `\\text{Werte: }\\{${values.join(', ')}\\}`,
    ].join(' \\\\ '),
    answer: tableToAnswer(table),
    prompt: `Fügen Sie die Werte nacheinander mit der Multiplikationsmethode (c=${factor}) und linearer Sondierung in eine Hash-Tabelle der Länge ${capacity} ein.`,
    inputHint: 'Format: "0: [a]; 1: [b]; 2: []; …".',
    explanation: buildExplanation({ formula: 'h(k) = \lfloor m \cdot \operatorname{frac}(c \cdot k) \rfloor,\ h(k) + i', walkthrough: result.walkthrough, table, chaining: false, values, hash: multiplicationHash(capacity, factor), capacity }),
  };
}

export function generateHashingMultiplicationQuadratic(): TaskData {
  let result: HashResult;
  let capacity: number;
  let factor: number;
  let c1: number;
  let c2: number;
  let values: number[];
  do {
    const numValues = getRandomInt(5, 9);
    capacity = pickPrimeCapacity(numValues);
    factor = (getRandomInt(0, 98) + 1) / 100;
    c1 = getRandomInt(0, 10);
    c2 = getRandomInt(1, 10);
    values = randomValues(numValues, 1, 99);
    result = hashValues(values, {
      capacity,
      hash: multiplicationHash(capacity, factor),
      probing: quadraticProbing(c1, c2),
      probeType: 'quadratic',
      c1,
      c2,
    });
  } while (!result.success || !result.collision);
  const table = result.table;
  return {
    type: 'dsal_hash_mul_quadratic',
    mathQuery: [
      `m = ${capacity},\\ c = ${factor},\\ c_1 = ${c1},\\ c_2 = ${c2}`,
      `\\text{Multiplikationsmethode, quadratische Sondierung}`,
      `\\text{Werte: }\\{${values.join(', ')}\\}`,
    ].join(' \\\\ '),
    answer: tableToAnswer(table),
    prompt: `Fügen Sie die Werte nacheinander mit der Multiplikationsmethode (c=${factor}) und quadratischer Sondierung (c₁=${c1}, c₂=${c2}) in eine Hash-Tabelle der Länge ${capacity} ein.`,
    inputHint: 'Format: "0: [a]; 1: [b]; 2: []; …".',
    explanation: buildExplanation({ formula: 'h(k) = \lfloor m \cdot \operatorname{frac}(c \cdot k) \rfloor,\ h(k) + c_1 i + c_2 i^2', walkthrough: result.walkthrough, table, chaining: false, values, hash: multiplicationHash(capacity, factor), capacity }),
  };
}
