import React, { useState, useEffect } from 'react';
import { X, ArrowRight, ArrowLeft, Check, Compass, BookOpen, HelpCircle, Trophy } from 'lucide-react';

interface OnboardingTourProps {
  onClose: () => void;
}

interface TourStep {
  title: string;
  description: string;
  icon: React.ReactNode;
  targetId: string; // The DOM element ID to highlight
}

interface Coords {
  top: number;
  left: number;
  position: 'bottom' | 'top' | 'center';
  width: number;
  height: number;
}

export const OnboardingTour: React.FC<OnboardingTourProps> = ({ onClose }) => {
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [coords, setCoords] = useState<Coords | null>(null);

  const steps: TourStep[] = [
    {
      title: 'Willkommen beim AufgabenGenerator! 🎓',
      description: 'Lerne effizienter für deine Klausuren! Hier findest du unendlich viele, algorithmisch generierte Übungsaufgaben für Informatik und Mathematik – direkt zum Rechnen und Überprüfen.',
      icon: <Compass className="w-10 h-10 text-purple-500" />,
      targetId: '' // Center of the screen
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

  const updateCoords = () => {
    const step = steps[currentStep];
    if (!step.targetId) {
      // Center of screen fallback
      setCoords({
        top: window.innerHeight / 2 - 150,
        left: Math.max(16, window.innerWidth / 2 - 200),
        position: 'center',
        width: 0,
        height: 0
      });
      return;
    }

    const target = document.getElementById(step.targetId);
    if (target) {
      // Smoothly scroll target to center of screen before calculating
      target.scrollIntoView({ behavior: 'smooth', block: 'center' });

      // Add a slight delay for scroll completion before calculating coordinates
      setTimeout(() => {
        const rect = target.getBoundingClientRect();
        const scrollY = window.scrollY;
        const scrollX = window.scrollX;
        
        let position: 'bottom' | 'top' = 'bottom';
        let top = rect.bottom + scrollY + 16;
        let left = rect.left + scrollX + rect.width / 2 - 200; // Center popup (width 400)

        // If elements are near the bottom, place the bubble above the target
        if (rect.bottom + 300 > window.innerHeight) {
          top = rect.top + scrollY - 260 - 16; // Bounded popup height
          position = 'top';
        }

        // Bounded left edge
        left = Math.max(16, Math.min(window.innerWidth - 400 - 16, left));

        setCoords({
          top,
          left,
          position,
          width: rect.width,
          height: rect.height
        });
      }, 350);
    } else {
      // Element not found fallback: center of screen
      setCoords({
        top: window.innerHeight / 2 - 150,
        left: Math.max(16, window.innerWidth / 2 - 200),
        position: 'center',
        width: 0,
        height: 0
      });
    }
  };

  // Run class manipulations on step transitions
  useEffect(() => {
    const step = steps[currentStep];
    if (!step.targetId) {
      setCoords({
        top: window.innerHeight / 2 - 150,
        left: Math.max(16, window.innerWidth / 2 - 200),
        position: 'center',
        width: 0,
        height: 0
      });
      return;
    }

    const target = document.getElementById(step.targetId);
    if (target) {
      target.classList.add('spotlight-active');
    }

    updateCoords();

    // Listen to resize and scroll
    window.addEventListener('resize', updateCoords);
    window.addEventListener('scroll', updateCoords);

    return () => {
      if (target) {
        target.classList.remove('spotlight-active');
      }
      window.removeEventListener('resize', updateCoords);
      window.removeEventListener('scroll', updateCoords);
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
      {/* Background Mask: Active only on first step (centered modal), otherwise handled by spotlight-active box shadows */}
      {step.targetId === '' && (
        <div className="absolute inset-0 bg-black/75 backdrop-blur-md pointer-events-auto transition-all" />
      )}

      {/* Floating Tour Bubble */}
      {coords && (
        <div
          style={{
            position: 'absolute',
            top: `${coords.top}px`,
            left: `${coords.left}px`,
            width: '400px',
            maxWidth: 'calc(100vw - 32px)'
          }}
          className="p-6 rounded-3xl glass-panel border border-purple-500/20 shadow-2xl glow-purple pointer-events-auto animate-fadeIn z-50"
          id="onboarding-tour-bubble"
        >
          {/* Skip Button */}
          <button
            onClick={handleComplete}
            className="absolute top-4 right-4 p-1.5 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors cursor-pointer"
            title="Tour überspringen"
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

          {/* Stepper Buttons & Indicators */}
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
                  className="px-3.5 py-1.5 bg-slate-200/60 dark:bg-slate-900/60 hover:bg-slate-300 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold rounded-lg text-xs border border-slate-300 dark:border-slate-850 transition-all cursor-pointer flex items-center gap-1"
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

          {/* Arrow pointing to target */}
          {coords.position !== 'center' && (
            <div
              className={`absolute left-[190px] w-4 h-4 rotate-45 border-l border-t border-purple-500/20 bg-slate-900/60 backdrop-blur-md hidden sm:block ${
                coords.position === 'bottom'
                  ? '-top-2 bg-slate-950/65 dark:bg-slate-900/60 border-l border-t border-purple-500/20'
                  : '-bottom-2 bg-slate-950/65 dark:bg-slate-900/60 border-r border-b border-purple-500/20'
              }`}
              style={{
                background: 'inherit',
                borderLeftColor: coords.position === 'bottom' ? 'inherit' : 'transparent',
                borderTopColor: coords.position === 'bottom' ? 'inherit' : 'transparent',
                borderRightColor: coords.position === 'top' ? 'inherit' : 'transparent',
                borderBottomColor: coords.position === 'top' ? 'inherit' : 'transparent',
              }}
            />
          )}
        </div>
      )}
    </div>
  );
};

export default OnboardingTour;
