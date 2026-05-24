import { useState, useCallback, useEffect } from 'react'
import { Check, X, Lightbulb, Timer, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { gradeAnswer } from '@/utils/grader'
import { QUIZ_TYPE_WEIGHTS } from '@/config/app'
import { useHints } from './quiz/useHints'
import FirstLetterFill from './quiz/FirstLetterFill'
import Dictation from './quiz/Dictation'
import SelectWordFill from './quiz/SelectWordFill'
import TranslateCN from './quiz/TranslateCN'

/**
 * 题型注册表 — 扩展题型只需在此注册
 */
const QUIZ_TYPES = {
  firstLetter: {
    component: FirstLetterFill,
    label: '首字母填空',
    answerKey: (word) => word.word,
  },
  dictation: {
    component: Dictation,
    label: '听写',
    answerKey: (word) => word.word,
  },
  selectWord: {
    component: SelectWordFill,
    label: '选词填空',
    answerKey: (word) => word.word,
  },
  translate: {
    component: TranslateCN,
    label: '中译英',
    answerKey: (word, sentence) => sentence?.en || word.word,
    normalize: (s) => s.trim().replace(/\s+/g, ' ').toLowerCase(),
  },
}

/**
 * QuizEngine — 统一测验引擎
 * @param {Object} props
 * @param {Array} props.words — 待测单词列表
 * @param {string[]} [props.types] — 启用的题型，默认全部 ['firstLetter','dictation','selectWord','translate']
 * @param {(results: Array) => void} props.onComplete — 完成回调
 * @param {(input: string, answer: string, type: string) => {grade: string, feedback: string}} [props.customGrader] — 自定义评分
 * @param {number} [props.timeLimit] — 每题限时（秒），预留
 */
function QuizEngine({ words, types, onComplete, customGrader, timeLimit }) {
  const enabledTypes = types || Object.keys(QUIZ_TYPES)

  // Build quiz queue: for each word, pick a weighted random type
  const [queue] = useState(() => buildQueue(words, enabledTypes))
  const [currentIdx, setCurrentIdx] = useState(0)
  const [results, setResults] = useState([])
  const [phase, setPhase] = useState('quiz') // quiz | feedback | done
  const [lastResult, setLastResult] = useState(null)

  const currentItem = queue[currentIdx]
  const word = currentItem?.word
  const quizType = currentItem?.type
  const sentence = word?.sentences?.[0] || null

  const { hintLevel, currentHint, nextHint, resetHints } = useHints(word)

  const grader = customGrader || gradeAnswer

  const handleSubmit = useCallback(
    (input) => {
      if (!quizType || !word) return

      const config = QUIZ_TYPES[quizType]
      const expected = config.answerKey(word, sentence)
      const normalizedInput = config.normalize ? config.normalize(input) : input
      const normalizedAnswer = config.normalize ? config.normalize(expected) : expected

      const result = grader(normalizedInput, normalizedAnswer, quizType)
      const record = {
        wordId: word.id,
        word: word.word,
        type: quizType,
        input,
        expected,
        grade: result.grade,
        feedback: result.feedback,
        hintLevel,
      }

      setLastResult({ ...result, record })
      setResults((prev) => [...prev, record])
      setPhase('feedback')
    },
    [quizType, word, grader, sentence, hintLevel]
  )

  const handleNext = () => {
    resetHints()
    setLastResult(null)
    if (currentIdx < queue.length - 1) {
      setCurrentIdx((i) => i + 1)
      setPhase('quiz')
    } else {
      setPhase('done')
      onComplete?.(results)
    }
  }

  // -- Done --
  if (phase === 'done' || words.length === 0) {
    const perfect = results.filter((r) => r.grade === 'perfect').length
    const minor = results.filter((r) => r.grade === 'minor').length
    const retry = results.filter((r) => r.grade === 'retry').length

    return (
      <div className="space-y-4">
        <div className="text-center">
          <h3 className="text-lg font-bold">练习完成</h3>
          <p className="text-sm text-muted-foreground">
            {results.length} 题 · {queue.length} 词
          </p>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <Card>
            <CardContent className="p-3 text-center">
              <p className="text-2xl font-bold text-green-600">{perfect}</p>
              <p className="text-xs text-muted-foreground">正确</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 text-center">
              <p className="text-2xl font-bold text-yellow-600">{minor}</p>
              <p className="text-xs text-muted-foreground">小误</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 text-center">
              <p className="text-2xl font-bold text-red-600">{retry}</p>
              <p className="text-xs text-muted-foreground">需练</p>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // -- Active quiz --
  const progress = (currentIdx / queue.length) * 100
  const QuizComponent = QUIZ_TYPES[quizType]?.component

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Badge variant="secondary">
          {QUIZ_TYPES[quizType]?.label || quizType}
        </Badge>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>{currentIdx + 1}/{queue.length}</span>
          {timeLimit && (
            <span className="flex items-center gap-1">
              <Timer className="h-3 w-3" />
              {timeLimit}s
            </span>
          )}
        </div>
      </div>
      <Progress value={progress} />

      {/* Current word indicator */}
      <p className="text-center text-sm text-muted-foreground">
        当前单词: <span className="font-semibold text-foreground">{word.word}</span>
      </p>

      {/* Quiz component or feedback */}
      {phase === 'quiz' && QuizComponent && (
        <QuizComponent
          word={word}
          sentence={sentence}
          onSubmit={handleSubmit}
          onHint={nextHint}
          hintText={currentHint}
        />
      )}

      {phase === 'feedback' && lastResult && (
        <div className="space-y-3">
          <div
            className={cn(
              'flex items-start gap-2 rounded-lg border p-4',
              lastResult.grade === 'perfect' && 'border-green-200 bg-green-50',
              lastResult.grade === 'minor' && 'border-yellow-200 bg-yellow-50',
              lastResult.grade === 'retry' && 'border-red-200 bg-red-50'
            )}
          >
            {lastResult.grade === 'perfect' && (
              <Check className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
            )}
            {lastResult.grade === 'minor' && (
              <Lightbulb className="h-5 w-5 text-yellow-600 shrink-0 mt-0.5" />
            )}
            {lastResult.grade === 'retry' && (
              <X className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
            )}
            <div>
              <p className="text-sm font-medium">
                {lastResult.grade === 'perfect' && '回答正确！'}
                {lastResult.grade === 'minor' && '基本正确，有小错误'}
                {lastResult.grade === 'retry' && '回答不正确'}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {lastResult.feedback}
              </p>
              {lastResult.record?.input && (
                <p className="text-xs mt-1">
                  你的答案: <span className="font-mono">{lastResult.record.input}</span>
                </p>
              )}
            </div>
          </div>

          <Button className="w-full" onClick={handleNext}>
            {currentIdx < queue.length - 1 ? '下一题' : '查看结果'}
          </Button>
        </div>
      )}

      {/* Steak placeholder */}
      <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
        <Zap className="h-3 w-3" />
        <span>连对奖励 · 难度自适应 — 开发中</span>
      </div>
    </div>
  )
}

/**
 * Build quiz queue: one quiz per word, weighted random type selection
 */
function buildQueue(words, enabledTypes) {
  const weights = {}
  enabledTypes.forEach((t) => {
    weights[t] = QUIZ_TYPE_WEIGHTS[t] ?? 1
  })

  return words.map((word) => ({
    word,
    type: weightedPick(weights),
  }))
}

function weightedPick(weights) {
  const entries = Object.entries(weights)
  const total = entries.reduce((s, [, w]) => s + w, 0)
  let r = Math.random() * total
  for (const [key, w] of entries) {
    r -= w
    if (r <= 0) return key
  }
  return entries[0][0]
}

export { QUIZ_TYPES }
export default QuizEngine
