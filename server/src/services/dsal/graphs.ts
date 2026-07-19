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

  // Generate distinct weights pool to ensure unique MST / Dijkstra paths.
  const weights = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];
  for (let i = weights.length - 1; i > 0; i--) {
    const j = getRandomInt(0, i);
    const temp = weights[i];
    weights[i] = weights[j];
    weights[j] = temp;
  }
  let wIdx = 0;

  const addEdge = (a: string, b: string) => {
    if (a === b) return;
    const k = key(a, b);
    if (seen.has(k)) return;
    seen.add(k);
    edges.push({ from: a, to: b, weight: weights[wIdx++] });
  };
  // Pre-defined non-crossing planar edge connections for vertices a-g.
  const allowedPlanarEdges = [
    ['e', 'd'],
    ['d', 'f'],
    ['d', 'b'],
    ['f', 'b'],
    ['f', 'a'],
    ['b', 'a'],
    ['b', 'c'],
    ['b', 'g'],
    ['c', 'a'],
    ['g', 'c'],
  ].filter(([u, v]) => vertices.includes(u) && vertices.includes(v));

  // Determine if we can build a planar graph using the allowed planar connections
  const usePlanarGeneration = vertices.every(
    (v) => ['a', 'b', 'c', 'd', 'e', 'f', 'g'].includes(v.toLowerCase())
  );

  if (usePlanarGeneration && allowedPlanarEdges.length > 0) {
    // Spanning tree over the allowed planar edges to guarantee planarity and connectivity.
    const connectedVertices = [vertices[0]];
    const remaining = new Set(vertices.slice(1));
    const treeEdges: [string, string][] = [];

    while (remaining.size > 0) {
      const candidates = allowedPlanarEdges.filter(
        ([u, v]) =>
          (connectedVertices.includes(u) && remaining.has(v)) ||
          (connectedVertices.includes(v) && remaining.has(u))
      );
      if (candidates.length === 0) break;
      const edge = candidates[getRandomInt(0, candidates.length - 1)];
      const [u, v] = edge;
      const newVertex = remaining.has(u) ? u : v;
      connectedVertices.push(newVertex);
      remaining.delete(newVertex);
      treeEdges.push([u, v]);
    }

    for (const [u, v] of treeEdges) {
      addEdge(u, v);
    }

    // Add 1-2 extra random edges from the remaining allowed planar edges
    const remainingAllowed = allowedPlanarEdges.filter(([u, v]) => !seen.has(key(u, v)));
    const extra = Math.min(getRandomInt(1, 2), remainingAllowed.length);
    for (let e = 0; e < extra; e++) {
      const idx = getRandomInt(0, remainingAllowed.length - 1);
      const [u, v] = remainingAllowed[idx];
      addEdge(u, v);
      remainingAllowed.splice(idx, 1);
    }
  } else {
    // Fallback standard connectivity spanning tree
    for (let i = 1; i < n; i++) {
      const j = getRandomInt(0, i - 1);
      addEdge(vertices[i], vertices[j]);
    }
    const extra = getRandomInt(1, 2);
    for (let e = 0; e < extra; e++) {
      const a = vertices[getRandomInt(0, n - 1)];
      const b = vertices[getRandomInt(0, n - 1)];
      addEdge(a, b);
    }
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
  const arrow = graph.directed ? '->' : '-';
  const lines = graph.edges.map((e) => `${e.from}${arrow}${e.to} (${e.weight})`);
  return `Knoten: {${graph.vertices.join(', ')}}. Kanten: ${lines.join(', ')}.`;
}

/** Convert the internal Graph to a GraphJSON with a deterministic, spread-out
 *  layout (normalized 0..1). Vertices are placed on a circle ordered by their
 *  index (a, b, c, … around the ring). This keeps adjacent letters near each
 *  other and avoids the long crossing edges a grid layout produces, so the
 *  graph stays readable even with a few chords. A tiny deterministic jitter
 *  keeps it from looking like a rigid clock face. */
