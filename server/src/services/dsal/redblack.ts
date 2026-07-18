import { TaskData, TreeNodeJSON } from '../math/types';

/**
 * Red-Black tree insertion, translated from the official exercisegenerator
 * (RedBlackTreeNode.balanceWithSteps / addCase1-3). Implements the standard
 * CLRS insertion fixup: new node is RED, then red-red conflicts are resolved
 * by recoloring and rotating. The BST insertion rule is the same (<= goes
 * right). Produces a stepwise flashcard: one result tree per insert operation,
 * with a recolor/rotation annotation.
 *
 * Internally we use mutable nodes with parent pointers for a correct, simple
 * CLRS fixup, then serialize to the immutable TreeNodeJSON shape the frontend
 * renders.
 */

type Color = 'red' | 'black';

class RBNode {
  value: number;
  color: Color;
  left: RBNode | null = null;
  right: RBNode | null = null;
  parent: RBNode | null = null;
  constructor(value: number, color: Color = 'red') {
    this.value = value;
    this.color = color;
  }
}

function getRandomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/** BST insert (node.value <= value -> right), new node red. Returns new root. */
function bstInsert(root: RBNode | null, value: number): RBNode {
  const node = new RBNode(value, 'red');
  if (!root) return node;
  let cur = root;
  while (true) {
    if (cur.value <= value) {
      if (cur.right === null) { cur.right = node; node.parent = cur; break; }
      cur = cur.right;
    } else {
      if (cur.left === null) { cur.left = node; node.parent = cur; break; }
      cur = cur.left;
    }
  }
  return root;
}

function find(root: RBNode | null, value: number): RBNode | null {
  let n = root;
  while (n) {
    if (n.value === value) return n;
    n = value < n.value ? n.left : n.right;
  }
  return null;
}

function rotateLeft(root: RBNode, x: RBNode): RBNode {
  const y = x.right!;
  x.right = y.left;
  if (y.left) y.left.parent = x;
  y.parent = x.parent;
  if (!x.parent) root = y;
  else if (x === x.parent.left) x.parent.left = y;
  else x.parent.right = y;
  y.left = x;
  x.parent = y;
  return root;
}

function rotateRight(root: RBNode, x: RBNode): RBNode {
  const y = x.left!;
  x.left = y.right;
  if (y.right) y.right.parent = x;
  y.parent = x.parent;
  if (!x.parent) root = y;
  else if (x === x.parent.right) x.parent.right = y;
  else x.parent.left = y;
  y.right = x;
  x.parent = y;
  return root;
}

/** CLRS fixup. Mutates the tree; returns the (new) root and an annotation. */
function fixup(root: RBNode, z: RBNode): { root: RBNode; annotation: string } {
  let annotation = 'Keine Rotation nötig (kein rot-rot-Konflikt).';
  let n: RBNode | null = z;
  while (n !== null && n.parent !== null && n.parent.color === 'red') {
    const parent: RBNode = n.parent;
    const grand: RBNode = parent.parent!;
    if (parent === grand.left) {
      const uncle = grand.right;
      if (uncle && uncle.color === 'red') {
        parent.color = 'black';
        uncle.color = 'black';
        grand.color = 'red';
        annotation = `Umfärbung: ${parent.value} und ${uncle.value} schwarz, ${grand.value} rot.`;
        n = grand;
      } else {
        if (n === parent.right) {
          n = parent;
          root = rotateLeft(root, n);
          annotation = `Linksrotation bei ${n.value}, dann Rechtsrotation bei ${grand.value}.`;
        } else {
          annotation = `Rechtsrotation bei ${grand.value}.`;
        }
        const p = n.parent!;
        const g = p.parent!;
        p.color = 'black';
        g.color = 'red';
        root = rotateRight(root, g);
      }
    } else {
      const uncle = grand.left;
      if (uncle && uncle.color === 'red') {
        parent.color = 'black';
        uncle.color = 'black';
        grand.color = 'red';
        annotation = `Umfärbung: ${parent.value} und ${uncle.value} schwarz, ${grand.value} rot.`;
        n = grand;
      } else {
        if (n === parent.left) {
          n = parent;
          root = rotateRight(root, n);
          annotation = `Rechtsrotation bei ${n.value}, dann Linksrotation bei ${grand.value}.`;
        } else {
          annotation = `Linksrotation bei ${grand.value}.`;
        }
        const p = n.parent!;
        const g = p.parent!;
        p.color = 'black';
        g.color = 'red';
        root = rotateLeft(root, g);
      }
    }
  }
  // root must be black
  let r = root;
  while (r.parent) r = r.parent;
  r.color = 'black';
  return { root: r, annotation };
}

function toJSON(n: RBNode | null): TreeNodeJSON | null {
  if (!n) return null;
  return { value: n.value, color: n.color, left: toJSON(n.left), right: toJSON(n.right) };
}

/** Deep clone, preserving parent pointers so fixup can walk up the tree. */
function cloneNode(n: RBNode | null): RBNode | null {
  if (!n) return null;
  const c = new RBNode(n.value, n.color);
  c.left = cloneNode(n.left);
  if (c.left) c.left.parent = c;
  c.right = cloneNode(n.right);
  if (c.right) c.right.parent = c;
  return c;
}

function buildRandomRB(size: number): RBNode | null {
  const values = new Set<number>();
  while (values.size < size) values.add(getRandomInt(1, 99));
  let root: RBNode | null = null;
  for (const v of values) {
    root = bstInsert(root, v);
    root = fixup(root, find(root, v)!).root;
  }
  return root;
}

export function generateRedBlackInsertion(): TaskData {
  const start = buildRandomRB(getRandomInt(3, 5));
  const startJSON = toJSON(start);

  const numOps = getRandomInt(1, 3);
  const steps: TaskData['steps'] = [];
  const taskList: string[] = [];
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
    // Retry until the insert actually triggers a rebalance (recolor or
    // rotation), so the task requires real work.
    let insertValue: number;
    let r: { root: RBNode; annotation: string };
    let tries = 0;
    do {
      do {
        insertValue = getRandomInt(1, 99);
      } while (usedValues.has(insertValue));
      // Clone so failed retry attempts don't mutate `current` (bstInsert is
      // in-place). Only the chosen candidate is kept.
      const candidate = bstInsert(cloneNode(current), insertValue);
      r = fixup(candidate, find(candidate, insertValue)!);
      tries++;
    } while (r.annotation.startsWith('Keine Rotation') && tries < 40);
    usedValues.add(insertValue);
    current = r.root;
    steps.push({
      instruction: `Füge den Wert ${insertValue} in den Rot-Schwarz-Baum ein.`,
      kind: 'tree',
      tree: toJSON(current)!,
      annotation: r.annotation,
    });
    taskList.push(`${i + 1}. ${insertValue} einfügen`);
  }

  return {
    type: 'dsal_rb_insert',
    mathQuery: `\\text{Führe die Einfüge-Operationen nacheinander aus und gib den Baum nach jeder Operation an.}`,
    answer: '',
    renderMode: 'tree',
    tree: startJSON ?? undefined,
    prompt: `Ausgangs-Rot-Schwarz-Baum (Wurzel ist schwarz).`,
    inputHint: 'Zeige nach jeder Operation den korrekten Rot-Schwarz-Baum.',
    taskList,
    steps,
    explanation: [
      `Neuer Knoten wird rot eingefügt (\\leq \\to \\text{rechts}).`,
      `Bei rot-rot-Konflikt: Onkel rot → Umfärbung; sonst Rotation + Umfärbung.`,
      `Die Wurzel ist am Ende immer schwarz.`,
    ],
  };
}
