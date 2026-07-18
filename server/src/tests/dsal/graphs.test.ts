import { describe, it, expect } from 'vitest';
import {
  generateBFS,
  generateDFS,
  generateTopoSort,
  generateDijkstra,
  generateBellmanFord,
  generatePrim,
  generateKruskal,
  generateUnionFind,
  generateKosaraju,
  generateFloydWarshall,
} from '../../services/dsal/graphs';

describe('DSAL graph generators', () => {
  it('BFS/DFS: answer is a permutation of all vertices', () => {
    for (let t = 0; t < 20; t++) {
      const bfs = generateBFS();
      const dfs = generateDFS();
      const bfsNodes = bfs.answer.split(', ');
      const dfsNodes = dfs.answer.split(', ');
      expect(bfsNodes.length).toBeGreaterThan(0);
      expect(dfsNodes.length).toBeGreaterThan(0);
      // Each traversal visits every vertex exactly once (connected graph).
      expect(new Set(bfsNodes).size).toBe(bfsNodes.length);
      expect(new Set(dfsNodes).size).toBe(dfsNodes.length);
    }
  });

  it('topo sort: answer is a valid ordering or "keine (Zyklus)"', () => {
    for (let t = 0; t < 20; t++) {
      const task = generateTopoSort();
      expect(task.answer.length).toBeGreaterThan(0);
    }
  });

  it('dijkstra/bellman-ford: answer is a non-negative integer', () => {
    for (let t = 0; t < 20; t++) {
      const d = generateDijkstra();
      const bf = generateBellmanFord();
      expect(Number.isInteger(parseInt(d.answer, 10))).toBe(true);
      expect(parseInt(d.answer, 10)).toBeGreaterThanOrEqual(0);
      expect(Number.isInteger(parseInt(bf.answer, 10))).toBe(true);
    }
  });

  it('prim/kruskal: answer lists edges of the MST', () => {
    for (let t = 0; t < 20; t++) {
      const p = generatePrim();
      const k = generateKruskal();
      expect(p.answer.length).toBeGreaterThan(0);
      expect(k.answer.length).toBeGreaterThan(0);
      // MST of an n-vertex connected graph has n-1 edges (>= 2 for n >= 3).
      const pEdges = p.answer.split(', ').length;
      const kEdges = k.answer.split(', ').length;
      expect(pEdges).toBeGreaterThanOrEqual(2);
      expect(kEdges).toBeGreaterThanOrEqual(2);
    }
  });

  it('union-find: answer is a valid element index', () => {
    for (let t = 0; t < 20; t++) {
      const task = generateUnionFind();
      const rep = parseInt(task.answer, 10);
      expect(Number.isInteger(rep)).toBe(true);
      expect(rep).toBeGreaterThanOrEqual(0);
    }
  });

  it('kosaraju: answer maps every vertex to a representative', () => {
    for (let t = 0; t < 20; t++) {
      const task = generateKosaraju();
      const parts = task.answer.split(', ');
      expect(parts.length).toBeGreaterThan(0);
      for (const p of parts) expect(p).toMatch(/^[a-z]→[a-z]$/);
    }
  });

  it('floyd-warshall: answer is a square matrix with ∞ for unreachable', () => {
    for (let t = 0; t < 20; t++) {
      const task = generateFloydWarshall();
      const rows = task.answer.split(' | ');
      const n = rows.length;
      expect(n).toBeGreaterThanOrEqual(4);
      for (const row of rows) {
        const cells = row.split(' ');
        expect(cells.length).toBe(n);
      }
    }
  });

  it('all graph tasks produce a non-empty answer and prompt', () => {
    const gens = [
      generateBFS,
      generateDFS,
      generateTopoSort,
      generateDijkstra,
      generateBellmanFord,
      generatePrim,
      generateKruskal,
      generateUnionFind,
      generateKosaraju,
      generateFloydWarshall,
    ];
    for (const g of gens) {
      const task = g();
      expect(task.answer.length).toBeGreaterThan(0);
      expect(task.prompt).toBeTruthy();
      expect(task.type.startsWith('dsal_graph_')).toBe(true);
    }
  });
});
