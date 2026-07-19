import React, { useState, useEffect, useRef } from 'react';
import { MathRenderer, LatexTextRenderer } from './MathRenderer';
import { TreeRenderer } from './TreeRenderer';
import { StepTaskRunner } from './StepTaskRunner';
import { CheckCircle2, XCircle, HelpCircle, ArrowRight, RefreshCw, ArrowLeft, Lock } from 'lucide-react';
import { API_BASE } from '../config';
import type { TaskData } from '../types';

interface GenericTaskRunnerProps {
  taskType: string;
  user: { id: string; username: string } | null;
  onSolved: () => void;
  onBackToSelector: () => void;
}

/**
 * Normalizes a user answer for comparison:
 * - strips all whitespace
 * - lowercases (so "X^2" === "x^2")
 * - normalizes the decimal separator (German "," -> ".")
 * This is a pragmatic first step. It does NOT evaluate equivalent math
 * expressions (e.g. "1/2" vs "0.5"); a real math parser would be needed for that.
 */
function normalizeInput(input: string): string {
  return input
    .replace(/\s+/g, '')
    .replace(',', '.')
    .toLowerCase();
}

export const GenericTaskRunner: React.FC<GenericTaskRunnerProps> = ({
  taskType,
  user,
  onSolved,
  onBackToSelector,
}) => {
  const [task, setTask] = useState<TaskData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [userAnswer, setUserAnswer] = useState<string>('');
  const [selectedChoice, setSelectedChoice] = useState<string | null>(null);
  const [status, setStatus] = useState<'idle' | 'correct' | 'incorrect'>('idle');
  const [showSolution, setShowSolution] = useState<boolean>(false);
  const [isLocked, setIsLocked] = useState<boolean>(false);
  const [revealFeedbackGiven, setRevealFeedbackGiven] = useState<boolean>(false);
  const [revealFeedbackMsg, setRevealFeedbackMsg] = useState<string>('');

  const [localScore, setLocalScore] = useState<number>(() => {
    const saved = localStorage.getItem('aufgabengenerator_score');
    return saved ? parseInt(saved, 10) : 0;
  });

  const inputRef = useRef<HTMLInputElement>(null);

  // A task is auto-graded when the system can check the answer itself (free-text
  // `answer` or multiple-choice `choices`). For those, the user already knows
  // whether they were right, so the "Ich hatte es richtig" self-report buttons
  // are pointless. They only make sense for tasks where the user must manually
  // compare their answer against the model solution (tree/graph/matrix).
  const isAutoGraded = !!task && ((!!task.answer && task.answer.length > 0) || (!!task.choices && task.choices.length > 0));

  const fetchTask = async () => {
    try {
      setLoading(true);
      setError(null);
      setUserAnswer('');
      setSelectedChoice(null);
      setStatus('idle');
      setShowSolution(false);
      setIsLocked(false); // Reset lock state for the new task
      setRevealFeedbackGiven(false);
      setRevealFeedbackMsg('');

      const response = await fetch(`${API_BASE}/api/tasks/${taskType}`);
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data?.error?.message || 'Fehler beim Abrufen der Aufgabe');
      }

      const data = await response.json();
      setTask(data);

      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!task || isLocked) return;

    // Multiple-choice tasks compare the selected option id with `answer`.
    const isChoiceTask = !!task.choices && task.choices.length > 0;
    if (isChoiceTask) {
      if (selectedChoice === null) return;
      if (selectedChoice === task.answer) {
        setStatus('correct');
      } else {
        setStatus('incorrect');
        return;
      }
    } else {
      if (userAnswer.trim() === '') return;
      const normalizedUser = normalizeInput(userAnswer);
      const normalizedAnswer = normalizeInput(task.answer);
      if (normalizedUser === normalizedAnswer) {
        setStatus('correct');
      } else {
        setStatus('incorrect');
        return;
      }
    }

    const token = localStorage.getItem('auth_token');
    if (user && token) {
      try {
        const response = await fetch('http://localhost:5001/api/tasks/solve', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ taskTypeId: task.type }),
        });

        if (response.ok) {
          onSolved();
        }
      } catch (err) {
        console.error('Fehler beim Speichern der gelösten Aufgabe:', err);
      }
    } else {
      const newScore = localScore + 1;
      setLocalScore(newScore);
      localStorage.setItem('aufgabengenerator_score', newScore.toString());
      onSolved();
    }
  };

  const handleRevealSolution = () => {
    setShowSolution(true);
    setIsLocked(true);
  };

  // After revealing the solution, the user self-reports whether they had it
  // right. This is recorded as outcome "revealed" (0 points, not ranked) so the
  // leaderboard reflects genuine solves only, but the engagement is tracked.
  const handleRevealFeedback = async (hadItRight: boolean) => {
    if (!task) return;
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
    setRevealFeedbackGiven(true);
    if (hadItRight) {
      setRevealFeedbackMsg('Super! Du bekommst einen Punkt für die Bestenliste. Beim nächsten Mal ohne Hilfe schaffst du es bestimmt auch ganz allein.');
    } else {
      setRevealFeedbackMsg('Kein Problem — genau dafür ist die Lösung da. Versuch die nächste Aufgabe!');
    }
    // Refresh the leaderboard now that the point (or neutral reveal) is recorded
    // server-side, so the user actually appears / moves up.
    onSolved();
  };

  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-8 animate-fadeIn" id="generic-task-solver">
      <div className="flex justify-between items-center mb-6">
        <button
          onClick={onBackToSelector}
          className="flex items-center gap-1.5 text-sm font-semibold text-theme-muted hover:text-theme-primary transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> Zurück zur Fächerauswahl
        </button>
      </div>

      <div className="glass-panel rounded-3xl p-6 md:p-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            <RefreshCw className="w-8 h-8 text-purple-500 animate-spin" />
            <p className="text-theme-muted text-sm font-semibold">Neue Aufgabe wird generiert...</p>
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
        ) : task ? (
          task.steps && task.steps.length > 0 ? (
            <StepTaskRunner
              task={task}
              user={user}
              onSolved={onSolved}
              onBackToSelector={onBackToSelector}
              onSkip={fetchTask}
            />
          ) : (
          <div>
            <div className="flex justify-between items-center mb-6">
              <span className="text-xs font-bold uppercase tracking-wider px-3 py-1 bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded-full border border-purple-500/25">
                {task.type}
              </span>
            </div>

            {task.prompt && (
              <h2 className="text-xl md:text-2xl font-bold font-display text-theme-primary mb-6 leading-snug">
                <LatexTextRenderer text={task.prompt} />
              </h2>
            )}

            <div className="flex justify-center my-8 select-none scale-110 md:scale-125 transition-transform min-w-0" id="task-math-expression">
              <MathRenderer math={task.mathQuery} block />
            </div>

            {task.renderMode === 'tree' && task.tree ? (
              <div className="my-6 p-4 bg-theme-card border border-theme-border rounded-2xl overflow-x-auto" id="task-tree-question">
                <TreeRenderer tree={task.tree} />
              </div>
            ) : null}

            {task.choices && task.choices.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-6" id="task-choices">
                {task.choices.map((choice) => {
                  const isSelected = selectedChoice === choice.id;
                  const isCorrectChoice = choice.id === task.answer;
                  const showCorrect = status === 'correct' && isCorrectChoice;
                  const showWrong = status === 'incorrect' && isSelected;
                  return (
                    <button
                      key={choice.id}
                      type="button"
                      disabled={status === 'correct' || isLocked}
                      onClick={() => setSelectedChoice(choice.id)}
                      className={`p-3 bg-theme-card border rounded-2xl overflow-x-auto transition-all cursor-pointer ${
                        showCorrect
                          ? 'border-emerald-500 ring-2 ring-emerald-500/40'
                          : showWrong
                          ? 'border-rose-500 ring-2 ring-rose-500/40'
                          : isSelected
                          ? 'border-purple-500 ring-2 ring-purple-500/30'
                          : 'border-theme-border hover:border-purple-400'
                      }`}
                    >
                      {choice.tree ? (
                        <TreeRenderer tree={choice.tree} />
                      ) : (
                        <div className="text-center py-4"><MathRenderer math={choice.caption ?? ''} block /></div>
                      )}
                      {choice.caption && choice.tree ? (
                        <div className="text-center text-xs text-theme-muted mt-1">{choice.caption}</div>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            ) : null}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-3">
                {task.choices && task.choices.length > 0 ? (
                  <button
                    type="submit"
                    disabled={selectedChoice === null || status === 'correct' || isLocked}
                    className="w-full px-6 py-3.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:from-purple-800 disabled:to-indigo-800 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all shadow-lg hover:shadow-purple-500/25 flex items-center justify-center gap-2 cursor-pointer"
                    id="submit-answer-btn"
                  >
                    {status === 'correct' ? 'Nächste Aufgabe' : 'Baum auswählen'}
                  </button>
                ) : (
                  <div className="relative flex-grow">
                    <input
                      ref={inputRef}
                      type="text"
                      autoComplete="off"
                      disabled={status === 'correct' || isLocked}
                      value={userAnswer}
                      onChange={(e) => setUserAnswer(e.target.value)}
                      placeholder={isLocked ? 'Gesperrt (Lösung wurde angezeigt)' : 'Ergebnis eingeben'}
                      className="w-full px-4 py-3.5 bg-theme-input border border-theme-border rounded-xl text-theme-primary placeholder-theme-muted focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all font-semibold text-lg disabled:opacity-60 disabled:cursor-not-allowed"
                      id="task-answer-input"
                    />
                    {status === 'correct' && (
                      <CheckCircle2 className="absolute right-4 top-1/2 -translate-y-1/2 w-6 h-6 text-emerald-400 animate-bounce" />
                    )}
                    {status === 'incorrect' && (
                      <XCircle className="absolute right-4 top-1/2 -translate-y-1/2 w-6 h-6 text-rose-400" />
                    )}
                    {isLocked && status !== 'correct' && (
                      <Lock className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-amber-500" />
                    )}
                  </div>
                )}

                {status !== 'correct' && !isLocked ? (
                  <button
                    type="submit"
                    disabled={task.choices && task.choices.length > 0 ? selectedChoice === null : userAnswer.trim() === ''}
                    className="w-full sm:w-auto px-6 py-3.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:from-purple-800 disabled:to-indigo-800 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all shadow-lg hover:shadow-purple-500/25 flex items-center justify-center gap-2 cursor-pointer"
                    id="submit-answer-btn"
                  >
                    Antwort prüfen
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

            {task.inputHint && (
              <div className="mt-3 text-xs text-theme-muted font-medium">
                <LatexTextRenderer text={task.inputHint} />
              </div>
            )}

            {status === 'incorrect' && (
              <div className="mt-4 p-3.5 bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 rounded-xl text-sm font-bold flex items-start gap-2.5 animate-fadeIn">
                <XCircle className="w-5 h-5 text-rose-500 dark:text-rose-400 shrink-0 mt-0.5" />
                <div>
                  Leider nicht korrekt. Rechne noch mal nach oder lass dir den Rechenweg anzeigen!
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
                  Der Rechenweg wurde angezeigt. Wenn du die Lösung richtig hattest, gibt dir die Einschätzung unten einen Punkt für die Bestenliste. Sonst einfach die nächste Aufgabe probieren!
                </div>
              </div>
            )}

            {isLocked && status !== 'correct' && showSolution && !revealFeedbackGiven && !isAutoGraded && (
              <div className="mt-4 p-4 bg-theme-card border border-theme-border rounded-2xl animate-fadeIn">
                <p className="text-sm font-semibold text-theme-primary mb-3">
                  Hattest du die Lösung richtig, bevor du sie dir angesehen hast?
                </p>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => handleRevealFeedback(true)}
                    className="flex-1 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl transition-all cursor-pointer"
                  >
                    Ja, ich hatte es richtig
                  </button>
                  <button
                    type="button"
 onClick={() => handleRevealFeedback(false)}
                    className="flex-1 px-4 py-2.5 bg-theme-card hover:brightness-95 dark:hover:brightness-110 text-theme-primary font-semibold rounded-xl border border-theme-border transition-all cursor-pointer"
                  >
                    Nein, noch nicht
                  </button>
                </div>
              </div>
            )}

            {isLocked && status !== 'correct' && revealFeedbackGiven && !isAutoGraded && (
              <div className="mt-4 p-3.5 bg-purple-500/10 border border-purple-500/20 text-purple-700 dark:text-purple-300 rounded-xl text-sm font-bold flex items-start gap-2.5 animate-fadeIn">
                <CheckCircle2 className="w-5 h-5 text-purple-600 dark:text-purple-400 shrink-0 mt-0.5" />
                <div>{revealFeedbackMsg}</div>
              </div>
            )}

            <div className="flex flex-wrap justify-between items-center gap-3 mt-8 pt-6 border-t border-theme-border">
              <button
                type="button"
                onClick={handleRevealSolution}
                disabled={showSolution}
                className={`flex items-center gap-2 text-sm font-semibold transition-colors cursor-pointer ${
                  showSolution ? 'text-purple-600 dark:text-purple-400' : 'text-theme-muted hover:text-purple-600'
                }`}
                id="show-solution-btn"
              >
                <HelpCircle className="w-4 h-4" />
                {showSolution ? 'Lösung angezeigt' : 'Rechenweg anzeigen'}
              </button>

              {status !== 'correct' && (
                <button
                  type="button"
                  onClick={() => {
                    // If the solution was revealed but the user never self-reported,
                    // record a neutral reveal (0 points) before loading a new task.
                    if (showSolution && !revealFeedbackGiven) {
                      const token = localStorage.getItem('auth_token');
                      if (user && token && task) {
                        fetch('http://localhost:5001/api/tasks/solve', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                          body: JSON.stringify({ taskTypeId: task.type, outcome: 'revealed' }),
                        }).catch(() => {});
                      }
                    }
                    fetchTask();
                  }}
                  className="flex items-center gap-2 text-sm font-semibold text-theme-muted hover:text-theme-primary transition-colors cursor-pointer"
                >
                  <RefreshCw className="w-4 h-4" /> Überspringen
                </button>
              )}
            </div>

            {showSolution && task.explanation && (
              <div className="mt-6 p-5 bg-theme-card border border-theme-border rounded-2xl animate-fadeIn">
                <h3 className="text-sm font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider mb-4">
                  Rechenweg:
                </h3>
                <div className="space-y-3 text-theme-secondary text-sm md:text-base">
                  {task.explanation.map((step, idx) => (
                    <div key={idx} className="pb-3 last:pb-0 border-b last:border-0 border-theme-border">
                      <LatexTextRenderer text={step} />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          )
        ) : null}
      </div>
    </div>
  );
};

export default GenericTaskRunner;