function toGraphJSON(g: Graph): GraphJSON {
  const presetCoords: Record<string, { x: number; y: number }> = {
    a: { x: 0.85, y: 0.65 },
    b: { x: 0.58, y: 0.38 },
    c: { x: 0.85, y: 0.38 },
    d: { x: 0.32, y: 0.65 },
    e: { x: 0.08, y: 0.92 },
    f: { x: 0.58, y: 0.65 },
    g: { x: 0.85, y: 0.12 },
  };

  const usePreset = g.vertices.every((v) => presetCoords[v.toLowerCase()] !== undefined);

  const layout = g.vertices.map((v, i) => {
    if (usePreset) {
      return { vertex: v, ...presetCoords[v.toLowerCase()] };
    }
    const n = g.vertices.length;
    const ordered = [...g.vertices].sort();
    const idx = ordered.indexOf(v);
    const angle = (2 * Math.PI * idx) / n - Math.PI / 2;
    const radius = 0.38;
    const x = 0.5 + radius * Math.cos(angle);
    const y = 0.5 + radius * Math.sin(angle);
    return { vertex: v, x, y };
  });

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

function dijkstra(graph: Graph, start: string): { dist: Map<string, number>; prev: Map<string, string | null> } {
  const adj = adjacency(graph);
  const dist = new Map<string, number>();
  const prev = new Map<string, string | null>();
  for (const v of graph.vertices) {
    dist.set(v, Infinity);
    prev.set(v, null);
  }
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
      if (nd < dist.get(n.to)!) {
        dist.set(n.to, nd);
        prev.set(n.to, cur);
      }
    }
  }
  return { dist, prev };
}

/** Reconstruct the shortest path from start to target via predecessor map. */
function shortestPath(prev: Map<string, string | null>, start: string, target: string): string {
  const path: string[] = [];
  let cur: string | null = target;
  while (cur !== null) {
    path.unshift(cur);
    cur = prev.get(cur) ?? null;
  }
  return path.join(' \\to ');
}

/* ------------------------------ Bellman-Ford ----------------------------- */

function bellmanFord(graph: Graph, start: string): { dist: Map<string, number>; prev: Map<string, string | null> } {
  const adj = adjacency(graph);
  const dist = new Map<string, number>();
  const prev = new Map<string, string | null>();
  for (const v of graph.vertices) {
    dist.set(v, Infinity);
    prev.set(v, null);
  }
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
          prev.set(nbr.to, from);
          changed = true;
        }
      }
    }
    if (!changed) break;
  }
  return { dist, prev };
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
    explanation: [`BFS nutzt eine Warteschlange: zuerst der Startknoten, dann alle unbesuchten Nachbarn (hier alphabetisch), dann deren Nachbarn. Besuchsreihenfolge: $${order.join(', ')}$.`],
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
    explanation: [`DFS geht so tief wie möglich und backtrackt erst danach. Besuchsreihenfolge: $${order.join(', ')}$.`],
  };
}

