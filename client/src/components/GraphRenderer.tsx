import React from 'react';
import type { GraphJSON } from '../types';

interface GraphRendererProps {
  graph: GraphJSON;
  width?: number;
  height?: number;
  className?: string;
  /** Optional set of highlighted edges (e.g. the current path / MST edges). */
  highlightEdges?: { from: string; to: string }[];
  /** Optional set of highlighted vertices (e.g. visited). */
  highlightVertices?: string[];
}

/**
 * Renders a (directed) graph as SVG, mimicking the TikZ look of the official
 * exercisegenerator. Vertices are circles with letter labels; edges are lines
 * (with arrowheads for directed graphs) and optional weight labels.
 *
 * Layout: if `graph.layout` is provided (normalized 0..1 coords) it is used;
 * otherwise vertices are placed on a circle. This keeps rendering deterministic
 * and avoids a force-layout dependency.
 */
export const GraphRenderer: React.FC<GraphRendererProps> = ({
  graph,
  width = 520,
  height = 420,
  className,
  highlightEdges = [],
  highlightVertices = [],
}) => {
  const pad = 40;
  const coords: Record<string, { x: number; y: number }> = {};

  if (graph.layout && graph.layout.length === graph.vertices.length) {
    for (const p of graph.layout) {
      coords[p.vertex] = { x: pad + p.x * (width - 2 * pad), y: pad + p.y * (height - 2 * pad) };
    }
  } else {
    const n = graph.vertices.length;
    graph.vertices.forEach((v, i) => {
      const angle = (2 * Math.PI * i) / Math.max(1, n) - Math.PI / 2;
      coords[v] = {
        x: width / 2 + (width / 2 - pad) * Math.cos(angle),
        y: height / 2 + (height / 2 - pad) * Math.sin(angle),
      };
    });
  }

  const isHiEdge = (a: string, b: string) =>
    highlightEdges.some(
      (e) =>
        (e.from === a && e.to === b) || (!graph.directed && e.from === b && e.to === a),
    );
  const isHiVert = (v: string) => highlightVertices.includes(v);

  const edgeKey = (a: string, b: string) => (graph.directed ? `${a}->${b}` : [a, b].sort().join('-'));
  const drawn = new Set<string>();

  // Detect bidirectional pairs (a->b AND b->a) so we can curve them apart
  // instead of drawing two identical straight lines on top of each other.
  const hasReverse = (a: string, b: string) =>
    graph.edges.some((e) => e.from === b && e.to === a);

  // --- Pre-compute every edge's geometry + a raw label position. ---
  // Two different edges can share the same midpoint (e.g. a->c and c->a, or two
  // edges that cross at the centre). A naive perpendicular offset would then
  // place both weight labels on the exact same spot. We therefore collect all
  // raw label positions first and run a small collision-resolution pass that
  // pushes overlapping labels apart along their perpendicular direction.
  interface EdgeGeom {
    e: { from: string; to: string; weight?: number };
    idx: number;
    a: { x: number; y: number };
    b: { x: number; y: number };
    x1: number; y1: number; x2: number; y2: number;
    hi: boolean;
    bidirectional: boolean;
    bowSide: number;
    bow: number;
    mx: number; my: number;
    px: number; py: number;
    lx: number; ly: number;
  }
  const geoms: EdgeGeom[] = [];
  graph.edges.forEach((e, idx) => {
    const k = edgeKey(e.from, e.to);
    if (drawn.has(k)) return;
    drawn.add(k);
    const a = coords[e.from];
    const b = coords[e.to];
    if (!a || !b) return;
    const hi = isHiEdge(e.from, e.to);
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const len = Math.hypot(dx, dy) || 1;
    const r = 18;
    const x1 = a.x + (dx / len) * r;
    const y1 = a.y + (dy / len) * r;
    const x2 = b.x - (dx / len) * r;
    const y2 = b.y - (dy / len) * r;
    const bidirectional = graph.directed && hasReverse(e.from, e.to);
    const bowSide = bidirectional && edgeKey(e.from, e.to) < edgeKey(e.to, e.from) ? 1 : -1;
    const bow = bidirectional ? 26 : 0;
    const px = -dy / len;
    const py = dx / len;
    const mx = (x1 + x2) / 2 + px * bow * bowSide;
    const my = (y1 + y2) / 2 + py * bow * bowSide;
    const lx = mx + px * (bow === 0 ? 12 : 6) * bowSide;
    const ly = my + py * (bow === 0 ? 12 : 6) * bowSide - 2;
    geoms.push({ e, idx, a, b, x1, y1, x2, y2, hi, bidirectional, bowSide, bow, mx, my, px, py, lx, ly });
  });

  // Detect straight edges that lie on the same line and overlap (e.g. two
  // different vertex pairs that happen to be collinear in the layout, or a
  // bidirectional pair in an undirected graph). Drawing them as straight lines
  // puts them exactly on top of each other, so we bow one of them apart.
  const distPointToSeg = (px: number, py: number, ax: number, ay: number, bx: number, by: number) => {
    const dx = bx - ax, dy = by - ay;
    const l2 = dx * dx + dy * dy;
    if (l2 === 0) return Math.hypot(px - ax, py - ay);
    let t = ((px - ax) * dx + (py - ay) * dy) / l2;
    t = Math.max(0, Math.min(1, t));
    return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
  };
  // Assign a bow to collinear-overlapping straight edges. We process pairs and
  // give each edge in the cluster an alternating bow direction/magnitude.
  const collinearGroups: EdgeGeom[][] = [];
  for (let i = 0; i < geoms.length; i++) {
    for (let j = i + 1; j < geoms.length; j++) {
      const g1 = geoms[i];
      const g2 = geoms[j];
      if (g1.bow > 0 || g2.bow > 0) continue; // already bowed (bidir)
      const ma = { x: (g1.x1 + g1.x2) / 2, y: (g1.y1 + g1.y2) / 2 };
      const mb = { x: (g2.x1 + g2.x2) / 2, y: (g2.y1 + g2.y2) / 2 };
      const d1 = distPointToSeg(ma.x, ma.y, g2.x1, g2.y1, g2.x2, g2.y2);
      const d2 = distPointToSeg(mb.x, mb.y, g1.x1, g1.y1, g1.x2, g1.y2);
      if (d1 < 6 && d2 < 6) {
        // These two overlap on the same line. Put them in a group.
        let grp = collinearGroups.find((g) => g.includes(g1) || g.includes(g2));
        if (!grp) { grp = []; collinearGroups.push(grp); }
        if (!grp.includes(g1)) grp.push(g1);
        if (!grp.includes(g2)) grp.push(g2);
      }
    }
  }
  // Bow each group's edges apart with alternating sides and increasing magnitude.
  collinearGroups.forEach((grp) => {
    grp.forEach((g, k) => {
      g.bow = 22 + k * 10;
      g.bowSide = k % 2 === 0 ? 1 : -1;
      g.mx = (g.x1 + g.x2) / 2 + g.px * g.bow * g.bowSide;
      g.my = (g.y1 + g.y2) / 2 + g.py * g.bow * g.bowSide;
      g.lx = g.mx + g.px * 6 * g.bowSide;
      g.ly = g.my + g.py * 6 * g.bowSide - 2;
    });
  });

  // Collision resolution: nudge labels apart and away from vertices so every
  // weight number is clearly readable and unambiguously belongs to its edge.
  const MIN_DIST = 28; // comfortable gap between two weight labels
  const VERTEX_R = 18; // vertex circle radius
  const MARGIN = 14; // keep labels inside the canvas
  const vertexPts = graph.vertices.map((v) => coords[v]).filter(Boolean);
  for (let iter = 0; iter < 60; iter++) {
    let moved = false;
    // 1) Separate overlapping weight labels.
    for (let i = 0; i < geoms.length; i++) {
      for (let j = i + 1; j < geoms.length; j++) {
        const g1 = geoms[i];
        const g2 = geoms[j];
        if (g1.e.weight === undefined || g2.e.weight === undefined) continue;
        const ddx = g2.lx - g1.lx;
        const ddy = g2.ly - g1.ly;
        const d = Math.hypot(ddx, ddy);
        if (d < MIN_DIST && d > 0.001) {
          const ux = ddx / d;
          const uy = ddy / d;
          const push = (MIN_DIST - d) / 2 + 0.5;
          g1.lx -= ux * push; g1.ly -= uy * push;
          g2.lx += ux * push; g2.ly += uy * push;
          moved = true;
        } else if (d <= 0.001) {
          g2.lx += g2.px * MIN_DIST * g2.bowSide;
          g2.ly += g2.py * MIN_DIST * g2.bowSide;
          moved = true;
        }
      }
    }
    // 2) Push labels out of any vertex circle (so a number is never hidden
    //    behind a node, and it's clear which edge it belongs to).
    for (const g of geoms) {
      if (g.e.weight === undefined) continue;
      for (const v of vertexPts) {
        const ddx = g.lx - v.x;
        const ddy = g.ly - v.y;
        const d = Math.hypot(ddx, ddy);
        const minD = VERTEX_R + 8;
        if (d < minD) {
          if (d < 0.001) {
            g.lx += g.px * minD * g.bowSide;
            g.ly += g.py * minD * g.bowSide;
          } else {
            const push = minD - d + 0.5;
            g.lx += (ddx / d) * push;
            g.ly += (ddy / d) * push;
          }
          moved = true;
        }
      }
    }
    // 3) Keep labels inside the canvas.
    for (const g of geoms) {
      if (g.e.weight === undefined) continue;
      const nx = Math.max(MARGIN, Math.min(width - MARGIN, g.lx));
      const ny = Math.max(MARGIN, Math.min(height - MARGIN, g.ly));
      if (nx !== g.lx || ny !== g.ly) { g.lx = nx; g.ly = ny; moved = true; }
    }
    if (!moved) break;
  }

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width="100%"
      className={className}
      style={{ maxWidth: width }}
      role="img"
      aria-label="Graph"
    >
      <defs>
        <marker
          id="graph-arrow"
          viewBox="0 0 10 10"
          refX="9"
          refY="5"
          markerWidth="7"
          markerHeight="7"
          orient="auto-start-reverse"
        >
          <path d="M 0 0 L 10 5 L 0 10 z" fill="#a855f7" />
        </marker>
        <marker
          id="graph-arrow-hi"
          viewBox="0 0 10 10"
          refX="9"
          refY="5"
          markerWidth="7"
          markerHeight="7"
          orient="auto-start-reverse"
        >
          <path d="M 0 0 L 10 5 L 0 10 z" fill="#10b981" />
        </marker>
      </defs>

      {geoms.map((g) => {
        const { e, idx, a, x1, y1, x2, y2, hi, bow, mx, my, lx, ly } = g;
        const stroke = hi ? '#10b981' : '#94a3b8';
        const strokeW = hi ? 3 : 2;
        const arrow = hi ? 'graph-arrow-hi' : 'graph-arrow';

        // Self-loop: draw a small loop above the vertex.
        if (e.from === e.to) {
          const c = a;
          const loopR = 14;
          const cx = c.x;
          const cy = c.y - 18 - loopR;
          return (
            <g key={idx}>
              <path
                d={`M ${cx - loopR} ${c.y - 18} A ${loopR} ${loopR} 0 1 1 ${cx + loopR} ${c.y - 18}`}
                fill="none"
                stroke={stroke}
                strokeWidth={strokeW}
                markerEnd={graph.directed ? `url(#${arrow})` : undefined}
              />
              {e.weight !== undefined && (
                <text
                  x={cx}
                  y={cy - loopR - 4}
                  textAnchor="middle"
                  fontSize="13"
                  fontWeight="bold"
                  fill={hi ? '#10b981' : '#64748b'}
                  stroke="#ffffff"
                  strokeWidth="3"
                  paintOrder="stroke"
                >
                  {e.weight}
                </text>
              )}
            </g>
          );
        }

        return (
          <g key={idx}>
            {bow === 0 ? (
              <line
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke={stroke}
                strokeWidth={strokeW}
                markerEnd={graph.directed ? `url(#${arrow})` : undefined}
              />
            ) : (
              <path
                d={`M ${x1} ${y1} Q ${mx} ${my} ${x2} ${y2}`}
                fill="none"
                stroke={stroke}
                strokeWidth={strokeW}
                markerEnd={graph.directed ? `url(#${arrow})` : undefined}
              />
            )}
            {e.weight !== undefined && (
              <>
                <text
                  x={lx}
                  y={ly}
                  textAnchor="middle"
                  fontSize="13"
                  fontWeight="bold"
                  fill={hi ? '#10b981' : '#64748b'}
                  stroke="#ffffff"
                  strokeWidth="3.5"
                  paintOrder="stroke"
                >
                  {e.weight}
                </text>
                <text
                  x={lx}
                  y={ly}
                  textAnchor="middle"
                  fontSize="13"
                  fontWeight="bold"
                  fill={hi ? '#10b981' : '#64748b'}
                >
                  {e.weight}
                </text>
              </>
            )}
          </g>
        );
      })}

      {graph.vertices.map((v) => {
        const c = coords[v];
        if (!c) return null;
        const hi = isHiVert(v);
        return (
          <g key={v}>
            <circle
              cx={c.x}
              cy={c.y}
              r={18}
              fill={hi ? '#10b981' : '#ffffff'}
              stroke={hi ? '#059669' : '#7c3aed'}
              strokeWidth={2.5}
            />
            <text
              x={c.x}
              y={c.y + 5}
              textAnchor="middle"
              fontSize="15"
              fontWeight="bold"
              fill={hi ? '#ffffff' : '#1e293b'}
            >
              {v}
            </text>
          </g>
        );
      })}
    </svg>
  );
};

export default GraphRenderer;
