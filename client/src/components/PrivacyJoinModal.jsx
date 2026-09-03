import { useEffect, useState } from 'react';

const PRIVACY_CARDS = [
  {
    num: '01',
    title: 'Your phone number',
    desc: 'Depending on your WhatsApp settings and group configuration, other participants may be able to see your phone number and certain profile information.',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
      </svg>
    ),
  },
  {
    num: '02',
    title: 'Your profile visibility',
    desc: 'Review who can see your profile photo, About, Status, and other WhatsApp profile information in your privacy settings.',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
        <circle cx="12" cy="12" r="3"></circle>
      </svg>
    ),
  },
  {
    num: '03',
    title: "You're in control",
    desc: 'You can leave the group, block participants, or report a problem through WhatsApp at any time.',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
      </svg>
    ),
  },
];

export default function PrivacyJoinModal({ isOpen, onClose, whatsappLink }) {
  const [isChecked, setIsChecked] = useState(false);
  const [showNotice, setShowNotice] = useState(false);

  useEffect(() => {
    if (!isOpen) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        if (showNotice) {
          setShowNotice(false);
        } else {
          onClose();
        }
      }
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose, showNotice]);

  useEffect(() => {
    if (!isOpen) {
      setIsChecked(false);
      setShowNotice(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const continueToWhatsApp = () => {
    if (!isChecked || !whatsappLink) return;
    window.open(whatsappLink, '_blank', 'noopener,noreferrer');
    onClose();
  };

  return (
    <div className="privacy-modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        className="privacy-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="privacy-modal-title"
        aria-describedby="privacy-modal-description"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <button
          className="privacy-modal-close"
          type="button"
          onClick={onClose}
          aria-label="Close privacy modal"
        >
          ×
        </button>

        {/* 1. Header & Logo */}
        <div className="privacy-modal-header">
          <div className="privacy-modal-logo-wrap">
            <img src="/logo.png" alt="Intelligent Iguanas Logo" className="privacy-modal-logo" />
          </div>
          <div>
            <p className="privacy-modal-eyebrow">BEFORE YOU JOIN</p>
            <h2 id="privacy-modal-title" className="privacy-modal-heading">
              Before you join the Iguanas 🦎
            </h2>
          </div>
        </div>

        <div id="privacy-modal-description" className="privacy-modal-intro">
          <p>A quick privacy check before you enter our WhatsApp community.</p>
          <p className="privacy-intro-sub">
            WhatsApp controls your privacy settings, so take a moment to review what other participants may be able to see.
          </p>
        </div>

        {/* 2. Progress Indicator */}
        <div className="privacy-progress" aria-label="Step 2 of 3: Privacy check">
          <span className="privacy-step">01 Website</span>
          <span className="privacy-step-arrow">→</span>
          <span className="privacy-step active">02 Privacy</span>
          <span className="privacy-step-arrow">→</span>
          <span className="privacy-step">03 WhatsApp</span>
        </div>

        {/* 3. Privacy Information Cards */}
        <div className="privacy-info-cards">
          {PRIVACY_CARDS.map((card, idx) => (
            <div className="privacy-info-card" key={card.num} style={{ animationDelay: `${(idx + 1) * 0.08}s` }}>
              <div className="privacy-card-header">
                <span className="privacy-card-icon">{card.icon}</span>
                <span className="privacy-card-num">{card.num}</span>
              </div>
              <h3 className="privacy-card-title">{card.title}</h3>
              <p className="privacy-card-desc">{card.desc}</p>
            </div>
          ))}
        </div>

        {/* 4. Single Confirmation Checkbox */}
        <div className="privacy-confirm-block">
          <label htmlFor="privacy-confirm-input" className={`privacy-confirm-checkbox ${isChecked ? 'is-checked' : ''}`}>
            <input
              type="checkbox"
              id="privacy-confirm-input"
              checked={isChecked}
              onChange={(e) => setIsChecked(e.target.checked)}
            />
            <span className="privacy-check-box" aria-hidden="true">
              {isChecked ? '✓' : ''}
            </span>
            <span className="privacy-confirm-text">
              I understand these WhatsApp privacy considerations and have reviewed my settings.
            </span>
          </label>
        </div>

        {/* 5. Privacy Notice Link */}
        <div className="privacy-notice-link-wrap">
          <button
            type="button"
            className="privacy-notice-btn"
            onClick={() => setShowNotice(true)}
          >
            Need more information? <span className="underline">View our Privacy Notice</span>
          </button>
        </div>

        {/* 6. Buttons */}
        <div className="privacy-modal-actions">
          <button className="privacy-cancel" type="button" onClick={onClose}>
            ← Go Back
          </button>
          <button
            className={`privacy-continue ${isChecked && whatsappLink ? 'is-active' : ''}`}
            type="button"
            onClick={continueToWhatsApp}
            disabled={!isChecked || !whatsappLink}
          >
            Continue to WhatsApp →
          </button>
        </div>
      </section>

      {/* Embedded Privacy Notice Modal */}
      {showNotice && (
        <div className="privacy-notice-overlay" onMouseDown={(e) => e.stopPropagation()}>
          <div className="privacy-notice-card">
            <button
              className="privacy-modal-close"
              type="button"
              onClick={() => setShowNotice(false)}
              aria-label="Close Privacy Notice"
            >
              ×
            </button>
            <span className="privacy-modal-eyebrow">PRIVACY NOTICE</span>
            <h3>Intelligent Iguanas Privacy Notice</h3>
            <div className="privacy-notice-body">
              <p>
                Intelligent Iguanas values your privacy. We do not collect or store your personal WhatsApp credentials or private phone contacts.
              </p>
              <p>
                When you click "Continue to WhatsApp", you leave our website and enter the official WhatsApp application. WhatsApp operations and privacy controls are governed by WhatsApp’s Terms of Service and Privacy Policy.
              </p>
              <p>
                You retain full control over your WhatsApp profile visibility, contacts list, and group participation settings at all times inside your WhatsApp app settings.
              </p>
            </div>
            <button
              type="button"
              className="btn-primary"
              onClick={() => setShowNotice(false)}
              style={{ marginTop: '20px', width: '100%', justifyContent: 'center' }}
            >
              Got it, close notice
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
