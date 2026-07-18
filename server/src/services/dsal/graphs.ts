import { TaskData, GraphJSON } from '../math/types';

/**
 * Graph algorithm exercise generators, translated from the official
 * exercisegenerator (exgen/src/main/java/exercisegenerator/algorithms/graphs/*.java).
 *
 * The official exercises ask for a sequence/table; our single-answer format
 * asks for a concrete, well-defined result:
 *  - BFS / DFS: the node visitation order (comma-separated labels)
 *  - TopoSort: a topological ordering (or "keine" if a cycle exists)
 *  - Dijkstra: the final distance to a randomly chosen target node
 *  - Bellman-Ford: the final distance to a randomly chosen target node
 *  - Prim / Kruskal: the set of edges of the minimum spanning tree
 *  - Union-Find: the final parent/representative of a queried element
 *  - Kosaraju-Sharir: the strong-component assignment (label -> representative)
 *  - Floyd-Warshall: the final all-pairs distance matrix
 *
 * Graphs use single-letter vertex labels (a, b, c, …) sorted alphabetically,
 * matching the official generator's vertex ordering.
 */

interface Edge {
  from: string;
  to: string;
  weight: number;
}

interface Graph {
  directed: boolean;
  vertices: string[];
  edges: Edge[];
}

function getRandomInt(min: number, max: number): number {
  if (max < min) return min;
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function letter(i: number): string {
  return String.fromCharCode(97 + i); // a, b, c, ...
}

/** Build a random connected undirected graph with n vertices and random weights. */
function randomConnectedGraph(n: number, directed = false): Graph {
  const vertices = Array.from({ length: n }, (_, i) => letter(i));
  const edges: Edge[] = [];
  const seen = new Set<string>();
  const key = (a: string, b: string) => (directed ? `${a}->${b}` : [a, b].sort().join('-'));
  const addEdge = (a: string, b: string, w: number) => {
    if (a === b) return;
    const k = key(a, b);
    if (seen.has(k)) return;
    seen.add(k);
    edges.push({ from: a, to: b, weight: w });
  };
  // Spanning tree to guarantee connectivity.
  for (let i = 1; i < n; i++) {
    const j = getRandomInt(0, i - 1);
    addEdge(vertices[i], vertices[j], getRandomInt(1, 9));
  }
  // A few extra random edges.
  const extra = getRandomInt(1, Math.max(1, n));
  for (let e = 0; e < extra; e++) {
    const a = vertices[getRandomInt(0, n - 1)];
    const b = vertices[getRandomInt(0, n - 1)];
    addEdge(a, b, getRandomInt(1, 9));
  }
  return { directed, vertices, edges };
}

function adjacency(graph: Graph): Map<string, { to: string; weight: number }[]> {
  const adj = new Map<string, { to: string; weight: number }[]>();
  for (const v of graph.vertices) adj.set(v, []);
  for (const e of graph.edges) {
    adj.get(e.from)!.push({ to: e.to, weight: e.weight });
    if (!graph.directed) adj.get(e.to)!.push({ to: e.from, weight: e.weight });
  }
  // Sort neighbours alphabetically (official: edges traversed in alphabetical order).
  for (const v of graph.vertices) adj.get(v)!.sort((x, y) => x.to.localeCompare(y.to));
  return adj;
}

function graphToText(graph: Graph): string {
  const lines = graph.edges.map((e) => `${e.from}->${e.to} (${e.weight})`);
  return `Knoten: {${graph.vertices.join(', ')}}. Kanten: ${lines.join(', ')}.`;
}

/** Convert the internal Graph to a GraphJSON with a circular layout (normalized 0..1). */
function toGraphJSON(g: Graph): GraphJSON {
  const n = g.vertices.length;
  const layout = g.vertices.map((v, i) => ({
    vertex: v,
    x: 0.5 + 0.4 * Math.cos((2 * Math.PI * i) / n),
    y: 0.5 + 0.4 * Math.sin((2 * Math.PI * i) / n),
  }));
  return {
    directed: g.directed,
    vertices: g.vertices,
    edges: g.edges.map((e) => ({ from: e.from, to: e.to, weight: e.weight })),
    layout,
  };
}

/* ------------------------------- BFS / DFS ------------------------------- */

function bfs(graph: Graph, start: string): string[] {
  const adj = adjacency(graph);
  const used = new Set<string>();
  const queue: string[] = [start];
  const result: string[] = [];
  while (queue.length > 0) {
    const v = queue.shift()!;
    if (used.has(v)) continue;
    used.add(v);
    result.push(v);
    for (const n of adj.get(v)!) queue.push(n.to);
  }
  return result;
}

function dfs(graph: Graph, start: string): string[] {
  const adj = adjacency(graph);
  const used = new Set<string>();
  const result: string[] = [];
  const visit = (v: string) => {
    if (used.has(v)) return;
    used.add(v);
    result.push(v);
    for (const n of adj.get(v)!) visit(n.to);
  };
  visit(start);
  return result;
}

/* ----------------------------- Topological sort -------------------------- */

function topoSort(graph: Graph): string[] | null {
  const adj = adjacency(graph);
  const visited = new Set<string>();
  const finished = new Set<string>();
  const result: string[] = [];
  const visit = (v: string): boolean => {
    if (finished.has(v)) return false;
    if (visited.has(v)) return true; // cycle
    visited.add(v);
    for (const n of adj.get(v)!) if (visit(n.to)) return true;
    finished.add(v);
    result.unshift(v);
    return false;
  };
  for (const v of graph.vertices) if (visit(v)) return null;
  return result;
}

/* ------------------------------- Dijkstra -------------------------------- */

function dijkstra(graph: Graph, start: string): Map<string, number> {
  const adj = adjacency(graph);
  const dist = new Map<string, number>();
  for (const v of graph.vertices) dist.set(v, Infinity);
  dist.set(start, 0);
  const used = new Set<string>();
  while (used.size < graph.vertices.length) {
    // pick unvisited vertex with minimum distance
    let cur: string | null = null;
    let best = Infinity;
    for (const [v, d] of dist) {
      if (!used.has(v) && d < best) {
        best = d;
        cur = v;
      }
    }
    if (cur === null) break;
    used.add(cur);
    for (const n of adj.get(cur)!) {
      const nd = dist.get(cur)! + n.weight;
      if (nd < dist.get(n.to)!) dist.set(n.to, nd);
    }
  }
  return dist;
}

/* ------------------------------ Bellman-Ford ----------------------------- */

function bellmanFord(graph: Graph, start: string): Map<string, number> {
  const adj = adjacency(graph);
  const dist = new Map<string, number>();
  for (const v of graph.vertices) dist.set(v, Infinity);
  dist.set(start, 0);
  const n = graph.vertices.length;
  for (let i = 0; i < n - 1; i++) {
    let changed = false;
    for (const [from, neighbours] of adj) {
      const d = dist.get(from)!;
      if (d === Infinity) continue;
      for (const nbr of neighbours) {
        if (d + nbr.weight < dist.get(nbr.to)!) {
          dist.set(nbr.to, d + nbr.weight);
          changed = true;
        }
      }
    }
    if (!changed) break;
  }
  return dist;
}

/* ------------------------------ Minimum spanning tree --------------------- */

function kruskal(graph: Graph): Edge[] {
  const parent = new Map<string, string>();
  for (const v of graph.vertices) parent.set(v, v);
  const find = (x: string): string => {
    while (parent.get(x) !== x) {
      parent.set(x, parent.get(parent.get(x)!)!);
      x = parent.get(x)!;
    }
    return x;
  };
  const union = (a: string, b: string) => parent.set(find(a), find(b));
  const sorted = [...graph.edges].sort((x, y) => x.weight - y.weight);
  const result: Edge[] = [];
  for (const e of sorted) {
    if (find(e.from) !== find(e.to)) {
      result.push(e);
      union(e.from, e.to);
    }
  }
  return result;
}

function prim(graph: Graph, start: string): Edge[] {
  const adj = adjacency(graph);
  const inTree = new Set<string>([start]);
  const result: Edge[] = [];
  while (inTree.size < graph.vertices.length) {
    let best: Edge | null = null;
    for (const v of inTree) {
      for (const n of adj.get(v)!) {
        if (!inTree.has(n.to) && (best === null || n.weight < best.weight)) {
          best = { from: v, to: n.to, weight: n.weight };
        }
      }
    }
    if (best === null) break;
    result.push(best);
    inTree.add(best.to);
  }
  return result;
}

/* ------------------------------- Union-Find ------------------------------ */

class UnionFind {
  parent: Map<number, number>;
  constructor(n: number) {
    this.parent = new Map();
    for (let i = 0; i < n; i++) this.parent.set(i, i);
  }
  find(x: number): number {
    while (this.parent.get(x)! !== x) {
      this.parent.set(x, this.parent.get(this.parent.get(x)!)!);
      x = this.parent.get(x)!;
    }
    return x;
  }
  union(a: number, b: number): void {
    this.parent.set(this.find(a), this.find(b));
  }
}

/* ----------------------------- Kosaraju-Sharir --------------------------- */

function kosaraju(graph: Graph): Map<string, string> {
  const adj = adjacency(graph);
  const visited = new Set<string>();
  const stack: string[] = [];
  const visit = (v: string) => {
    if (visited.has(v)) return;
    visited.add(v);
    for (const n of adj.get(v)!) visit(n.to);
    stack.push(v);
  };
  for (const v of graph.vertices) visit(v);
  // transpose
  const transposed = new Map<string, { to: string; weight: number }[]>();
  for (const v of graph.vertices) transposed.set(v, []);
  for (const e of graph.edges) transposed.get(e.to)!.push({ to: e.from, weight: e.weight });
  for (const v of graph.vertices) transposed.get(v)!.sort((x, y) => x.to.localeCompare(y.to));
  const assignment = new Map<string, string>();
  const assign = (v: string, root: string) => {
    if (assignment.has(v)) return;
    assignment.set(v, root);
    for (const n of transposed.get(v)!) assign(n.to, root);
  };
  while (stack.length > 0) {
    const v = stack.pop()!;
    assign(v, v);
  }
  return assignment;
}

/* ------------------------------ Floyd-Warshall --------------------------- */

function floydWarshall(graph: Graph): number[][] {
  const vs = graph.vertices;
  const n = vs.length;
  const idx = new Map<string, number>();
  vs.forEach((v, i) => idx.set(v, i));
  const INF = Infinity;
  const d: number[][] = Array.from({ length: n }, () => new Array(n).fill(INF));
  for (let i = 0; i < n; i++) d[i][i] = 0;
  for (const e of graph.edges) {
    d[idx.get(e.from)!][idx.get(e.to)!] = e.weight;
    if (!graph.directed) d[idx.get(e.to)!][idx.get(e.from)!] = e.weight;
  }
  for (let k = 0; k < n; k++)
    for (let i = 0; i < n; i++)
      for (let j = 0; j < n; j++) if (d[i][k] + d[k][j] < d[i][j]) d[i][j] = d[i][k] + d[k][j];
  return d;
}

/* --------------------------- Task construction ---------------------------- */

function edgeSetStr(edges: Edge[]): string {
  return edges
    .map((e) => `${e.from}${e.to}(${e.weight})`)
    .sort()
    .join(', ');
}

export function generateBFS(): TaskData {
  const g = randomConnectedGraph(getRandomInt(5, 7));
  const start = g.vertices[getRandomInt(0, g.vertices.length - 1)];
  const order = bfs(g, start);
  return {
    type: 'dsal_graph_bfs',
    mathQuery: graphToText(g),
    answer: '',
    graph: toGraphJSON(g),
    prompt: `Führen Sie eine Breitensuche ab Startknoten ${start} aus. Geben Sie die Knoten in der Reihenfolge ihrer Entdeckung an (Kanten alphabetisch).`,
    inputHint: 'Knoten nacheinander eingeben, z. B. a, dann b, …',
    steps: order.map((v) => ({
      instruction: `Nächster besuchter Knoten (BFS ab ${start})`,
      kind: 'text' as const,
      answer: v,
    })),
    explanation: [`Besuchsreihenfolge: ${order.join(', ')}.`],
  };
}

export function generateDFS(): TaskData {
  const g = randomConnectedGraph(getRandomInt(5, 7));
  const start = g.vertices[getRandomInt(0, g.vertices.length - 1)];
  const order = dfs(g, start);
  return {
    type: 'dsal_graph_dfs',
    mathQuery: graphToText(g),
    answer: '',
    graph: toGraphJSON(g),
    prompt: `Führen Sie eine Tiefensuche ab Startknoten ${start} aus. Geben Sie die Knoten in der Reihenfolge ihrer Entdeckung an (Kanten alphabetisch).`,
    inputHint: 'Knoten nacheinander eingeben, z. B. a, dann b, …',
    steps: order.map((v) => ({
      instruction: `Nächster besuchter Knoten (DFS ab ${start})`,
      kind: 'text' as const,
      answer: v,
    })),
    explanation: [`Besuchsreihenfolge: ${order.join(', ')}.`],
  };
}

export function generateTopoSort(): TaskData {
  // Build a DAG: edges only from lower-index to higher-index vertices.
  const n = getRandomInt(5, 7);
  const vertices = Array.from({ length: n }, (_, i) => letter(i));
  const edges: Edge[] = [];
  for (let i = 0; i < n - 1; i++) {
    const extra = getRandomInt(1, 2);
    for (let e = 0; e < extra; e++) {
      const j = getRandomInt(i + 1, n - 1);
      if (j > i) edges.push({ from: vertices[i], to: vertices[j], weight: 1 });
    }
  }
  const g: Graph = { directed: true, vertices, edges };
  const order = topoSort(g);
  return {
    type: 'dsal_graph_topo',
    mathQuery: graphToText(g),
    answer: '',
    graph: toGraphJSON(g),
    prompt: 'Geben Sie eine topologische Sortierung des Graphen an (oder "keine (Zyklus)" falls keiner existiert).',
    inputHint: 'Knoten nacheinander eingeben.',
    steps: order
      ? order.map((v) => ({ instruction: 'Nächster Knoten der topologischen Sortierung', kind: 'text' as const, answer: v }))
      : [{ instruction: 'Topologische Sortierung', kind: 'text' as const, answer: 'keine (Zyklus)' }],
    explanation: [order ? `Topologische Ordnung: ${order.join(', ')}.` : 'Der Graph enthält einen Zyklus, daher existiert keine topologische Sortierung.'],
  };
}

export function generateDijkstra(): TaskData {
  const g = randomConnectedGraph(getRandomInt(5, 7));
  const start = g.vertices[getRandomInt(0, g.vertices.length - 1)];
  const dist = dijkstra(g, start);
  const targets = g.vertices.filter((v) => v !== start);
  const target = targets[getRandomInt(0, targets.length - 1)];
  const d = dist.get(target)!;
  const distStr = g.vertices.map((v) => `${v}=${dist.get(v)}`).join(', ');
  return {
    type: 'dsal_graph_dijkstra',
    mathQuery: graphToText(g),
    answer: '',
    graph: toGraphJSON(g),
    prompt: `Führen Sie Dijkstra ab Startknoten ${start} aus. Wie groß ist die kürzeste Distanz zum Knoten ${target}?`,
    inputHint: 'Gib die Distanz als ganze Zahl ein.',
    steps: [{ instruction: `Kürzeste Distanz von ${start} nach ${target}`, kind: 'text' as const, answer: String(d), annotation: `Distanzen: ${distStr}` }],
    explanation: [`Kürzeste Distanz von ${start} nach ${target}: ${d}.`],
  };
}

export function generateBellmanFord(): TaskData {
  const g = randomConnectedGraph(getRandomInt(5, 7));
  const start = g.vertices[getRandomInt(0, g.vertices.length - 1)];
  const dist = bellmanFord(g, start);
  const targets = g.vertices.filter((v) => v !== start);
  const target = targets[getRandomInt(0, targets.length - 1)];
  const d = dist.get(target)!;
  const distStr = g.vertices.map((v) => `${v}=${dist.get(v)}`).join(', ');
  return {
    type: 'dsal_graph_bellmanford',
    mathQuery: graphToText(g),
    answer: '',
    graph: toGraphJSON(g),
    prompt: `Führen Sie Bellman-Ford ab Startknoten ${start} aus. Wie groß ist die kürzeste Distanz zum Knoten ${target}?`,
    inputHint: 'Gib die Distanz als ganze Zahl ein.',
    steps: [{ instruction: `Kürzeste Distanz von ${start} nach ${target}`, kind: 'text' as const, answer: String(d), annotation: `Distanzen: ${distStr}` }],
    explanation: [`Kürzeste Distanz von ${start} nach ${target}: ${d}.`],
  };
}

export function generatePrim(): TaskData {
  const g = randomConnectedGraph(getRandomInt(5, 7));
  const start = g.vertices[getRandomInt(0, g.vertices.length - 1)];
  const mst = prim(g, start);
  return {
    type: 'dsal_graph_prim',
    mathQuery: graphToText(g),
    answer: '',
    graph: toGraphJSON(g),
    prompt: `Führen Sie den Algorithmus von Prim ab Startknoten ${start} aus. Geben Sie die Kanten des minimalen Spannbaums nacheinander an.`,
    inputHint: 'Kanten der Reihe nach eingeben, z. B. ab(2).',
    steps: mst.map((e) => ({
      instruction: 'Nächste Kante des minimalen Spannbaums',
      kind: 'text' as const,
      answer: `${e.from}${e.to}(${e.weight})`,
    })),
    explanation: [`Minimaler Spannbaum (${mst.length} Kanten): ${edgeSetStr(mst)}.`],
  };
}

export function generateKruskal(): TaskData {
  const g = randomConnectedGraph(getRandomInt(5, 7));
  const mst = kruskal(g);
  return {
    type: 'dsal_graph_kruskal',
    mathQuery: graphToText(g),
    answer: '',
    graph: toGraphJSON(g),
    prompt: 'Führen Sie den Algorithmus von Kruskal aus. Geben Sie die Kanten des minimalen Spannbaums nacheinander an.',
    inputHint: 'Kanten der Reihe nach eingeben, z. B. ab(2).',
    steps: mst.map((e) => ({
      instruction: 'Nächste Kante des minimalen Spannbaums',
      kind: 'text' as const,
      answer: `${e.from}${e.to}(${e.weight})`,
    })),
    explanation: [`Minimaler Spannbaum (${mst.length} Kanten): ${edgeSetStr(mst)}.`],
  };
}

export function generateUnionFind(): TaskData {
  const n = getRandomInt(5, 8);
  const uf = new UnionFind(n);
  // Perform 2-3 random unions.
  const numUnions = getRandomInt(2, 3);
  for (let i = 0; i < numUnions; i++) {
    const a = getRandomInt(0, n - 1);
    let b = getRandomInt(0, n - 1);
    if (b === a) b = (b + 1) % n;
    uf.union(a, b);
  }
  const query = getRandomInt(0, n - 1);
  const rep = uf.find(query);
  const ops = `${numUnions} Union-Operationen auf {0..${n - 1}}`;
  return {
    type: 'dsal_graph_unionfind',
    mathQuery: `Union-Find mit Elementen {0, …, ${n - 1}}. ${ops}.`,
    answer: '',
    prompt: `Nach Ausführung der Union-Operationen: Was ist der Repräsentant (find) des Elements ${query}?`,
    inputHint: 'Gib die Repräsentanten-Zahl ein.',
    steps: [{ instruction: `Repräsentant (find) von Element ${query}`, kind: 'text' as const, answer: String(rep) }],
    explanation: [`Repräsentant von ${query} nach den Union-Operationen: ${rep}.`],
  };
}

export function generateKosaraju(): TaskData {
  const g = randomConnectedGraph(getRandomInt(5, 7), true);
  const assignment = kosaraju(g);
  const parts = g.vertices.map((v) => `${v}→${assignment.get(v)}`).join(', ');
  return {
    type: 'dsal_graph_kosaraju',
    mathQuery: graphToText(g),
    answer: '',
    graph: toGraphJSON(g),
    prompt: 'Wenden Sie Kosaraju-Sharir an. Geben Sie die Zuordnung Knoten→Repräsentant der starken Zusammenhangskomponenten an.',
    inputHint: 'Format: a→a, b→a, c→c, …',
    steps: [{ instruction: 'Zuordnung Knoten→Repräsentant (starke Zusammenhangskomponenten)', kind: 'text' as const, answer: parts }],
    explanation: [`Zuordnung: ${parts}.`],
  };
}

export function generateFloydWarshall(): TaskData {
  const g = randomConnectedGraph(getRandomInt(4, 6));
  const d = floydWarshall(g);
  const matrix = d.map((row) => row.map((x) => (x === Infinity ? '∞' : String(x))).join(' ')).join(' | ');
  return {
    type: 'dsal_graph_floydwarshall',
    mathQuery: graphToText(g),
    answer: '',
    graph: toGraphJSON(g),
    prompt: 'Führen Sie Floyd-Warshall aus. Geben Sie die finale Distanzmatrix (Zeilen durch " | " getrennt) an.',
    inputHint: 'Format: "0 3 ∞ 2 | 3 0 1 5 | …". Unerreichbar = ∞.',
    steps: [{ instruction: 'Finale Distanzmatrix (Zeilen durch " | " getrennt, ∞ für unerreichbar)', kind: 'text' as const, answer: matrix }],
    explanation: [`Finale Distanzmatrix: ${matrix}.`],
  };
}
