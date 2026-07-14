import { useState, useEffect } from 'react';
import { ModuleSelector } from './components/ModuleSelector';
import { DeterminantTask } from './components/DeterminantTask';
import { ThemeToggle } from './components/ThemeToggle';
import { AuthModal } from './components/AuthModal';
import { OnboardingTour } from './components/OnboardingTour';
import { 
  GraduationCap, Trophy, User, BookOpen, Clock, Medal, 
  LogIn, LogOut, RefreshCw, Sparkles, HelpCircle 
} from 'lucide-react';

type TabType = 'tasks' | 'leaderboard' | 'profile';

interface UserProfile {
  id: string;
  username: string;
  createdAt: string;
  solvedCount: number;
}

interface LeaderboardItem {
  username: string;
  solvedCount: number;
  module: string;
  isUser: boolean;
}

function App() {
  const [activeTab, setActiveTab] = useState<TabType>('tasks');
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loadingUser, setLoadingUser] = useState<boolean>(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState<boolean>(false);

  // Dynamic Leaderboard state
  const [leaderboard, setLeaderboard] = useState<LeaderboardItem[]>([]);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState<boolean>(false);

  // Local storage reading fallback for guest score
  const [guestScore, setGuestScore] = useState<number>(() => {
    const saved = localStorage.getItem('aufgabengenerator_score');
    return saved ? parseInt(saved, 10) : 0;
  });

  // Verify token and fetch user session on load
  const checkUserSession = async () => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      setLoadingUser(false);
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      } else {
        // Clear invalid tokens
        localStorage.removeItem('auth_token');
      }
    } catch (err) {
      console.error('Session-Check fehlgeschlagen:', err);
    } finally {
      setLoadingUser(false);
    }
  };

  // Fetch leaderboard data
  const fetchLeaderboard = async () => {
    setLoadingLeaderboard(true);
    const token = localStorage.getItem('auth_token');
    const headers: HeadersInit = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch('http://localhost:5000/api/tasks/leaderboard', { headers });
      if (response.ok) {
        const data = await response.json();
        setLeaderboard(data);
      }
    } catch (err) {
      console.error('Bestenliste konnte nicht geladen werden:', err);
    } finally {
      setLoadingLeaderboard(false);
    }
  };

  useEffect(() => {
    checkUserSession();
    
    // Check if onboarding needs to be shown (first visit)
    const onboardingDone = localStorage.getItem('aufgabengenerator_onboarding_completed');
    if (!onboardingDone) {
      setIsOnboardingOpen(true);
    }
  }, []);

  // Fetch leaderboard when switching to its tab
  useEffect(() => {
    if (activeTab === 'leaderboard') {
      fetchLeaderboard();
    }
  }, [activeTab]);

  const handleAuthSuccess = () => {
    // Session load will update solved count and user state
    checkUserSession();
    // Refresh leaderboard
    fetchLeaderboard();
  };

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    setUser(null);
    setActiveTab('tasks');
  };

  const handleSolved = () => {
    if (user) {
      // Reload profile to fetch updated database score
      checkUserSession();
    } else {
      // Fallback update for guest score
      const saved = localStorage.getItem('aufgabengenerator_score');
      setGuestScore(saved ? parseInt(saved, 10) : 0);
    }
  };

  // Helper to get active user score
  const getActiveScore = () => {
    return user ? user.solvedCount : guestScore;
  };

  return (
    <div className="min-h-screen flex flex-col transition-colors duration-300">
      {/* Decorative blobs */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-600/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-indigo-600/5 rounded-full blur-3xl pointer-events-none" />

      {/* Navigation Header */}
      <header className="w-full py-4 px-6 border-b border-slate-800/40 bg-slate-950/20 backdrop-blur-md sticky top-0 z-40 transition-colors duration-300">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          
          {/* Logo & Slogan */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => { setActiveTab('tasks'); setActiveTaskId(null); }}>
            <div className="p-2 bg-gradient-to-tr from-purple-600 to-indigo-600 rounded-xl shadow-lg shadow-purple-500/20">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold font-display bg-gradient-to-r from-slate-100 to-slate-300 bg-clip-text text-transparent m-0 leading-tight">
                AufgabenGenerator
              </h1>
              <p className="text-xs text-slate-400 font-medium">Lerne effizient mit unendlich vielen Aufgaben</p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex bg-slate-900/40 dark:bg-slate-900/40 p-1 rounded-xl border border-slate-800/60">
            <button
              onClick={() => setActiveTab('tasks')}
              className={`flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                activeTab === 'tasks'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <BookOpen className="w-4 h-4" /> Aufgaben
            </button>
            <button
              onClick={() => setActiveTab('leaderboard')}
              className={`flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                activeTab === 'leaderboard'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Trophy className="w-4 h-4" /> Bestenliste
            </button>
            <button
              onClick={() => setActiveTab('profile')}
              className={`flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                activeTab === 'profile'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <User className="w-4 h-4" /> Profil
            </button>
          </nav>

          {/* Actions: Theme Toggle & Login/Logout */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setIsOnboardingOpen(true)}
              className="p-2.5 bg-slate-900/40 hover:bg-purple-500/10 border border-slate-800 hover:border-purple-500/30 rounded-xl text-slate-400 hover:text-purple-400 transition-all cursor-pointer shadow-sm flex items-center justify-center"
              title="Tour starten"
            >
              <HelpCircle className="w-5 h-5" />
            </button>
            
            <ThemeToggle />

            {loadingUser ? (
              <div className="w-9 h-9 flex items-center justify-center">
                <RefreshCw className="w-4 h-4 text-purple-500 animate-spin" />
              </div>
            ) : user ? (
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 font-semibold rounded-xl text-xs border border-rose-500/20 transition-all cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" /> Logout
              </button>
            ) : (
              <button
                onClick={() => setIsAuthModalOpen(true)}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-semibold rounded-xl text-xs shadow-md shadow-purple-500/10 transition-all cursor-pointer"
              >
                <LogIn className="w-3.5 h-3.5" /> Login
              </button>
            )}
          </div>

        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-grow flex items-center justify-center py-8 z-10">
        
        {/* Dynamic tasks flow */}
        {activeTab === 'tasks' && (
          activeTaskId === 'lin_alg_det' ? (
            <DeterminantTask 
              user={user} 
              onSolved={handleSolved}
              onBackToSelector={() => setActiveTaskId(null)} 
            />
          ) : (
            <ModuleSelector onSelectTask={(taskId) => setActiveTaskId(taskId)} />
          )
        )}

        {/* Dynamic Leaderboard tab */}
        {activeTab === 'leaderboard' && (
          <div className="w-full max-w-2xl mx-auto px-4 animate-fadeIn">
            <div className="glass-panel rounded-3xl p-6 md:p-8 glow-purple">
              <h2 className="text-2xl font-bold font-display text-slate-100 mb-2">Globales Leaderboard</h2>
              <p className="text-slate-400 text-sm mb-6">Messe dich mit deinen Kommilitonen.</p>

              {loadingLeaderboard ? (
                <div className="flex flex-col items-center justify-center py-16 gap-4">
                  <RefreshCw className="w-8 h-8 text-purple-500 animate-spin" />
                  <p className="text-slate-400 text-xs">Bestenliste wird abgerufen...</p>
                </div>
              ) : leaderboard.length > 0 ? (
                <div className="space-y-2.5">
                  {leaderboard.map((item, index) => (
                    <div
                      key={index}
                      className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${
                        item.isUser
                          ? 'bg-purple-500/15 border-purple-500/40 shadow-sm shadow-purple-500/10'
                          : 'bg-slate-900/30 border-slate-800/40'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                          index === 0 ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                          index === 1 ? 'bg-slate-400/20 text-slate-300 border border-slate-400/30' :
                          index === 2 ? 'bg-amber-700/20 text-amber-600 border border-amber-700/30' :
                          'bg-slate-800/40 text-slate-400 border border-transparent'
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
              ) : (
                <div className="text-center py-12 text-slate-400 text-sm">
                  Aktuell sind keine registrierten Einträge vorhanden. Sei der Erste!
                </div>
              )}
            </div>
          </div>
        )}

        {/* Dynamic Profile tab */}
        {activeTab === 'profile' && (
          <div className="w-full max-w-2xl mx-auto px-4 animate-fadeIn">
            {user ? (
              <div className="glass-panel rounded-3xl p-6 md:p-8 glow-purple">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-purple-500 to-indigo-500 flex items-center justify-center shadow-lg">
                    <span className="text-2xl font-bold text-white uppercase">{user.username.substring(0, 2)}</span>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold font-display text-slate-100">{user.username}</h2>
                    <p className="text-slate-400 text-xs font-medium">Registriert seit {new Date(user.createdAt).toLocaleDateString('de-DE')}</p>
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
                      <span className="text-2xl font-extrabold text-slate-100">{getActiveScore()}</span>
                      <span className="block text-xs text-slate-400 mt-1">gelöste Aufgaben</span>
                    </div>
                  </div>

                  <div className="p-4 bg-slate-900/30 border border-slate-800/50 rounded-2xl flex flex-col justify-between">
                    <div className="flex justify-between items-start text-emerald-400 mb-2">
                      <BookOpen className="w-5 h-5" />
                      <span className="text-xs text-slate-500 font-semibold uppercase">Module</span>
                    </div>
                    <div>
                      <span className="text-2xl font-extrabold text-slate-100">
                        {user.solvedCount > 0 ? 1 : 0}
                      </span>
                      <span className="block text-xs text-slate-400 mt-1">aktive Fächer</span>
                    </div>
                  </div>

                  <div className="p-4 bg-slate-900/30 border border-slate-800/50 rounded-2xl flex flex-col justify-between">
                    <div className="flex justify-between items-start text-blue-400 mb-2">
                      <Clock className="w-5 h-5" />
                      <span className="text-xs text-slate-500 font-semibold uppercase">Status</span>
                    </div>
                    <div>
                      <span className="text-xl font-extrabold text-slate-100 truncate block">
                        {user.solvedCount >= 10 ? 'Fortgeschritten' : 'Anfänger'}
                      </span>
                      <span className="block text-xs text-slate-400 mt-1">Lernniveau</span>
                    </div>
                  </div>
                </div>

                {/* Achievements */}
                <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Erfolge</h3>
                <div className="space-y-3">
                  <div className={`flex items-center gap-3.5 p-3.5 rounded-2xl border transition-all ${
                    user.solvedCount >= 1 
                      ? 'bg-slate-900/10 border-slate-800/30 opacity-100'
                      : 'bg-slate-900/5 border-slate-900/10 opacity-35'
                  }`}>
                    <Medal className={`w-6 h-6 ${user.solvedCount >= 1 ? 'text-yellow-500' : 'text-slate-500'}`} />
                    <div>
                      <h4 className="text-sm font-bold text-slate-200">Erster Schritt</h4>
                      <p className="text-xs text-slate-400">Erste Aufgabe im Modul Lineare Algebra richtig gelöst.</p>
                    </div>
                  </div>
                  <div className={`flex items-center gap-3.5 p-3.5 rounded-2xl border transition-all ${
                    user.solvedCount >= 10 
                      ? 'bg-slate-900/10 border-slate-800/30 opacity-100'
                      : 'bg-slate-900/5 border-slate-900/10 opacity-35'
                  }`}>
                    <Medal className={`w-6 h-6 ${user.solvedCount >= 10 ? 'text-purple-400' : 'text-slate-500'}`} />
                    <div>
                      <h4 className="text-sm font-bold text-slate-200">Matrix Meister</h4>
                      <p className="text-xs text-slate-400">Löse 10 Determinanten-Aufgaben fehlerfrei.</p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="glass-panel rounded-3xl p-8 text-center glow-purple">
                <div className="max-w-md mx-auto py-6">
                  <div className="p-3 bg-purple-500/10 rounded-2xl border border-purple-500/20 text-purple-400 w-fit mx-auto mb-4">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <h2 className="text-2xl font-bold font-display text-slate-100 mb-2">Erstelle ein Profil</h2>
                  <p className="text-slate-400 text-sm mb-6">
                    Melde dich an, um deine Rechenpunkte dauerhaft zu sichern, deine Erfolge einzusehen und einen Platz in der globalen Rangliste zu ergattern.
                  </p>
                  
                  {/* Guest Session stats */}
                  <div className="p-4 bg-slate-950/20 rounded-2xl border border-slate-800/40 text-left mb-6">
                    <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider block mb-1">
                      Aktuelle Session (Gast)
                    </span>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-slate-300">Punkte gesammelt:</span>
                      <span className="text-lg font-bold text-purple-400">{guestScore}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => setIsAuthModalOpen(true)}
                    className="w-full py-3.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold rounded-xl transition-all shadow-lg hover:shadow-purple-500/25 cursor-pointer text-sm"
                  >
                    Profil jetzt erstellen / Einloggen
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="py-6 border-t border-slate-800/40 text-center text-xs text-slate-500 transition-colors duration-300">
        <p>© {new Date().getFullYear()} AufgabenGenerator. Entwickelt für Uni-Kommilitonen.</p>
      </footer>

      {/* Popups & Tour Overlays */}
      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)}
        onAuthSuccess={handleAuthSuccess}
      />

      {isOnboardingOpen && (
        <OnboardingTour onClose={() => setIsOnboardingOpen(false)} />
      )}
    </div>
  );
}

export default App;
