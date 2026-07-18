import { TaskData, TreeNodeJSON, ChoiceOption } from '../math/types';
import { buildDistinctChoices, shuffle } from './choices';

/**
 * AVL tree insertion, translated from the official exercisegenerator
 * (AVLTreeNode.balanceWithSteps / balanceLeftToRight / balanceRightToLeft).
 * Insertion uses the same BST rule as the official BST (<= goes right).
 */

interface AVLNode {
  value: number;
  left: AVLNode | null;
  right: AVLNode | null;
  height: number;
}

function h(n: AVLNode | null): number {
  return n ? n.height : 0;
}

function update(n: AVLNode): void {
  n.height = 1 + Math.max(h(n.left), h(n.right));
}

function rotateRight(y: AVLNode): AVLNode {
  const x = y.left!;
  const t2 = x.right;
  x.right = y;
  y.left = t2;
  update(y);
  update(x);
  return x;
}

function rotateLeft(x: AVLNode): AVLNode {
  const y = x.right!;
  const t2 = y.left;
  y.left = x;
  x.right = t2;
  update(x);
  update(y);
  return y;
}

function insert(node: AVLNode | null, value: number): AVLNode {
  if (!node) return { value, left: null, right: null, height: 1 };
  if (node.value <= value) node.right = insert(node.right, value);
  else node.left = insert(node.left, value);
  update(node);
  const balance = h(node.left) - h(node.right);
  // Left heavy
  if (balance > 1) {
    const left = node.left!;
    if (h(left.left) >= h(left.right)) return rotateRight(node);
    node.left = rotateLeft(left);
    return rotateRight(node);
  }
  // Right heavy
  if (balance < -1) {
    const right = node.right!;
    if (h(right.right) >= h(right.left)) return rotateLeft(node);
    node.right = rotateRight(right);
    return rotateLeft(node);
  }
  return node;
}

function toJSON(node: AVLNode | null): TreeNodeJSON | null {
  if (!node) return null;
  return { value: node.value, height: node.height, left: toJSON(node.left), right: toJSON(node.right) };
}

function cloneJSON(n: TreeNodeJSON | null): TreeNodeJSON | null {
  if (!n) return null;
  return { value: n.value, height: n.height, left: cloneJSON(n.left ?? null), right: cloneJSON(n.right ?? null) };
}

function getRandomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function buildRandomAVL(size: number): AVLNode | null {
  const values = new Set<number>();
  while (values.size < size) values.add(getRandomInt(1, 99));
  let root: AVLNode | null = null;
  for (const v of values) root = insert(root, v);
  return root;
}

/** Distractor: insert without balancing (plain BST placement, keep heights from start). */
function plainInsert(start: TreeNodeJSON | null, value: number): TreeNodeJSON | null {
  const t = cloneJSON(start);
  const place = (n: TreeNodeJSON | null): TreeNodeJSON => {
    if (!n) return { value, height: 1, left: null, right: null };
    if ((n.value as number) <= value) n.right = place(n.right ?? null);
    else n.left = place(n.left ?? null);
    return n;
  };
  return t ? place(t) : null;
}

/** Distractor: attach as leaf at wrong parent (no balance). */
function duplicateLeaf(start: TreeNodeJSON | null, value: number): TreeNodeJSON | null {
  const t = cloneJSON(start);
  const attach = (n: TreeNodeJSON | null): boolean => {
    if (!n) return false;
    if (value > (n.value as number) && n.right === null) { n.right = { value, height: 1, left: null, right: null }; return true; }
    if (value <= (n.value as number) && n.left === null) { n.left = { value, height: 1, left: null, right: null }; return true; }
    return attach(n.left ?? null) || attach(n.right ?? null);
  };
  if (t && !attach(t)) t.right = { value, height: 1, left: null, right: null };
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

export function generateAVLInsertion(): TaskData {
  const start = buildRandomAVL(getRandomInt(3, 5));
  const startJSON = toJSON(start);
  const insertValue = getRandomInt(1, 99);
  const result = insert(start, insertValue);
  const resultJSON = toJSON(result)!;

  const choices: ChoiceOption[] = buildDistinctChoices(
    resultJSON,
    [
      () => plainInsert(startJSON, insertValue),
      () => duplicateLeaf(startJSON, insertValue),
    ],
    (i) => bumpLeaf(resultJSON, i),
  );
  shuffle(choices);

  return {
    type: 'dsal_avl_insert',
    mathQuery: `\\text{Füge den Wert } ${insertValue} \\text{ in den AVL-Baum ein und balanciere.}`,
    answer: choices.find((c) => c.tree === resultJSON)!.id,
    renderMode: 'tree',
    tree: startJSON ?? undefined,
    choices,
    prompt: `Wohin gehört ${insertValue} und wie sieht der balancierte AVL-Baum danach aus?`,
    inputHint: 'Wähle den korrekt balancierten Baum.',
    explanation: [
      `Einfügen wie im BST (\\leq \\to \\text{rechts}), dann Balancefaktor prüfen.`,
      `Bei Ungleichgewicht wird rotiert (einfach oder doppelt).`,
    ],
  };
}
