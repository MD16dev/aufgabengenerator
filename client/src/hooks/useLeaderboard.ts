import { useState, useCallback } from 'react';
import type { LeaderboardItem, LeaderboardFilterType } from '../types';

const API_BASE = 'http://localhost:5000';

/**
 * Fetches the global leaderboard (with optional module/task filters) and the
 * contextual side leaderboard used in the split-screen tasks view.
 */
export function useLeaderboard() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardItem[]>([]);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState<boolean>(false);
  const [leaderboardFilter, setLeaderboardFilter] = useState<LeaderboardFilterType>('global');
  const [selectedModuleFilter, setSelectedModuleFilter] = useState<string>('Lineare Algebra');
  const [selectedTaskFilter, setSelectedTaskFilter] = useState<string>('lin_alg_det');

  const [sideLeaderboard, setSideLeaderboard] = useState<LeaderboardItem[]>([]);
  const [loadingSideLeaderboard, setLoadingSideLeaderboard] = useState<boolean>(false);

  const buildUrl = (filter: LeaderboardFilterType, module: string, task: string) => {
    let url = `${API_BASE}/api/tasks/leaderboard`;
    if (filter === 'module') {
      url += `?module=${encodeURIComponent(module)}`;
    } else if (filter === 'task') {
      url += `?taskId=${encodeURIComponent(task)}`;
    }
    return url;
  };

  const fetchLeaderboard = useCallback(async () => {
    setLoadingLeaderboard(true);
    const token = localStorage.getItem('auth_token');
    const headers: HeadersInit = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    try {
      const response = await fetch(
        buildUrl(leaderboardFilter, selectedModuleFilter, selectedTaskFilter),
        { headers }
      );
      if (response.ok) {
        setLeaderboard(await response.json());
      }
    } catch (err) {
      console.error('Bestenliste konnte nicht geladen werden:', err);
    } finally {
      setLoadingLeaderboard(false);
    }
  }, [leaderboardFilter, selectedModuleFilter, selectedTaskFilter]);

  const fetchSideLeaderboard = useCallback(async (filterType: 'module' | 'task', filterValue: string) => {
    setLoadingSideLeaderboard(true);
    const token = localStorage.getItem('auth_token');
    const headers: HeadersInit = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    let url = `${API_BASE}/api/tasks/leaderboard`;
    if (filterType === 'module') {
      url += `?module=${encodeURIComponent(filterValue)}`;
    } else if (filterType === 'task') {
      url += `?taskId=${encodeURIComponent(filterValue)}`;
    }

    try {
      const response = await fetch(url, { headers });
      if (response.ok) {
        setSideLeaderboard(await response.json());
      }
    } catch (err) {
      console.error('Side leaderboard failed to fetch:', err);
    } finally {
      setLoadingSideLeaderboard(false);
    }
  }, []);

  return {
    leaderboard, setLeaderboard, loadingLeaderboard, leaderboardFilter, setLeaderboardFilter,
    selectedModuleFilter, setSelectedModuleFilter, selectedTaskFilter, setSelectedTaskFilter,
    sideLeaderboard, setSideLeaderboard, loadingSideLeaderboard,
    fetchLeaderboard, fetchSideLeaderboard,
  };
}
