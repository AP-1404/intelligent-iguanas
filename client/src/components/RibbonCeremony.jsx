import { useState, useEffect, useRef, useCallback } from 'react';

/* ─────────────────────────────────────────────
   CONSTANTS
───────────────────────────────────────────── */
const STORAGE_KEY   = 'ii_ribbon_seen';
const CUT_THRESHOLD = 0.08;          // ~50px swipe = instant cut
const WELCOME_DELAY = 750;           // ms after cut → welcome phase
const EXIT_DELAY    = 3000;          // ms after cut → exit / reveal site

const CONFETTI_COLORS = [
  '#39FF14', '#b5ec53', '#d4f77a',
  '#FFD700', '#FFA500', '#FF6B35',
  '#ffffff', '#FF6B6B', '#a29bfe',
];

/* Static ambient particle positions */
const PARTICLES = Array.from({ length: 28 }, (_, i) => ({
  x:   `${((i * 37) % 97) + 1}%`,
  y:   `${((i * 53) % 85) + 5}%`,
  del: `${(i * 0.37) % 5}s`,
  dur: `${3.5 + (i % 4) * 0.8}s`,
  sz:  `${3 + (i % 3)}px`,
}));

/* ─────────────────────────────────────────────
   CONFETTI FACTORY
───────────────────────────────────────────── */
function makeConfetti(cx, cy, count = 140) {
  return Array.from({ length: count }, (_, i) => {
    const angle = Math.random() * Math.PI * 2;
    const speed = 5 + Math.random() * 16;
    return {
      id:    i,
      x:     cx,  y: cy,
      vx:    Math.cos(angle) * speed,
      vy:    Math.sin(angle) * speed - 7,
      rot:   Math.random() * 360,
      rotV:  (Math.random() - 0.5) * 16,
      w:     Math.random() * 14 + 6,
      h:     Math.random() * 7  + 3,
      color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
      round: Math.random() > 0.45,
      life:  1,
      decay: 0.009 + Math.random() * 0.007,
      grav:  0.22  + Math.random() * 0.28,
    };
  });
}

/* ─────────────────────────────────────────────
   SOUND  (Web Audio — no files needed)
───────────────────────────────────────────── */
function playSnip() {
  try {
    const ac = new (window.AudioContext || window.webkitAudioContext)();

    /* Scissors snip */
    const o = ac.createOscillator();
    const g = ac.createGain();
    o.type = 'sawtooth';
    o.frequency.setValueAtTime(1100, ac.currentTime);
    o.frequency.exponentialRampToValueAtTime(160, ac.currentTime + 0.13);
    g.gain.setValueAtTime(0.30, ac.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.15);
    o.connect(g); g.connect(ac.destination);
    o.start(ac.currentTime); o.stop(ac.currentTime + 0.15);

    /* Tearing noise burst */
    const sz  = Math.floor(ac.sampleRate * 0.30);
    const buf = ac.createBuffer(1, sz, ac.sampleRate);
    const ch  = buf.getChannelData(0);
    for (let i = 0; i < sz; i++) ch[i] = (Math.random() * 2 - 1) * (1 - i / sz) * 0.5;

    const ns  = ac.createBufferSource(); ns.buffer = buf;
    const flt = ac.createBiquadFilter(); flt.type = 'bandpass'; flt.frequency.value = 2600; flt.Q.value = 0.7;
    const tg  = ac.createGain();
    tg.gain.setValueAtTime(0.20, ac.currentTime + 0.10);
    tg.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.36);
    ns.connect(flt); flt.connect(tg); tg.connect(ac.destination);
    ns.start(ac.currentTime + 0.10);

    /* Celebration mini-chime */
    [0, 200, 380].forEach((ms, idx) => {
      const ch2 = ac.createOscillator();
      const cg  = ac.createGain();
      const t   = ac.currentTime + 0.18 + ms / 1000;
      const freqs = [523, 659, 784];
      ch2.type = 'sine';
      ch2.frequency.setValueAtTime(freqs[idx], t);
      cg.gain.setValueAtTime(0.10, t);
      cg.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
      ch2.connect(cg); cg.connect(ac.destination);
      ch2.start(t); ch2.stop(t + 0.25);
    });
  } catch (_) { /* audio blocked — silently skip */ }
}

