import { useState } from 'react';
import useScrollReveal from '../hooks/useScrollReveal';

export default function ContactSection() {
  useScrollReveal();

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    message: '',
  });

  const [status, setStatus] = useState('idle'); // idle | submitting | success | error
  const [errorMessage, setErrorMessage] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('submitting');
    setErrorMessage('');

    try {
      const res = await fetch('https://formspree.io/f/meaqkwzg', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setStatus('success');
        setFormData({ name: '', phone: '', email: '', message: '' });
      } else {
        const data = await res.json().catch(() => ({}));
        setStatus('error');
        setErrorMessage(data.error || 'Failed to send message. Please try again.');
      }
    } catch (_) {
      setStatus('error');
      setErrorMessage('Network error. Please check your connection and try again.');
    }
  };

  return (
    <section id="contact" className="section contact-section" aria-labelledby="contact-heading">
      <div className="section-inner">
        <p className="section-label reveal">GET IN TOUCH</p>
        <h2 id="contact-heading" className="section-heading reveal">
          Send Us a Message
        </h2>
        <p className="section-subheading reveal reveal-delay-1">
          Have a question, feedback, or want to collaborate? Fill out the form below and we’ll get back to you.
        </p>

        <div className="contact-card reveal reveal-delay-2">
          {status === 'success' ? (
            <div className="contact-success">
              <div className="contact-success-icon" aria-hidden="true">✓</div>
              <h3>Message Sent Successfully!</h3>
              <p>Thank you for reaching out. We’ve received your message and will respond shortly.</p>
              <button
                type="button"
                className="btn-primary"
                onClick={() => setStatus('idle')}
                style={{ marginTop: '20px' }}
              >
                Send Another Message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="contact-form">
              {status === 'error' && (
                <div className="contact-error-banner" role="alert">
                  {errorMessage}
                </div>
              )}

              <div className="form-grid">
                {/* Full Name */}
                <div className="form-group">
                  <label htmlFor="contact-name">
                    Full Name <span className="required">*</span>
                  </label>
                  <div className="input-wrap">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="input-icon" aria-hidden="true">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                      <circle cx="12" cy="7" r="4"></circle>
                    </svg>
                    <input
                      type="text"
                      id="contact-name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="e.g. Alex Johnson"
                      required
                      autoComplete="name"
                    />
                  </div>
                </div>

                {/* Phone Number */}
                <div className="form-group">
                  <label htmlFor="contact-phone">
                    Phone Number <span className="required">*</span>
                  </label>
                  <div className="input-wrap">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="input-icon" aria-hidden="true">
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                    </svg>
                    <input
                      type="tel"
                      id="contact-phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="+1 (555) 000-0000"
                      required
                      autoComplete="tel"
                    />
                  </div>
                </div>

                {/* Email ID */}
                <div className="form-group form-group-full">
                  <label htmlFor="contact-email">
                    Email Address <span className="required">*</span>
                  </label>
                  <div className="input-wrap">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="input-icon" aria-hidden="true">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                      <polyline points="22,6 12,13 2,6"></polyline>
                    </svg>
                    <input
                      type="email"
                      id="contact-email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="alex@example.com"
                      required
                      autoComplete="email"
                    />
                  </div>
                </div>

                {/* Message */}
                <div className="form-group form-group-full">
                  <label htmlFor="contact-message">
                    Message <span className="required">*</span>
                  </label>
                  <div className="input-wrap">
                    <textarea
                      id="contact-message"
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      placeholder="Tell us what's on your mind..."
                      rows="4"
                      required
                    ></textarea>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="btn-primary contact-submit-btn"
                disabled={status === 'submitting'}
              >
                {status === 'submitting' ? (
                  <>
                    <span className="submit-spinner" aria-hidden="true"></span>
                    Sending...
                  </>
                ) : (
                  <>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <line x1="22" y1="2" x2="11" y2="13"></line>
                      <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                    </svg>
                    SEND MESSAGE
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
