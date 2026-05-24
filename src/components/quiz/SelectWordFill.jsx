import { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

/**
 * 选词填空 — 给定句子（目标词替换为 ____），从4个候选中选择
 * @param {Object} props
 * @param {Object} props.word
 * @param {Object} [props.sentence]
 * @param {(answer: string) => void} props.onSubmit
 * @param {() => void} [props.onHint]
 * @param {string|null} [props.hintText]
 */
function SelectWordFill({ word, sentence, onSubmit, onHint, hintText }) {
  const [selected, setSelected] = useState(null)
  const [submitted, setSubmitted] = useState(false)

  const gappedSentence = sentence
    ? sentence.en.replace(new RegExp(word.word, 'gi'), '____')
    : `____`

  // 生成4个候选项：正确单词 + 3个随机干扰项（从 word 数据中）
  const options = useMemo(() => {
    const correct = word.word
    const distractors = [
      'alternative', 'determine', 'essential', 'frequent',
      'generate', 'highlight', 'indicate', 'maintain',
      'obvious', 'potential', 'relevant', 'significant',
    ]
    const filtered = distractors.filter((d) => d !== correct)
    const picked = shuffle(filtered).slice(0, 3)
    return shuffle([correct, ...picked])
  }, [word.word])

  const handleSelect = (opt) => {
    if (submitted) return
    setSelected(opt)
    setSubmitted(true)
    // 延迟提交让用户看到选择结果
    setTimeout(() => onSubmit(opt), 500)
  }

  return (
    <div className="flex flex-col items-center gap-4 w-full max-w-sm mx-auto">
      {/* Hint */}
      {hintText && (
        <p className="text-sm text-blue-600 bg-blue-50 rounded-md px-3 py-1.5">
          提示: {hintText}
        </p>
      )}

      {/* Gapped sentence */}
      <div className="text-center">
        <p className="text-lg leading-relaxed">{gappedSentence}</p>
        {sentence && (
          <p className="text-sm text-muted-foreground mt-1">{sentence.cn}</p>
        )}
      </div>

      {/* Options grid */}
      <div className="grid grid-cols-2 gap-2 w-full">
        {options.map((opt, i) => {
          const isCorrect = opt === word.word
          const isSelected = selected === opt
          let variant = 'outline'
          if (submitted && isCorrect) variant = 'default'
          if (isSelected && !isCorrect) variant = 'destructive'

          return (
            <Button
              key={i}
              variant={variant}
              className={cn(
                'h-12 text-sm font-medium transition-all',
                submitted && !isSelected && !isCorrect && 'opacity-40'
              )}
              onClick={() => handleSelect(opt)}
              disabled={submitted}
            >
              {opt}
            </Button>
          )
        })}
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

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export default SelectWordFill
