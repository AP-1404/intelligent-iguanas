import useScrollReveal from '../hooks/useScrollReveal';

export default function Community() {
  useScrollReveal();

  const features = [
    { icon: '💬', title: 'Join the conversation', desc: 'Introduce yourself, ask a question, or simply follow the discussions at your own pace.' },
    { icon: '🔎', title: 'Keep it relevant', desc: 'Share resources, opportunities, ideas, and questions that are genuinely useful to the group.' },
    { icon: '🤝', title: 'Be respectful', desc: 'Different experience levels are welcome. Be kind, constructive, and mindful of everyone’s time.' },
    { icon: '🔕', title: 'Control your notifications', desc: 'Mute the group whenever you need focus, then catch up when it suits you.' },
    { icon: '🚀', title: 'Turn ideas into action', desc: 'Use the group to find feedback, collaborators, and encouragement for your next step.' },
    { icon: '🦎', title: 'You belong here', desc: 'There is no perfect introduction or prerequisite—curiosity is enough to get started.' },
  ];

  return (
    <section className="section" id="community" aria-labelledby="community-heading" style={{ background: 'var(--color-bg-secondary)' }}>
      <div className="section-inner">
        <p className="section-label reveal">BEFORE YOU JOIN</p>
        <h2 id="community-heading" className="section-heading reveal">A simple, respectful space to participate.</h2>
        <p className="section-subheading reveal">
          Here is the kind of group we are building—and how to get the best experience from it.
        </p>
        <div className="community-grid">
          {features.map((f, i) => (
            <div key={f.title} className={`community-card reveal reveal-delay-${(i % 3) + 1}`}>
              <div className="community-card-icon" aria-hidden="true">{f.icon}</div>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
