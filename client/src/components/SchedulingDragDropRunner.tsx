import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle2, XCircle, HelpCircle, ArrowRight, RefreshCw, ArrowLeft, Lock } from 'lucide-react';
import { API_BASE } from '../config';

interface SchedulingProcess {
  id: string;
  name: string;
  burst: number;
  arrival: number;
  remaining: number;
}

interface SchedulingDragDrop {
  algorithm: string;
  processes: SchedulingProcess[];
  slots: number;
  solution: string[];
  prompt: string;
}

interface TaskData {
  type: string;
  mathQuery: string;
  answer: string;
  explanation?: string[];
  prompt?: string;
  inputHint?: string;
  // Feld ist im Client-Types nicht definiert -> über `as any` gelesen.
  schedulingDragDrop?: SchedulingDragDrop;
}

interface SchedulingDragDropRunnerProps {
  taskType: string;
  user: { id: string; username: string } | null;
  onSolved: () => void;
  onBackToSelector: () => void;
}

const SafeHtml: React.FC<{ html: string }> = ({ html }) => {
  return <div className="prose dark:prose-invert max-w-none text-left leading-relaxed text-sm md:text-base text-theme-primary" dangerouslySetInnerHTML={{ __html: html }} />;
};

export const SchedulingDragDropRunner: React.FC<SchedulingDragDropRunnerProps> = ({
  taskType,
  user,
  onSolved,
  onBackToSelector,
}) => {
  const [task, setTask] = useState<TaskData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Slot-Belegung: welcher Prozess liegt in welchem Slot (null = leer).
  const [slots, setSlots] = useState<(string | null)[]>([]);
  // Welcher Prozess wird gerade gezogen (Drag-and-Drop).
  const [dragged, setDragged] = useState<string | null>(null);
  // Welcher Prozess ist per Klick ausgewählt (folgt dem Cursor).
  const [selected, setSelected] = useState<string | null>(null);
  // Über welchem Slot wird gerade gehovt (Vorschau).
  const [hoverSlot, setHoverSlot] = useState<number | null>(null);
  // Aktuelle Cursor-Position für das mitlaufende Label.
  const [cursor, setCursor] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const [status, setStatus] = useState<'idle' | 'correct' | 'incorrect'>('idle');
  const [showSolution, setShowSolution] = useState<boolean>(false);
  const [isLocked, setIsLocked] = useState<boolean>(false);

  const [localScore, setLocalScore] = useState<number>(() => {
    const saved = localStorage.getItem('aufgabengenerator_score');
    return saved ? parseInt(saved, 10) : 0;
  });

  const fetchTask = async () => {
    try {
      setLoading(true);
      setError(null);
      setStatus('idle');
      setShowSolution(false);
      setIsLocked(false);
      setDragged(null);
      setSelected(null);
      setHoverSlot(null);

      const response = await fetch(`${API_BASE}/api/tasks/${taskType}`);
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data?.error?.message || 'Fehler beim Abrufen der Aufgabe');
      }

      const data = await response.json();
      setTask(data);
      const dd = (data as any).schedulingDragDrop as SchedulingDragDrop | undefined;
      setSlots(new Array<null>(dd ? dd.slots : 0).fill(null));
    } catch (err: any) {
      setError(err.message || 'Verbindung zum Server fehlgeschlagen.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTask();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taskType]);

  const dd = task ? ((task as any).schedulingDragDrop as SchedulingDragDrop | undefined) : undefined;

  // Prozess per Klick auswählen (folgt dann dem Cursor).
  const handleSelect = (id: string) => {
    if (isLocked) return;
    setSelected((prev) => (prev === id ? null : id));
  };

  // Cursor-Position verfolgen, solange ein Prozess ausgewählt ist.
  useEffect(() => {
    if (!selected) return;
    const onMove = (e: MouseEvent) => setCursor({ x: e.clientX, y: e.clientY });
    window.addEventListener('mousemove', onMove);
    return () => window.removeEventListener('mousemove', onMove);
  }, [selected]);

  // Prozess per Drag-and-Drop in einen Slot legen.
  const handleDrop = (slotIndex: number) => {
    if (isLocked || !dragged) return;
    placeInSlot(slotIndex, dragged);
  };

  // Prozess in einen Slot legen (sowohl per Drop als auch per Klick-Auswahl).
  const placeInSlot = (slotIndex: number, id: string) => {
    if (isLocked) return;
    setSlots((prev) => {
      const next = [...prev];
      next[slotIndex] = id;
      return next;
    });
  };

  // Slot per Klick leeren (nur wenn nichts ausgewählt ist).
  const clearSlot = (slotIndex: number) => {
    if (isLocked || selected) return;
    setSlots((prev) => {
      const next = [...prev];
      next[slotIndex] = null;
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!task || !dd || isLocked) return;

    const isCorrect =
      slots.length === dd.solution.length &&
      slots.every((s, i) => s === dd.solution[i]);

    if (isCorrect) {
      setStatus('correct');
      const token = localStorage.getItem('auth_token');
      if (user && token) {
        try {
          const response = await fetch(`${API_BASE}/api/tasks/solve`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ taskTypeId: task.type }),
          });
          if (response.ok) onSolved();
        } catch (err) {
          console.error('Fehler beim Speichern der gelösten Aufgabe:', err);
        }
      } else {
        const newScore = localScore + 1;
        setLocalScore(newScore);
        localStorage.setItem('aufgabengenerator_score', newScore.toString());
        onSolved();
      }
    } else {
      setStatus('incorrect');
    }
  };

  const handleRevealSolution = () => {
    if (!dd) return;
    setShowSolution(true);
    setIsLocked(true);
    setSelected(null);
    setHoverSlot(null);
    // Lösung in die Slots übernehmen und sperren.
    setSlots([...dd.solution]);
  };

  return (
    <div className="w-full max-w-3xl mx-auto px-4 py-8 animate-fadeIn" id="scheduling-dragdrop-solver">
      <div className="flex justify-between items-center mb-6">
        <button
          onClick={onBackToSelector}
          className="flex items-center gap-1.5 text-sm font-semibold text-theme-muted hover:text-theme-primary transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> Zurück zur Fächerauswahl
        </button>
      </div>

      <div className="glass-panel rounded-3xl p-6 md:p-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            <RefreshCw className="w-8 h-8 text-emerald-500 animate-spin" />
            <p className="text-theme-muted text-sm font-semibold">Neue Aufgabe wird geladen...</p>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <div className="text-red-400 text-sm mb-4 bg-red-950/20 py-3 px-4 rounded-xl border border-red-900/30">
              {error}
            </div>
            <button
              onClick={fetchTask}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-theme-card hover:brightness-95 dark:hover:brightness-110 text-theme-primary rounded-xl font-bold border border-theme-border transition-all cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" /> Erneut versuchen
            </button>
          </div>
        ) : task && dd ? (
          <div>
            <div className="flex justify-between items-center mb-6">
              <span className="text-xs font-bold uppercase tracking-wider px-3 py-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-full border border-emerald-500/25">
                {task.type}
              </span>
              <span className="text-xs font-bold uppercase tracking-wider px-3 py-1 bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded-full border border-purple-500/25">
                {dd.algorithm}
              </span>
            </div>

            {task.prompt && (
              <div className="text-lg md:text-xl font-bold font-display text-theme-primary mb-6 leading-snug">
                <SafeHtml html={task.prompt} />
              </div>
            )}

            {/* Prozess-Parameter-Kasten */}
            <div className="mb-6 p-4 bg-theme-card border border-theme-border rounded-2xl">
              <h3 className="text-sm font-bold text-theme-primary uppercase tracking-wider mb-3">
                Prozesse (ziehbar)
              </h3>
              <div className="flex flex-wrap gap-3">
                {dd.processes.map((p) => (
                  <div
                    key={p.id}
                    draggable={!isLocked}
                    onDragStart={() => setDragged(p.id)}
                    onDragEnd={() => setDragged(null)}
                    onClick={() => handleSelect(p.id)}
                    className={`px-4 py-3 rounded-xl border-2 border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-bold cursor-grab active:cursor-grabbing select-none transition-all ${
                      dragged === p.id ? 'opacity-50' : ''
                    } ${
                      selected === p.id ? 'ring-2 ring-emerald-400 ring-offset-2 ring-offset-theme-bg scale-105' : ''
                    }`}
                  >
                    <div className="text-base">{p.name}</div>
                    <div className="text-[10px] font-semibold text-theme-muted mt-1 leading-tight">
                      Ankunft: {p.arrival}<br />
                      Burst: {p.burst}
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-[11px] text-theme-muted mt-3">
                Tipp: Ein Prozess kann mehrfach (für jeden Burst-Slot) in die Slots gezogen werden. Du kannst einen Prozess auch anklicken – er folgt dann dem Cursor und wird per Klick auf einen Slot platziert.
              </p>
            </div>

            {/* Ziel-Bereich mit Slots */}
            <form onSubmit={handleSubmit} className="space-y-4 my-6">
              <div className="p-4 bg-theme-card border border-theme-border rounded-2xl">
                <h3 className="text-sm font-bold text-theme-primary uppercase tracking-wider mb-3">
                  Gantt-Diagramm ({dd.slots} Slots)
                </h3>
                <div className="flex flex-wrap gap-2">
                  {slots.map((s, i) => {
                    const isCorrectSlot = showSolution && s === dd.solution[i];
                    const isWrongSlot = showSolution && s !== dd.solution[i];
                    const isPreview = selected && hoverSlot === i;
                    return (
                      <div
                        key={i}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={() => handleDrop(i)}
                        onMouseEnter={() => setHoverSlot(i)}
                        onMouseLeave={() => setHoverSlot((h) => (h === i ? null : h))}
                        onClick={() => {
                          if (selected) {
                            // Prozess platziert bleiben lassen, damit er
                            // mehrfach hintereinander in Slots gesetzt werden
                            // kann (erneut auf den Chip klicken zum Abwählen).
                            placeInSlot(i, selected);
                          } else {
                            clearSlot(i);
                          }
                        }}
                        title={selected ? 'Klicken zum Platzieren' : 'Klicken zum Leeren'}
                        className={`w-12 h-12 flex items-center justify-center rounded-lg border-2 text-sm font-bold transition-all ${
                          s
                            ? 'border-emerald-500/50 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 cursor-pointer'
                            : 'border-dashed border-theme-border bg-theme-bg/40 text-theme-muted cursor-default'
                        } ${
                          isPreview ? 'border-emerald-400 bg-emerald-400/20 text-emerald-600 dark:text-emerald-300 scale-105' : ''
                        } ${isCorrectSlot ? 'ring-2 ring-emerald-500' : ''} ${
                          isWrongSlot ? 'ring-2 ring-rose-500 bg-rose-500/15 text-rose-600 dark:text-rose-300' : ''
                        }`}
                      >
                        {isPreview ? selected : (s ?? i + 1)}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 mt-6">
                {status === 'idle' && !isLocked ? (
                  <button
                    type="submit"
                    className="w-full sm:w-auto px-6 py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold rounded-xl transition-all shadow-lg hover:shadow-emerald-500/25 flex items-center justify-center gap-2 cursor-pointer"
                    id="submit-answer-btn"
                  >
                    Prüfen
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={fetchTask}
                    className="w-full sm:w-auto px-6 py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold rounded-xl transition-all shadow-lg hover:shadow-emerald-500/25 flex items-center justify-center gap-2 cursor-pointer animate-fadeIn"
                    id="next-task-btn"
                  >
                    Nächste Aufgabe <ArrowRight className="w-5 h-5" />
                  </button>
                )}
              </div>
            </form>

            {status === 'incorrect' && (
              <div className="mt-4 p-3.5 bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 rounded-xl text-sm font-bold flex items-start gap-2.5 animate-fadeIn">
                <XCircle className="w-5 h-5 text-rose-500 dark:text-rose-400 shrink-0 mt-0.5" />
                <div>
                  Leider nicht korrekt. Prüfe die Reihenfolge der Prozesse in den Slots – oder lass dir die Lösung anzeigen!
                </div>
              </div>
            )}
            {status === 'correct' && (
              <div className="mt-4 p-3.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-xl text-sm font-bold flex items-start gap-2.5 animate-fadeIn">
                <CheckCircle2 className="w-5 h-5 text-emerald-500 dark:text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  Korrekt! Hervorragende Arbeit. Klicke auf "Nächste Aufgabe", um fortzufahren.
                </div>
              </div>
            )}
            {isLocked && status !== 'correct' && (
              <div className="mt-4 p-3.5 bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-500 rounded-xl text-sm font-bold flex items-start gap-2.5 animate-fadeIn">
                <Lock className="w-5 h-5 text-amber-600 dark:text-amber-500 shrink-0 mt-0.5" />
                <div>
                  Diese Aufgabe ist gesperrt, da die Lösung angezeigt wurde. Sie wird nicht für die Bestenliste gewertet. Generiere eine neue Aufgabe, um Punkte zu sammeln!
                </div>
              </div>
            )}

            <div className="flex flex-wrap justify-between items-center gap-3 mt-8 pt-6 border-t border-theme-border">
              <button
                type="button"
                onClick={handleRevealSolution}
                disabled={showSolution}
                className={`flex items-center gap-2 text-sm font-semibold transition-colors cursor-pointer ${
                  showSolution ? 'text-emerald-600 dark:text-emerald-400' : 'text-theme-muted hover:text-emerald-600'
                }`}
                id="show-solution-btn"
              >
                <HelpCircle className="w-4 h-4" />
                {showSolution ? 'Lösung angezeigt' : 'Lösung anzeigen'}
              </button>

              {status !== 'correct' && (
                <button
                  type="button"
                  onClick={fetchTask}
                  className="flex items-center gap-2 text-sm font-semibold text-theme-muted hover:text-theme-primary transition-colors cursor-pointer"
                >
                  <RefreshCw className="w-4 h-4" /> Überspringen
                </button>
              )}
            </div>

            {showSolution && task.explanation && (
              <div className="mt-6 p-5 bg-theme-card border border-theme-border rounded-2xl animate-fadeIn">
                <h3 className="text-sm font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-4">
                  Erklärung:
                </h3>
                <div className="space-y-3 text-theme-secondary text-sm md:text-base">
                  {task.explanation.map((step, idx) => (
                    <div key={idx} className="pb-3 last:pb-0 border-b last:border-0 border-theme-border">
                      <SafeHtml html={step} />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : null}
      </div>

      {/* Mitlaufendes Label für den per Klick ausgewählten Prozess.
          Via Portal auf document.body gerendert, damit kein transformierter
          Vorfahre (z.B. animate-fadeIn) die position:fixed Position verschiebt. */}
      {selected && createPortal(
        <div
          className="fixed z-[100] pointer-events-none px-3 py-1.5 rounded-lg bg-emerald-600 text-white font-bold text-sm shadow-lg select-none"
          style={{ left: cursor.x + 12, top: cursor.y + 12 }}
        >
          {selected}
        </div>,
        document.body
      )}
    </div>
  );
};

export default SchedulingDragDropRunner;
