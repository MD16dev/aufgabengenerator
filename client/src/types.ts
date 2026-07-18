export interface UserProfile {
  id: string;
  username: string;
  displayName: string;
  profilePic?: string;
  isAdmin?: boolean;
  createdAt: string;
  solvedCount: number;
}

export interface LeaderboardItem {
  username: string;
  displayName: string;
  profilePic?: string;
  solvedCount: number;
  revealedCount?: number;
  module: string;
  isUser: boolean;
}

export type LeaderboardFilterType = 'global' | 'module' | 'task';

/**
 * Flexible tree node for JSON serialization (mirrors server/src/services/math/types.ts).
 * Supports binary trees (left/right), red-black color, AVL height, and B-tree
 * nodes (multiple keys + ordered children). `null` children are explicit.
 */
export interface TreeNodeJSON {
  value?: number;
  values?: number[];
  color?: 'red' | 'black';
  height?: number;
  left?: TreeNodeJSON | null;
  right?: TreeNodeJSON | null;
  children?: (TreeNodeJSON | null)[];
}

export interface ChoiceOption {
  id: string;
  tree?: TreeNodeJSON;
  caption?: string;
}

export interface TaskStep {
  instruction: string;
  kind: 'tree' | 'array' | 'text' | 'graph';
  tree?: TreeNodeJSON;
  array?: number[];
  answer?: string;
  annotation?: string;
}

export interface GraphJSON {
  directed: boolean;
  vertices: string[];
  edges: { from: string; to: string; weight?: number }[];
  layout?: { vertex: string; x: number; y: number }[];
}

/**
 * Unified task data shape returned by the backend (mirrors
 * server/src/services/math/types.ts). The frontend only needs these fields.
 */
export interface TaskData {
  type: string;
  mathQuery: string;
  answer: string;
  explanation?: string[];
  prompt?: string;
  inputHint?: string;
  renderMode?: 'text' | 'tree';
  tree?: TreeNodeJSON;
  choices?: ChoiceOption[];
  steps?: TaskStep[];
  graph?: GraphJSON;
  /** Optional explicit task description shown before the solution. */
  taskList?: string[];
}