export function generateTopoSort(): TaskData {
  // Build a DAG with a Hamiltonian path to guarantee a UNIQUE topological sorting
  // and shuffle vertex letters so alphabetical order is NOT a valid topological sort.
  const n = getRandomInt(5, 7);
  const rawLetters = Array.from({ length: n }, (_, i) => letter(i));
  
  // Shuffle letters to determine the unique topological sorting order
  const orderedVertices = [...rawLetters];
  for (let i = orderedVertices.length - 1; i > 0; i--) {
    const j = getRandomInt(0, i);
    const temp = orderedVertices[i];
    orderedVertices[i] = orderedVertices[j];
    orderedVertices[j] = temp;
  }

  const edges: Edge[] = [];
  // 1) Add Hamiltonian path edges to guarantee connectivity and a unique topological sort.
  for (let i = 0; i < n - 1; i++) {
    edges.push({ from: orderedVertices[i], to: orderedVertices[i + 1], weight: 1 });
  }

  // 2) Add 1-2 extra forward edges to make it look like a general DAG.
  const extra = getRandomInt(1, 2);
  const seenTopo = new Set(edges.map((e) => `${e.from}->${e.to}`));
  for (let e = 0; e < extra; e++) {
    // Pick i and j such that i < j - 1 to avoid duplicating Hamiltonian path edges
    const i = getRandomInt(0, n - 3);
    const j = getRandomInt(i + 2, n - 1);
    const key = `${orderedVertices[i]}->${orderedVertices[j]}`;
    if (seenTopo.has(key)) continue;
    seenTopo.add(key);
    edges.push({ from: orderedVertices[i], to: orderedVertices[j], weight: 1 });
  }

  // Vertices are passed in alphabetical order to maintain deterministic circle placement
  const vertices = [...rawLetters];
  const g: Graph = { directed: true, vertices, edges };
  const order = topoSort(g);

  return {
    type: 'dsal_graph_topo',
    mathQuery: graphToText(g),
    answer: '',
    graph: toGraphJSON(g),
    prompt: 'Geben Sie eine topologische Sortierung des Graphen an (Knoten in einer Reihenfolge, sodass jede Kante von vorne nach hinten zeigt).',
    inputHint: 'Knoten nacheinander eingeben.',
    steps: order
      ? order.map((v) => ({ instruction: 'Nächster Knoten der topologischen Sortierung', kind: 'text' as const, answer: v }))
      : [{ instruction: 'Topologische Sortierung', kind: 'text' as const, answer: 'keine (Zyklus)' }],
    explanation: [
      `Eine topologische Sortierung entspricht der umgekehrten Abschlussreihenfolge einer Tiefensuche (DFS).`,
      `Da dieser Graphen einen gerichteten Pfad enthält, der alle Knoten abdeckt (Hamiltonpfad), ist die topologische Sortierung eindeutig: $${(order || []).join(', ')}$.`
    ],
  };
}

export function generateDijkstra(): TaskData {
  const g = randomConnectedGraph(getRandomInt(5, 7));
  const start = g.vertices[getRandomInt(0, g.vertices.length - 1)];
  const { dist, prev } = dijkstra(g, start);
  // Pick a target that is NOT a direct neighbour of start, so the answer
  // requires at least one intermediate hop (not just reading an edge weight).
  const directNeighbours = new Set(adjacency(g).get(start)!.map((n) => n.to));
  const candidates = g.vertices.filter((v) => v !== start && !directNeighbours.has(v));
  const targetPool = candidates.length > 0 ? candidates : g.vertices.filter((v) => v !== start);
  const target = targetPool[getRandomInt(0, targetPool.length - 1)];
  const d = dist.get(target)!;
  const distStr = g.vertices.map((v) => `${v}=${dist.get(v)}`).join(', ');
  const path = shortestPath(prev, start, target);
  return {
    type: 'dsal_graph_dijkstra',
    mathQuery: graphToText(g),
    answer: '',
    graph: toGraphJSON(g),
    prompt: `Führen Sie Dijkstra ab Startknoten ${start} aus. Wie groß ist die kürzeste Distanz zum Knoten ${target}?`,
    inputHint: 'Gib die Distanz als ganze Zahl ein.',
    steps: [{ instruction: `Kürzeste Distanz von ${start} nach ${target}`, kind: 'text' as const, answer: String(d), annotation: `Distanzen: ${distStr}` }],
    explanation: [
      `Dijkstra ist gierig: eine Prioritätswarteschlange wählt stets den unbesuchten Knoten mit kleinster Distanz, danach werden Nachbarn via Relaxation aktualisiert.`,
      `Kürzester Weg von ${start}$ nach ${target}$: ${path}$ (Länge ${d}$).`,
    ],
  };
}

