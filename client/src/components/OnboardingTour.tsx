import React, { useState, useEffect } from 'react';
import { X, ArrowRight, ArrowLeft, Check, Compass, BookOpen, HelpCircle, Trophy } from 'lucide-react';

interface OnboardingTourProps {
  onClose: () => void;
}

interface TourStep {
  title: string;
  description: string;
  icon: React.ReactNode;
  targetId: string;
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

export const OnboardingTour: React.FC<OnboardingTourProps> = ({ onClose }) => {
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
      targetId: 'module-selector-dashboard'
    },
    {
      title: 'Theme umschalten ☀️ / 🌙',
      description: 'Lernst du lieber tagsüber oder nachts? Über diesen Toggler kannst du jederzeit zwischen dem Darkmode und dem Whitemode (Lightmode) umschalten. Standardmäßig passen wir uns deinem Betriebssystem an.',
      icon: <HelpCircle className="w-10 h-10 text-blue-500" />,
      targetId: 'theme-toggle-btn'
    },
    {
      title: 'Profil & Fortschritt 🏆',
      description: 'Klicke hier, um dich einzuloggen oder einen kostenlosen Account zu erstellen. So werden deine erarbeiteten Punkte sicher gespeichert, du steigst im Level auf und kletterst auf die Bestenliste!',
      icon: <Trophy className="w-10 h-10 text-pink-500" />,
      targetId: 'login-btn'
    }
  ];

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
    // Initial run and update positions on step change
    updatePositions();

    // Event listeners to handle resizing or manual scrolling
    window.addEventListener('resize', updatePositions);
    window.addEventListener('scroll', updatePositions);

    return () => {
      window.removeEventListener('resize', updatePositions);
      window.removeEventListener('scroll', updatePositions);
    };
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
      {/* Semi-transparent backdrop when in welcome step */}
      {step.targetId === '' && (
        <div className="absolute inset-0 bg-black/75 backdrop-blur-md pointer-events-auto transition-opacity duration-500 animate-fadeIn" />
      )}

      {/* Spotlight highlight overlay box (hardware-accelerated sliding & sizing transitions) */}
      <div
        className="spotlight-overlay-box pointer-events-auto"
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
          className="absolute top-4 right-4 p-1.5 text-slate-400 dark:text-slate-500 hover:text-slate-650 dark:hover:text-slate-200 hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors cursor-pointer"
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
                className="px-3.5 py-1.5 bg-slate-250/60 dark:bg-slate-900/60 hover:bg-slate-300 dark:hover:bg-slate-850 text-slate-700 dark:text-slate-300 font-semibold rounded-lg text-xs border border-slate-300 dark:border-slate-850 transition-all cursor-pointer flex items-center gap-1"
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
