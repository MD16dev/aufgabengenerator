import React from 'react';
import { Binary, Cpu, Network, GitFork, Lock, ArrowRight, BookOpen } from 'lucide-react';

interface ModuleSelectorProps {
  activeModule: string;
  onActiveModuleChange: (moduleId: string) => void;
  onSelectTask: (taskId: string) => void;
}

interface TaskTypeInfo {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
}

interface ModuleInfo {
  id: string;
  name: string;
  abbreviation: string;
  icon: React.ReactNode;
  description: string;
  tasks: TaskTypeInfo[];
}

export const ModuleSelector: React.FC<ModuleSelectorProps> = ({ activeModule, onActiveModuleChange, onSelectTask }) => {

  const modules: ModuleInfo[] = [
    {
      id: 'lin_alg',
      name: 'Lineare Algebra',
      abbreviation: 'LA',
      icon: <Binary className="w-6 h-6 text-purple-600 dark:text-purple-400" />,
      description: 'Matrizen, Determinanten, lineare Gleichungssysteme und Vektorräume.',
      tasks: [
        {
          id: 'lin_alg_det',
          name: '2x2 Determinante bestimmen',
          description: 'Berechne die Determinante einer zufällig generierten 2x2 Matrix.',
          isActive: true
        },
        {
          id: 'lin_alg_det3x3',
          name: '3x3 Determinante (Sarrus)',
          description: 'Berechne die Determinante einer 3x3 Matrix mit der Regel von Sarrus.',
          isActive: false
        },
        {
          id: 'lin_alg_matmul',
          name: 'Matrizenmultiplikation',
          description: 'Multipliziere zwei kompatible ganzzahlige Matrizen.',
          isActive: false
        }
      ]
    },
    {
      id: 'os',
      name: 'Betriebssysteme',
      abbreviation: 'BUS',
      icon: <Cpu className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />,
      description: 'Seitentabellen, Speicherverwaltung, Scheduling und CPU-Prozesse.',
      tasks: [
        {
          id: 'os_page_table',
          name: 'Adressübersetzung',
          description: 'Übersetze virtuelle in physikalische Adressen mit Seitentabellen.',
          isActive: false
        },
        {
          id: 'os_scheduling',
          name: 'Scheduling (FIFO / Round-Robin)',
          description: 'Berechne Wartezeiten und Durchlaufzeiten für Prozess-Scheduling.',
          isActive: false
        }
      ]
    },
    {
      id: 'formal_sys',
      name: 'Formale Systeme',
      abbreviation: 'FOSAP',
      icon: <Network className="w-6 h-6 text-blue-600 dark:text-blue-400" />,
      description: 'Automaten, formale Sprachen, Grammatiken und Aussagenlogik.',
      tasks: [
        {
          id: 'formal_dfa_regex',
          name: 'DFA in Regulären Ausdruck',
          description: 'Konvertiere einen deterministischen endlichen Automaten in eine Regex.',
          isActive: false
        },
        {
          id: 'formal_truth_table',
          name: 'Wahrheitstabellen erzeugen',
          description: 'Bestimme die Erfüllbarkeit aussagenlogischer Formeln via Wahrheitstabelle.',
          isActive: false
        }
      ]
    },
    {
      id: 'algo_struct',
      name: 'Algorithmen & Datenstrukturen',
      abbreviation: 'DSAL',
      icon: <GitFork className="w-6 h-6 text-pink-600 dark:text-pink-400" />,
      description: 'Bäume, Sortieralgorithmen, Graphentheorie und Komplexitätsanalyse.',
      tasks: [
        {
          id: 'algo_avl_rot',
          name: 'AVL-Baum Rotationen',
          description: 'Führe Links-/Rechts-Balancierungen auf AVL-Bäumen durch.',
          isActive: false
        },
        {
          id: 'algo_dijkstra',
          name: 'Dijkstra-Wegfindung',
          description: 'Finde den kürzesten Pfad in einem gewichteten Graphen.',
          isActive: false
        }
      ]
    }
  ];

  const activeModuleData = modules.find(m => m.id === activeModule) || modules[0];

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-6 animate-fadeIn" id="module-selector-dashboard">
      <div className="text-center mb-10">
        <h2 className="text-3xl md:text-4xl font-extrabold font-display text-theme-primary mb-3">
          Wähle ein Studienfach aus
        </h2>
        <p className="text-theme-secondary text-sm md:text-base max-w-xl mx-auto font-medium">
          Wähle das Modul und den Aufgabetyp, den du heute üben möchtest. Jede Aufgabe wird bei Klick frisch generiert!
        </p>
      </div>

      {/* Module Navigation Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        {modules.map((mod) => {
          const isSelected = mod.id === activeModule;
          return (
            <button
              key={mod.id}
              onClick={() => onActiveModuleChange(mod.id)}
              className={`p-5 rounded-2xl border text-left flex flex-col justify-between cursor-pointer transition-all shadow-sm min-h-[175px] ${
                isSelected
                  ? 'bg-purple-500/10 border-purple-500/50 shadow-md shadow-purple-500/10'
                  : 'bg-theme-card border-theme-border hover:brightness-95 dark:hover:brightness-110'
              }`}
              id={`module-btn-${mod.id}`}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="p-2.5 bg-theme-input rounded-xl border border-theme-border">
                  {mod.icon}
                </div>
                {isSelected && (
                  <span className="w-2.5 h-2.5 rounded-full bg-purple-500 animate-pulse" />
                )}
              </div>
              <div>
                <h3 className={`font-extrabold font-display text-xl transition-colors ${
                  isSelected ? 'text-purple-650 dark:text-purple-400' : 'text-theme-primary'
                }`}>
                  {mod.abbreviation}
                </h3>
                <span className="text-xs font-bold text-theme-secondary block mt-0.5 mb-1.5 leading-none">
                  {mod.name}
                </span>
                <p className="text-theme-muted text-[10px] leading-relaxed line-clamp-2 font-medium">
                  {mod.description}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Tasks Section for the Active Module */}
      <div className="glass-panel rounded-3xl p-6 md:p-8">
        <div className="flex items-center gap-3 mb-6">
          <BookOpen className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          <h3 className="text-lg font-bold font-display text-theme-primary">
            Aufgabentypen in "{activeModuleData.name} ({activeModuleData.abbreviation})"
          </h3>
        </div>

        <div className="relative">
          <div
            className={`grid grid-cols-1 md:grid-cols-2 gap-4 transition-all ${
              activeModuleData.id !== 'lin_alg' ? 'blur-sm opacity-40 pointer-events-none select-none' : ''
            }`}
          >
            {activeModuleData.tasks.map((task) => (
              <div
                key={task.id}
                className={`p-5 rounded-2xl border flex flex-col justify-between transition-all ${
                  task.isActive
                    ? 'bg-theme-card hover:brightness-95 dark:hover:brightness-110 border-theme-border hover:border-purple-500/40 group cursor-pointer shadow-sm'
                    : 'bg-theme-card/30 border-theme-border/30 opacity-55'
                }`}
                onClick={() => task.isActive && onSelectTask(task.id)}
                id={`task-card-${task.id}`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-bold text-theme-primary group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                      {task.name}
                    </h4>
                    {task.isActive ? (
                      <span className="text-xs font-bold px-2.5 py-0.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-455 rounded-full border border-emerald-500/20">
                        Aktiv
                      </span>
                    ) : (
                      <div className="flex items-center gap-1 text-theme-muted text-xs font-bold">
                        <Lock className="w-3 h-3" /> Bald
                      </div>
                    )}
                  </div>
                  <p className="text-theme-muted text-xs md:text-sm leading-relaxed mb-4 font-medium">
                    {task.description}
                  </p>
                </div>

                {task.isActive && (
                  <div className="flex items-center gap-1.5 text-xs font-bold text-purple-600 dark:text-purple-400 group-hover:text-purple-500 dark:group-hover:text-purple-300 mt-2">
                    Jetzt starten <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                  </div>
                )}
              </div>
            ))}
          </div>

          {activeModuleData.id !== 'lin_alg' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 pointer-events-none">
              <span className="text-3xl md:text-4xl font-extrabold font-display text-theme-primary/80 tracking-tight">
                Work in Progress
              </span>
              <span className="text-sm font-bold text-theme-muted">
                An diesem Modul wird noch gearbeitet
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ModuleSelector;
