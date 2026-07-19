import { describe, it, expect } from 'vitest';
import { generateBSTDeletion } from '../../services/dsal/bst';
import { generateAVLDeletion } from '../../services/dsal/avl';
import { generateRedBlackDeletion } from '../../services/dsal/redblack';
import { generateBTreeDeletion } from '../../services/dsal/btree';
import type { TreeNodeJSON } from '../../services/math/types';

function inorder(n: TreeNodeJSON | null | undefined): number[] {
  if (!n) return [];
  if (n.values) {
    const res: number[] = [];
    const kids = n.children ?? [];
    for (let i = 0; i < n.values.length; i++) {
      res.push(...inorder(kids[i]));
      res.push(n.values[i]);
    }
    res.push(...inorder(kids[n.values.length]));
    return res;
  }
  return [...inorder(n.left ?? null), n.value!, ...inorder(n.right ?? null)];
}

function isSorted(a: number[]): boolean {
  for (let i = 1; i < a.length; i++) if (a[i] <= a[i - 1]) return false;
  return true;
}

function rbBlackHeight(n: TreeNodeJSON | null | undefined): number | null {
  if (!n) return 1;
  if (n.color !== 'red' && n.color !== 'black') return null;
  const l = rbBlackHeight(n.left ?? null);
  const r = rbBlackHeight(n.right ?? null);
  if (l === null || r === null || l !== r) return null;
  return l + (n.color === 'black' ? 1 : 0);
}

function rbNoRedRed(n: TreeNodeJSON | null | undefined): boolean {
  if (!n) return true;
  if (n.color === 'red') {
    if ((n.left && n.left.color === 'red') || (n.right && n.right.color === 'red')) return false;
  }
  return rbNoRedRed(n.left ?? null) && rbNoRedRed(n.right ?? null);
}

function btreeLeafDepths(n: TreeNodeJSON | null | undefined, d = 0): number[] {
  if (!n) return [];
  const kids = n.children ?? [];
  if (kids.length === 0) return [d + 1];
  return kids.flatMap((c) => btreeLeafDepths(c, d + 1));
}

describe('Deletion invariants (deep)', () => {
  it('BST deletion keeps inorder sorted', () => {
    for (let i = 0; i < 50; i++) {
      const t = generateBSTDeletion();
      for (const s of t.steps!) expect(isSorted(inorder(s.tree))).toBe(true);
    }
  });

  it('AVL deletion keeps balanced + sorted', () => {
    const h = (n: TreeNodeJSON | null | undefined): number => !n ? 0 : 1 + Math.max(h(n.left ?? null), h(n.right ?? null));
    const balanced = (n: TreeNodeJSON | null | undefined): boolean => {
      if (!n) return true;
      if (Math.abs(h(n.left ?? null) - h(n.right ?? null)) > 1) return false;
      return balanced(n.left ?? null) && balanced(n.right ?? null);
    };
    for (let i = 0; i < 50; i++) {
      const t = generateAVLDeletion();
      for (const s of t.steps!) {
        expect(balanced(s.tree)).toBe(true);
        expect(isSorted(inorder(s.tree))).toBe(true);
      }
    }
  });

  it('RB deletion keeps valid RB properties', () => {
    for (let i = 0; i < 50; i++) {
      const t = generateRedBlackDeletion();
      for (const s of t.steps!) {
        const heightVal = rbBlackHeight(s.tree);
        if (heightVal === null) {
          console.log("RB Deletion failure debug!");
          console.log("Start tree:", JSON.stringify(t.tree));
          console.log("Steps:");
          for (const step of t.steps!) {
            console.log("Instruction:", step.instruction);
            console.log("Tree:", JSON.stringify(step.tree));
            console.log("Annotation:", step.annotation);
          }
        }
        expect(s.tree!.color).toBe('black');
        expect(rbNoRedRed(s.tree)).toBe(true);
        expect(heightVal).not.toBeNull();
        expect(isSorted(inorder(s.tree))).toBe(true);
      }
    }
  });

  it('B-tree deletion keeps valid B-tree (same leaf depth, ordered, <=3 keys)', () => {
    for (let i = 0; i < 50; i++) {
      const t = generateBTreeDeletion();
      for (const s of t.steps!) {
        const depths = btreeLeafDepths(s.tree);
        expect(new Set(depths).size).toBe(1);
        expect(isSorted(inorder(s.tree))).toBe(true);
        const maxKeys = (n: TreeNodeJSON | null | undefined): number => {
          if (!n) return 0;
          const here = n.values ? n.values.length : 0;
          const c = (n.children ?? []).reduce((m, x) => Math.max(m, maxKeys(x)), 0);
          return Math.max(here, c);
        };
        const minKeys = (n: TreeNodeJSON | null | undefined, isRoot: boolean): number => {
          if (!n) return Infinity;
          const here = n.values ? n.values.length : 0;
          if (!isRoot && here < 1) return 0; // violation: non-root has 0 keys
          const childMin = (n.children ?? []).reduce((m, x) => Math.min(m, minKeys(x, false)), Infinity);
          return Math.min(here, childMin);
        };
        expect(maxKeys(s.tree)).toBeLessThanOrEqual(3);
        expect(minKeys(s.tree, true)).toBeGreaterThanOrEqual(1);
      }
    }
  });
});
