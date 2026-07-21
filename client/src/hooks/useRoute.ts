import { useCallback, useEffect, useState } from 'react';

export type RouteView = 'home' | 'tasks' | 'leaderboard' | 'profile' | 'admin' | 'duels' | 'exam';

export interface RouteState {
  view: RouteView;
  moduleId: string;
  taskId: string | null;
  duelId: string | null;
  authOpen: boolean;
  feedbackOpen: boolean;
  onboardingOpen: boolean;
  onboardingStep: number;
  // Leaderboard filters
  lbFilter: 'global' | 'module' | 'task' | 'elo';
  lbModule: string;
  lbTask: string;
  lbTaskModule: string;
}

const VALID_VIEWS: RouteView[] = ['home', 'tasks', 'leaderboard', 'profile', 'admin', 'duels', 'exam'];

const DEFAULT_ROUTE: RouteState = {
  view: 'home',
  moduleId: 'lin_alg',
  taskId: null,
  duelId: null,
  authOpen: false,
  feedbackOpen: false,
  onboardingOpen: false,
  onboardingStep: 0,
  lbFilter: 'global',
  lbModule: 'Gesamt',
  lbTask: '',
  lbTaskModule: 'Gesamt',
};

/** Parse the current URL (path + query) into a RouteState. */
export function parseRoute(search: string = window.location.search, pathname: string = window.location.pathname): RouteState {
  const params = new URLSearchParams(search);
  const seg = pathname.replace(/^\/+|\/+$/g, '');
  const view: RouteView = (VALID_VIEWS as string[]).includes(seg) ? (seg as RouteView) : 'home';

  const num = (key: string, fallback: number) => {
    const v = params.get(key);
    const n = v === null ? NaN : parseInt(v, 10);
    return Number.isFinite(n) ? n : fallback;
  };
  const bool = (key: string) => params.get(key) === '1';

  return {
    view,
    moduleId: params.get('module') || DEFAULT_ROUTE.moduleId,
    taskId: params.get('task') || null,
    duelId: params.get('duel') || null,
    authOpen: bool('auth'),
    feedbackOpen: bool('feedback'),
    onboardingOpen: bool('onboarding'),
    onboardingStep: num('step', 0),
    lbFilter: (params.get('lbf') as RouteState['lbFilter']) || DEFAULT_ROUTE.lbFilter,
    lbModule: params.get('lbm') || DEFAULT_ROUTE.lbModule,
    lbTask: params.get('lbt') || DEFAULT_ROUTE.lbTask,
    lbTaskModule: params.get('lbtm') || DEFAULT_ROUTE.lbTaskModule,
  };
}

/** Serialize a RouteState back into a URL (path + query string). */
export function serializeRoute(route: RouteState): string {
  const path = route.view === 'home' ? '/' : `/${route.view}`;
  const params = new URLSearchParams();
  if (route.view === 'tasks') {
    if (route.moduleId !== DEFAULT_ROUTE.moduleId) params.set('module', route.moduleId);
    if (route.taskId) params.set('task', route.taskId);
  }
  if (route.duelId) params.set('duel', route.duelId);
  if (route.authOpen) params.set('auth', '1');
  if (route.feedbackOpen) params.set('feedback', '1');
  if (route.onboardingOpen) {
    params.set('onboarding', '1');
    if (route.onboardingStep > 0) params.set('step', String(route.onboardingStep));
  }
  if (route.view === 'leaderboard') {
    if (route.lbFilter !== DEFAULT_ROUTE.lbFilter) params.set('lbf', route.lbFilter);
    if (route.lbModule !== DEFAULT_ROUTE.lbModule) params.set('lbm', route.lbModule);
    if (route.lbTask) params.set('lbt', route.lbTask);
    if (route.lbTaskModule !== DEFAULT_ROUTE.lbTaskModule) params.set('lbtm', route.lbTaskModule);
  }
  const qs = params.toString();
  return qs ? `${path}?${qs}` : path;
}

/**
 * Framework-free virtual routing hook. Keeps a RouteState in sync with the
 * URL via history.pushState/replaceState and a popstate listener.
 */
export function useRoute(initial?: RouteState) {
  const [route, setRouteState] = useState<RouteState>(() => initial ?? parseRoute());

  // Sync back when the user navigates with browser back/forward.
  useEffect(() => {
    const onPop = () => setRouteState(parseRoute());
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const setRoute = useCallback((partial: Partial<RouteState>, opts?: { replace?: boolean }) => {
    setRouteState((prev) => {
      const next = { ...prev, ...partial };
      const url = serializeRoute(next);
      if (opts?.replace) {
        window.history.replaceState(null, '', url);
      } else {
        window.history.pushState(null, '', url);
      }
      return next;
    });
  }, []);

  return { route, setRoute };
}
