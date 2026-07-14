import { useState, useEffect } from 'react';
import { ModuleSelector } from './components/ModuleSelector';
import { DeterminantTask } from './components/DeterminantTask';
import { ThemeToggle } from './components/ThemeToggle';
import { AuthModal } from './components/AuthModal';
import { OnboardingTour } from './components/OnboardingTour';
import { 
  GraduationCap, Trophy, User, BookOpen, Clock, Medal, 
  LogIn, LogOut, RefreshCw, Sparkles, HelpCircle, Edit, Save, Camera
} from 'lucide-react';

type TabType = 'tasks' | 'leaderboard' | 'profile';
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
  const [activeTab, setActiveTab] = useState<TabType>('tasks');
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
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

  // Leaderboard state & filters
  const [leaderboard, setLeaderboard] = useState<LeaderboardItem[]>([]);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState<boolean>(false);
  const [leaderboardFilter, setLeaderboardFilter] = useState<LeaderboardFilterType>('global');
  const [selectedModuleFilter, setSelectedModuleFilter] = useState<string>('Lineare Algebra');
  const [selectedTaskFilter, setSelectedTaskFilter] = useState<string>('lin_alg_det');

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

  useEffect(() => {
    checkUserSession();
    
    // Check if onboarding needs to be shown (first visit)
    const onboardingDone = localStorage.getItem('aufgabengenerator_onboarding_completed');
    if (!onboardingDone) {
      setIsOnboardingOpen(true);
    }
  }, []);

  // Fetch leaderboard when switching to its tab or changing filters
  useEffect(() => {
    if (activeTab === 'leaderboard') {
      fetchLeaderboard();
    }
  }, [activeTab, leaderboardFilter, selectedModuleFilter, selectedTaskFilter]);

  const handleAuthSuccess = () => {
    checkUserSession();
    fetchLeaderboard();
  };

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    setUser(null);
    setIsEditMode(false);
    setActiveTab('tasks');
  };

  const handleSolved = () => {
    if (user) {
      checkUserSession();
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

  return (
    <div className="min-h-screen flex flex-col transition-colors duration-300">
      {/* Decorative blobs */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-600/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-indigo-600/5 rounded-full blur-3xl pointer-events-none" />

      {/* Navigation Header */}
      <header className="w-full py-4 px-6 border-b border-slate-200 dark:border-slate-800/40 bg-slate-950/20 backdrop-blur-md sticky top-0 z-40 transition-colors duration-300">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          
          {/* Logo & Slogan */}
          <div 
            className="flex items-center gap-3 cursor-pointer" 
            onClick={() => { setActiveTab('tasks'); setActiveTaskId(null); }}
            id="brand-logo-panel"
          >
            <div className="p-2 bg-gradient-to-tr from-purple-600 to-indigo-600 rounded-xl shadow-lg shadow-purple-500/20">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold font-display text-slate-800 dark:text-slate-100 m-0 leading-tight">
                AufgabenGenerator
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Lerne mit unendlich vielen Aufgaben</p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex bg-slate-200/50 dark:bg-slate-900/40 p-1 rounded-xl border border-slate-300 dark:border-slate-800/60" id="navigation-tabs-list">
            <button
              onClick={() => setActiveTab('tasks')}
              className={`flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                activeTab === 'tasks'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <BookOpen className="w-4 h-4" /> Aufgaben
            </button>
            <button
              onClick={() => setActiveTab('leaderboard')}
              className={`flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                activeTab === 'leaderboard'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Trophy className="w-4 h-4" /> Bestenliste
            </button>
            <button
              onClick={() => setActiveTab('profile')}
              className={`flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                activeTab === 'profile'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <User className="w-4 h-4" /> Profil
            </button>
          </nav>

          {/* Actions: Theme Toggle & Login/Logout */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setIsOnboardingOpen(true)}
              className="p-2.5 bg-slate-100/50 dark:bg-slate-900/40 hover:bg-purple-500/10 border border-slate-300 dark:border-slate-800 hover:border-purple-500/30 rounded-xl text-slate-500 dark:text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 transition-all cursor-pointer shadow-sm flex items-center justify-center"
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
                className="flex items-center gap-1.5 px-4 py-2.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-300 font-semibold rounded-xl text-xs border border-rose-500/20 transition-all cursor-pointer"
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
          <div className="w-full max-w-2xl mx-auto px-4 animate-fadeIn" id="leaderboard-ranking-panel">
            <div className="glass-panel rounded-3xl p-6 md:p-8 glow-purple">
              <h2 className="text-2xl font-bold font-display text-slate-800 dark:text-slate-100 mb-2">Bestenliste</h2>
              <p className="text-slate-600 dark:text-slate-400 text-sm mb-6">Messe dich mit deinen Kommilitonen.</p>

              {/* Filtering Controls */}
              <div className="flex flex-col sm:flex-row gap-3 mb-6 p-4 bg-slate-100/50 dark:bg-slate-900/20 border border-slate-200 dark:border-slate-850 rounded-2xl">
                <div className="flex-grow">
                  <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                    Bestenlisten-Typ
                  </label>
                  <select
                    value={leaderboardFilter}
                    onChange={(e) => setLeaderboardFilter(e.target.value as LeaderboardFilterType)}
                    className="w-full px-3 py-2 bg-slate-200/50 dark:bg-slate-950/40 border border-slate-350 dark:border-slate-700/60 rounded-xl text-slate-800 dark:text-slate-200 text-sm font-medium focus:outline-none focus:border-purple-500"
                  >
                    <option value="global">Gesamte Bestenliste</option>
                    <option value="module">Nach Modul</option>
                    <option value="task">Nach Aufgabe</option>
                  </select>
                </div>

                {leaderboardFilter === 'module' && (
                  <div className="flex-grow animate-fadeIn">
                    <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                      Wähle Modul
                    </label>
                    <select
                      value={selectedModuleFilter}
                      onChange={(e) => setSelectedModuleFilter(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-200/50 dark:bg-slate-950/40 border border-slate-350 dark:border-slate-700/60 rounded-xl text-slate-800 dark:text-slate-200 text-sm font-medium focus:outline-none focus:border-purple-500"
                    >
                      <option value="Lineare Algebra">Lineare Algebra</option>
                      <option value="Betriebssysteme">Betriebssysteme</option>
                      <option value="Formale Systeme">Formale Systeme</option>
                      <option value="Algorithmen & Datenstrukturen">Algorithmen & Datenstrukturen</option>
                    </select>
                  </div>
                )}

                {leaderboardFilter === 'task' && (
                  <div className="flex-grow animate-fadeIn">
                    <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                      Wähle Aufgabe
                    </label>
                    <select
                      value={selectedTaskFilter}
                      onChange={(e) => setSelectedTaskFilter(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-200/50 dark:bg-slate-950/40 border border-slate-350 dark:border-slate-700/60 rounded-xl text-slate-800 dark:text-slate-200 text-sm font-medium focus:outline-none focus:border-purple-500"
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
                  <p className="text-slate-500 dark:text-slate-400 text-xs">Bestenliste wird aktualisiert...</p>
                </div>
              ) : leaderboard.length > 0 ? (
                <div className="space-y-2.5">
                  {leaderboard.map((item, index) => (
                    <div
                      key={index}
                      className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${
                        item.isUser
                          ? 'bg-purple-500/10 dark:bg-purple-500/15 border-purple-500/30 dark:border-purple-500/40 shadow-sm'
                          : 'bg-slate-100/50 dark:bg-slate-900/30 border-slate-200 dark:border-slate-800/40'
                      }`}
                    >
                      <div className="flex items-center gap-4.5">
                        <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                          index === 0 ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/35' :
                          index === 1 ? 'bg-slate-400/25 text-slate-600 dark:text-slate-300 border border-slate-400/35' :
                          index === 2 ? 'bg-amber-700/20 text-amber-800 dark:text-amber-600 border border-amber-700/35' :
                          'bg-slate-200 dark:bg-slate-800/40 text-slate-500 dark:text-slate-400 border border-slate-300 dark:border-transparent'
                        }`}>
                          {index + 1}
                        </span>

                        {/* Profile Pic in Leaderboard */}
                        <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center overflow-hidden border border-slate-300 dark:border-slate-800 shrink-0">
                          {item.profilePic ? (
                            <img src={item.profilePic} className="w-full h-full object-cover" alt="" />
                          ) : (
                            <span className="text-xs font-bold text-purple-600 dark:text-purple-400 uppercase">{item.displayName.substring(0, 2)}</span>
                          )}
                        </div>

                        <div>
                          <span className="font-semibold text-slate-800 dark:text-slate-200">{item.displayName}</span>
                          <span className="block text-[10px] text-slate-500 font-medium">@{item.username}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-800 dark:text-slate-100">{item.solvedCount}</span>
                        <span className="text-xs text-slate-500 dark:text-slate-400">gelöst</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-slate-500 dark:text-slate-400 text-sm">
                  Keine Einträge für diese Filter-Auswahl vorhanden. Löse Aufgaben, um hier zu erscheinen!
                </div>
              )}
            </div>
          </div>
        )}

        {/* Dynamic Profile tab */}
        {activeTab === 'profile' && (
          <div className="w-full max-w-2xl mx-auto px-4 animate-fadeIn" id="profile-details-panel">
            {user ? (
              <div className="glass-panel rounded-3xl p-6 md:p-8 glow-purple">
                
                {/* Profile Header and Editor */}
                {!isEditMode ? (
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                    <div className="flex items-center gap-4">
                      {/* Avatar Render */}
                      <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-purple-500 to-indigo-500 flex items-center justify-center overflow-hidden shadow-lg border border-slate-200 dark:border-slate-800 shrink-0">
                        {user.profilePic ? (
                          <img src={user.profilePic} className="w-full h-full object-cover" alt="Profilbild" />
                        ) : (
                          <span className="text-2xl font-bold text-white uppercase">{user.displayName.substring(0, 2)}</span>
                        )}
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold font-display text-slate-800 dark:text-slate-100">{user.displayName}</h2>
                        <p className="text-slate-500 dark:text-slate-400 text-xs font-semibold">@{user.username}</p>
                        <p className="text-[10px] text-slate-400 mt-1">Registriert: {new Date(user.createdAt).toLocaleDateString('de-DE')}</p>
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
                      className="px-4 py-2 border border-slate-300 dark:border-slate-800 hover:border-purple-500/40 text-slate-600 dark:text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Edit className="w-3.5 h-3.5" /> Bearbeiten
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleUpdateProfile} className="space-y-5 mb-6">
                    <h3 className="text-lg font-bold font-display text-slate-800 dark:text-slate-100">Profil bearbeiten</h3>
                    
                    {/* Avatar Upload field */}
                    <div className="flex items-center gap-4 p-4 bg-slate-100/50 dark:bg-slate-950/20 border border-slate-200 dark:border-slate-850 rounded-2xl">
                      <div className="relative w-16 h-16 rounded-2xl bg-slate-300 dark:bg-slate-800 flex items-center justify-center overflow-hidden border border-slate-200 dark:border-slate-800 shrink-0">
                        {editProfilePic ? (
                          <img src={editProfilePic} className="w-full h-full object-cover" alt="Vorschau" />
                        ) : (
                          <span className="text-2xl font-bold text-slate-500 uppercase">{editDisplayName.substring(0, 2)}</span>
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
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block mb-1">Profilbild hochladen</span>
                        <span className="text-[10px] text-slate-500 block leading-relaxed">Klicke auf das Vorschaubild zum Auswählen. Maximal 1.5 MB (PNG/JPG).</span>
                      </div>
                    </div>

                    {/* Display name field */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5 pl-1">
                        Anzeigename
                      </label>
                      <input
                        type="text"
                        required
                        value={editDisplayName}
                        onChange={(e) => setEditDisplayName(e.target.value)}
                        className="w-full px-4 py-2.5 bg-slate-100/50 dark:bg-slate-950/40 border border-slate-300 dark:border-slate-700/60 rounded-xl text-slate-800 dark:text-slate-250 text-sm font-medium focus:outline-none focus:border-purple-500"
                      />
                    </div>

                    {/* Password change field */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5 pl-1">
                        Neues Passwort (optional)
                      </label>
                      <input
                        type="password"
                        value={editPassword}
                        onChange={(e) => setEditPassword(e.target.value)}
                        placeholder="Freilassen, falls unverändert"
                        className="w-full px-4 py-2.5 bg-slate-100/50 dark:bg-slate-950/40 border border-slate-300 dark:border-slate-700/60 rounded-xl text-slate-800 dark:text-slate-250 text-sm font-medium focus:outline-none focus:border-purple-500"
                      />
                    </div>

                    {/* Form Message */}
                    {profileMessage && (
                      <div className={`p-3 text-xs font-medium rounded-xl leading-relaxed ${
                        profileMessage.type === 'success'
                          ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-300'
                          : 'bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-300'
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
                        className="px-5 py-2.5 border border-slate-350 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 font-semibold rounded-xl text-xs transition-all cursor-pointer"
                      >
                        Abbrechen
                      </button>
                    </div>
                  </form>
                )}

                {/* Stats Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                  <div className="p-4 bg-slate-100/50 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-800/50 rounded-2xl flex flex-col justify-between" id="solved-tasks-badge">
                    <div className="flex justify-between items-start text-purple-600 dark:text-purple-400 mb-2">
                      <Trophy className="w-5 h-5" />
                      <span className="text-xs text-slate-500 font-semibold uppercase">Punkte</span>
                    </div>
                    <div>
                      <span className="text-2xl font-extrabold text-slate-800 dark:text-slate-100">{getActiveScore()}</span>
                      <span className="block text-xs text-slate-500 dark:text-slate-400 mt-1">gelöste Aufgaben</span>
                    </div>
                  </div>

                  <div className="p-4 bg-slate-100/50 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-800/50 rounded-2xl flex flex-col justify-between">
                    <div className="flex justify-between items-start text-emerald-600 dark:text-emerald-400 mb-2">
                      <BookOpen className="w-5 h-5" />
                      <span className="text-xs text-slate-500 font-semibold uppercase">Module</span>
                    </div>
                    <div>
                      <span className="text-2xl font-extrabold text-slate-800 dark:text-slate-100">
                        {user.solvedCount > 0 ? 1 : 0}
                      </span>
                      <span className="block text-xs text-slate-500 dark:text-slate-400 mt-1">aktive Fächer</span>
                    </div>
                  </div>

                  <div className="p-4 bg-slate-100/50 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-800/50 rounded-2xl flex flex-col justify-between">
                    <div className="flex justify-between items-start text-blue-600 dark:text-blue-400 mb-2">
                      <Clock className="w-5 h-5" />
                      <span className="text-xs text-slate-500 font-semibold uppercase">Status</span>
                    </div>
                    <div>
                      <span className="text-xl font-extrabold text-slate-800 dark:text-slate-100 truncate block">
                        {user.solvedCount >= 10 ? 'Fortgeschritten' : 'Anfänger'}
                      </span>
                      <span className="block text-xs text-slate-500 dark:text-slate-400 mt-1">Lernniveau</span>
                    </div>
                  </div>
                </div>

                {/* Achievements */}
                <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4">Erfolge</h3>
                <div className="space-y-3">
                  <div className={`flex items-center gap-3.5 p-3.5 rounded-2xl border transition-all ${
                    user.solvedCount >= 1 
                      ? 'bg-slate-100/50 dark:bg-slate-900/10 border-slate-200 dark:border-slate-800/30 opacity-100'
                      : 'bg-slate-200/20 dark:bg-slate-900/5 border-slate-200/30 dark:border-slate-900/10 opacity-35'
                  }`}>
                    <Medal className={`w-6 h-6 ${user.solvedCount >= 1 ? 'text-yellow-500' : 'text-slate-400 dark:text-slate-500'}`} />
                    <div>
                      <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">Erster Schritt</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Erste Aufgabe im Modul Lineare Algebra richtig gelöst.</p>
                    </div>
                  </div>
                  <div className={`flex items-center gap-3.5 p-3.5 rounded-2xl border transition-all ${
                    user.solvedCount >= 10 
                      ? 'bg-slate-100/50 dark:bg-slate-900/10 border-slate-200 dark:border-slate-800/30 opacity-100'
                      : 'bg-slate-200/20 dark:bg-slate-900/5 border-slate-200/30 dark:border-slate-900/10 opacity-35'
                  }`}>
                    <Medal className={`w-6 h-6 ${user.solvedCount >= 10 ? 'text-purple-500' : 'text-slate-400 dark:text-slate-500'}`} />
                    <div>
                      <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">Matrix Meister</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Löse 10 Determinanten-Aufgaben fehlerfrei.</p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="glass-panel rounded-3xl p-8 text-center glow-purple">
                <div className="max-w-md mx-auto py-6">
                  <div className="p-3 bg-purple-500/10 rounded-2xl border border-purple-500/20 text-purple-600 dark:text-purple-400 w-fit mx-auto mb-4">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <h2 className="text-2xl font-bold font-display text-slate-800 dark:text-slate-100 mb-2">Erstelle ein Profil</h2>
                  <p className="text-slate-600 dark:text-slate-400 text-sm mb-6">
                    Melde dich an, um deine Rechenpunkte dauerhaft zu sichern, deine Erfolge einzusehen und einen Platz in der globalen Rangliste zu ergattern.
                  </p>
                  
                  {/* Guest Session stats */}
                  <div className="p-4 bg-slate-100/50 dark:bg-slate-950/20 rounded-2xl border border-slate-200 dark:border-slate-800/40 text-left mb-6">
                    <span className="text-xs text-slate-400 dark:text-slate-500 font-semibold uppercase tracking-wider block mb-1">
                      Aktuelle Session (Gast)
                    </span>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-slate-600 dark:text-slate-300">Punkte gesammelt:</span>
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
      <footer className="py-6 border-t border-slate-200 dark:border-slate-800/40 text-center text-xs text-slate-500 transition-colors duration-300">
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
