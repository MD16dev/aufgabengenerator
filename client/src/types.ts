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
