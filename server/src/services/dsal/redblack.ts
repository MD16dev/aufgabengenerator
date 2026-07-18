import { TaskData, TreeNodeJSON, ChoiceOption } from '../math/types';
import { buildDistinctChoices, shuffle } from './choices';

/**
 * Red-Black tree insertion, translated from the official exercisegenerator
 * (RedBlackTreeNode.balanceWithSteps / addCase1-3). We implement the standard
 * CLRS insertion fixup: new node is RED, then resolve red-red conflicts by
 * recoloring and rotating. The BST insertion rule is the same (<= goes right).
 */

type Color = 'red' | 'black';

interface RBNode {
  value: number;
  color: Color;
  left: RBNode | null;
  right: RBNode | null;
}

function mk(value: number, color: Color = 'red'): RBNode {
  return { value, color, left: null, right: null };
}

function getRandomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/** BST insert (node.value <= value -> right), new node red. Returns root (may need fixup). */
function bstInsert(root: RBNode | null, value: number): RBNode {
  if (!root) return mk(value, 'black'); // first node becomes root (black)
  let cur = root;
  while (true) {
    if (cur.value <= value) {
      if (cur.right === null) { cur.right = mk(value); break; }
      cur = cur.right;
    } else {
      if (cur.left === null) { cur.left = mk(value); break; }
      cur = cur.left;
    }
  }
  return root;
}

/** Resolve red-red conflicts (CLRS fixup). Mutates the tree in place. */
function fixup(root: RBNode, value: number): RBNode {
  // Find the newly inserted node and its parent; do standard fixup.
  let z: RBNode = root;
  while (z && z.value !== value) {
    z = value <= z.value ? (z.right as RBNode) : (z.left as RBNode);
  }
  // Iterative fixup using parent/grandparent pointers reconstructed via search.
  // We re-walk from root each iteration (simple, correct for small trees).
  let changed = true;
  while (changed) {
    changed = false;
    const stack: RBNode[] = [];
    let n: RBNode | null = root;
    while (n) { stack.push(n); n = value <= n.value ? n.right : n.left; }
    // stack path to z; find parent & grandparent
    const idx = stack.findIndex((s) => s.value === value);
    if (idx < 1) break; // z is root
    const parent = stack[idx - 1];
    if (parent.color === 'black') break;
    if (idx < 2) break;
    const grand = stack[idx - 2];
    const pIsLeft = grand.left === parent;
    const uncle = pIsLeft ? grand.right : grand.left;
    if (uncle && uncle.color === 'red') {
      parent.color = 'black';
      uncle.color = 'black';
      grand.color = 'red';
      changed = true;
      // continue fixup from grandparent
      value = grand.value;
    } else {
      // rotation case
      let newSub: RBNode;
      if (pIsLeft) {
        if (parent.right === z) { rotateLeftInPlace(root, parent.value); z = parent; }
        newSub = rotateRightInPlace(root, grand.value);
      } else {
        if (parent.left === z) { rotateRightInPlace(root, parent.value); z = parent; }
        newSub = rotateLeftInPlace(root, grand.value);
      }
      // recolor
      newSub.color = 'black';
      (newSub.left as RBNode).color = 'red';
      (newSub.right as RBNode).color = 'red';
      changed = true;
      break;
    }
  }
  // root must be black
  root.color = 'black';
  return root;
}

/** Rotate left around node with given value; returns new subtree root. Mutates tree. */
function rotateLeftInPlace(root: RBNode, value: number): RBNode {
  let parentOfTarget: RBNode | null = null;
  let target: RBNode = root;
  let prev: RBNode | null = null;
  while (target && target.value !== value) {
    prev = target;
    parentOfTarget = target;
    target = value <= target.value ? (target.right as RBNode) : (target.left as RBNode);
  }
  if (!target || !target.right) return root;
  const newRoot = target.right;
  target.right = newRoot.left;
  newRoot.left = target;
  if (prev === null) return newRoot;
  if (prev.left === target) prev.left = newRoot; else prev.right = newRoot;
  return root;
}

function rotateRightInPlace(root: RBNode, value: number): RBNode {
  let prev: RBNode | null = null;
  let target: RBNode = root;
  while (target && target.value !== value) {
    prev = target;
    target = value <= target.value ? (target.right as RBNode) : (target.left as RBNode);
  }
  if (!target || !target.left) return root;
  const newRoot = target.left;
  target.left = newRoot.right;
  newRoot.right = target;
  if (prev === null) return newRoot;
  if (prev.left === target) prev.left = newRoot; else prev.right = newRoot;
  return root;
}

