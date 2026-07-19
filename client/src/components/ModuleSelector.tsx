import React from 'react';
import { Binary, Cpu, Network, GitFork, Lock, ArrowRight, BookOpen } from 'lucide-react';
import { LatexTextRenderer } from './MathRenderer';

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
          isActive: true
        },
        {
          id: 'lin_alg_matmul',
          name: 'Matrizenmultiplikation',
          description: 'Multipliziere zwei zufällig generierte Matrizen passender Dimension.',
          isActive: true
        },
        {
          id: 'calc_gl_n_cardinality',
          name: 'Kardinalität von $GL_n(\\mathbb{F}_p)$',
          description: 'Berechne die Anzahl invertierbarer Matrizen über $\\mathbb{F}_p$ mit der Produktformel.',
          isActive: true
        },
        {
          id: 'calc_param_determinant_finite_field',
          name: 'Determinante mit Parameter ($\\mathbb{F}_p$)',
          description: 'Determinante einer $3\\times 3$ Matrix mit Variable $a$ über einem endlichen Körper.',
          isActive: true
        },
        {
          id: 'calc_poly_mapping_matrix',
          name: 'Darstellungsmatrix (Polynomräume)',
          description: 'Finde $M_B^B(\\varphi)$ einer linearen Abbildung auf Polynomräumen.',
          isActive: true
        },
        {
          id: 'calc_eigenbasis',
          name: 'Eigenbasis berechnen',
          description: 'Basis des Eigenraums zum größten Eigenwert einer $3\\times 3$ Matrix.',
          isActive: true
        },
        {
          id: 'calc_linear_code_parameters',
          name: 'Parameter linearer Codes',
          description: 'Bestimme $[n,k,d]$ eines linearen Blockcodes über $\\mathbb{F}_2$.',
          isActive: true
        },
        // Kategorie 1 — parametrisierte Matrizen über F_p
        {
          id: 'calc_param_matrix_invertible',
          name: 'Invertierbarkeit (Parameter, $\\mathbb{F}_p$)',
          description: 'Für welche $a\\in\\mathbb{F}_p$ ist $A_a$ nicht invertierbar?',
          isActive: true
        },
        {
          id: 'calc_param_matrix_rank',
          name: 'Rang (Parameter, $\\mathbb{F}_p$)',
          description: 'Bestimme $\\operatorname{Rang}(A_a)$ für einen konkreten Wert von $a$.',
          isActive: true
        },
        {
          id: 'calc_param_matrix_kernel',
          name: 'Kern/Lösungsraum ($\\mathbb{F}_p$)',
          description: 'Basis des Lösungsraums $L(A_x,0)$ für einen eingesetzten Wert $x$.',
          isActive: true
        },
        {
          id: 'calc_param_matrix_solution_count',
          name: 'Lösungsanzahl ($\\mathbb{F}_p$)',
          description: 'Wie viele Lösungen hat $A_x\\cdot v = b$ für konkretes $x$?',
          isActive: true
        },
        // Kategorie 2 — lineare Abbildungen auf Polynomräumen
        {
          id: 'calc_poly_apply',
          name: 'Abbildung anwenden (Polynomraum)',
          description: 'Berechne $\\varphi(p(X))$ für ein generiertes Polynom $p(X)$.',
          isActive: true
        },
        {
          id: 'calc_poly_image_basis',
          name: 'Basis des Bildes (Polynomraum)',
          description: 'Bestimme eine Basis von $\\operatorname{Bild}(\\varphi)$.',
          isActive: true
        },
        {
          id: 'calc_poly_defect',
          name: 'Defekt (Polynomraum)',
          description: 'Bestimme den Defekt $\\operatorname{Def}(\\varphi) = 4 - \\operatorname{Rang}(M)$.',
          isActive: true
        },
        {
          id: 'calc_poly_composition',
          name: 'Verkettung $\\varphi^3$ (Polynomraum)',
          description: 'Basis von $\\operatorname{Bild}(\\varphi\\circ\\varphi\\circ\\varphi)$ via $M^3$.',
          isActive: true
        },
        // Kategorie 3 — Eigenwerte, Eigenvektoren, Diagonalisierbarkeit
        {
          id: 'calc_charpoly_expanded',
          name: 'Charakteristisches Polynom (ausmultipliziert)',
          description: 'Berechne $\\chi_A$ in Standardform $X^3 - aX^2 + bX - c$.',
          isActive: true
        },
        {
          id: 'calc_charpoly_factored',
          name: 'Charakteristisches Polynom (faktoriert)',
          description: 'Gib $\\chi_A$ in Linearfaktoren an.',
          isActive: true
        },
        {
          id: 'calc_eigenvalues',
          name: 'Eigenwerte & Vielfachheiten',
          description: 'Bestimme Eigenwerte und deren algebraische Vielfachheiten.',
          isActive: true
        },
        {
          id: 'calc_eigenspace',
          name: 'Eigenraum berechnen',
          description: 'Basis des Eigenraums zum kleinsten/großten Eigenwert.',
          isActive: true
        },
        {
          id: 'calc_diagonalizable',
          name: 'Diagonalisierbarkeit',
          description: 'Entscheide, ob $A$ diagonalisierbar ist; gib $T$ und $D$ an.',
          isActive: true
        },
        // Kategorie 4 — lineare Codes
        {
          id: 'calc_linear_code_parity_check',
          name: 'Kontrollmatrix (Parity-Check)',
          description: 'Bestimme eine Kontrollmatrix $H$ für den Code $C$.',
          isActive: true
        },
        {
          id: 'calc_linear_code_nearest_neighbor',
          name: 'Nearest-Neighbor-Decoding',
          description: 'Alle Codewörter mit minimalem Hamming-Abstand zu $v$.',
          isActive: true
        },
        // Kategorie 5 — Kombinatorik über F_q
        {
          id: 'calc_field_vecspace_size',
          name: 'Größe eines Matrizenraums',
          description: 'Wie viele Elemente hat $\\mathbb{F}_q^{m\\times n}$?',
          isActive: true
        },
        {
          id: 'calc_field_symmetric_count',
          name: 'Symmetrische Matrizen zählen',
          description: 'Wie viele symmetrische Matrizen in $\\mathbb{F}_q^{n\\times n}$?',
          isActive: true
        },
        {
          id: 'calc_field_rref_rank_count',
          name: 'RREF-Matrizen (Rang $r$)',
          description: 'Anzahl der RREF-Matrizen mit Rang $r$ über $\\mathbb{F}_q$.',
          isActive: true
        },
        // Kategorie 6 — Matrizeninversion & Basiswechsel über F_p
        {
          id: 'calc_matrix_inverse_field',
          name: 'Matrixinversion ($\\mathbb{F}_p$)',
          description: 'Bestimme $A^{-1}$ über einem endlichen Körper $\\mathbb{F}_p$.',
          isActive: true
        },
        {
          id: 'calc_preimage_field',
          name: 'Urbild bestimmen ($\\mathbb{F}_p$)',
          description: 'Löse $A\\cdot x = b$ und gib das Urbild $\\varphi^{-1}(\\{b\\})$ an.',
          isActive: true
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
          id: 'os_bus_anki',
          name: 'BUS Quizfragen',
          description: 'Löse Multiple-Choice-Fragen zu Betriebssystemen und Systemsoftware.',
          isActive: true
        },
        {
          id: 'os_page_table',
          name: 'Adressübersetzung',
          description: 'Übersetze virtuelle in physikalische Adressen mit Seitentabellen.',
          isActive: true
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
          id: 'dsal_bst_insert',
          name: 'BST: Wert einfügen',
          description: 'Füge einen Wert in einen Binär-Suchbaum ein (gleiche Werte → rechts).',
          isActive: true
        },
        {
          id: 'dsal_avl_insert',
          name: 'AVL-Baum: Wert einfügen',
          description: 'Füge einen Wert in einen AVL-Baum ein und balanciere per Rotation.',
          isActive: true
        },
        {
          id: 'dsal_rb_insert',
          name: 'Rot-Schwarz-Baum: Wert einfügen',
          description: 'Füge einen Wert in einen Rot-Schwarz-Baum ein (Recoloring/Rotationen).',
          isActive: true
        },
        {
          id: 'dsal_btree_insert',
          name: 'B-Baum: Wert einfügen',
          description: 'Füge einen Wert in einen B-Baum ein (Splits bei Überlauf).',
          isActive: true
        },
        {
          id: 'dsal_bst_delete',
          name: 'BST: Wert löschen',
          description: 'Lösche einen Wert aus einem Binär-Suchbaum (Inorder-Nachfolger bei 2 Kindern).',
          isActive: true
        },
        {
          id: 'dsal_avl_delete',
          name: 'AVL-Baum: Wert löschen',
          description: 'Lösche einen Wert aus einem AVL-Baum und balanciere per Rotation.',
          isActive: true
        },
        {
          id: 'dsal_rb_delete',
          name: 'Rot-Schwarz-Baum: Wert löschen',
          description: 'Lösche einen Wert aus einem Rot-Schwarz-Baum (Schwarzhöhe wiederherstellen).',
          isActive: true
        },
        {
          id: 'dsal_btree_delete',
          name: 'B-Baum: Wert löschen',
          description: 'Lösche einen Wert aus einem B-Baum (Borrow/Merge bei Unterlauf).',
          isActive: true
        },
        {
          id: 'dsal_sort_bubble',
          name: 'Bubblesort',
          description: 'Gib das Array nach einer Swap-Operation beim Bubblesort an.',
          isActive: true
        },
        {
          id: 'dsal_sort_insertion',
          name: 'Insertionsort',
          description: 'Gib das Array nach einer Iteration der äußeren Schleife beim Insertionsort an.',
          isActive: true
        },
        {
          id: 'dsal_sort_selection',
          name: 'Selectionsort',
          description: 'Gib das Array nach einer Swap-Operation beim Selectionsort an.',
          isActive: true
        },
        {
          id: 'dsal_sort_quick',
          name: 'Quicksort',
          description: 'Gib das Array nach einer Partition-Operation beim Quicksort an.',
          isActive: true
        },
        {
          id: 'dsal_sort_merge',
          name: 'Mergesort',
          description: 'Gib das Array nach einer Merge-Operation beim Mergesort an.',
          isActive: true
        },
        {
          id: 'dsal_sort_heap',
          name: 'Heapsort',
          description: 'Gib das Array nach einer Swap-Operation beim Heapsort an.',
          isActive: true
        },
        {
          id: 'dsal_sort_counting',
          name: 'Countingsort',
          description: 'Gib das sortierte Ergebnisarray beim Countingsort (Werte 0…9) an.',
          isActive: true
        },
        {
          id: 'dsal_sort_bucket',
          name: 'Bucketsort',
          description: 'Gib das sortierte Ergebnisarray beim Bucketsort (10 Buckets, Werte 0…99) an.',
          isActive: true
        },
        {
          id: 'dsal_graph_bfs',
          name: 'Breitensuche (BFS)',
          description: 'Gib die Knoten in der Reihenfolge ihrer Entdeckung bei der Breitensuche an.',
          isActive: true
        },
        {
          id: 'dsal_graph_dfs',
          name: 'Tiefensuche (DFS)',
          description: 'Gib die Knoten in der Reihenfolge ihrer Entdeckung bei der Tiefensuche an.',
          isActive: true
        },
        {
          id: 'dsal_graph_topo',
          name: 'Topologische Sortierung',
          description: 'Gib eine topologische Sortierung eines gerichteten azyklischen Graphen an.',
          isActive: true
        },
        {
          id: 'dsal_graph_dijkstra',
          name: 'Dijkstra',
          description: 'Berechne die kürzeste Distanz zu einem Zielknoten mit Dijkstra.',
          isActive: true
        },
        {
          id: 'dsal_graph_bellmanford',
          name: 'Bellman-Ford',
          description: 'Berechne die kürzeste Distanz zu einem Zielknoten mit Bellman-Ford.',
          isActive: true
        },
        {
          id: 'dsal_graph_prim',
          name: 'Prim (Minimalbaum)',
          description: 'Gib die Kanten des minimalen Spannbaums nach Prim an.',
          isActive: true
        },
        {
          id: 'dsal_graph_kruskal',
          name: 'Kruskal (Minimalbaum)',
          description: 'Gib die Kanten des minimalen Spannbaums nach Kruskal an.',
          isActive: true
        },
        {
          id: 'dsal_graph_unionfind',
          name: 'Union-Find',
          description: 'Bestimme den Repräsentanten eines Elements nach Union-Operationen.',
          isActive: true
        },
        {
          id: 'dsal_graph_kosaraju',
          name: 'Kosaraju-Sharir',
          description: 'Bestimme die starken Zusammenhangskomponenten mit Kosaraju-Sharir.',
          isActive: true
        },
        {
          id: 'dsal_graph_floydwarshall',
          name: 'Floyd-Warshall',
          description: 'Gib die finale all-pairs Distanzmatrix nach Floyd-Warshall an.',
          isActive: true
        },
        {
          id: 'dsal_hash_div_open',
          name: 'Hashing: Division + Verkettung',
          description: 'Belege eine Hash-Tabelle mit der Divisionsmethode und Verkettung.',
          isActive: true
        },
        {
          id: 'dsal_hash_div_linear',
          name: 'Hashing: Division + lineare Sondierung',
          description: 'Belege eine Hash-Tabelle mit der Divisionsmethode und linearer Sondierung.',
          isActive: true
        },
        {
          id: 'dsal_hash_div_quadratic',
          name: 'Hashing: Division + quadratische Sondierung',
          description: 'Belege eine Hash-Tabelle mit der Divisionsmethode und quadratischer Sondierung.',
          isActive: true
        },
        {
          id: 'dsal_hash_mul_open',
          name: 'Hashing: Multiplikation + Verkettung',
          description: 'Belege eine Hash-Tabelle mit der Multiplikationsmethode und Verkettung.',
          isActive: true
        },
        {
          id: 'dsal_hash_mul_linear',
          name: 'Hashing: Multiplikation + lineare Sondierung',
          description: 'Belege eine Hash-Tabelle mit der Multiplikationsmethode und linearer Sondierung.',
          isActive: true
        },
        {
          id: 'dsal_hash_mul_quadratic',
          name: 'Hashing: Multiplikation + quadratische Sondierung',
          description: 'Belege eine Hash-Tabelle mit der Multiplikationsmethode und quadratischer Sondierung.',
          isActive: true
        },
        {
          id: 'dsal_opt_knapsack',
          name: 'Rucksackproblem (DP)',
          description: 'Maximaler Gesamtwert und mitzunehmende Gegenstände per dynamischer Programmierung.',
          isActive: true
        },
        {
          id: 'dsal_opt_lcs',
          name: 'Längste gemeinsame Teilfolge (DP)',
          description: 'Bestimme die LCS zweier Zeichenfolgen mit dynamischer Programmierung.',
          isActive: true
        },
        {
          id: 'dsal_opt_simplex',
          name: 'Simplex-Algorithmus',
          description: 'Löse ein lineares Programm (Maximierung) mit dem Simplex-Algorithmus.',
          isActive: true
        }
      ]
    }
  ];

  const activeModuleData = modules.find(m => m.id === activeModule) || modules[0];
  const moduleHasActiveTasks = activeModuleData.tasks.some((t) => t.isActive);

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-6 animate-fadeIn" id="module-selector-dashboard">
      <div className="text-center mb-10">
        <h2 className="text-3xl md:text-4xl font-extrabold font-display text-theme-primary mb-3">
          Wähle ein Modul aus
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
              moduleHasActiveTasks ? '' : 'blur-sm opacity-40 pointer-events-none select-none'
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
                      <LatexTextRenderer text={task.name} />
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
                    <LatexTextRenderer text={task.description} />
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

          {!moduleHasActiveTasks && (
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
