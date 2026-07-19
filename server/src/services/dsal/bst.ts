import { TaskData, TreeNodeJSON } from '../math/types';

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

interface BSTInsertResult {
  node: BSTNode | null;
  parentValue: number | null;
  direction: 'left' | 'right' | null;
}

/** Immutable insert that also reports where the new node was attached (parent + side). */
function insertCopy(node: BSTNode | null, value: number): BSTInsertResult {
  if (node === null) {
    return { node: { value, left: null, right: null }, parentValue: null, direction: null };
  }
  const copy: BSTNode = { value: node.value, left: node.left, right: node.right };
  if (copy.value <= value) {
    const r = insertCopy(copy.right, value);
    copy.right = r.node;
    if (r.parentValue === null) {
      return { node: copy, parentValue: node.value, direction: 'right' };
    }
    return { node: copy, parentValue: r.parentValue, direction: r.direction };
  } else {
    const r = insertCopy(copy.left, value);
    copy.left = r.node;
    if (r.parentValue === null) {
      return { node: copy, parentValue: node.value, direction: 'left' };
    }
    return { node: copy, parentValue: r.parentValue, direction: r.direction };
  }
}

function toJSON(node: BSTNode | null): TreeNodeJSON | null {
  if (node === null) return null;
  return { value: node.value, left: toJSON(node.left), right: toJSON(node.right) };
}

function size(node: BSTNode | null): number {
  if (!node) return 0;
  return 1 + size(node.left) + size(node.right);
}

function collectValues(node: BSTNode | null): number[] {
  if (!node) return [];
  return [...collectValues(node.left), node.value, ...collectValues(node.right)];
}

export function generateBSTInsertion(): TaskData {
  const startTree = buildRandomBST(getRandomInt(4, 7), 99);
  const startJSON = toJSON(startTree);

  // Build a sequence of 1-3 insert operations, each producing the tree after
  // that insert. This mirrors the reference generator's "list of operations,
  // give the resulting tree after each".
  const numOps = getRandomInt(1, 3);
  const steps: TaskData['steps'] = [];
  const taskList: string[] = [];
  let current = startTree;
  const usedValues = new Set<number>(collectValues(startTree));
  for (let i = 0; i < numOps; i++) {
    let insertValue: number;
    do {
      insertValue = getRandomInt(1, 99);
    } while (usedValues.has(insertValue));
    usedValues.add(insertValue);
    const res = insertCopy(current, insertValue);
    current = res.node!;
    let annotation: string;
    if (res.parentValue === null) {
      annotation = `${insertValue} wird als neue Wurzel eingefügt.`;
    } else if (res.direction === 'right') {
      annotation = `${insertValue} wird als rechtes Kind von ${res.parentValue} eingefügt.`;
    } else {
      annotation = `${insertValue} wird als linkes Kind von ${res.parentValue} eingefügt.`;
    }
    steps.push({
      instruction: `Füge den Wert ${insertValue} in den Baum ein.`,
      kind: 'tree',
      tree: toJSON(current)!,
      annotation,
    });
    taskList.push(`${i + 1}. ${insertValue} einfügen`);
  }

  return {
    type: 'dsal_bst_insert',
    mathQuery: `\\text{Führe die Einfüge-Operationen nacheinander aus und gib den Baum nach jeder Operation an.}`,
    answer: '',
    renderMode: 'tree',
    tree: startJSON ?? undefined,
    prompt: `Binärbaum-Suche: Ausgangsbaum mit ${size(startTree)} Knoten. Einfügeregel: Wert $\\ge$ Knotenwert $\\to$ rechts, sonst links (gleiche Werte werden rechts eingehängt).`,
    inputHint: 'Zeige nach jeder Operation den entstehenden Baum.',
    taskList,
    steps,
    explanation: [
      `Ausgangsbaum hat ${size(startTree)} Knoten.`,
      `Einfügeregel: Ist der einzufügende Wert größer oder gleich dem Knotenwert (Wert $\\ge$ Knotenwert), gehen wir nach rechts; andernfalls (Wert $<$ Knotenwert) nach links.`,
      `Gleiche Werte werden somit im Baum rechts eingehängt.`,
    ],
  };
}

