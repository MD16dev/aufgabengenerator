import { RefreshCw } from 'lucide-react';
import type { LeaderboardItem, LeaderboardFilterType } from '../types';
import { LEADERBOARD_MODULE_TASKS } from '../hooks/useLeaderboard';

interface LeaderboardPageProps {
  leaderboard: LeaderboardItem[];
  loading: boolean;
  filter: LeaderboardFilterType;
  setFilter: (f: LeaderboardFilterType) => void;
  moduleFilter: string;
  setModuleFilter: (m: string) => void;
  taskFilter: string;
  setTaskFilter: (t: string) => void;
  taskModuleFilter: string;
  setTaskModuleFilter: (m: string) => void;
}

const FILTERS: { value: LeaderboardFilterType; label: string }[] = [
  { value: 'global', label: 'Gesamt' },
  { value: 'module', label: 'Modul' },
  { value: 'task', label: 'Aufgabe' },
];

const MODULES: { value: string; label: string }[] = [
  { value: 'Lineare Algebra', label: 'LA' },
  { value: 'Betriebssysteme', label: 'BUS' },
  { value: 'Formale Systeme', label: 'FOSAP' },
  { value: 'Algorithmen & Datenstrukturen', label: 'DSAL' },
];

// Map a full module name to its abbreviation (used in the Aufgabe tab).
const MODULE_ABBR: Record<string, string> = Object.fromEntries(
  MODULES.map((m) => [m.value, m.label])
);

export const LeaderboardPage: React.FC<LeaderboardPageProps> = ({
  leaderboard, loading, filter, setFilter,
  moduleFilter, setModuleFilter, taskFilter, setTaskFilter,
  taskModuleFilter, setTaskModuleFilter,
}) => {
  const activeIndex = FILTERS.findIndex((f) => f.value === filter);
  const taskModule = LEADERBOARD_MODULE_TASKS.find((m) => m.module === taskModuleFilter);

  return (
    <div className="w-full max-w-2xl mx-auto px-4 animate-fadeIn" id="leaderboard-ranking-panel">
      <div className="relative glass-panel rounded-3xl p-6 md:p-8">
        {/* Layout-independent loading indicator: absolutely positioned so it never
            shifts the header or list and therefore cannot cause flicker. */}
        <div
          className={`absolute top-0 left-0 h-0.5 rounded-t-3xl bg-purple-500 transition-opacity duration-200 ${
            loading ? 'opacity-100' : 'opacity-0'
          }`}
          style={{ width: '40%' }}
          aria-hidden="true"
        />

        <div className="relative flex items-center justify-between mb-2">
          <h2 className="text-2xl font-bold font-display text-theme-primary">Bestenliste</h2>
          {/* Spinner is absolutely positioned -> no layout shift, no wackeln. */}
          {loading && leaderboard.length > 0 && (
            <RefreshCw className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-500 animate-spin" />
          )}
        </div>
        <p className="text-theme-secondary text-sm mb-6">Messe dich mit deinen Kommilitonen.</p>

        {/* Segmented control for the leaderboard type */}
        <div className="relative flex p-1 mb-4 bg-theme-input border border-theme-border rounded-2xl">
          <span
            className="absolute top-1 bottom-1 rounded-xl bg-purple-500/15 border border-purple-500/30 transition-transform duration-300 ease-out"
            style={{
              width: 'calc((100% - 0.5rem) / 3)',
              transform: `translateX(${activeIndex * 100}%)`,
            }}
          />
          {FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => setFilter(f.value)}
              className={`relative z-10 flex-1 px-3 py-2 text-sm font-semibold rounded-xl transition-colors ${
                filter === f.value
                  ? 'text-purple-600 dark:text-purple-400'
                  : 'text-theme-muted hover:text-theme-secondary'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Contextual chip selectors. Collapsing uses the CSS-grid trick
            (grid-rows 1fr/0fr) which reliably collapses height to 0 and, combined
            with pointer-events-none, prevents the hidden section from overlapping
            and intercepting clicks on the visible one. */}
        <div className="overflow-hidden">
          {/* Module chips stay visible for BOTH the "Modul" and "Aufgabe" tabs so
              that switching between those two tabs only animates the task row in
              and out (smooth), instead of collapsing/expanding the module row too.
              They are hidden only on the "Gesamt" tab. */}
          <div
            className={`grid transition-all duration-300 ease-out ${
              filter === 'module' || filter === 'task'
                ? 'grid-rows-[1fr] opacity-100 mb-4'
                : 'grid-rows-[0fr] opacity-0 pointer-events-none'
            }`}
          >
            <div className="overflow-hidden">
              <div className="flex flex-wrap gap-2">
                {MODULES.map((m) => (
                  <button
                    key={m.value}
                    type="button"
                    onClick={() => setModuleFilter(m.value)}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                      moduleFilter === m.value
                        ? 'bg-purple-500/15 border-purple-500/40 text-purple-600 dark:text-purple-400'
                        : 'bg-theme-card border-theme-border text-theme-muted hover:text-theme-secondary hover:border-theme-muted/40'
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Task filter: first pick a module (abbreviated), then a task within it */}
          <div
            className={`grid transition-all duration-300 ease-out ${
              filter === 'task' ? 'grid-rows-[1fr] opacity-100 mb-4' : 'grid-rows-[0fr] opacity-0 pointer-events-none'
            }`}
          >
            <div className="overflow-hidden">
              <div className="flex flex-col gap-3">
                <div className="flex flex-wrap gap-2">
                  {LEADERBOARD_MODULE_TASKS.map((m) => (
                    <button
                      key={m.module}
                      type="button"
                      onClick={() => {
                        setTaskModuleFilter(m.module);
                        if (m.tasks[0]) setTaskFilter(m.tasks[0].id);
                      }}
                      className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                        taskModuleFilter === m.module
                          ? 'bg-purple-500/15 border-purple-500/40 text-purple-600 dark:text-purple-400'
                          : 'bg-theme-card border-theme-border text-theme-muted hover:text-theme-secondary hover:border-theme-muted/40'
                      }`}
                    >
                      {MODULE_ABBR[m.module] ?? m.module}
                    </button>
                  ))}
                </div>
                <div className="flex flex-wrap gap-2">
                  {taskModule?.tasks.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setTaskFilter(t.id)}
                      className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                        taskFilter === t.id
                          ? 'bg-purple-500/15 border-purple-500/40 text-purple-600 dark:text-purple-400'
                          : 'bg-theme-card border-theme-border text-theme-muted hover:text-theme-secondary hover:border-theme-muted/40'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* The list stays mounted with the previous data during a refetch and is
            simply swapped in place when new data arrives -> no flicker, no dim.
            The loading state is shown ONLY via the absolutely-positioned top bar
            and corner spinner above. We must NOT render a separate spinner block
            here: when the previous list was empty, that block would briefly resize
            the panel (taller spinner) and then collapse again -> the "flicker".
            A FIXED height (not min-height) keeps the panel stable when switching
            between a populated list and the empty-state message: a populated list
            can be much taller than the empty state, so min-height would still let
            the panel shrink/grow on tab switch -> flicker. With a fixed height the
            panel never resizes; long lists scroll internally. */}
        <div className="h-[28rem]">
          {leaderboard.length > 0 ? (
            <div className="h-full overflow-y-auto space-y-2.5 pr-1">
              {leaderboard.map((item, index) => (
                <LeaderboardRow key={index} item={item} rank={index} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-theme-muted text-sm">
              Keine Einträge für diese Filter-Auswahl vorhanden. Löse Aufgaben, um hier zu erscheinen!
            </div>
          )}
        </div>
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
