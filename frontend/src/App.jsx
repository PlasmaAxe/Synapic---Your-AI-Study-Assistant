import { useState, useEffect } from 'react'
import axios from 'axios'
import synapicLogo from './assets/synapicLogo1.png'
import { supabase } from './supabase';
import Authentication from './Authentication';


// ── Design tokens ─────────────────────────────────────────────
const C = {
  bg: '#F7F5F0',
  bgCard: '#FFFFFF',
  bgCardHover: '#F0EDE8',
  border: '#E8E4DC',
  borderStrong: '#D4CFC5',
  text: '#1A1A18',
  textMuted: '#6B6860',
  textLight: '#9B9890',
  accent: '#0D9373',
  accentLight: '#E6F5F0',
  accentDark: '#0A7A5F',
  accentGrad: 'linear-gradient(135deg, #0D9373, #0A7A5F)',
  danger: '#E53E3E',
  dangerLight: '#FFF5F5',
  success: '#38A169',
  successLight: '#F0FFF4',
  warning: '#D69E2E',
}

// ── Authentication stuff ────────────────────────

// ── Mock flashcard for landing preview ────────────────────────
function MockCard() {
  const [flipped, setFlipped] = useState(false)
  useEffect(() => {
    const t = setInterval(() => setFlipped(f => !f), 2500)
    return () => clearInterval(t)
  }, [])

  return (
    <div
      onClick={() => setFlipped(f => !f)}
      className="cursor-pointer rounded-2xl p-6 w-64 shadow-lg transition-all duration-500"
      style={{
        background: flipped ? C.accentGrad : C.bgCard,
        border: `1px solid ${C.border}`,
        transform: flipped ? 'rotateY(4deg) scale(1.02)' : 'rotateY(0deg)',
      }}
    >
      <p className="text-xs uppercase tracking-widest mb-3 font-medium"
        style={{ color: flipped ? 'rgba(255,255,255,0.6)' : C.textLight }}>
        {flipped ? 'Answer' : 'Question'}
      </p>
      <p className="text-sm font-medium leading-relaxed"
        style={{ color: flipped ? 'white' : C.text }}>
        {flipped
          ? 'The process by which plants convert sunlight into glucose using CO₂ and water.'
          : 'What is photosynthesis?'}
      </p>
      <p className="text-xs mt-4" style={{ color: flipped ? 'rgba(255,255,255,0.4)' : C.textLight }}>
        {flipped ? 'Click to flip back' : 'Click to reveal answer'}
      </p>
    </div>
  )
}

// ── Landing ───────────────────────────────────────────────────
function Landing({ onEnter, user, onSignOut }) {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: C.bg }}>

    {/* Nav */}
    <nav className="flex items-center justify-between px-8 py-4 sticky top-0 z-40"
      style={{
          background: 'rgba(247,245,240,0.85)',
          backdropFilter: 'blur(12px)',
          borderBottom: `1px solid ${C.border}`
         }}>
      <div className="flex items-center">
      <img 
        src={synapicLogo} 
        alt="Synapic" 
        className="h-20 w-auto object-contain" 
      />
      </div>

    {/* Auth Buttons */}
    <div className="flex items-center gap-6">
      {user ? (
        <>
          <span className="text-sm font-medium" style={{ color: C.textMuted }}>
            {user.email.split('@')[0]}
          </span>
          <button
            onClick={onSignOut}
            className="px-3 py-1.5 rounded-full text-xs font-medium transition-all hover:opacity-80"
            style={{
              background: C.bg,
              color: C.textMuted,
              border: `1px solid ${C.border}`
            }}
          >
            Sign out
          </button>
        </>
      ) : (
        <>
          <button
            onClick={onEnter}
            className="text-sm font-medium transition-colors hover:text-white"
            style={{ color: C.textMuted }}
          >
            Sign In
          </button>
          <button
            onClick={onEnter}
            className="px-6 py-2.5 rounded-full text-sm font-semibold text-white transition-all hover:opacity-90 hover:scale-105"
            style={{ background: C.accentGrad }}
          >
            Get Started Free
          </button>
        </>
      )}
