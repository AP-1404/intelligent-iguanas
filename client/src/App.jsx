import { useState, useEffect } from 'react';
import RibbonCeremony from './components/RibbonCeremony';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import About from './components/About';
import JoinSection from './components/JoinSection';
import ContactSection from './components/ContactSection';
import QRCodeSection from './components/QRCode';
import Footer from './components/Footer';
import CountdownScreen from './components/CountdownScreen';
import PrivacyJoinModal from './components/PrivacyJoinModal';
import { isLaunched, DEFAULT_WHATSAPP_LINK } from './utils/launchConfig';
import { Analytics } from '@vercel/analytics/react';

function App() {
  const [whatsappLink, setWhatsappLink] = useState(DEFAULT_WHATSAPP_LINK);
  const [unlocked, setUnlocked] = useState(() => isLaunched());
  const [privacyModalOpen, setPrivacyModalOpen] = useState(false);
  const [showRibbon, setShowRibbon] = useState(
    () => !localStorage.getItem('ii_ribbon_seen')
  );

  useEffect(() => {
    fetch('/api/config')
      .then(res => res.json())
      .then(data => {
        if (data.isLaunched) {
          setUnlocked(true);
        }
        if (data.whatsappGroupLink) {
          setWhatsappLink(data.whatsappGroupLink);
        }
      })
      .catch(() => {
        if (isLaunched()) {
          setUnlocked(true);
        }
      });
  }, []);

  const handleLaunchComplete = () => {
    setUnlocked(true);
    fetch('/api/config')
      .then(res => res.json())
      .then(data => {
        if (data.whatsappGroupLink) {
          setWhatsappLink(data.whatsappGroupLink);
        }
      })
      .catch(() => {});
  };

  // STRICT LAUNCH GUARD: Before official launch time, render ONLY the CountdownScreen component
  if (!unlocked) {
    return (
      <>
        <CountdownScreen onLaunchComplete={handleLaunchComplete} />
        <Analytics />
      </>
    );
  }

  // AFTER LAUNCH: Render the complete Intelligent Iguanas community website
  return (
    <>
      {showRibbon && (
        <RibbonCeremony onComplete={() => setShowRibbon(false)} />
      )}
      <Navbar whatsappLink={whatsappLink} onJoinRequest={() => setPrivacyModalOpen(true)} />
      <main>
        <Hero whatsappLink={whatsappLink} onJoinRequest={() => setPrivacyModalOpen(true)} />
        <About />
        <JoinSection whatsappLink={whatsappLink} onJoinRequest={() => setPrivacyModalOpen(true)} />
        <ContactSection />
        <QRCodeSection whatsappLink={whatsappLink} />
      </main>
      <Footer whatsappLink={whatsappLink} onJoinRequest={() => setPrivacyModalOpen(true)} />
      <PrivacyJoinModal
        isOpen={privacyModalOpen}
        onClose={() => setPrivacyModalOpen(false)}
        whatsappLink={whatsappLink}
      />
      <img src="/heritage-emblem.png" alt="" aria-hidden="true" className="corner-emblem" />
      <Analytics />
    </>
  );
}

export default App;
