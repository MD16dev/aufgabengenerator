import { TaskData, TreeNodeJSON } from '../math/types';

/**
 * AVL tree insertion, translated from the official exercisegenerator
 * (AVLTreeNode.balanceWithSteps / balanceLeftToRight / balanceRightToLeft).
 * Insertion uses the same BST rule as the official BST (<= goes right).
 * Produces a stepwise flashcard: one result tree per insert operation, with a
 * rotation annotation when rebalancing occurred.
 */

interface AVLNode {
  value: number;
  left: AVLNode | null;
  right: AVLNode | null;
  height: number;
}

function h(n: AVLNode | null): number {
  return n ? n.height : 0;
}

function update(n: AVLNode): void {
  n.height = 1 + Math.max(h(n.left), h(n.right));
}

function rotateRight(y: AVLNode): AVLNode {
  const x = y.left!;
  const t2 = x.right;
  const newY: AVLNode = { value: y.value, left: t2, right: y.right, height: 0 };
  update(newY);
  const newX: AVLNode = { value: x.value, left: x.left, right: newY, height: 0 };
  update(newX);
  return newX;
}

function rotateLeft(x: AVLNode): AVLNode {
  const y = x.right!;
  const t2 = y.left;
  const newX: AVLNode = { value: x.value, left: x.left, right: t2, height: 0 };
  update(newX);
  const newY: AVLNode = { value: y.value, left: newX, right: y.right, height: 0 };
  update(newY);
  return newY;
}

/** Immutable insert. Returns the new tree and a rotation annotation (or null). */
function insert(node: AVLNode | null, value: number): { node: AVLNode; rotation: string | null } {
  if (!node) return { node: { value, left: null, right: null, height: 1 }, rotation: null };
  let rotation: string | null = null;
  let newNode: AVLNode;
  if (node.value <= value) {
    const r = insert(node.right, value);
    newNode = { value: node.value, left: node.left, right: r.node, height: 0 };
    if (r.rotation) rotation = r.rotation;
  } else {
    const r = insert(node.left, value);
    newNode = { value: node.value, left: r.node, right: node.right, height: 0 };
    if (r.rotation) rotation = r.rotation;
  }
  update(newNode);
  const balance = h(newNode.left) - h(newNode.right);
  // Left heavy
  if (balance > 1) {
    const left = newNode.left!;
    if (h(left.left) >= h(left.right)) {
      rotation = `Balancefaktor bei ${newNode.value} = +${balance} (linkslastig) → Rechtsrotation.`;
      return { node: rotateRight(newNode), rotation };
    }
    newNode = { value: newNode.value, left: rotateLeft(left), right: newNode.right, height: 0 };
    update(newNode);
    rotation = `Balancefaktor bei ${newNode.value} = +${balance} (linkslastig) → Links-Rechts-Drehung.`;
    return { node: rotateRight(newNode), rotation };
  }
  // Right heavy
  if (balance < -1) {
    const right = newNode.right!;
    if (h(right.right) >= h(right.left)) {
      rotation = `Balancefaktor bei ${newNode.value} = ${balance} (rechtslastig) → Linksrotation.`;
      return { node: rotateLeft(newNode), rotation };
    }
    newNode = { value: newNode.value, left: newNode.left, right: rotateRight(right), height: 0 };
    update(newNode);
    rotation = `Balancefaktor bei ${newNode.value} = ${balance} (rechtslastig) → Rechts-Links-Drehung.`;
    return { node: rotateLeft(newNode), rotation };
  }
  return { node: newNode, rotation };
}

function toJSON(node: AVLNode | null): TreeNodeJSON | null {
  if (!node) return null;
  return { value: node.value, height: node.height, left: toJSON(node.left), right: toJSON(node.right) };
}

function getRandomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function size(n: AVLNode | null): number {
  if (!n) return 0;
  return 1 + size(n.left) + size(n.right);
}

function buildRandomAVL(size: number): AVLNode | null {
  const values = new Set<number>();
  while (values.size < size) values.add(getRandomInt(1, 99));
  let root: AVLNode | null = null;
  for (const v of values) root = insert(root, v).node;
  return root;
}

