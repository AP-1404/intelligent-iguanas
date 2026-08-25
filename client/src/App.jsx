import { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import About from './components/About';
import Community from './components/Community';
import JoinSection from './components/JoinSection';
import QRCodeSection from './components/QRCode';
import Footer from './components/Footer';
import CountdownScreen from './components/CountdownScreen';
import { isLaunched } from './utils/launchConfig';

function App() {
  const [whatsappLink, setWhatsappLink] = useState(null);
  const [unlocked, setUnlocked] = useState(() => isLaunched());

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
    return <CountdownScreen onLaunchComplete={handleLaunchComplete} />;
  }

  // AFTER LAUNCH: Render the complete Intelligent Iguanas community website
  return (
    <>
      <Navbar whatsappLink={whatsappLink} />
      <main>
        <Hero whatsappLink={whatsappLink} />
        <About />
        <Community />
        <JoinSection whatsappLink={whatsappLink} />
        <QRCodeSection whatsappLink={whatsappLink} />
      </main>
      <Footer whatsappLink={whatsappLink} />
    </>
  );
}

export default App;
