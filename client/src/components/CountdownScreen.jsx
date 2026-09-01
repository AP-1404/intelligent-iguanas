import { useState, useEffect, useRef, useCallback } from 'react';
import ParticleBackground from './ParticleBackground';
import { getTimeRemaining } from '../utils/launchConfig';

// ═══════════════════════════════════════════════════════════════════════════════
// CONFIGURABLE COMMUNITY LINKS
// Replace null with real URLs when available.
// Buttons are visually marked "coming soon" if these remain null.
// ═══════════════════════════════════════════════════════════════════════════════
const COMMUNITY_URL = null; // e.g. 'https://chat.whatsapp.com/XXXXXXXXXXXXXXXXX'
const SOCIAL_URL    = null; // e.g. 'https://instagram.com/intelligentiguanas'
// ═══════════════════════════════════════════════════════════════════════════════

const TERMINAL_LINES = [
  'INITIALIZING COMMUNITY NETWORK...',
  'VERIFYING CONNECTION...',
  'ESTABLISHING SECURE CHANNEL...',
  'PREPARING COMMUNITY ACCESS...',
  'LAUNCH SEQUENCE ACTIVE...',
  'WAITING FOR ACTIVATION...',
];

const FEATURE_CARDS = [
  { num: '01', title: 'LEARN',   desc: 'Discover knowledge and grow through shared learning experiences.' },
  { num: '02', title: 'CONNECT', desc: 'Meet people with similar interests, ambitions, and curiosity.'   },
  { num: '03', title: 'BUILD',   desc: 'Turn ideas into real projects, experiences, and opportunities.'   },
  { num: '04', title: 'GROW',    desc: 'Develop skills, confidence, and meaningful connections over time.' },
];

/* ─── CountdownCard ──────────────────────────────────────────────────────────
   Renders a single unit card. Applies a brief flip animation when the value
   changes, updating the displayed number at the visual midpoint.
   ─────────────────────────────────────────────────────────────────────────── */
function CountdownCard({ value, label }) {
  const [display, setDisplay] = useState(value);
  const [flipping, setFlipping] = useState(false);
  const prev = useRef(value);

  useEffect(() => {
    if (prev.current === value) return;
    prev.current = value;
    setFlipping(true);
    const mid = setTimeout(() => setDisplay(value), 210);
    const end = setTimeout(() => setFlipping(false), 430);
    return () => { clearTimeout(mid); clearTimeout(end); };
  }, [value]);

  return (
    <div className="countdown-card" role="timer">
      <span className={`countdown-number${flipping ? ' is-flipping' : ''}`}>
        {String(display).padStart(2, '0')}
      </span>
      <span className="countdown-label">{label}</span>
    </div>
  );
}

/* ─── StatusPanel ────────────────────────────────────────────────────────────
   Monospace system-status rows. Green = active, gray = locked.
   ─────────────────────────────────────────────────────────────────────────── */
