import { TaskData, TreeNodeJSON, ChoiceOption } from '../math/types';
import { buildDistinctChoices, shuffle } from './choices';

/**
 * B-tree insertion, translated from the official exercisegenerator
 * (BTree.addWithSteps / BTreeNode.addWithSteps / split). A node may hold up to
 * 2*degree-1 keys; on overflow it splits and pushes its middle key up.
 */

interface BNode {
  keys: number[];
  children: BNode[];
}

function getRandomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function isLeaf(n: BNode): boolean {
  return n.children.length === 0;
}

function maxKeys(degree: number): number {
  return 2 * degree - 1;
}

/** Insert into a B-tree (immutable-ish, returns new root). */
function insert(root: BNode, degree: number, value: number): BNode {
  const newRoot = insertNonFull(root, degree, value);
  // If the root overflowed, split it and create a new root above.
  if (newRoot.keys.length > maxKeys(degree)) {
    const split = splitNode(newRoot, degree);
    return { keys: [split.mid], children: [split.left, split.right] };
  }
  return newRoot;
}

function insertNonFull(node: BNode, degree: number, value: number): BNode {
  if (isLeaf(node)) {
    const keys = [...node.keys, value].sort((a, b) => a - b);
    return { keys, children: [] };
  }
  // find child index
  let i = 0;
  while (i < node.keys.length && value > node.keys[i]) i++;
  const child = node.children[i];
  const newChild = insertNonFull(child, degree, value);
  const children = [...node.children];
  children[i] = newChild;
  let keys = [...node.keys];
  if (newChild.keys.length > maxKeys(degree)) {
    const split = splitNode(newChild, degree);
    keys.splice(i, 0, split.mid);
    children.splice(i, 1, split.left, split.right);
  }
  return { keys, children };
}

function splitNode(node: BNode, degree: number): { mid: number; left: BNode; right: BNode } {
  const midIndex = degree - 1;
  const mid = node.keys[midIndex];
  const leftKeys = node.keys.slice(0, midIndex);
  const rightKeys = node.keys.slice(midIndex + 1);
  let leftChildren: BNode[] = [];
  let rightChildren: BNode[] = [];
  if (!isLeaf(node)) {
    leftChildren = node.children.slice(0, midIndex + 1);
    rightChildren = node.children.slice(midIndex + 1);
  }
  return { mid, left: { keys: leftKeys, children: leftChildren }, right: { keys: rightKeys, children: rightChildren } };
}

function toJSON(n: BNode): TreeNodeJSON {
  return {
    values: [...n.keys],
    children: n.children.map((c) => toJSON(c)),
  };
}

function cloneJSON(n: TreeNodeJSON | null): TreeNodeJSON | null {
  if (!n) return null;
  return {
    values: n.values ? [...n.values] : undefined,
    children: n.children ? n.children.map((c) => cloneJSON(c)) : undefined,
  };
}

function buildRandomBTree(degree: number, size: number): BNode {
  const values = new Set<number>();
  while (values.size < size) values.add(getRandomInt(1, 99));
  let root: BNode = { keys: [], children: [] };
  for (const v of values) root = insert(root, degree, v);
  return root;
}

/** Distractor: insert without split (just add key to leaf, may overflow). */
function noSplit(start: TreeNodeJSON | null, value: number): TreeNodeJSON | null {
  const t = cloneJSON(start);
  const addToLeaf = (n: TreeNodeJSON | null): boolean => {
    if (!n) return false;
    if (!n.children || n.children.length === 0) {
      n.values = [...(n.values ?? []), value].sort((a, b) => a - b);
      return true;
    }
    let i = 0;
    while (i < (n.values ?? []).length && value > (n.values as number[])[i]) i++;
    return addToLeaf(n.children[i] ?? null);
  };
  if (t) addToLeaf(t);
  return t;
}

/** Distractor: wrong key placement (swap two keys in a node). */
function wrongPlace(start: TreeNodeJSON | null): TreeNodeJSON | null {
  const t = cloneJSON(start);
  const swapKeys = (n: TreeNodeJSON | null): boolean => {
    if (!n || !(n.values && n.values.length >= 2)) {
      if (n && n.children) for (const c of n.children) if (swapKeys(c)) return true;
      return false;
    }
    const v = n.values;
    [v[0], v[1]] = [v[1], v[0]];
    return true;
  };
  if (t) swapKeys(t);
  return t;
}

/** Fallback distractor: clone correct tree and bump a leaf key. */
function bumpLeaf(correct: TreeNodeJSON, index: number): TreeNodeJSON | null {
  const t = cloneJSON(correct);
  const bump = (n: TreeNodeJSON | null): void => {
    if (!n) return;
    if (!n.children || n.children.length === 0) {
      if (n.values && n.values.length > 0) n.values[0] = (n.values[0] ?? 0) + 100 + index;
      return;
    }
    for (const c of n.children) bump(c);
  };
  if (t) bump(t);
  return t;
}

export function generateBTreeInsertion(): TaskData {
  const degree = 2;
  const start = buildRandomBTree(degree, getRandomInt(4, 7));
  const startJSON = toJSON(start);
  const insertValue = getRandomInt(1, 99);
  const result = insert(start, degree, insertValue);
  const resultJSON = toJSON(result);

  const choices: ChoiceOption[] = buildDistinctChoices(
    resultJSON,
    [
      () => noSplit(startJSON, insertValue),
      () => wrongPlace(resultJSON),
    ],
    (i) => bumpLeaf(resultJSON, i),
  );
  shuffle(choices);

  return {
    type: 'dsal_btree_insert',
    mathQuery: `\\text{Füge den Wert } ${insertValue} \\text{ in den B-Baum (Grad } t=${degree}\\text{) ein.}`,
    answer: choices.find((c) => c.tree === resultJSON)!.id,
    renderMode: 'tree',
    tree: startJSON,
    choices,
    prompt: `Wohin gehört ${insertValue}? Achte auf Splits (max. ${maxKeys(degree)} Schlüssel pro Knoten).`,
    inputHint: 'Wähle den korrekten B-Baum nach dem Einfügen.',
    explanation: [
      `Schlüssel werden sortiert eingefügt; bei Überlauf (>${maxKeys(degree)} Schlüssel) wird der Knoten gespalten.`,
      `Der mittlere Schlüssel wandert eine Ebene nach oben.`,
    ],
  };
}
