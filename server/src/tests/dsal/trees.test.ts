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

function maxKeysPerNode(n: TreeNodeJSON | null | undefined): number {
  if (!n) return 0;
  const here = n.values ? n.values.length : 0;
  const childMax = (n.children ?? []).reduce((m, c) => Math.max(m, maxKeysPerNode(c)), 0);
  return Math.max(here, childMax);
}

describe('BST insertion generator', () => {
  it('produces a stepwise tree task with valid steps', () => {
    const t = generateBSTInsertion();
    expect(t.type).toBe('dsal_bst_insert');
    expect(t.renderMode).toBe('tree');
    expect(t.tree).toBeDefined();
    expect(t.answer).toBe('');
    expect(t.steps).toBeDefined();
    expect(t.steps!.length).toBeGreaterThan(0);
    for (const s of t.steps!) {
      expect(s.kind).toBe('tree');
      expect(isBST(s.tree)).toBe(true);
    }
    expect(isBST(t.tree)).toBe(true);
  });
});

describe('AVL insertion generator', () => {
  it('produces a balanced tree with stepwise results', () => {
    for (let i = 0; i < 20; i++) {
      const t = generateAVLInsertion();
      expect(t.steps!.length).toBeGreaterThan(0);
      for (const s of t.steps!) {
        expect(s.kind).toBe('tree');
        expect(isBalanced(s.tree)).toBe(true);
      }
    }
  });
});

describe('Red-Black insertion generator', () => {
  it('produces a valid RB tree (root black) with stepwise results', () => {
    for (let i = 0; i < 20; i++) {
      const t = generateRedBlackInsertion();
      expect(t.steps!.length).toBeGreaterThan(0);
      for (const s of t.steps!) {
        expect(s.kind).toBe('tree');
        expect(s.tree!.color).toBe('black');
      }
    }
  });
});

describe('B-Tree insertion generator', () => {
  it('produces a valid B-tree with <=3 keys per node and stepwise results', () => {
    const maxKeys = 3; // degree 2 -> 2*2-1
    for (let i = 0; i < 20; i++) {
      const t = generateBTreeInsertion();
      expect(t.steps!.length).toBeGreaterThan(0);
      for (const s of t.steps!) {
        expect(s.kind).toBe('tree');
        expect(maxKeysPerNode(s.tree)).toBeLessThanOrEqual(maxKeys);
      }
    }
  });
});