/* ─────────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────────── */
export default function RibbonCeremony({ onComplete }) {
  const [visible, setVisible]   = useState(false);
  const [phase,   setPhase]     = useState('idle');
  // idle → intro → cutting → cut → welcome → exit
  const [progress, setProgress] = useState(0);       // 0–1 drag progress
  const [cutPt,    setCutPt]    = useState(null);    // { x, y } cut coordinates
  const [cursor,   setCursor]   = useState({ x: -300, y: -300 });
  const [isTouch,  setIsTouch]  = useState(false);

  const isDragging  = useRef(false);
  const startXRef   = useRef(0);
  const ribbonRef   = useRef(null);
  const canvasRef   = useRef(null);
  const rafRef      = useRef(null);
  const particles   = useRef([]);
  const phaseRef    = useRef('idle');  // sync ref for callbacks

  /* Keep phaseRef in sync */
  useEffect(() => { phaseRef.current = phase; }, [phase]);

  /* ── First-visit check ── */
  useEffect(() => {
    if (localStorage.getItem(STORAGE_KEY)) {
      onComplete();
      return;
    }
    setIsTouch('ontouchstart' in window || navigator.maxTouchPoints > 0);
    setVisible(true);
    /* Slight delay so CSS transitions have a starting state */
    const t = setTimeout(() => setPhase('intro'), 80);
    return () => clearTimeout(t);
  }, []); // eslint-disable-line

  /* ── Canvas resize ── */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const resize = () => {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);
    return () => {
      window.removeEventListener('resize', resize);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  /* ── Skip ── */
  const skip = useCallback((e) => {
    e.stopPropagation();
    localStorage.setItem(STORAGE_KEY, '1');
    setPhase('exit');
    setTimeout(onComplete, 500);
  }, [onComplete]);

  /* ── Trigger cut ── */
  const triggerCut = useCallback((cx) => {
    const el = ribbonRef.current;
    const ry = el
      ? el.getBoundingClientRect().top + el.offsetHeight / 2
      : window.innerHeight / 2;

    localStorage.setItem(STORAGE_KEY, '1');
    playSnip();
    setCutPt({ x: cx, y: ry });
    setProgress(1);
    setPhase('cut');

    /* Confetti physics loop */
    const canvas = canvasRef.current;
    if (canvas) {
      particles.current = makeConfetti(cx, ry);
      const draw = () => {
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        particles.current = particles.current
          .map(p => ({
            ...p,
            x:    p.x  + p.vx,
            y:    p.y  + p.vy,
            vy:   p.vy + p.grav,
            vx:   p.vx * 0.985,
            rot:  p.rot + p.rotV,
            life: p.life - p.decay,
          }))
          .filter(p => p.life > 0);

        particles.current.forEach(p => {
          ctx.save();
          ctx.globalAlpha = Math.min(1, p.life * 1.6);
          ctx.translate(p.x, p.y);
          ctx.rotate((p.rot * Math.PI) / 180);
          ctx.fillStyle = p.color;
          if (p.round) {
            ctx.beginPath();
            ctx.arc(0, 0, p.w / 3.2, 0, Math.PI * 2);
            ctx.fill();
          } else {
            ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
          }
          ctx.restore();
        });

        if (particles.current.length > 0) {
          rafRef.current = requestAnimationFrame(draw);
        }
      };
      rafRef.current = requestAnimationFrame(draw);
    }

    setTimeout(() => setPhase('welcome'), WELCOME_DELAY);
    setTimeout(() => {
      setPhase('exit');
      setTimeout(onComplete, 650);
    }, EXIT_DELAY);
  }, [onComplete]);

  /* ── Drag / touch handlers ── */
  const onDown = useCallback((cx) => {
    const p = phaseRef.current;
    if (p !== 'intro' && p !== 'cutting') return;
    isDragging.current = true;
    startXRef.current  = cx;
    setPhase('cutting');
  }, []);

  const onMove = useCallback((cx, cy) => {
    setCursor({ x: cx, y: cy });
    if (!isDragging.current) return;
    const prog = Math.max(0, Math.min(1,
      (cx - startXRef.current) / (window.innerWidth * 0.15)
    ));
    setProgress(prog);
    if (prog >= CUT_THRESHOLD) {
      isDragging.current = false;
      triggerCut(cx);
    }
  }, [triggerCut]);

  const onUp = useCallback(() => {
    if (!isDragging.current) return;
    isDragging.current = false;
    setProgress(0);
    if (phaseRef.current === 'cutting') setPhase('intro');
  }, []);

  /* ── Render guard ── */
  if (!visible) return null;

  const isExiting  = phase === 'exit';
  const isCutting  = phase === 'cutting';
  const isCut      = phase === 'cut' || phase === 'welcome';
  const isWelcome  = phase === 'welcome';
  const showRibbon = phase === 'intro' || phase === 'cutting';

  return (
    <>
      <style>{STYLES}</style>

      <div
        className={`rc ${isExiting ? 'rc--exit' : ''}`}
        onMouseDown={e  => onDown(e.clientX)}
        onMouseMove={e  => onMove(e.clientX, e.clientY)}
        onMouseUp={onUp}
        onMouseLeave={onUp}
        onTouchStart={e  => { onDown(e.touches[0].clientX); }}
        onTouchMove={e   => { e.preventDefault(); onMove(e.touches[0].clientX, e.touches[0].clientY); }}
        onTouchEnd={onUp}
        style={{ cursor: isCutting ? 'none' : 'default' }}
        role="dialog"
        aria-label="Ribbon cutting ceremony"
        aria-modal="true"
      >
        {/* ── Ambient particles ── */}
        <div className="rc-particles" aria-hidden="true">
          {PARTICLES.map((p, i) => (
            <div key={i} className="rc-dot"
              style={{ left: p.x, top: p.y, width: p.sz, height: p.sz,
                       animationDelay: p.del, animationDuration: p.dur }} />
          ))}
        </div>

        {/* ── Background brand glow orbs ── */}
        <div className="rc-orb rc-orb-1" aria-hidden="true" />
        <div className="rc-orb rc-orb-2" aria-hidden="true" />
        <img src="/heritage-emblem.png" alt="" aria-hidden="true" className="corner-emblem" />

        {/* ── Skip button ── */}
        {!isCut && !isExiting && (
          <button className="rc-skip" onClick={skip} aria-label="Skip ceremony">
            SKIP ›
          </button>
        )}

        {/* ── Confetti canvas ── */}
        <canvas ref={canvasRef} className="rc-canvas" aria-hidden="true" />

        {/* ── Logo ── */}
        {!isWelcome && (
          <div className={`rc-logo-wrap ${phase !== 'idle' ? 'rc-logo-wrap--in' : ''}`}>
            <div className="rc-logo-ring" aria-hidden="true" />
            <img src="/logo.png" alt="Intelligent Iguanas" className="rc-logo" draggable="false" />
          </div>
        )}

        {/* ── Pre-cut headline ── */}
        {!isWelcome && (
          <div className={`rc-copy ${phase !== 'idle' ? 'rc-copy--in' : ''} ${isCut ? 'rc-copy--out' : ''}`}>
            <p className="rc-eyebrow">INTELLIGENT IGUANAS</p>
            <h1 className="rc-headline">
              THE FUTURE<br />IS READY.
            </h1>
            <p className="rc-sub">You're among the first to enter.</p>
          </div>
        )}

        {/* ── Ribbon band ── */}
        {showRibbon && (
          <div className={`rc-ribbon-wrap ${phase !== 'idle' ? 'rc-ribbon-wrap--in' : ''}`}>
            {/* Gold shimmer lines above/below */}
            <div className="rc-ribbon-edge rc-ribbon-edge--top"    aria-hidden="true" />
            <div className="rc-ribbon-edge rc-ribbon-edge--bottom" aria-hidden="true" />

            <div ref={ribbonRef} className={`rc-ribbon ${isCutting ? 'rc-ribbon--cutting' : ''}`}>
              {/* Cut progress overlay */}
              {isCutting && (
                <div className="rc-cut-progress" style={{ width: `${progress * 100}%` }} aria-hidden="true">
                  <div className="rc-cut-edge" />
                </div>
              )}

              <span className="rc-ribbon-text">
                ✦ &nbsp; CUT TO ENTER &nbsp; ✦
              </span>
            </div>
          </div>
        )}

        {/* ── Fallen ribbon halves (post-cut) ── */}
        {isCut && cutPt && (
          <div className="rc-halves" aria-hidden="true">
            <div className="rc-half rc-half--left"
              style={{ width: cutPt.x, top: cutPt.y - 34 }} />
            <div className="rc-half rc-half--right"
              style={{ left: cutPt.x, top: cutPt.y - 34 }} />
          </div>
        )}

        {/* ── Cut flash ── */}
        {isCut && <div className="rc-flash" aria-hidden="true" />}

        {/* ── Scissors cursor ── */}
        {isCutting && (
          <div className="rc-scissors" style={{ left: cursor.x - 20, top: cursor.y - 26 }} aria-hidden="true">
            <svg viewBox="0 0 60 60" width="52" height="52">
              {/* Blade 1 */}
              <line x1="26" y1="22" x2="58" y2="8"  stroke="#FFD700" strokeWidth="3" strokeLinecap="round" />
              {/* Blade 2 */}
              <line x1="26" y1="38" x2="58" y2="52" stroke="#FFD700" strokeWidth="3" strokeLinecap="round" />
              {/* Ring 1 */}
              <circle cx="15" cy="15" r="10" fill="rgba(255,215,0,0.15)" stroke="#FFD700" strokeWidth="2.5" />
              {/* Ring 2 */}
              <circle cx="15" cy="45" r="10" fill="rgba(255,215,0,0.15)" stroke="#FFD700" strokeWidth="2.5" />
              {/* Pivot */}
              <circle cx="24" cy="30" r="3.5" fill="#FFD700" />
              {/* Center crosses */}
              <circle cx="15" cy="15" r="4" fill="#FFD700" />
              <circle cx="15" cy="45" r="4" fill="#FFD700" />
            </svg>
          </div>
        )}

        {/* ── Instruction ── */}
        {(phase === 'intro' || phase === 'cutting') && (
          <div className={`rc-instruction ${isCutting ? 'rc-instruction--active' : ''}`}>
            <p className="rc-instr-text">
              {isTouch ? 'SWIPE TO CUT THE RIBBON' : 'DRAG TO CUT THE RIBBON'}
            </p>
            <div className="rc-arrows" aria-hidden="true">
              <span className="rc-arr rc-arr-1">›</span>
              <span className="rc-arr rc-arr-2">›</span>
              <span className="rc-arr rc-arr-3">›</span>
            </div>
          </div>
        )}

        {/* ── Welcome message ── */}
        {isWelcome && (
          <div className="rc-welcome">
            <div className="rc-welcome-emoji" aria-hidden="true">🎉</div>
            <h2 className="rc-welcome-title">
              WELCOME TO<br />INTELLIGENT IGUANAS
            </h2>
            <p className="rc-welcome-sub">
              Let's build something intelligent together.
            </p>
          </div>
        )}
      </div>
    </>
  );
}

/* ─────────────────────────────────────────────
   ALL STYLES  (self-contained, no class leakage)
───────────────────────────────────────────── */
const STYLES = `
/* ── Overlay ──────────────────────────────── */
.rc {
  position: fixed;
  inset: 0;
  z-index: 999998;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  background:
    radial-gradient(ellipse 90% 70% at 50% 40%, #0c1a0a 0%, #06080a 70%);
  user-select: none;
  -webkit-user-select: none;
  touch-action: none;
  transition: opacity 0.65s cubic-bezier(0.4,0,0.2,1),
              transform 0.65s cubic-bezier(0.4,0,0.2,1);
}

.rc--exit {
  opacity: 0;
  transform: scale(1.04);
  pointer-events: none;
}

/* ── Ambient glow orbs ───────────────────── */
.rc-orb {
  position: absolute;
  border-radius: 50%;
  pointer-events: none;
}

.rc-orb-1 {
  width: clamp(300px,50vw,700px);
  height: clamp(300px,50vw,700px);
  top: -20%;
  left: -15%;
  background: radial-gradient(circle, rgba(57,255,20,0.09) 0%, transparent 70%);
  filter: blur(60px);
  animation: rcOrb1 16s ease-in-out infinite alternate;
}

.rc-orb-2 {
  width: clamp(250px,40vw,550px);
  height: clamp(250px,40vw,550px);
  bottom: -15%;
  right: -10%;
  background: radial-gradient(circle, rgba(181,236,83,0.07) 0%, transparent 70%);
  filter: blur(55px);
  animation: rcOrb2 20s ease-in-out infinite alternate;
}

@keyframes rcOrb1 {
  0%   { transform: translate(0,0) scale(1); }
  100% { transform: translate(40px,60px) scale(1.15); }
}
@keyframes rcOrb2 {
  0%   { transform: translate(0,0) scale(1); }
  100% { transform: translate(-30px,-50px) scale(0.88); }
}

/* ── Ambient dots ─────────────────────────── */
.rc-particles { position: absolute; inset: 0; pointer-events: none; }

.rc-dot {
  position: absolute;
  border-radius: 50%;
  background: rgba(181,236,83,0.55);
  box-shadow: 0 0 6px rgba(57,255,20,0.6);
  animation: rcDotPulse linear infinite alternate;
}

@keyframes rcDotPulse {
  0%   { opacity: 0.08; transform: scale(0.6); }
  100% { opacity: 0.55; transform: scale(1.3); }
}

/* ── Canvas ───────────────────────────────── */
.rc-canvas {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 20;
}

/* ── Skip ─────────────────────────────────── */
.rc-skip {
  position: absolute;
  top: 20px;
  right: 24px;
  z-index: 30;
  background: rgba(255,255,255,0.06);
  border: 1px solid rgba(255,255,255,0.14);
  color: rgba(255,255,255,0.45);
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.7rem;
  letter-spacing: 0.12em;
  padding: 8px 14px;
  border-radius: 999px;
  cursor: pointer;
  transition: color 0.2s ease, background 0.2s ease, border-color 0.2s ease;
  backdrop-filter: blur(8px);
}

.rc-skip:hover {
  color: rgba(255,255,255,0.9);
  background: rgba(255,255,255,0.10);
  border-color: rgba(255,255,255,0.28);
}

/* ── Logo ─────────────────────────────────── */
.rc-logo-wrap {
  position: relative;
  z-index: 5;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 28px;
  opacity: 0;
  transform: translateY(-20px) scale(0.88);
  transition: opacity 0.7s cubic-bezier(0.34,1.56,0.64,1),
              transform 0.7s cubic-bezier(0.34,1.56,0.64,1),
              margin 0.6s ease;
}

.rc-logo-wrap--in {
  opacity: 1;
  transform: translateY(0) scale(1);
}

.rc-logo-wrap--small {
  margin-bottom: 0;
  transform: scale(0.72);
}

.rc-logo-ring {
  position: absolute;
  width: calc(clamp(80px,14vw,130px) + 30px);
  height: calc(clamp(80px,14vw,130px) + 30px);
  border-radius: 50%;
  border: 1px solid rgba(181,236,83,0.22);
  animation: rcRingSpin 18s linear infinite;
}

.rc-logo-ring::before {
  content: '';
  position: absolute;
  top: -4px; left: 30%;
  width: 8px; height: 8px;
  border-radius: 50%;
  background: #b5ec53;
  box-shadow: 0 0 12px #b5ec53;
}

@keyframes rcRingSpin {
  from { transform: rotate(0deg); }
  to   { transform: rotate(360deg); }
}

.rc-logo {
  width: clamp(80px,14vw,130px);
  height: clamp(80px,14vw,130px);
  border-radius: 50%;
  object-fit: cover;
  position: relative;
  z-index: 1;
  filter: drop-shadow(0 0 28px rgba(57,255,20,0.45));
  animation: rcLogoFloat 7s ease-in-out infinite;
  -webkit-user-drag: none;
}

@keyframes rcLogoFloat {
  0%,100% { transform: translateY(0); }
  50%     { transform: translateY(-10px); }
}

/* ── Pre-cut copy ─────────────────────────── */
.rc-copy {
  position: relative;
  z-index: 5;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  margin-bottom: 32px;
  opacity: 0;
  transform: translateY(16px);
  transition: opacity 0.6s ease 0.15s, transform 0.6s ease 0.15s;
}

.rc-copy--in  { opacity: 1; transform: translateY(0); }
.rc-copy--out { opacity: 0; transform: translateY(-12px) scale(0.97); pointer-events: none; }

.rc-eyebrow {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.7rem;
  letter-spacing: 0.3em;
  color: #b5ec53;
  opacity: 0.75;
  font-weight: 500;
}

.rc-headline {
  font-family: 'Outfit', 'Space Grotesk', sans-serif;
  font-size: clamp(2.8rem, 8vw, 6.5rem);
  font-weight: 900;
  color: #fff;
  letter-spacing: -0.055em;
  line-height: 0.96;
  text-shadow: 0 2px 40px rgba(57,255,20,0.12);
}

.rc-sub {
  font-family: 'Inter', sans-serif;
  font-size: clamp(0.85rem,1.8vw,1.05rem);
  color: rgba(168,178,165,0.85);
  font-weight: 300;
  letter-spacing: 0.04em;
}

/* ── Ribbon band ──────────────────────────── */
.rc-ribbon-wrap {
  position: relative;
  z-index: 6;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  opacity: 0;
  transform: scaleX(0.4);
  transition: opacity 0.55s cubic-bezier(0.34,1.56,0.64,1) 0.32s,
              transform 0.55s cubic-bezier(0.34,1.56,0.64,1) 0.32s;
}

.rc-ribbon-wrap--in {
  opacity: 1;
  transform: scaleX(1);
}

.rc-ribbon-edge {
  width: 100%;
  height: 2px;
}

.rc-ribbon-edge--top {
  background: linear-gradient(90deg, transparent, rgba(255,215,0,0.7), rgba(255,255,255,0.9), rgba(255,215,0,0.7), transparent);
  box-shadow: 0 0 10px rgba(255,215,0,0.5);
}

.rc-ribbon-edge--bottom {
  background: linear-gradient(90deg, transparent, rgba(180,0,0,0.6), rgba(255,215,0,0.4), rgba(180,0,0,0.6), transparent);
}

.rc-ribbon {
  position: relative;
  width: 100%;
  height: 68px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  background:
    linear-gradient(180deg,
      rgba(255,255,255,0.22) 0%,
      rgba(255,255,255,0.06) 30%,
      rgba(0,0,0,0.08) 70%,
      rgba(0,0,0,0.18) 100%
    ),
    linear-gradient(135deg,
      #6b0000 0%,
      #cc0000 18%,
      #e80000 28%,
      #ff2200 36%,
      #FFD700 50%,
      #ff8c00 62%,
      #e00000 76%,
      #aa0000 90%,
      #6b0000 100%
    );
  background-size: 200% 100%, 200% 100%;
  animation: rcRibbonShimmer 4s linear infinite;
  cursor: grab;
  box-shadow:
    0 -4px 18px rgba(0,0,0,0.5),
    0  4px 18px rgba(0,0,0,0.5),
    inset 0 2px 0 rgba(255,255,255,0.25),
    inset 0 -2px 0 rgba(0,0,0,0.3);
  transition: transform 0.2s ease;
}

.rc-ribbon--cutting {
  cursor: none;
  transform: scaleY(1.05);
}

@keyframes rcRibbonShimmer {
  0%   { background-position: 0% 50%, 0% 50%; }
  100% { background-position: 200% 50%, 200% 50%; }
}

.rc-ribbon-text {
  font-family: 'Outfit', 'Space Grotesk', sans-serif;
  font-size: clamp(0.85rem, 2vw, 1.15rem);
  font-weight: 800;
  letter-spacing: 0.32em;
  color: #fff;
  text-shadow:
    0 1px 3px rgba(0,0,0,0.6),
    0 0 16px rgba(255,215,0,0.5);
  user-select: none;
  position: relative;
  z-index: 2;
  white-space: nowrap;
}

/* ── Cut progress ─────────────────────────── */
.rc-cut-progress {
  position: absolute;
  top: 0; left: 0; bottom: 0;
  background: rgba(0,0,0,0.65);
  backdrop-filter: blur(2px);
  transition: width 0.04s linear;
  z-index: 3;
}

.rc-cut-edge {
  position: absolute;
  top: -4px; bottom: -4px;
  right: -1px;
  width: 3px;
  background: linear-gradient(180deg, transparent, #FFD700 30%, #fff 50%, #FFD700 70%, transparent);
  box-shadow: 0 0 8px rgba(255,215,0,0.9), 0 0 20px rgba(255,215,0,0.5);
  animation: rcEdgePulse 0.1s ease infinite alternate;
}

@keyframes rcEdgePulse {
  from { box-shadow: 0 0 8px rgba(255,215,0,0.9); }
  to   { box-shadow: 0 0 18px rgba(255,215,0,1.0), 0 0 32px rgba(255,255,255,0.4); }
}

/* ── Ribbon halves (post-cut) ─────────────── */
.rc-halves { position: fixed; inset: 0; pointer-events: none; z-index: 7; }

.rc-half {
  position: absolute;
  height: 68px;
  background:
    linear-gradient(180deg,
      rgba(255,255,255,0.18) 0%,
      rgba(255,255,255,0.04) 40%,
      rgba(0,0,0,0.10) 100%
    ),
    linear-gradient(135deg,
      #6b0000 0%, #cc0000 20%, #FFD700 50%, #e00000 80%, #6b0000 100%
    );
  box-shadow: 0 0 18px rgba(0,0,0,0.5);
}

.rc-half--left {
  left: 0;
  transform-origin: right center;
  animation: rcHalfFallLeft 1.1s cubic-bezier(0.4,0,0.2,1) forwards;
}

.rc-half--right {
  right: 0;
  transform-origin: left center;
  animation: rcHalfFallRight 1.1s cubic-bezier(0.4,0,0.2,1) forwards;
}

@keyframes rcHalfFallLeft {
  0%   { transform: rotate(0deg)   translateY(0)     scaleY(1); opacity: 1; }
  30%  { transform: rotate(-8deg)  translateY(20px)  scaleY(1.08); }
  100% { transform: rotate(-55deg) translateY(140vh) scaleY(0.5); opacity: 0; }
}

@keyframes rcHalfFallRight {
  0%   { transform: rotate(0deg)  translateY(0)     scaleY(1); opacity: 1; }
  30%  { transform: rotate(8deg)  translateY(20px)  scaleY(1.08); }
  100% { transform: rotate(55deg) translateY(140vh) scaleY(0.5); opacity: 0; }
}

/* ── Cut flash ────────────────────────────── */
.rc-flash {
  position: fixed;
  inset: 0;
  background: rgba(255,255,255,0.18);
  pointer-events: none;
  z-index: 8;
  animation: rcFlash 0.5s ease-out forwards;
}

@keyframes rcFlash {
  0%   { opacity: 1; }
  100% { opacity: 0; }
}

/* ── Scissors cursor ──────────────────────── */
.rc-scissors {
  position: fixed;
  z-index: 25;
  pointer-events: none;
  filter: drop-shadow(0 0 6px rgba(255,215,0,0.7));
  transition: left 0.04s linear, top 0.04s linear;
  animation: rcScissorsSnip 0.15s ease-in-out infinite alternate;
}

@keyframes rcScissorsSnip {
  from { transform: rotate(-4deg) scale(1.0); }
  to   { transform: rotate(4deg)  scale(1.06); }
}

/* ── Instruction ──────────────────────────── */
.rc-instruction {
  position: relative;
  z-index: 5;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  margin-top: 24px;
  opacity: 0;
  transform: translateY(10px);
  transition: opacity 0.5s ease 0.5s, transform 0.5s ease 0.5s;
}

/* Instruction is visible whenever ribbon-wrap--in is set */
.rc-ribbon-wrap--in ~ .rc-instruction,
.rc-instruction {
  opacity: 1;
  transform: translateY(0);
}

.rc-instr-text {
  font-family: 'JetBrains Mono', monospace;
  font-size: clamp(0.7rem, 1.6vw, 0.88rem);
  letter-spacing: 0.18em;
  color: rgba(181,236,83,0.8);
  font-weight: 500;
}

.rc-instruction--active .rc-instr-text {
  color: #b5ec53;
  text-shadow: 0 0 12px rgba(181,236,83,0.5);
}

.rc-arrows {
  display: flex;
  gap: 6px;
  align-items: center;
}

.rc-arr {
  font-size: 1.4rem;
  color: rgba(181,236,83,0.5);
  animation: rcArrPulse 1.2s ease-in-out infinite;
}
.rc-arr-1 { animation-delay: 0s; }
.rc-arr-2 { animation-delay: 0.2s; }
.rc-arr-3 { animation-delay: 0.4s; }

@keyframes rcArrPulse {
  0%,100% { opacity: 0.3; transform: translateX(0); }
  50%     { opacity: 1;   transform: translateX(5px); }
}

.rc-instruction--active .rc-arr {
  color: #FFD700;
  animation-duration: 0.5s;
}

/* ── Welcome message ──────────────────────── */
.rc-welcome {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 18px;
  z-index: 10;
  animation: rcWelcomeIn 0.6s cubic-bezier(0.34,1.56,0.64,1) forwards;
  text-align: center;
  padding: 24px;
}

@keyframes rcWelcomeIn {
  from { opacity: 0; transform: scale(0.88) translateY(20px); }
  to   { opacity: 1; transform: scale(1)    translateY(0); }
}

.rc-welcome-emoji {
  font-size: clamp(3rem, 8vw, 5rem);
  animation: rcEmojiPop 0.5s cubic-bezier(0.34,1.56,0.64,1) forwards;
  filter: drop-shadow(0 0 20px rgba(255,215,0,0.5));
}

@keyframes rcEmojiPop {
  from { transform: scale(0); }
  to   { transform: scale(1); }
}

.rc-welcome-title {
  font-family: 'Outfit', 'Space Grotesk', sans-serif;
  font-size: clamp(2.2rem, 7vw, 5.5rem);
  font-weight: 900;
  color: #fff;
  letter-spacing: -0.05em;
  line-height: 0.96;
  background: linear-gradient(135deg, #fff 30%, #b5ec53 70%, #FFD700 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  text-shadow: none;
}

.rc-welcome-sub {
  font-family: 'Inter', sans-serif;
  font-size: clamp(0.9rem, 2vw, 1.1rem);
  color: rgba(168,178,165,0.9);
  font-weight: 300;
  letter-spacing: 0.04em;
}

/* ── Mobile fine-tuning ───────────────────── */
@media (max-width: 600px) {
  .rc-ribbon { height: 58px; }
  .rc-headline { letter-spacing: -0.04em; }
  .rc-logo-wrap { margin-bottom: 20px; }
  .rc-copy { margin-bottom: 24px; gap: 8px; }
  .rc-instruction { margin-top: 18px; }
}

@media (max-width: 380px) {
  .rc-ribbon-text { font-size: 0.72rem; letter-spacing: 0.22em; }
}
`;
