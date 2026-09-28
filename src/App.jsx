import { useEffect, useState } from 'react'

async function requestJson(path, options) {
  const response = await fetch(path, options)
  const payload = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(payload.error || '요청을 처리하지 못했습니다. 잠시 후 다시 시도해 주세요.')
  }
  return payload
}

function formatDate(value) {
  return new Intl.DateTimeFormat('ko-KR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

function BandMark() {
  return (
    <svg aria-hidden="true" viewBox="0 0 40 40" className="brand-mark">
      <path d="M6 29.5 16.8 8h6.4L12.4 29.5H6Zm13.2 0L30 8h4L23.2 29.5h-4Z" fill="currentColor" />
      <circle cx="9" cy="33" r="2" fill="currentColor" />
      <circle cx="29" cy="33" r="2" fill="currentColor" />
    </svg>
  )
}

function App() {
  const [posts, setPosts] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [reloadKey, setReloadKey] = useState(0)
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [isAnonymous, setIsAnonymous] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formError, setFormError] = useState('')
  const [notice, setNotice] = useState('')
  const [selectedPost, setSelectedPost] = useState(null)
  const [detailError, setDetailError] = useState('')
  const [detailLoading, setDetailLoading] = useState(false)

  useEffect(() => {
    let active = true
    requestJson('/api/posts')
      .then(({ posts: latestPosts }) => {
        if (active) setPosts(latestPosts)
      })
      .catch((error) => {
        if (active) setLoadError(error.message)
      })
      .finally(() => {
        if (active) setIsLoading(false)
      })

    return () => {
      active = false
    }
  }, [reloadKey])

  function handleRetryPosts() {
    setIsLoading(true)
    setLoadError('')
    setReloadKey((value) => value + 1)
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setFormError('')
    setNotice('')

    if (!title.trim() || !body.trim()) {
      setFormError('제목과 내용을 모두 입력해 주세요.')
      return
    }

    setIsSubmitting(true)
    try {
      const { post } = await requestJson('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, body, isAnonymous }),
      })
      setPosts((current) => [post, ...current.filter((item) => item.id !== post.id)].slice(0, 30))
      setTitle('')
      setBody('')
      setIsAnonymous(true)
      setNotice('질문이 게시되었습니다. 참여해 주셔서 감사합니다.')
    } catch (error) {
      setFormError(error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleReadPost(id) {
    setDetailLoading(true)
    setDetailError('')
    try {
      const { post } = await requestJson(`/api/posts/${encodeURIComponent(id)}`)
      setSelectedPost(post)
    } catch (error) {
      setDetailError(error.message)
    } finally {
      setDetailLoading(false)
    }
  }

  return (
    <>
      <header className="site-header">
        <a className="brand" href="#top" aria-label="SSH 밴드 홈">
          <BandMark />
          <span>SSH<span className="brand-sub">BAND</span></span>
        </a>
        <nav aria-label="주요 메뉴">
          <a href="#recruit">모집 안내</a>
          <a href="#board">익명 게시판</a>
        </nav>
        <a className="header-cta" href="#board">질문 남기기 <span aria-hidden="true">↗</span></a>
      </header>

      <main id="top">
        <section className="hero" aria-labelledby="hero-title">
          <div className="hero-copy">
            <p className="eyebrow"><span className="live-dot" /> SSH BAND · MEMBER CALL</p>
            <h1 id="hero-title">SSH 밴드와<br /><em>함께할 멤버를 찾습니다.</em></h1>
            <p className="hero-description">
              새로운 멤버를 모집하고 있어요. 모집 조건이나 합류 과정이 궁금하다면
              로그인 없이 익명으로 질문을 남겨 주세요.
            </p>
            <div className="hero-actions">
              <a className="button button-primary" href="#board">모집 내용 물어보기 <span aria-hidden="true">↗</span></a>
              <a className="text-link" href="#recruit">모집 안내 <span aria-hidden="true">↓</span></a>
            </div>
            <div className="hero-note">
              <span className="note-icon" aria-hidden="true">✳</span>
              <span>연락처나 이름을 입력하지 않아도 참여할 수 있어요.</span>
            </div>
          </div>

          <div className="hero-art" aria-hidden="true">
            <div className="art-topline"><span>SSH / OPEN CALL</span><span>01 — 03</span></div>
            <div className="art-orbit orbit-one" />
            <div className="art-orbit orbit-two" />
            <div className="art-disc"><div className="disc-center"><BandMark /></div></div>
            <div className="art-spark spark-one">✳</div>
            <div className="art-spark spark-two">✳</div>
            <div className="art-caption"><span>멤버 모집</span><strong>PLAY<br />TOGETHER</strong></div>
            <div className="art-bottomline"><span>질문은 익명으로</span><span>NO LOGIN REQUIRED</span></div>
          </div>
        </section>

        <section className="recruit-section" id="recruit" aria-labelledby="recruit-title">
          <div className="section-heading">
            <p className="eyebrow">01 / RECRUITMENT</p>
            <h2 id="recruit-title">같이 만들어 갈<br />다음 장면을 기다립니다.</h2>
          </div>
          <div className="recruit-copy">
            <p>SSH 밴드의 멤버 모집 소식을 전합니다.</p>
            <p>모집 분야, 일정, 합류 방법처럼 더 알고 싶은 내용이 있나요? 아직 공개되지 않은 정보를 추측해 안내하지 않고, 익명 게시판의 질문으로 확인할 수 있도록 준비했습니다.</p>
            <a className="inline-link" href="#board">궁금한 점을 질문하기 <span aria-hidden="true">↗</span></a>
          </div>
          <div className="recruit-stamp" aria-hidden="true"><span>SSH</span><small>OPEN<br />CALL</small><b>✳</b></div>
        </section>

        <section className="board-section" id="board" aria-labelledby="board-title">
          <div className="board-heading">
            <div>
              <p className="eyebrow">02 / ASK THE BAND</p>
              <h2 id="board-title">익명 게시판<span className="heading-period">.</span></h2>
              <p>로그인 없이 질문을 남기고, 다른 분들의 질문도 함께 읽어 보세요.</p>
            </div>
            <div className="board-counter"><span className="counter-dot" />최근 질문 <strong>{posts.length}</strong></div>
          </div>

          <div className="board-layout">
            <section className="post-panel" aria-label="게시글 목록">
              <div className="panel-topline"><span>COMMUNITY / Q&amp;A</span><span>최신순</span></div>

              {detailError && <p className="inline-error" role="alert">{detailError}</p>}

              {selectedPost ? (
                <article className="post-detail">
                  <button className="back-button" type="button" onClick={() => setSelectedPost(null)}>← 목록으로</button>
                  <p className="post-meta"><span>{selectedPost.is_anonymous ? '익명' : '게시자'}</span><time dateTime={selectedPost.created_at}>{formatDate(selectedPost.created_at)}</time></p>
                  <h3>{selectedPost.title}</h3>
                  <p className="detail-body">{selectedPost.body}</p>
                  <div className="detail-footnote">질문에 이어 궁금한 점이 있으면 새 글로 남겨 주세요.</div>
                </article>
              ) : isLoading ? (
                <div className="state-box" role="status"><span className="spinner" />게시글을 불러오는 중입니다.</div>
              ) : loadError ? (
                <div className="state-box state-error" role="alert">
                  <span>{loadError}</span>
                  <button className="retry-button" type="button" onClick={handleRetryPosts}>다시 시도</button>
                </div>
              ) : posts.length === 0 ? (
                <div className="state-box empty-state">
                  <span className="empty-mark" aria-hidden="true">✳</span>
                  <strong>아직 등록된 질문이 없어요.</strong>
                  <span>첫 질문을 남겨 주세요.</span>
                </div>
              ) : (
                <ul className="post-list">
                  {posts.map((post) => (
                    <li className="post-row" key={post.id}>
                      <div className="post-row-content">
                        <p className="post-meta"><span>{post.is_anonymous ? '익명' : '게시자'}</span><time dateTime={post.created_at}>{formatDate(post.created_at)}</time></p>
                        <h3>{post.title}</h3>
                        <p className="post-excerpt">{post.body}</p>
                      </div>
                      <button className="read-button" type="button" onClick={() => handleReadPost(post.id)} disabled={detailLoading} aria-label={`${post.title} 읽기`}>
                        {detailLoading ? '…' : '읽기'} <span aria-hidden="true">↗</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              <div className="panel-footline"><span>이름·연락처 없이 이용 가능</span><span>최대 30개 표시</span></div>
            </section>

            <section className="form-panel" aria-labelledby="form-title">
              <div className="form-header"><span className="form-icon" aria-hidden="true">＋</span><div><p className="eyebrow">YOUR QUESTION</p><h3 id="form-title">질문 남기기</h3></div></div>
              <p className="form-intro">모집에 관해 궁금한 점을 자유롭게 적어 주세요.</p>
              <form onSubmit={handleSubmit}>
                <label htmlFor="post-title">제목 <span>필수</span></label>
                <input id="post-title" name="title" type="text" value={title} onChange={(event) => setTitle(event.target.value)} maxLength={100} required placeholder="궁금한 내용을 한 줄로 적어 주세요" />
                <div className="label-row"><label htmlFor="post-body">내용 <span>필수</span></label><span className="char-count">{[...body].length}/5,000</span></div>
                <textarea id="post-body" name="body" value={body} onChange={(event) => setBody(event.target.value)} maxLength={5000} required rows={5} placeholder="모집 조건이나 합류 과정 등 궁금한 점을 남겨 주세요." />
                <label className="anonymous-toggle">
                  <input type="checkbox" checked={isAnonymous} onChange={(event) => setIsAnonymous(event.target.checked)} />
                  <span className="custom-check" aria-hidden="true">✓</span>
                  <span>익명으로 표시하기</span>
                  <small>기본 설정</small>
                </label>
                <p className="privacy-note">이름·이메일·연락처는 받지 않습니다. 요청 제한을 위해 접속 IP를 잠시 사용하며 게시글에는 저장하지 않습니다. 공개 게시판에 개인정보는 적지 말아 주세요.</p>
                {formError && <p className="inline-error" role="alert">{formError}</p>}
                {notice && <p className="success-message" role="status">{notice}</p>}
                <button className="button button-submit" type="submit" disabled={isSubmitting}>
                  {isSubmitting ? '등록 중…' : '익명으로 질문 등록'} <span aria-hidden="true">↗</span>
                </button>
              </form>
            </section>
          </div>
        </section>

        <section className="closing-cta" aria-label="모집 관련 질문">
          <p className="eyebrow">NO LOGIN · NO CONTACT DETAILS</p>
          <p>궁금한 것부터, 편하게 물어보세요.</p>
          <a href="#board" aria-label="익명 게시판으로 이동">질문 남기기 <span aria-hidden="true">↗</span></a>
        </section>
      </main>

      <footer className="site-footer">
        <a className="brand footer-brand" href="#top"><BandMark /><span>SSH<span className="brand-sub">BAND</span></span></a>
        <span>멤버 모집 · 익명 질문 게시판</span>
        <a href="#top">맨 위로 ↑</a>
      </footer>
    </>
  )
}

export default App