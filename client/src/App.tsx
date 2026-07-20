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
import { PomodoroProvider } from './hooks/usePomodoro';
import { useRoute, type RouteState } from './hooks/useRoute';

type TabType = 'home' | 'tasks' | 'leaderboard' | 'profile' | 'admin' | 'duels';

export default function App({ initialRoute }: { initialRoute?: RouteState }) {
  const { route, setRoute } = useRoute(initialRoute);

  const activeTab = route.view;
  const activeTaskId = route.taskId;
  const activeModuleId = route.moduleId;
  const isAuthModalOpen = route.authOpen;
  const isOnboardingOpen = route.onboardingOpen;
  const isFeedbackOpen = route.feedbackOpen;

  const { user, loadingUser, checkUserSession, handleLogout, updateProfile } = useAuth();
  const {
    leaderboard, loadingLeaderboard, leaderboardFilter, setLeaderboardFilter,
    selectedModuleFilter, setSelectedModuleFilter, selectedTaskFilter, setSelectedTaskFilter,
    selectedTaskModuleFilter, setSelectedTaskModuleFilter,
    sideLeaderboard, loadingSideLeaderboard, fetchLeaderboard, fetchSideLeaderboard,
    eloLeaderboard, fetchEloLeaderboard,
  } = useLeaderboard();

  const isAdmin = !!user?.isAdmin;

  // Local storage reading fallback for guest score
  const [guestScore, setGuestScore] = useState<number>(() => {
    const saved = localStorage.getItem('aufgabengenerator_score');
    return saved ? parseInt(saved, 10) : 0;
  });

  // Full duel payload (not serializable) — only the duelId lives in the URL.
  const [activeDuel, setActiveDuel] = useState<any>(null);

  useEffect(() => {
    checkUserSession();
    const onboardingDone = localStorage.getItem('aufgabengenerator_onboarding_completed');
    if (!onboardingDone) setRoute({ onboardingOpen: true });
  }, [checkUserSession, setRoute]);

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

  // Navigation helpers backed by the URL route.
  const setActiveTab = (tab: TabType) => setRoute({ view: tab, taskId: null, duelId: null });
  const setActiveTaskId = (id: string | null) => setRoute({ taskId: id });
  const setActiveModuleId = (id: string) => setRoute({ moduleId: id, taskId: null });

  return (
    <PomodoroProvider>
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
        onOpenFeedback={() => setRoute({ feedbackOpen: true })}
        onOpenOnboarding={() => setRoute({ onboardingOpen: true, onboardingStep: 0 })}
        onOpenAuth={() => setRoute({ authOpen: true })}
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
            onOpenAuth={() => setRoute({ authOpen: true })}
            onUpdateProfile={updateProfile}
          />
        )}

        {activeTab === 'duels' && !activeDuel && (
          <DuelLobby
            user={user}
            onDuelStart={(payload: any) => {
              setActiveDuel(payload);
              setRoute({ duelId: payload.duelId });
            }}
            onDuelWaiting={() => {}}
            onDuelMatched={() => {}}
          />
        )}

        {activeTab === 'duels' && activeDuel && (
          <DuelRunner
            startPayload={activeDuel}
            onExit={() => {
              setActiveDuel(null);
              setRoute({ duelId: null, view: 'duels' });
            }}
          />
        )}
      </main>

      <Footer />

      <PomodoroWidget />

      <AuthModal isOpen={isAuthModalOpen} onClose={() => setRoute({ authOpen: false })} onAuthSuccess={handleAuthSuccess} />
      {isOnboardingOpen && (
        <OnboardingTour
          initialStep={route.onboardingStep}
          onClose={() => setRoute({ onboardingOpen: false })}
          onStepChange={(step: number) => setRoute({ onboardingStep: step }, { replace: true })}
          onNavigate={({ tab, taskId }) => {
            setActiveTab(tab);
            setActiveTaskId(taskId !== undefined ? taskId : null);
          }}
        />
      )}
      <FeedbackModal isOpen={isFeedbackOpen} onClose={() => setRoute({ feedbackOpen: false })} currentUser={user} />
    </div>
    </PomodoroProvider>
  );
}
