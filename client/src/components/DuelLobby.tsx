import React, { useEffect, useState } from 'react';
import { Swords, Users, Clock, Trophy, ArrowRight, LogOut } from 'lucide-react';
import { useDuelSocket } from '../hooks/useDuelSocket';
import type { UserProfile } from '../types';
import { queueKeyString, DUEL_LIMITS } from '../../../server/src/services/duel/types';

// Module + task metadata (mirrors ModuleSelector.tsx)
const MODULES = [
  {
    id: 'lin_alg',
    name: 'Lineare Algebra',
    abbreviation: 'LA',
    tasks: [
      { id: 'lin_alg_det', name: '2x2 Determinante' },
      { id: 'lin_alg_det3x3', name: '3x3 Determinante (Sarrus)' },
      { id: 'lin_alg_matmul', name: 'Matrizenmultiplikation' },
      { id: 'calc_gl_n_cardinality', name: 'Kardinalität GL_n' },
      { id: 'calc_param_determinant_finite_field', name: 'Determinante mit Parameter' },
      { id: 'calc_poly_mapping_matrix', name: 'Darstellungsmatrix' },
      { id: 'calc_eigenbasis', name: 'Eigenbasis' },
      { id: 'calc_linear_code_parameters', name: 'Parameter linearer Codes' },
    ],
  },
  {
    id: 'os',
    name: 'Betriebssysteme',
    abbreviation: 'BUS',
    tasks: [
      { id: 'os_bus_anki', name: 'BUS Quizfragen' },
      { id: 'os_page_table', name: 'Adressübersetzung' },
    ],
  },
];

const MODE_LABEL = 'Gleiche Aufgabe';

interface DuelLobbyProps {
  user: UserProfile | null;
  onDuelStart: (payload: any) => void;
  onDuelWaiting: (key: any) => void;
  onDuelMatched: (duelId: string) => void;
}

