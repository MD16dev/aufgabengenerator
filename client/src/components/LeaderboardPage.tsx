import { RefreshCw } from 'lucide-react';
import type { LeaderboardItem, LeaderboardFilterType } from '../types';

interface LeaderboardPageProps {
  leaderboard: LeaderboardItem[];
  loading: boolean;
  filter: LeaderboardFilterType;
  setFilter: (f: LeaderboardFilterType) => void;
  moduleFilter: string;
  setModuleFilter: (m: string) => void;
  taskFilter: string;
  setTaskFilter: (t: string) => void;
}

export const LeaderboardPage: React.FC<LeaderboardPageProps> = ({
  leaderboard, loading, filter, setFilter,
  moduleFilter, setModuleFilter, taskFilter, setTaskFilter,
}) => {
  return (
    <div className="w-full max-w-2xl mx-auto px-4 animate-fadeIn" id="leaderboard-ranking-panel">
      <div className="glass-panel rounded-3xl p-6 md:p-8">
        <h2 className="text-2xl font-bold font-display text-theme-primary mb-2">Bestenliste</h2>
        <p className="text-theme-secondary text-sm mb-6">Messe dich mit deinen Kommilitonen.</p>

        <div className="flex flex-col sm:flex-row gap-3 mb-6 p-4 bg-theme-card border border-theme-border rounded-2xl">
          <div className="flex-grow">
            <label className="block text-[10px] font-bold text-theme-muted uppercase tracking-wider mb-1">Bestenlisten-Typ</label>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as LeaderboardFilterType)}
              className="w-full px-3 py-2 bg-theme-input border border-theme-border rounded-xl text-theme-primary text-sm font-medium focus:outline-none focus:border-purple-500"
            >
              <option value="global">Gesamte Bestenliste</option>
              <option value="module">Nach Modul</option>
              <option value="task">Nach Aufgabe</option>
            </select>
          </div>
          {filter === 'module' && (
            <div className="flex-grow animate-fadeIn">
              <label className="block text-[10px] font-bold text-theme-muted uppercase tracking-wider mb-1">Wähle Modul</label>
              <select
                value={moduleFilter}
                onChange={(e) => setModuleFilter(e.target.value)}
                className="w-full px-3 py-2 bg-theme-input border border-theme-border rounded-xl text-theme-primary text-sm font-medium focus:outline-none focus:border-purple-500"
              >
                <option value="Lineare Algebra">LA - Lineare Algebra</option>
                <option value="Betriebssysteme">BUS - Betriebssysteme</option>
                <option value="Formale Systeme">FOSAP - Formale Systeme</option>
                <option value="Algorithmen & Datenstrukturen">DSAL - Algorithmen & Datenstrukturen</option>
              </select>
            </div>
          )}
          {filter === 'task' && (
            <div className="flex-grow animate-fadeIn">
              <label className="block text-[10px] font-bold text-theme-muted uppercase tracking-wider mb-1">Wähle Aufgabe</label>
              <select
                value={taskFilter}
                onChange={(e) => setTaskFilter(e.target.value)}
                className="w-full px-3 py-2 bg-theme-input border border-theme-border rounded-xl text-theme-primary text-sm font-medium focus:outline-none focus:border-purple-500"
              >
                <option value="lin_alg_det">2x2 Determinante</option>
              </select>
            </div>
          )}
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            <RefreshCw className="w-8 h-8 text-purple-500 animate-spin" />
            <p className="text-theme-muted text-xs">Bestenliste wird aktualisiert...</p>
          </div>
        ) : leaderboard.length > 0 ? (
          <div className="space-y-2.5">
            {leaderboard.map((item, index) => (
              <LeaderboardRow key={index} item={item} rank={index} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-theme-muted text-sm">
            Keine Einträge für diese Filter-Auswahl vorhanden. Löse Aufgaben, um hier zu erscheinen!
          </div>
        )}
      </div>
    </div>
  );
};

const LeaderboardRow: React.FC<{ item: LeaderboardItem; rank: number }> = ({ item, rank }) => {
  const rankStyle =
    rank === 0 ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/35' :
    rank === 1 ? 'bg-theme-card border border-theme-border text-theme-secondary font-bold' :
    rank === 2 ? 'bg-amber-700/20 text-amber-800 dark:text-amber-600 border border-amber-700/35' :
    'bg-theme-card border border-theme-border text-theme-muted font-bold';

  return (
    <div
      className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${
        item.isUser ? 'bg-purple-500/10 dark:bg-purple-500/15 border-purple-500/35 shadow-sm' : 'bg-theme-card border-theme-border'
      }`}
    >
      <div className="flex items-center gap-4.5">
        <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${rankStyle}`}>{rank + 1}</span>
        <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center overflow-hidden border border-theme-border shrink-0">
          {item.profilePic ? (
            <img src={item.profilePic} className="w-full h-full object-cover" alt="" />
          ) : (
            <span className="text-xs font-bold text-purple-600 dark:text-purple-400 uppercase">{item.displayName.substring(0, 2)}</span>
          )}
        </div>
        <div>
          <span className="font-bold text-theme-primary">{item.displayName}</span>
          <span className="block text-[10px] text-theme-muted font-semibold">@{item.username}</span>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span className="font-extrabold text-theme-primary">{item.solvedCount}</span>
        <span className="text-xs text-theme-muted font-medium">gelöst</span>
      </div>
    </div>
  );
};

export default LeaderboardPage;
