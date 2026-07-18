import { useState, useCallback } from 'react';
import type { LeaderboardItem, LeaderboardFilterType } from '../types';

const API_BASE = 'http://localhost:5001';

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
      { id: 'calc_gl_n_cardinality', label: 'Kardinalität GL_n(F_p)' },
      { id: 'calc_param_determinant_finite_field', label: 'Determinante mit Parameter (F_p)' },
      { id: 'calc_poly_mapping_matrix', label: 'Darstellungsmatrix (Polynomräume)' },
      { id: 'calc_eigenbasis', label: 'Eigenbasis berechnen' },
      { id: 'calc_linear_code_parameters', label: 'Parameter linearer Codes' },
    ],
  },
  {
    module: 'Betriebssysteme',
    tasks: [
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
      { id: 'dsal_bst_insert', label: 'BST: Wert einfügen' },
      { id: 'dsal_avl_insert', label: 'AVL-Baum: Wert einfügen' },
      { id: 'dsal_rb_insert', label: 'Rot-Schwarz-Baum: Wert einfügen' },
      { id: 'dsal_btree_insert', label: 'B-Baum: Wert einfügen' },
      { id: 'dsal_sort_bubble', label: 'Bubblesort' },
      { id: 'dsal_sort_insertion', label: 'Insertionsort' },
      { id: 'dsal_sort_selection', label: 'Selectionsort' },
      { id: 'dsal_sort_quick', label: 'Quicksort' },
      { id: 'dsal_sort_merge', label: 'Mergesort' },
      { id: 'dsal_sort_heap', label: 'Heapsort' },
      { id: 'dsal_sort_counting', label: 'Countingsort' },
      { id: 'dsal_sort_bucket', label: 'Bucketsort' },
      { id: 'dsal_graph_bfs', label: 'Breitensuche (BFS)' },
      { id: 'dsal_graph_dfs', label: 'Tiefensuche (DFS)' },
      { id: 'dsal_graph_topo', label: 'Topologische Sortierung' },
      { id: 'dsal_graph_dijkstra', label: 'Dijkstra' },
      { id: 'dsal_graph_bellmanford', label: 'Bellman-Ford' },
      { id: 'dsal_graph_prim', label: 'Prim (Minimalbaum)' },
      { id: 'dsal_graph_kruskal', label: 'Kruskal (Minimalbaum)' },
      { id: 'dsal_graph_unionfind', label: 'Union-Find' },
      { id: 'dsal_graph_kosaraju', label: 'Kosaraju-Sharir' },
      { id: 'dsal_graph_floydwarshall', label: 'Floyd-Warshall' },
      { id: 'dsal_hash_div_open', label: 'Hashing: Division + Verkettung' },
      { id: 'dsal_hash_div_linear', label: 'Hashing: Division + lineare Sondierung' },
      { id: 'dsal_hash_div_quadratic', label: 'Hashing: Division + quadratische Sondierung' },
      { id: 'dsal_hash_mul_open', label: 'Hashing: Multiplikation + Verkettung' },
      { id: 'dsal_hash_mul_linear', label: 'Hashing: Multiplikation + lineare Sondierung' },
      { id: 'dsal_hash_mul_quadratic', label: 'Hashing: Multiplikation + quadratische Sondierung' },
      { id: 'dsal_opt_knapsack', label: 'Rucksackproblem (DP)' },
      { id: 'dsal_opt_lcs', label: 'Längste gemeinsame Teilfolge (DP)' },
      { id: 'dsal_opt_simplex', label: 'Simplex-Algorithmus' },
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
    selectedTaskModuleFilter, setSelectedTaskModuleFilter,
    sideLeaderboard, setSideLeaderboard, loadingSideLeaderboard,
    fetchLeaderboard, fetchSideLeaderboard,
  };
}
