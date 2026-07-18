import { describe, it, expect } from 'vitest';
import { generateBSTInsertion } from '../../services/dsal/bst';
import { generateAVLInsertion } from '../../services/dsal/avl';
import { generateRedBlackInsertion } from '../../services/dsal/redblack';
import { generateBTreeInsertion } from '../../services/dsal/btree';
import type { TreeNodeJSON } from '../../services/math/types';

function countNodes(n: TreeNodeJSON | null | undefined): number {
  if (!n) return 0;
  if (n.values) return n.values.length + (n.children ?? []).reduce((s, c) => s + countNodes(c), 0);
  return 1 + countNodes(n.left ?? null) + countNodes(n.right ?? null);
}

function isBST(n: TreeNodeJSON | null | undefined, min = -Infinity, max = Infinity): boolean {
  if (!n) return true;
  if (n.value === undefined) return true;
  // Official rule: node.value <= value -> right, so left must be > lower bound
  // and right must be >= parent but < upper bound (equal-to-ancestor is valid).
  if (n.value < min || n.value >= max) return false;
  return isBST(n.left ?? null, min, n.value) && isBST(n.right ?? null, n.value, max);
}

function isBalanced(n: TreeNodeJSON | null | undefined): boolean {
  if (!n) return true;
  const lh = height(n.left ?? null);
  const rh = height(n.right ?? null);
  if (Math.abs(lh - rh) > 1) return false;
  return isBalanced(n.left ?? null) && isBalanced(n.right ?? null);
}

function height(n: TreeNodeJSON | null | undefined): number {
  if (!n) return 0;
  return 1 + Math.max(height(n.left ?? null), height(n.right ?? null));
}

describe('BST insertion generator', () => {
  it('produces a valid tree task with exactly 4 choices and 1 correct', () => {
    const t = generateBSTInsertion();
    expect(t.type).toBe('dsal_bst_insert');
    expect(t.renderMode).toBe('tree');
    expect(t.tree).toBeDefined();
    expect(t.choices).toHaveLength(4);
    const correct = t.choices!.find((c) => c.id === t.answer);
    expect(correct).toBeDefined();
    // result tree must be a valid BST
    expect(isBST(correct!.tree)).toBe(true);
  });

  it('keeps the start tree a valid BST and choices distinct', () => {
    for (let i = 0; i < 20; i++) {
      const t = generateBSTInsertion();
      expect(isBST(t.tree)).toBe(true);
      const keys = t.choices!.map((c) => JSON.stringify(c.tree));
      expect(new Set(keys).size).toBe(4);
    }
  });
});

describe('AVL insertion generator', () => {
  it('produces a balanced tree with 4 distinct choices', () => {
    for (let i = 0; i < 20; i++) {
      const t = generateAVLInsertion();
      const correct = t.choices!.find((c) => c.id === t.answer)!;
      expect(isBalanced(correct.tree)).toBe(true);
      const keys = t.choices!.map((c) => JSON.stringify(c.tree));
      expect(new Set(keys).size).toBe(4);
    }
  });
});

describe('Red-Black insertion generator', () => {
  it('produces a valid RB tree (root black) with 4 distinct choices', () => {
    for (let i = 0; i < 20; i++) {
      const t = generateRedBlackInsertion();
      const correct = t.choices!.find((c) => c.id === t.answer)!;
      expect(correct.tree!.color).toBe('black');
      const keys = t.choices!.map((c) => JSON.stringify(c.tree));
      expect(new Set(keys).size).toBe(4);
    }
  });
});

describe('B-Tree insertion generator', () => {
  it('produces a valid B-tree with <=3 keys per node and 4 distinct choices', () => {
    const maxKeys = 3; // degree 2 -> 2*2-1
    for (let i = 0; i < 20; i++) {
      const t = generateBTreeInsertion();
      const correct = t.choices!.find((c) => c.id === t.answer)!;
      const checkNode = (n: TreeNodeJSON | null | undefined): boolean => {
        if (!n) return true;
        if (n.values && n.values.length > maxKeys) return false;
        return (n.children ?? []).every(checkNode);
      };
      expect(checkNode(correct.tree)).toBe(true);
      const keys = t.choices!.map((c) => JSON.stringify(c.tree));
      expect(new Set(keys).size).toBe(4);
    }
  });
});
