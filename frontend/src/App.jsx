import { useState, useEffect } from 'react'
import axios from 'axios'

// ── Landing Page ──────────────────────────────────────────────
function Landing({ onEnter }) {
  return (
    <div className="min-h-screen flex flex-col" style={{
      background: 'linear-gradient(135deg, #0f0c29, #302b63, #24243e)'
    }}>
      {/* Nav */}
      <nav className="flex items-center justify-between px-10 py-6">
        <span className="text-white font-bold text-xl tracking-[0.28em] uppercase">Synapic</span>
        <button
          onClick={onEnter}
          className="text-white border border-white/30 px-5 py-2 rounded-full text-sm hover:bg-white/10 transition"
        >
          Get Started
        </button>
      </nav>

      {/* Hero */}
      <div className="flex-1 flex flex-col items-center justify-center text-center px-6">
        <div className="mb-6 inline-block px-4 py-1 rounded-full border border-purple-400/40 text-purple-300 text-xs tracking-widest uppercase">
          AI-Powered Study Tools
        </div>
        <h1 className="text-6xl font-black text-white mb-4 leading-tight">
          Study Smarter.<br />
          <span style={{ background: 'linear-gradient(90deg, #a78bfa, #f472b6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Not Harder.
          </span>
        </h1>
        <p className="synapic-slogan text-base sm:text-lg mb-6">
          <span>Study at the speed of thought.</span>
        </p>
        <p className="text-gray-400 text-lg max-w-xl mb-10">
          Paste your lecture notes and instantly get flashcards, quizzes, and summaries powered by AI.
        </p>

        {/* Feature Pills */}
        <div className="flex gap-3 mb-10 flex-wrap justify-center">
          {['✦ Flashcards', '✦ Quizzes', '✦ Summaries'].map(f => (
            <span key={f} className="px-4 py-2 rounded-full bg-white/10 text-white text-sm border border-white/20">
              {f}
            </span>
          ))}
        </div>

        <button
          onClick={onEnter}
          className="px-8 py-4 rounded-full text-white font-semibold text-lg transition-all hover:scale-105 hover:shadow-lg"
          style={{ background: 'linear-gradient(90deg, #7c3aed, #db2777)' }}
        >
          Start Studying Free →
        </button>
      </div>

      {/* Bottom wave decoration */}
      <div className="h-32 w-full" style={{
        background: 'linear-gradient(to top, rgba(124,58,237,0.15), transparent)'
      }}/>
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
    <div className="fixed bottom-6 right-6 bg-white text-gray-900 px-5 py-3 rounded-xl shadow-lg text-sm font-medium z-50 animate-bounce">
      {message}
    </div>
  )
}

// ── Skeleton Card ─────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="rounded-2xl p-6 min-h-32 animate-pulse" style={{ background: 'rgba(255,255,255,0.05)' }}>
      <div className="h-3 w-16 rounded mb-4" style={{ background: 'rgba(255,255,255,0.1)' }}/>
      <div className="h-4 w-full rounded mb-2" style={{ background: 'rgba(255,255,255,0.1)' }}/>
      <div className="h-4 w-3/4 rounded" style={{ background: 'rgba(255,255,255,0.1)' }}/>
    </div>
  )
}

