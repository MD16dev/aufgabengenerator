import React, { useState, useEffect, useRef, useCallback } from 'react';
import { FileText, Clock, Play, ArrowRight, ArrowLeft, CheckCircle2, XCircle, RotateCcw, Trophy, Lock, List, Square } from 'lucide-react';
import { API_BASE } from '../config';
import type { UserProfile, TaskData } from '../types';
import { GenericTaskRunner } from './GenericTaskRunner';
import { StepTaskRunner } from './StepTaskRunner';
import { ExamLeaderboardPage } from './ExamLeaderboardPage';

interface ExamPlanItem {
  taskTypeId: string;
  category: string;
  workloadMin: number;
  autoGraded: boolean;
  maxPoints: number;
}

interface ExamSubmissionResult {
  scorePct: number;
  grade: number;
  passed: boolean;
  attemptId: string;
  tasks?: { taskTypeId: string; userPoints: number; maxPoints: number }[];
}

type ExamTaskResult = {
  userPoints: number;
  maxPoints: number;
  answer?: string;
};

function getExamTaskKey(index: number, taskTypeId: string): string {
  return `${index}-${taskTypeId}`;
}

interface ExamPageProps {
  user: UserProfile | null;
  onOpenAuth: () => void;
}

type ExamView = 'lobby' | 'runner' | 'review' | 'result' | 'leaderboard';

const EXAM_MODULES: { id: string; label: string; enabled: boolean }[] = [
  { id: 'lin_alg', label: 'Lineare Algebra', enabled: true },
  { id: 'algo_struct', label: 'Algorithmen & Datenstrukturen', enabled: true },
  { id: 'os', label: 'Betriebssysteme (BUS)', enabled: false },
  { id: 'formal_sys', label: 'Formale Systeme (FOSAP)', enabled: false },
];

const DURATIONS = [20, 30, 45, 60, 90, 120, 180];

function gradeToLabel(grade: number): string {
  if (grade < 1.3) return '1.0 — sehr gut';
  if (grade < 1.7) return '1.3 — sehr gut';
  if (grade < 2.0) return '1.7 — gut (+)';
  if (grade < 2.3) return '2.0 — gut';
  if (grade < 2.7) return '2.3 — gut (-)';
  if (grade < 3.0) return '2.7 — befriedigend (+)';
  if (grade < 3.3) return '3.0 — befriedigend';
  if (grade < 3.7) return '3.3 — befriedigend (-)';
  if (grade < 4.0) return '3.7 — ausreichend (+)';
  if (grade < 5.0) return '4.0 — ausreichend';
  return '5.0 — nicht bestanden';
}