export function generateAVLInsertion(): TaskData {
  const start = buildRandomAVL(getRandomInt(3, 5));
  const startJSON = toJSON(start);

  const numOps = getRandomInt(1, 3);
  const steps: TaskData['steps'] = [];
  const taskList: string[] = [];
  let current: AVLNode | null = start;
  const usedValues = new Set<number>();
  const collect = (n: AVLNode | null) => {
    if (!n) return;
    usedValues.add(n.value);
    collect(n.left);
    collect(n.right);
  };
  collect(start);

  for (let i = 0; i < numOps; i++) {
    // Retry the insert value until it actually triggers a rebalance (rotation),
    // so the task requires real work (a no-rotation insert is didactically dull).
    let insertValue: number;
    let r: { node: AVLNode; rotation: string | null };
    let tries = 0;
    do {
      do {
        insertValue = getRandomInt(1, 99);
      } while (usedValues.has(insertValue));
      r = insert(current, insertValue);
      tries++;
    } while (!r.rotation && tries < 40);
    usedValues.add(insertValue);
    current = r.node;
    steps.push({
      instruction: `Füge den Wert ${insertValue} in den AVL-Baum ein.`,
      kind: 'tree',
      tree: toJSON(current)!,
      annotation: r.rotation ? r.rotation : 'Keine Rotation nötig (Baum bleibt balanciert).',
    });
    taskList.push(`${i + 1}. ${insertValue} einfügen`);
  }

  return {
    type: 'dsal_avl_insert',
    mathQuery: `\\text{Führe die Einfüge-Operationen nacheinander aus und gib den Baum nach jeder Operation an.}`,
    answer: '',
    renderMode: 'tree',
    tree: startJSON ?? undefined,
    prompt: `AVL-Baum: Ausgangsbaum mit ${size(start)} Knoten. Einfügen wie im BST, danach Balancefaktor prüfen und ggf. rotieren.`,
    inputHint: 'Zeige nach jeder Operation den balancierten Baum.',
    taskList,
    steps,
    explanation: [
      `Einfügen wie im BST (Wert $\\ge$ Knotenwert $\\to$ rechts, sonst links), dann Balancefaktor prüfen.`,
      `Der Balancefaktor ist $\\text{Höhe(links)} - \\text{Höhe(rechts)}$; erlaubt sind nur $-1, 0, +1$.`,
      `Bei Ungleichgewicht (\\pm 2) wird rotiert: einfach (außenlastig) oder doppelt (innenlastig).`,
    ],
  };
}

function minAVL(node: AVLNode): AVLNode {
  let n = node;
  while (n.left) n = n.left;
  return n;
}

