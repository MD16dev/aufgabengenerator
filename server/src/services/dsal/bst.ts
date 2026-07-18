import { TaskData, TreeNodeJSON, ChoiceOption } from '../math/types';
import { buildDistinctChoices, shuffle } from './choices';

/**
 * Binary Search Tree insertion, translated from the official exercisegenerator
 * (branch rwth-dsal-bst-insertion). The defining rule there is
 * `compareTo(value) <= 0 -> insert into the RIGHT child`, i.e. equal values go
 * to the right. We keep that exact behaviour so the generated tasks match the
 * official ones.
 *
 * Source: BinarySearchTreeAlgorithm.java, BinaryTree.java, BinaryTreeNode.addWithSteps
 */

interface BSTNode {
  value: number;
  left: BSTNode | null;
  right: BSTNode | null;
}

function getRandomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/** Build a random BST of the given size from distinct values in [1, maxVal]. */
function buildRandomBST(size: number, maxVal: number): BSTNode | null {
  const values = new Set<number>();
  while (values.size < size) {
    values.add(getRandomInt(1, maxVal));
  }
  let root: BSTNode | null = null;
  for (const v of values) {
    root = insert(root, v);
  }
  return root;
}

/** Insert with the official rule: node.value <= value goes right (equal values right). */
function insert(node: BSTNode | null, value: number): BSTNode {
  if (node === null) {
    return { value, left: null, right: null };
  }
  if (node.value <= value) {
    node.right = insert(node.right, value);
  } else {
    node.left = insert(node.left, value);
  }
  return node;
}

/** Insert returning a NEW tree (immutable) so we can keep the original for distractors. */
function insertCopy(node: BSTNode | null, value: number): BSTNode | null {
  if (node === null) {
    return { value, left: null, right: null };
  }
  const copy: BSTNode = { value: node.value, left: node.left, right: node.right };
  if (copy.value <= value) {
    copy.right = insertCopy(copy.right, value);
  } else {
    copy.left = insertCopy(copy.left, value);
  }
  return copy;
}

function toJSON(node: BSTNode | null): TreeNodeJSON | null {
  if (node === null) return null;
  return { value: node.value, left: toJSON(node.left), right: toJSON(node.right) };
}

function cloneJSON(node: TreeNodeJSON | null): TreeNodeJSON | null {
  if (node === null) return null;
  return {
    value: node.value,
    left: cloneJSON(node.left ?? null),
    right: cloneJSON(node.right ?? null),
  };
}

function size(node: BSTNode | null): number {
  if (!node) return 0;
  return 1 + size(node.left) + size(node.right);
}

function collectValues(node: BSTNode | null): number[] {
  if (!node) return [];
  return [...collectValues(node.left), node.value, ...collectValues(node.right)];
}

/** Distractor: insert the value on the opposite side (node.value <= value -> LEFT). */
function wrongSide(start: TreeNodeJSON | null, value: number): TreeNodeJSON | null {
  const t = cloneJSON(start);
  const place = (n: TreeNodeJSON | null): TreeNodeJSON => {
    if (!n) return { value, left: null, right: null };
    if ((n.value as number) <= value) n.left = place(n.left ?? null);
    else n.right = place(n.right ?? null);
    return n;
  };
  return t ? place(t) : null;
}

/** Distractor: equal value goes LEFT (instead of right). */
function equalLeft(start: TreeNodeJSON | null, value: number): TreeNodeJSON | null {
  const t = cloneJSON(start);
  const place = (n: TreeNodeJSON | null): TreeNodeJSON => {
    if (!n) return { value, left: null, right: null };
    if (value <= (n.value as number)) n.left = place(n.left ?? null);
    else n.right = place(n.right ?? null);
    return n;
  };
  return t ? place(t) : null;
}

/** Distractor: attach value as a duplicate leaf under a random existing node. */
function duplicateLeaf(start: TreeNodeJSON | null, value: number): TreeNodeJSON | null {
  const t = cloneJSON(start);
  const attach = (n: TreeNodeJSON | null): boolean => {
    if (!n) return false;
    if (value > (n.value as number) && n.right === null) { n.right = { value, left: null, right: null }; return true; }
    if (value <= (n.value as number) && n.left === null) { n.left = { value, left: null, right: null }; return true; }
    return attach(n.left ?? null) || attach(n.right ?? null);
  };
  if (t && !attach(t)) t.right = { value, left: null, right: null };
  return t;
}

/** Fallback distractor: clone the correct tree and bump a leaf value. */
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

export function generateBSTInsertion(): TaskData {
  const startTree = buildRandomBST(getRandomInt(4, 7), 99);
  const startJSON = toJSON(startTree);

  // Choose an insert value. With some probability pick a value already present
  // to exercise the "equal goes right" rule.
  const existing = collectValues(startTree);
  let insertValue: number;
  if (existing.length > 0 && Math.random() < 0.4) {
    insertValue = existing[getRandomInt(0, existing.length - 1)];
  } else {
    insertValue = getRandomInt(1, 99);
  }

  const resultTree = insertCopy(startTree, insertValue);
  const resultJSON = toJSON(resultTree)!;

  const choices: ChoiceOption[] = buildDistinctChoices(
    resultJSON,
    [
      () => wrongSide(startJSON, insertValue),
      () => equalLeft(startJSON, insertValue),
      () => duplicateLeaf(startJSON, insertValue),
    ],
    (i) => bumpLeaf(resultJSON, i),
  );
  shuffle(choices);

  return {
    type: 'dsal_bst_insert',
    mathQuery: `\\text{Füge den Wert } ${insertValue} \\text{ in den Binär-Suchbaum ein.}`,
    answer: choices.find((c) => c.tree === resultJSON)!.id,
    renderMode: 'tree',
    tree: startJSON ?? undefined,
    choices,
    prompt: `Wohin gehört der Wert ${insertValue}? (Gleiche Werte werden im offiziellen BST rechts eingehängt.)`,
    inputHint: 'Wähle den Baum, der nach dem Einfügen entsteht.',
    explanation: [
      `Ausgangsbaum hat ${size(startTree)} Knoten.`,
      `Einfügeregel: Ist der Wert $\\leq$ einem Knoten, geht er in dessen rechtes Kind; sonst links.`,
      `Der Wert ${insertValue} wird daher an der korrekten Stelle eingehängt.`,
    ],
  };
}
