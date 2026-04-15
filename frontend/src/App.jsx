import { useState } from 'react'
import axios from 'axios'

function App() {
  const [notes, setNotes] = useState('')
  const [flashcards, setFlashcards] = useState([])
  const [loading, setLoading] = useState(false)
  const [flipped, setFlipped] = useState({})
  const [currentCard, setCurrentCard] = useState(0)
  const [mode, setMode] = useState('grid')

  const generateFlashcards = async () => {
    if (!notes.trim()) return
    setLoading(true)
    setFlashcards([])
    setFlipped({})
    setCurrentCard(0)
    try {
      const res = await axios.post('http://localhost:8000/generate-flashcards', {
        text: notes
      })
      setFlashcards(res.data.flashcards)
    } catch (err) {
      alert('Something went wrong. Is the backend running?')
      console.error(err)
    }
    setLoading(false)
  }

  const toggleFlip = (i) => {
    setFlipped(prev => ({ ...prev, [i]: !prev[i] }))
  }

  const nextCard = () => {
    setFlipped({})
    setCurrentCard(i => Math.min(i + 1, flashcards.length - 1))
  }

  const prevCard = () => {
    setFlipped({})
    setCurrentCard(i => Math.max(i - 1, 0))
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6 max-w-5xl mx-auto">

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-indigo-400">StudyForge</h1>
        <p className="text-gray-400 mt-1">Paste your notes, get flashcards instantly.</p>
      </div>

      {/* Input Area */}
      <div className="mb-6">
        <textarea
          className="w-full h-48 bg-gray-800 rounded-xl p-4 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white"
          placeholder="Paste your lecture notes here..."
          value={notes}
          onChange={e => setNotes(e.target.value)}
        />
        <button
          onClick={generateFlashcards}
          disabled={loading || !notes.trim()}
          className="mt-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed px-6 py-3 rounded-xl font-semibold transition-colors"
        >
          {loading ? '✨ Generating...' : '✨ Generate Flashcards'}
        </button>
      </div>

      {/* Results */}
      {flashcards.length > 0 && (
        <div>

          {/* Mode Toggle */}
          <div className="flex items-center justify-between mb-4">
            <p className="text-gray-400">{flashcards.length} cards generated</p>
            <div className="flex gap-2">
              <button
                onClick={() => setMode('grid')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${mode === 'grid' ? 'bg-indigo-600' : 'bg-gray-800 hover:bg-gray-700'}`}
              >
                Grid
              </button>
              <button
                onClick={() => setMode('study')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${mode === 'study' ? 'bg-indigo-600' : 'bg-gray-800 hover:bg-gray-700'}`}
              >
                Study Mode
              </button>
            </div>
          </div>

          {/* Grid Mode */}
          {mode === 'grid' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {flashcards.map((card, i) => (
                <div
                  key={i}
                  onClick={() => toggleFlip(i)}
                  className="bg-gray-800 hover:bg-gray-700 rounded-xl p-6 cursor-pointer min-h-32 flex flex-col items-center justify-center text-center transition-colors"
                >
                  <p className="text-xs text-gray-500 mb-2 uppercase tracking-wide">
                    {flipped[i] ? 'Answer' : 'Question'}
                  </p>
                  <p className="text-sm">{flipped[i] ? card.answer : card.question}</p>
                </div>
              ))}
            </div>
          )}

          {/* Study Mode */}
          {mode === 'study' && (
            <div className="flex flex-col items-center">
              <div
                onClick={() => toggleFlip(currentCard)}
                className="w-full max-w-2xl bg-gray-800 hover:bg-gray-700 rounded-2xl p-12 cursor-pointer min-h-64 flex flex-col items-center justify-center text-center transition-colors mb-6"
              >
                <p className="text-xs text-gray-500 mb-4 uppercase tracking-wide">
                  {flipped[currentCard] ? 'Answer' : 'Question'} · Card {currentCard + 1} of {flashcards.length}
                </p>
                <p className="text-xl">
                  {flipped[currentCard] ? flashcards[currentCard].answer : flashcards[currentCard].question}
                </p>
                <p className="text-xs text-gray-600 mt-6">Click to flip</p>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={prevCard}
                  disabled={currentCard === 0}
                  className="px-6 py-3 bg-gray-800 hover:bg-gray-700 disabled:opacity-30 rounded-xl font-medium transition-colors"
                >
                  ← Previous
                </button>
                <button
                  onClick={nextCard}
                  disabled={currentCard === flashcards.length - 1}
                  className="px-6 py-3 bg-gray-800 hover:bg-gray-700 disabled:opacity-30 rounded-xl font-medium transition-colors"
                >
                  Next →
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default App