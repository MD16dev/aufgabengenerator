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
    <div
      className="fixed bottom-6 right-6 z-40 pointer-events-none"
      id="pomodoro-widget"
      onMouseEnter={() => setIsWidgetExpanded(true)}
      onMouseLeave={() => setIsWidgetExpanded(false)}
    >
      {/* Single morphing box: the pill grows into the panel.
          Only the outer "window" animates its size; inner layers keep fixed
          dimensions so nothing reflows -> smooth morph. The timestamp is ONE
          shared element that slides between the pill-center and the ring-center. */}
      <div
        style={{
          transition:
            'width 0.42s cubic-bezier(0.22, 1, 0.36, 1), height 0.42s cubic-bezier(0.22, 1, 0.36, 1), border-radius 0.42s cubic-bezier(0.22, 1, 0.36, 1)',
          willChange: 'width, height, border-radius',
          transform: 'translateZ(0)',
        }}
        className={`pointer-events-auto glass-panel shadow-2xl overflow-hidden relative ${
          isWidgetExpanded ? 'w-64 h-[224px] rounded-2xl' : 'w-[124px] h-12 rounded-[56px]'
        }`}
      >
        {/* Clock icon — only meaningful in the collapsed pill, just fades */}
        <Clock
          style={{
            position: 'absolute',
            left: '40px',
            top: '24px',
            transform: 'translate(-50%, -50%)',
            opacity: isWidgetExpanded ? 0 : 1,
            transition: `opacity 0.25s ease ${isWidgetExpanded ? '0s' : '0.12s'}`,
          }}
          className={`w-5 h-5 ${labelColor} ${isActive && !isWidgetExpanded ? 'animate-pulse' : ''}`}
        />

        {/* ONE shared timestamp — slides from pill-center to ring-center */}
        <span
          style={{
            position: 'absolute',
            left: isWidgetExpanded ? '128px' : '84px',
            top: isWidgetExpanded ? '100px' : '24px',
            transform: 'translate(-50%, -50%)',
            fontSize: isWidgetExpanded ? '16px' : '12px',
            transition:
              'left 0.42s cubic-bezier(0.22, 1, 0.36, 1), top 0.42s cubic-bezier(0.22, 1, 0.36, 1), font-size 0.42s cubic-bezier(0.22, 1, 0.36, 1)',
          }}
          className="font-extrabold text-theme-primary tabular-nums whitespace-nowrap"
        >
          {formatTime(minutes, seconds)}
        </span>

        {/* Expanded-only content (ring, label, header, buttons) — fades in on
            expand (slight delay) and out IMMEDIATELY on collapse so it never
            appears to "fly" while the box shrinks. */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            opacity: isWidgetExpanded ? 1 : 0,
            pointerEvents: isWidgetExpanded ? 'auto' : 'none',
            transition: `opacity 0.3s ease ${isWidgetExpanded ? '0.16s' : '0s'}`,
          }}
          className="flex flex-col p-5"
        >
          <div className="flex justify-between items-center mb-4">
            <span className="text-xs font-bold text-theme-secondary">Pomodoro Timer</span>
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
              {/* Fokus/Pause label sits just below the shared timestamp */}
              <span
                style={{ position: 'absolute', left: '50%', top: '62%', transform: 'translate(-50%, 0)' }}
                className={`text-[8px] font-extrabold uppercase ${labelColor}`}
              >
                {mode === 'work' ? 'Fokus' : 'Pause'}
              </span>
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
      </div>
    </div>
  );
};

export default PomodoroWidget;
