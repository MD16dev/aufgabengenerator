import { useState, useEffect } from 'react';

/**
 * Manages the Pomodoro timer state: countdown, work/break modes,
 * configurable durations and the completion chime.
 */
export function usePomodoro() {
  const [workTime, setWorkTime] = useState<number>(25);
  const [breakTime, setBreakTime] = useState<number>(5);
  const [minutes, setMinutes] = useState<number>(25);
  const [seconds, setSeconds] = useState<number>(0);
  const [isActive, setIsActive] = useState<boolean>(false);
  const [mode, setMode] = useState<'work' | 'break'>('work');
  const [isWidgetExpanded, setIsWidgetExpanded] = useState<boolean>(false);

  // Synthesize a soft bell alarm sound when the pomodoro ends
  const playChime = () => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.setValueAtTime(880.00, ctx.currentTime + 0.12); // A5
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
      osc.start();
      osc.stop(ctx.currentTime + 0.55);
    } catch (e) {
      console.error('Audio alert chime could not play:', e);
    }
  };

  // Ticking interval
  useEffect(() => {
    let timerInterval: any = null;
    if (isActive) {
      timerInterval = setInterval(() => {
        if (seconds > 0) {
          setSeconds(prev => prev - 1);
        } else {
          if (minutes > 0) {
            setMinutes(prev => prev - 1);
            setSeconds(59);
          } else {
            playChime();
            const nextMode = mode === 'work' ? 'break' : 'work';
            setMode(nextMode);
            const nextMins = nextMode === 'work' ? workTime : breakTime;
            setMinutes(nextMins);
            setSeconds(0);
            setTimeout(() => {
              alert(
                nextMode === 'break'
                  ? 'Fokuszeit beendet! Nimm dir eine kurze Pause. ☕'
                  : 'Pause beendet! Zeit sich wieder zu fokussieren. 🧠'
              );
            }, 100);
          }
        }
      }, 1000);
    } else {
      clearInterval(timerInterval);
    }
    return () => clearInterval(timerInterval);
  }, [isActive, minutes, seconds, mode, workTime, breakTime]);

  const handleWorkTimeChange = (mins: number) => {
    setWorkTime(mins);
    if (!isActive && mode === 'work') {
      setMinutes(mins);
      setSeconds(0);
    }
  };

  const handleBreakTimeChange = (mins: number) => {
    setBreakTime(mins);
    if (!isActive && mode === 'break') {
      setMinutes(mins);
      setSeconds(0);
    }
  };

  const reset = () => {
    setIsActive(false);
    setMode('work');
    setMinutes(workTime);
    setSeconds(0);
  };

  const getProgressPercentage = () => {
    const totalSecs = mode === 'work' ? workTime * 60 : breakTime * 60;
    const remainingSecs = minutes * 60 + seconds;
    return ((totalSecs - remainingSecs) / totalSecs) * 100;
  };

  return {
    workTime, breakTime, minutes, seconds, isActive, mode, isWidgetExpanded,
    setIsWidgetExpanded, setIsActive,
    handleWorkTimeChange, handleBreakTimeChange, reset, getProgressPercentage,
  };
}
