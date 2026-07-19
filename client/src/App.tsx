import { useState, useEffect } from 'react';
import { NavHeader } from './components/NavHeader';
import { Footer } from './components/Footer';
import { PomodoroWidget } from './components/PomodoroWidget';
import { HomePage } from './components/HomePage';
import { TasksPage } from './components/TasksPage';
import { LeaderboardPage } from './components/LeaderboardPage';
import { ProfilePage } from './components/ProfilePage';
import { AdminPanel } from './components/AdminPanel';
import { AuthModal } from './components/AuthModal';
import { OnboardingTour } from './components/OnboardingTour';
import { FeedbackModal } from './components/FeedbackModal';
import { DuelLobby } from './components/DuelLobby';
import { DuelRunner } from './components/DuelRunner';
import { useAuth } from './hooks/useAuth';
import { useLeaderboard } from './hooks/useLeaderboard';

type TabType = 'home' | 'tasks' | 'leaderboard' | 'profile' | 'admin' | 'duels';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [activeModuleId, setActiveModuleId] = useState<string>('lin_alg');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState<boolean>(false);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState<boolean>(false);
  const [activeDuel, setActiveDuel] = useState<any>(null);

  const { user, loadingUser, checkUserSession, handleLogout, updateProfile } = useAuth();
  const {
    leaderboard, loadingLeaderboard, leaderboardFilter, setLeaderboardFilter,
    selectedModuleFilter, setSelectedModuleFilter, selectedTaskFilter, setSelectedTaskFilter,
    selectedTaskModuleFilter, setSelectedTaskModuleFilter,
    sideLeaderboard, loadingSideLeaderboard, fetchLeaderboard, fetchSideLeaderboard,
    eloLeaderboard, fetchEloLeaderboard,
  } = useLeaderboard();

  const adminUsername = import.meta.env.VITE_ADMIN_USERNAME || 'MD16';
  const isAdmin = user?.username === adminUsername;

  // Local storage reading fallback for guest score
  const [guestScore, setGuestScore] = useState<number>(() => {
    const saved = localStorage.getItem('aufgabengenerator_score');
    return saved ? parseInt(saved, 10) : 0;
  });

  useEffect(() => {
    checkUserSession();
    const onboardingDone = localStorage.getItem('aufgabengenerator_onboarding_completed');
    if (!onboardingDone) setIsOnboardingOpen(true);
  }, [checkUserSession]);

  useEffect(() => {
    if (activeTab === 'leaderboard') {
      if (leaderboardFilter === 'elo') {
        fetchEloLeaderboard(selectedModuleFilter === 'Gesamt' ? undefined
          : selectedModuleFilter === 'Lineare Algebra' ? 'lin_alg'
          : selectedModuleFilter === 'Betriebssysteme' ? 'os'
          : selectedModuleFilter === 'Formale Systeme' ? 'formal_sys'
          : selectedModuleFilter === 'Algorithmen & Datenstrukturen' ? 'algo_struct'
          : undefined);
      } else {
        fetchLeaderboard();
      }
    }
  }, [activeTab, leaderboardFilter, selectedModuleFilter, selectedTaskFilter, fetchLeaderboard, fetchEloLeaderboard]);

  useEffect(() => {
    if (activeTab === 'tasks') {
      if (activeTaskId) {
        fetchSideLeaderboard('task', activeTaskId);
      } else {
        const moduleNameMap: Record<string, string> = {
          lin_alg: 'Lineare Algebra',
          os: 'Betriebssysteme',
          formal_sys: 'Formale Systeme',
          algo_struct: 'Algorithmen & Datenstrukturen',
        };
        fetchSideLeaderboard('module', moduleNameMap[activeModuleId] || 'Lineare Algebra');
      }
    }
  }, [activeTab, activeTaskId, activeModuleId, fetchSideLeaderboard]);

  const handleAuthSuccess = () => {
    checkUserSession();
    fetchLeaderboard();
  };

  const handleSolved = () => {
    if (user) {
      checkUserSession();
      if (activeTaskId) {
        fetchSideLeaderboard('task', activeTaskId);
      }
    } else {
      const saved = localStorage.getItem('aufgabengenerator_score');
      setGuestScore(saved ? parseInt(saved, 10) : 0);
    }
  };

  return (
    <div className="min-h-screen flex flex-col transition-colors duration-200">
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-600/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-indigo-600/5 rounded-full blur-3xl pointer-events-none" />

      <NavHeader
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        setActiveTaskId={setActiveTaskId}
        user={user}
        loadingUser={loadingUser}
        isAdmin={isAdmin}
        onLogout={handleLogout}
        onOpenFeedback={() => setIsFeedbackOpen(true)}
        onOpenOnboarding={() => setIsOnboardingOpen(true)}
        onOpenAuth={() => setIsAuthModalOpen(true)}
      />

      <main className="flex-grow flex items-center justify-center py-6 px-4 z-10">
        {activeTab === 'home' && (
          <HomePage user={user} guestScore={guestScore} setActiveTab={setActiveTab} />
        )}

        {activeTab === 'tasks' && (
          <TasksPage
            activeTaskId={activeTaskId}
            activeModuleId={activeModuleId}
            setActiveModuleId={setActiveModuleId}
            setActiveTaskId={setActiveTaskId}
            user={user}
            sideLeaderboard={sideLeaderboard}
            loadingSideLeaderboard={loadingSideLeaderboard}
            onSolved={handleSolved}
          />
        )}

        {activeTab === 'leaderboard' && (
          <LeaderboardPage
            leaderboard={leaderboard}
            loading={loadingLeaderboard}
            filter={leaderboardFilter}
            setFilter={setLeaderboardFilter}
            moduleFilter={selectedModuleFilter}
            setModuleFilter={setSelectedModuleFilter}
            taskFilter={selectedTaskFilter}
            setTaskFilter={setSelectedTaskFilter}
            taskModuleFilter={selectedTaskModuleFilter}
            setTaskModuleFilter={setSelectedTaskModuleFilter}
            eloLeaderboard={eloLeaderboard}
          />
        )}

        {activeTab === 'admin' && isAdmin && <AdminPanel />}

        {activeTab === 'profile' && (
          <ProfilePage
            user={user}
            guestScore={guestScore}
            onOpenAuth={() => setIsAuthModalOpen(true)}
            onUpdateProfile={updateProfile}
          />
        )}

        {activeTab === 'duels' && !activeDuel && (
          <DuelLobby
            user={user}
            onDuelStart={(payload: any) => setActiveDuel(payload)}
            onDuelWaiting={() => {}}
            onDuelMatched={() => {}}
          />
        )}

        {activeTab === 'duels' && activeDuel && (
          <DuelRunner
            startPayload={activeDuel}
            onExit={() => {
              setActiveDuel(null);
              setActiveTab('duels');
            }}
          />
        )}
      </main>

      <Footer />

      <PomodoroWidget />

      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} onAuthSuccess={handleAuthSuccess} />
      {isOnboardingOpen && (
        <OnboardingTour
          onClose={() => setIsOnboardingOpen(false)}
          onNavigate={({ tab, taskId }) => {
            setActiveTab(tab);
            setActiveTaskId(taskId !== undefined ? taskId : null);
          }}
        />
      )}
      <FeedbackModal isOpen={isFeedbackOpen} onClose={() => setIsFeedbackOpen(false)} currentUser={user} />
    </div>
  );
}
