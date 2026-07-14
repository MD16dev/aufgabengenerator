import { useState, useEffect } from 'react';
import { ModuleSelector } from './components/ModuleSelector';
import { DeterminantTask } from './components/DeterminantTask';
import { ThemeToggle } from './components/ThemeToggle';
import { AuthModal } from './components/AuthModal';
import { OnboardingTour } from './components/OnboardingTour';
import { 
  GraduationCap, Trophy, User, BookOpen, Clock, Medal, 
  LogIn, LogOut, RefreshCw, Sparkles, HelpCircle, Edit, Save, Camera,
  Play, Pause, RotateCcw, Home, ArrowRight, ShieldCheck, Zap, Compass, Github
} from 'lucide-react';

type TabType = 'home' | 'tasks' | 'leaderboard' | 'profile';
type LeaderboardFilterType = 'global' | 'module' | 'task';

interface UserProfile {
  id: string;
  username: string;
  displayName: string;
  profilePic?: string;
  createdAt: string;
  solvedCount: number;
}

interface LeaderboardItem {
  username: string;
  displayName: string;
  profilePic?: string;
  solvedCount: number;
  module: string;
  isUser: boolean;
}

function App() {
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [activeModuleId, setActiveModuleId] = useState<string>('lin_alg');
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loadingUser, setLoadingUser] = useState<boolean>(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState<boolean>(false);

  // Profile Edit State
  const [isEditMode, setIsEditMode] = useState<boolean>(false);
  const [editDisplayName, setEditDisplayName] = useState<string>('');
  const [editPassword, setEditPassword] = useState<string>('');
  const [editProfilePic, setEditProfilePic] = useState<string>('');
  const [savingProfile, setSavingProfile] = useState<boolean>(false);
  const [profileMessage, setProfileMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Dedicated Leaderboard Tab state & filters
  const [leaderboard, setLeaderboard] = useState<LeaderboardItem[]>([]);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState<boolean>(false);
  const [leaderboardFilter, setLeaderboardFilter] = useState<LeaderboardFilterType>('global');
  const [selectedModuleFilter, setSelectedModuleFilter] = useState<string>('Lineare Algebra');
  const [selectedTaskFilter, setSelectedTaskFilter] = useState<string>('lin_alg_det');

  // Side-by-side tasks tab leaderboard state
  const [sideLeaderboard, setSideLeaderboard] = useState<LeaderboardItem[]>([]);
  const [loadingSideLeaderboard, setLoadingSideLeaderboard] = useState<boolean>(false);

  // Pomodoro State
  const [pomodoroWorkTime, setPomodoroWorkTime] = useState<number>(25);
  const [pomodoroBreakTime, setPomodoroBreakTime] = useState<number>(5);
  const [pomodoroMinutes, setPomodoroMinutes] = useState<number>(25);
  const [pomodoroSeconds, setPomodoroSeconds] = useState<number>(0);
  const [pomodoroIsActive, setPomodoroIsActive] = useState<boolean>(false);
  const [pomodoroMode, setPomodoroMode] = useState<'work' | 'break'>('work');
  const [isWidgetExpanded, setIsWidgetExpanded] = useState<boolean>(false);

  // Local storage reading fallback for guest score
  const [guestScore, setGuestScore] = useState<number>(() => {
    const saved = localStorage.getItem('aufgabengenerator_score');
    return saved ? parseInt(saved, 10) : 0;
  });

  // Synthesize a soft bell alarm sound when pomodoro ends
  const playChime = () => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.setValueAtTime(880.00, ctx.currentTime + 0.12); // A5
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
      osc.start();
      osc.stop(ctx.currentTime + 0.55);
    } catch (e) {
      console.error('Audio alert chime could not play:', e);
    }
  };

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
        // Initialize profile edit states
        setEditDisplayName(userData.displayName || userData.username);
        setEditProfilePic(userData.profilePic || '');
      } else {
        localStorage.removeItem('auth_token');
      }
    } catch (err) {
      console.error('Session-Check fehlgeschlagen:', err);
    } finally {
      setLoadingUser(false);
    }
  };

  // Fetch leaderboard data based on active filters
  const fetchLeaderboard = async () => {
    setLoadingLeaderboard(true);
    const token = localStorage.getItem('auth_token');
    const headers: HeadersInit = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    let url = 'http://localhost:5000/api/tasks/leaderboard';
    if (leaderboardFilter === 'module') {
      url += `?module=${encodeURIComponent(selectedModuleFilter)}`;
    } else if (leaderboardFilter === 'task') {
      url += `?taskId=${encodeURIComponent(selectedTaskFilter)}`;
    }

    try {
      const response = await fetch(url, { headers });
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

  // Fetch side leaderboard for split layout
  const fetchSideLeaderboard = async (filterType: 'module' | 'task', filterValue: string) => {
    setLoadingSideLeaderboard(true);
    const token = localStorage.getItem('auth_token');
    const headers: HeadersInit = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    let url = 'http://localhost:5000/api/tasks/leaderboard';
    if (filterType === 'module') {
      url += `?module=${encodeURIComponent(filterValue)}`;
    } else if (filterType === 'task') {
      url += `?taskId=${encodeURIComponent(filterValue)}`;
    }

    try {
      const response = await fetch(url, { headers });
      if (response.ok) {
        const data = await response.json();
        setSideLeaderboard(data);
      }
    } catch (err) {
      console.error('Side leaderboard failed to fetch:', err);
    } finally {
      setLoadingSideLeaderboard(false);
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

  // Fetch dedicated leaderboard on filters updates
  useEffect(() => {
    if (activeTab === 'leaderboard') {
      fetchLeaderboard();
    }
  }, [activeTab, leaderboardFilter, selectedModuleFilter, selectedTaskFilter]);

  // Fetch side leaderboard based on active task or active module selection card
  useEffect(() => {
    if (activeTab === 'tasks') {
      if (activeTaskId) {
        fetchSideLeaderboard('task', activeTaskId);
      } else {
        const moduleNameMap: Record<string, string> = {
          'lin_alg': 'Lineare Algebra',
          'os': 'Betriebssysteme',
          'formal_sys': 'Formale Systeme',
          'algo_struct': 'Algorithmen & Datenstrukturen'
        };
        fetchSideLeaderboard('module', moduleNameMap[activeModuleId] || 'Lineare Algebra');
      }
    }
  }, [activeTab, activeTaskId, activeModuleId]);

  // Pomodoro ticking interval hook
  useEffect(() => {
    let timerInterval: any = null;
    if (pomodoroIsActive) {
      timerInterval = setInterval(() => {
        if (pomodoroSeconds > 0) {
          setPomodoroSeconds(prev => prev - 1);
        } else {
          if (pomodoroMinutes > 0) {
            setPomodoroMinutes(prev => prev - 1);
            setPomodoroSeconds(59);
          } else {
            // Timer Finished! Play Alert chime and swap states
            playChime();
            const nextMode = pomodoroMode === 'work' ? 'break' : 'work';
            setPomodoroMode(nextMode);
            const nextMins = nextMode === 'work' ? pomodoroWorkTime : pomodoroBreakTime;
            setPomodoroMinutes(nextMins);
            setPomodoroSeconds(0);
            
            // Show alert notification
            setTimeout(() => {
              alert(
                nextMode === 'break' 
                  ? 'Fokuszeit beendet! Nimm dir eine kurze Pause. ☕' 
                  : 'Pause beendet! Zeit sich wieder zu fokussieren. 🧠'
              );
            }, 100);
          }
        }
      }, 1000);
    } else {
      clearInterval(timerInterval);
    }
    return () => clearInterval(timerInterval);
  }, [pomodoroIsActive, pomodoroMinutes, pomodoroSeconds, pomodoroMode, pomodoroWorkTime, pomodoroBreakTime]);

  const handleWorkTimeChange = (mins: number) => {
    setPomodoroWorkTime(mins);
    if (!pomodoroIsActive && pomodoroMode === 'work') {
      setPomodoroMinutes(mins);
      setPomodoroSeconds(0);
    }
  };

  const handleBreakTimeChange = (mins: number) => {
    setPomodoroBreakTime(mins);
    if (!pomodoroIsActive && pomodoroMode === 'break') {
      setPomodoroMinutes(mins);
      setPomodoroSeconds(0);
    }
  };

  const resetPomodoro = () => {
    setPomodoroIsActive(false);
    setPomodoroMode('work');
    setPomodoroMinutes(pomodoroWorkTime);
    setPomodoroSeconds(0);
  };

  const handleAuthSuccess = () => {
    checkUserSession();
    fetchLeaderboard();
  };

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    setUser(null);
    setIsEditMode(false);
    setActiveTab('home');
  };

  const handleSolved = () => {
    if (user) {
      checkUserSession();
      // Live leaderboard update!
      if (activeTaskId) {
        fetchSideLeaderboard('task', activeTaskId);
      }
    } else {
      const saved = localStorage.getItem('aufgabengenerator_score');
      setGuestScore(saved ? parseInt(saved, 10) : 0);
    }
  };

  // Profile update submission
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('auth_token');
    if (!user || !token) return;

    setProfileMessage(null);
    setSavingProfile(true);

    try {
      const response = await fetch('http://localhost:5000/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          displayName: editDisplayName,
          profilePic: editProfilePic,
          newPassword: editPassword
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error?.message || 'Fehler beim Aktualisieren des Profils.');
      }

      setProfileMessage({ type: 'success', text: 'Profil erfolgreich aktualisiert!' });
      setEditPassword('');
      setIsEditMode(false);
      
      // Reload profile
      checkUserSession();
      // Refresh rankings
      fetchLeaderboard();
    } catch (err: any) {
      setProfileMessage({ type: 'error', text: err.message || 'Verbindung fehlgeschlagen.' });
    } finally {
      setSavingProfile(false);
    }
  };

  // Convert uploaded image to Base64
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1.5 * 1024 * 1024) {
        alert('Das Bild darf maximal 1.5 MB groß sein.');
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setEditProfilePic(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const getActiveScore = () => {
    return user ? user.solvedCount : guestScore;
  };

  const formatTime = (mins: number, secs: number) => {
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getProgressPercentage = () => {
    const totalSecs = pomodoroMode === 'work' ? pomodoroWorkTime * 60 : pomodoroBreakTime * 60;
    const remainingSecs = pomodoroMinutes * 60 + pomodoroSeconds;
    return ((totalSecs - remainingSecs) / totalSecs) * 100;
  };

  return (
    <div className="min-h-screen flex flex-col transition-colors duration-200">
      {/* Decorative blobs */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-600/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-indigo-600/5 rounded-full blur-3xl pointer-events-none" />

      {/* Navigation Header */}
      <header className="w-full py-4 px-6 border-b border-theme-border bg-theme-bg/85 backdrop-blur-md sticky top-0 z-40 transition-colors duration-200">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          
          {/* Logo & Slogan */}
          <div 
            className="flex items-center gap-3 cursor-pointer" 
            onClick={() => { setActiveTab('home'); setActiveTaskId(null); }}
            id="brand-logo-panel"
          >
            <div className="p-2 bg-gradient-to-tr from-purple-600 to-indigo-600 rounded-xl shadow-lg shadow-purple-500/20">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold font-display text-theme-primary m-0 leading-tight">
                AufgabenGenerator
              </h1>
              <p className="text-xs text-theme-muted font-medium">Lerne mit unendlich vielen Aufgaben</p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex bg-theme-card border border-theme-border p-1 rounded-xl" id="navigation-tabs-list">
            <button
              onClick={() => { setActiveTab('home'); setActiveTaskId(null); }}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                activeTab === 'home'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'text-theme-secondary hover:text-theme-primary'
              }`}
            >
              <Home className="w-4 h-4" /> Start
            </button>
            <button
              onClick={() => setActiveTab('tasks')}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                activeTab === 'tasks'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'text-theme-secondary hover:text-theme-primary'
              }`}
            >
              <BookOpen className="w-4 h-4" /> Aufgaben
            </button>
            <button
              onClick={() => setActiveTab('leaderboard')}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                activeTab === 'leaderboard'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'text-theme-secondary hover:text-theme-primary'
              }`}
            >
              <Trophy className="w-4 h-4" /> Bestenliste
            </button>
            <button
              onClick={() => setActiveTab('profile')}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                activeTab === 'profile'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'text-theme-secondary hover:text-theme-primary'
              }`}
            >
              <User className="w-4 h-4" /> Profil
            </button>
          </nav>

          {/* Actions: Theme Toggle & Login/Logout */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setIsOnboardingOpen(true)}
              className="p-2.5 bg-theme-card hover:bg-purple-500/10 border border-theme-border hover:border-purple-500/30 rounded-xl text-theme-muted hover:text-purple-600 transition-all cursor-pointer shadow-sm flex items-center justify-center"
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
                className="flex items-center gap-1.5 px-4 py-2.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-350 font-semibold rounded-xl text-xs border border-rose-500/20 transition-all cursor-pointer"
                id="login-btn"
              >
                <LogOut className="w-3.5 h-3.5" /> Logout
              </button>
            ) : (
              <button
                onClick={() => setIsAuthModalOpen(true)}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-semibold rounded-xl text-xs shadow-md shadow-purple-500/10 transition-all cursor-pointer"
                id="login-btn"
              >
                <LogIn className="w-3.5 h-3.5" /> Login
              </button>
            )}
          </div>

        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-grow flex items-center justify-center py-6 px-4 z-10">
        
        {/* TAB 1: Startseite / Dashboard */}
        {activeTab === 'home' && (
          <div className="w-full max-w-4xl mx-auto space-y-6 animate-fadeIn">
            {/* Welcoming Card */}
            <div className="glass-panel rounded-3xl p-6 md:p-8 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                  <h2 className="text-3xl font-extrabold font-display text-theme-primary mb-2">
                    Hallo, {user ? user.displayName : 'Gast'}! 👋
                  </h2>
                  <p className="text-theme-secondary text-sm md:text-base max-w-lg leading-relaxed">
                    Willkommen zurück auf deinem Aufgabengenerator-Dashboard. Wähle unten ein Lernfach aus oder setze deinen Pomodoro-Fokus-Timer, um direkt loszulegen!
                  </p>
                </div>
                <div className="flex gap-4 shrink-0">
                  <div className="text-center p-4 bg-theme-card border border-theme-border rounded-2xl w-24 shadow-sm">
                    <span className="block text-2xl font-extrabold text-theme-primary">{getActiveScore()}</span>
                    <span className="text-[10px] text-theme-muted uppercase font-bold tracking-wider">Punkte</span>
                  </div>
                  <div className="text-center p-4 bg-theme-card border border-theme-border rounded-2xl w-24 shadow-sm">
                    <span className="block text-2xl font-extrabold text-theme-primary">{user ? 1 : 0}</span>
                    <span className="text-[10px] text-theme-muted uppercase font-bold tracking-wider">Module</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Main Home Grid (Quicknav & Pomodoro Config) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Quick Navigation Panel */}
              <div className="glass-panel rounded-3xl p-6 flex flex-col justify-between">
                <div>
                  <h3 className="text-lg font-bold font-display text-theme-primary mb-4 flex items-center gap-2">
                    <Compass className="w-5 h-5 text-purple-650" /> Schnellzugriff
                  </h3>
                  <div className="space-y-3">
                    <button
                      onClick={() => setActiveTab('tasks')}
                      className="w-full flex items-center justify-between p-4 bg-theme-card hover:brightness-95 dark:hover:brightness-110 border border-theme-border rounded-2xl transition-all cursor-pointer group text-left shadow-sm"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-purple-500/10 rounded-xl border border-purple-500/20 text-purple-600 dark:text-purple-400">
                          <BookOpen className="w-5 h-5" />
                        </div>
                        <div>
                          <span className="font-bold text-theme-primary block text-sm">Übungsaufgaben rechnen</span>
                          <span className="text-theme-muted text-xs font-medium">Unendliche Fragen generieren & loesen</span>
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-theme-muted group-hover:translate-x-1 transition-transform" />
                    </button>

                    <button
                      onClick={() => setActiveTab('leaderboard')}
                      className="w-full flex items-center justify-between p-4 bg-theme-card hover:brightness-95 dark:hover:brightness-110 border border-theme-border rounded-2xl transition-all cursor-pointer group text-left shadow-sm"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-emerald-500/10 rounded-xl border border-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                          <Trophy className="w-5 h-5" />
                        </div>
                        <div>
                          <span className="font-bold text-theme-primary block text-sm">Bestenliste einsehen</span>
                          <span className="text-theme-muted text-xs font-medium">Vergleiche deine Leistungen mit anderen</span>
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-theme-muted group-hover:translate-x-1 transition-transform" />
                    </button>

                    <button
                      onClick={() => setActiveTab('profile')}
                      className="w-full flex items-center justify-between p-4 bg-theme-card hover:brightness-95 dark:hover:brightness-110 border border-theme-border rounded-2xl transition-all cursor-pointer group text-left shadow-sm"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-blue-500/10 rounded-xl border border-blue-500/20 text-blue-600 dark:text-blue-400">
                          <User className="w-5 h-5" />
                        </div>
                        <div>
                          <span className="font-bold text-theme-primary block text-sm">Mein Profil bearbeiten</span>
                          <span className="text-theme-muted text-xs font-medium">Passwort, Name und Profilbild anpassen</span>
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-theme-muted group-hover:translate-x-1 transition-transform" />
                    </button>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-theme-border flex items-center gap-2 text-xs text-theme-muted">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  <span>Deine Daten werden sicher in der SQLite-Datenbank verschlüsselt.</span>
                </div>
              </div>

              {/* Pomodoro Timer Configuration & Visual Panel */}
              <div className="glass-panel rounded-3xl p-6 flex flex-col justify-between">
                <div>
                  <h3 className="text-lg font-bold font-display text-theme-primary mb-4 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-purple-600" /> Pomodoro Timer
                  </h3>

                  {/* Circular Timer Visual Display */}
                  <div className="flex flex-col items-center justify-center py-4 relative">
                    <div className="relative w-36 h-36 flex items-center justify-center">
                      {/* SVG Circular Ring */}
                      <svg className="w-full h-full -rotate-90">
                        <circle
                          cx="72"
                          cy="72"
                          r="64"
                          className="stroke-theme-card fill-none"
                          strokeWidth="6"
                        />
                        <circle
                          cx="72"
                          cy="72"
                          r="64"
                          className={`fill-none transition-all duration-1000 ${
                            pomodoroMode === 'work' ? 'stroke-purple-600' : 'stroke-emerald-500'
                          }`}
                          strokeWidth="7"
                          strokeDasharray={402}
                          strokeDashoffset={402 - (402 * getProgressPercentage()) / 100}
                          strokeLinecap="round"
                        />
                      </svg>
                      <div className="absolute flex flex-col items-center justify-center">
                        <span className="text-2xl font-extrabold text-theme-primary tabular-nums">
                          {formatTime(pomodoroMinutes, pomodoroSeconds)}
                        </span>
                        <span className={`text-[10px] font-bold uppercase tracking-wider mt-1 ${
                          pomodoroMode === 'work' ? 'text-purple-600' : 'text-emerald-500'
                        }`}>
                          {pomodoroMode === 'work' ? 'Fokuszeit' : 'Pause'}
                        </span>
                      </div>
                    </div>

                    {/* Quick controls */}
                    <div className="flex items-center gap-3 mt-4">
                      <button
                        onClick={() => setPomodoroIsActive(!pomodoroIsActive)}
                        className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                          pomodoroIsActive 
                            ? 'bg-rose-500/10 hover:bg-rose-500/20 border-rose-500/20 text-rose-600' 
                            : 'bg-purple-600 hover:bg-purple-500 text-white border-transparent shadow-md'
                        }`}
                      >
                        {pomodoroIsActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={resetPomodoro}
                        className="p-2.5 bg-theme-card hover:brightness-95 dark:hover:brightness-110 border border-theme-border rounded-xl text-theme-muted hover:text-theme-primary transition-colors cursor-pointer"
                        title="Timer zurücksetzen"
                      >
                        <RotateCcw className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Customizable durations with sliders */}
                  <div className="space-y-4 mt-4 border-t border-theme-border pt-4">
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="block text-[10px] font-bold text-theme-muted uppercase tracking-wider">
                          Fokuszeit
                        </label>
                        <span className="text-xs font-bold text-purple-600 dark:text-purple-400">
                          {pomodoroWorkTime} Min.
                        </span>
                      </div>
                      <input
                        type="range"
                        min="5"
                        max="60"
                        step="1"
                        value={pomodoroWorkTime}
                        onChange={(e) => handleWorkTimeChange(parseInt(e.target.value, 10) || 25)}
                        className="w-full accent-purple-600 cursor-pointer bg-theme-card rounded-lg h-2"
                      />
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="block text-[10px] font-bold text-theme-muted uppercase tracking-wider">
                          Pause
                        </label>
                        <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                          {pomodoroBreakTime} Min.
                        </span>
                      </div>
                      <input
                        type="range"
                        min="1"
                        max="30"
                        step="1"
                        value={pomodoroBreakTime}
                        onChange={(e) => handleBreakTimeChange(parseInt(e.target.value, 10) || 5)}
                        className="w-full accent-emerald-500 cursor-pointer bg-theme-card rounded-lg h-2"
                      />
                    </div>
                  </div>

                </div>
              </div>

            </div>
          </div>
        )}

        {/* TAB 2: Aufgaben (Split Screen Dashboard Layout) */}
        {activeTab === 'tasks' && (
          <div className="w-full max-w-6xl mx-auto flex flex-col lg:flex-row gap-6 items-stretch animate-fadeIn" id="tasks-split-layout">
            
            {/* Left Side: Selector or Task Solver */}
            <div className="flex-grow flex items-center justify-center">
              {activeTaskId === 'lin_alg_det' ? (
                <DeterminantTask 
                  user={user} 
                  onSolved={handleSolved}
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

            {/* Right Side: Contextual live-updating module/task Leaderboard */}
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
                    {activeTaskId ? 'Typ: 2x2 Determinante' : `Modul: ${
                      activeModuleId === 'lin_alg' ? 'LA - Lineare Algebra' :
                      activeModuleId === 'os' ? 'BUS - Betriebssysteme' :
                      activeModuleId === 'formal_sys' ? 'FOSAP - Formale Systeme' :
                      'DSAL - Algorithmen & Datenstrukturen'
                    }`}
                  </span>

                  {loadingSideLeaderboard ? (
                    <div className="flex flex-col items-center justify-center py-16 gap-3">
                      <RefreshCw className="w-6 h-6 text-purple-500 animate-spin" />
                      <p className="text-[10px] text-theme-muted">Rangliste wird geladen...</p>
                    </div>
                  ) : sideLeaderboard.length > 0 ? (
                    <div className="space-y-2 max-h-[450px] overflow-y-auto pr-1">
                      {sideLeaderboard.map((item, idx) => (
                        <div
                          key={idx}
                          className={`flex items-center justify-between p-3 rounded-xl border text-xs transition-all ${
                            item.isUser
                              ? 'bg-purple-500/10 dark:bg-purple-500/15 border-purple-500/35'
                              : 'bg-theme-card border-theme-border'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] shrink-0 ${
                              idx === 0 ? 'bg-amber-500/20 text-amber-600 dark:text-amber-455' :
                              idx === 1 ? 'bg-theme-card border border-theme-border text-theme-secondary font-bold' :
                              idx === 2 ? 'bg-amber-700/20 text-amber-800 dark:text-amber-600' :
                              'bg-theme-card border border-theme-border/50 text-theme-muted font-bold'
                            }`}>
                              {idx + 1}
                            </span>

                            {/* Avatar image */}
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
        )}

        {/* TAB 3: Bestenliste (Dedicated Tabs filter rankings view) */}
        {activeTab === 'leaderboard' && (
          <div className="w-full max-w-2xl mx-auto px-4 animate-fadeIn" id="leaderboard-ranking-panel">
            <div className="glass-panel rounded-3xl p-6 md:p-8">
              <h2 className="text-2xl font-bold font-display text-theme-primary mb-2">Bestenliste</h2>
              <p className="text-theme-secondary text-sm mb-6">Messe dich mit deinen Kommilitonen.</p>

              {/* Filtering Controls */}
              <div className="flex flex-col sm:flex-row gap-3 mb-6 p-4 bg-theme-card border border-theme-border rounded-2xl">
                <div className="flex-grow">
                  <label className="block text-[10px] font-bold text-theme-muted uppercase tracking-wider mb-1">
                    Bestenlisten-Typ
                  </label>
                  <select
                    value={leaderboardFilter}
                    onChange={(e) => setLeaderboardFilter(e.target.value as LeaderboardFilterType)}
                    className="w-full px-3 py-2 bg-theme-input border border-theme-border rounded-xl text-theme-primary text-sm font-medium focus:outline-none focus:border-purple-500"
                  >
                    <option value="global">Gesamte Bestenliste</option>
                    <option value="module">Nach Modul</option>
                    <option value="task">Nach Aufgabe</option>
                  </select>
                </div>

                {leaderboardFilter === 'module' && (
                  <div className="flex-grow animate-fadeIn">
                    <label className="block text-[10px] font-bold text-theme-muted uppercase tracking-wider mb-1">
                      Wähle Modul
                    </label>
                    <select
                      value={selectedModuleFilter}
                      onChange={(e) => setSelectedModuleFilter(e.target.value)}
                      className="w-full px-3 py-2 bg-theme-input border border-theme-border rounded-xl text-theme-primary text-sm font-medium focus:outline-none focus:border-purple-500"
                    >
                      <option value="Lineare Algebra">LA - Lineare Algebra</option>
                      <option value="Betriebssysteme">BUS - Betriebssysteme</option>
                      <option value="Formale Systeme">FOSAP - Formale Systeme</option>
                      <option value="Algorithmen & Datenstrukturen">DSAL - Algorithmen & Datenstrukturen</option>
                    </select>
                  </div>
                )}

                {leaderboardFilter === 'task' && (
                  <div className="flex-grow animate-fadeIn">
                    <label className="block text-[10px] font-bold text-theme-muted uppercase tracking-wider mb-1">
                      Wähle Aufgabe
                    </label>
                    <select
                      value={selectedTaskFilter}
                      onChange={(e) => setSelectedTaskFilter(e.target.value)}
                      className="w-full px-3 py-2 bg-theme-input border border-theme-border rounded-xl text-theme-primary text-sm font-medium focus:outline-none focus:border-purple-500"
                    >
                      <option value="lin_alg_det">2x2 Determinante</option>
                    </select>
                  </div>
                )}
              </div>

              {/* Leaderboard list */}
              {loadingLeaderboard ? (
                <div className="flex flex-col items-center justify-center py-16 gap-4">
                  <RefreshCw className="w-8 h-8 text-purple-500 animate-spin" />
                  <p className="text-theme-muted text-xs">Bestenliste wird aktualisiert...</p>
                </div>
              ) : leaderboard.length > 0 ? (
                <div className="space-y-2.5">
                  {leaderboard.map((item, index) => (
                    <div
                      key={index}
                      className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${
                        item.isUser
                          ? 'bg-purple-500/10 dark:bg-purple-500/15 border-purple-500/35 shadow-sm'
                          : 'bg-theme-card border-theme-border'
                      }`}
                    >
                      <div className="flex items-center gap-4.5">
                        <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                          index === 0 ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/35' :
                          index === 1 ? 'bg-theme-card border border-theme-border text-theme-secondary font-bold' :
                          index === 2 ? 'bg-amber-700/20 text-amber-800 dark:text-amber-600 border border-amber-700/35' :
                          'bg-theme-card border border-theme-border text-theme-muted font-bold'
                        }`}>
                          {index + 1}
                        </span>

                        {/* Profile Pic in Leaderboard */}
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
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-theme-muted text-sm">
                  Keine Einträge für diese Filter-Auswahl vorhanden. Löse Aufgaben, um hier zu erscheinen!
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 4: Profil (Profile Settings Panel) */}
        {activeTab === 'profile' && (
          <div className="w-full max-w-2xl mx-auto px-4 animate-fadeIn" id="profile-details-panel">
            {user ? (
              <div className="glass-panel rounded-3xl p-6 md:p-8">
                
                {/* Profile Header and Editor */}
                {!isEditMode ? (
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                    <div className="flex items-center gap-4">
                      {/* Avatar Render */}
                      <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-purple-500 to-indigo-500 flex items-center justify-center overflow-hidden shadow-lg border border-theme-border shrink-0">
                        {user.profilePic ? (
                          <img src={user.profilePic} className="w-full h-full object-cover" alt="Profilbild" />
                        ) : (
                          <span className="text-2xl font-bold text-white uppercase">{user.displayName.substring(0, 2)}</span>
                        )}
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold font-display text-theme-primary">{user.displayName}</h2>
                        <p className="text-theme-muted text-xs font-semibold">@{user.username}</p>
                        <p className="text-[10px] text-theme-muted mt-1 font-semibold">Registriert: {new Date(user.createdAt).toLocaleDateString('de-DE')}</p>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setIsEditMode(true);
                        setEditDisplayName(user.displayName);
                        setEditProfilePic(user.profilePic || '');
                        setEditPassword('');
                        setProfileMessage(null);
                      }}
                      className="px-4 py-2 border border-theme-border hover:border-purple-500/40 text-theme-secondary hover:text-purple-650 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Edit className="w-3.5 h-3.5" /> Bearbeiten
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleUpdateProfile} className="space-y-5 mb-6">
                    <h3 className="text-lg font-bold font-display text-theme-primary">Profil bearbeiten</h3>
                    
                    {/* Avatar Upload field */}
                    <div className="flex items-center gap-4 p-4 bg-theme-card border border-theme-border rounded-2xl">
                      <div className="relative w-16 h-16 rounded-2xl bg-theme-input flex items-center justify-center overflow-hidden border border-theme-border shrink-0">
                        {editProfilePic ? (
                          <img src={editProfilePic} className="w-full h-full object-cover" alt="Vorschau" />
                        ) : (
                          <span className="text-2xl font-bold text-theme-muted uppercase">{editDisplayName.substring(0, 2)}</span>
                        )}
                        <label className="absolute inset-0 bg-black/50 hover:bg-black/60 cursor-pointer flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                          <Camera className="w-5 h-5 text-white" />
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleFileChange}
                            className="hidden"
                          />
                        </label>
                      </div>
                      <div>
                        <span className="text-xs font-bold text-theme-primary block mb-1">Profilbild hochladen</span>
                        <span className="text-[10px] text-theme-muted block leading-relaxed font-semibold">Klicke auf das Vorschaubild zum Auswählen. Maximal 1.5 MB (PNG/JPG).</span>
                      </div>
                    </div>

                    {/* Display name field */}
                    <div>
                      <label className="block text-xs font-bold text-theme-muted uppercase tracking-wider mb-1.5 pl-1">
                        Anzeigename
                      </label>
                      <input
                        type="text"
                        required
                        value={editDisplayName}
                        onChange={(e) => setEditDisplayName(e.target.value)}
                        className="w-full px-4 py-2.5 bg-theme-input border border-theme-border rounded-xl text-theme-primary text-sm font-medium focus:outline-none focus:border-purple-500"
                      />
                    </div>

                    {/* Password change field */}
                    <div>
                      <label className="block text-xs font-bold text-theme-muted uppercase tracking-wider mb-1.5 pl-1">
                        Neues Passwort (optional)
                      </label>
                      <input
                        type="password"
                        value={editPassword}
                        onChange={(e) => setEditPassword(e.target.value)}
                        placeholder="Freilassen, falls unverändert"
                        className="w-full px-4 py-2.5 bg-theme-input border border-theme-border rounded-xl text-theme-primary text-sm font-medium focus:outline-none focus:border-purple-500"
                      />
                    </div>

                    {/* Form Message */}
                    {profileMessage && (
                      <div className={`p-3 text-xs font-medium rounded-xl leading-relaxed ${
                        profileMessage.type === 'success'
                          ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-600'
                          : 'bg-rose-500/10 border border-rose-500/20 text-rose-600'
                      }`}>
                        {profileMessage.text}
                      </div>
                    )}

                    {/* Edit Buttons */}
                    <div className="flex gap-2">
                      <button
                        type="submit"
                        disabled={savingProfile || editDisplayName.trim().length < 2}
                        className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold rounded-xl text-xs transition-all shadow-md flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        {savingProfile ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Save className="w-3.5 h-3.5" />
                        )}
                        Speichern
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setIsEditMode(false);
                          setProfileMessage(null);
                        }}
                        className="px-5 py-2.5 border border-theme-border text-theme-secondary hover:text-theme-primary font-semibold rounded-xl text-xs transition-all cursor-pointer"
                      >
                        Abbrechen
                      </button>
                    </div>
                  </form>
                )}

                {/* Stats Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                  <div className="p-4 bg-theme-card border border-theme-border rounded-2xl flex flex-col justify-between shadow-sm" id="solved-tasks-badge">
                    <div className="flex justify-between items-start text-purple-600 dark:text-purple-400 mb-2">
                      <Trophy className="w-5 h-5" />
                      <span className="text-xs text-theme-muted font-bold uppercase tracking-wider">Punkte</span>
                    </div>
                    <div>
                      <span className="text-2xl font-extrabold text-theme-primary">{getActiveScore()}</span>
                      <span className="block text-xs text-theme-muted mt-1 font-semibold">gelöste Aufgaben</span>
                    </div>
                  </div>

                  <div className="p-4 bg-theme-card border border-theme-border rounded-2xl flex flex-col justify-between shadow-sm">
                    <div className="flex justify-between items-start text-emerald-600 dark:text-emerald-400 mb-2">
                      <BookOpen className="w-5 h-5" />
                      <span className="text-xs text-theme-muted font-bold uppercase tracking-wider">Module</span>
                    </div>
                    <div>
                      <span className="text-2xl font-extrabold text-theme-primary">
                        {user.solvedCount > 0 ? 1 : 0}
                      </span>
                      <span className="block text-xs text-theme-muted mt-1 font-semibold">aktive Fächer</span>
                    </div>
                  </div>

                  <div className="p-4 bg-theme-card border border-theme-border rounded-2xl flex flex-col justify-between shadow-sm">
                    <div className="flex justify-between items-start text-blue-600 dark:text-blue-400 mb-2">
                      <Clock className="w-5 h-5" />
                      <span className="text-xs text-theme-muted font-bold uppercase tracking-wider">Status</span>
                    </div>
                    <div>
                      <span className="text-xl font-extrabold text-theme-primary truncate block">
                        {user.solvedCount >= 10 ? 'Fortgeschritten' : 'Anfänger'}
                      </span>
                      <span className="block text-xs text-theme-muted mt-1 font-semibold">Lernniveau</span>
                    </div>
                  </div>
                </div>

                {/* Achievements */}
                <h3 className="text-sm font-bold text-theme-muted uppercase tracking-wider mb-4">Erfolge</h3>
                <div className="space-y-3">
                  <div className={`flex items-center gap-3.5 p-3.5 rounded-2xl border transition-all ${
                    user.solvedCount >= 1 
                      ? 'bg-theme-card border-theme-border opacity-100 shadow-sm'
                      : 'bg-theme-card/30 border-theme-border/30 opacity-40'
                  }`}>
                    <Medal className={`w-6 h-6 ${user.solvedCount >= 1 ? 'text-yellow-500' : 'text-theme-muted'}`} />
                    <div>
                      <h4 className="text-sm font-bold text-theme-primary">Erster Schritt</h4>
                      <p className="text-xs text-theme-muted font-medium">Erste Aufgabe im Modul Lineare Algebra richtig gelöst.</p>
                    </div>
                  </div>
                  <div className={`flex items-center gap-3.5 p-3.5 rounded-2xl border transition-all ${
                    user.solvedCount >= 10 
                      ? 'bg-theme-card border-theme-border opacity-100 shadow-sm'
                      : 'bg-theme-card/30 border-theme-border/30 opacity-40'
                  }`}>
                    <Medal className={`w-6 h-6 ${user.solvedCount >= 10 ? 'text-purple-500' : 'text-theme-muted'}`} />
                    <div>
                      <h4 className="text-sm font-bold text-theme-primary">Matrix Meister</h4>
                      <p className="text-xs text-theme-muted font-medium">Löse 10 Determinanten-Aufgaben fehlerfrei.</p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="glass-panel rounded-3xl p-8 text-center">
                <div className="max-w-md mx-auto py-6">
                  <div className="p-3 bg-purple-500/10 rounded-2xl border border-purple-500/20 text-purple-600 dark:text-purple-400 w-fit mx-auto mb-4">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <h2 className="text-2xl font-bold font-display text-theme-primary mb-2">Erstelle ein Profil</h2>
                  <p className="text-theme-secondary text-sm mb-6">
                    Melde dich an, um deine Rechenpunkte dauerhaft zu sichern, deine Erfolge einzusehen und einen Platz in der globalen Rangliste zu ergattern.
                  </p>
                  
                  {/* Guest Session stats */}
                  <div className="p-4 bg-theme-card rounded-2xl border border-theme-border text-left mb-6 shadow-sm">
                    <span className="text-xs text-theme-muted font-bold uppercase tracking-wider block mb-1">
                      Aktuelle Session (Gast)
                    </span>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-semibold text-theme-secondary">Punkte gesammelt:</span>
                      <span className="text-lg font-bold text-purple-600 dark:text-purple-400">{guestScore}</span>
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
      <footer className="py-6 border-t border-theme-border flex flex-col sm:flex-row items-center justify-between gap-4 max-w-6xl w-full mx-auto px-6 text-xs text-theme-muted transition-colors duration-200">
        <p className="font-medium">© {new Date().getFullYear()} AufgabenGenerator. Entwickelt für Uni-Kommilitonen.</p>
        <a
          href="https://github.com/MD16dev/aufgabengenerator"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 px-3.5 py-1.5 bg-theme-card hover:brightness-95 dark:hover:brightness-110 border border-theme-border text-theme-secondary hover:text-theme-primary font-bold rounded-xl transition-all cursor-pointer shadow-sm"
        >
          <Github className="w-4 h-4" /> GitHub Repository
        </a>
      </footer>

      {/* Persistent Floating Glassmorphic Pomodoro Widget (expandable/collapsible) */}
      <div className="fixed bottom-6 right-6 z-40 pointer-events-none">
        {!isWidgetExpanded ? (
          <button
            onClick={() => setIsWidgetExpanded(true)}
            style={{ transition: 'all 0.3s cubic-bezier(0.25, 1, 0.5, 1)' }}
            className={`pointer-events-auto p-3.5 rounded-full glass-panel shadow-2xl flex items-center gap-2 hover:scale-105 cursor-pointer animate-fadeIn ${
              pomodoroIsActive ? 'animate-pulse' : ''
            }`}
          >
            <Clock className={`w-5 h-5 ${pomodoroMode === 'work' ? 'text-purple-600' : 'text-emerald-500'}`} />
            <span className="text-xs font-bold text-theme-primary tabular-nums">
              {formatTime(pomodoroMinutes, pomodoroSeconds)}
            </span>
          </button>
        ) : (
          <div className="pointer-events-auto p-5 rounded-2xl glass-panel shadow-2xl w-64 animate-fadeIn">
            <div className="flex justify-between items-center mb-4">
              <span className="text-xs font-bold text-theme-secondary">Pomodoro Timer</span>
              <button
                onClick={() => setIsWidgetExpanded(false)}
                className="text-[10px] font-bold text-theme-muted hover:text-theme-primary cursor-pointer"
              >
                Minimieren
              </button>
            </div>

            {/* Visual Progress ring inside Widget */}
            <div className="flex flex-col items-center justify-center mb-4">
              <div className="relative w-24 h-24 flex items-center justify-center">
                <svg className="w-full h-full -rotate-90">
                  <circle
                    cx="48"
                    cy="48"
                    r="42"
                    className="stroke-theme-card fill-none"
                    strokeWidth="4"
                  />
                  <circle
                    cx="48"
                    cy="48"
                    r="42"
                    className={`fill-none transition-all duration-1000 ${
                      pomodoroMode === 'work' ? 'stroke-purple-600' : 'stroke-emerald-500'
                    }`}
                    strokeWidth="5"
                    strokeDasharray={264}
                    strokeDashoffset={264 - (264 * getProgressPercentage()) / 100}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute flex flex-col items-center">
                  <span className="text-base font-extrabold text-theme-primary tabular-nums">
                    {formatTime(pomodoroMinutes, pomodoroSeconds)}
                  </span>
                  <span className={`text-[8px] font-extrabold uppercase ${
                    pomodoroMode === 'work' ? 'text-purple-600' : 'text-emerald-500'
                  }`}>
                    {pomodoroMode === 'work' ? 'Fokus' : 'Pause'}
                  </span>
                </div>
              </div>
            </div>

            {/* Small inline widget controls */}
            <div className="flex justify-center gap-2">
              <button
                onClick={() => setPomodoroIsActive(!pomodoroIsActive)}
                className="flex-grow py-1.5 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-lg text-xs cursor-pointer flex justify-center items-center gap-1 shadow-sm"
              >
                {pomodoroIsActive ? (
                  <>
                    <Pause className="w-3 h-3" /> Pause
                  </>
                ) : (
                  <>
                    <Play className="w-3 h-3" /> Start
                  </>
                )}
              </button>
              <button
                onClick={resetPomodoro}
                className="p-1.5 bg-theme-card hover:brightness-95 dark:hover:brightness-110 border border-theme-border text-theme-muted hover:text-theme-primary rounded-lg cursor-pointer"
                title="Zurücksetzen"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

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
