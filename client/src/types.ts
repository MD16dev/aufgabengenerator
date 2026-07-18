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
