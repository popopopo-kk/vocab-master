import { useState, useCallback } from 'react'
import { Volume2, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

/**
 * 听写题 — 播放原声句子（最多3次），用户输入听到的单词
 * @param {Object} props
 * @param {Object} props.word
 * @param {Object} [props.sentence]
 * @param {(answer: string) => void} props.onSubmit
 * @param {() => void} [props.onHint]
 * @param {string|null} [props.hintText]
 */
function Dictation({ word, sentence, onSubmit, onHint, hintText }) {
  const [input, setInput] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [playCount, setPlayCount] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)

  const maxPlays = 3

  const playAudio = useCallback(() => {
    if (!window.speechSynthesis || playCount >= maxPlays) return

    const text = sentence?.en || word.word
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.rate = 0.85
    utterance.lang = 'en-US'
    utterance.onstart = () => setIsPlaying(true)
    utterance.onend = () => {
      setIsPlaying(false)
      setPlayCount((p) => p + 1)
    }
    utterance.onerror = () => setIsPlaying(false)

    setIsPlaying(true)
    window.speechSynthesis.speak(utterance)
  }, [sentence, word.word, playCount])

  const handleSubmit = () => {
    if (!input.trim()) return
    setSubmitted(true)
    onSubmit(input.trim())
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSubmit()
  }

  const getPlayButtonLabel = () => {
    if (isPlaying) return '播放中...'
    if (playCount === 0) return '播放发音'
    return `再听一次 (${maxPlays - playCount}/${maxPlays})`
  }

  return (
    <div className="flex flex-col items-center gap-4 w-full max-w-sm mx-auto">
      {/* Hint display */}
      {hintText && (
        <p className="text-sm text-blue-600 bg-blue-50 rounded-md px-3 py-1.5">
          提示: {hintText}
        </p>
      )}

      {/* Audio play area */}
      <div className="text-center">
        <Button
          variant="outline"
          size="lg"
          className={cn(
            'rounded-full w-20 h-20',
            isPlaying && 'bg-primary text-primary-foreground'
          )}
          onClick={playAudio}
          disabled={isPlaying || playCount >= maxPlays}
        >
          <Volume2 className="h-8 w-8" />
        </Button>
        <p className="text-sm text-muted-foreground mt-2">
          {getPlayButtonLabel()}
        </p>
      </div>

      {/* Input */}
      <div className="w-full flex gap-2">
        <input
          type="text"
          className={cn(
            'flex-1 h-10 rounded-md border border-input bg-background px-3 py-2 text-sm',
            'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-0',
            submitted && 'opacity-60'
          )}
          placeholder="输入你听到的单词..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={submitted}
          autoFocus
        />
        <Button onClick={handleSubmit} disabled={submitted || !input.trim()}>
          提交
        </Button>
      </div>

      {/* Replay count */}
      <div className="flex items-center gap-1">
        {Array.from({ length: maxPlays }).map((_, i) => (
          <span
            key={i}
            className={cn(
              'h-1.5 w-6 rounded-full transition-colors',
              i < playCount
                ? 'bg-primary'
                : 'bg-muted'
            )}
          />
        ))}
      </div>

      {playCount >= maxPlays && (
        <p className="text-xs text-muted-foreground flex items-center gap-1">
          <RotateCcw className="h-3 w-3" />
          已达最大播放次数
        </p>
      )}

      {/* Hint */}
      {onHint && !submitted && (
        <Button variant="ghost" size="sm" onClick={onHint}>
          需要提示
        </Button>
      )}
    </div>
  )
}

export default Dictation
