import { useState } from 'react';
import { DeterminantTask } from './components/DeterminantTask';
import { GraduationCap, Trophy, User, BookOpen, Clock, Medal } from 'lucide-react';

type TabType = 'tasks' | 'leaderboard' | 'profile';

function App() {
  const [activeTab, setActiveTab] = useState<TabType>('tasks');

  // Local storage reading utility for profile
  const getLocalScore = () => {
    const saved = localStorage.getItem('aufgabengenerator_score');
    return saved ? parseInt(saved, 10) : 0;
  };

  // Mock leaderboard matching our SolvedTask model schema
  const mockLeaderboard = [
    { rank: 1, username: 'MatheGott', solvedCount: 42, module: 'Lineare Algebra' },
    { rank: 2, username: 'Kommilitone99', solvedCount: 28, module: 'Datenstrukturen & Algos' },
    { rank: 3, username: 'CodeKünstler', solvedCount: 19, module: 'Betriebssysteme' },
    { rank: 4, username: 'Du', solvedCount: getLocalScore(), module: 'Lineare Algebra', isUser: true },
    { rank: 5, username: 'LatexLover', solvedCount: 7, module: 'Formale Systeme' }
  ].sort((a, b) => b.solvedCount - a.solvedCount);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Decorative colored blobs */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Navigation Header */}
      <header className="w-full py-5 px-6 border-b border-slate-800/80 bg-slate-950/20 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-tr from-purple-600 to-indigo-600 rounded-2xl shadow-lg shadow-purple-500/20">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold font-display bg-gradient-to-r from-slate-100 to-slate-300 bg-clip-text text-transparent m-0 leading-tight">
                AufgabenGenerator
              </h1>
              <p className="text-xs text-slate-400 font-medium">Lerne effizient mit unendlich vielen Aufgaben</p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex bg-slate-900/60 p-1 rounded-xl border border-slate-800/50">
            <button
              onClick={() => setActiveTab('tasks')}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                activeTab === 'tasks'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <BookOpen className="w-4 h-4" /> Aufgaben
            </button>
            <button
              onClick={() => setActiveTab('leaderboard')}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                activeTab === 'leaderboard'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Trophy className="w-4 h-4" /> Bestenliste
            </button>
            <button
              onClick={() => setActiveTab('profile')}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                activeTab === 'profile'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <User className="w-4 h-4" /> Profil
            </button>
          </nav>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-grow flex items-center justify-center py-10 z-10">
        {activeTab === 'tasks' && <DeterminantTask />}

        {activeTab === 'leaderboard' && (
          <div className="w-full max-w-2xl mx-auto px-4">
            <div className="glass-panel rounded-3xl p-6 md:p-8 glow-purple">
              <h2 className="text-2xl font-bold font-display text-slate-100 mb-2">Globales Leaderboard</h2>
              <p className="text-slate-400 text-sm mb-6">Messe dich mit anderen Informatikstudierenden.</p>

              <div className="space-y-2.5">
                {mockLeaderboard.map((item, index) => (
                  <div
                    key={index}
                    className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${
                      item.isUser
                        ? 'bg-purple-500/10 border-purple-500/30'
                        : 'bg-slate-900/30 border-slate-800/40'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      {/* Rank Indicator */}
                      <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                        index === 0 ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                        index === 1 ? 'bg-slate-400/20 text-slate-300 border border-slate-400/30' :
                        index === 2 ? 'bg-amber-700/20 text-amber-600 border border-amber-700/30' :
                        'bg-slate-800/40 text-slate-400'
                      }`}>
                        {index + 1}
                      </span>
                      <div>
                        <span className="font-semibold text-slate-200">{item.username}</span>
                        <span className="block text-xs text-slate-500">Zuletzt: {item.module}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-100">{item.solvedCount}</span>
                      <span className="text-xs text-slate-400">gelöst</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'profile' && (
          <div className="w-full max-w-2xl mx-auto px-4">
            <div className="glass-panel rounded-3xl p-6 md:p-8 glow-purple">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-purple-500 to-indigo-500 flex items-center justify-center shadow-lg">
                  <User className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold font-display text-slate-100">Matthias Dahm</h2>
                  <p className="text-slate-400 text-sm">76906172+MD16dev@users.noreply.github.com</p>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                <div className="p-4 bg-slate-900/30 border border-slate-800/50 rounded-2xl flex flex-col justify-between">
                  <div className="flex justify-between items-start text-purple-400 mb-2">
                    <Trophy className="w-5 h-5" />
                    <span className="text-xs text-slate-500 font-semibold uppercase">Punkte</span>
                  </div>
                  <div>
                    <span className="text-2xl font-extrabold text-slate-100">{getLocalScore()}</span>
                    <span className="block text-xs text-slate-400 mt-1">gelöste Aufgaben</span>
                  </div>
                </div>

                <div className="p-4 bg-slate-900/30 border border-slate-800/50 rounded-2xl flex flex-col justify-between">
                  <div className="flex justify-between items-start text-emerald-400 mb-2">
                    <BookOpen className="w-5 h-5" />
                    <span className="text-xs text-slate-500 font-semibold uppercase">Module</span>
                  </div>
                  <div>
                    <span className="text-2xl font-extrabold text-slate-100">1</span>
                    <span className="block text-xs text-slate-400 mt-1">aktives Modul</span>
                  </div>
                </div>

                <div className="p-4 bg-slate-900/30 border border-slate-800/50 rounded-2xl flex flex-col justify-between">
                  <div className="flex justify-between items-start text-blue-400 mb-2">
                    <Clock className="w-5 h-5" />
                    <span className="text-xs text-slate-500 font-semibold uppercase">Rang</span>
                  </div>
                  <div>
                    <span className="text-2xl font-extrabold text-slate-100">#4</span>
                    <span className="block text-xs text-slate-400 mt-1">auf Bestenliste</span>
                  </div>
                </div>
              </div>

              {/* Achievements */}
              <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Erfolge</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3.5 p-3.5 bg-slate-900/10 border border-slate-800/30 rounded-2xl">
                  <Medal className="w-6 h-6 text-yellow-500" />
                  <div>
                    <h4 className="text-sm font-bold text-slate-200">Erster Schritt</h4>
                    <p className="text-xs text-slate-400">Erste Aufgabe im Modul Lineare Algebra richtig gelöst.</p>
                  </div>
                </div>
                <div className="flex items-center gap-3.5 p-3.5 bg-slate-900/10 border border-slate-800/30 rounded-2xl opacity-40">
                  <Medal className="w-6 h-6 text-slate-500" />
                  <div>
                    <h4 className="text-sm font-bold text-slate-200">Matrix Meister</h4>
                    <p className="text-xs text-slate-400">Löse 10 Determinanten-Aufgaben fehlerfrei.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="py-6 border-t border-slate-800/40 text-center text-xs text-slate-500">
        <p>© {new Date().getFullYear()} AufgabenGenerator. Entwickelt für Uni-Kommilitonen.</p>
      </footer>
    </div>
  );
}

export default App;
