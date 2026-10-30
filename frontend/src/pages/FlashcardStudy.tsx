import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Layers, CheckCircle2, X, RotateCw } from 'lucide-react'
import { flashcardsApi } from '../services/api'
import type { Flashcard } from '../types'
import { FullSpinner } from '../components/Spinner'
import { EmptyState } from '../components/EmptyState'

export function FlashcardStudy() {
  const navigate = useNavigate()
  const [cards, setCards] = useState<Flashcard[]>([])
  const [current, setCurrent] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [loading, setLoading] = useState(true)
  const [reviewing, setReviewing] = useState(false)
  const [completed, setCompleted] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const res = await flashcardsApi.due()
      setCards(res || [])
    } catch { setCards([]) }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const handleReview = async (rating: 'easy' | 'medium' | 'difficult') => {
    if (!cards[current]) return
    setReviewing(true)
    try {
      await flashcardsApi.review(cards[current].id, rating)
      if (current + 1 < cards.length) {
        setCurrent(current + 1)
        setFlipped(false)
      } else {
        setCompleted(true)
      }
    } catch { /* ignore */ }
    finally { setReviewing(false) }
  }

  if (loading) return <FullSpinner message="Loading study cards…" />

  if (completed) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="card text-center py-12">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 size={32} className="text-emerald-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Study session complete!</h1>
          <p className="text-navy-400 mb-6">You reviewed {cards.length} cards. Come back later for more.</p>
          <button onClick={() => navigate('/flashcards')} className="btn-primary">Back to Flashcards</button>
        </div>
      </div>
    )
  }

  if (cards.length === 0) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white">Study Mode</h1>
          <button onClick={() => navigate('/flashcards')} className="btn-secondary"><X size={16} /> Exit</button>
        </div>
        <div className="card"><EmptyState icon={Layers} title="No cards due" message="You're all caught up! Come back later for more review cards." actionLabel="Back to Flashcards" onAction={() => navigate('/flashcards')} /></div>
      </div>
    )
  }

  const card = cards[current]

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Study Mode</h1>
        <button onClick={() => navigate('/flashcards')} className="btn-secondary"><X size={16} /> Exit</button>
      </div>

      <div className="flex items-center gap-2">
        <div className="flex-1 h-2 bg-navy-800 rounded-full overflow-hidden">
          <div className="h-full bg-brand-500 rounded-full transition-all" style={{ width: `${((current) / cards.length) * 100}%` }} />
        </div>
        <span className="text-sm text-navy-400">{current + 1} / {cards.length}</span>
      </div>

      {/* Card */}
      <div onClick={() => setFlipped(!flipped)} className="card cursor-pointer min-h-[300px] flex items-center justify-center p-8 hover:border-brand-500/30 transition-colors relative group">
        {card.is_demo && <span className="badge-warning absolute top-4 right-4">Demo</span>}
        <div className="text-center">
          {flipped ? (
            <>
              <div className="text-xs text-navy-500 uppercase tracking-wide mb-2">Answer</div>
              <p className="text-xl text-white font-medium">{card.back}</p>
            </>
          ) : (
            <>
              <div className="text-xs text-navy-500 uppercase tracking-wide mb-2">Question</div>
              <p className="text-xl text-white font-medium">{card.front}</p>
              <p className="text-xs text-navy-500 mt-4">Click to flip</p>
            </>
          )}
        </div>
      </div>

      {/* Rating buttons (only show when flipped) */}
      {flipped && (
        <div className="grid grid-cols-3 gap-3 animate-fade-in">
          <button onClick={() => handleReview('difficult')} disabled={reviewing} className="btn-danger py-3 flex flex-col items-center gap-1">
            <span className="text-sm font-semibold">Difficult</span>
            <span className="text-xs opacity-70">Soon</span>
          </button>
          <button onClick={() => handleReview('medium')} disabled={reviewing} className="btn-secondary py-3 flex flex-col items-center gap-1">
            <span className="text-sm font-semibold">Medium</span>
            <span className="text-xs opacity-70">+1 day</span>
          </button>
          <button onClick={() => handleReview('easy')} disabled={reviewing} className="btn-primary py-3 flex flex-col items-center gap-1">
            <span className="text-sm font-semibold">Easy</span>
            <span className="text-xs opacity-70">+6 days</span>
          </button>
        </div>
      )}

      {!flipped && <p className="text-center text-sm text-navy-500">Click the card to reveal the answer</p>}
    </div>
  )
}
