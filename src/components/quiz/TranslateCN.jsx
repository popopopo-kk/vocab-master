import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

/**
 * 中译英 — 显示中文意思，输入英文单词/句子
 * @param {Object} props
 * @param {Object} props.word
 * @param {Object} [props.sentence]
 * @param {(answer: string) => void} props.onSubmit
 * @param {() => void} [props.onHint]
 * @param {string|null} [props.hintText]
 */
function TranslateCN({ word, sentence, onSubmit, onHint, hintText }) {
  const [input, setInput] = useState('')
  const [submitted, setSubmitted] = useState(false)

  // Build Chinese prompt
  const cnText = sentence
    ? sentence.cn
    : word.meaning

  const expectedAnswer = sentence ? sentence.en : word.word

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
      {/* Hint */}
      {hintText && (
        <p className="text-sm text-blue-600 bg-blue-50 rounded-md px-3 py-1.5">
          提示: {hintText}
        </p>
      )}

      {/* Chinese prompt */}
      <div className="text-center">
        <Badge variant="secondary" className="mb-2">中译英</Badge>
        <p className="text-xl font-semibold">{cnText}</p>
        {!sentence && word.phonetic && (
          <p className="text-xs text-muted-foreground mt-1">{word.phonetic}</p>
        )}
      </div>

      {/* Answer area */}
      <div className="w-full space-y-2">
        <textarea
          className={cn(
            'w-full rounded-md border border-input bg-background px-3 py-2 text-sm',
            'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-0',
            'resize-none',
            submitted && 'opacity-60'
          )}
          rows={2}
          placeholder="输入英文翻译..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              handleSubmit()
            }
          }}
          disabled={submitted}
          autoFocus
        />
        <Button
          className="w-full"
          onClick={handleSubmit}
          disabled={submitted || !input.trim()}
        >
          提交翻译
        </Button>
      </div>

      {/* Hint */}
      {onHint && !submitted && (
        <Button variant="ghost" size="sm" onClick={onHint}>
          需要提示
        </Button>
      )}
    </div>
  )
}

export default TranslateCN