export const ExamPage: React.FC<ExamPageProps> = ({ user, onOpenAuth }) => {
  const [view, setView] = useState<ExamView>('lobby');
  const [plan, setPlan] = useState<ExamPlanItem[] | null>(null);
  const [moduleId, setModuleId] = useState<string>('lin_alg');
  const [durationMin, setDurationMin] = useState<number>(90);
  const [result, setResult] = useState<ExamSubmissionResult | null>(null);
  // Shared across the exam (runner) and review phases so that auto-graded
  // points recorded during the exam are not lost when switching to review.
  const [results, setResults] = useState<Record<string, ExamTaskResult>>({});

  const recordResult = useCallback(
    (itemKey: string, userPoints: number, maxPoints: number, answer?: string) => {
      setResults((prev) => ({ ...prev, [itemKey]: { userPoints, maxPoints, answer } }));
    },
    []
  );

  if (!user) {
    return (
      <div className="w-full max-w-2xl mx-auto px-4 py-16 text-center animate-fadeIn">
        <div className="glass-panel rounded-3xl p-8 md:p-12 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
          <FileText className="w-14 h-14 text-purple-500 mx-auto mb-5" />
          <h2 className="text-2xl font-bold font-display text-theme-primary mb-3">Prüfungsmodus</h2>
          <p className="text-theme-muted mb-6">
            Für den Prüfungsmodus wird ein Konto benötigt, damit deine Ergebnisse
            gespeichert und in der Bestenliste geführt werden können.
          </p>
          <button
            onClick={onOpenAuth}
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold rounded-xl transition-all shadow-lg hover:shadow-purple-500/25 cursor-pointer"
          >
            Jetzt anmelden
          </button>
        </div>
      </div>
    );
  }

  const startExam = (generatedPlan: ExamPlanItem[], mod: string, dur: number) => {
    setPlan(generatedPlan);
    setModuleId(mod);
    setDurationMin(dur);
    setResult(null);
    setResults({});
    taskCache.clear();
    setView('runner');
  };

  const finishExam = (res: ExamSubmissionResult) => {
    setResult(res);
    setView('result');
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-8 animate-fadeIn">
      {view === 'lobby' && (
        <ExamLobby user={user} onStart={startExam} onShowLeaderboard={() => setView('leaderboard')} />
      )}
      {view === 'runner' && plan && (
        <ExamRunner
          user={user}
          plan={plan}
          moduleId={moduleId}
          durationMin={durationMin}
          results={results}
          onRecord={recordResult}
          onReview={() => setView('review')}
        />
      )}
      {view === 'review' && plan && (
        <ExamReview
          user={user}
          plan={plan}
          moduleId={moduleId}
          durationMin={durationMin}
          results={results}
          onRecord={recordResult}
          onFinish={finishExam}
          onCancel={() => setView('lobby')}
        />
      )}
      {view === 'result' && result && plan && (
        <ExamResult result={result} plan={plan} user={user} onBack={() => setView('lobby')} onLeaderboard={() => setView('leaderboard')} />
      )}
      {view === 'leaderboard' && (
        <ExamLeaderboardPage onBack={() => setView('lobby')} />
      )}
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Lobby                                                               */
/* ------------------------------------------------------------------ */

interface ExamLobbyProps {
  user: UserProfile;
  onStart: (plan: ExamPlanItem[], moduleId: string, durationMin: number) => void;
  onShowLeaderboard: () => void;
}

const ExamLobby: React.FC<ExamLobbyProps> = ({ onStart, onShowLeaderboard }) => {
  const [moduleId, setModuleId] = useState<string>('lin_alg');
  const [durationMin, setDurationMin] = useState<number>(90);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleStart = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${API_BASE}/api/exam/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ moduleId, durationMin }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data?.error?.message || 'Prüfung konnte nicht erstellt werden.');
      }
      const data = await response.json();
      onStart(data.plan as ExamPlanItem[], moduleId, durationMin);
    } catch (err: any) {
      setError(err.message || 'Verbindung zum Server fehlgeschlagen.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fadeIn">
      <div className="text-center mb-8">
        <FileText className="w-12 h-12 text-purple-500 mx-auto mb-3" />
        <h1 className="text-3xl font-bold font-display text-theme-primary">Prüfungsmodus</h1>
        <p className="text-theme-muted mt-2">
          Simuliere eine Klausur unter Zeitdruck. Wähle ein Modul und die Dauer.
        </p>
      </div>

      <div className="glass-panel rounded-3xl p-6 md:p-8 mb-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
        <h2 className="text-lg font-bold text-theme-primary mb-4">Modul wählen</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {EXAM_MODULES.map((m) => {
            const active = moduleId === m.id && m.enabled;
            return (
              <button
                key={m.id}
                disabled={!m.enabled}
                onClick={() => m.enabled && setModuleId(m.id)}
                className={`relative p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                  active
                    ? 'border-purple-500 ring-2 ring-purple-500/30 bg-purple-500/10'
                    : m.enabled
                    ? 'border-theme-border hover:border-purple-400 bg-theme-card'
                    : 'border-theme-border bg-theme-card opacity-50 cursor-not-allowed'
                }`}
              >
                <span className="font-semibold text-theme-primary">{m.label}</span>
                {!m.enabled && (
                  <span className="absolute top-3 right-3 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-amber-500/15 text-amber-600 dark:text-amber-400 rounded-full border border-amber-500/25">
                    In Arbeit
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="glass-panel rounded-3xl p-6 md:p-8 mb-6">
        <h2 className="text-lg font-bold text-theme-primary mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5 text-purple-500" /> Prüfungsdauer: {durationMin} Min
        </h2>
        <div className="flex flex-wrap gap-2">
          {DURATIONS.map((d) => (
            <button
              key={d}
              onClick={() => setDurationMin(d)}
              className={`px-4 py-2 rounded-xl font-semibold text-sm border transition-all cursor-pointer ${
                durationMin === d
                  ? 'bg-purple-600 text-white border-purple-600'
                  : 'bg-theme-card text-theme-secondary border-theme-border hover:border-purple-400'
              }`}
            >
              {d} Min
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3.5 bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 rounded-xl text-sm font-bold">
          {error}
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={handleStart}
          disabled={loading}
          className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 text-white font-semibold rounded-xl transition-all shadow-lg hover:shadow-purple-500/25 cursor-pointer"
        >
          <Play className="w-5 h-5" /> {loading ? 'Prüfung wird erstellt…' : 'Prüfung starten'}
        </button>
        <button
          onClick={onShowLeaderboard}
          className="flex items-center justify-center gap-2 px-6 py-3.5 bg-theme-card hover:brightness-95 dark:hover:brightness-110 text-theme-primary font-semibold rounded-xl border border-theme-border transition-all cursor-pointer"
        >
          <Trophy className="w-5 h-5" /> Bestenliste ansehen
        </button>
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Runner                                                              */
/* ------------------------------------------------------------------ */

interface ExamRunnerProps {
  user: UserProfile;
  plan: ExamPlanItem[];
  moduleId: string;
  durationMin: number;
  /** Shared results (auto-graded points recorded during the exam). */
  results: Record<string, ExamTaskResult>;
  onRecord: (itemKey: string, userPoints: number, maxPoints: number, answer?: string) => void;
  onReview: () => void;
}

const ExamRunner: React.FC<ExamRunnerProps> = ({
  user,
  plan,
  durationMin,
  results,
  onRecord,
  onReview,
}) => {
  const [current, setCurrent] = useState(0);
  const [ended, setEnded] = useState(false);
  // 'paged' shows one task at a time; 'scroll' lists all tasks on one page.
  const [viewMode, setViewMode] = useState<'paged' | 'scroll'>('scroll');
  const [tasksReady, setTasksReady] = useState(false);
  const taskRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const isProgrammaticScroll = useRef(true);

  const totalSeconds = durationMin * 60;
  const [remaining, setRemaining] = useState(totalSeconds);
  const timerRef = useRef<number | null>(null);

  // Reset window scroll position to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Reset window scroll position when switching to paged view
  useEffect(() => {
    if (viewMode === 'paged') {
      window.scrollTo(0, 0);
    }
  }, [viewMode]);

  // End the exam (timer expired or user clicked "abgeben") → go to the review
  // phase, where model solutions are shown and manual (DSAL) points are awarded.
  const endExam = useCallback(() => {
    if (ended) return;
    setEnded(true);
    if (timerRef.current) window.clearInterval(timerRef.current);
    onReview();
  }, [ended, onReview]);

  useEffect(() => {
    if (ended) return;
    timerRef.current = window.setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          if (timerRef.current) window.clearInterval(timerRef.current);
          void endExam();
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ended]);

  useEffect(() => {
    let cancelled = false;
    setTasksReady(false);

    (async () => {
      try {
        await Promise.all(
          plan.map(async (p, idx) => {
            const key = getExamTaskKey(idx, p.taskTypeId);
            if (taskCache.has(key)) return;
            const response = await fetch(`${API_BASE}/api/tasks/${p.taskTypeId}`);
            if (!response.ok) {
              throw new Error('Aufgabe konnte nicht geladen werden.');
            }
            const data = await response.json();
            taskCache.set(key, data);
          })
        );
      } catch (err) {
        console.error('Exam task prefetch failed:', err);
      } finally {
        if (!cancelled) setTasksReady(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [plan]);

  // Scroll to current task when switching to scroll view
  useEffect(() => {
    if (viewMode !== 'scroll' || !tasksReady) return;
    const currentItem = plan[current];
    if (!currentItem) return;
    const key = getExamTaskKey(current, currentItem.taskTypeId);
    const node = taskRefs.current[key];
    if (!node) return;
    
    isProgrammaticScroll.current = true;
    let timerId: ReturnType<typeof setTimeout> | null = null;
    
    const rafId = requestAnimationFrame(() => {
      node.scrollIntoView({ block: 'start', behavior: 'auto' });
      timerId = setTimeout(() => {
        isProgrammaticScroll.current = false;
      }, 150);
    });

    return () => {
      cancelAnimationFrame(rafId);
      if (timerId) clearTimeout(timerId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewMode, tasksReady]);

  useEffect(() => {
    if (viewMode !== 'scroll' || !tasksReady) return;

    const observer = new IntersectionObserver(
      () => {
        if (isProgrammaticScroll.current) return;

        let activeIndex = 0;
        let minDiff = Infinity;
        const targetY = 150; // 150px from top (below the sticky header)

        Object.values(taskRefs.current).forEach((node) => {
          if (!node) return;
          const rect = node.getBoundingClientRect();
          const index = Number(node.dataset.examIndex);
          if (!Number.isFinite(index)) return;

          if (rect.top <= targetY && rect.bottom >= targetY) {
            activeIndex = index;
            minDiff = 0;
          } else {
            const dist = rect.top > targetY ? rect.top - targetY : targetY - rect.bottom;
            if (dist < minDiff) {
              minDiff = dist;
              activeIndex = index;
            }
          }
        });

        setCurrent((prev) => (prev === activeIndex ? prev : activeIndex));
      },
      {
        root: null,
        threshold: 0,
      }
    );

    Object.values(taskRefs.current).forEach((node) => {
      if (node) observer.observe(node);
    });

    return () => observer.disconnect();
  }, [viewMode, tasksReady, plan.length]);

  const mm = String(Math.floor(remaining / 60)).padStart(2, '0');
  const ss = String(remaining % 60).padStart(2, '0');
  const elapsedPct = ((totalSeconds - remaining) / totalSeconds) * 100;
  const item = plan[current];

  if (!tasksReady) {
    return (
      <div className="animate-fadeIn">
        <div className="glass-panel rounded-3xl p-8 text-center">
          <Clock className="w-8 h-8 text-purple-500 animate-spin mx-auto" />
          <p className="text-theme-muted text-sm mt-3">Aufgaben werden geladen…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fadeIn">
      <div className="sticky top-20 z-30 mb-6 glass-panel rounded-2xl p-4 flex items-center gap-4">
        <div className="text-2xl font-bold font-display text-theme-primary tabular-nums">
          {mm}:{ss}
        </div>
        <div className="flex-grow">
          <div className="h-2 bg-theme-border rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-purple-600 to-indigo-600 transition-all"
              style={{ width: `${elapsedPct}%` }}
            />
          </div>
          <p className="text-xs text-theme-muted mt-1">
            {viewMode === 'paged'
              ? `Aufgabe ${current + 1} / ${plan.length} · ${durationMin} Min gesamt`
              : `${plan.length} Aufgaben · ${durationMin} Min gesamt`}
          </p>
        </div>
        <button
          onClick={() => setViewMode((m) => (m === 'paged' ? 'scroll' : 'paged'))}
          className="flex items-center gap-1.5 px-3 py-2 bg-theme-card hover:brightness-95 dark:hover:brightness-110 text-theme-primary font-semibold rounded-xl border border-theme-border transition-all cursor-pointer"
          title={viewMode === 'paged' ? 'Alle Aufgaben auf einer Seite anzeigen' : 'Eine Aufgabe pro Seite anzeigen'}
        >
          {viewMode === 'paged' ? <List className="w-4 h-4" /> : <Square className="w-4 h-4" />}
          {viewMode === 'paged' ? 'Alle anzeigen' : 'Einzeln'}
        </button>
        <button
          onClick={() => endExam()}
          className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold rounded-xl transition-all cursor-pointer"
        >
          Prüfung abgeben
        </button>
      </div>

      {viewMode === 'scroll' ? (
        <div className="space-y-6">
          {plan.map((p, idx) => (
            <div
              key={getExamTaskKey(idx, p.taskTypeId)}
              data-exam-index={idx}
              ref={(el) => {
                taskRefs.current[getExamTaskKey(idx, p.taskTypeId)] = el;
              }}
              className="scroll-mt-32"
            >
              <div className="text-xs font-bold uppercase tracking-wider text-theme-muted mb-2">
                Aufgabe {idx + 1} / {plan.length}
              </div>
              <ExamTask
                phase="exam"
                item={p}
                itemKey={getExamTaskKey(idx, p.taskTypeId)}
                user={user}
                onRecord={onRecord}
                recorded={results[getExamTaskKey(idx, p.taskTypeId)]}
              />
            </div>
          ))}
        </div>
      ) : (
        <>
          <ExamTask
            key={getExamTaskKey(current, item.taskTypeId)}
            phase="exam"
            item={item}
            itemKey={getExamTaskKey(current, item.taskTypeId)}
            user={user}
            onRecord={onRecord}
            recorded={results[getExamTaskKey(current, item.taskTypeId)]}
          />

          <div className="flex justify-between mt-6">
            <button
              onClick={() => setCurrent((c) => Math.max(0, c - 1))}
              disabled={current === 0}
              className="flex items-center gap-2 px-5 py-2.5 bg-theme-card hover:brightness-95 dark:hover:brightness-110 text-theme-primary rounded-xl font-semibold border border-theme-border transition-all cursor-pointer disabled:opacity-40"
            >
              <ArrowLeft className="w-4 h-4" /> Zurück
            </button>
            {current < plan.length - 1 ? (
              <button
                onClick={() => setCurrent((c) => Math.min(plan.length - 1, c + 1))}
                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold rounded-xl transition-all cursor-pointer"
              >
                Nächste Aufgabe <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={() => endExam()}
                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold rounded-xl transition-all cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" /> Abgeben
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Review (after the exam: full exam + model solutions + grading)     */
/* ------------------------------------------------------------------ */

interface ExamReviewProps {
  user: UserProfile;
  plan: ExamPlanItem[];
  moduleId: string;
  durationMin: number;
  /** Shared results (auto-graded points from the exam + manual points from review). */
  results: Record<string, ExamTaskResult>;
  onRecord: (itemKey: string, userPoints: number, maxPoints: number, answer?: string) => void;
  onFinish: (result: ExamSubmissionResult) => void;
  onCancel: () => void;
}

const ExamReview: React.FC<ExamReviewProps> = ({
  user,
  plan,
  moduleId,
  durationMin,
  results,
  onRecord,
  onFinish,
  onCancel,
}) => {
  const [submitting, setSubmitting] = useState(false);

  const manualCount = plan.filter((p) => !p.autoGraded).length;
  const gradedManual = plan.filter((p, idx) => !p.autoGraded && results[getExamTaskKey(idx, p.taskTypeId)] !== undefined).length;

  const submit = async () => {
    if (submitting) return;
    setSubmitting(true);

    const tasks = plan.map((p, idx) => ({
      taskTypeId: p.taskTypeId,
      userPoints: results[getExamTaskKey(idx, p.taskTypeId)]?.userPoints ?? 0,
      maxPoints: p.maxPoints,
    }));

    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${API_BASE}/api/exam/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ moduleId, durationMin, tasks }),
      });
      if (response.ok) {
        onFinish((await response.json()) as ExamSubmissionResult);
        return;
      }
    } catch (err) {
      console.error('Exam submit failed:', err);
    }
    const earned = tasks.reduce((s, t) => s + t.userPoints, 0);
    const max = tasks.reduce((s, t) => s + t.maxPoints, 0);
    const scorePct = max > 0 ? (earned / max) * 100 : 0;
    onFinish({ scorePct, grade: 5.0, passed: false, attemptId: 'local' });
  };

  return (
    <div className="animate-fadeIn">
      <div className="text-center mb-6">
        <FileText className="w-12 h-12 text-purple-500 mx-auto mb-3" />
        <h1 className="text-3xl font-bold font-display text-theme-primary">Auswertung</h1>
        <p className="text-theme-muted mt-2">
          Vergleiche deine Lösungen mit der Musterlösung. Vergib für die
          nicht automatisch korrigierten Aufgaben (z. B. Bäume, Graphen) deine
          Punkte.
        </p>
        {manualCount > 0 && (
          <p className="text-sm text-amber-600 dark:text-amber-400 mt-1 font-semibold">
            Noch {manualCount - gradedManual} manuell zu bewertende Aufgabe(n)
          </p>
        )}
      </div>

      <div className="space-y-6">
        {plan.map((p, idx) => (
            <div key={getExamTaskKey(idx, p.taskTypeId)}>
            <div className="text-xs font-bold uppercase tracking-wider text-theme-muted mb-2">
              Aufgabe {idx + 1} / {plan.length} · {p.category}
            </div>
            <ExamTask
              phase="review"
              item={p}
                itemKey={getExamTaskKey(idx, p.taskTypeId)}
              user={user}
              onRecord={onRecord}
                recorded={results[getExamTaskKey(idx, p.taskTypeId)]}
                recordedAnswer={results[getExamTaskKey(idx, p.taskTypeId)]?.answer}
            />
          </div>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mt-6">
        <button
          onClick={submit}
          disabled={submitting || (manualCount > 0 && gradedManual < manualCount)}
          className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 text-white font-semibold rounded-xl transition-all shadow-lg hover:shadow-purple-500/25 cursor-pointer"
        >
          <Trophy className="w-5 h-5" /> Prüfung auswerten
        </button>
        <button
          onClick={onCancel}
          className="px-6 py-3.5 bg-theme-card hover:brightness-95 dark:hover:brightness-110 text-theme-primary font-semibold rounded-xl border border-theme-border transition-all cursor-pointer"
        >
          Abbrechen
        </button>
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Single exam task                                                    */
/* ------------------------------------------------------------------ */

interface ExamTaskProps {
  /** 'exam' = during the timed exam (no solution peek, no manual grading);
   *  'review' = after the exam (model solution shown, manual points awarded). */
  phase: 'exam' | 'review';
  item: ExamPlanItem;
  itemKey: string;
  user: UserProfile;
  onRecord: (itemKey: string, userPoints: number, maxPoints: number, answer?: string) => void;
  recorded?: ExamTaskResult;
  /** The answer the user submitted during the exam (shown in review). */
  recordedAnswer?: string;
}

// Cache fetched tasks by their type id so the SAME task instance is shown in
// both the exam and the review phase. The server generates a fresh random
// instance on every request, so without this cache the review would display a
// different (new) task than the one the user actually solved.
const taskCache = new Map<string, TaskData>();

const ExamTask: React.FC<ExamTaskProps> = ({ phase, item, itemKey, user, onRecord, recorded, recordedAnswer }) => {
  const [task, setTask] = useState<TaskData | null>(taskCache.get(itemKey) ?? null);
  const [loading, setLoading] = useState(!taskCache.has(itemKey));
  const [error, setError] = useState<string | null>(null);
  const [manualPoints, setManualPoints] = useState<string>('');
  const [userAnswerText, setUserAnswerText] = useState<string>(recordedAnswer ?? recorded?.answer ?? '');

  const isAutoGraded =
    !!task && ((!!task.answer && task.answer.length > 0) || (!!task.choices && task.choices.length > 0));

  useEffect(() => {
    // Reuse a previously fetched instance so the exam and review show the
    // exact same task (the server returns a new random instance per request).
    const cached = taskCache.get(itemKey);
    if (cached) {
      setTask(cached);
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`${API_BASE}/api/tasks/${item.taskTypeId}`);
        if (!response.ok) throw new Error('Aufgabe konnte nicht geladen werden.');
        const data = await response.json();
        taskCache.set(itemKey, data);
        if (!cancelled) setTask(data);
      } catch (err: any) {
        if (!cancelled) setError(err.message || 'Fehler.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [item.taskTypeId, itemKey]);

  useEffect(() => {
    if (recorded?.answer !== undefined) {
      setUserAnswerText(recorded.answer);
    }
  }, [recorded?.answer]);

  const handleManualSubmit = () => {
    const pts = Math.max(0, Math.min(item.maxPoints, Number(manualPoints) || 0));
    onRecord(itemKey, pts, item.maxPoints);
  };

  if (loading) {
    return (
      <div className="glass-panel rounded-3xl p-8 text-center">
        <Clock className="w-8 h-8 text-purple-500 animate-spin mx-auto" />
        <p className="text-theme-muted text-sm mt-3">Aufgabe wird geladen…</p>
      </div>
    );
  }
  if (error || !task) {
    return (
      <div className="glass-panel rounded-3xl p-8 text-center text-rose-400">{error || 'Fehler.'}</div>
    );
  }

  const alreadyRecorded = recorded !== undefined;

  return (
    <div className="glass-panel rounded-3xl p-6 md:p-8 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="flex justify-between items-center mb-4">
        <span className="text-xs font-bold uppercase tracking-wider px-3 py-1 bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded-full border border-purple-500/25">
          {item.category}
        </span>
        <span className="text-xs font-semibold text-theme-muted">{item.maxPoints} Punkte</span>
      </div>

      {task.steps && task.steps.length > 0 ? (
        <StepTaskRunner
          task={task}
          user={user}
          onSolved={() => {}}
          onBackToSelector={() => {}}
          onSkip={() => {}}
          examMode={phase === 'exam'}
          solutionMode={phase === 'review'}
          userAnswer={userAnswerText}
        />
      ) : (
        <GenericTaskRunner
          taskType={item.taskTypeId}
          user={user}
          onSolved={() => {}}
          onBackToSelector={() => {}}
          examMode={phase === 'exam'}
          solutionMode={phase === 'review'}
          userAnswer={userAnswerText}
          task={task ?? undefined}
          onAutoGrade={(correct, answer) => {
            setUserAnswerText(answer);
            onRecord(itemKey, correct ? item.maxPoints : 0, item.maxPoints, answer);
          }}
        />
      )}

      <div className="mt-6 pt-6 border-t border-theme-border">
        {phase === 'exam' ? (
          // During the exam: the user simply solves the task. Neither the
          // model solution nor the correctness of the answer may be revealed
          // before the exam ends — so no "Antwort bewerten" / self-check.
          <p className="text-sm text-theme-muted">
            Löse die Aufgabe. Die Überprüfung deiner Lösung und die Punktevergabe
            folgen nach der Prüfung in der Auswertung.
          </p>
        ) : (
          // Review phase: the runner above already shows the user's answer
          // followed by the model solution (with a single expand/collapse
          // button). Here we only handle the points awarding.
          <div className="space-y-3">
            {isAutoGraded ? (
              <div className="flex items-center gap-2 font-bold">
                {alreadyRecorded && recorded.userPoints === item.maxPoints ? (
                  <span className="text-emerald-500 flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5" /> {recorded.userPoints} / {item.maxPoints} Punkte
                  </span>
                ) : alreadyRecorded ? (
                  <span className="text-rose-500 flex items-center gap-2">
                    <XCircle className="w-5 h-5" /> {recorded.userPoints} / {item.maxPoints} Punkte
                  </span>
                ) : (
                  <span className="text-theme-muted">Nicht bewertet — 0 / {item.maxPoints} Punkte</span>
                )}
              </div>
            ) : !alreadyRecorded ? (
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold text-theme-primary">Erreichte Punkte (0–{item.maxPoints}):</span>
                <input
                  type="number"
                  min={0}
                  max={item.maxPoints}
                  value={manualPoints}
                  onChange={(e) => setManualPoints(e.target.value)}
                  className="w-20 px-3 py-2 bg-theme-input border border-theme-border rounded-xl text-theme-primary focus:outline-none focus:border-purple-500"
                />
                <button
                  onClick={handleManualSubmit}
                  className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold rounded-xl transition-all cursor-pointer"
                >
                  Punkte speichern
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 font-bold">
                <Lock className="w-4 h-4" /> {recorded.userPoints} / {item.maxPoints} Punkte erfasst
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Result                                                              */
/* ------------------------------------------------------------------ */

interface ExamResultProps {
  result: ExamSubmissionResult;
  plan: ExamPlanItem[];
  user: UserProfile;
  onBack: () => void;
  onLeaderboard: () => void;
}

const ExamResult: React.FC<ExamResultProps> = ({ result, plan, onBack, onLeaderboard }) => {
  return (
    <div className="animate-fadeIn">
      <div className="glass-panel rounded-3xl p-6 md:p-10 text-center relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
        <Trophy className={`w-14 h-14 mx-auto mb-4 ${result.passed ? 'text-emerald-500' : 'text-rose-500'}`} />
        <h1 className="text-3xl font-bold font-display text-theme-primary mb-2">
          {result.passed ? 'Bestanden!' : 'Nicht bestanden'}
        </h1>
        <div className="text-5xl font-bold font-display my-4 bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
          {result.scorePct.toFixed(1)}%
        </div>
        <p className="text-lg font-semibold text-theme-primary mb-1">{gradeToLabel(result.grade)}</p>
        <p className="text-sm text-theme-muted">
          {result.passed ? 'Glückwunsch zur bestandenen Prüfung.' : 'Versuch es beim nächsten Mal noch einmal!'}
        </p>
      </div>

      <div className="glass-panel rounded-3xl p-6 mt-6">
        <h2 className="text-lg font-bold text-theme-primary mb-4">Aufgabenübersicht</h2>
        <div className="space-y-2">
          {plan.map((p, idx) => {
            const earned = result.tasks?.[idx]?.userPoints ?? 0;
            const full = earned >= p.maxPoints && p.maxPoints > 0;
            return (
              <div
                key={p.taskTypeId}
                className="flex justify-between items-center p-3 bg-theme-card border border-theme-border rounded-xl"
              >
                <span className="text-sm text-theme-secondary">
                  {idx + 1}. {p.category}
                </span>
                <span className={`text-sm font-semibold ${full ? 'text-emerald-500' : 'text-theme-primary'}`}>
                  {earned} / {p.maxPoints} Punkte
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mt-6">
        <button
          onClick={onLeaderboard}
          className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold rounded-xl transition-all shadow-lg hover:shadow-purple-500/25 cursor-pointer"
        >
          <Trophy className="w-5 h-5" /> Zur Bestenliste
        </button>
        <button
          onClick={onBack}
          className="flex items-center justify-center gap-2 px-6 py-3.5 bg-theme-card hover:brightness-95 dark:hover:brightness-110 text-theme-primary font-semibold rounded-xl border border-theme-border transition-all cursor-pointer"
        >
          <RotateCcw className="w-5 h-5" /> Neue Prüfung
        </button>
      </div>
    </div>
  );
};

export default ExamPage;