export function generateBellmanFord(): TaskData {
  const g = randomConnectedGraph(getRandomInt(5, 7));
  const start = g.vertices[getRandomInt(0, g.vertices.length - 1)];
  const { dist, prev } = bellmanFord(g, start);
  // Same clarity fix as Dijkstra: avoid a target that is a direct neighbour.
  const directNeighbours = new Set(adjacency(g).get(start)!.map((n) => n.to));
  const candidates = g.vertices.filter((v) => v !== start && !directNeighbours.has(v));
  const targetPool = candidates.length > 0 ? candidates : g.vertices.filter((v) => v !== start);
  const target = targetPool[getRandomInt(0, targetPool.length - 1)];
  const d = dist.get(target)!;
  const distStr = g.vertices.map((v) => `${v}=${dist.get(v)}`).join(', ');
  const path = shortestPath(prev, start, target);
  return {
    type: 'dsal_graph_bellmanford',
    mathQuery: graphToText(g),
    answer: '',
    graph: toGraphJSON(g),
    prompt: `Führen Sie Bellman-Ford ab Startknoten ${start} aus. Wie groß ist die kürzeste Distanz zum Knoten ${target}? (Der kürzeste Weg führt nicht direkt über eine Kante, sondern über Zwischenknoten.)`,
    inputHint: 'Gib die Distanz als ganze Zahl ein.',
    steps: [{ instruction: `Kürzeste Distanz von ${start} nach ${target}`, kind: 'text' as const, answer: String(d), annotation: `Distanzen: ${distStr}` }],
    explanation: [
      `Bellman-Ford entspannt alle Kanten wiederholt (hier mit positiven Gewichten) und kann im Gegensatz zu Dijkstra auch negative Kantengewichte verarbeiten.`,
      `Kürzester Weg von ${start}$ nach ${target}$: ${path}$ (Länge ${d}$).`,
    ],
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
    explanation: [`Prim wächst den Baum schrittweise: per Cut-Property wird stets die leichteste Kante gewählt, die einen neuen Knoten mit dem Baum verbindet. Minimaler Spannbaum ($${mst.length}$ Kanten): $\\{ ${edgeSetStr(mst)} \\}$.`],
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
    explanation: [`Kruskal sortiert alle Kanten nach Gewicht und fügt sie hinzu, sofern sie keinen Zyklus bilden (geprüft via Union-Find). Minimaler Spannbaum ($${mst.length}$ Kanten): $\\{ ${edgeSetStr(mst)} \\}$.`],
  };
}

export function generateUnionFind(): TaskData {
  const n = getRandomInt(5, 8);
  const uf = new UnionFind(n);
  // Perform 2-3 random unions.
  const numUnions = getRandomInt(2, 3);
  const unions: Array<[number, number]> = [];
  for (let i = 0; i < numUnions; i++) {
    const a = getRandomInt(0, n - 1);
    let b = getRandomInt(0, n - 1);
    if (b === a) b = (b + 1) % n;
    unions.push([a, b]);
    uf.union(a, b);
  }
  const query = getRandomInt(0, n - 1);
  const rep = uf.find(query);
  const opLines = unions.map(([a, b]) => `\\text{Union}(${a},${b})`);
  // Wrap the prose in \text{} so KaTeX renders it as readable text instead of
  // interpreting every character as a separate math symbol. Put each operation
  // on its own line (via display-mode \\ breaks) for better readability.
  const mathQuery = [
    `\\text{Union-Find mit Elementen }\\{0, \\dots, ${n - 1}\\}\\text{. Operationen:}`,
    ...opLines,
    `\\text{Was ist find(${query})?}`,
  ].join(' \\\\ ');
  return {
    type: 'dsal_graph_unionfind',
    mathQuery,
    answer: '',
    prompt: `Nach Ausführung der Union-Operationen: Was ist der Repräsentant (find) des Elements ${query}?`,
    inputHint: 'Gib die Repräsentanten-Zahl ein.',
    steps: [{ instruction: `Repräsentant (find) von Element ${query}`, kind: 'text' as const, answer: String(rep) }],
    explanation: [
      `Union-Find vereint mit den Operationen $${unions.map(([a, b]) => `\\mathrm{Union}(${a}, ${b})`).join(', ')}$ jeweils die Mengen der beiden Elemente. $\\mathrm{find}(${query})$ liefert den Repräsentanten der Komponente, in der sich Element $${query}$ befindet: $${rep}$.`,
    ],
  };
}