function findNode(node: BSTNode | null, value: number): BSTNode | null {
  let n = node;
  while (n) {
    if (n.value === value) return n;
    n = value < n.value ? n.left : n.right;
  }
  return null;
}

function minNode(node: BSTNode): BSTNode {
  let n = node;
  while (n.left) n = n.left;
  return n;
}

/** Immutable BST delete. Returns the new tree and an annotation. */
function deleteValue(node: BSTNode | null, value: number): { node: BSTNode | null; annotation: string } {
  if (!node) return { node: null, annotation: `Wert ${value} ist nicht im Baum.` };
  if (value < node.value) {
    const r = deleteValue(node.left, value);
    return { node: { value: node.value, left: r.node, right: node.right }, annotation: r.annotation };
  }
  if (value > node.value) {
    const r = deleteValue(node.right, value);
    return { node: { value: node.value, left: node.left, right: r.node }, annotation: r.annotation };
  }
  // Node found
  if (!node.left && !node.right) {
    return { node: null, annotation: `${value} ist ein Blatt → wird einfach entfernt.` };
  }
  if (!node.left) {
    return { node: node.right, annotation: `${value} hat nur ein rechtes Kind → wird durch dieses ersetzt.` };
  }
  if (!node.right) {
    return { node: node.left, annotation: `${value} hat nur ein linkes Kind → wird durch dieses ersetzt.` };
  }
  const succ = minNode(node.right);
  const r = deleteValue(node.right, succ.value);
  return {
    node: { value: succ.value, left: node.left, right: r.node },
    annotation: `${value} hat zwei Kinder → wird durch den Inorder-Nachfolger ${succ.value} (Minimum des rechten Teilbaums) ersetzt.`,
  };
}

export function generateBSTDeletion(): TaskData {
  const startTree = buildRandomBST(getRandomInt(5, 8), 99);
  const startJSON = toJSON(startTree);

  const numOps = getRandomInt(1, 2);
  const steps: TaskData['steps'] = [];
  const taskList: string[] = [];
  let current = startTree;
  for (let i = 0; i < numOps; i++) {
    const all = collectValues(current);
    // Prefer a node with two children (most interesting deletion case).
    const twoChild = all.filter((v) => {
      const n = findNode(current, v);
      return n && n.left && n.right;
    });
    const pool = twoChild.length > 0 ? twoChild : all;
    const delVal = pool[getRandomInt(0, pool.length - 1)];
    const res = deleteValue(current, delVal);
    current = res.node;
    steps.push({
      instruction: `Lösche den Wert ${delVal} aus dem Baum.`,
      kind: 'tree',
      tree: toJSON(current)!,
      annotation: res.annotation,
    });
    taskList.push(`${i + 1}. ${delVal} löschen`);
  }

  return {
    type: 'dsal_bst_delete',
    mathQuery: `\\text{Führe die Lösch-Operationen nacheinander aus und gib den Baum nach jeder Operation an.}`,
    answer: '',
    renderMode: 'tree',
    tree: startJSON ?? undefined,
    prompt: `Binärbaum-Suche: Ausgangsbaum mit ${size(startTree)} Knoten. Löschregel: Blatt → entfernen; 1 Kind → ersetzen; 2 Kinder → durch Inorder-Nachfolger ersetzen.`,
    inputHint: 'Zeige nach jeder Operation den entstehenden Baum.',
    taskList,
    steps,
    explanation: [
      `Ausgangsbaum hat ${size(startTree)} Knoten.`,
      `Löschregel: Ist der zu löschende Knoten ein Blatt, wird er entfernt; hat er genau ein Kind, wird er durch dieses ersetzt; hat er zwei Kinder, wird er durch den Inorder-Nachfolger (Minimum des rechten Teilbaums) ersetzt.`,
    ],
  };
}
