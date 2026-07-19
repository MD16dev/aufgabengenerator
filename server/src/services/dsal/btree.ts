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

/**
 * A B-tree is only valid if every leaf sits at the same depth and every node's
 * keys are ordered with the children correctly separated. Small random trees
 * (few keys) often violate the "all leaves same level" invariant, which makes
 * the rendered tree ambiguous/wrong. This helper verifies validity so we can
 * regenerate until we get a proper tree.
 */
function isValidBTree(node: BNode, degree: number): boolean {
  if (node.keys.length > maxKeys(degree)) return false;
  // Check key ordering within the node.
  for (let i = 1; i < node.keys.length; i++) {
    if (node.keys[i] <= node.keys[i - 1]) return false;
  }
  if (node.children.length === 0) return true; // leaf
  if (node.children.length !== node.keys.length + 1) return false;
  // Recurse: every child must be a valid B-tree, and all leaves at same depth.
  const depths = node.children.map((c) => leafDepth(c));
  if (new Set(depths).size > 1) return false;
  return node.children.every((c) => isValidBTree(c, degree));
}

function leafDepth(node: BNode): number {
  if (node.children.length === 0) return 1;
  return 1 + leafDepth(node.children[0]);
}

export function generateBTreeInsertion(): TaskData {
  const degree = 2;
  // Regenerate until we get a valid B-tree (all leaves at the same depth). Small
  // random trees frequently violate this, which made the rendered tree wrong.
  let start: BNode;
  let attempts = 0;
  do {
    start = buildRandomBTree(degree, getRandomInt(4, 7));
    attempts++;
  } while (!isValidBTree(start, degree) && attempts < 200);
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
    prompt: `B-Baum, Grad $t=${degree}$ (max. ${maxKeys(degree)} Schlüssel pro Knoten). Fügen Sie die Werte nacheinander sortiert ein; bei Überlauf wird der Knoten gespalten.`,
    inputHint: 'Zeige nach jeder Operation den korrekten B-Baum.',
    taskList,
    steps,
    explanation: [
      `Schlüssel werden sortiert eingefügt; bei Überlauf (>${maxKeys(degree)} Schlüssel) wird der Knoten gespalten.`,
      `Der mittlere Schlüssel wandert eine Ebene nach oben.`,
    ],
  };
}

/** Find the index of the first key > value (child pointer to follow). */
function childIndex(node: BNode, value: number): number {
  let i = 0;
  while (i < node.keys.length && value > node.keys[i]) i++;
  return i;
}

/**
 * B-tree deletion (immutable), standard recursive algorithm (CLRS-style):
 *  - If the key is in a leaf, remove it directly.
 *  - If the key is in an inner node, replace it with its in-order predecessor
 *    (rightmost key of the left subtree) and delete that predecessor from the
 *    leaf instead.
 *  - Before descending into a child, ensure that child has at least `degree`
 *    keys (so a later removal cannot underflow): borrow from a sibling or
 *    merge with one. This guarantees the recursive step never hits an
 *    underflow, so the result is always a valid B-tree.
 */
