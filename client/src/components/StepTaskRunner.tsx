import React, { useState, useEffect, useRef } from 'react';
import { MathRenderer, LatexTextRenderer } from './MathRenderer';
import { TreeRenderer } from './TreeRenderer';
import { GraphRenderer } from './GraphRenderer';
import { CheckCircle2, XCircle, HelpCircle, RefreshCw, ArrowLeft, ArrowRight } from 'lucide-react';
import type { TaskData, TaskStep } from '../types';

interface StepTaskRunnerProps {
  task: TaskData;
  user: { id: string; username: string } | null;
  onSolved: () => void;
  onBackToSelector: () => void;
  onSkip: () => void;
}

/** Normalize a free-text answer for comparison (whitespace, comma->dot, lower). */
function normalize(s: string): string {
  return s.replace(/\s+/g, '').replace(',', '.').toLowerCase();
}

/** Normalize an array string like "[3, 1, 4]" or "3,1,4" to canonical form. */
function normalizeArray(s: string): string {
  const nums = s
    .replace(/[\[\]]/g, '')
    .split(/[,\s]+/)
    .filter((x) => x.length > 0)
    .map((x) => x.trim());
  return `[${nums.join(',')}]`;
}

export const StepTaskRunner: React.FC<StepTaskRunnerProps> = ({
  task,
  user,
  onSolved,
  onBackToSelector,
  onSkip,
}) => {
  const [current, setCurrent] = useState(0);
  const [allCorrect, setAllCorrect] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [solved, setSolved] = useState(false);

  const steps = task.steps ?? [];

  // Track correctness of each step via a ref-like state array.
  const [correctFlags, setCorrectFlags] = useState<boolean[]>(() => steps.map(() => false));

  const markCorrect = (idx: number) => {
    setCorrectFlags((prev) => {
      const next = [...prev];
      next[idx] = true;
      if (next.every(Boolean)) {
        setAllCorrect(true);
      }
      return next;
    });
  };

  // When all steps correct, record the solve.
  useEffect(() => {
    if (allCorrect && !solved) {
      setSolved(true);
      const token = localStorage.getItem('auth_token');
      if (user && token) {
        fetch('http://localhost:5001/api/tasks/solve', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ taskTypeId: task.type }),
        })
          .then((r) => r.ok && onSolved())
          .catch(() => {});
      } else {
        const saved = parseInt(localStorage.getItem('aufgabengenerator_score') ?? '0', 10);
        localStorage.setItem('aufgabengenerator_score', String(saved + 1));
        onSolved();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allCorrect]);

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

        {/* Initial state */}
        <div className="mb-4">
          <h3 className="text-sm font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider mb-2">
            Ausgangszustand
          </h3>
          <div className="p-4 bg-theme-card border border-theme-border rounded-2xl overflow-x-auto flex justify-center">
            {task.renderMode === 'tree' && task.tree ? (
              <TreeRenderer tree={task.tree} />
            ) : task.graph ? (
              <GraphRenderer graph={task.graph} />
            ) : (
              <div className="text-center py-2"><MathRenderer math={task.mathQuery} block /></div>
            )}
          </div>
        </div>

        {/* Steps */}
        <div className="space-y-1">
          {steps.map((step, i) => (
            <div key={i}>
              {i <= current && (
                <StepCardWithCallback
                  step={step}
                  index={i}
                  total={steps.length}
                  onCorrect={() => markCorrect(i)}
                />
              )}
              {i === current && !correctFlags[i] && (
                <button
                  type="button"
                  onClick={() => setCurrent((c) => Math.min(steps.length - 1, c + 1))}
                  className="text-xs text-theme-muted hover:text-purple-600 mb-3 ml-1"
                >
                  Überspringen →
                </button>
              )}
            </div>
          ))}
        </div>

        {allCorrect && (
          <div className="mt-4 p-3.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-xl text-sm font-bold flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5" /> Alle Schritte korrekt! Hervorragend.
            <button
              type="button"
              onClick={onSkip}
              className="ml-auto flex items-center gap-1 text-emerald-700 dark:text-emerald-300"
            >
              Nächste Aufgabe <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {!allCorrect && (
          <div className="flex justify-between items-center mt-6 pt-4 border-t border-theme-border">
            <button
              type="button"
              onClick={() => setRevealed(true)}
              className="flex items-center gap-2 text-sm font-semibold text-theme-muted hover:text-purple-600 transition-colors cursor-pointer"
            >
              <HelpCircle className="w-4 h-4" /> Alle Lösungen anzeigen
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

        {revealed && (
          <div className="mt-4 p-4 bg-theme-card border border-theme-border rounded-2xl">
            <h3 className="text-sm font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider mb-3">
              Lösung
            </h3>
            {steps.map((step, i) => (
              <div key={i} className="mb-2 text-sm">
                <span className="font-semibold text-theme-primary">{step.instruction}</span>
                {step.kind === 'tree' && (
                  <div className="mt-1 overflow-x-auto"><TreeRenderer tree={step.tree ?? null} /></div>
                )}
                {step.kind === 'array' && <span className="ml-2 text-emerald-600">→ [{step.array!.join(', ')}]</span>}
                {step.kind === 'text' && <span className="ml-2 text-emerald-600">→ {step.answer}</span>}
                {step.annotation && <span className="ml-2 text-xs text-theme-muted">({step.annotation})</span>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * Wrapper that lifts "correct" events to the parent so the parent can advance
 * and track overall progress. Uses a callback prop instead of context to keep
 * it simple.
 */
function StepCardWithCallback({
  step,
  index,
  total,
  onCorrect,
}: {
  step: TaskStep;
  index: number;
  total: number;
  onCorrect: () => void;
}) {
  const [input, setInput] = useState('');
  const [status, setStatus] = useState<'idle' | 'correct' | 'incorrect'>('idle');
  const [showSolution, setShowSolution] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setInput('');
    setStatus('idle');
    setShowSolution(false);
  }, [step]);

  const check = () => {
    let ok = false;
    if (step.kind === 'array') {
      ok = normalizeArray(input) === normalizeArray(`[${step.array!.join(', ')}]`);
    } else if (step.kind === 'text') {
      ok = normalize(input) === normalize(step.answer ?? '');
    }
    if (ok) {
      setStatus('correct');
      onCorrect();
    } else {
      setStatus('incorrect');
    }
  };

  return (
    <div className="p-4 bg-theme-card border border-theme-border rounded-2xl mb-3">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xs font-bold px-2 py-0.5 bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded-full">
          Schritt {index + 1}/{total}
        </span>
        <span className="text-sm font-semibold text-theme-primary">
          <LatexTextRenderer text={step.instruction} />
        </span>
        {step.annotation && status === 'correct' && (
          <span className="text-xs text-emerald-600 dark:text-emerald-400 ml-auto">{step.annotation}</span>
        )}
      </div>

      {step.kind === 'tree' && (
        <div className="my-2">
          {status === 'correct' ? (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl overflow-x-auto">
              <TreeRenderer tree={step.tree ?? null} />
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <p className="text-xs text-theme-muted">Zeichne den Baum nach dieser Operation und zeige dann die Lösung.</p>
              {!showSolution ? (
                <button
                  type="button"
                  onClick={() => { setShowSolution(true); setStatus('correct'); onCorrect(); }}
                  className="self-start px-4 py-2 bg-purple-600 text-white rounded-xl font-semibold"
                >
                  Lösung zeigen
                </button>
              ) : (
                <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl overflow-x-auto">
                  <TreeRenderer tree={step.tree ?? null} />
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {step.kind === 'array' && (
        <div className="flex flex-col sm:flex-row gap-2 items-start">
          <input
            ref={inputRef}
            type="text"
            disabled={status === 'correct'}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onBlur={check}
            placeholder="z.B. [3, 1, 4, 2]"
            className="flex-grow px-3 py-2 bg-theme-input border border-theme-border rounded-xl text-theme-primary font-semibold disabled:opacity-60"
          />
          {status === 'correct' ? (
            <span className="text-emerald-500 font-bold flex items-center gap-1">
              <CheckCircle2 className="w-5 h-5" /> [{step.array!.join(', ')}]
            </span>
          ) : (
            <button
              type="button"
              onClick={check}
              disabled={input.trim() === ''}
              className="px-4 py-2 bg-purple-600 text-white rounded-xl font-semibold disabled:opacity-40"
            >
              Prüfen
            </button>
          )}
        </div>
      )}

      {step.kind === 'text' && (
        <div className="flex flex-col sm:flex-row gap-2 items-start">
          <input
            ref={inputRef}
            type="text"
            disabled={status === 'correct'}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onBlur={check}
            placeholder="Antwort eingeben"
            className="flex-grow px-3 py-2 bg-theme-input border border-theme-border rounded-xl text-theme-primary font-semibold disabled:opacity-60"
          />
          {status === 'correct' ? (
            <span className="text-emerald-500 font-bold flex items-center gap-1">
              <CheckCircle2 className="w-5 h-5" /> {step.answer}
            </span>
          ) : (
            <button
              type="button"
              onClick={check}
              disabled={input.trim() === ''}
              className="px-4 py-2 bg-purple-600 text-white rounded-xl font-semibold disabled:opacity-40"
            >
              Prüfen
            </button>
          )}
        </div>
      )}

      {status === 'incorrect' && (
        <div className="mt-2 flex items-center gap-2 text-rose-500 text-sm font-semibold">
          <XCircle className="w-4 h-4" /> Nicht korrekt.
          {!showSolution && (
            <button type="button" onClick={() => setShowSolution(true)} className="underline ml-2">
              Lösung zeigen
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default StepTaskRunner;