/** Immutable AVL delete with rebalancing on the way up. */
function deleteAVL(node: AVLNode | null, value: number): { node: AVLNode | null; rotation: string | null } {
  if (!node) return { node: null, rotation: null };
  let rotation: string | null = null;
  let newNode: AVLNode;
  if (value < node.value) {
    const r = deleteAVL(node.left, value);
    newNode = { value: node.value, left: r.node, right: node.right, height: 0 };
    if (r.rotation) rotation = r.rotation;
  } else if (value > node.value) {
    const r = deleteAVL(node.right, value);
    newNode = { value: node.value, left: node.left, right: r.node, height: 0 };
    if (r.rotation) rotation = r.rotation;
  } else {
    // Node found
    if (!node.left) return { node: node.right, rotation: null };
    if (!node.right) return { node: node.left, rotation: null };
    const succ = minAVL(node.right);
    const r = deleteAVL(node.right, succ.value);
    newNode = { value: succ.value, left: node.left, right: r.node, height: 0 };
    if (r.rotation) rotation = r.rotation;
  }
  update(newNode);
  const balance = h(newNode.left) - h(newNode.right);
  if (balance > 1) {
    const left = newNode.left!;
    if (h(left.left) >= h(left.right)) {
      const rot = `Balancefaktor bei ${newNode.value} = +${balance} (linkslastig) → Rechtsrotation.`;
      return { node: rotateRight(newNode), rotation: rotation ? `${rotation} ${rot}` : rot };
    }
    const rot = `Balancefaktor bei ${newNode.value} = +${balance} (linkslastig) → Links-Rechts-Drehung.`;
    const rotated = rotateRight({ value: newNode.value, left: rotateLeft(left), right: newNode.right, height: 0 });
    return { node: rotated, rotation: rotation ? `${rotation} ${rot}` : rot };
  }
  if (balance < -1) {
    const right = newNode.right!;
    if (h(right.right) >= h(right.left)) {
      const rot = `Balancefaktor bei ${newNode.value} = ${balance} (rechtslastig) → Linksrotation.`;
      return { node: rotateLeft(newNode), rotation: rotation ? `${rotation} ${rot}` : rot };
    }
    const rot = `Balancefaktor bei ${newNode.value} = ${balance} (rechtslastig) → Rechts-Links-Drehung.`;
    const rotated = rotateLeft({ value: newNode.value, left: newNode.left, right: rotateRight(right), height: 0 });
    return { node: rotated, rotation: rotation ? `${rotation} ${rot}` : rot };
  }
  return { node: newNode, rotation };
}

export function generateAVLDeletion(): TaskData {
  const start = buildRandomAVL(getRandomInt(4, 7));
  const startJSON = toJSON(start);

  const numOps = getRandomInt(1, 2);
  const steps: TaskData['steps'] = [];
  const taskList: string[] = [];
  let current: AVLNode | null = start;
  const collect = (n: AVLNode | null, acc: number[] = []): number[] => {
    if (!n) return acc;
    acc.push(n.value);
    collect(n.left, acc);
    collect(n.right, acc);
    return acc;
  };
  for (let i = 0; i < numOps; i++) {
    const all = collect(current);
    // Prefer a deletion that triggers a rebalance (rotation), for didactic value.
    let chosen: number | null = null;
    let chosenRes: { node: AVLNode | null; rotation: string | null } | null = null;
    for (let attempt = 0; attempt < 15 && chosen === null; attempt++) {
      const v = all[getRandomInt(0, all.length - 1)];
      const r = deleteAVL(current, v);
      if (r.rotation) { chosen = v; chosenRes = r; }
    }
    if (chosen === null) {
      const v = all[getRandomInt(0, all.length - 1)];
      chosenRes = deleteAVL(current, v);
      chosen = v;
    }
    current = chosenRes!.node;
    steps.push({
      instruction: `Lösche den Wert ${chosen} aus dem AVL-Baum.`,
      kind: 'tree',
      tree: toJSON(current)!,
      annotation: chosenRes!.rotation ? chosenRes!.rotation : 'Keine Rotation nötig (Baum bleibt balanciert).',
    });
    taskList.push(`${i + 1}. ${chosen} löschen`);
  }

  return {
    type: 'dsal_avl_delete',
    mathQuery: `\\text{Führe die Lösch-Operationen nacheinander aus und gib den Baum nach jeder Operation an.}`,
    answer: '',
    renderMode: 'tree',
    tree: startJSON ?? undefined,
    prompt: `AVL-Baum: Ausgangsbaum mit ${size(start)} Knoten. Löschen wie im BST, danach Balancefaktor prüfen und ggf. rotieren.`,
    inputHint: 'Zeige nach jeder Operation den balancierten Baum.',
    taskList,
    steps,
    explanation: [
      `Löschen wie im BST (Inorder-Nachfolger bei zwei Kindern), dann Balancefaktor auf dem Rückweg prüfen.`,
      `Der Balancefaktor ist $\\text{Höhe(links)} - \\text{Höhe(rechts)}$; erlaubt sind nur $-1, 0, +1$.`,
      `Bei Ungleichgewicht (\\pm 2) wird rotiert: einfach (außenlastig) oder doppelt (innenlastig).`,
    ],
  };
}
