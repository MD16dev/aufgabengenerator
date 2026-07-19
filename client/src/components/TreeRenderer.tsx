import React from 'react';
import type { TreeNodeJSON } from '../types';

interface TreeRendererProps {
  tree: TreeNodeJSON | null;
  /** Pixel width of the SVG viewport. Height is computed from depth. */
  width?: number;
  className?: string;
}

/**
 * Renders a tree (binary / AVL / red-black / B-tree) as SVG, mimicking the
 * TikZ look of the official exercisegenerator. KaTeX cannot draw TikZ trees,
 * so this component is the frontend equivalent for tree-shaped tasks.
 *
 * Binary trees use left/right; B-tree nodes use `values` + `children`.
 */
export const TreeRenderer: React.FC<TreeRendererProps> = ({
  tree,
  width = 520,
  className,
}) => {
  if (!tree) {
    return (
      <div className={`flex items-center justify-center text-theme-muted italic ${className ?? ''}`}>
        (leerer Baum)
      </div>
    );
  }

  // B-tree node: has multiple keys and ordered children.
  const isBTree = Array.isArray(tree.values) && tree.values.length > 0;

  if (isBTree) {
    return <BTreeSVG tree={tree} width={width} className={className} />;
  }
  return <BinaryTreeSVG tree={tree} width={width} className={className} />;
};

/* ----------------------------- Binary trees ----------------------------- */

const NODE_R = 18;
const H_GAP = 46; // horizontal gap between in-order slots
const V_GAP = 70; // vertical gap between levels

interface Pos {
  x: number;
  y: number;
}

function layoutBinary(
  node: TreeNodeJSON | null,
  depth: number,
  counter: { x: number },
  pos: Map<TreeNodeJSON, Pos>,
): void {
  if (!node) return;
  layoutBinary(node.left ?? null, depth + 1, counter, pos);
  const x = counter.x * H_GAP;
  counter.x += 1;
  pos.set(node, { x, y: depth * V_GAP });
  layoutBinary(node.right ?? null, depth + 1, counter, pos);
}

const BinaryTreeSVG: React.FC<{ tree: TreeNodeJSON; width: number; className?: string }> = ({
  tree,
  width,
  className,
}) => {
  const pos = new Map<TreeNodeJSON, Pos>();
  const counter = { x: 0 };
  layoutBinary(tree, 0, counter, pos);

  let maxX = 0;
  let maxDepth = 0;
  pos.forEach((p) => {
    maxX = Math.max(maxX, p.x);
    maxDepth = Math.max(maxDepth, p.y);
  });

  const padX = NODE_R + 10;
  const contentW = maxX + padX * 2;
  const svgW = Math.max(width, contentW);
  const offsetX = (svgW - maxX) / 2;
  const svgH = maxDepth + V_GAP + padX;

  const edges: React.ReactNode[] = [];
  const nodes: React.ReactNode[] = [];

  const drawNode = (n: TreeNodeJSON | null, parentPos: Pos | null) => {
    if (!n) return;
    const p = pos.get(n)!;
    const cx = p.x + offsetX;
    const cy = p.y + padX;
    if (parentPos) {
      edges.push(
        <line
          key={`e-${cx}-${cy}`}
          x1={parentPos.x}
          y1={parentPos.y}
          x2={cx}
          y2={cy}
          stroke="currentColor"
          strokeWidth={1.5}
          className="text-theme-border"
        />,
      );
    }
    const isRed = n.color === 'red';
    nodes.push(
      <g key={`n-${cx}-${cy}`}>
        <circle
          cx={cx}
          cy={cy}
          r={NODE_R}
          fill={isRed ? '#ef4444' : '#1f2937'}
          stroke={isRed ? '#b91c1c' : '#111827'}
          strokeWidth={1.5}
        />
        <text
          x={cx}
          y={cy}
          textAnchor="middle"
          dominantBaseline="central"
          fontSize={14}
          fontWeight={700}
          fill="#ffffff"
        >
          {n.value}
        </text>
        {n.height !== undefined && (
          <text x={cx} y={cy + NODE_R + 10} textAnchor="middle" fontSize={10} fill="currentColor" className="text-theme-muted">
            h={n.height}
          </text>
        )}
      </g>,
    );
    drawNode(n.left ?? null, { x: cx, y: cy });
    drawNode(n.right ?? null, { x: cx, y: cy });
  };

  drawNode(tree, null);

  return (
    <svg
      viewBox={`0 0 ${svgW} ${svgH}`}
      width="100%"
      className={`text-theme-primary ${className ?? ''}`}
      role="img"
      aria-label="Baum-Darstellung"
    >
      {edges}
      {nodes}
    </svg>
  );
};