function StatusPanel({ isLaunched }) {
  const rows = [
    { label: 'COMMUNITY NETWORK', value: 'ONLINE',                           on: true         },
    { label: 'LAUNCH SEQUENCE',   value: isLaunched ? 'COMPLETE' : 'ACTIVE', on: true         },
    { label: 'COMMUNITY ACCESS',  value: isLaunched ? 'UNLOCKED' : 'LOCKED', on: isLaunched   },
    { label: 'SYSTEM STATUS',     value: 'READY',                            on: true         },
  ];

  return (
    <div className="status-panel" role="status" aria-label="System status">
      <p className="status-panel-title">SYSTEM STATUS</p>
      <div className="status-rows">
        {rows.map((row, i) => (
          <div key={i} className="status-row">
            <span className={`status-indicator${row.on ? ' status-indicator--on' : ''}`} aria-hidden="true" />
            <span className="status-row-label">{row.label}</span>
            <span className={`status-row-value${row.on ? ' status-row-value--on' : ''}`}>{row.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Terminal ───────────────────────────────────────────────────────────────
   Animated terminal lines appear one-by-one. During the launch sequence,
   "CONNECTION ESTABLISHED" and "ACCESS GRANTED" are appended.
   ─────────────────────────────────────────────────────────────────────────── */
function Terminal({ isLaunching }) {
  const [lines, setLines] = useState([]);
  const [launchLines, setLaunchLines] = useState([]);
  const [cursorOn, setCursorOn] = useState(true);

  // Gradually reveal normal terminal lines
  useEffect(() => {
    const timers = TERMINAL_LINES.map((line, i) =>
      setTimeout(() => setLines(prev => [...prev, line]), 1200 + i * 960)
    );
    return () => timers.forEach(clearTimeout);
  }, []);

  // Append launch sequence messages when transition fires
  useEffect(() => {
    if (!isLaunching) return;
    const t1 = setTimeout(() => setLaunchLines(['CONNECTION ESTABLISHED']), 500);
    const t2 = setTimeout(() => setLaunchLines(['CONNECTION ESTABLISHED', 'ACCESS GRANTED']), 1400);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [isLaunching]);

  // Blinking cursor
  useEffect(() => {
    const id = setInterval(() => setCursorOn(c => !c), 530);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="terminal-panel" aria-label="System terminal output">
      <div className="terminal-header" aria-hidden="true">
        <div className="terminal-dots"><span /><span /><span /></div>
        <span className="terminal-title-bar">INTELLIGENT IGUANAS // SYSTEM</span>
      </div>
      <div className="terminal-body" role="log" aria-live="polite" aria-atomic="false">
        {lines.map((line, i) => (
          <p key={i} className="terminal-line">
            <span className="terminal-prompt" aria-hidden="true">&gt;&nbsp;</span>
            <span>{line}</span>
          </p>
        ))}
        {launchLines.map((line, i) => (
          <p key={`lx${i}`} className={`terminal-line terminal-line--${i === 0 ? 'info' : 'success'}`}>
            <span className="terminal-prompt" aria-hidden="true">&gt;&nbsp;</span>
            <span>{line}</span>
          </p>
        ))}
        <p className="terminal-cursor-line" aria-hidden="true">
          <span className="terminal-prompt">&gt;&nbsp;</span>
          <span className={`terminal-cursor${cursorOn ? ' terminal-cursor--on' : ''}`}>█</span>
        </p>
      </div>
    </div>
  );
}

/* ─── CountdownScreen (main) ─────────────────────────────────────────────────
   Orchestrates all phases of the pre-launch experience:
     'active'   → normal countdown
     'launching'→ cinematic transition (scan line, terminal messages)
     'complete' → launched state (heading swap, CTA)
     'finished' → fade out, then onLaunchComplete fires
   ─────────────────────────────────────────────────────────────────────────── */
export default function CountdownScreen({ onLaunchComplete }) {
  const [timeLeft,  setTimeLeft]  = useState(() => getTimeRemaining());
  const [phase,     setPhase]     = useState(() =>
    getTimeRemaining().isLaunched ? 'complete' : 'active'
  );
  const [showScan, setShowScan] = useState(false);

  const hasTriggered = useRef(false);
  const audioCtxRef  = useRef(null);
  const tickAltRef   = useRef(false);

  /* ── Audio: mechanical tick-tock ── */
  const playTick = useCallback(() => {
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      if (!audioCtxRef.current) audioCtxRef.current = new AC();
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') ctx.resume().catch(() => {});
      if (ctx.state !== 'running') return;

      const osc  = ctx.createOscillator();
      const gain = ctx.createGain();
      const isTick = tickAltRef.current;
      tickAltRef.current = !isTick;
      const freq = isTick ? 1600 : 1100;
      const now  = ctx.currentTime;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.5, now + 0.04);
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.4,  now + 0.003);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.045);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.05);
    } catch (_) { /* audio blocked by browser policy */ }
  }, []);

  /* ── Unlock audio on first user interaction ── */
  useEffect(() => {
    const unlock = () => {
      try {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!audioCtxRef.current && AC) audioCtxRef.current = new AC();
        if (audioCtxRef.current?.state === 'suspended') {
          audioCtxRef.current.resume().catch(() => {});
        }
      } catch (_) {}
    };
    const evts = ['pointerdown', 'touchstart', 'click', 'keydown'];
    evts.forEach(e => window.addEventListener(e, unlock, { passive: true }));
    unlock();
    return () => evts.forEach(e => window.removeEventListener(e, unlock));
  }, []);

  /* ── Live countdown + launch trigger ── */
  useEffect(() => {
    // If page is opened AFTER launch date, skip straight to complete
    if (getTimeRemaining().isLaunched) {
      if (!hasTriggered.current) {
        hasTriggered.current = true;
        setPhase('complete');
      }
      return;
    }

    const id = setInterval(() => {
      const t = getTimeRemaining();
      setTimeLeft(t);
      if (t.isLaunched && !hasTriggered.current) {
        hasTriggered.current = true;
        clearInterval(id);
        runLaunchSequence();
      }
    }, 1000);

    return () => clearInterval(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── Cinematic 6-phase launch sequence ── */
  const runLaunchSequence = () => {
    setPhase('launching');
    // Scan line sweep
    setTimeout(() => setShowScan(true),  2100);
    setTimeout(() => setShowScan(false), 3000);
    // UI switches to launched state
    setTimeout(() => setPhase('complete'), 3400);
    // Start fade-out
    setTimeout(() => setPhase('finished'), 5200);
    // Give CSS transition (1.2s) time to complete before unmounting
    setTimeout(() => onLaunchComplete?.(), 6500);
  };

  /* ── Tick sound on each new second ── */
  useEffect(() => {
    if (phase === 'active') playTick();
  }, [timeLeft.seconds, phase, playTick]);

  const isLaunched  = phase === 'complete' || phase === 'finished';
  const isLaunching = phase === 'launching';

  return (
    <div className={`countdown-screen phase-${phase}`} role="region" aria-label="Pre-launch countdown">

      {/* ── Background layers ── */}
      <div className="countdown-bg" aria-hidden="true">
        <div className="countdown-grid" />
        <div className="countdown-radial-glow" />
        <div className="countdown-circuit-overlay" />
        <ParticleBackground />
      </div>

      {/* ── Cinematic FX ── */}
      {isLaunching && <div className="launch-dim-overlay" aria-hidden="true" />}
      {showScan     && <div className="launch-scan-line"  aria-hidden="true" />}

      {/* ── Corner decoration ── */}
      <img src="/heritage-emblem.png" alt="" aria-hidden="true" className="countdown-corner-art" />

      {/* ════════════════════════════════════════════════════════════════════════
          MAIN CONTENT — scrollable within the fixed screen
          ════════════════════════════════════════════════════════════════════ */}
      <div className="countdown-container">

        {/* ── LOGO with particle ring + breathing glow ── */}
        <div className="countdown-logo-wrapper">
          <div className={`logo-ambient-glow${isLaunched ? ' logo-ambient-glow--intense' : ''}`} />
          <div className="logo-particle-ring" aria-hidden="true">
            <span className="logo-particle lp-0" />
            <span className="logo-particle lp-1" />
            <span className="logo-particle lp-2" />
            <span className="logo-particle lp-3" />
            <span className="logo-particle lp-4" />
            <span className="logo-particle lp-5" />
            <span className="logo-particle lp-6" />
            <span className="logo-particle lp-7" />
          </div>
          <img
            src="/logo.png"
            alt="Official Intelligent Iguanas Logo"
            className={`countdown-logo${isLaunched ? ' countdown-logo--launched' : ''}`}
            width="170"
            height="170"
            loading="eager"
          />
        </div>

        {/* ── BRAND HEADING ── */}
        <div className="countdown-header">
          <h1 className="countdown-brand">
            {isLaunched
              ? (<>WELCOME TO<br /><span>INTELLIGENT IGUANAS</span></>)
              : (<>INTELLIGENT <span>IGUANAS</span></>)
            }
          </h1>

          <h2 className="countdown-tagline-main">
            {isLaunched ? 'THE GATES ARE OPEN' : 'THE GATES ARE OPENING'}
          </h2>

          {isLaunched && (
            <p className="countdown-launched-desc">
              A community built for curious minds, creators, learners,
              and people who want to grow together.
            </p>
          )}

          <p className="countdown-motto">
            LEARN &nbsp;•&nbsp; SHARE &nbsp;•&nbsp; BUILD &nbsp;•&nbsp; GROW
          </p>
        </div>

        {/* ── COUNTDOWN or LAUNCHED HERO CTA ── */}
        {isLaunched ? (
          <div className="launched-cta-block">
            <a
              href={COMMUNITY_URL || '#'}
              {...(COMMUNITY_URL
                ? { target: '_blank', rel: 'noopener noreferrer' }
                : { 'aria-disabled': 'true', tabIndex: -1 }
              )}
              className={`btn-launch-primary${!COMMUNITY_URL ? ' btn--unavailable' : ''}`}
            >
              ENTER THE COMMUNITY
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2.5"
                strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </a>
          </div>
        ) : (
          <>
            {/* LAUNCHING IN label + live status */}
            <div className="countdown-meta">
              <p className="countdown-label-tag">LAUNCHING IN</p>
              <div className="launch-seq-status">
                <span className="launch-seq-dot" aria-hidden="true" />
                LAUNCH SEQUENCE ACTIVE
              </div>
            </div>

            {/* Four countdown cards */}
            <div className="countdown-grid-cards" aria-live="polite" aria-atomic="true">
              <CountdownCard value={timeLeft.days}    label="DAYS"    />
              <div className="countdown-sep" aria-hidden="true"><span /><span /></div>
              <CountdownCard value={timeLeft.hours}   label="HOURS"   />
              <div className="countdown-sep" aria-hidden="true"><span /><span /></div>
              <CountdownCard value={timeLeft.minutes} label="MINUTES" />
              <div className="countdown-sep" aria-hidden="true"><span /><span /></div>
              <CountdownCard value={timeLeft.seconds} label="SECONDS" />
            </div>

            {/* Date badge pill */}
            <div className="countdown-date-badge">
              <span className="date-badge-dot" aria-hidden="true" />
              <span className="launch-date-text">SEPTEMBER 4, 2026</span>
              <span className="date-badge-sep" aria-hidden="true">•</span>
              <span className="launch-time-text">00:00 IST</span>
            </div>
          </>
        )}

        {/* ── SYSTEM STATUS PANEL ── */}
        <StatusPanel isLaunched={isLaunched} />

        {/* ── TERMINAL ── */}
        <Terminal isLaunching={isLaunching} />

        {/* ── WHAT'S BEHIND THE GATE? (pre-launch only) ── */}
        {!isLaunched && (
          <>
            <section className="gate-section" aria-labelledby="gate-heading">
              <p className="gate-label">INTELLIGENCE AWAITS</p>
              <h2 id="gate-heading" className="gate-heading">WHAT'S BEHIND THE GATE?</h2>
              <div className="feature-cards-grid">
                {FEATURE_CARDS.map(c => (
                  <div key={c.num} className="feature-card">
                    <span className="feature-card-num" aria-hidden="true">{c.num}</span>
                    <h3 className="feature-card-title">{c.title}</h3>
                    <p className="feature-card-desc">{c.desc}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* ── FOMO / MYSTERY ── */}
            <section className="fomo-section" aria-label="Launch teaser">
              <p className="fomo-signal">
                SIGNAL DETECTED <span className="fomo-slash">//</span> ACCESS PENDING
              </p>
              <h2 className="fomo-headline">SOMETHING BIGGER IS ABOUT TO BEGIN.</h2>
              <p className="fomo-body">
                The community is almost ready.<br />
                The gates open on <strong>September 4</strong>.
              </p>
            </section>
          </>
        )}

        {/* ── CTA SECTION ── */}
        <section className="cta-section" aria-label="Join the community">
          <div className="cta-buttons">
            <a
              href={COMMUNITY_URL || '#'}
              {...(COMMUNITY_URL
                ? { target: '_blank', rel: 'noopener noreferrer' }
                : { 'aria-disabled': 'true', tabIndex: -1 }
              )}
              className={`cta-primary${!COMMUNITY_URL ? ' cta-btn--disabled' : ''}`}
              title={!COMMUNITY_URL
                ? 'Community link will be activated on launch day'
                : 'Join Intelligent Iguanas'}
            >
              JOIN THE COMMUNITY
            </a>
            <a
              href={SOCIAL_URL || '#'}
              {...(SOCIAL_URL
                ? { target: '_blank', rel: 'noopener noreferrer' }
                : { 'aria-disabled': 'true', tabIndex: -1 }
              )}
              className={`cta-secondary${!SOCIAL_URL ? ' cta-btn--disabled' : ''}`}
              title={!SOCIAL_URL
                ? 'Social link will be activated on launch day'
                : 'Follow the signal'}
            >
              FOLLOW THE SIGNAL
            </a>
          </div>
          {(!COMMUNITY_URL || !SOCIAL_URL) && (
            <p className="cta-links-notice">🔗 Links will be activated on launch day.</p>
          )}
        </section>

        {/* ── PAGE FOOTER ── */}
        <footer className="countdown-footer">
          <img
            src="/logo.png"
            alt="Intelligent Iguanas"
            className="countdown-footer-logo"
            width="36"
            height="36"
          />
          <p className="countdown-footer-brand">INTELLIGENT IGUANAS</p>
          <p className="countdown-footer-tagline">LEARN • SHARE • BUILD • GROW</p>
          <p className="countdown-footer-copy">
            © {new Date().getFullYear()} Intelligent Iguanas. All rights reserved.
          </p>
        </footer>

      </div>{/* /countdown-container */}
    </div>
  );
}
