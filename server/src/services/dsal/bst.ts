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
  let current = startTree;
  const usedValues = new Set<number>(collectValues(startTree));
  for (let i = 0; i < numOps; i++) {
    let insertValue: number;
    do {
      insertValue = getRandomInt(1, 99);
    } while (usedValues.has(insertValue));
    usedValues.add(insertValue);
    current = insertCopy(current, insertValue);
    steps.push({
      instruction: `Füge den Wert ${insertValue} in den Baum ein.`,
      kind: 'tree',
      tree: toJSON(current)!,
      annotation: `Einfügeregel: Wert $\\leq$ Knoten $\\rightarrow$ rechtes Kind, sonst links.`,
    });
  }

  return {
    type: 'dsal_bst_insert',
    mathQuery: `\\text{Führe die Einfüge-Operationen nacheinander aus und gib den Baum nach jeder Operation an.}`,
    answer: '',
    renderMode: 'tree',
    tree: startJSON ?? undefined,
    prompt: `Ausgangsbaum mit ${size(startTree)} Knoten.`,
    inputHint: 'Zeige nach jeder Operation den entstehenden Baum.',
    steps,
    explanation: [
      `Ausgangsbaum hat ${size(startTree)} Knoten.`,
      `Einfügeregel: Ist der Wert $\\leq$ einem Knoten, geht er in dessen rechtes Kind; sonst links.`,
      `Gleiche Werte werden im offiziellen BST rechts eingehängt.`,
    ],
  };
}
