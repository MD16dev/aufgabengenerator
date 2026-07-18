import { TaskData, TreeNodeJSON } from '../math/types';

/**
 * Red-Black tree insertion, translated from the official exercisegenerator
 * (RedBlackTreeNode.balanceWithSteps / addCase1-3). We implement the standard
 * CLRS insertion fixup: new node is RED, then resolve red-red conflicts by
 * recoloring and rotating. The BST insertion rule is the same (<= goes right).
 * Produces a stepwise flashcard: one result tree per insert operation, with a
 * recolor/rotation annotation.
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

/** Immutable BST insert (node.value <= value -> right), new node red. */
function bstInsert(root: RBNode | null, value: number): RBNode {
  if (!root) return mk(value, 'black'); // first node becomes root (black)
  if (root.value <= value) {
    return { value: root.value, color: root.color, left: root.left, right: bstInsert(root.right, value) };
  }
  return { value: root.value, color: root.color, left: bstInsert(root.left, value), right: root.right };
}

/** Immutable left rotation around node `value`. */
function rotateLeft(root: RBNode, value: number): RBNode {
  if (root.value === value) {
    const r = root.right!;
    return { value: r.value, color: r.color, left: { value: root.value, color: root.color, left: root.left, right: r.left }, right: r.right };
  }
  if (root.value <= value) {
    return { value: root.value, color: root.color, left: root.left, right: rotateLeft(root.right!, value) };
  }
  return { value: root.value, color: root.color, left: rotateLeft(root.left!, value), right: root.right };
}

/** Immutable right rotation around node `value`. */
function rotateRight(root: RBNode, value: number): RBNode {
  if (root.value === value) {
    const l = root.left!;
    return { value: l.value, color: l.color, left: l.left, right: { value: root.value, color: root.color, left: l.right, right: root.right } };
  }
  if (root.value <= value) {
    return { value: root.value, color: root.color, left: root.left, right: rotateRight(root.right!, value) };
  }
  return { value: root.value, color: root.color, left: rotateRight(root.left!, value), right: root.right };
}

/** Immutable CLRS fixup. Returns the fixed tree and an annotation string. */
function fixup(root: RBNode, value: number): { root: RBNode; annotation: string } {
  let annotation = 'Keine Rotation nötig (kein rot-rot-Konflikt).';
  // Walk to z, then fix up iteratively using path reconstruction.
  let zVal = value;
  let tree = root;
  let guard = 0;
  while (guard++ < 50) {
    // reconstruct path to zVal
    const stack: RBNode[] = [];
    let n: RBNode | null = tree;
    while (n) { stack.push(n); n = zVal <= n.value ? n.right : n.left; }
    const idx = stack.findIndex((s) => s.value === zVal);
    if (idx < 1) break; // z is root
    const parent = stack[idx - 1];
    if (parent.color === 'black') break;
    if (idx < 2) break;
    const grand = stack[idx - 2];
    const pIsLeft = grand.left === parent;
    const uncle = pIsLeft ? grand.right : grand.left;
    if (uncle && uncle.color === 'red') {
      // recolor
      tree = recolor(tree, parent.value, 'black');
      tree = recolor(tree, uncle.value, 'black');
      tree = recolor(tree, grand.value, 'red');
      annotation = `Umfärbung: ${parent.value} und ${uncle.value} schwarz, ${grand.value} rot.`;
      zVal = grand.value;
      continue;
    }
    // rotation case
    if (pIsLeft) {
      if (parent.right && parent.right.value === zVal) {
        tree = rotateLeft(tree, parent.value);
        annotation = `Linksrotation bei ${parent.value}, dann Rechtsrotation bei ${grand.value}.`;
      } else {
        annotation = `Rechtsrotation bei ${grand.value}.`;
      }
      tree = rotateRight(tree, grand.value);
    } else {
      if (parent.left && parent.left.value === zVal) {
        tree = rotateRight(tree, parent.value);
        annotation = `Rechtsrotation bei ${parent.value}, dann Linksrotation bei ${grand.value}.`;
      } else {
        annotation = `Linksrotation bei ${grand.value}.`;
      }
      tree = rotateLeft(tree, grand.value);
    }
    // recolor new subtree root black, children red
    const newRootVal = pIsLeft ? grand.value : grand.value;
    tree = recolor(tree, newRootVal, 'black');
    break;
  }
  // root must be black
  tree = recolor(tree, tree.value, 'black');
  return { root: tree, annotation };
}

function recolor(root: RBNode, value: number, color: Color): RBNode {
  if (root.value === value) return { value: root.value, color, left: root.left, right: root.right };
  if (root.value <= value) return { value: root.value, color: root.color, left: root.left, right: recolor(root.right!, value, color) };
  return { value: root.value, color: root.color, left: recolor(root.left!, value, color), right: root.right };
}

function toJSON(n: RBNode | null): TreeNodeJSON | null {
  if (!n) return null;
  return { value: n.value, color: n.color, left: toJSON(n.left), right: toJSON(n.right) };
}

function buildRandomRB(size: number): RBNode | null {
  const values = new Set<number>();
  while (values.size < size) values.add(getRandomInt(1, 99));
  let root: RBNode | null = null;
  for (const v of values) {
    root = bstInsert(root, v);
    root = fixup(root, v).root;
  }
  return root;
}

export function generateRedBlackInsertion(): TaskData {
  const start = buildRandomRB(getRandomInt(3, 5));
  const startJSON = toJSON(start);

  const numOps = getRandomInt(1, 3);
  const steps: TaskData['steps'] = [];
  let current: RBNode | null = start;
  const usedValues = new Set<number>();
  const collect = (n: RBNode | null) => {
    if (!n) return;
    usedValues.add(n.value);
    collect(n.left);
    collect(n.right);
  };
  collect(start);

  for (let i = 0; i < numOps; i++) {
    let insertValue: number;
    do {
      insertValue = getRandomInt(1, 99);
    } while (usedValues.has(insertValue));
    usedValues.add(insertValue);
    current = bstInsert(current, insertValue);
    const r = fixup(current, insertValue);
    current = r.root;
    steps.push({
      instruction: `Füge den Wert ${insertValue} in den Rot-Schwarz-Baum ein.`,
      kind: 'tree',
      tree: toJSON(current)!,
      annotation: r.annotation,
    });
  }

  return {
    type: 'dsal_rb_insert',
    mathQuery: `\\text{Führe die Einfüge-Operationen nacheinander aus und gib den Baum nach jeder Operation an.}`,
    answer: '',
    renderMode: 'tree',
    tree: startJSON ?? undefined,
    prompt: `Ausgangs-Rot-Schwarz-Baum (Wurzel ist schwarz).`,
    inputHint: 'Zeige nach jeder Operation den korrekten Rot-Schwarz-Baum.',
    steps,
    explanation: [
      `Neuer Knoten wird rot eingefügt (\\leq \\to \\text{rechts}).`,
      `Bei rot-rot-Konflikt: Onkel rot → Umfärbung; sonst Rotation + Umfärbung.`,
      `Die Wurzel ist am Ende immer schwarz.`,
    ],
  };
}
