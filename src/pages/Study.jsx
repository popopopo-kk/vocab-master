import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Trophy, BarChart3 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Card, CardContent } from '@/components/ui/card'
import WordCard from '@/components/WordCard'
import QuizModal from '@/components/QuizModal'
import EmptyState from '@/components/EmptyState'
import AchievementEffect from '@/components/AchievementEffect'
import { getNewWords, calculateNextReview, seedIfEmpty } from '@/utils/srs'
import { getSettings, saveSettings } from '@/utils/storage'
import TEST_WORDS from '@/data/words'

/**
 * 学习模式枚举
 * @readonly
 */
const STUDY_MODES = {
  sequential: '顺序',
  random: '随机',
  hardFirst: '难词优先',
}

function Study() {
  const navigate = useNavigate()
  const [words, setWords] = useState([])
  const [currentIdx, setCurrentIdx] = useState(0)
  const [completed, setCompleted] = useState(false)
  const [results, setResults] = useState([])
  const [studyMode, setStudyMode] = useState('sequential')
  const [showQuiz, setShowQuiz] = useState(false)
  const [, setSavedSentences] = useState([])

  const loadWords = useCallback(async () => {
    await seedIfEmpty(TEST_WORDS)

    const settings = await getSettings()
    const dailyCount = settings.dailyNewCount || 10
    const mode = settings.studyMode || 'sequential'

    let newWords = await getNewWords(dailyCount)

    if (mode === 'random') {
      newWords = shuffle(newWords)
    } else if (mode === 'hardFirst') {
      newWords.sort((a, b) => (b.mistakeCount || 0) - (a.mistakeCount || 0))
    }

    setStudyMode(mode)
    setWords(newWords)
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

  const handleMaster = async () => {
    const word = words[currentIdx]
    if (!word) return
    // Master via high-quality pass
    await calculateNextReview(word.id, 5, 2.8)
    if (currentIdx < words.length - 1) {
      setCurrentIdx((i) => i + 1)
    } else {
      setCompleted(true)
    }
  }

  const prevWord = () => {
    if (currentIdx > 0) setCurrentIdx((i) => i - 1)
  }

  const nextWord = () => {
    if (currentIdx < words.length - 1) setCurrentIdx((i) => i + 1)
  }

  // -- Completion page --
  if (completed) {
    const knownCount = results.filter((r) => r.quality >= 4).length
    const fuzzyCount = results.filter((r) => r.quality === 3).length
    const unknownCount = results.filter((r) => r.quality <= 2).length
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
          <h2 className="mt-3 text-xl font-bold">学习完成</h2>
          <p className="text-sm text-muted-foreground">
            本次学习 {words.length} 个单词
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

        <div className="space-y-2">
          <Button className="w-full" onClick={() => setShowQuiz(true)}>
            直接开始巩固练习
          </Button>
          <Button
            variant="outline"
            className="w-full"
            onClick={() => navigate('/')}
          >
            稍后练习
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
        icon="study"
        title="暂无可学习的新词"
        description="所有单词都已进入学习队列，去复习或导入新词吧"
        actionLabel="返回首页"
        onAction={() => navigate('/')}
      />
    )
  }

  // -- Active study --
  const word = words[currentIdx]
  const progress = ((currentIdx + (results.some((r) => r.wordId === word?.id) ? 1 : 0)) / words.length) * 100

  return (
    <div className="flex flex-col min-h-[calc(100vh-4rem)]">
      {/* Top bar: mode + progress */}
      <div className="px-4 pt-3 space-y-2">
        <div className="flex items-center justify-between">
          <Badge variant="secondary">
            {currentIdx + 1} / {words.length}
          </Badge>
          {/* Study mode placeholder */}
          <span className="text-xs text-muted-foreground">
            {STUDY_MODES[studyMode] || '顺序'}
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
          {word.level?.toUpperCase()}
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

export default Study
