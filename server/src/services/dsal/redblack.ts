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

function transplant(root: RBNode, u: RBNode, v: RBNode | null): RBNode {
  if (u.parent === null) {
    root = v!;
  } else if (u === u.parent.left) {
    u.parent.left = v;
  } else {
    u.parent.right = v;
  }
  if (v !== null) {
    v.parent = u.parent;
  }
  return root;
}

function getColor(n: RBNode | null): Color {
  return n ? n.color : 'black';
}

function deleteFixup(root: RBNode, x: RBNode, annotations: string[]): RBNode {
  let cur = x;
  while (cur !== root && getColor(cur) === 'black') {
    if (cur === cur.parent!.left) {
      let w = cur.parent!.right;
      if (getColor(w) === 'red') {
        w!.color = 'black';
        cur.parent!.color = 'red';
        root = rotateLeft(root, cur.parent!);
        w = cur.parent!.right;
        annotations.push(`Geschwister ${w?.value} rot (Fall 1) → Umfärben: ${w?.value} schwarz, ${cur.parent!.value} rot. Linksrotation bei ${cur.parent!.value}.`);
      }
      if (getColor(w?.left) === 'black' && getColor(w?.right) === 'black') {
        if (w) w.color = 'red';
        annotations.push(`Beide Kinder von Geschwister ${w?.value} schwarz (Fall 2) → ${w?.value} rot färben. Problem wandert nach oben zu ${cur.parent!.value}.`);
        cur = cur.parent!;
      } else {
        if (getColor(w?.right) === 'black') {
          if (w?.left) w.left.color = 'black';
          if (w) w.color = 'red';
          root = rotateRight(root, w!);
          w = cur.parent!.right;
          annotations.push(`Rechtes Kind von Geschwister ${w?.value} schwarz (Fall 3) → Linkes Kind ${w?.left?.value} schwarz färben, Geschwister rot. Rechtsrotation bei ${w?.value}.`);
        }
        if (w) {
          w.color = cur.parent!.color;
          if (w.right) w.right.color = 'black';
        }
        cur.parent!.color = 'black';
        root = rotateLeft(root, cur.parent!);
        annotations.push(`Rechtes Kind von Geschwister ${w?.value} rot (Fall 4) → Farbe von ${cur.parent!.value} auf ${w?.value} übertragen, ${cur.parent!.value} und Kind schwarz färben. Linksrotation bei ${cur.parent!.value}.`);
        cur = root;
      }
    } else {
      let w = cur.parent!.left;
      if (getColor(w) === 'red') {
        w!.color = 'black';
        cur.parent!.color = 'red';
        root = rotateRight(root, cur.parent!);
        w = cur.parent!.left;
        annotations.push(`Geschwister ${w?.value} rot (Fall 1) → Umfärben: ${w?.value} schwarz, ${cur.parent!.value} rot. Rechtsrotation bei ${cur.parent!.value}.`);
      }
      if (getColor(w?.left) === 'black' && getColor(w?.right) === 'black') {
        if (w) w.color = 'red';
        annotations.push(`Beide Kinder von Geschwister ${w?.value} schwarz (Fall 2) → ${w?.value} rot färben. Problem wandert nach oben zu ${cur.parent!.value}.`);
        cur = cur.parent!;
      } else {
        if (getColor(w?.left) === 'black') {
          if (w?.right) w.right.color = 'black';
          if (w) w.color = 'red';
          root = rotateLeft(root, w!);
          w = cur.parent!.left;
          annotations.push(`Linkes Kind von Geschwister ${w?.value} schwarz (Fall 3) → Rechtes Kind ${w?.right?.value} schwarz färben, Geschwister rot. Linksrotation bei ${w?.value}.`);
        }
        if (w) {
          w.color = cur.parent!.color;
          if (w.left) w.left.color = 'black';
        }
        cur.parent!.color = 'black';
        root = rotateRight(root, cur.parent!);
        annotations.push(`Linkes Kind von Geschwister ${w?.value} rot (Fall 4) → Farbe von ${cur.parent!.value} auf ${w?.value} übertragen, ${cur.parent!.value} und Kind schwarz färben. Rechtsrotation bei ${cur.parent!.value}.`);
        cur = root;
      }
    }
  }
  cur.color = 'black';
  return root;
}

function deleteNode(root: RBNode, z: RBNode, annotations: string[]): RBNode | null {
  let y = z;
  let yOriginalColor = y.color;
  let x: RBNode | null = null;
  let newRoot = root;

  const dummyNil = new RBNode(0, 'black');
  let usedDummy = false;

  if (z.left === null) {
    x = z.right;
    if (x === null) {
      x = dummyNil;
      usedDummy = true;
      x.parent = z;
    }
    newRoot = transplant(newRoot, z, x);
  } else if (z.right === null) {
    x = z.left;
    if (x === null) {
      x = dummyNil;
      usedDummy = true;
      x.parent = z;
    }
    newRoot = transplant(newRoot, z, x);
  } else {
    let succ = z.right;
    while (succ.left !== null) succ = succ.left;
    y = succ;
    yOriginalColor = y.color;
    x = y.right;
    if (x === null) {
      x = dummyNil;
      usedDummy = true;
      x.parent = y;
    }
    if (y.parent === z) {
      x.parent = y;
    } else {
      newRoot = transplant(newRoot, y, x);
      y.right = z.right;
      y.right.parent = y;
    }
    newRoot = transplant(newRoot, z, y);
    y.left = z.left;
    y.left.parent = y;
    y.color = z.color;
  }

  let delDesc = '';
  if (z.left === null && z.right === null) {
    delDesc = `${z.value} ist ein Blatt → wird einfach entfernt.`;
  } else if (z.left === null) {
    delDesc = `${z.value} hat nur ein rechtes Kind → wird durch dieses ersetzt.`;
  } else if (z.right === null) {
    delDesc = `${z.value} hat nur ein linkes Kind → wird durch dieses ersetzt.`;
  } else {
    delDesc = `${z.value} hat zwei Kinder → wird durch den Inorder-Nachfolger ${y.value} (Minimum des rechten Teilbaums) ersetzt.`;
  }
  annotations.push(delDesc);

  if (yOriginalColor === 'black') {
    newRoot = deleteFixup(newRoot, x, annotations);
  }

  if (usedDummy) {
    if (dummyNil.parent === null) {
      newRoot = null;
    } else {
      if (dummyNil === dummyNil.parent.left) {
        dummyNil.parent.left = null;
      } else {
        dummyNil.parent.right = null;
      }
    }
  }

  if (newRoot !== null) {
    newRoot.color = 'black';
  }

  return newRoot;
}

function rbDelete(root: RBNode, value: number): { root: RBNode | null; annotation: string } {
  const cloned = cloneNode(root)!;
  const z = find(cloned, value);
  if (!z) {
    return { root: cloned, annotation: `Wert ${value} ist nicht im Baum.` };
  }
  const annotations: string[] = [];
  const rootResult = deleteNode(cloned, z, annotations);
  return { root: rootResult, annotation: annotations.join(' ') };
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
