import React, { useState } from 'react';
import { X, ArrowRight, ArrowLeft, Check, Compass, BookOpen, HelpCircle, Trophy } from 'lucide-react';

interface OnboardingTourProps {
  onClose: () => void;
}

interface TourStep {
  title: string;
  description: string;
  icon: React.ReactNode;
}

export const OnboardingTour: React.FC<OnboardingTourProps> = ({ onClose }) => {
  const [currentStep, setCurrentStep] = useState<number>(0);

  const steps: TourStep[] = [
    {
      title: 'Willkommen beim AufgabenGenerator! 🎓',
      description: 'Lerne effizienter für deine Klausuren! Hier findest du unendlich viele, algorithmisch generierte Übungsaufgaben für Informatik und Mathematik – direkt zum Rechnen und Überprüfen.',
      icon: <Compass className="w-10 h-10 text-purple-400" />
    },
    {
      title: 'Fächer & Aufgaben auswählen 📚',
      description: 'Wähle auf der Startseite dein gewünschtes Studienfach (z. B. Lineare Algebra) und klicke auf einen aktiven Aufgabetyp. Jede Aufgabe wird bei jedem Klick mit frischen, zufälligen Zahlenwerten generiert.',
      icon: <BookOpen className="w-10 h-10 text-emerald-400" />
    },
    {
      title: 'Schritt-für-Schritt Rechenwege 💡',
      description: 'Du kommst bei einer Aufgabe nicht weiter? Kein Problem! Zu jeder generierten Aufgabe steht dir eine ausführliche, sauber formatierte LaTeX-Musterlösung zur Verfügung. Klicke einfach auf "Rechenweg anzeigen".',
      icon: <HelpCircle className="w-10 h-10 text-blue-400" />
    },
    {
      title: 'Mit Kommilitonen messen 🏆',
      description: 'Erstelle ein einfaches Profil (Benutzername & Passwort) und sammle Punkte für richtig gelöste Aufgaben. Deine Punkte werden sicher in unserer Datenbank gespeichert, sodass du auf der Bestenliste aufsteigen kannst!',
      icon: <Trophy className="w-10 h-10 text-pink-400" />
    }
  ];

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn">
      {/* Tour Card */}
      <div 
        className="w-full max-w-lg p-6 md:p-8 rounded-3xl glass-panel relative border border-white/10 shadow-2xl glow-purple animate-fadeIn"
        id="onboarding-tour-container"
      >
        {/* Skip button */}
        <button
          onClick={handleComplete}
          className="absolute top-4 right-4 p-2 text-slate-500 hover:text-slate-200 hover:bg-white/5 rounded-full transition-colors cursor-pointer"
          title="Tour überspringen"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Dynamic Icon */}
        <div className="flex justify-center mb-6">
          <div className="p-4 bg-slate-900/60 rounded-2xl border border-slate-800/40">
            {step.icon}
          </div>
        </div>

        {/* Title & Body */}
        <h2 className="text-xl md:text-2xl font-bold font-display text-center text-slate-100 mb-4 leading-snug">
          {step.title}
        </h2>
        <p className="text-slate-400 text-sm md:text-base text-center leading-relaxed mb-8 px-2 md:px-4">
          {step.description}
        </p>

        {/* Actions & Stepper */}
        <div className="flex items-center justify-between pt-6 border-t border-slate-800/60">
          {/* Stepper Dots */}
          <div className="flex gap-1.5">
            {steps.map((_, idx) => (
              <span
                key={idx}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  idx === currentStep ? 'bg-purple-500 w-5' : 'bg-slate-700'
                }`}
              />
            ))}
          </div>

          {/* Navigation buttons */}
          <div className="flex gap-2">
            {currentStep > 0 && (
              <button
                onClick={handleBack}
                className="px-4 py-2.5 bg-slate-900/60 hover:bg-slate-800 text-slate-300 hover:text-slate-100 font-semibold rounded-xl text-sm border border-slate-800 transition-all cursor-pointer flex items-center gap-1.5"
              >
                <ArrowLeft className="w-4 h-4" /> Zurück
              </button>
            )}

            <button
              onClick={handleNext}
              className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold rounded-xl text-sm transition-all shadow-lg hover:shadow-purple-500/20 flex items-center gap-1.5 cursor-pointer"
            >
              {currentStep === steps.length - 1 ? (
                <>
                  Fertig <Check className="w-4 h-4" />
                </>
              ) : (
                <>
                  Weiter <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnboardingTour;
