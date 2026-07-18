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

      {graph.edges.map((e, idx) => {
        const k = edgeKey(e.from, e.to);
        if (drawn.has(k)) return null;
        drawn.add(k);
        const a = coords[e.from];
        const b = coords[e.to];
        if (!a || !b) return null;
        const hi = isHiEdge(e.from, e.to);
        // shorten the line so it ends at the circle border
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const len = Math.hypot(dx, dy) || 1;
        const r = 18;
        const x1 = a.x + (dx / len) * r;
        const y1 = a.y + (dy / len) * r;
        const x2 = b.x - (dx / len) * r;
        const y2 = b.y - (dy / len) * r;
        const mx = (x1 + x2) / 2;
        const my = (y1 + y2) / 2;
        return (
          <g key={idx}>
            <line
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke={hi ? '#10b981' : '#94a3b8'}
              strokeWidth={hi ? 3 : 2}
              markerEnd={`url(#${hi ? 'graph-arrow-hi' : 'graph-arrow'})`}
            />
            {e.weight !== undefined && (
              <text
                x={mx}
                y={my - 6}
                textAnchor="middle"
                fontSize="13"
                fontWeight="bold"
                fill={hi ? '#10b981' : '#64748b'}
              >
                {e.weight}
              </text>
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