</div>
    </nav>

      {/* Hero */}
      <div className="flex-1 flex flex-col items-center justify-center text-center px-6 py-20">
        
        {/* Badge */}
        <div className="mb-8 inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold uppercase tracking-widest"
          style={{ background: C.accentLight, color: C.accent, border: `1px solid ${C.accent}30` }}>
          <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: C.accent }}/>
          AI-Powered Study Tools
        </div>

        {/* Headline */}
        <h1 className="text-6xl font-black mb-6 leading-[1.1] max-w-3xl"
          style={{ color: C.text, letterSpacing: '-0.02em' }}>
          Study Smarter.{' '}
          <span style={{
            background: C.accentGrad,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            Not Harder.
          </span>
        </h1>

        <p className="text-lg max-w-lg mb-12 leading-relaxed"
          style={{ color: C.textMuted, letterSpacing: '0.01em' }}>
          Paste your lecture notes and instantly get flashcards, quizzes,
          and summaries — all powered by AI.
        </p>

        {/* Live preview card */}
        <div className="mb-12 flex flex-col items-center gap-3">
          <p className="text-xs uppercase tracking-widest font-medium"
            style={{ color: C.textLight }}>
            Live preview
          </p>
          <MockCard />
        </div>

        {/* Feature pills */}
        <div className="flex gap-3 mb-10 flex-wrap justify-center">
          {[
            { icon: '🃏', label: 'Flashcards' },
            { icon: '📝', label: 'Quizzes' },
            { icon: '📄', label: 'Summaries' },
          ].map(f => (
            <span key={f.label}
              className="px-4 py-2 rounded-full text-sm font-medium"
              style={{ background: C.bgCard, color: C.text, border: `1px solid ${C.border}` }}>
              {f.icon} {f.label}
            </span>
          ))}
        </div>

        {/* CTA */}
        <button onClick={onEnter}
          className="px-10 py-4 rounded-full text-white font-bold text-lg transition-all hover:scale-105 shadow-lg"
          style={{
            background: C.accentGrad,
            boxShadow: `0 8px 32px ${C.accent}40`
          }}>
          Start Studying Free →
        </button>

        <p className="mt-4 text-sm" style={{ color: C.textLight }}>
          No account required to get started
        </p>
      </div>
    </div>
  )
}

// ── Toast ─────────────────────────────────────────────────────
function Toast({ message, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3000)
    return () => clearTimeout(t)
  }, [onClose])

  return (
    <div className="fixed bottom-6 right-6 px-5 py-3 rounded-xl shadow-xl text-sm font-medium z-50"
      style={{ background: C.text, color: 'white', border: `1px solid ${C.border}` }}>
      {message}
    </div>
  )
}

// ── Skeleton ──────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="rounded-2xl p-6 min-h-36 animate-pulse"
      style={{ background: C.bgCard, border: `1px solid ${C.border}` }}>
      <div className="h-3 w-16 rounded-full mb-4"
        style={{ background: C.border }} />
      <div className="h-4 w-full rounded-full mb-2"
        style={{ background: C.border }} />
      <div className="h-4 w-2/3 rounded-full"
        style={{ background: C.border }} />
    </div>
  )
}

// ── Empty State ───────────────────────────────────────────────
function EmptyState({ icon, title, subtitle }) {
  return (
    <div className="rounded-2xl p-16 text-center"
      style={{ background: C.bgCard, border: `1px solid ${C.border}` }}>
      <p className="text-5xl mb-4">{icon}</p>
      <p className="font-semibold text-lg mb-2" style={{ color: C.text }}>{title}</p>
      <p className="text-sm" style={{ color: C.textMuted }}>{subtitle}</p>
    </div>
  )
}

