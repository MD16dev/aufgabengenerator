import { RefreshCw, Trophy, Zap } from 'lucide-react';
import { ModuleSelector } from './ModuleSelector';
import { GenericTaskRunner } from './GenericTaskRunner';
import { BusTaskRunner } from './BusTaskRunner';
import { PageTableTaskRunner } from './PageTableTaskRunner';
import { LEADERBOARD_MODULE_TASKS } from '../hooks/useLeaderboard';
import type { LeaderboardItem } from '../types';

// Flat lookup of task id -> human-readable label, derived from the shared
// module/task mapping so the side leaderboard shows the correct task type.
const TASK_LABELS: Record<string, string> = Object.fromEntries(
  LEADERBOARD_MODULE_TASKS.flatMap((m) => m.tasks.map((t) => [t.id, t.label])),
);

interface TasksPageProps {
  activeTaskId: string | null;
  activeModuleId: string;
  setActiveModuleId: (id: string) => void;
  setActiveTaskId: (id: string | null) => void;
  user: { id: string; username: string } | null;
  sideLeaderboard: LeaderboardItem[];
  loadingSideLeaderboard: boolean;
  onSolved: () => void;
}

const MODULE_LABELS: Record<string, string> = {
  lin_alg: 'LA - Lineare Algebra',
  os: 'BUS - Betriebssysteme',
  formal_sys: 'FOSAP - Formale Systeme',
  algo_struct: 'DSAL - Algorithmen & Datenstrukturen',
};

const TASK_LABELS: Record<string, string> = {
  lin_alg_det: '2x2 Determinante',
  lin_alg_det3x3: '3x3 Determinante (Sarrus)',
  lin_alg_matmul: 'Matrizenmultiplikation',
  calc_gl_n_cardinality: 'Kardinalität von GL_n(F_p)',
  calc_param_determinant_finite_field: 'Determinante mit Parameter (F_p)',
  calc_poly_mapping_matrix: 'Darstellungsmatrix (Polynomräume)',
  calc_eigenbasis: 'Eigenbasis berechnen',
  calc_linear_code_parameters: 'Parameter linearer Codes',
  os_bus_anki: 'BUS Quizfragen',
  os_page_table: 'Adressübersetzung',
};

export const TasksPage: React.FC<TasksPageProps> = ({
  activeTaskId, activeModuleId, setActiveModuleId, setActiveTaskId,
  user, sideLeaderboard, loadingSideLeaderboard, onSolved,
}) => {
  return (
    <div className="w-full max-w-6xl mx-auto flex flex-col lg:flex-row gap-6 items-stretch animate-fadeIn" id="tasks-split-layout">
      <div className="flex-grow flex items-center justify-center">
        {activeTaskId === 'os_bus_anki' ? (
          <BusTaskRunner
            taskType={activeTaskId}
            user={user}
            onSolved={onSolved}
            onBackToSelector={() => setActiveTaskId(null)}
          />
        ) : activeTaskId === 'os_page_table' ? (
          <PageTableTaskRunner
            taskType={activeTaskId}
            user={user}
            onSolved={onSolved}
            onBackToSelector={() => setActiveTaskId(null)}
          />
        ) : activeTaskId ? (
          <GenericTaskRunner
            taskType={activeTaskId}
            user={user}
            onSolved={onSolved}
            onBackToSelector={() => setActiveTaskId(null)}
          />
        ) : (
          <ModuleSelector
            activeModule={activeModuleId}
            onActiveModuleChange={setActiveModuleId}
            onSelectTask={(taskId) => setActiveTaskId(taskId)}
          />
        )}
      </div>

      <div className="w-full lg:w-[350px] shrink-0">
        <div className="glass-panel rounded-3xl p-5 h-full flex flex-col justify-between min-h-[400px]">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Trophy className="w-4 h-4 text-purple-650" />
              <h3 className="font-bold font-display text-sm text-theme-primary">
                {activeTaskId ? 'Aufgaben-Rangliste' : 'Fach-Rangliste'}
              </h3>
            </div>
            <span className="text-[10px] font-bold text-theme-muted block mb-4 uppercase tracking-wider border-b border-theme-border pb-2">
              {activeTaskId ? `Typ: ${TASK_LABELS[activeTaskId] || activeTaskId}` : `Modul: ${MODULE_LABELS[activeModuleId] || 'LA - Lineare Algebra'}`}
            </span>

            {loadingSideLeaderboard ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <RefreshCw className="w-6 h-6 text-purple-500 animate-spin" />
                <p className="text-[10px] text-theme-muted">Rangliste wird geladen...</p>
              </div>
            ) : sideLeaderboard.length > 0 ? (
              <div className="space-y-2 max-h-[450px] overflow-y-auto pr-1">
                {sideLeaderboard.map((item, idx) => (
                  <LeaderboardRow key={idx} item={item} rank={idx} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-theme-muted text-xs">
                Noch keine Einträge vorhanden. Löse Aufgaben, um hier zu erscheinen!
              </div>
            )}
          </div>
          <div className="mt-4 pt-3 border-t border-theme-border flex items-center gap-1.5 text-[10px] text-theme-muted font-medium">
            <Zap className="w-3.5 h-3.5 text-purple-500 animate-pulse" />
            <span>Aktualisiert sich live beim Lösen!</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const LeaderboardRow: React.FC<{ item: LeaderboardItem; rank: number }> = ({ item, rank }) => {
  const rankStyle =
    rank === 0 ? 'bg-amber-500/20 text-amber-600 dark:text-amber-455' :
    rank === 1 ? 'bg-theme-card border border-theme-border text-theme-secondary font-bold' :
    rank === 2 ? 'bg-amber-700/20 text-amber-800 dark:text-amber-600' :
    'bg-theme-card border border-theme-border/50 text-theme-muted font-bold';

  return (
    <div
      className={`flex items-center justify-between p-3 rounded-xl border text-xs transition-all ${
        item.isUser ? 'bg-purple-500/10 dark:bg-purple-500/15 border-purple-500/35' : 'bg-theme-card border-theme-border'
      }`}
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <span className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] shrink-0 ${rankStyle}`}>{rank + 1}</span>
        <div className="w-7 h-7 rounded-lg bg-purple-500/10 flex items-center justify-center overflow-hidden border border-theme-border shrink-0">
          {item.profilePic ? (
            <img src={item.profilePic} className="w-full h-full object-cover" alt="" />
          ) : (
            <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400 uppercase">{item.displayName.substring(0, 2)}</span>
          )}
        </div>
        <div className="truncate">
          <span className="font-bold text-theme-primary block truncate">{item.displayName}</span>
          <span className="block text-[9px] text-theme-muted truncate">@{item.username}</span>
        </div>
      </div>
      <div className="flex items-center gap-1 shrink-0 font-extrabold text-theme-primary ml-2">
        <span>{item.solvedCount}</span>
        <span className="text-[10px] text-theme-muted font-normal">pts</span>
      </div>
    </div>
  );
};

export default TasksPage;
