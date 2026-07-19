export interface UserProfile {
  id: string;
  username: string;
  displayName: string;
  profilePic?: string;
  createdAt: string;
  solvedCount: number;
  elo: number;
  eloLinAlg: number;
  eloOs: number;
  eloFormalSys: number;
  eloAlgoStruct: number;
  duelWins: number;
  duelLosses: number;
}

export interface LeaderboardItem {
  username: string;
  displayName: string;
  profilePic?: string;
  solvedCount: number;
  module: string;
  isUser: boolean;
}

export interface EloLeaderboardItem {
  username: string;
  displayName: string;
  profilePic?: string;
  elo: number;
  eloLinAlg: number;
  eloOs: number;
  eloFormalSys: number;
  eloAlgoStruct: number;
  duelWins: number;
  duelLosses: number;
  isUser: boolean;
}

export type LeaderboardFilterType = 'global' | 'module' | 'task' | 'elo';
