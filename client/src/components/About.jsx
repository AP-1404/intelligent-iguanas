import useScrollReveal from '../hooks/useScrollReveal';

export default function About() {
  useScrollReveal();

  const cards = [
    {
      title: 'Learn',
      description: 'Find useful resources, practical tips, and conversations that help you keep moving forward.',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.9 1.2 1.5 1.5 2.5"/>
          <path d="M9 18h6"/>
          <path d="M10 22h4"/>
        </svg>
      ),
    },
    {
      title: 'Share',
      description: 'Ask questions, share what worked for you, and exchange ideas without needing to be an expert.',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="18" cy="5" r="3"/>
          <circle cx="6" cy="12" r="3"/>
          <circle cx="18" cy="19" r="3"/>
          <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
          <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
        </svg>
      ),
    },
    {
      title: 'Build',
      description: 'Meet people interested in making things—from small experiments to collaborative projects.',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="16 18 22 12 16 6"/>
          <polyline points="8 6 2 12 8 18"/>
        </svg>
      ),
    },
    {
      title: 'Grow',
      description: 'Stay motivated through helpful conversations, shared wins, and meaningful connections.',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
          <polyline points="17 6 23 6 23 12"/>
        </svg>
      ),
    },
  ];

  return (
    <section className="section" id="about" aria-labelledby="about-heading">
      <div className="section-inner">
        <p className="section-label reveal">INSIDE THE GROUP</p>
        <h2 id="about-heading" className="section-heading reveal">More useful than another silent group chat.</h2>
        <p className="section-subheading reveal">
          Intelligent Iguanas is a focused place to learn, ask, share, and connect with people on a similar path.
        </p>
        <blockquote className="thirukkural reveal reveal-delay-1" lang="ta">
          <p>“தொட்டனைத்து ஊறும் மணற்கேணி மாந்தர்க்குக்<br />கற்றனைத்து ஊறும் அறிவு.”</p>
          <footer>— திருவள்ளுவர் | குறள் 396</footer>
          <p className="thirukkural-meaning" lang="en">As we learn more, knowledge flows deeper.</p>
        </blockquote>
        <div className="about-grid">
          {cards.map((card, i) => (
            <div key={card.title} className={`about-card reveal reveal-delay-${i + 1}`}>
              <span className="about-card-num">{String(i + 1).padStart(2, '0')}</span>
              <div className="about-card-icon" style={{ color: 'var(--color-lime)' }}>
                {card.icon}
              </div>
              <h3>{card.title}</h3>
              <p>{card.description}</p>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