export const DuelLobby: React.FC<DuelLobbyProps> = ({ user, onDuelStart, onDuelWaiting, onDuelMatched }) => {
  const { connected, queueCounts, joinQueue, leaveQueue, on, off } = useDuelSocket();
  const [selectedModule, setSelectedModule] = useState(MODULES[0].id);
  const [selectedTask, setSelectedTask] = useState(MODULES[0].tasks[0].id);
  const [selectedLimit, setSelectedLimit] = useState<number>(5);
  const [inQueue, setInQueue] = useState(false);

  const activeModule = MODULES.find((m) => m.id === selectedModule) || MODULES[0];

  useEffect(() => {
    const handleStart = (payload: any) => {
      setInQueue(false);
      onDuelStart(payload);
    };
    const handleWaiting = (key: any) => {
      setInQueue(true);
      onDuelWaiting(key);
    };
    const handleMatched = (duelId: string) => {
      onDuelMatched(duelId);
    };

    on('duel:start', handleStart);
    on('queue:waiting', handleWaiting);
    on('queue:matched', handleMatched);

    return () => {
      off('duel:start', handleStart);
      off('queue:waiting', handleWaiting);
      off('queue:matched', handleMatched);
    };
  }, [on, off, onDuelStart, onDuelWaiting, onDuelMatched]);

  const handleJoin = () => {
    if (!user) return;
    joinQueue({
      moduleId: selectedModule,
      taskTypeId: selectedTask,
      mode: 'same_task',
      limit: selectedLimit as any,
    });
  };

  const handleLeave = () => {
    leaveQueue();
    setInQueue(false);
  };

  const queueCountFor = (moduleId: string, taskId: string, limit: number) => {
    const key = queueKeyString({ moduleId, taskTypeId: taskId, mode: 'same_task', limit: limit as any });
    return queueCounts[key] || 0;
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-6 animate-fadeIn">
      <div className="text-center mb-8">
        <h2 className="text-3xl md:text-4xl font-extrabold font-display text-theme-primary mb-3 flex items-center justify-center gap-3">
          <Swords className="w-8 h-8 text-purple-600 dark:text-purple-400" /> Duelle
        </h2>
        <p className="text-theme-secondary text-sm md:text-base max-w-xl mx-auto font-medium">
          Tritt einer Warteschlange bei und duelliere dich in Echtzeit mit anderen Spielern.
          Beide lösen dieselbe Aufgabe – wer zuerst {selectedLimit} Aufgaben löst (oder 2 Vorsprung hat) gewinnt.
        </p>
      </div>

      {!user && (
        <div className="glass-panel rounded-2xl p-6 text-center text-theme-muted">
          Du musst angemeldet sein, um Duelle zu spielen.
        </div>
      )}

      {user && (
        <>
          {/* Module selection */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            {MODULES.map((mod) => (
              <button
                key={mod.id}
                onClick={() => {
                  setSelectedModule(mod.id);
                  setSelectedTask(mod.tasks[0].id);
                }}
                className={`p-4 rounded-2xl border text-left transition-all ${
                  selectedModule === mod.id
                    ? 'bg-purple-500/10 border-purple-500/50'
                    : 'bg-theme-card border-theme-border hover:brightness-95 dark:hover:brightness-110'
                }`}
              >
                <span className="font-extrabold font-display text-lg text-theme-primary">{mod.abbreviation}</span>
                <span className="text-xs font-bold text-theme-secondary block mt-0.5">{mod.name}</span>
              </button>
            ))}
          </div>

          {/* Task selection */}
          <div className="glass-panel rounded-2xl p-5 mb-6">
            <h3 className="text-sm font-bold font-display text-theme-primary mb-3 flex items-center gap-2">
              <Trophy className="w-4 h-4 text-purple-600" /> Aufgabentyp wählen
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {activeModule.tasks.map((task) => (
                <button
                  key={task.id}
                  onClick={() => setSelectedTask(task.id)}
                  className={`p-3 rounded-xl border text-left text-sm font-semibold transition-all ${
                    selectedTask === task.id
                      ? 'bg-purple-500/10 border-purple-500/50 text-purple-650 dark:text-purple-400'
                      : 'bg-theme-input border-theme-border text-theme-secondary hover:border-purple-500/40'
                  }`}
                >
                  {task.name}
                </button>
              ))}
            </div>
          </div>

          {/* Limit selection */}
          <div className="glass-panel rounded-2xl p-5 mb-6">
            <h3 className="text-sm font-bold font-display text-theme-primary mb-3 flex items-center gap-2">
              <Clock className="w-4 h-4 text-purple-600" /> Gewinngrenze (Aufgaben)
            </h3>
            <div className="flex gap-2">
              {DUEL_LIMITS.map((limit) => (
                <button
                  key={limit}
                  onClick={() => setSelectedLimit(limit)}
                  className={`flex-1 py-3 rounded-xl border text-center font-bold transition-all ${
                    selectedLimit === limit
                      ? 'bg-purple-600 text-white shadow-md'
                      : 'bg-theme-input border-theme-border text-theme-secondary hover:border-purple-500/40'
                  }`}
                >
                  {limit}
                </button>
              ))}
            </div>
          </div>

          {/* Queue status for this selection */}
          <div className="glass-panel rounded-2xl p-5 mb-6">
            <h3 className="text-sm font-bold font-display text-theme-primary mb-3 flex items-center gap-2">
              <Users className="w-4 h-4 text-purple-600" /> Aktuelle Warteschlangen
            </h3>
            <div className="space-y-2">
              {activeModule.tasks.map((task) => (
                <div key={task.id} className="flex items-center justify-between p-2 rounded-lg bg-theme-input/50">
                  <span className="text-sm font-medium text-theme-secondary">{task.name}</span>
                  <div className="flex gap-2">
                    {DUEL_LIMITS.map((limit) => (
                      <span
                        key={limit}
                        className={`text-xs font-bold px-2 py-1 rounded-full ${
                          selectedTask === task.id && selectedLimit === limit
                            ? 'bg-purple-600 text-white'
                            : 'bg-theme-card border border-theme-border text-theme-muted'
                        }`}
                      >
                        {limit}: {queueCountFor(activeModule.id, task.id, limit)}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs text-theme-muted mt-3">
              Modus: {MODE_LABEL} · Verbindung: {connected ? '🟢 Online' : '🔴 Offline'}
            </p>
          </div>

          {/* Join / Leave button */}
          {!inQueue ? (
            <button
              onClick={handleJoin}
              disabled={!connected}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold text-lg shadow-lg shadow-purple-500/20 hover:shadow-purple-500/40 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              Warteschlange beitreten <ArrowRight className="w-5 h-5" />
            </button>
          ) : (
            <button
              onClick={handleLeave}
              className="w-full py-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 font-bold text-lg hover:bg-red-500/20 transition-all flex items-center justify-center gap-2"
            >
              <LogOut className="w-5 h-5" /> Warteschlange verlassen
            </button>
          )}

          {inQueue && (
            <div className="mt-4 text-center text-theme-secondary font-medium animate-pulse">
              Suche Gegner… ({queueCountFor(selectedModule, selectedTask, selectedLimit)} in dieser Queue)
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default DuelLobby;
