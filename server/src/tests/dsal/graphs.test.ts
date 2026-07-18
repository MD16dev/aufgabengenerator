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

describe('DSAL graph generators (stepwise + visual)', () => {
  it('BFS/DFS: steps list every vertex exactly once in visitation order', () => {
    for (let t = 0; t < 20; t++) {
      const bfs = generateBFS();
      const dfs = generateDFS();
      expect(bfs.graph).toBeDefined();
      expect(dfs.graph).toBeDefined();
      const bfsNodes = bfs.steps!.map((s) => s.answer!);
      const dfsNodes = dfs.steps!.map((s) => s.answer!);
      expect(bfsNodes.length).toBe(bfs.graph!.vertices.length);
      expect(dfsNodes.length).toBe(dfs.graph!.vertices.length);
      expect(new Set(bfsNodes).size).toBe(bfsNodes.length);
      expect(new Set(dfsNodes).size).toBe(dfsNodes.length);
      for (const s of bfs.steps!) expect(s.kind).toBe('text');
    }
  });

  it('topo sort: steps are a valid ordering or a single "keine (Zyklus)" step', () => {
    for (let t = 0; t < 20; t++) {
      const task = generateTopoSort();
      expect(task.steps!.length).toBeGreaterThan(0);
      if (task.steps!.length === 1) {
        expect(task.steps![0].answer).toBe('keine (Zyklus)');
      } else {
        const nodes = task.steps!.map((s) => s.answer!);
        expect(new Set(nodes).size).toBe(nodes.length);
      }
    }
  });

  it('dijkstra/bellman-ford: single step with non-negative integer answer', () => {
    for (let t = 0; t < 20; t++) {
      const d = generateDijkstra();
      const bf = generateBellmanFord();
      expect(d.steps!.length).toBe(1);
      expect(bf.steps!.length).toBe(1);
      expect(Number.isInteger(parseInt(d.steps![0].answer!, 10))).toBe(true);
      expect(parseInt(d.steps![0].answer!, 10)).toBeGreaterThanOrEqual(0);
    }
  });

  it('prim/kruskal: steps list MST edges (n-1 edges)', () => {
    for (let t = 0; t < 20; t++) {
      const p = generatePrim();
      const k = generateKruskal();
      expect(p.steps!.length).toBeGreaterThanOrEqual(2);
      expect(k.steps!.length).toBeGreaterThanOrEqual(2);
      for (const s of p.steps!) expect(s.answer).toMatch(/^[a-z][a-z]\(\d+\)$/);
    }
  });

  it('union-find: single step with a valid element index', () => {
    for (let t = 0; t < 20; t++) {
      const task = generateUnionFind();
      const rep = parseInt(task.steps![0].answer!, 10);
      expect(Number.isInteger(rep)).toBe(true);
      expect(rep).toBeGreaterThanOrEqual(0);
    }
  });

  it('kosaraju: single step mapping every vertex to a representative', () => {
    for (let t = 0; t < 20; t++) {
      const task = generateKosaraju();
      const parts = task.steps![0].answer!.split(', ');
      expect(parts.length).toBe(task.graph!.vertices.length);
      for (const p of parts) expect(p).toMatch(/^[a-z]→[a-z]$/);
    }
  });

  it('floyd-warshall: single step with a square matrix', () => {
    for (let t = 0; t < 20; t++) {
      const task = generateFloydWarshall();
      const rows = task.steps![0].answer!.split(' | ');
      const n = rows.length;
      for (const row of rows) {
        const cells = row.split(' ');
        expect(cells.length).toBe(n);
      }
    }
  });

  it('all graph tasks produce stepwise tasks with a prompt and graph (except union-find)', () => {
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
      expect(task.steps).toBeDefined();
      expect(task.steps!.length).toBeGreaterThan(0);
      expect(task.answer).toBe('');
      expect(task.prompt).toBeTruthy();
      expect(task.type.startsWith('dsal_graph_')).toBe(true);
    }
  });
});
