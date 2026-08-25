import { useState, useEffect, useRef } from 'react';
import ParticleBackground from './ParticleBackground';
import { getTimeRemaining, LAUNCH_TIMESTAMP } from '../utils/launchConfig';

export default function CountdownScreen({ onLaunchComplete }) {
  const [timeLeft, setTimeLeft] = useState(() => getTimeRemaining());
  const [transitionState, setTransitionState] = useState('active'); // 'active' | 'launching' | 'finished'
  const [soundEnabled, setSoundEnabled] = useState(false);

  const audioContextRef = useRef(null);
  const clockGainRef = useRef(null);
  const clockSchedulerRef = useRef(null);
  const nextTickRef = useRef(0);
  const clockRunIdRef = useRef(0);
  const tickCountRef = useRef(0);

  const playTick = (context, time) => {
    try {
      const oscillator = context.createOscillator();
      const gain = context.createGain();

      // Alternate between crisp high tick (1800Hz) and slightly lower tock (1300Hz)
      const isTick = tickCountRef.current % 2 === 0;
      tickCountRef.current += 1;

      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(isTick ? 1800 : 1300, time);
      oscillator.frequency.exponentialRampToValueAtTime(isTick ? 900 : 700, time + 0.04);

      // Volume envelope - crisp attack & decay
      gain.gain.setValueAtTime(0.0001, time);
      gain.gain.exponentialRampToValueAtTime(0.35, time + 0.003);
      gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.05);

      oscillator.connect(gain);
      if (clockGainRef.current) {
        gain.connect(clockGainRef.current);
      } else {
        gain.connect(context.destination);
      }

      oscillator.start(time);
      oscillator.stop(time + 0.055);
    } catch (e) {
      console.warn('Audio tick error:', e);
    }
  };

  const stopClock = () => {
    clockRunIdRef.current += 1;
    if (clockSchedulerRef.current) {
      clearInterval(clockSchedulerRef.current);
      clockSchedulerRef.current = null;
    }
    const context = audioContextRef.current;
    if (context && clockGainRef.current) {
      try {
        clockGainRef.current.gain.setValueAtTime(0, context.currentTime);
      } catch (e) {}
    }
  };

  const startClock = async () => {
    const runId = clockRunIdRef.current + 1;
    clockRunIdRef.current = runId;

    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;

    let context = audioContextRef.current;
    if (!context) {
      context = new AudioContextClass();
      audioContextRef.current = context;
    }

    if (!clockGainRef.current) {
      const mainGain = context.createGain();
      mainGain.connect(context.destination);
      clockGainRef.current = mainGain;
    }

    try {
      if (context.state === 'suspended') {
        await context.resume();
      }

      if (clockRunIdRef.current !== runId) return;

      clockGainRef.current.gain.setValueAtTime(0.6, context.currentTime);
      setSoundEnabled(context.state === 'running');

      if (!clockSchedulerRef.current) {
        const msToNextSecond = 1000 - (Date.now() % 1000);
        nextTickRef.current = context.currentTime + msToNextSecond / 1000;

        const scheduleTicks = () => {
          if (!audioContextRef.current) return;
          const ctx = audioContextRef.current;
          while (nextTickRef.current < ctx.currentTime + 0.2) {
            playTick(ctx, nextTickRef.current);
            nextTickRef.current += 1;
          }
        };

        scheduleTicks();
        clockSchedulerRef.current = setInterval(scheduleTicks, 40);
      }
    } catch (err) {
      console.warn('AudioContext start error:', err);
    }
  };

  const toggleSound = async () => {
    if (!soundEnabled) {
      await startClock();
      if (audioContextRef.current && audioContextRef.current.state === 'running') {
        setSoundEnabled(true);
      }
    } else {
      stopClock();
      setSoundEnabled(false);
    }
  };

  useEffect(() => {
    // Attempt auto-start (some browsers allow if user clicked to navigate here)
    startClock();

    // Browser autoplay policy handler: enable audio on first user touch/click/keypress
    const enableAudioOnUserGesture = async () => {
      await startClock();
      if (audioContextRef.current && audioContextRef.current.state === 'running') {
        setSoundEnabled(true);
      }
    };

    window.addEventListener('click', enableAudioOnUserGesture, { once: true });
    window.addEventListener('touchstart', enableAudioOnUserGesture, { once: true });
    window.addEventListener('keydown', enableAudioOnUserGesture, { once: true });

    return () => {
      window.removeEventListener('click', enableAudioOnUserGesture);
      window.removeEventListener('touchstart', enableAudioOnUserGesture);
      window.removeEventListener('keydown', enableAudioOnUserGesture);
      stopClock();
    };
  }, []);

  useEffect(() => {
    const initialTime = getTimeRemaining();
    if (initialTime.isLaunched) {
      triggerLaunchSequence();
      return;
    }

    const timer = setInterval(() => {
      const remaining = getTimeRemaining();
      setTimeLeft(remaining);

      if (remaining.isLaunched) {
        clearInterval(timer);
        triggerLaunchSequence();
      }
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const triggerLaunchSequence = () => {
    stopClock();
    setTransitionState('launching');

    setTimeout(() => {
      setTransitionState('finished');
      if (onLaunchComplete) {
        onLaunchComplete();
      }
    }, 2500);
  };

  const formatUnit = (num) => String(num).padStart(2, '0');

  return (
    <div className={`countdown-screen ${transitionState}`} role="region" aria-label="Pre-launch countdown">
      {/* Ambient background layers */}
      <div className="countdown-bg" aria-hidden="true">
        <div className="countdown-grid"></div>
        <div className="countdown-radial-glow"></div>
        <div className="countdown-circuit-overlay"></div>
        <ParticleBackground />
      </div>

      <img
        src="/heritage-emblem.png"
        alt=""
        aria-hidden="true"
        className="countdown-corner-art"
      />

      <div className="countdown-container">
        {/* Official Logo with breathing ambient glow */}
        <div className="countdown-logo-wrapper">
          <div className="logo-ambient-glow"></div>
          <img
            src="/logo.png"
            alt="Official Intelligent Iguanas Logo"
            className="countdown-logo"
            width="170"
            height="170"
            loading="eager"
          />
        </div>

        {/* Brand & Pre-launch Headings */}
        <div className="countdown-header">
          <h1 className="countdown-brand">
            INTELLIGENT <span>IGUANAS</span>
          </h1>

          <h2 className="countdown-tagline-main">
            THE COMMUNITY IS COMING
          </h2>

          <p className="countdown-motto">
            LEARN &nbsp;•&nbsp; SHARE &nbsp;•&nbsp; BUILD &nbsp;•&nbsp; GROW
          </p>
        </div>

        {/* Transition Overlay / Live Countdown */}
        {transitionState === 'launching' ? (
          <div className="launch-unlocked-banner">
            <h2 className="launch-unlocked-title">THE WAIT IS OVER</h2>
            <p className="launch-unlocked-subtitle">Welcome to Intelligent Iguanas</p>
          </div>
        ) : (
          <>
            <div className="countdown-label-tag">LAUNCHING IN</div>

            {/* Countdown Cards */}
            <div className="countdown-grid-cards" aria-live="polite" aria-atomic="true">
              <div className="glass-card countdown-card">
                <span className="countdown-number">{formatUnit(timeLeft.days)}</span>
                <span className="countdown-label">DAYS</span>
              </div>
              <div className="countdown-separator">:</div>

              <div className="glass-card countdown-card">
                <span className="countdown-number">{formatUnit(timeLeft.hours)}</span>
                <span className="countdown-label">HOURS</span>
              </div>
              <div className="countdown-separator">:</div>

              <div className="glass-card countdown-card">
                <span className="countdown-number">{formatUnit(timeLeft.minutes)}</span>
                <span className="countdown-label">MINUTES</span>
              </div>
              <div className="countdown-separator">:</div>

              <div className="glass-card countdown-card">
                <span className="countdown-number">{formatUnit(timeLeft.seconds)}</span>
                <span className="countdown-label">SECONDS</span>
              </div>
            </div>

            {/* Official Launch Date */}
            <div className="countdown-date-badge">
              <span className="launch-date-text">SEPTEMBER 4, 2026</span>
              <span className="launch-time-text">00:00 IST</span>
            </div>

            {/* Lock Status Message */}
            <div className="countdown-lock-status">
              <div className="lock-icon-wrapper">
                <span className="lock-emoji">🔒</span>
                <span className="lock-text-title">COMMUNITY ACCESS LOCKED</span>
              </div>
              <p className="lock-text-sub">The gates open on September 4.</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
