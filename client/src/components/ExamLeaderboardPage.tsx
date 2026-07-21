import React, { useState, useEffect, useCallback } from 'react';
import { Trophy, ArrowLeft } from 'lucide-react';
import { API_BASE } from '../config';

interface ExamLeaderboardEntry {
  username: string;
  displayName: string;
  profilePic?: string;
  avgScorePct: number;
  attemptsCount: number;
  isUser: boolean;
}

interface ExamLeaderboardPageProps {
  onBack: () => void;
}

const MODULES = [
  { id: 'lin_alg', label: 'Lineare Algebra' },
  { id: 'algo_struct', label: 'Algorithmen & Datenstrukturen' },
];

export const ExamLeaderboardPage: React.FC<ExamLeaderboardPageProps> = ({ onBack }) => {
  const [moduleId, setModuleId] = useState<string>('lin_alg');
  const [entries, setEntries] = useState<ExamLeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLeaderboard = useCallback(async (mod: string) => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('auth_token');
      const headers: HeadersInit = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const response = await fetch(`${API_BASE}/api/exam/leaderboard?module=${encodeURIComponent(mod)}`, {
        headers,
      });
      if (response.ok) {
        setEntries(await response.json());
      } else {
        setError('Bestenliste konnte nicht geladen werden.');
      }
    } catch (err) {
      console.error('Exam leaderboard failed:', err);
      setError('Verbindung zum Server fehlgeschlagen.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLeaderboard(moduleId);
  }, [moduleId, fetchLeaderboard]);

  return (
    <div className="animate-fadeIn">
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-sm font-semibold text-theme-muted hover:text-theme-primary transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> Zurück
        </button>
        <h1 className="text-2xl font-bold font-display text-theme-primary flex items-center gap-2">
          <Trophy className="w-6 h-6 text-purple-500" /> Prüfungs-Bestenliste
        </h1>
        <div className="w-16" />
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        {MODULES.map((m) => (
          <button
            key={m.id}
            onClick={() => setModuleId(m.id)}
            className={`px-4 py-2 rounded-xl font-semibold text-sm border transition-all cursor-pointer ${
              moduleId === m.id
                ? 'bg-purple-600 text-white border-purple-600'
                : 'bg-theme-card text-theme-secondary border-theme-border hover:border-purple-400'
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="mb-4 p-3.5 bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 rounded-xl text-sm font-bold">
          {error}
        </div>
      )}

      <div className="glass-panel rounded-3xl p-6">
        {loading ? (
          <div className="text-center py-12 text-theme-muted">Lädt…</div>
        ) : entries.length === 0 ? (
          <div className="text-center py-12 text-theme-muted">
            Noch keine Ergebnisse für dieses Modul.
          </div>
        ) : (
          <div className="space-y-2">
            {entries.map((e, idx) => (
              <div
                key={e.username}
                className={`flex items-center justify-between p-3 rounded-xl border ${
                  e.isUser
                    ? 'bg-purple-500/10 border-purple-500/30'
                    : 'bg-theme-card border-theme-border'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="w-7 text-center font-bold text-theme-muted">{idx + 1}</span>
                  {e.profilePic ? (
                    <img src={e.profilePic} alt={e.displayName} className="w-8 h-8 rounded-full" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-600 dark:text-purple-300 font-bold text-sm">
                      {e.displayName.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span className="font-semibold text-theme-primary">
                    {e.displayName}
                    {e.isUser && <span className="ml-2 text-xs text-purple-500">(du)</span>}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-theme-muted">{e.attemptsCount} Versuche</span>
                  <span className="font-bold text-theme-primary tabular-nums">
                    {e.avgScorePct.toFixed(1)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ExamLeaderboardPage;
