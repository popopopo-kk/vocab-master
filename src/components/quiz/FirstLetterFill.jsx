import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

/**
 * 首字母填空
 * @param {Object} props
 * @param {Object} props.word
 * @param {Object} [props.sentence]
 * @param {(answer: string) => void} props.onSubmit
 * @param {() => void} [props.onHint]
 * @param {string|null} [props.hintText]
 */
function FirstLetterFill({ word, sentence, onSubmit, onHint, hintText }) {
  const [input, setInput] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const firstLetter = word.word[0]
  const restLen = word.word.length - 1

  const handleSubmit = () => {
    if (!input.trim()) return
    setSubmitted(true)
    onSubmit(input.trim())
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSubmit()
  }

  return (
    <div className="flex flex-col items-center gap-4 w-full max-w-sm mx-auto">
      {/* Hint display */}
      {hintText && (
        <p className="text-sm text-blue-600 bg-blue-50 rounded-md px-3 py-1.5">
          提示: {hintText}
        </p>
      )}

      {/* Word display */}
      <div className="text-center">
        <p className="text-4xl font-mono tracking-widest font-bold">
          <span className="text-primary">{firstLetter}</span>
          <span className="text-muted-foreground">{'_'.repeat(restLen)}</span>
        </p>
        <p className="text-sm text-muted-foreground mt-2">
          请输入完整单词
        </p>
      </div>

      {/* Sentence context */}
      {sentence && (
        <p className="text-sm text-center text-muted-foreground italic">
          "{sentence.en.replace(new RegExp(word.word, 'gi'), '____')}"
        </p>
      )}

      {/* Input */}
      <div className="w-full flex gap-2">
        <input
          type="text"
          className={cn(
            'flex-1 h-10 rounded-md border border-input bg-background px-3 py-2 text-sm',
            'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-0',
            submitted && 'opacity-60'
          )}
          placeholder={`${firstLetter}...`}
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

      {/* Hint button */}
      {onHint && !submitted && (
        <Button variant="ghost" size="sm" onClick={onHint}>
          需要提示
        </Button>
      )}
    </div>
  )
}

export default FirstLetterFill