// ── Main App ──────────────────────────────────────────────────
export default function App() {
  const [page, setPage] = useState('landing')
  const [tab, setTab] = useState('flashcards')
  const [notes, setNotes] = useState('')
  const [flashcards, setFlashcards] = useState([])
  const [loading, setLoading] = useState(false)
  const [flipped, setFlipped] = useState({})
  const [currentCard, setCurrentCard] = useState(0)
  const [studyMode, setStudyMode] = useState('grid')
  const [toast, setToast] = useState(null)

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e) => {
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
    setFlipped({})
    setCurrentCard(0)
    try {
      const res = await axios.post('http://localhost:8000/generate-flashcards', { text: notes })
      setFlashcards(res.data.flashcards)
      setToast(`✨ ${res.data.flashcards.length} flashcards generated!`)
    } catch {
      setToast('❌ Something went wrong. Is the backend running?')
    }
    setLoading(false)
  }

  if (page === 'landing') return <Landing onEnter={() => setPage('app')} />

  return (
    <div className="min-h-screen text-white" style={{
      background: 'linear-gradient(135deg, #0f0c29, #302b63, #24243e)'
    }}>
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}

      {/* Nav */}
      <nav className="flex items-center justify-between px-8 py-5 border-b border-white/10">
        <button onClick={() => setPage('landing')} className="font-bold text-lg tracking-wide text-white">
          Synapic
        </button>
        <div className="flex gap-2">
          {['flashcards', 'quizzes', 'summary'].map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className="px-4 py-2 rounded-full text-sm font-medium capitalize transition-all"
              style={tab === t
                ? { background: 'linear-gradient(90deg, #7c3aed, #db2777)', color: 'white' }
                : { background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.6)' }
              }
            >
              {t === 'flashcards' ? '🃏 Flashcards' : t === 'quizzes' ? '📝 Quizzes' : '📄 Summary'}
            </button>
          ))}
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-10">

        {/* Notes Input */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-2">
            {tab === 'flashcards' ? '🃏 Generate Flashcards' : tab === 'quizzes' ? '📝 Generate Quiz' : '📄 Summarise Notes'}
          </h2>
          <p className="text-gray-400 text-sm mb-4">Paste your lecture notes below</p>
          <textarea
            className="w-full h-44 rounded-2xl p-4 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 text-white"
            style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }}
            placeholder="Paste your notes here..."
            value={notes}
            onChange={e => setNotes(e.target.value)}
          />
          <button
            onClick={generate}
            disabled={loading || !notes.trim()}
            className="mt-3 px-6 py-3 rounded-full font-semibold text-white transition-all hover:scale-105 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
            style={{ background: 'linear-gradient(90deg, #7c3aed, #db2777)' }}
          >
            {loading ? 'Generating...' : tab === 'flashcards' ? '✨ Generate Flashcards' : tab === 'quizzes' ? '✨ Generate Quiz' : '✨ Summarise'}
          </button>
        </div>

        {/* Coming Soon for Quizzes and Summary */}
        {tab !== 'flashcards' && (
          <div className="rounded-2xl p-12 text-center" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <p className="text-4xl mb-4">{tab === 'quizzes' ? '📝' : '📄'}</p>
            <p className="text-white font-semibold text-lg mb-2">{tab === 'quizzes' ? 'Quizzes' : 'Summaries'} Coming Soon</p>
            <p className="text-gray-400 text-sm">This feature is currently being built. Check back soon!</p>
          </div>
        )}

        {/* Flashcard Results */}
        {tab === 'flashcards' && (
          <div>
            {/* Loading Skeletons */}
            {loading && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
              </div>
            )}

            {/* Cards */}
            {!loading && flashcards.length > 0 && (
              <div>
                {/* Mode Toggle + Progress */}
                <div className="flex items-center justify-between mb-5">
                  <p className="text-gray-400 text-sm">{flashcards.length} cards generated</p>
                  <div className="flex gap-2">
                    {['grid', 'study'].map(m => (
                      <button
                        key={m}
                        onClick={() => setStudyMode(m)}
                        className="px-4 py-2 rounded-full text-sm font-medium capitalize transition-all"
                        style={studyMode === m
                          ? { background: 'linear-gradient(90deg, #7c3aed, #db2777)', color: 'white' }
                          : { background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.6)' }
                        }
                      >
                        {m === 'grid' ? '⊞ Grid' : '▶ Study'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Grid Mode */}
                {studyMode === 'grid' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {flashcards.map((card, i) => (
                      <div
                        key={i}
                        onClick={() => setFlipped(p => ({ ...p, [i]: !p[i] }))}
                        className="rounded-2xl p-6 cursor-pointer min-h-36 flex flex-col justify-between transition-all hover:scale-105"
                        style={{
                          background: flipped[i]
                            ? 'linear-gradient(135deg, #7c3aed33, #db277733)'
                            : 'rgba(255,255,255,0.06)',
                          border: '1px solid rgba(255,255,255,0.1)'
                        }}
                      >
                        <p className="text-xs uppercase tracking-widest mb-3"
                          style={{ color: flipped[i] ? '#f472b6' : 'rgba(255,255,255,0.4)' }}>
                          {flipped[i] ? 'Answer' : 'Question'}
                        </p>
                        <p className="text-sm text-white leading-relaxed">
                          {flipped[i] ? card.answer : card.question}
                        </p>
                        <p className="text-xs mt-3" style={{ color: 'rgba(255,255,255,0.2)' }}>
                          Click to flip
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Study Mode */}
                {studyMode === 'study' && (
                  <div className="flex flex-col items-center">
                    {/* Progress Bar */}
                    <div className="w-full max-w-2xl mb-4">
                      <div className="flex justify-between text-xs text-gray-400 mb-1">
                        <span>Card {currentCard + 1} of {flashcards.length}</span>
                        <span>{Math.round(((currentCard + 1) / flashcards.length) * 100)}%</span>
                      </div>
                      <div className="w-full h-1 rounded-full" style={{ background: 'rgba(255,255,255,0.1)' }}>
                        <div
                          className="h-1 rounded-full transition-all"
                          style={{
                            width: `${((currentCard + 1) / flashcards.length) * 100}%`,
                            background: 'linear-gradient(90deg, #7c3aed, #db2777)'
                          }}
                        />
                      </div>
                    </div>

                    {/* Card */}
                    <div
                      onClick={() => setFlipped(p => ({ ...p, [currentCard]: !p[currentCard] }))}
                      className="w-full max-w-2xl rounded-3xl p-12 cursor-pointer min-h-64 flex flex-col items-center justify-center text-center transition-all hover:scale-102"
                      style={{
                        background: flipped[currentCard]
                          ? 'linear-gradient(135deg, #7c3aed33, #db277733)'
                          : 'rgba(255,255,255,0.06)',
                        border: '1px solid rgba(255,255,255,0.12)'
                      }}
                    >
                      <p className="text-xs uppercase tracking-widest mb-6"
                        style={{ color: flipped[currentCard] ? '#f472b6' : 'rgba(255,255,255,0.4)' }}>
                        {flipped[currentCard] ? 'Answer' : 'Question'}
                      </p>
                      <p className="text-xl text-white leading-relaxed">
                        {flipped[currentCard]
                          ? flashcards[currentCard].answer
                          : flashcards[currentCard].question}
                      </p>
                      <p className="text-xs mt-8" style={{ color: 'rgba(255,255,255,0.2)' }}>
                        Click to flip · Space to flip · ← → to navigate
                      </p>
                    </div>

                    {/* Navigation */}
                    <div className="flex gap-4 mt-6">
                      <button
                        onClick={() => { setFlipped({}); setCurrentCard(i => Math.max(i - 1, 0)) }}
                        disabled={currentCard === 0}
                        className="px-6 py-3 rounded-full font-medium text-sm transition-all disabled:opacity-30"
                        style={{ background: 'rgba(255,255,255,0.08)', color: 'white' }}
                      >
                        ← Previous
                      </button>
                      <button
                        onClick={() => { setFlipped({}); setCurrentCard(i => Math.min(i + 1, flashcards.length - 1)) }}
                        disabled={currentCard === flashcards.length - 1}
                        className="px-6 py-3 rounded-full font-medium text-sm transition-all disabled:opacity-30"
                        style={{ background: 'rgba(255,255,255,0.08)', color: 'white' }}
                      >
                        Next →
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