export function generateKosaraju(): TaskData {
  const g = randomConnectedGraph(getRandomInt(5, 7), true);
  const assignment = kosaraju(g);
  // Group vertices by their representative to form the partition (sets of SCCs).
  // This is implementation-independent: any valid representative choice yields
  // the same partition, so grading is fair.
  const comps = new Map<string, string[]>();
  for (const v of g.vertices) {
    const rep = assignment.get(v)!;
    if (!comps.has(rep)) comps.set(rep, []);
    comps.get(rep)!.push(v);
  }
  const partition = [...comps.values()].map((set) => `{${set.sort().join(', ')}}`).sort();
  const partitionStr = partition.join(', ');
  const partitionLatex = partition.map((s) => `\\{${s.slice(1, -1)}\\}`).join('\\ \\ ');
  return {
    type: 'dsal_graph_kosaraju',
    mathQuery: graphToText(g),
    answer: '',
    graph: toGraphJSON(g),
    prompt: 'Wenden Sie Kosaraju-Sharir an. Geben Sie die starken Zusammenhangskomponenten als Partition an.',
    inputHint: 'Format: "{a, b}, {c, d, e}, …" (jede Komponente in geschweiften Klammern).',
    steps: [{ instruction: 'Starke Zusammenhangskomponenten (Partition)', kind: 'text' as const, answer: partitionStr }],
    explanation: [`Kosaraju läuft in zwei Durchläufen: zuerst DFS zur Ermittlung der Abschlussreihenfolge, dann DFS auf dem transponierten Graphen. Jede starke Zusammenhangskomponente ist eine Menge von Knoten, die sich gegenseitig erreichen. Partition: $${partitionLatex}$.`],
  };
}

export function generateFloydWarshall(): TaskData {
  const g = randomConnectedGraph(getRandomInt(4, 6));
  const d = floydWarshall(g);
  // Pick a target that is NOT a direct neighbour of start, so the answer
  // requires at least one intermediate hop (not just reading an edge weight).
  const start = g.vertices[getRandomInt(0, g.vertices.length - 1)];
  const directNeighbours = new Set(adjacency(g).get(start)!.map((n) => n.to));
  const candidates = g.vertices.filter((v) => v !== start && !directNeighbours.has(v));
  const targetPool = candidates.length > 0 ? candidates : g.vertices.filter((v) => v !== start);
  const target = targetPool[getRandomInt(0, targetPool.length - 1)];
  const dist = d[g.vertices.indexOf(start)][g.vertices.indexOf(target)];
  // Store the matrix numerically for KaTeX pmatrix rendering, and a plain-text
  // fallback (rows joined by " | ") for the input hint / comparison.
  const matrix = d.map((row) => row.map((x) => (x === Infinity ? Infinity : x)));
  const matrixText = d.map((row) => row.map((x) => (x === Infinity ? '∞' : String(x))).join(' ')).join(' | ');
  const headerRow = g.vertices.map((v) => v).join(' & ');
  const matrixLatex = `\\begin{pmatrix} & ${headerRow} \\\\ ${g.vertices
    .map((v, i) => `${v} & ${d[i].map((x) => (x === Infinity ? '\\infty' : String(x))).join(' & ')}`)
    .join(' \\\\ ')} \\end{pmatrix}`;
  return {
    type: 'dsal_graph_floydwarshall',
    mathQuery: graphToText(g),
    answer: '',
    graph: toGraphJSON(g),
    prompt: `Führen Sie Floyd-Warshall aus. Wie groß ist die kürzeste Distanz von ${start} nach ${target}? (Die vollständige Matrix finden Sie in der Lösung.)`,
    inputHint: 'Gib die Distanz als ganze Zahl ein (∞ falls unerreichbar).',
    steps: [{ instruction: `Kürzeste Distanz von ${start} nach ${target}`, kind: 'text' as const, answer: String(dist), annotation: `Vollständige Matrix (Zeile/Spalte in Reihenfolge ${g.vertices.join(', ')}): ${matrixText}` }],
    explanation: [
      `Floyd-Warshall ist dynamisch: $d_{ij}^{(k)}$ ist der kürzeste Weg von $i$ nach $j$ nur über Zwischenknoten $1,\\dots,k$.`,
      `Vollständige Distanzmatrix (Zeile/Spalte in Reihenfolge $${g.vertices.join(', ')}$): $$${matrixLatex}$$`,
      `Daraus abgelesen: kürzeste Distanz von $${start}$ nach $${target}$ ist $${dist}$.`,
    ],
  };
}