function deleteBTree(root: BNode, degree: number, value: number): { root: BNode; annotation: string } {
  const minKeys = degree - 1;
  const annotations: string[] = [];

  function contains(n: BNode, v: number): boolean {
    return n.keys.includes(v);
  }

  function exists(n: BNode): boolean {
    if (contains(n, value)) return true;
    return n.children.some((c) => exists(c));
  }

  /** Remove `v` from a leaf node. */
  function removeFromLeaf(node: BNode, v: number): BNode {
    return { keys: node.keys.filter((k) => k !== v), children: node.children };
  }

  /** Borrow a key from the left sibling into `child` (separator from parent). */
  function borrowFromLeft(parent: BNode, idx: number): BNode {
    const child = parent.children[idx];
    const left = parent.children[idx - 1];
    const sep = parent.keys[idx - 1];
    const newChildKeys = [sep, ...child.keys];
    const newChildChildren = left.children.length > 0
      ? [left.children[left.children.length - 1], ...child.children]
      : child.children;
    const newLeftKeys = left.keys.slice(0, -1);
    const newLeftChildren = left.children.slice(0, -1);
    const newParentKeys = [...parent.keys];
    newParentKeys[idx - 1] = left.keys[left.keys.length - 1];
    const newChildren = [...parent.children];
    newChildren[idx - 1] = { keys: newLeftKeys, children: newLeftChildren };
    newChildren[idx] = { keys: newChildKeys, children: newChildChildren };
    annotations.push(`Unterlauf droht → Schlüssel ${sep} vom linken Geschwister borgen.`);
    return { keys: newParentKeys, children: newChildren };
  }

  /** Borrow a key from the right sibling into `child`. */
  function borrowFromRight(parent: BNode, idx: number): BNode {
    const child = parent.children[idx];
    const right = parent.children[idx + 1];
    const sep = parent.keys[idx];
    const newChildKeys = [...child.keys, sep];
    const newChildChildren = right.children.length > 0
      ? [...child.children, right.children[0]]
      : child.children;
    const newRightKeys = right.keys.slice(1);
    const newRightChildren = right.children.slice(1);
    const newParentKeys = [...parent.keys];
    newParentKeys[idx] = right.keys[0];
    const newChildren = [...parent.children];
    newChildren[idx] = { keys: newChildKeys, children: newChildChildren };
    newChildren[idx + 1] = { keys: newRightKeys, children: newRightChildren };
    annotations.push(`Unterlauf droht → Schlüssel ${sep} vom rechten Geschwister borgen.`);
    return { keys: newParentKeys, children: newChildren };
  }

  /** Merge child at `idx` with its left sibling, pulling down the separator. */
  function mergeWithLeft(parent: BNode, idx: number): BNode {
    const child = parent.children[idx];
    const left = parent.children[idx - 1];
    const sep = parent.keys[idx - 1];
    const mergedKeys = [...left.keys, sep, ...child.keys];
    const mergedChildren = left.children.length > 0
      ? [...left.children, ...child.children]
      : [];
    const newKeys = parent.keys.filter((_, k) => k !== idx - 1);
    const newChildren = parent.children.filter((_, k) => k !== idx);
    newChildren[idx - 1] = { keys: mergedKeys, children: mergedChildren };
    annotations.push(`Unterlauf droht → mit linkem Geschwister und Trennschlüssel ${sep} verschmelzen.`);
    return { keys: newKeys, children: newChildren };
  }

  /** Merge child at `idx` with its right sibling. */
  function mergeWithRight(parent: BNode, idx: number): BNode {
    const child = parent.children[idx];
    const right = parent.children[idx + 1];
    const sep = parent.keys[idx];
    const mergedKeys = [...child.keys, sep, ...right.keys];
    const mergedChildren = child.children.length > 0
      ? [...child.children, ...right.children]
      : [];
    const newKeys = parent.keys.filter((_, k) => k !== idx);
    const newChildren = parent.children.filter((_, k) => k !== idx + 1);
    newChildren[idx] = { keys: mergedKeys, children: mergedChildren };
    annotations.push(`Unterlauf droht → mit rechtem Geschwister und Trennschlüssel ${sep} verschmelzen.`);
    return { keys: newKeys, children: newChildren };
  }

  /** Ensure child `idx` of `node` has >= degree keys before descending. */
  function ensureChildFull(node: BNode, idx: number): BNode {
    const child = node.children[idx];
    if (child.keys.length >= degree) return node;
    const hasLeft = idx > 0;
    const hasRight = idx < node.children.length - 1;
    if (hasLeft && node.children[idx - 1].keys.length >= degree) {
      return borrowFromLeft(node, idx);
    }
    if (hasRight && node.children[idx + 1].keys.length >= degree) {
      return borrowFromRight(node, idx);
    }
    if (hasLeft) {
      return mergeWithLeft(node, idx);
    }
    return mergeWithRight(node, idx);
  }

  /** Recursive deletion. `target` is the key to actually remove from `n`. */
  function delInSubtree(n: BNode, target: number): BNode {
    if (!n) return n;
    const idx = n.keys.indexOf(target);
    if (idx !== -1) {
      if (isLeaf(n)) {
        annotations.push(`Schlüssel ${target} steht in einem Blatt → wird direkt entfernt.`);
        return removeFromLeaf(n, target);
      }
      const leftChild = n.children[idx];
      const rightChild = n.children[idx + 1];
      if (leftChild.keys.length >= degree) {
        let predParent = leftChild;
        while (!isLeaf(predParent)) predParent = predParent.children[predParent.children.length - 1];
        const pred = predParent.keys[predParent.keys.length - 1];
        const newKeys = [...n.keys];
        newKeys[idx] = pred;
        annotations.push(`Schlüssel ${target} steht in einem Inneren Knoten. Linkes Kind hat genügend Schlüssel (>= ${degree}) → durch Vorgänger ${pred} ersetzen und diesen im linken Teilbaum löschen.`);
        const newChildren = [...n.children];
        newChildren[idx] = delInSubtree(leftChild, pred);
        return { keys: newKeys, children: newChildren };
      } else if (rightChild.keys.length >= degree) {
        let succParent = rightChild;
        while (!isLeaf(succParent)) succParent = succParent.children[0];
        const succ = succParent.keys[0];
        const newKeys = [...n.keys];
        newKeys[idx] = succ;
        annotations.push(`Schlüssel ${target} steht in einem Inneren Knoten. Rechtes Kind hat genügend Schlüssel (>= ${degree}) → durch Nachfolger ${succ} ersetzen und diesen im rechten Teilbaum löschen.`);
        const newChildren = [...n.children];
        newChildren[idx + 1] = delInSubtree(rightChild, succ);
        return { keys: newKeys, children: newChildren };
      } else {
        const mergedKeys = [...leftChild.keys, target, ...rightChild.keys];
        const mergedChildren = leftChild.children.length > 0
          ? [...leftChild.children, ...rightChild.children]
          : [];
        const mergedNode: BNode = { keys: mergedKeys, children: mergedChildren };
        const newKeys = n.keys.filter((_, k) => k !== idx);
        const newChildren = n.children.filter((_, k) => k !== idx + 1);
        newChildren[idx] = delInSubtree(mergedNode, target);
        annotations.push(`Schlüssel ${target} steht in einem Inneren Knoten. Beide Kinder haben nur ${degree - 1} Schlüssel → Kinder und Trennschlüssel verschmelzen, dann dort löschen.`);
        return { keys: newKeys, children: newChildren };
      }
    }
    if (isLeaf(n)) return n;
    const ci = childIndex(n, target);
    const ensured = ensureChildFull(n, ci);
    // After ensureChildFull, the child index may have shifted (a merge with the
    // left sibling collapses two children into one at ci-1). Recompute.
    let newCi = ci;
    if (ci > 0 && (!ensured.children[ci] || ensured.children[ci].keys.length < degree)) {
      newCi = ci - 1;
    }
    const newChildren = [...ensured.children];
    newChildren[newCi] = delInSubtree(ensured.children[newCi], target);
    return { keys: [...ensured.keys], children: newChildren };
  }

  if (!exists(root)) {
    return { root, annotation: `Wert ${value} ist nicht im Baum.` };
  }

  let result = delInSubtree(root, value);

  // If the root lost all its keys but still has a single child, collapse.
  if (result.keys.length === 0 && result.children.length === 1) {
    result = result.children[0];
    annotations.push(`Wurzel ist leer → einziger Kindknoten wird neue Wurzel.`);
  }

  return { root: result, annotation: annotations.join(' ') || `Schlüssel ${value} entfernt.` };
}

