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
