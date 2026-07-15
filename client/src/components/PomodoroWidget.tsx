import { Clock, Play, Pause, RotateCcw } from 'lucide-react';
import { usePomodoro } from '../hooks/usePomodoro';

const formatTime = (mins: number, secs: number) =>
  `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

/**
 * Floating, expandable/collapsible Pomodoro timer widget shown on all pages.
 */
export const PomodoroWidget: React.FC = () => {
  const {
    minutes, seconds, isActive, mode, isWidgetExpanded, setIsWidgetExpanded,
    setIsActive, reset, getProgressPercentage,
  } = usePomodoro();

  const ringColor = mode === 'work' ? 'stroke-purple-600' : 'stroke-emerald-500';
  const labelColor = mode === 'work' ? 'text-purple-600' : 'text-emerald-500';

  return (
    <div className="fixed bottom-6 right-6 z-40 pointer-events-none">
      {!isWidgetExpanded ? (
        <button
          onClick={() => setIsWidgetExpanded(true)}
          style={{ transition: 'all 0.3s cubic-bezier(0.25, 1, 0.5, 1)' }}
          className={`pointer-events-auto p-3.5 rounded-full glass-panel shadow-2xl flex items-center gap-2 hover:scale-105 cursor-pointer animate-fadeIn ${
            isActive ? 'animate-pulse' : ''
          }`}
        >
          <Clock className={`w-5 h-5 ${labelColor}`} />
          <span className="text-xs font-bold text-theme-primary tabular-nums">
            {formatTime(minutes, seconds)}
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

          <div className="flex flex-col items-center justify-center mb-4">
            <div className="relative w-24 h-24 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90">
                <circle cx="48" cy="48" r="42" className="stroke-theme-card fill-none" strokeWidth="4" />
                <circle
                  cx="48" cy="48" r="42"
                  className={`fill-none transition-all duration-1000 ${ringColor}`}
                  strokeWidth="5" strokeDasharray={264}
                  strokeDashoffset={264 - (264 * getProgressPercentage()) / 100}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute flex flex-col items-center">
                <span className="text-base font-extrabold text-theme-primary tabular-nums">
                  {formatTime(minutes, seconds)}
                </span>
                <span className={`text-[8px] font-extrabold uppercase ${labelColor}`}>
                  {mode === 'work' ? 'Fokus' : 'Pause'}
                </span>
              </div>
            </div>
          </div>

          <div className="flex justify-center gap-2">
            <button
              onClick={() => setIsActive(!isActive)}
              className="flex-grow py-1.5 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-lg text-xs cursor-pointer flex justify-center items-center gap-1 shadow-sm"
            >
              {isActive ? (<><Pause className="w-3 h-3" /> Pause</>) : (<><Play className="w-3 h-3" /> Start</>)}
            </button>
            <button
              onClick={reset}
              className="p-1.5 bg-theme-card hover:brightness-95 dark:hover:brightness-110 border border-theme-border text-theme-muted hover:text-theme-primary rounded-lg cursor-pointer"
              title="Zurücksetzen"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PomodoroWidget;
