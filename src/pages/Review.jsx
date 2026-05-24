import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Trophy, BarChart3, BookOpenCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Card, CardContent } from '@/components/ui/card'
import WordCard from '@/components/WordCard'
import QuizModal from '@/components/QuizModal'
import EmptyState from '@/components/EmptyState'
import AchievementEffect from '@/components/AchievementEffect'
import { getDueReviews, calculateNextReview, getMistakeWords, seedIfEmpty } from '@/utils/srs'
import { getSettings, saveWords, saveSettings, getWords } from '@/utils/storage'
import TEST_WORDS from '@/data/words'

/**
 * 复习模式枚举
 * @readonly
 */
const REVIEW_MODES = {
  allDue: '全部到期',
  mistakesOnly: '仅错词',
  random: '随机抽查',
}

function Review() {
  const navigate = useNavigate()
  const [words, setWords] = useState([])
  const [currentIdx, setCurrentIdx] = useState(0)
  const [completed, setCompleted] = useState(false)
  const [results, setResults] = useState([])
  const [reviewMode, setReviewMode] = useState('allDue')
  const [showQuiz, setShowQuiz] = useState(false)
  const [, setSavedSentences] = useState([])

  const loadWords = useCallback(async () => {
    await seedIfEmpty(TEST_WORDS)

    const settings = await getSettings()
    const mode = settings.reviewMode || 'allDue'
    setReviewMode(mode)

    let reviewWords
    if (mode === 'mistakesOnly') {
      reviewWords = await getMistakeWords()
    } else if (mode === 'random') {
      reviewWords = await getDueReviews()
      reviewWords = shuffle(reviewWords)
    } else {
      reviewWords = await getDueReviews()
    }

    setWords(reviewWords)
  }, [])

  useEffect(() => {
    loadWords()
  }, [loadWords])

  const handleRate = async (quality) => {
    const word = words[currentIdx]
    if (!word) return

    await calculateNextReview(word.id, quality)

    setResults((prev) => [
      ...prev,
      { wordId: word.id, word: word.word, quality },
    ])

    if (currentIdx < words.length - 1) {
      setCurrentIdx((i) => i + 1)
    } else {
      setCompleted(true)
    }
  }

  const handleMaster = async () => {
    const word = words[currentIdx]
    if (!word) return

    const allWords = await getWords()
    const target = allWords.find((w) => w.id === word.id)
    if (target) {
      target.mastered = true
      // 移入低频复习池：设置更长的复习间隔
      target.srs = target.srs || {
        easeFactor: 2.5,
        interval: 0,
        repetition: 0,
        nextReview: null,
        lastReview: null,
      }
      target.srs.interval = 90
      const next = new Date()
      next.setDate(next.getDate() + 90)
      target.srs.nextReview = next.toISOString().split('T')[0]
      target.srs.easeFactor = 2.8
      await saveWords(allWords)
    }

    setResults((prev) => [
      ...prev,
      { wordId: word.id, word: word.word, quality: 5, mastered: true },
    ])

    if (currentIdx < words.length - 1) {
      setCurrentIdx((i) => i + 1)
    } else {
      setCompleted(true)
    }
  }

  const handleFavorite = async (sentenceIdx) => {
    const word = words[currentIdx]
    const sentence = word.sentences?.[sentenceIdx]
    if (!sentence) return

    const settings = await getSettings()
    const favorites = settings.favoriteSentences || []
    favorites.push({
      id: `${word.id}_s${sentenceIdx}`,
      wordId: word.id,
      word: word.word,
      en: sentence.en,
      cn: sentence.cn,
      source: sentence.source,
    })
    settings.favoriteSentences = favorites
    await saveSettings(settings)
    setSavedSentences((prev) => [...prev, sentenceIdx])
  }

  const prevWord = () => {
    if (currentIdx > 0) setCurrentIdx((i) => i - 1)
  }

  const nextWord = () => {
    if (currentIdx < words.length - 1) setCurrentIdx((i) => i + 1)
  }

  // -- Completion --
  if (completed) {
    const knownCount = results.filter((r) => r.quality >= 4 || r.mastered).length
    const fuzzyCount = results.filter((r) => r.quality === 3).length
    const unknownCount = results.filter((r) => r.quality <= 2).length
    const masteredCount = results.filter((r) => r.mastered).length
    const avgQuality =
      results.length > 0
        ? (results.reduce((s, r) => s + r.quality, 0) / results.length).toFixed(1)
        : 0

    return (
      <div className="p-4 space-y-5 animate-fade-in">
        <AchievementEffect trigger={true} type="complete" />
        <div className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <Trophy className="h-8 w-8 text-green-600" />
          </div>
          <h2 className="mt-3 text-xl font-bold">复习完成</h2>
          <p className="text-sm text-muted-foreground">
            本次复习 {words.length} 个单词
          </p>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <Card>
            <CardContent className="p-3 text-center">
              <p className="text-2xl font-bold text-green-600">{knownCount}</p>
              <p className="text-xs text-muted-foreground">认识</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 text-center">
              <p className="text-2xl font-bold text-yellow-600">{fuzzyCount}</p>
              <p className="text-xs text-muted-foreground">模糊</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 text-center">
              <p className="text-2xl font-bold text-red-600">{unknownCount}</p>
              <p className="text-xs text-muted-foreground">不认识</p>
            </CardContent>
          </Card>
        </div>

        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <BarChart3 className="h-4 w-4" />
          <span>平均记忆质量: {avgQuality} / 5</span>
        </div>

        {masteredCount > 0 && (
          <div className="flex items-center justify-center gap-2 text-sm text-blue-600">
            <BookOpenCheck className="h-4 w-4" />
            <span>{masteredCount} 个单词已移入低频复习池</span>
          </div>
        )}

        <div className="space-y-2">
          <Button className="w-full" onClick={() => setShowQuiz(true)}>
            巩固测验
          </Button>
          <Button className="w-full" onClick={() => navigate('/study')}>
            继续学习新词
          </Button>
          <Button
            variant="outline"
            className="w-full"
            onClick={() => navigate('/')}
          >
            返回首页
          </Button>
        </div>

        <QuizModal
          open={showQuiz}
          onOpenChange={setShowQuiz}
          words={words}
          onClose={() => navigate('/')}
        />
      </div>
    )
  }

  // -- Empty state --
  if (words.length === 0) {
    return (
      <EmptyState
        icon="review"
        title="暂无需要复习的单词"
        description="复习队列为空，去学习新词吧"
        actionLabel="去学习"
        onAction={() => navigate('/study')}
      />
    )
  }

  // -- Active review --
  const word = words[currentIdx]
  const progress = ((currentIdx + (results.some((r) => r.wordId === word?.id) ? 1 : 0)) / words.length) * 100

  return (
    <div className="flex flex-col min-h-[calc(100vh-4rem)]">
      {/* Top bar */}
      <div className="px-4 pt-3 space-y-2">
        <div className="flex items-center justify-between">
          <Badge variant="secondary">
            {currentIdx + 1} / {words.length}
          </Badge>
          <span className="text-xs text-muted-foreground">
            {REVIEW_MODES[reviewMode] || '全部到期'}
          </span>
        </div>
        <Progress value={progress} />
      </div>

      {/* Word card */}
      <div className="flex-1 flex items-center justify-center px-4 py-6">
        <WordCard
          word={word}
          onRate={handleRate}
          onMaster={handleMaster}
          onFavorite={handleFavorite}
        />
      </div>

      {/* Bottom nav */}
      <div className="flex items-center justify-between px-4 pb-4 pt-2">
        <Button
          variant="ghost"
          size="sm"
          disabled={currentIdx === 0}
          onClick={prevWord}
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          上一个
        </Button>

        <span className="text-xs text-muted-foreground">
          {word.srs?.nextReview
            ? `下次复习: ${word.srs.nextReview}`
            : '首次复习'}
        </span>

        <Button
          variant="ghost"
          size="sm"
          disabled={currentIdx === words.length - 1}
          onClick={nextWord}
        >
          下一个
          <ArrowRight className="ml-1 h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

/** Fisher-Yates shuffle */
function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export default Review
