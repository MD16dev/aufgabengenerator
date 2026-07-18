/**
 * Unified task data shape returned by every generator in the registry.
 * The frontend (GenericTaskRunner) only needs these fields and does not
 * care which mathematical domain the task belongs to.
 */
export interface TaskData {
  /** Stable task type id, e.g. "lin_alg_det". Used for scoring/leaderboard. */
  type: string;
  /** The LaTeX expression to render (the "question"). */
  mathQuery: string;
  /** The expected answer as a string. Compared against the normalized user input. */
  answer: string;
  /** Optional step-by-step LaTeX explanation shown when the user reveals the solution. */
  explanation?: string[];
  /** Optional human-readable prompt shown above the math expression. */
  prompt?: string;
  /** Optional input hint, e.g. "Gib das Ergebnis als Dezimalzahl ein." */
  inputHint?: string;

  /**
   * How the question (and choices) should be rendered.
   * - "text" (default): render `mathQuery` with KaTeX and expect a typed string answer.
   * - "tree": render `tree` (and `choices` trees) with the SVG TreeRenderer.
   * Existing generators that omit this field keep behaving exactly as before.
   */
  renderMode?: 'text' | 'tree';
  /**
   * The question tree to render when `renderMode === 'tree'`.
   * For multiple-choice tree tasks this is the initial/starting tree.
   */
  tree?: TreeNodeJSON;
  /**
   * Multiple-choice options. When present, the GenericTaskRunner renders these
   * instead of a free-text input and compares the chosen option id with `answer`.
   */
  choices?: ChoiceOption[];

  /**
   * Stepwise / flashcard mode. When present, the GenericTaskRunner switches to
   * the StepTaskRunner: it shows the initial state and asks the user to produce
   * each intermediate step in order. Each step is checked immediately; only when
   * all steps are correct is the task solved. This mirrors the RWTH DSAL
   * reference generator (e.g. "geben Sie die entstehenden Bäume nach jeder
   * Operation an").
   */
  steps?: TaskStep[];
  /**
   * Optional explicit task description shown to the user BEFORE the solution.
   * For tree tasks this is the list of operations to perform (e.g. "1. 80
   * einfügen, 2. 25 einfügen, …"); for sorting tasks it can be a single
   * sentence like "Sortiere das Array mit Bubblesort". When absent, the
   * StepTaskRunner falls back to deriving the list from `steps`.
   */
  taskList?: string[];
  /**
   * Optional visual graph (vertices + edges) shown for graph-algorithm tasks.
   * Rendered by the SVG GraphRenderer on the frontend.
   */
  graph?: GraphJSON;
}

/**
 * A single step in a stepwise task. The `kind` tells the frontend how to
 * render the expected answer and what the user must enter:
 *  - "tree":   user must reproduce the tree after this step (compared as a tree).
 *  - "array":  user must type the array after this step (e.g. sorting).
 *  - "text":   user must type a free-text answer (e.g. visit order, distance).
 *  - "matrix": user must type a matrix (e.g. Floyd-Warshall distance matrix),
 *              rendered as a KaTeX pmatrix.
 *  - "graph":  (reserved) user reproduces a graph state.
 */
export interface TaskStep {
  /** Short instruction shown above the input, e.g. "80 einfügen". */
  instruction: string;
  kind: 'tree' | 'array' | 'text' | 'matrix' | 'graph';
  /** Expected tree for kind === "tree". */
  tree?: TreeNodeJSON;
  /** Expected array for kind === "array" (canonical [a, b, c]). */
  array?: number[];
  /** Expected matrix for kind === "matrix" (rows of numbers; Infinity -> ∞). */
  matrix?: number[][];
  /** Expected text answer for kind === "text" (normalized before compare). */
  answer?: string;
  /** Optional annotation shown in the solution, e.g. "rotiere 27 nach rechts". */
  annotation?: string;
}

/** A simple undirected/directed graph for JSON serialization + rendering. */
export interface GraphJSON {
  directed: boolean;
  /** Vertex labels, e.g. ["a","b","c"]. */
  vertices: string[];
  /** Edges with optional weight. */
  edges: { from: string; to: string; weight?: number }[];
  /**
   * Optional precomputed layout (normalized 0..1 coordinates) so the renderer
   * does not have to run a force layout. If absent, the renderer falls back to
   * a circular layout.
   */
  layout?: { vertex: string; x: number; y: number }[];
}

/**
 * A flexible tree node for JSON serialization. Supports binary trees
 * (left/right), red-black color, AVL height, and B-tree nodes (multiple keys
 * + ordered children). `null` children are explicit so the renderer can draw
 * empty child slots consistently.
 */
export interface TreeNodeJSON {
  /** Single key (binary trees, AVL, red-black). */
  value?: number;
  /** Multiple ordered keys (B-tree nodes). */
  values?: number[];
  /** Red-black node color. */
  color?: 'red' | 'black';
  /** AVL node height (optional, for display). */
  height?: number;
  /** Left child of a binary tree. */
  left?: TreeNodeJSON | null;
  /** Right child of a binary tree. */
  right?: TreeNodeJSON | null;
  /** Ordered children of a B-tree node (length = values.length + 1). */
  children?: (TreeNodeJSON | null)[];
}

/** A single multiple-choice option. Exactly one of `tree`/`latex` is used. */
export interface ChoiceOption {
  /** Stable id of the option; the correct one must equal `TaskData.answer`. */
  id: string;
  /** Tree to render for this option (tree tasks). */
  tree?: TreeNodeJSON;
  /** Optional caption shown under the option (e.g. a label). */
  caption?: string;
}
