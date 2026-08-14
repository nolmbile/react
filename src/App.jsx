const features = [
  { icon: '⚡', title: 'Vite', description: '빠른 개발 환경과 최적화된 빌드' },
  { icon: '⚛', title: 'React', description: '간결한 컴포넌트 기반 UI' },
  { icon: '▲', title: 'Ready', description: 'Vercel과 Railway에 바로 배포' },
]

function App() {
  return (
    <main>
      <section className="hero">
        <span className="badge">DEPLOYMENT READY</span>
        <h1>
          Hello, <span>React!</span>
        </h1>
        <p className="intro">
          배포 테스트를 위한 가볍고 깔끔한 React 기본 페이지입니다.
        </p>

        <div className="feature-grid">
          {features.map((feature) => (
            <article className="feature-card" key={feature.title}>
              <span className="feature-icon" aria-hidden="true">
                {feature.icon}
              </span>
              <h2>{feature.title}</h2>
              <p>{feature.description}</p>
            </article>
          ))}
        </div>

        <a
          className="github-link"
          href="https://github.com"
          target="_blank"
          rel="noreferrer"
        >
          GitHub에서 시작하기 <span aria-hidden="true">→</span>
        </a>
      </section>

      <footer>
        <span className="status-dot" aria-hidden="true" />
        준비 완료 · React + Vite
      </footer>
    </main>
  )
}

export default App
