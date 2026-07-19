import { GraduationCap, Home, BookOpen, Trophy, User, ShieldCheck, LogIn, LogOut, RefreshCw, MessageSquare, HelpCircle, Swords } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';
import type { UserProfile } from '../types';

type TabType = 'home' | 'tasks' | 'leaderboard' | 'profile' | 'admin' | 'duels';

interface NavHeaderProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  setActiveTaskId: (id: string | null) => void;
  user: UserProfile | null;
  loadingUser: boolean;
  isAdmin: boolean;
  onLogout: () => void;
  onOpenFeedback: () => void;
  onOpenOnboarding: () => void;
  onOpenAuth: () => void;
}

const TABS: { id: TabType; label: string; icon: React.ReactNode }[] = [
  { id: 'home', label: 'Start', icon: <Home className="w-4 h-4" /> },
  { id: 'tasks', label: 'Aufgaben', icon: <BookOpen className="w-4 h-4" /> },
  { id: 'duels', label: 'Duelle', icon: <Swords className="w-4 h-4" /> },
  { id: 'leaderboard', label: 'Bestenliste', icon: <Trophy className="w-4 h-4" /> },
  { id: 'profile', label: 'Profil', icon: <User className="w-4 h-4" /> },
];

export const NavHeader: React.FC<NavHeaderProps> = ({
  activeTab, setActiveTab, setActiveTaskId, user, loadingUser, isAdmin,
  onLogout, onOpenFeedback, onOpenOnboarding, onOpenAuth,
}) => {
  const goHome = () => { setActiveTab('home'); setActiveTaskId(null); };

  return (
    <header className="w-full py-4 px-6 border-b border-theme-border bg-theme-bg/85 backdrop-blur-md sticky top-0 z-40 transition-colors duration-200">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <div
          className="flex items-center gap-3 cursor-pointer"
          onClick={goHome}
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

        <nav className="flex bg-theme-card border border-theme-border p-1 rounded-xl" id="navigation-tabs-list">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'text-theme-secondary hover:text-theme-primary'
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
          {isAdmin && (
            <button
              onClick={() => setActiveTab('admin')}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                activeTab === 'admin'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'text-theme-secondary hover:text-theme-primary'
              }`}
            >
              <ShieldCheck className="w-4 h-4" /> Admin
            </button>
          )}
        </nav>

        <div className="flex items-center gap-2.5">
          <button
            onClick={onOpenFeedback}
            className="p-2.5 bg-theme-card hover:bg-purple-500/10 border border-theme-border hover:border-purple-500/30 rounded-xl text-theme-muted hover:text-purple-600 transition-all cursor-pointer shadow-sm flex items-center justify-center"
            title="Bug melden / Feedback"
            id="feedback-btn"
          >
            <MessageSquare className="w-5 h-5" />
          </button>
          <button
            onClick={onOpenOnboarding}
            className="p-2.5 bg-theme-card hover:bg-purple-500/10 border border-theme-border hover:border-purple-500/30 rounded-xl text-theme-muted hover:text-purple-600 transition-all cursor-pointer shadow-sm flex items-center justify-center"
            title="Tour starten"
            id="help-btn"
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
              onClick={onLogout}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-350 font-semibold rounded-xl text-xs border border-rose-500/20 transition-all cursor-pointer"
              id="login-btn"
            >
              <LogOut className="w-3.5 h-3.5" /> Logout
            </button>
          ) : (
            <button
              onClick={onOpenAuth}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-semibold rounded-xl text-xs shadow-md shadow-purple-500/10 transition-all cursor-pointer"
              id="login-btn"
            >
              <LogIn className="w-3.5 h-3.5" /> Login
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

export default NavHeader;