// ── Main App ──────────────────────────────────────────────────
export default function App() {
  const [page, setPage] = useState('landing')
  const [user, setUser] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [tab, setTab] = useState('flashcards')
  const [notes, setNotes] = useState('')
  const [flashcards, setFlashcards] = useState([])
  const [quiz, setQuiz] = useState(null)
  const [quizAnswers, setQuizAnswers] = useState({})
  const [quizSubmitted, setQuizSubmitted] = useState(false)
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(false)
  const [flipped, setFlipped] = useState({})
  const [currentCard, setCurrentCard] = useState(0)
  const [studyMode, setStudyMode] = useState('grid')
  const [toast, setToast] = useState(null)

  //authentication stuff:
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setAuthLoading(false)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      setAuthLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  // Keyboard shortcuts for study mode
  useEffect(() => {
    const handler = e => {
      if (flashcards.length === 0 || studyMode !== 'study') return
      if (e.key === 'ArrowRight') setCurrentCard(i => Math.min(i + 1, flashcards.length - 1))
      if (e.key === 'ArrowLeft') setCurrentCard(i => Math.max(i - 1, 0))
      if (e.key === ' ') {
        e.preventDefault()
        setFlipped(prev => ({ ...prev, [currentCard]: !prev[currentCard] }))
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [flashcards, studyMode, currentCard])

  const generate = async () => {
    if (!notes.trim()) return
    setLoading(true)
    setFlashcards([])
    setQuiz(null)
    setSummary(null)
    setFlipped({})
    setCurrentCard(0)
    setQuizAnswers({})
    setQuizSubmitted(false)

    try {
      if (tab === 'flashcards') {
        const res = await axios.post(`${import.meta.env.VITE_API_URL}/generate-flashcards`, { text: notes })
        setFlashcards(res.data.flashcards)
        setToast(`Generated ${res.data.flashcards.length} flashcards`)
      } else if (tab === 'quizzes') {
        const res = await axios.post(`${import.meta.env.VITE_API_URL}/generate-quiz`, { text: notes })
        setQuiz(res.data.quiz)
        setToast(`Generated ${res.data.quiz.length} questions`)
      } else if (tab === 'summary') {
        const res = await axios.post(`${import.meta.env.VITE_API_URL}/generate-summary`, { text: notes })
        setSummary(res.data)
        setToast('Summary generated')
      }
    } catch {
      setToast('Something went wrong. Is the backend running?')
    }
    setLoading(false)
  }

  //authentication stuff:

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center"
        style={{ background: '#F7F5F0' }}>
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 animate-spin"
            style={{ borderColor: '#0D9373', borderTopColor: 'transparent' }} />
          <p className="text-sm" style={{ color: '#6B6860' }}>Loading...</p>
        </div>
      </div>
    )
  }
  if (page === 'landing') 
    return (
    <Landing 
    onEnter={() => setPage('app')} 
     user ={user}
    onSignOut={() => supabase.auth.signOut()}
    />

    )

  if (!user) {
    return (
      <Authentication
        onLogin={() => setPage('app')}
        onBack={() => setPage('landing')}
      />
    )
    
  }

  const tabs = [
    { id: 'flashcards', label: '🃏 Flashcards' },
    { id: 'quizzes', label: '📝 Quizzes' },
    { id: 'summary', label: '📄 Summary' },
  ]

  const headings = {
    flashcards: 'Generate Flashcards - Supercharge Your Recall!',
    quizzes: 'Generate Quiz - Test Your Knowledge!',
    summary: 'Summarise Notes - Brief Yourself!',
  }

  const btnLabels = {
    flashcards: 'Generate Flashcards',
    quizzes: 'Generate Quiz',
    summary: 'Summarise',
  }

  return (
    <div className="min-h-screen" style={{ background: C.bg }}>
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}

      {/* Nav */}
      <nav className="flex items-center justify-between px-8 py-4 sticky top-0 z-40"
        style={{
          background: 'rgba(247,245,240,0.85)',
          backdropFilter: 'blur(12px)',
          borderBottom: `1px solid ${C.border}`
        }}>
        <button onClick={() => setPage('landing')}
          className="transition-opacity hover:opacity-70">
          <img
            src={synapicLogo}
            alt="Synapic"
            className="h-20 w-auto object-contain" 
          />
        </button>

        {/* Tabs */}
        <div className="flex gap-1 p-1 rounded-full"
          style={{ background: C.bgCard, border: `1px solid ${C.border}` }}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className="px-4 py-2 rounded-full text-sm font-medium transition-all"
              style={tab === t.id
                ? { background: C.accentGrad, color: 'white' }
                : { color: C.textMuted, background: 'transparent' }
              }>
              {t.label}
            </button>
          ))}
        </div>

        {/* User info + sign out */}
        <div className="flex items-center gap-3" style={{ width: '120px', justifyContent: 'flex-end' }}>
          {user && (
            <>
              {/* Show the first part of their email so they know who's logged in */}
              <span className="text-xs hidden md:block"
                style={{ color: C.textMuted }}> 
                {user.email.split('@')[0]}
              </span>
              <button
                onClick={() => supabase.auth.signOut()}
                className="px-3 py-1.5 rounded-full text-xs font-medium transition-all hover:opacity-80"
                style={{
                  background: C.bg,
                  color: C.textMuted,
                  border: `1px solid ${C.border}`
                }}>
                Sign out
              </button>
            </>
          )}
        </div>
      </nav>

      {/* Main content */}
      <div className="max-w-4xl mx-auto px-6 py-10">

        {/* Input section */}
        <div className="rounded-3xl p-8 mb-8"
          style={{ background: C.bgCard, border: `1px solid ${C.border}` }}>
          <h2 className="text-xl font-bold mb-1" style={{ color: C.text }}>
            {headings[tab]}
          </h2>
          <p className="text-sm mb-5" style={{ color: C.textMuted }}>
            Paste your lecture notes or textbook content below
          </p>
          <textarea
            className="w-full h-40 rounded-2xl p-4 text-sm resize-none focus:outline-none transition-all"
            style={{
              background: C.bg,
              border: `1.5px solid ${C.border}`,
              color: C.text,
              outline: 'none',
            }}
            onFocus={e => e.target.style.borderColor = C.accent}
            onBlur={e => e.target.style.borderColor = C.border}
            placeholder="Paste your notes here..."
            value={notes}
            onChange={e => setNotes(e.target.value)}
          />
          <div className="flex items-center justify-between mt-4">
            <p className="text-xs" style={{ color: C.textLight }}>
              {notes.length > 0 ? `${notes.length} characters` : 'Tip: more notes = better results'}
            </p>
            <button
              onClick={generate}
              disabled={loading || !notes.trim()}
              className="px-6 py-3 rounded-full font-semibold text-white text-sm transition-all hover:scale-105 hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
              style={{ background: C.accentGrad }}>
              {loading ? 'Generating...' : btnLabels[tab]}
            </button>
          </div>
        </div>

        {/* ── Flashcards ───────────────────────────────── */}
        {tab === 'flashcards' && (
          <div>
            {loading && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
              </div>
            )}

            {!loading && flashcards.length === 0 && (
              <EmptyState icon="🃏" title="Ready to Make Flashcards?" subtitle="Paste your notes above and hit generate." />
            )}

            {!loading && flashcards.length > 0 && (
              <div>
                {/* Controls */}
                <div className="flex items-center justify-between mb-5">
                  <p className="text-sm font-medium" style={{ color: C.textMuted }}>
                    {flashcards.length} cards generated
                  </p>
                  <div className="flex gap-1 p-1 rounded-full"
                    style={{ background: C.bgCard, border: `1px solid ${C.border}` }}>
                    {['grid', 'study'].map(m => (
                      <button key={m} onClick={() => setStudyMode(m)}
                        className="px-4 py-2 rounded-full text-sm font-medium capitalize transition-all"
                        style={studyMode === m
                          ? { background: C.accentGrad, color: 'white' }
                          : { color: C.textMuted }
                        }>
                        {m === 'grid' ? '⊞ Grid' : '▶ Study'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Grid */}
                {studyMode === 'grid' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {flashcards.map((card, i) => (
                      <div key={i}
                        onClick={() => setFlipped(p => ({ ...p, [i]: !p[i] }))}
                        className="rounded-2xl p-6 cursor-pointer min-h-36 flex flex-col justify-between transition-all hover:scale-105 hover:shadow-md"
                        style={{
                          background: flipped[i] ? C.accentGrad : C.bgCard,
                          border: `1px solid ${flipped[i] ? 'transparent' : C.border}`,
                        }}>
                        <p className="text-xs uppercase tracking-widest mb-3 font-medium"
                          style={{ color: flipped[i] ? 'rgba(255,255,255,0.6)' : C.textLight }}>
                          {flipped[i] ? 'Answer' : 'Question'}
                        </p>
                        <p className="text-sm leading-relaxed font-medium"
                          style={{ color: flipped[i] ? 'white' : C.text }}>
                          {flipped[i] ? card.answer : card.question}
                        </p>
                        <p className="text-xs mt-3"
                          style={{ color: flipped[i] ? 'rgba(255,255,255,0.4)' : C.textLight }}>
                          Click to flip
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Study mode */}
                {studyMode === 'study' && (
                  <div className="flex flex-col items-center">
                    {/* Progress */}
                    <div className="w-full max-w-2xl mb-6">
                      <div className="flex justify-between text-xs mb-2"
                        style={{ color: C.textMuted }}>
                        <span>Card {currentCard + 1} of {flashcards.length}</span>
                        <span>{Math.round(((currentCard + 1) / flashcards.length) * 100)}% complete</span>
                      </div>
                      <div className="w-full h-1.5 rounded-full" style={{ background: C.border }}>
                        <div className="h-1.5 rounded-full transition-all"
                          style={{
                            width: `${((currentCard + 1) / flashcards.length) * 100}%`,
                            background: C.accentGrad
                          }} />
                      </div>
                    </div>

                    {/* Card */}
                    <div
                      onClick={() => setFlipped(p => ({ ...p, [currentCard]: !p[currentCard] }))}
                      className="w-full max-w-2xl rounded-3xl p-14 cursor-pointer min-h-72 flex flex-col items-center justify-center text-center transition-all hover:shadow-xl mb-6"
                      style={{
                        background: flipped[currentCard] ? C.accentGrad : C.bgCard,
                        border: `1px solid ${flipped[currentCard] ? 'transparent' : C.border}`,
                        boxShadow: flipped[currentCard] ? `0 20px 60px ${C.accent}30` : '0 4px 24px rgba(0,0,0,0.06)'
                      }}>
                      <p className="text-xs uppercase tracking-widest mb-6 font-medium"
                        style={{ color: flipped[currentCard] ? 'rgba(255,255,255,0.6)' : C.textLight }}>
                        {flipped[currentCard] ? 'Answer' : 'Question'}
                      </p>
                      <p className="text-xl font-semibold leading-relaxed"
                        style={{ color: flipped[currentCard] ? 'white' : C.text }}>
                        {flipped[currentCard] ? flashcards[currentCard].answer : flashcards[currentCard].question}
                      </p>
                      <p className="text-xs mt-10"
                        style={{ color: flipped[currentCard] ? 'rgba(255,255,255,0.4)' : C.textLight }}>
                        Click · Space to flip · ← → to navigate
                      </p>
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={() => { setFlipped({}); setCurrentCard(i => Math.max(i - 1, 0)) }}
                        disabled={currentCard === 0}
                        className="px-6 py-3 rounded-full text-sm font-medium transition-all disabled:opacity-30 hover:shadow-sm"
                        style={{ background: C.bgCard, color: C.text, border: `1px solid ${C.border}` }}>
                        ← Previous
                      </button>
                      <button
                        onClick={() => { setFlipped({}); setCurrentCard(i => Math.min(i + 1, flashcards.length - 1)) }}
                        disabled={currentCard === flashcards.length - 1}
                        className="px-6 py-3 rounded-full text-sm font-medium transition-all disabled:opacity-30 hover:shadow-sm"
                        style={{ background: C.bgCard, color: C.text, border: `1px solid ${C.border}` }}>
                        Next →
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── Quizzes ──────────────────────────────────── */}
        {tab === 'quizzes' && (
          <div>
            {loading && (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => <SkeletonCard key={i} />)}
              </div>
            )}

            {!loading && !quiz && (
              <EmptyState icon="📝" title="Ready to Quiz Yourself?" subtitle="Paste your notes above and hit generate." />
            )}

            {!loading && quiz && (
              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium" style={{ color: C.textMuted }}>
                    {quiz.length} questions
                  </p>
                  {quizSubmitted && (
                    <div className="px-4 py-2 rounded-full text-sm font-bold"
                      style={{ background: C.accentLight, color: C.accent }}>
                      Score: {Object.entries(quizAnswers).filter(([i, ans]) => ans === quiz[i].correct).length} / {quiz.length}
                    </div>
                  )}
                </div>

                {quiz.map((q, i) => (
                  <div key={i} className="rounded-2xl p-6"
                    style={{ background: C.bgCard, border: `1px solid ${C.border}` }}>
                    <p className="font-semibold mb-4 text-sm leading-relaxed"
                      style={{ color: C.text }}>
                      {i + 1}. {q.question}
                    </p>
                    <div className="space-y-2">
                      {q.options.map(opt => {
                        const selected = quizAnswers[i] === opt.label
                        const isCorrect = opt.label === q.correct
                        let bg = C.bg
                        let border = C.border
                        let color = C.text

                        if (quizSubmitted && isCorrect) {
                          bg = C.successLight; border = C.success; color = C.success
                        }
                        if (quizSubmitted && selected && !isCorrect) {
                          bg = C.dangerLight; border = C.danger; color = C.danger
                        }
                        if (!quizSubmitted && selected) {
                          bg = C.accentLight; border = C.accent; color = C.accent
                        }

                        return (
                          <button key={opt.label}
                            onClick={() => !quizSubmitted && setQuizAnswers(p => ({ ...p, [i]: opt.label }))}
                            className="w-full text-left px-4 py-3 rounded-xl text-sm transition-all hover:opacity-90"
                            style={{ background: bg, border: `1.5px solid ${border}`, color }}>
                            <span className="font-bold mr-2">{opt.label}.</span>
                            {opt.text}
                          </button>
                        )
                      })}
                    </div>
                    {quizSubmitted && (
                      <div className="mt-4 px-4 py-3 rounded-xl text-xs leading-relaxed"
                        style={{ background: C.accentLight, color: C.accentDark }}>
                        💡 {q.explanation}
                      </div>
                    )}
                  </div>
                ))}

                {!quizSubmitted && (
                  <button
                    onClick={() => setQuizSubmitted(true)}
                    disabled={Object.keys(quizAnswers).length < quiz.length}
                    className="px-6 py-3 rounded-full font-semibold text-white text-sm transition-all hover:scale-105 disabled:opacity-40"
                    style={{ background: C.accentGrad }}>
                    Submit Quiz →
                  </button>
                )}

                {quizSubmitted && (
                  <button
                    onClick={() => { setQuiz(null); setQuizAnswers({}); setQuizSubmitted(false) }}
                    className="px-6 py-3 rounded-full font-semibold text-sm transition-all hover:scale-105"
                    style={{ background: C.bgCard, color: C.text, border: `1px solid ${C.border}` }}>
                    Try Again
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── Summary ──────────────────────────────────── */}
        {tab === 'summary' && (
          <div>
            {loading && <SkeletonCard />}

            {!loading && !summary && (
              <EmptyState icon="📄" title="Ready to Summarise?" subtitle="Paste your notes above and hit generate." />
            )}

            {!loading && summary && (
              <div className="space-y-4">
                {/* Title */}
                <div className="rounded-2xl p-8"
                  style={{ background: C.accentGrad }}>
                  <p className="text-xs uppercase tracking-widest mb-2 font-medium"
                    style={{ color: 'rgba(255,255,255,0.6)' }}>
                    Summary
                  </p>
                  <h3 className="text-2xl font-black text-white leading-tight">
                    {summary.title}
                  </h3>
                </div>

                {/* Overview */}
                <div className="rounded-2xl p-6"
                  style={{ background: C.bgCard, border: `1px solid ${C.border}` }}>
                  <p className="text-xs uppercase tracking-widest font-semibold mb-3"
                    style={{ color: C.accent }}>
                    Overview
                  </p>
                  <p className="text-sm leading-relaxed" style={{ color: C.text }}>
                    {summary.overview}
                  </p>
                </div>

                {/* Key points */}
                <div className="rounded-2xl p-6"
                  style={{ background: C.bgCard, border: `1px solid ${C.border}` }}>
                  <p className="text-xs uppercase tracking-widest font-semibold mb-4"
                    style={{ color: C.accent }}>
                    Key Points
                  </p>
                  <div className="space-y-3">
                    {summary.key_points.map((point, i) => (
                      <div key={i} className="flex gap-3 items-start">
                        <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5"
                          style={{ background: C.accentLight, color: C.accent }}>
                          {i + 1}
                        </div>
                        <p className="text-sm leading-relaxed" style={{ color: C.text }}>
                          {point}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Conclusion */}
                <div className="rounded-2xl p-6"
                  style={{ background: C.bgCard, border: `1px solid ${C.border}` }}>
                  <p className="text-xs uppercase tracking-widest font-semibold mb-3"
                    style={{ color: C.accent }}>
                    Conclusion
                  </p>
                  <p className="text-sm leading-relaxed" style={{ color: C.text }}>
                    {summary.conclusion}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
