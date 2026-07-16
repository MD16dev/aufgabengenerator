import React, { useState, useEffect } from 'react';
import { X, ArrowRight, ArrowLeft, Check, Compass, BookOpen, HelpCircle, Trophy, Clock, MessageSquare, Calculator, Sparkles } from 'lucide-react';

interface OnboardingTourProps {
  onClose: () => void;
  /** Called when a step wants to navigate to a specific tab / task. */
  onNavigate?: (target: { tab: 'home' | 'tasks' | 'leaderboard' | 'profile' | 'admin'; taskId?: string | null }) => void;
}

interface TourStep {
  title: string;
  description: string;
  icon: React.ReactNode;
  /** DOM id of the element to highlight. Empty string = centered welcome step. */
  targetId: string;
  /** Where to navigate before showing this step (so the target exists). */
  navigateTo?: { tab: 'home' | 'tasks' | 'leaderboard' | 'profile' | 'admin'; taskId?: string | null };
}

interface Coords {
  top: number;
  left: number;
  position: 'bottom' | 'top' | 'center';
}

interface SpotlightCoords {
  top: number;
  left: number;
  width: number;
  height: number;
  opacity: number;
}

export const OnboardingTour: React.FC<OnboardingTourProps> = ({ onClose, onNavigate }) => {
  const [currentStep, setCurrentStep] = useState<number>(0);
  
  // Coordinates for the floating speech bubble
  const [coords, setCoords] = useState<Coords>({
    top: window.innerHeight / 2 - 150,
    left: Math.max(16, window.innerWidth / 2 - 200),
    position: 'center'
  });

  // Coordinates for the sliding spotlight overlay
  const [spotlightCoords, setSpotlightCoords] = useState<SpotlightCoords>({
    top: window.innerHeight / 2,
    left: window.innerWidth / 2,
    width: 0,
    height: 0,
    opacity: 0
  });

  const steps: TourStep[] = [
    {
      title: 'Willkommen beim AufgabenGenerator! 🎓',
      description: 'Lerne effizienter für deine Klausuren! Hier findest du unendlich viele, algorithmisch generierte Übungsaufgaben für Informatik und Mathematik – direkt zum Rechnen und Überprüfen.',
      icon: <Compass className="w-10 h-10 text-purple-500" />,
      targetId: ''
    },
    {
      title: 'Fächer & Aufgaben auswählen 📚',
      description: 'Hier siehst du die verfügbaren Module. Wähle das gewünschte Fach und klicke auf einen aktiven Aufgabetyp wie „2x2 Determinante“. Bei jedem Start wird eine komplett neue Aufgabe generiert!',
      icon: <BookOpen className="w-10 h-10 text-emerald-500" />,
      targetId: 'module-selector-dashboard',
      navigateTo: { tab: 'tasks' }
    },
    {
      title: 'Aufgaben lösen & Punkte sammeln 🧮',
      description: 'Gib dein Ergebnis ein und prüfe es sofort. Richtig gelöst? Du bekommst Punkte! Kommst du nicht weiter, zeigt „Rechenweg anzeigen“ die Schritte – die Aufgabe wird dann aber nicht für die Bestenliste gewertet.',
      icon: <Calculator className="w-10 h-10 text-purple-500" />,
      targetId: 'determinant-task-solver',
      navigateTo: { tab: 'tasks', taskId: 'lin_alg_det' }
    },
    {
      title: 'Live-Bestenliste auf der Aufgabenseite 🏅',
      description: 'Rechts neben deiner Aufgabe siehst du die Rangliste – live aktualisiert, sobald jemand eine Aufgabe löst. Schau vorbei und klettere selbst nach oben!',
      icon: <Trophy className="w-10 h-10 text-amber-500" />,
      targetId: 'tasks-split-layout',
      navigateTo: { tab: 'tasks', taskId: 'lin_alg_det' }
    },
    {
      title: 'Globale Bestenliste 🌍',
      description: 'Unter „Bestenliste“ vergleichst du dich mit allen Kommilitonen. Filtere nach Gesamt, Modul oder einzelnem Aufgabentyp und finde heraus, wo du gerade stehst.',
      icon: <Trophy className="w-10 h-10 text-pink-500" />,
      targetId: 'leaderboard-ranking-panel',
      navigateTo: { tab: 'leaderboard' }
    },
    {
      title: 'Profil & Fortschritt 🏆',
      description: 'Klicke hier, um dich einzuloggen oder einen kostenlosen Account zu erstellen. So werden deine erarbeiteten Punkte sicher gespeichert, du steigst im Level auf und kletterst auf die Bestenliste!',
      icon: <Sparkles className="w-10 h-10 text-pink-500" />,
      targetId: 'login-btn',
      navigateTo: { tab: 'home' }
    },
    {
      title: 'Pomodoro-Fokus-Timer ⏱️',
      description: 'Lerne in Intervallen! Stelle Fokus- und Pausenzeit über die Slider ein und starte den Timer. Das schwebende Widget unten rechts begleitet dich auf jeder Seite.',
      icon: <Clock className="w-10 h-10 text-emerald-500" />,
      targetId: 'home-pomodoro-panel',
      navigateTo: { tab: 'home' }
    },
    {
      title: 'Feedback & Hilfe geben 💬',
      description: 'Du hast einen Bug gefunden oder eine Idee? Über das Sprechblasen-Symbol meldest du Feedback – wir erstellen daraus sogar automatisch ein GitHub-Issue. Das Fragezeichen startet diese Tour jederzeit erneut.',
      icon: <MessageSquare className="w-10 h-10 text-blue-500" />,
      targetId: 'feedback-btn',
      navigateTo: { tab: 'home' }
    },
    {
      title: 'Theme umschalten ☀️ / 🌙',
      description: 'Lernst du lieber tagsüber oder nachts? Über diesen Toggler kannst du jederzeit zwischen dem Darkmode und dem Whitemode (Lightmode) umschalten. Standardmäßig passen wir uns deinem Betriebssystem an.',
      icon: <HelpCircle className="w-10 h-10 text-blue-500" />,
      targetId: 'theme-toggle-btn',
      navigateTo: { tab: 'home' }
    }
  ];

  // Navigate to the correct page whenever the step changes (so the target exists)
  useEffect(() => {
    const step = steps[currentStep];
    if (step.navigateTo && onNavigate) {
      onNavigate(step.navigateTo);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStep]);

  const updatePositions = () => {
    const step = steps[currentStep];
    const scrollY = window.scrollY;
    const scrollX = window.scrollX;

    // Welcome Step (Center of Screen)
    if (!step.targetId) {
      setCoords({
        top: window.innerHeight / 2 - 150 + scrollY,
        left: Math.max(16, window.innerWidth / 2 - 200 + scrollX),
        position: 'center'
      });
      setSpotlightCoords({
        top: window.innerHeight / 2 + scrollY,
        left: window.innerWidth / 2 + scrollX,
        width: 0,
        height: 0,
        opacity: 0
      });
      return;
    }

    const target = document.getElementById(step.targetId);
    if (target) {
      // Bring target into viewport first (smooth scroll)
      target.scrollIntoView({ behavior: 'smooth', block: 'center' });

      // Gather coordinates immediately (React style transitions will slide it smoothly)
      const rect = target.getBoundingClientRect();
      
      let position: 'bottom' | 'top' = 'bottom';
      let bubbleTop = rect.bottom + scrollY + 16;
      let bubbleLeft = rect.left + scrollX + rect.width / 2 - 200; // Center popup (width 400)

      // Adjust if target is close to bottom of the viewport
      if (rect.bottom + 300 > window.innerHeight) {
        bubbleTop = rect.top + scrollY - 260 - 16; // Assumed max bubble height
        position = 'top';
      }

      // Bound bubble coordinates within viewport edges
      bubbleLeft = Math.max(16, Math.min(window.innerWidth - 400 - 16, bubbleLeft));

      setCoords({
        top: bubbleTop,
        left: bubbleLeft,
        position
      });

      setSpotlightCoords({
        top: rect.top + scrollY - 4,
        left: rect.left + scrollX - 4,
        width: rect.width + 8,
        height: rect.height + 8,
        opacity: 1
      });
    } else {
      // Element missing fallback (center)
      setCoords({
        top: window.innerHeight / 2 - 150 + scrollY,
        left: Math.max(16, window.innerWidth / 2 - 200 + scrollX),
        position: 'center'
      });
      setSpotlightCoords({
        top: window.innerHeight / 2 + scrollY,
        left: window.innerWidth / 2 + scrollX,
        width: 0,
        height: 0,
        opacity: 0
      });
    }
  };

  useEffect(() => {
    // Wait a tick so the navigation (tab switch) has rendered the target element
    const timer = setTimeout(updatePositions, 350);

    // Event listeners to handle resizing or manual scrolling
    window.addEventListener('resize', updatePositions);
    window.addEventListener('scroll', updatePositions);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', updatePositions);
      window.removeEventListener('scroll', updatePositions);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStep]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    localStorage.setItem('aufgabengenerator_onboarding_completed', 'true');
    onClose();
  };

  const step = steps[currentStep];

  return (
    <div className="fixed inset-0 z-50 pointer-events-none">
      {/* Dim overlay with a "hole" punched out at the spotlight position.
          When in the welcome step the hole has zero size, so the whole
          screen is dimmed. */}
      <div
        className="onboarding-spotlight"
        style={{
          top: `${spotlightCoords.top}px`,
          left: `${spotlightCoords.left}px`,
          width: `${spotlightCoords.width}px`,
          height: `${spotlightCoords.height}px`,
          opacity: spotlightCoords.opacity,
          pointerEvents: spotlightCoords.opacity > 0 ? 'auto' : 'none'
        }}
      />

      {/* Floating Tour Speech Bubble Dialog */}
      <div
        style={{
          position: 'absolute',
          top: `${coords.top}px`,
          left: `${coords.left}px`,
          width: '400px',
          maxWidth: 'calc(100vw - 32px)',
          transition: 'all 0.5s cubic-bezier(0.25, 1, 0.5, 1)' // Super smooth sliding transition
        }}
        className="p-6 rounded-3xl glass-panel border border-purple-500/20 shadow-2xl glow-purple pointer-events-auto z-50"
        id="onboarding-tour-bubble"
      >
        {/* Skip Button */}
        <button
          onClick={handleComplete}
          className="absolute top-4 right-4 p-1.5 text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors cursor-pointer"
          title="Tour beenden"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Step Icon */}
        <div className="flex justify-center mb-4">
          <div className="p-3 bg-purple-500/10 rounded-2xl border border-purple-500/20">
            {step.icon}
          </div>
        </div>

        {/* Text Contents */}
        <h2 className="text-lg md:text-xl font-bold font-display text-center text-slate-800 dark:text-slate-100 mb-2.5 leading-snug">
          {step.title}
        </h2>
        <p className="text-slate-600 dark:text-slate-400 text-xs md:text-sm text-center leading-relaxed mb-6 px-1">
          {step.description}
        </p>

        {/* Stepper Controls & Progress Indicators */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800/60">
          <div className="flex gap-1.5">
            {steps.map((_, idx) => (
              <span
                key={idx}
                className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                  idx === currentStep ? 'bg-purple-500 w-4' : 'bg-slate-300 dark:bg-slate-700'
                }`}
              />
            ))}
          </div>

          <div className="flex gap-1.5">
            {currentStep > 0 && (
              <button
                onClick={handleBack}
                className="px-3.5 py-1.5 bg-slate-200/60 dark:bg-slate-900/60 hover:bg-slate-300 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold rounded-lg text-xs border border-slate-300 dark:border-slate-800 transition-all cursor-pointer flex items-center gap-1"
              >
                <ArrowLeft className="w-3 h-3" /> Zurück
              </button>
            )}

            <button
              onClick={handleNext}
              className="px-4 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold rounded-lg text-xs transition-all shadow-md flex items-center gap-1 cursor-pointer"
            >
              {currentStep === steps.length - 1 ? (
                <>
                  Fertig <Check className="w-3.5 h-3.5" />
                </>
              ) : (
                <>
                  Weiter <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        </div>

        {/* Dynamic pointing indicator tip */}
        {coords.position !== 'center' && (
          <div
            className={`absolute left-[190px] w-4 h-4 rotate-45 border-l border-t border-purple-500/20 bg-slate-100/90 dark:bg-slate-950/90 backdrop-blur-md hidden sm:block transition-all duration-500 ${
              coords.position === 'bottom'
                ? '-top-2 border-l border-t'
                : '-bottom-2 border-r border-b'
            }`}
            style={{
              borderColor: 'rgba(168, 85, 247, 0.2)',
              borderLeftColor: coords.position === 'bottom' ? 'rgba(168, 85, 247, 0.2)' : 'transparent',
              borderTopColor: coords.position === 'bottom' ? 'rgba(168, 85, 247, 0.2)' : 'transparent',
              borderRightColor: coords.position === 'top' ? 'rgba(168, 85, 247, 0.2)' : 'transparent',
              borderBottomColor: coords.position === 'top' ? 'rgba(168, 85, 247, 0.2)' : 'transparent',
            }}
          />
        )}
      </div>
    </div>
  );
};

export default OnboardingTour;