function toJSON(n: RBNode | null): TreeNodeJSON | null {
  if (!n) return null;
  return { value: n.value, color: n.color, left: toJSON(n.left), right: toJSON(n.right) };
}

function cloneJSON(n: TreeNodeJSON | null): TreeNodeJSON | null {
  if (!n) return null;
  return { value: n.value, color: n.color, left: cloneJSON(n.left ?? null), right: cloneJSON(n.right ?? null) };
}

function buildRandomRB(size: number): RBNode | null {
  const values = new Set<number>();
  while (values.size < size) values.add(getRandomInt(1, 99));
  let root: RBNode | null = null;
  for (const v of values) {
    root = bstInsert(root, v);
    root = fixup(root, v);
  }
  return root;
}

/** Distractor: all-red (no recolor). */
function allRed(start: TreeNodeJSON | null): TreeNodeJSON | null {
  const t = cloneJSON(start);
  const paint = (n: TreeNodeJSON | null): void => { if (!n) return; n.color = 'red'; paint(n.left ?? null); paint(n.right ?? null); };
  if (t) paint(t);
  return t;
}

/** Distractor: insert without fixup (plain BST placement, colors from start). */
function plainInsert(start: TreeNodeJSON | null, value: number): TreeNodeJSON | null {
  const t = cloneJSON(start);
  const place = (n: TreeNodeJSON | null): TreeNodeJSON => {
    if (!n) return { value, color: 'red', left: null, right: null };
    if ((n.value as number) <= value) n.right = place(n.right ?? null);
    else n.left = place(n.left ?? null);
    return n;
  };
  return t ? place(t) : null;
}

/** Distractor: swap one leaf color. */
function flipOneColor(start: TreeNodeJSON | null): TreeNodeJSON | null {
  const t = cloneJSON(start);
  const flip = (n: TreeNodeJSON | null): boolean => {
    if (!n) return false;
    if (n.left === null && n.right === null) { n.color = n.color === 'red' ? 'black' : 'red'; return true; }
    return flip(n.left ?? null) || flip(n.right ?? null);
  };
  if (t && !flip(t)) t.color = t.color === 'red' ? 'black' : 'red';
  return t;
}

/** Fallback distractor: clone correct tree and bump a leaf value. */
function bumpLeaf(correct: TreeNodeJSON, index: number): TreeNodeJSON | null {
  const t = cloneJSON(correct);
  const bump = (n: TreeNodeJSON | null): void => {
    if (!n) return;
    if (n.left === null && n.right === null) { n.value = (n.value ?? 0) + 100 + index; return; }
    if (n.left) bump(n.left); else if (n.right) bump(n.right);
  };
  if (t) bump(t);
  return t;
}

export function generateRedBlackInsertion(): TaskData {
  const start = buildRandomRB(getRandomInt(3, 5));
  const startJSON = toJSON(start);
  const insertValue = getRandomInt(1, 99);
  let result = bstInsert(start, insertValue);
  result = fixup(result, insertValue);
  const resultJSON = toJSON(result)!;

  const choices: ChoiceOption[] = buildDistinctChoices(
    resultJSON,
    [
      () => allRed(startJSON),
      () => plainInsert(startJSON, insertValue),
      () => flipOneColor(resultJSON),
    ],
    (i) => bumpLeaf(resultJSON, i),
  );
  shuffle(choices);

  return {
    type: 'dsal_rb_insert',
    mathQuery: `\\text{Füge den Wert } ${insertValue} \\text{ in den Rot-Schwarz-Baum ein.}`,
    answer: choices.find((c) => c.tree === resultJSON)!.id,
    renderMode: 'tree',
    tree: startJSON ?? undefined,
    choices,
    prompt: `Wohin gehört ${insertValue} und wie sieht der Rot-Schwarz-Baum nach Umfärbung/Rotation aus?`,
    inputHint: 'Wähle den korrekten Rot-Schwarz-Baum (Wurzel ist schwarz).',
    explanation: [
      `Neuer Knoten wird rot eingefügt (\\leq \\to \\text{rechts}).`,
      `Bei rot-rot-Konflikt: Onkel rot → Umfärbung; sonst Rotation + Umfärbung.`,
      `Die Wurzel ist am Ende immer schwarz.`,
    ],
  };
}
