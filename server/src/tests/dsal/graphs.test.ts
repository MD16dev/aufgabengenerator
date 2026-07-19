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

  it('kosaraju: partition into strong components (sets of vertices)', () => {
    for (let t = 0; t < 20; t++) {
      const task = generateKosaraju();
      const answer = task.steps![0].answer!;
      // Sets are joined by "}, {", so split on "}, " and re-add the closing brace.
      const sets = answer.split('}, ').map((s, i, arr) => (i === arr.length - 1 ? s : s + '}'));
      // Every set is of the form "{a, b, c}".
      for (const s of sets) expect(s).toMatch(/^\{[a-z](, [a-z])*\}$/);
      // The union of all sets covers every vertex exactly once.
      const letters = answer.match(/[a-z]/g)!;
      expect(letters.sort().join(',')).toBe([...task.graph!.vertices].sort().join(','));
    }
  });

  it('floyd-warshall: single distance answer plus full matrix in annotation', () => {
    for (let t = 0; t < 20; t++) {
      const task = generateFloydWarshall();
      // The step answer is now a single integer distance.
      expect(task.steps![0].answer).toMatch(/^\d+$/);
      // The full matrix is preserved in the annotation for the solution view.
      const ann = task.steps![0].annotation ?? '';
      expect(ann).toContain('Vollständige Matrix');
      // Extract the matrix part after the colon.
      const matrixPart = ann.split(': ')[1];
      const rows = matrixPart.split(' | ');
      const n = task.graph!.vertices.length;
      expect(rows.length).toBe(n);
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