// Only proceed if the value exists somewhere.

export function generateBTreeDeletion(): TaskData {
  const degree = 2;
  let start: BNode;
  let attempts = 0;
  do {
    start = buildRandomBTree(degree, getRandomInt(6, 9));
    attempts++;
  } while (!isValidBTree(start, degree) && attempts < 200);
  const startJSON = toJSON(start);

  const numOps = getRandomInt(1, 2);
  const steps: TaskData['steps'] = [];
  const taskList: string[] = [];
  let current: BNode = start;
  const collect = (n: BNode, acc: number[] = []): number[] => {
    for (const k of n.keys) acc.push(k);
    for (const c of n.children) collect(c, acc);
    return acc;
  };
  for (let i = 0; i < numOps; i++) {
    const all = collect(current);
    const delVal = all[getRandomInt(0, all.length - 1)];
    const r = deleteBTree(current, degree, delVal);
    current = r.root;
    steps.push({
      instruction: `Lösche den Wert ${delVal} aus dem B-Baum (Grad $t=${degree}$).`,
      kind: 'tree',
      tree: toJSON(current),
      annotation: r.annotation,
    });
    taskList.push(`${i + 1}. ${delVal} löschen`);
  }

  return {
    type: 'dsal_btree_delete',
    mathQuery: `\\text{Führe die Lösch-Operationen nacheinander aus und gib den Baum nach jeder Operation an.}`,
    answer: '',
    renderMode: 'tree',
    tree: startJSON,
    prompt: `B-Baum, Grad $t=${degree}$ (min. ${degree - 1}, max. ${maxKeys(degree)} Schlüssel pro Knoten). Lösche die Werte; bei Unterlauf wird geborgt oder verschmolzen.`,
    inputHint: 'Zeige nach jeder Operation den korrekten B-Baum.',
    taskList,
    steps,
    explanation: [
      `Ist der zu löschende Schlüssel in einem Inneren Knoten, wird er durch seinen Vorgänger ersetzt und unten gelöscht.`,
      `Hat ein Knoten nach dem Löschen zu wenig Schlüssel (<${degree - 1}), wird vom Geschwister geborgt oder mit ihm verschmolzen.`,
    ],
  };
}
