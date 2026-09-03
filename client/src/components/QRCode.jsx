import { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import useScrollReveal from '../hooks/useScrollReveal';

export default function QRCodeSection({ whatsappLink }) {
  useScrollReveal();
  const canvasRef = useRef(null);
  const [error, setError] = useState(false);

  const effectiveLink = whatsappLink || 'https://chat.whatsapp.com/IntelligentIguanas';

  useEffect(() => {
    if (!effectiveLink || !canvasRef.current) return;
    
    QRCode.toCanvas(canvasRef.current, effectiveLink, {
      width: 200,
      margin: 2,
      color: {
        dark: '#39FF14',
        light: '#141414',
      },
    }).catch(() => setError(true));
  }, [effectiveLink]);

  return (
    <section className="qr-section reveal" aria-label="QR Code to join WhatsApp group">
      <p className="section-label">PREFER TO SCAN?</p>
      <h2 className="qr-heading">Join from your phone</h2>
      <div className="qr-container">
        {effectiveLink && !error ? (
          <>
            <canvas ref={canvasRef} aria-label="QR code for WhatsApp group invite link"></canvas>
            <p className="qr-label">Scan to join our WhatsApp group</p>
          </>
        ) : (
          <p className="qr-fallback">
            {error
              ? 'Unable to generate QR code. Please use the join button above.'
              : 'WhatsApp group link is not configured yet.'}
          </p>
        )}
      </div>
    </section>
  );
}
