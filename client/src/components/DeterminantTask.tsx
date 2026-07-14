import React, { useState, useEffect, useRef } from 'react';
import { MathRenderer, LatexTextRenderer } from './MathRenderer';
import { CheckCircle2, XCircle, HelpCircle, ArrowRight, RefreshCw, Trophy } from 'lucide-react';

interface TaskData {
  type: string;
  matrix: number[][];
  latex: string;
  answer: number;
  steps: string[];
}

export const DeterminantTask: React.FC = () => {
  const [task, setTask] = useState<TaskData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [userAnswer, setUserAnswer] = useState<string>('');
  const [status, setStatus] = useState<'idle' | 'correct' | 'incorrect'>('idle');
  const [showSolution, setShowSolution] = useState<boolean>(false);
  const [score, setScore] = useState<number>(() => {
    const saved = localStorage.getItem('aufgabengenerator_score');
    return saved ? parseInt(saved, 10) : 0;
  });

  const inputRef = useRef<HTMLInputElement>(null);

  const fetchTask = async () => {
    try {
      setLoading(true);
      setError(null);
      setUserAnswer('');
      setStatus('idle');
      setShowSolution(false);
      
      const response = await fetch('http://localhost:5000/api/tasks/determinant');
      if (!response.ok) {
        throw new Error('Fehler beim Abrufen der Aufgabe');
      }
      
      const data = await response.json();
      setTask(data);
      
      // Auto-focus input after loading
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
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!task || userAnswer.trim() === '') return;

    const parsedAnswer = parseFloat(userAnswer.replace(',', '.'));
    if (isNaN(parsedAnswer)) {
      alert('Bitte gib eine gültige Zahl ein.');
      return;
    }

    if (parsedAnswer === task.answer) {
      setStatus('correct');
      const newScore = score + 1;
      setScore(newScore);
      localStorage.setItem('aufgabengenerator_score', newScore.toString());
    } else {
      setStatus('incorrect');
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-8">
      {/* Score display */}
      <div className="flex items-center justify-between mb-6 px-4 py-3 glass-panel rounded-2xl glow-purple">
        <div className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-purple-400" />
          <span className="text-sm font-medium text-slate-300">Deine Punkte (Session)</span>
        </div>
        <span className="text-xl font-bold bg-gradient-to-r from-purple-400 to-indigo-400 bg-clip-text text-transparent">
          {score}
        </span>
      </div>

      <div className="glass-panel rounded-3xl p-6 md:p-8 relative overflow-hidden glow-purple">
        {/* Subtle background glow decorator */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            <RefreshCw className="w-8 h-8 text-purple-500 animate-spin" />
            <p className="text-slate-400 text-sm font-medium">Neue Aufgabe wird generiert...</p>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <div className="text-red-400 text-sm mb-4 bg-red-950/20 py-3 px-4 rounded-xl border border-red-900/30">
              {error}
            </div>
            <button
              onClick={fetchTask}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-medium border border-slate-700 transition-colors"
            >
              <RefreshCw className="w-4 h-4" /> Erneut versuchen
            </button>
          </div>
        ) : task ? (
          <div>
            {/* Header info */}
            <div className="flex justify-between items-center mb-6">
              <span className="text-xs font-semibold uppercase tracking-wider px-3 py-1 bg-purple-500/10 text-purple-300 rounded-full border border-purple-500/20">
                Lineare Algebra
              </span>
              <span className="text-xs text-slate-400">Typ: 2x2 Determinante</span>
            </div>

            {/* Task prompt */}
            <h2 className="text-xl md:text-2xl font-bold font-display text-slate-100 mb-6 leading-snug">
              Berechne die Determinante der folgenden Matrix:
            </h2>

            {/* Math Render Block */}
            <div className="flex justify-center my-8 select-none scale-110 md:scale-125 transition-transform">
              <MathRenderer math={`M = ${task.latex}`} block />
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-grow">
                  <input
                    ref={inputRef}
                    type="text"
                    disabled={status === 'correct'}
                    value={userAnswer}
                    onChange={(e) => setUserAnswer(e.target.value)}
                    placeholder="Ergebnis eingeben (z.B. -5)"
                    className="w-full px-4 py-3.5 bg-slate-950/40 border border-slate-700/60 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all font-medium text-lg disabled:opacity-60 disabled:cursor-not-allowed"
                  />
                  {status === 'correct' && (
                    <CheckCircle2 className="absolute right-4 top-1/2 -translate-y-1/2 w-6 h-6 text-emerald-400 animate-bounce" />
                  )}
                  {status === 'incorrect' && (
                    <XCircle className="absolute right-4 top-1/2 -translate-y-1/2 w-6 h-6 text-rose-400" />
                  )}
                </div>

                {status !== 'correct' ? (
                  <button
                    type="submit"
                    disabled={userAnswer.trim() === ''}
                    className="w-full sm:w-auto px-6 py-3.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:from-purple-800 disabled:to-indigo-800 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all shadow-lg hover:shadow-purple-500/25 flex items-center justify-center gap-2"
                  >
                    Antwort prüfen
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={fetchTask}
                    className="w-full sm:w-auto px-6 py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold rounded-xl transition-all shadow-lg hover:shadow-emerald-500/25 flex items-center justify-center gap-2"
                  >
                    Nächste Aufgabe <ArrowRight className="w-5 h-5" />
                  </button>
                )}
              </div>
            </form>

            {/* Answer Feedbacks */}
            {status === 'incorrect' && (
              <div className="mt-4 p-3.5 bg-rose-500/10 border border-rose-500/20 text-rose-300 rounded-xl text-sm font-medium flex items-start gap-2.5 animate-fadeIn">
                <XCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                <div>
                  Leider nicht korrekt. Rechne noch mal nach oder lass dir den Rechenweg anzeigen!
                </div>
              </div>
            )}
            {status === 'correct' && (
              <div className="mt-4 p-3.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 rounded-xl text-sm font-medium flex items-start gap-2.5 animate-fadeIn">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  Korrekt! Hervorragende Arbeit. Klicke auf "Nächste Aufgabe", um fortzufahren.
                </div>
              </div>
            )}

            {/* Actions for Solution and Reload */}
            <div className="flex flex-wrap justify-between items-center gap-3 mt-8 pt-6 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowSolution(!showSolution)}
                className="flex items-center gap-2 text-sm font-medium text-slate-400 hover:text-purple-400 transition-colors"
              >
                <HelpCircle className="w-4 h-4" />
                {showSolution ? 'Lösung ausblenden' : 'Rechenweg anzeigen'}
              </button>

              {status !== 'correct' && (
                <button
                  type="button"
                  onClick={fetchTask}
                  className="flex items-center gap-2 text-sm font-medium text-slate-400 hover:text-slate-200 transition-colors"
                >
                  <RefreshCw className="w-4 h-4" /> Überspringen
                </button>
              )}
            </div>

            {/* Solution Display with Transition */}
            {showSolution && (
              <div className="mt-6 p-5 bg-slate-900/40 border border-slate-800 rounded-2xl animate-fadeIn">
                <h3 className="text-sm font-semibold text-purple-400 uppercase tracking-wider mb-4">
                  Rechenweg:
                </h3>
                <div className="space-y-3 text-slate-300 text-sm md:text-base">
                  {task.steps.map((step, idx) => (
                    <div key={idx} className="pb-3 last:pb-0 border-b last:border-0 border-slate-800/40">
                      <LatexTextRenderer text={step} />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default DeterminantTask;
