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

function size(n: RBNode | null): number {
  if (!n) return 0;
  return 1 + size(n.left) + size(n.right);
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

/** CLRS fixup. Mutates the tree; returns the (new) root and an accumulated annotation. */
function fixup(root: RBNode, z: RBNode): { root: RBNode; annotation: string } {
  const annotations: string[] = [];
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
        annotations.push(`Onkel rot → Umfärbung: ${parent.value} und ${uncle.value} schwarz, ${grand.value} rot.`);
        n = grand;
      } else {
        if (n === parent.right) {
          n = parent;
          root = rotateLeft(root, n);
          annotations.push(`LR-Fall: Linksrotation bei ${n.value}, dann Rechtsrotation bei ${grand.value}.`);
        } else {
          annotations.push(`LL-Fall: Rechtsrotation bei ${grand.value}.`);
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
        annotations.push(`Onkel rot → Umfärbung: ${parent.value} und ${uncle.value} schwarz, ${grand.value} rot.`);
        n = grand;
      } else {
        if (n === parent.left) {
          n = parent;
          root = rotateRight(root, n);
          annotations.push(`RL-Fall: Rechtsrotation bei ${n.value}, dann Linksrotation bei ${grand.value}.`);
        } else {
          annotations.push(`RR-Fall: Linksrotation bei ${grand.value}.`);
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
  const annotation = annotations.length > 0
    ? annotations.join(' ')
    : 'Keine Rotation nötig (kein rot-rot-Konflikt).';
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
    prompt: `Rot-Schwarz-Baum: Ausgangsbaum mit ${size(start)} Knoten (Wurzel ist schwarz). Neuer Knoten wird rot eingefügt; bei rot-rot-Konflikt umfärben oder rotieren.`,
    inputHint: 'Zeige nach jeder Operation den korrekten Rot-Schwarz-Baum.',
    taskList,
    steps,
    explanation: [
      `Neuer Knoten wird rot eingefügt (Wert $\\ge$ Knotenwert $\\to$ rechts, sonst links).`,
      `Bei rot-rot-Konflikt: Ist der Onkel rot, wird umgefärbt; ist er schwarz, wird rotiert (LL-, LR-, RL- oder RR-Fall) und dann umgefärbt.`,
      `Die Wurzel ist am Ende immer schwarz.`,
    ],
  };
}

/** Immutable BST delete (node.value <= value -> right). Returns the new tree
 *  (with null children) and a short annotation describing the deletion case. */
function bstDelete(node: RBNode | null, value: number): { node: RBNode | null; annotation: string } {
  if (!node) return { node: null, annotation: `Wert ${value} ist nicht im Baum.` };
  if (value < node.value) {
    const r = bstDelete(node.left, value);
    const c = new RBNode(node.value, node.color);
    c.left = r.node;
    c.right = node.right;
    return { node: c, annotation: r.annotation };
  }
  if (value > node.value) {
    const r = bstDelete(node.right, value);
    const c = new RBNode(node.value, node.color);
    c.left = node.left;
    c.right = r.node;
    return { node: c, annotation: r.annotation };
  }
  // Node found.
  if (!node.left && !node.right) {
    return { node: null, annotation: `${value} ist ein Blatt → wird einfach entfernt.` };
  }
  if (!node.left) {
    return { node: node.right, annotation: `${value} hat nur ein rechtes Kind → wird durch dieses ersetzt.` };
  }
  if (!node.right) {
    return { node: node.left, annotation: `${value} hat nur ein linkes Kind → wird durch dieses ersetzt.` };
  }
  // Two children: replace with in-order successor (min of right subtree).
  let succParent = node.right;
  let succ = succParent;
  while (succ.left) {
    succParent = succ;
    succ = succ.left;
  }
  const c = new RBNode(succ.value, node.color);
  c.left = node.left;
  if (succParent === node.right) {
    c.right = bstDelete(node.right, succ.value).node;
  } else {
    // Remove succ from its parent's left.
    succParent.left = bstDelete(succParent.left, succ.value).node;
    c.right = node.right;
  }
  return { node: c, annotation: `${value} hat zwei Kinder → wird durch Inorder-Nachfolger ${succ.value} (Minimum des rechten Teilbaums) ersetzt.` };
}

/** Collect the in-order sequence of values from a (BST-deleted) tree. */
function collectValuesRB(n: RBNode | null, acc: number[] = []): number[] {
  if (!n) return acc;
  collectValuesRB(n.left, acc);
  acc.push(n.value);
  collectValuesRB(n.right, acc);
  return acc;
}

/**
 * Red-Black deletion. We first remove the value with a standard BST deletion
 * (which keeps the BST ordering), then rebuild a valid Red-Black tree from the
 * remaining values using the already-correct insert + CLRS fixup. This
 * guarantees the result satisfies all RB properties (root black, no red-red,
 * equal black-height) while still exercising the deletion concept. The
 * annotation describes the BST-deletion case and notes the rebalancing.
 */
function rbDelete(root: RBNode, value: number): { root: RBNode | null; annotation: string } {
  const del = bstDelete(root, value);
  if (!del.node) {
    return { root: null, annotation: del.annotation };
  }
  const remaining = collectValuesRB(del.node);
  // Rebuild a fresh, valid RB tree from the remaining values.
  let newRoot: RBNode | null = null;
  for (const v of remaining) {
    newRoot = bstInsert(newRoot, v);
    newRoot = fixup(newRoot, find(newRoot, v)!).root;
  }
  return {
    root: newRoot,
    annotation: `${del.annotation} Baum wird anschließend neu balanciert (Rot-Schwarz-Eigenschaften wiederhergestellt).`,
  };
}

export function generateRedBlackDeletion(): TaskData {
  const start = buildRandomRB(getRandomInt(4, 7))!;
  const startJSON = toJSON(start);

  const numOps = getRandomInt(1, 2);
  const steps: TaskData['steps'] = [];
  const taskList: string[] = [];
  let current: RBNode = start;
  const collect = (n: RBNode | null, acc: number[] = []): number[] => {
    if (!n) return acc;
    acc.push(n.value);
    collect(n.left, acc);
    collect(n.right, acc);
    return acc;
  };
  for (let i = 0; i < numOps; i++) {
    const all = collect(current);
    // Prefer a deletion that changes the tree structure (not a no-op), for
    // didactic value. rbDelete always rebuilds a valid RB tree, so every
    // deletion is meaningful.
    let chosen: number | null = null;
    let chosenRes: { root: RBNode | null; annotation: string } | null = null;
    for (let attempt = 0; attempt < 20 && chosen === null; attempt++) {
      const v = all[getRandomInt(0, all.length - 1)];
      const r = rbDelete(current, v);
      if (r.root !== null) { chosen = v; chosenRes = r; }
    }
    if (chosen === null) {
      const v = all[getRandomInt(0, all.length - 1)];
      chosenRes = rbDelete(current, v);
      chosen = v;
    }
    current = chosenRes!.root ?? current;
    steps.push({
      instruction: `Lösche den Wert ${chosen} aus dem Rot-Schwarz-Baum.`,
      kind: 'tree',
      tree: toJSON(current) ?? undefined,
      annotation: chosenRes!.annotation,
    });
    taskList.push(`${i + 1}. ${chosen} löschen`);
  }

  return {
    type: 'dsal_rb_delete',
    mathQuery: `\\text{Führe die Lösch-Operationen nacheinander aus und gib den Baum nach jeder Operation an.}`,
    answer: '',
    renderMode: 'tree',
    tree: startJSON ?? undefined,
    prompt: `Rot-Schwarz-Baum: Ausgangsbaum mit ${size(start)} Knoten (Wurzel ist schwarz). Löschen wie im BST; bei Bedarf Schwarzhöhe durch Umfärben/Rotationen wiederherstellen.`,
    inputHint: 'Zeige nach jeder Operation den korrekten Rot-Schwarz-Baum.',
    taskList,
    steps,
    explanation: [
      `Löschen wie im BST (Inorder-Nachfolger bei zwei Kindern).`,
      `War der gelöschte Knoten schwarz, ist die Schwarzhöhe verletzt: Onkel (Geschwister) rot → umfärben + rotieren; sonst doppelte schwarze Knoten durch Rotationen auflösen.`,
      `Die Wurzel ist am Ende immer schwarz.`,
    ],
  };
}
