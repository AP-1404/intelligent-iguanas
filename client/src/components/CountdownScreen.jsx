import { useState, useEffect, useRef } from 'react';
import ParticleBackground from './ParticleBackground';
import { getTimeRemaining } from '../utils/launchConfig';

export default function CountdownScreen({ onLaunchComplete }) {
  const [timeLeft, setTimeLeft] = useState(() => getTimeRemaining());
  const [transitionState, setTransitionState] = useState('active'); // 'active' | 'launching' | 'finished'

  const audioCtxRef = useRef(null);
  const tickAltRef = useRef(false);

  // Play crisp mechanical tick-tock audio
  const playTickSound = () => {
    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) return;

      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioContextClass();
      }
      const ctx = audioCtxRef.current;

      if (ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
      }

      if (ctx.state !== 'running') return;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      const isTick = tickAltRef.current;
      tickAltRef.current = !isTick;

      const freq = isTick ? 1600 : 1100;
      const now = ctx.currentTime;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.5, now + 0.04);

      // Volume envelope - clear, crisp click
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.4, now + 0.003);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.045);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.05);
    } catch (e) {
      console.warn('Audio tick error:', e);
    }
  };

  // Immediate Audio Activation on Page Load & Comprehensive Interaction Listeners
  useEffect(() => {
    const activateAudio = () => {
      try {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (!audioCtxRef.current && AudioContextClass) {
          audioCtxRef.current = new AudioContextClass();
        }
        if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
          audioCtxRef.current.resume().then(() => {
            playTickSound();
          }).catch(() => {});
        }
      } catch (e) {}
    };

    // Attempt sound immediately on load / component mount
    activateAudio();
    playTickSound();

    if (document.readyState === 'complete') {
      activateAudio();
    } else {
      window.addEventListener('load', activateAudio, { once: true });
      document.addEventListener('DOMContentLoaded', activateAudio, { once: true });
    }

    // Listeners for all user interaction & movement events to un-suspend audio context instantly
    const events = ['click', 'touchstart', 'pointerdown', 'pointermove', 'mousemove', 'keydown', 'scroll', 'mouseenter', 'focus'];
    events.forEach((evt) => window.addEventListener(evt, activateAudio, { passive: true }));

    return () => {
      window.removeEventListener('load', activateAudio);
      document.removeEventListener('DOMContentLoaded', activateAudio);
      events.forEach((evt) => window.removeEventListener(evt, activateAudio));
    };
  }, []);

  // Update countdown timer every second
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

  // Play tick sound whenever the second changes
  useEffect(() => {
    if (transitionState === 'active') {
      playTickSound();
    }
  }, [timeLeft.seconds, transitionState]);

  const triggerLaunchSequence = () => {
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
