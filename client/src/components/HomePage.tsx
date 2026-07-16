import { Clock, Compass, BookOpen, Trophy, User, ArrowRight, ShieldCheck, Play, Pause, RotateCcw } from 'lucide-react';
import { usePomodoro } from '../hooks/usePomodoro';
import type { UserProfile } from '../types';

const formatTime = (mins: number, secs: number) =>
  `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

interface HomePageProps {
  user: UserProfile | null;
  guestScore: number;
  setActiveTab: (tab: 'home' | 'tasks' | 'leaderboard' | 'profile' | 'admin') => void;
}

export const HomePage: React.FC<HomePageProps> = ({ user, guestScore, setActiveTab }) => {
  const {
    workTime, breakTime, minutes, seconds, isActive, mode,
    handleWorkTimeChange, handleBreakTimeChange, reset, getProgressPercentage, setIsActive,
  } = usePomodoro();

  const ringColor = mode === 'work' ? 'stroke-purple-600' : 'stroke-emerald-500';
  const labelColor = mode === 'work' ? 'text-purple-600' : 'text-emerald-500';

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 animate-fadeIn">
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
              <span className="block text-2xl font-extrabold text-theme-primary">{user ? user.solvedCount : guestScore}</span>
              <span className="text-[10px] text-theme-muted uppercase font-bold tracking-wider">Punkte</span>
            </div>
            <div className="text-center p-4 bg-theme-card border border-theme-border rounded-2xl w-24 shadow-sm">
              <span className="block text-2xl font-extrabold text-theme-primary">{user ? 1 : 0}</span>
              <span className="text-[10px] text-theme-muted uppercase font-bold tracking-wider">Module</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="glass-panel rounded-3xl p-6 flex flex-col justify-between" id="home-quicknav-panel">
          <div>
            <h3 className="text-lg font-bold font-display text-theme-primary mb-4 flex items-center gap-2">
              <Compass className="w-5 h-5 text-purple-650" /> Schnellzugriff
            </h3>
            <div className="space-y-3">
              <QuickNavButton icon={<BookOpen className="w-5 h-5" />} color="purple" title="Übungsaufgaben rechnen" subtitle="Unendliche Fragen generieren & loesen" onClick={() => setActiveTab('tasks')} />
              <QuickNavButton icon={<Trophy className="w-5 h-5" />} color="emerald" title="Bestenliste einsehen" subtitle="Vergleiche deine Leistungen mit anderen" onClick={() => setActiveTab('leaderboard')} />
              <QuickNavButton icon={<User className="w-5 h-5" />} color="blue" title="Mein Profil bearbeiten" subtitle="Passwort, Name und Profilbild anpassen" onClick={() => setActiveTab('profile')} />
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-theme-border flex items-center gap-2 text-xs text-theme-muted">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>Deine Daten werden sicher in der SQLite-Datenbank verschlüsselt.</span>
          </div>
        </div>

        <div className="glass-panel rounded-3xl p-6 flex flex-col justify-between" id="home-pomodoro-panel">
          <div>
            <h3 className="text-lg font-bold font-display text-theme-primary mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-purple-600" /> Pomodoro Timer
            </h3>
            <div className="flex flex-col items-center justify-center py-4 relative">
              <div className="relative w-36 h-36 flex items-center justify-center">
                <svg className="w-full h-full -rotate-90">
                  <circle cx="72" cy="72" r="64" className="stroke-theme-card fill-none" strokeWidth="6" />
                  <circle
                    cx="72" cy="72" r="64"
                    className={`fill-none transition-all duration-1000 ${ringColor}`}
                    strokeWidth="7" strokeDasharray={402}
                    strokeDashoffset={402 - (402 * getProgressPercentage()) / 100}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute flex flex-col items-center justify-center">
                  <span className="text-2xl font-extrabold text-theme-primary tabular-nums">{formatTime(minutes, seconds)}</span>
                  <span className={`text-[10px] font-bold uppercase tracking-wider mt-1 ${labelColor}`}>
                    {mode === 'work' ? 'Fokuszeit' : 'Pause'}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-3 mt-4">
                <button
                  onClick={() => setIsActive(!isActive)}
                  className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                    isActive
                      ? 'bg-rose-500/10 hover:bg-rose-500/20 border-rose-500/20 text-rose-600'
                      : 'bg-purple-600 hover:bg-purple-500 text-white border-transparent shadow-md'
                  }`}
                >
                  {isActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </button>
                <button
                  onClick={reset}
                  className="p-2.5 bg-theme-card hover:brightness-95 dark:hover:brightness-110 border border-theme-border rounded-xl text-theme-muted hover:text-theme-primary transition-colors cursor-pointer"
                  title="Timer zurücksetzen"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="space-y-4 mt-4 border-t border-theme-border pt-4">
              <Slider label="Fokuszeit" value={workTime} color="purple" onChange={handleWorkTimeChange} min={5} max={60} />
              <Slider label="Pause" value={breakTime} color="emerald" onChange={handleBreakTimeChange} min={1} max={30} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const QuickNavButton: React.FC<{
  icon: React.ReactNode;
  color: 'purple' | 'emerald' | 'blue';
  title: string;
  subtitle: string;
  onClick: () => void;
}> = ({ icon, color, title, subtitle, onClick }) => {
  const colorMap = {
    purple: 'bg-purple-500/10 border-purple-500/20 text-purple-600 dark:text-purple-400',
    emerald: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400',
    blue: 'bg-blue-500/10 border-blue-500/20 text-blue-600 dark:text-blue-400',
  };
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center justify-between p-4 bg-theme-card hover:brightness-95 dark:hover:brightness-110 border border-theme-border rounded-2xl transition-all cursor-pointer group text-left shadow-sm"
    >
      <div className="flex items-center gap-3">
        <div className={`p-2.5 rounded-xl border ${colorMap[color]}`}>{icon}</div>
        <div>
          <span className="font-bold text-theme-primary block text-sm">{title}</span>
          <span className="text-theme-muted text-xs font-medium">{subtitle}</span>
        </div>
      </div>
      <ArrowRight className="w-4 h-4 text-theme-muted group-hover:translate-x-1 transition-transform" />
    </button>
  );
};

const Slider: React.FC<{
  label: string;
  value: number;
  color: 'purple' | 'emerald';
  onChange: (v: number) => void;
  min: number;
  max: number;
}> = ({ label, value, color, onChange, min, max }) => (
  <div>
    <div className="flex justify-between items-center mb-1">
      <label className="block text-[10px] font-bold text-theme-muted uppercase tracking-wider">{label}</label>
      <span className={`text-xs font-bold ${color === 'purple' ? 'text-purple-600 dark:text-purple-400' : 'text-emerald-600 dark:text-emerald-400'}`}>{value} Min.</span>
    </div>
    <input
      type="range" min={min} max={max} step="1" value={value}
      onChange={(e) => onChange(parseInt(e.target.value, 10) || 25)}
      className={`w-full accent-${color}-600 cursor-pointer bg-theme-card rounded-lg h-2`}
    />
  </div>
);

export default HomePage;
