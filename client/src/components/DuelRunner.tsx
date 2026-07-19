import React, { useEffect, useState, useRef } from 'react';
import { MathRenderer, LatexTextRenderer } from './MathRenderer';
import { CheckCircle2, XCircle, HelpCircle, ArrowRight, Swords, Trophy, X, Clock } from 'lucide-react';
import { useDuelSocket } from '../hooks/useDuelSocket';
import { useAuth } from '../hooks/useAuth';
import type { DuelStartPayload, DuelTask, DuelScore, DuelFinished } from '../hooks/useDuelSocket';
import type { UserProfile } from '../types';

/** Returns the per-module Elo value for a user based on the duel's module. */
function getEloForModule(user: UserProfile, moduleId: string): number {
  switch (moduleId) {
    case 'lin_alg': return user.eloLinAlg;
    case 'os': return user.eloOs;
    case 'formal_sys': return user.eloFormalSys;
    case 'algo_struct': return user.eloAlgoStruct;
    default: return user.elo;
  }
}

interface DuelRunnerProps {
  startPayload: DuelStartPayload;
  onExit: () => void;
}

export const DuelRunner: React.FC<DuelRunnerProps> = ({ startPayload, onExit }) => {
  const { submitAnswer, on, off } = useDuelSocket();
  const { user } = useAuth();
  const [countdown, setCountdown] = useState<number | null>(null);
  const [task, setTask] = useState<DuelTask | null>(null);
  const [userAnswer, setUserAnswer] = useState<string>('');
  const [status, setStatus] = useState<'idle' | 'correct' | 'incorrect'>('idle');
  const [cooldown, setCooldown] = useState<number>(0);
  const [scores, setScores] = useState<DuelScore[]>([]);
  const [finished, setFinished] = useState<DuelFinished | null>(null);
  const [showSolution, setShowSolution] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleCountdown = (n: number) => {
      setCountdown(n);
      if (n === 0) {
        setTimeout(() => setCountdown(null), 600);
      }
    };
    const handleTask = (t: DuelTask) => {
      setTask(t);
      setUserAnswer('');
      setStatus('idle');
      setShowSolution(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    };
    const handleScore = (payload: { scores: DuelScore[] }) => setScores(payload.scores);
    const handleFinished = (f: DuelFinished) => setFinished(f);
    const handleAnswerResult = (r: { correct: boolean }) => {
      if (r.correct) {
        setStatus('correct');
      } else {
        setStatus('incorrect');
        setCooldown(5);
        setTimeout(() => setStatus('idle'), 800);
      }
    };

    on('duel:countdown', handleCountdown);
    on('duel:task', handleTask);
    on('duel:score', handleScore);
    on('duel:finished', handleFinished);
    on('duel:answer_result', handleAnswerResult);

    return () => {
      off('duel:countdown', handleCountdown);
      off('duel:task', handleTask);
      off('duel:score', handleScore);
      off('duel:finished', handleFinished);
      off('duel:answer_result', handleAnswerResult);
    };
  }, [on, off]);

  // Cooldown timer: counts down from 5 after a wrong answer
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!task || userAnswer.trim() === '' || status === 'correct' || finished || cooldown > 0) return;
    submitAnswer(userAnswer);
    setUserAnswer('');
  };

  const opponentScoreObj = scores.find((s) => s.userId === startPayload.opponent.userId);
  const myScoreObj = scores.find((s) => s.userId !== startPayload.opponent.userId);

  if (finished) {
    const iWon = finished.winnerId !== startPayload.opponent.userId;
    const myEloChange = finished.eloChanges[
      iWon ? Object.keys(finished.eloChanges).find((k) => k !== startPayload.opponent.userId) || '' : startPayload.opponent.userId
    ] ?? 0;
    return (
      <div className="w-full max-w-2xl mx-auto px-4 py-10 animate-fadeIn text-center">
        <div className={`glass-panel rounded-3xl p-8 ${iWon ? 'border-emerald-500/40' : 'border-red-500/40'}`}>
          <Trophy className={`w-16 h-16 mx-auto mb-4 ${iWon ? 'text-emerald-500' : 'text-red-500'}`} />
          <h2 className="text-3xl font-extrabold font-display text-theme-primary mb-2">
            {iWon ? 'Du hast gewonnen!' : 'Du hast verloren'}
          </h2>
          <p className="text-theme-secondary mb-6">
            {finished.winnerUsername} schlägt {finished.loserUsername}
          </p>
          <p className={`text-sm font-bold mb-6 ${myEloChange >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
            Elo: {myEloChange >= 0 ? '+' : ''}{myEloChange}
          </p>
          <button
            onClick={onExit}
            className="px-6 py-3 rounded-xl bg-purple-600 text-white font-bold hover:bg-purple-700 transition-all"
          >
            Zurück zur Lobby
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-3xl mx-auto px-4 py-6 animate-fadeIn">
      {/* Score header */}
      <div className="glass-panel rounded-2xl p-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="text-center flex-1">
            <div className="text-xs font-bold text-theme-muted">DU</div>
            <div className="text-3xl font-extrabold font-display text-purple-600 dark:text-purple-400">
              {myScoreObj?.score ?? 0}
            </div>
            <div className="text-xs text-theme-muted font-semibold mt-0.5">
              {user ? `Elo ${getEloForModule(user, startPayload.moduleId)}` : ''}
            </div>
          </div>
          <div className="text-center px-4">
            <Swords className="w-6 h-6 text-theme-muted mx-auto mb-1" />
            <span className="text-xs font-bold text-theme-muted">bis {startPayload.limit}</span>
          </div>
          <div className="text-center flex-1">
            <div className="text-xs font-bold text-theme-muted">{startPayload.opponent.username.toUpperCase()}</div>
            <div className="text-3xl font-extrabold font-display text-indigo-600 dark:text-indigo-400">
              {opponentScoreObj?.score ?? 0}
            </div>
            <div className="text-xs text-theme-muted font-semibold mt-0.5">
              Elo {startPayload.opponent.elo}
            </div>
          </div>
        </div>
      </div>

      {/* Countdown overlay */}
      {countdown !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="text-center">
            <div className="text-8xl font-extrabold font-display text-white animate-pulse">
              {countdown === 0 ? 'GO!' : countdown}
            </div>
            <p className="text-white/80 mt-4 font-bold">Das Duell beginnt…</p>
          </div>
        </div>
      )}

      {/* Task */}
      {task && countdown === null && !finished && (
        <div className="glass-panel rounded-3xl p-6 md:p-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold font-display text-theme-primary flex items-center gap-2">
              <Swords className="w-5 h-5 text-purple-600" /> Aufgabe
            </h3>
            <button
              onClick={() => setShowSolution(!showSolution)}
              className="text-xs font-bold text-theme-muted hover:text-theme-primary flex items-center gap-1"
            >
              <HelpCircle className="w-4 h-4" /> Lösung
            </button>
          </div>

          {task.task.prompt && (
            <p className="text-theme-secondary text-sm mb-3 font-medium">
              <LatexTextRenderer text={task.task.prompt} />
            </p>
          )}

          <div className="bg-theme-input rounded-2xl p-6 mb-4 overflow-x-auto">
            <MathRenderer math={task.task.mathQuery} />
          </div>

          {task.task.options ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
              {task.task.options.map((opt, i) => (
                <button
                  key={i}
                  onClick={() => submitAnswer(opt)}
                  disabled={status === 'correct' || cooldown > 0}
                  className="p-3 rounded-xl border border-theme-border bg-theme-card text-theme-primary font-semibold hover:border-purple-500/40 transition-all disabled:opacity-50"
                >
                  <LatexTextRenderer text={opt} />
                </button>
              ))}
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={userAnswer}
                onChange={(e) => setUserAnswer(e.target.value)}
                placeholder={task.task.inputHint || 'Antwort eingeben…'}
                disabled={status === 'correct' || cooldown > 0}
                className="flex-1 px-4 py-3 rounded-xl border border-theme-border bg-theme-input text-theme-primary font-semibold focus:outline-none focus:border-purple-500/50 disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={status === 'correct' || userAnswer.trim() === '' || cooldown > 0}
                className="px-5 py-3 rounded-xl bg-purple-600 text-white font-bold hover:bg-purple-700 transition-all disabled:opacity-50 flex items-center gap-1"
              >
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {status === 'correct' && (
            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-455 font-bold mt-3 animate-fadeIn">
              <CheckCircle2 className="w-5 h-5" /> Richtig! Nächste Aufgabe…
            </div>
          )}
          {status === 'incorrect' && (
            <div className="flex items-center gap-2 text-red-600 dark:text-red-455 font-bold mt-3 animate-fadeIn">
              <XCircle className="w-5 h-5" /> Falsch, versuch's nochmal
            </div>
          )}
          {cooldown > 0 && (
            <div className="flex items-center gap-2 text-orange-600 dark:text-orange-455 font-bold mt-3 animate-fadeIn">
              <Clock className="w-5 h-5" /> {cooldown}s Sperre – keine Antwort möglich
            </div>
          )}

          {showSolution && task.task.explanation && (
            <div className="mt-4 p-4 rounded-xl bg-theme-input/60 border border-theme-border">
              <div className="text-xs font-bold text-theme-muted mb-2">Lösung:</div>
              {task.task.explanation.map((step, i) => (
                <div key={i} className="mb-2 overflow-x-auto">
                  <MathRenderer math={step} />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {!task && countdown === null && (
        <div className="text-center text-theme-muted py-10">Warte auf die erste Aufgabe…</div>
      )}

      <button
        onClick={onExit}
        className="mt-4 w-full py-3 rounded-xl bg-theme-card border border-theme-border text-theme-secondary font-bold hover:brightness-95 transition-all flex items-center justify-center gap-2"
      >
        <X className="w-4 h-4" /> Duell aufgeben
      </button>
    </div>
  );
};

export default DuelRunner;
