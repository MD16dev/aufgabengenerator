import React, { useState, useEffect } from 'react';
import { MathRenderer, LatexTextRenderer } from './MathRenderer';
import { TreeRenderer } from './TreeRenderer';
import { GraphRenderer } from './GraphRenderer';
import { HelpCircle, RefreshCw, ArrowLeft, ArrowRight, CheckCircle2 } from 'lucide-react';
import type { TaskData } from '../types';

interface StepTaskRunnerProps {
  task: TaskData;
  user: { id: string; username: string } | null;
  onSolved: () => void;
  onBackToSelector: () => void;
  onSkip: () => void;
}

/**
 * Renders a DSAL task in the style of the RWTH reference generator: the task
 * (start tree / graph / array) is shown, and the user can reveal the full
 * solution. The solution is displayed step by step, i.e. with every
 * intermediate state (result tree per operation, array after each swap,
 * visitation order, MST edges, …) — exactly like the official "Lösung" PDF.
 * No answer input is required; revealing the solution counts as engagement.
 */
export const StepTaskRunner: React.FC<StepTaskRunnerProps> = ({
  task,
  user,
  onSolved,
  onBackToSelector,
  onSkip,
}) => {
  const [revealed, setRevealed] = useState(false);
  const [solved, setSolved] = useState(false);
  const [feedbackGiven, setFeedbackGiven] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState('');
  const steps = task.steps ?? [];

  // Record the solve once the solution is revealed. We do NOT write immediately:
  // the user must self-report via the feedback buttons (which carry the `correct`
  // flag so a "Ich hatte es richtig" counts as a point). If the user reveals but
  // then leaves without answering, we record a neutral "revealed" (0 points) once.
  useEffect(() => {
    if (revealed && !solved) {
      setSolved(true);
      const token = localStorage.getItem('auth_token');
      if (!user || !token) {
        // Guest: count the engagement as a point immediately (no server write).
        const saved = parseInt(localStorage.getItem('aufgabengenerator_score') ?? '0', 10);
        localStorage.setItem('aufgabengenerator_score', String(saved + 1));
        onSolved();
      }
      // For logged-in users we deliberately do NOT refresh here: the point is
      // only awarded once they self-report via handleFeedback (or skip with a
      // neutral reveal). Refreshing now would show a stale 0-point state and
      // the user would never see themselves appear after clicking "Ich hatte
      // es richtig". handleFeedback / the skip handler call onSolved() once the
      // score is actually persisted.
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [revealed]);

  // After revealing the solution, the user self-reports whether they had it
  // right. "Ich hatte es richtig" is sent with correct:true so it counts as a
  // point; "Nein" is sent as a neutral reveal (0 points).
  const handleFeedback = async (hadItRight: boolean) => {
    const token = localStorage.getItem('auth_token');
    if (user && token) {
      try {
        await fetch('http://localhost:5001/api/tasks/solve', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ taskTypeId: task.type, outcome: 'revealed', correct: hadItRight }),
        });
      } catch (err) {
        console.error('Feedback konnte nicht gespeichert werden:', err);
      }
    }
    setFeedbackGiven(true);
    setFeedbackMsg(
      hadItRight
        ? 'Super! Du bekommst einen Punkt für die Bestenliste. Beim nächsten Mal ohne Hilfe schaffst du es bestimmt auch ganz allein.'
        : 'Kein Problem — genau dafür ist die Lösung da. Versuch die nächste Aufgabe!'
    );
    // Refresh the leaderboard now that the point (or neutral reveal) is recorded
    // server-side, so the user actually appears / moves up.
    onSolved();
  };

  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-8 animate-fadeIn" id="step-task-runner">
      <div className="flex justify-between items-center mb-6">
        <button
          onClick={onBackToSelector}
          className="flex items-center gap-1.5 text-sm font-semibold text-theme-muted hover:text-theme-primary transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> Zurück
        </button>
        <span className="text-xs font-bold uppercase tracking-wider px-3 py-1 bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded-full">
          {task.type}
        </span>
      </div>

      <div className="glass-panel rounded-3xl p-6 md:p-8">
        {task.prompt && (
          <h2 className="text-xl md:text-2xl font-bold font-display text-theme-primary mb-4 leading-snug">
            <LatexTextRenderer text={task.prompt} />
          </h2>
        )}

        {/* Initial state (the task itself) */}
        <div className="mb-4">
          <h3 className="text-sm font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider mb-2">
            Aufgabe
          </h3>
          <div className="p-4 bg-theme-card border border-theme-border rounded-2xl overflow-x-auto flex justify-center">
            {task.renderMode === 'tree' && task.tree ? (
              <TreeRenderer tree={task.tree} />
            ) : task.graph ? (
              <GraphRenderer graph={task.graph} />
            ) : (
              <div className="text-center py-2 min-w-0"><MathRenderer math={task.mathQuery} block /></div>
            )}
          </div>
          {(() => {
            const list = task.taskList && task.taskList.length > 0
              ? task.taskList
              : steps.map((s) => s.instruction);
            if (list.length === 0) return null;
            return (
              <ol className="mt-3 list-decimal list-inside space-y-1 text-sm text-theme-primary">
                {list.map((item, i) => (
                  <li key={i}>
                    <LatexTextRenderer text={item} />
                  </li>
                ))}
              </ol>
            );
          })()}
        </div>

        {revealed ? (
          <div className="mt-4 p-4 bg-theme-card border border-theme-border rounded-2xl">
            <h3 className="text-sm font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider mb-4">
              Lösung (mit Zwischenschritten)
            </h3>
            {steps.length === 0 ? (
              <p className="text-sm text-theme-muted">Keine Zwischenschritte verfügbar.</p>
            ) : (
              steps.map((step, i) => (
                <div key={i} className="mb-4 last:mb-0">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className="text-xs font-bold px-2 py-0.5 bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded-full">
                      Schritt {i + 1}
                    </span>
                    <span className="text-sm font-semibold text-theme-primary">
                      <LatexTextRenderer text={step.instruction} />
                    </span>
                    {step.annotation && (
                      <span className="text-xs text-emerald-600 dark:text-emerald-400 ml-auto">
                        {step.annotation}
                      </span>
                    )}
                  </div>
                  {step.kind === 'tree' && (
                    <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl overflow-x-auto">
                      <TreeRenderer tree={step.tree ?? null} />
                    </div>
                  )}
                  {step.kind === 'array' && (
                    <span className="inline-block px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-600 dark:text-emerald-400 font-semibold">
                      [{step.array!.join(', ')}]
                    </span>
                  )}
                  {step.kind === 'text' && (
                    <span className="inline-block px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-600 dark:text-emerald-400 font-semibold">
                      {step.answer}
                    </span>
                  )}
                  {step.kind === 'matrix' && step.matrix && (
                    <div className="inline-block px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl">
                      <MathRenderer
                        math={`\\begin{pmatrix} ${step.matrix
                          .map((row) => row.map((x) => (x === Infinity ? '\\infty' : String(x))).join(' & '))
                          .join(' \\\\ ')} \\end{pmatrix}`}
                        block
                      />
                    </div>
                  )}
                </div>
              ))
            )}
            {task.explanation && task.explanation.length > 0 && (
              <div className="mt-5 p-5 bg-theme-card border border-theme-border rounded-2xl animate-fadeIn">
                <h3 className="text-sm font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider mb-4">
                  Regeln & Rechenweg:
                </h3>
                <div className="space-y-3 text-theme-secondary text-sm md:text-base">
                  {task.explanation.map((line, idx) => (
                    <div key={idx} className="pb-3 last:pb-0 border-b last:border-0 border-theme-border">
                      <LatexTextRenderer text={line} />
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  // If the solution was revealed but the user never self-reported,
                  // record a neutral reveal (0 points) before moving on.
                  if (revealed && !feedbackGiven) {
                    const token = localStorage.getItem('auth_token');
                    if (user && token) {
                      fetch('http://localhost:5001/api/tasks/solve', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                        body: JSON.stringify({ taskTypeId: task.type, outcome: 'revealed' }),
                      }).catch(() => {});
                    }
                    // Refresh so a neutral reveal (0 points) is reflected too.
                    onSolved();
                  }
                  onSkip();
                }}
                className="flex items-center gap-1 text-sm font-semibold text-purple-600 dark:text-purple-400 hover:opacity-80 transition-opacity cursor-pointer"
              >
                Nächste Aufgabe <ArrowRight className="w-4 h-4" />
              </button>
            </div>
            {!feedbackGiven ? (
              <div className="mt-4 p-4 bg-theme-card border border-theme-border rounded-2xl animate-fadeIn">
                <p className="text-sm font-semibold text-theme-primary mb-3">
                  Hattest du die Lösung richtig, bevor du sie dir angesehen hast?
                </p>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => handleFeedback(true)}
                    className="flex-1 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl transition-all cursor-pointer"
                  >
                    Ja, ich hatte es richtig
                  </button>
                  <button
                    type="button"
                    onClick={() => handleFeedback(false)}
                    className="flex-1 px-4 py-2.5 bg-theme-card hover:brightness-95 dark:hover:brightness-110 text-theme-primary font-semibold rounded-xl border border-theme-border transition-all cursor-pointer"
                  >
                    Nein, noch nicht
                  </button>
                </div>
              </div>
            ) : (
              <div className="mt-4 p-3.5 bg-purple-500/10 border border-purple-500/20 text-purple-700 dark:text-purple-300 rounded-xl text-sm font-bold flex items-start gap-2.5 animate-fadeIn">
                <CheckCircle2 className="w-5 h-5 text-purple-600 dark:text-purple-400 shrink-0 mt-0.5" />
                <div>{feedbackMsg}</div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex justify-between items-center mt-6 pt-4 border-t border-theme-border">
            <button
              type="button"
              onClick={() => setRevealed(true)}
              className="flex items-center gap-2 text-sm font-semibold text-theme-muted hover:text-purple-600 transition-colors cursor-pointer"
            >
              <HelpCircle className="w-4 h-4" /> Lösung anzeigen
            </button>
            <button
              type="button"
              onClick={onSkip}
              className="flex items-center gap-2 text-sm font-semibold text-theme-muted hover:text-theme-primary transition-colors cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" /> Neue Aufgabe
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default StepTaskRunner;