/* ------------------------------- B-trees -------------------------------- */

const BT_NODE_H = 34;
const BT_KEY_W = 30;
const BT_V_GAP = 64;

interface BPos {
  x: number;
  y: number;
  w: number;
}

function bNodeWidth(node: TreeNodeJSON): number {
  const keys = node.values?.length ?? 1;
  return keys * BT_KEY_W + 12;
}

function layoutBTree(
  node: TreeNodeJSON | null,
  depth: number,
  pos: Map<TreeNodeJSON, BPos>,
  cursor: { x: number } = { x: 0 },
): number {
  if (!node) return 0;
  const children = node.children ?? [];
  if (children.length === 0) {
    const w = bNodeWidth(node);
    pos.set(node, { x: cursor.x, y: depth * BT_V_GAP, w });
    cursor.x += w + 16;
    return w + 16;
  }
  const startX = cursor.x;
  let total = 0;
  for (const c of children) {
    total += layoutBTree(c, depth + 1, pos, cursor);
  }
  const w = bNodeWidth(node);
  // Center the parent above the span of its children.
  const x = startX + total / 2 - w / 2;
  pos.set(node, { x, y: depth * BT_V_GAP, w });
  return Math.max(total, w + 16);
}

const BTreeSVG: React.FC<{ tree: TreeNodeJSON; width: number; className?: string }> = ({
  tree,
  width,
  className,
}) => {
  const pos = new Map<TreeNodeJSON, BPos>();
  const totalW = layoutBTree(tree, 0, pos);
  const svgW = Math.max(width, totalW + 20);
  const maxDepth = Math.max(...Array.from(pos.values()).map((p) => p.y));
  const svgH = maxDepth + BT_NODE_H + 30;
  const offsetX = (svgW - totalW) / 2 + 10;

  const edges: React.ReactNode[] = [];
  const nodes: React.ReactNode[] = [];

  const draw = (n: TreeNodeJSON | null) => {
    if (!n) return;
    const p = pos.get(n)!;
    const x = p.x + offsetX;
    const y = p.y + 15;
    const keys = n.values ?? [];
    // edges to children
    const children = n.children ?? [];
    children.forEach((c, i) => {
      if (!c) return;
      const cp = pos.get(c)!;
      const childX = cp.x + offsetX + cp.w / 2;
      const childY = cp.y + 15;
      const slotX = x + ((i + 0.5) / children.length) * p.w;
      edges.push(
        <line key={`be-${x}-${i}`} x1={slotX} y1={y + BT_NODE_H} x2={childX} y2={childY} stroke="currentColor" strokeWidth={1.5} className="text-theme-border" />,
      );
      draw(c);
    });
    // node box with keys
    nodes.push(
      <g key={`bn-${x}-${y}`}>
        <rect x={x} y={y} width={p.w} height={BT_NODE_H} rx={4} fill="#1f2937" stroke="#111827" strokeWidth={1.5} />
        {keys.map((k, i) => {
          const kx = x + 6 + i * BT_KEY_W + BT_KEY_W / 2;
          if (i > 0) {
            edges.push(<line key={`div-${x}-${i}`} x1={x + 6 + i * BT_KEY_W} y1={y} x2={x + 6 + i * BT_KEY_W} y2={y + BT_NODE_H} stroke="#374151" strokeWidth={1} />);
          }
          return (
            <text key={`bk-${x}-${i}`} x={kx} y={y + BT_NODE_H / 2} textAnchor="middle" dominantBaseline="central" fontSize={13} fontWeight={700} fill="#ffffff">
              {k}
            </text>
          );
        })}
      </g>,
    );
  };

  draw(tree);

  return (
    <svg viewBox={`0 0 ${svgW} ${svgH}`} width="100%" className={`text-theme-primary ${className ?? ''}`} role="img" aria-label="B-Baum-Darstellung">
      {edges}
      {nodes}
    </svg>
  );
};

export default TreeRenderer;
