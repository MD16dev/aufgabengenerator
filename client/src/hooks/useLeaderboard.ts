import { useState, useCallback } from 'react';
import type { LeaderboardItem, LeaderboardFilterType, EloLeaderboardItem } from '../types';
import { API_BASE } from '../config';

/**
 * Shared module -> task mapping used by the leaderboard "Aufgabe" filter so the
 * task chips can be grouped by module. Keep in sync with ModuleSelector.tsx.
 */
export const LEADERBOARD_MODULE_TASKS: { module: string; tasks: { id: string; label: string }[] }[] = [
  {
    module: 'Lineare Algebra',
    tasks: [
      { id: 'lin_alg_det', label: '2x2 Determinante' },
      { id: 'lin_alg_det3x3', label: '3x3 Determinante (Sarrus)' },
      { id: 'lin_alg_matmul', label: 'Matrizenmultiplikation' },
    ],
  },
  {
    module: 'Betriebssysteme',
    tasks: [
      { id: 'os_bus_anki', label: 'BUS Quizfragen' },
      { id: 'os_page_table', label: 'Adressübersetzung' },
      { id: 'os_scheduling', label: 'Scheduling (FIFO / RR)' },
    ],
  },
  {
    module: 'Formale Systeme',
    tasks: [
      { id: 'formal_dfa_regex', label: 'DFA → Regulärer Ausdruck' },
      { id: 'formal_truth_table', label: 'Wahrheitstabellen' },
    ],
  },
  {
    module: 'Algorithmen & Datenstrukturen',
    tasks: [
      { id: 'algo_avl_rot', label: 'AVL-Baum Rotationen' },
      { id: 'algo_dijkstra', label: 'Dijkstra-Wegfindung' },
    ],
  },
];

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
  const [selectedTaskModuleFilter, setSelectedTaskModuleFilter] = useState<string>('Lineare Algebra');

  const [sideLeaderboard, setSideLeaderboard] = useState<LeaderboardItem[]>([]);
  const [loadingSideLeaderboard, setLoadingSideLeaderboard] = useState<boolean>(false);

  const [eloLeaderboard, setEloLeaderboard] = useState<EloLeaderboardItem[]>([]);
  const [loadingEloLeaderboard, setLoadingEloLeaderboard] = useState<boolean>(false);

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

  const fetchEloLeaderboard = useCallback(async (moduleId?: string) => {
    setLoadingEloLeaderboard(true);
    const token = localStorage.getItem('auth_token');
    const headers: HeadersInit = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    let url = `${API_BASE}/api/tasks/elo-leaderboard`;
    if (moduleId) url += `?module=${encodeURIComponent(moduleId)}`;

    try {
      const response = await fetch(url, { headers });
      if (response.ok) {
        setEloLeaderboard(await response.json());
      }
    } catch (err) {
      console.error('Elo-Bestenliste konnte nicht geladen werden:', err);
    } finally {
      setLoadingEloLeaderboard(false);
    }
  }, []);

  return {
    leaderboard, setLeaderboard, loadingLeaderboard, leaderboardFilter, setLeaderboardFilter,
    selectedModuleFilter, setSelectedModuleFilter, selectedTaskFilter, setSelectedTaskFilter,
    selectedTaskModuleFilter, setSelectedTaskModuleFilter,
    sideLeaderboard, setSideLeaderboard, loadingSideLeaderboard,
    eloLeaderboard, loadingEloLeaderboard, fetchEloLeaderboard,
    fetchLeaderboard, fetchSideLeaderboard,
  };
}
