export default function Footer({ whatsappLink }) {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="footer-inner">
        <img src="/logo.png" alt="Intelligent Iguanas Logo" className="footer-logo" width="40" height="40" />
        <h2 className="footer-title">INTELLIGENT IGUANAS</h2>
        <p className="footer-tagline">LEARN • SHARE • BUILD • GROW</p>
        <p className="footer-text">A WhatsApp community for learning, sharing, and growing together.</p>
        {whatsappLink && (
          <a href={whatsappLink} target="_blank" rel="noopener noreferrer" className="footer-cta">
            Join WhatsApp &rarr;
          </a>
        )}
        <p className="footer-text" style={{ marginTop: '2rem', fontSize: '0.8rem', opacity: 0.6 }}>
          &copy; {currentYear} Intelligent Iguanas. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
