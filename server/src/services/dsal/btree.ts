import { TaskData, TreeNodeJSON } from '../math/types';

/**
 * B-tree insertion, translated from the official exercisegenerator
 * (BTree.addWithSteps / BTreeNode.addWithSteps / split). A node may hold up to
 * 2*degree-1 keys; on overflow it splits and pushes its middle key up.
 * Produces a stepwise flashcard: one result tree per insert operation, with a
 * split annotation when a node overflowed.
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

/** Insert into a B-tree (immutable, returns new root + split annotation). */
function insert(root: BNode, degree: number, value: number): { root: BNode; annotation: string } {
  const res = insertNonFull(root, degree, value);
  // If the root overflowed, split it and create a new root above.
  if (res.root.keys.length > maxKeys(degree)) {
    const before = res.root.keys.length;
    const split = splitNode(res.root, degree);
    return {
      root: { keys: [split.mid], children: [split.left, split.right] },
      annotation: `Wurzel überläuft (${before} > ${maxKeys(degree)} Schlüssel) → Split: mittlerer Schlüssel ${split.mid} wandert nach oben.`,
    };
  }
  return res;
}

function insertNonFull(node: BNode, degree: number, value: number): { root: BNode; annotation: string } {
  if (isLeaf(node)) {
    const keys = [...node.keys, value].sort((a, b) => a - b);
    return { root: { keys, children: [] }, annotation: 'Einfügen in Blatt (sortiert).' };
  }
  // find child index
  let i = 0;
  while (i < node.keys.length && value > node.keys[i]) i++;
  const child = node.children[i];
  const res = insertNonFull(child, degree, value);
  const children = [...node.children];
  children[i] = res.root;
  let keys = [...node.keys];
  let annotation = res.annotation;
  if (res.root.keys.length > maxKeys(degree)) {
    const before = res.root.keys.length;
    const split = splitNode(res.root, degree);
    keys.splice(i, 0, split.mid);
    children.splice(i, 1, split.left, split.right);
    annotation = `Knoten überläuft (${before} > ${maxKeys(degree)} Schlüssel) → Split: mittlerer Schlüssel ${split.mid} wandert nach oben.`;
  }
  return { root: { keys, children }, annotation };
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

function buildRandomBTree(degree: number, size: number): BNode {
  const values = new Set<number>();
  while (values.size < size) values.add(getRandomInt(1, 99));
  let root: BNode = { keys: [], children: [] };
  for (const v of values) root = insert(root, degree, v).root;
  return root;
}

export function generateBTreeInsertion(): TaskData {
  const degree = 2;
  const start = buildRandomBTree(degree, getRandomInt(4, 7));
  const startJSON = toJSON(start);

  const numOps = getRandomInt(1, 3);
  const steps: TaskData['steps'] = [];
  const taskList: string[] = [];
  let current: BNode = start;
  const usedValues = new Set<number>();
  const collect = (n: BNode) => {
    for (const k of n.keys) usedValues.add(k);
    for (const c of n.children) collect(c);
  };
  collect(start);

  for (let i = 0; i < numOps; i++) {
    // Retry until the insert actually triggers a split, so the task requires
    // real work (a no-split insert is didactically dull).
    let insertValue: number;
    let r: { root: BNode; annotation: string };
    let tries = 0;
    do {
      do {
        insertValue = getRandomInt(1, 99);
      } while (usedValues.has(insertValue));
      r = insert(current, degree, insertValue);
      tries++;
    } while (!r.annotation.includes('Split') && tries < 40);
    usedValues.add(insertValue);
    current = r.root;
    steps.push({
      instruction: `Füge den Wert ${insertValue} in den B-Baum (Grad $t=${degree}$) ein.`,
      kind: 'tree',
      tree: toJSON(current),
      annotation: r.annotation,
    });
    taskList.push(`${i + 1}. ${insertValue} einfügen`);
  }

  return {
    type: 'dsal_btree_insert',
    mathQuery: `\\text{Führe die Einfüge-Operationen nacheinander aus und gib den Baum nach jeder Operation an.}`,
    answer: '',
    renderMode: 'tree',
    tree: startJSON,
    prompt: `Ausgangs-B-Baum (max. ${maxKeys(degree)} Schlüssel pro Knoten).`,
    inputHint: 'Zeige nach jeder Operation den korrekten B-Baum.',
    taskList,
    steps,
    explanation: [
      `Schlüssel werden sortiert eingefügt; bei Überlauf (>${maxKeys(degree)} Schlüssel) wird der Knoten gespalten.`,
      `Der mittlere Schlüssel wandert eine Ebene nach oben.`,
    ],
  };
}
