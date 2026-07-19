import React, { useState, useEffect, useRef } from 'react';
import { CheckCircle2, XCircle, HelpCircle, ArrowRight, RefreshCw, ArrowLeft, Lock } from 'lucide-react';
import { API_BASE } from '../config';

interface PageTableEntry {
  index: number;
  value: string;
  present: boolean;
}

interface PageTable {
  address: string;
  level: number;
  entries: PageTableEntry[];
}

interface TaskData {
  type: string;
  prompt: string;
  answer: string;
  addressAnswer: string;
  permissionReadAnswer: string;
  permissionWriteAnswer: string;
  explanation: string[];
  tables: PageTable[];
}

interface PageTableTaskRunnerProps {
  taskType: string;
  user: { id: string; username: string } | null;
  onSolved: () => void;
  onBackToSelector: () => void;
}

export const PageTableTaskRunner: React.FC<PageTableTaskRunnerProps> = ({
  taskType,
  user,
  onSolved,
  onBackToSelector,
}) => {
  const [task, setTask] = useState<TaskData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  const [userAddress, setUserAddress] = useState<string>('');
  const [userReadPermission, setUserReadPermission] = useState<string>('');
  const [userWritePermission, setUserWritePermission] = useState<string>('');
  
  const [status, setStatus] = useState<'idle' | 'correct' | 'incorrect'>('idle');
  const [showSolution, setShowSolution] = useState<boolean>(false);
  const [isLocked, setIsLocked] = useState<boolean>(false);

  const [localScore, setLocalScore] = useState<number>(() => {
    const saved = localStorage.getItem('aufgabengenerator_score');
    return saved ? parseInt(saved, 10) : 0;
  });

  const addressInputRef = useRef<HTMLInputElement>(null);

  const fetchTask = async () => {
    try {
      setLoading(true);
      setError(null);
      setUserAddress('');
      setUserReadPermission('');
      setUserWritePermission('');
      setStatus('idle');
      setShowSolution(false);
      setIsLocked(false);

      const response = await fetch(`${API_BASE}/api/tasks/${taskType}`);
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data?.error?.message || 'Fehler beim Abrufen der Aufgabe');
      }

      const data = await response.json();
      setTask(data);

      setTimeout(() => {
        addressInputRef.current?.focus();
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
    if (!task || !userAddress.trim() || !userReadPermission.trim() || !userWritePermission.trim() || isLocked) return;

    const normalizedUserAddress = userAddress.trim().toLowerCase().replace(/^0x/, '');
    const normalizedCorrectAddress = task.addressAnswer.trim().toLowerCase().replace(/^0x/, '');

    const addressIsCorrect = normalizedUserAddress === normalizedCorrectAddress;
    const readIsCorrect = userReadPermission.trim() === task.permissionReadAnswer;
    const writeIsCorrect = userWritePermission.trim() === task.permissionWriteAnswer;

    if (addressIsCorrect && readIsCorrect && writeIsCorrect) {
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
    } else {
      setStatus('incorrect');
    }
  };

  const handleRevealSolution = () => {
    setShowSolution(true);
    setIsLocked(true);
  };

  const levelLabels = ['Page Directory (L1)', 'Page Table (L2)'];

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-8 animate-fadeIn" id="pagetable-task-solver">
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
            <p className="text-theme-muted text-sm font-semibold">Seitentabellen werden generiert...</p>
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
          <div>
            <div className="flex justify-between items-center mb-6">
              <span className="text-xs font-bold uppercase tracking-wider px-3 py-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-full border border-emerald-500/25">
                {task.type}
              </span>
            </div>

            {task.prompt && (
              <h2 className="text-xl font-bold text-theme-primary mb-6 leading-snug">
                {task.prompt}
              </h2>
            )}

            {/* Grid of 8 Page Tables (4 per row on large screens) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 my-8">
              {task.tables.map((table, tIdx) => (
                <div key={tIdx} className="bg-theme-card border border-theme-border rounded-2xl p-4 flex flex-col justify-between shadow-sm hover:border-emerald-500/30 transition-all">
                  <div>
                    <div className="flex justify-between items-center border-b border-theme-border pb-2 mb-3">
                      <span className="text-xs font-extrabold text-theme-primary">
                        Tabelle {tIdx + 1}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 bg-theme-input rounded-full text-theme-secondary border border-theme-border">
                        {levelLabels[table.level - 1]}
                      </span>
                    </div>

                    <table className="w-full text-xs">
                      <thead>
                        <tr className="text-theme-muted font-bold text-left border-b border-theme-border/50">
                          <th className="pb-1.5 w-1/3">Index</th>
                          <th className="pb-1.5 w-2/3 text-right">Eintrag (PTE)</th>
                        </tr>
                      </thead>
                      <tbody className="font-mono divide-y divide-theme-border/30">
                        {table.entries.map((entry, eIdx) => (
                          <tr key={eIdx} className={`${entry.present ? 'text-theme-primary' : 'text-theme-muted/50'}`}>
                            <td className="py-1">{entry.index}</td>
                            <td className="py-1 text-right">{entry.value}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Table Base Address displayed below the table */}
                  <div className="mt-4 pt-2 border-t border-theme-border/50 text-center">
                    <span className="text-[10px] text-theme-muted block font-semibold uppercase tracking-wider mb-1">
                      Basisadresse:
                    </span>
                    <span className="inline-block px-3 py-1 bg-theme-input rounded-lg border border-theme-border font-mono font-bold text-xs text-emerald-600 dark:text-emerald-400">
                      {table.address}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Answer Form */}
            <form onSubmit={handleSubmit} className="space-y-6 mt-8 max-w-2xl">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Physical Address Input */}
                <div>
                  <label htmlFor="address-input" className="block text-sm font-bold text-theme-secondary mb-2">
                    Phys. Zieladresse (Hex):
                  </label>
                  <input
                    id="address-input"
                    ref={addressInputRef}
                    type="text"
                    disabled={status === 'correct' || isLocked}
                    value={userAddress}
                    onChange={(e) => setUserAddress(e.target.value)}
                    placeholder="z.B. 0xef2e5329"
                    className="w-full px-4 py-3 bg-theme-input border border-theme-border rounded-xl text-theme-primary placeholder-theme-muted focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all font-mono font-bold text-lg disabled:opacity-60 disabled:cursor-not-allowed"
                    required
                  />
                </div>

                {/* Read Permission Input */}
                <div>
                  <label htmlFor="read-perm-input" className="block text-sm font-bold text-theme-secondary mb-2">
                    Lesezugriff (Binär):
                  </label>
                  <input
                    id="read-perm-input"
                    type="text"
                    disabled={status === 'correct' || isLocked}
                    value={userReadPermission}
                    onChange={(e) => setUserReadPermission(e.target.value)}
                    placeholder="1 oder 0"
                    className="w-full px-4 py-3 bg-theme-input border border-theme-border rounded-xl text-theme-primary placeholder-theme-muted focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all font-mono font-bold text-lg disabled:opacity-60 disabled:cursor-not-allowed text-center"
                    required
                  />
                </div>

                {/* Write Permission Input */}
                <div>
                  <label htmlFor="write-perm-input" className="block text-sm font-bold text-theme-secondary mb-2">
                    Schreibzugriff (Binär):
                  </label>
                  <input
                    id="write-perm-input"
                    type="text"
                    disabled={status === 'correct' || isLocked}
                    value={userWritePermission}
                    onChange={(e) => setUserWritePermission(e.target.value)}
                    placeholder="1 oder 0"
                    className="w-full px-4 py-3 bg-theme-input border border-theme-border rounded-xl text-theme-primary placeholder-theme-muted focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all font-mono font-bold text-lg disabled:opacity-60 disabled:cursor-not-allowed text-center"
                    required
                  />
                </div>
              </div>

              {/* Submission controls */}
              <div className="flex flex-col sm:flex-row gap-3">
                {status === 'idle' && !isLocked ? (
                  <button
                    type="submit"
                    disabled={!userAddress.trim() || !userReadPermission.trim() || !userWritePermission.trim()}
                    className="w-full sm:w-auto px-6 py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:from-emerald-800 disabled:to-teal-800 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all shadow-lg hover:shadow-emerald-500/25 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    Antwort prüfen
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={fetchTask}
                    className="w-full sm:w-auto px-6 py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold rounded-xl transition-all shadow-lg hover:shadow-emerald-500/25 flex items-center justify-center gap-2 cursor-pointer animate-fadeIn"
                  >
                    Nächste Aufgabe <ArrowRight className="w-5 h-5" />
                  </button>
                )}
              </div>
            </form>

            {/* Answer verification feedback */}
            {status === 'incorrect' && (
              <div className="mt-4 p-3.5 bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 rounded-xl text-sm font-bold flex items-start gap-2.5 animate-fadeIn">
                <XCircle className="w-5 h-5 text-rose-500 dark:text-rose-400 shrink-0 mt-0.5" />
                <div>
                  Leider nicht korrekt. Vergewissere dich, dass du den L1- und L2-Index korrekt aus der virtuellen Adresse bestimmt hast, dem Pfad gefolgt bist und den Offset auf die physikalische Frame-Adresse addiert hast! (Lesezugriff ist immer 1).
                </div>
              </div>
            )}
            {status === 'correct' && (
              <div className="mt-4 p-3.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-xl text-sm font-bold flex items-start gap-2.5 animate-fadeIn">
                <CheckCircle2 className="w-5 h-5 text-emerald-500 dark:text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  Korrekt! Die Adressübersetzung war erfolgreich. Klicke auf "Nächste Aufgabe", um fortzufahren.
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

            {/* Reveal Solution / Skip Buttons */}
            <div className="flex flex-wrap justify-between items-center gap-3 mt-8 pt-6 border-t border-theme-border">
              <button
                type="button"
                onClick={handleRevealSolution}
                disabled={showSolution}
                className={`flex items-center gap-2 text-sm font-semibold transition-colors cursor-pointer ${
                  showSolution ? 'text-emerald-600 dark:text-emerald-400' : 'text-theme-muted hover:text-emerald-600'
                }`}
              >
                <HelpCircle className="w-4 h-4" />
                {showSolution ? 'Lösung angezeigt' : 'Rechenweg anzeigen'}
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

            {/* Step by step explanation rendering */}
            {showSolution && task.explanation && (
              <div className="mt-6 p-5 bg-theme-card border border-theme-border rounded-2xl animate-fadeIn">
                <h3 className="text-sm font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-4">
                  Rechenweg:
                </h3>
                <div className="space-y-3 text-theme-secondary text-sm md:text-base">
                  {task.explanation.map((step, idx) => (
                    <div key={idx} className="pb-3 last:pb-0 border-b last:border-0 border-theme-border text-left">
                      <p dangerouslySetInnerHTML={{ __html: step.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
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

export default PageTableTaskRunner;
