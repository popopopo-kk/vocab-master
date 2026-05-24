import { useState, useRef, useCallback } from 'react'
import { Volume2, ChevronLeft, ChevronRight, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

/**
 * 单词翻转卡片组件
 * @param {Object} props
 * @param {Object} props.word — 单词数据 { id, word, phonetic, meaning, sentences, mastered }
 * @param {boolean} [props.showPhonetic=true] — 是否显示音标
 * @param {boolean} [props.showMeaning] — 外部控制是否显示释义面（翻转）
 * @param {(quality: number) => void} [props.onRate] — 评分回调 quality: 5=认识 3=模糊 1=不认识
 * @param {() => void} [props.onMaster] — 标记已掌握
 * @param {(sentenceIdx: number) => void} [props.onFavorite] — 收藏句子
 * @param {(word: string) => void} [props.onPlaySound] — 播放发音回调（覆盖内置播放）
 * @param {number} [props.playbackRate=1.0] — 播放速率
 * @param {"horizontal"|"vertical"} [props.flipDirection="horizontal"] — 翻转方向
 */
function WordCard({
  word,
  showPhonetic = true,
  showMeaning: externalFlipped,
  onRate,
  onMaster,
  onFavorite,
  onPlaySound,
  playbackRate = 1.0,
  flipDirection = 'horizontal',
}) {
  const [internalFlipped, setInternalFlipped] = useState(false)
  const [sentenceIdx, setSentenceIdx] = useState(0)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const synthRef = useRef(null)

  const isFlipped = externalFlipped !== undefined ? externalFlipped : internalFlipped

  const sentences = word.sentences || []
  const currentSentence = sentences[sentenceIdx] || { en: '', cn: '', source: '' }

  const handleFlip = () => {
    setInternalFlipped((v) => !v)
    setSentenceIdx(0)
  }

  const handlePlay = useCallback(
    (e) => {
      e.stopPropagation()
      if (onPlaySound) {
        onPlaySound(word.word)
        return
      }
      if (!window.speechSynthesis) return

      if (isSpeaking) {
        window.speechSynthesis.cancel()
        setIsSpeaking(false)
        return
      }

      const utterance = new SpeechSynthesisUtterance(word.word)
      utterance.rate = playbackRate
      utterance.lang = 'en-US'
      utterance.onend = () => setIsSpeaking(false)
      utterance.onerror = () => setIsSpeaking(false)

      setIsSpeaking(true)
      window.speechSynthesis.speak(utterance)
      synthRef.current = utterance
    },
    [word.word, playbackRate, isSpeaking, onPlaySound]
  )

  const handleRate = (quality) => {
    if (onRate) {
      setInternalFlipped(false)
      setSentenceIdx(0)
      onRate(quality)
    }
  }

  const prevSentence = (e) => {
    e.stopPropagation()
    setSentenceIdx((v) => (v > 0 ? v - 1 : sentences.length - 1))
  }

  const nextSentence = (e) => {
    e.stopPropagation()
    setSentenceIdx((v) => (v < sentences.length - 1 ? v + 1 : 0))
  }

  const flipClass =
    flipDirection === 'vertical' ? 'rotateX-180' : 'rotateY-180'

  return (
    <div className="w-full max-w-xs sm:max-w-sm mx-auto select-none px-1 sm:px-0">
      {/* Card container with 3D perspective */}
      <div
        className="relative cursor-pointer"
        style={{ perspective: '800px', height: 'clamp(260px, 50vh, 340px)' }}
        onClick={handleFlip}
      >
        <div
          className={cn(
            'relative w-full h-full transition-transform duration-500',
            'transform-gpu',
            isFlipped && flipClass
          )}
          style={{ transformStyle: 'preserve-3d' }}
        >
          {/* Front face */}
          <div
            className="absolute inset-0 flex flex-col items-center justify-center rounded-xl border bg-card p-6 shadow-md"
            style={{ backfaceVisibility: 'hidden' }}
          >
            {/* Master badge */}
            {word.mastered && (
              <Badge variant="secondary" className="absolute top-3 right-3">
                已掌握
              </Badge>
            )}

            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">{word.word}</h2>

            {showPhonetic && word.phonetic && (
              <p className="mt-2 text-sm text-muted-foreground">{word.phonetic}</p>
            )}

            <Button
              variant={isSpeaking ? 'default' : 'outline'}
              size="icon"
              className="mt-4 rounded-full"
              onClick={handlePlay}
            >
              <Volume2 className="h-5 w-5" />
            </Button>

            {word.level && (
              <Badge variant="outline" className="mt-3 uppercase text-xs">
                {word.level}
              </Badge>
            )}

            <p className="mt-6 text-xs text-muted-foreground">
              点击卡片翻转查看释义
            </p>
          </div>

          {/* Back face */}
          <div
            className={cn(
              'absolute inset-0 flex flex-col rounded-xl border bg-card p-6 shadow-md',
              flipDirection === 'vertical' ? '-rotateX-180' : 'rotateY-180'
            )}
            style={{ backfaceVisibility: 'hidden' }}
          >
            <div className="flex-1 flex flex-col items-center justify-center">
              <p className="text-lg font-semibold text-center">{word.meaning}</p>

              {/* Sentences */}
              {sentences.length > 0 && (
                <div className="mt-4 w-full">
                  <div className="flex items-center justify-between">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={prevSentence}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>

                    <div className="flex-1 text-center px-2">
                      <p className="text-sm leading-relaxed">
                        {currentSentence.en}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {currentSentence.cn}
                      </p>
                      {currentSentence.source && (
                        <Badge variant="outline" className="mt-1 text-[10px] px-1 py-0">
                          {currentSentence.source}
                        </Badge>
                      )}
                    </div>

                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={nextSentence}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Sentence dots */}
                  {sentences.length > 1 && (
                    <div className="flex justify-center gap-1 mt-2">
                      {sentences.map((_, i) => (
                        <span
                          key={i}
                          className={cn(
                            'block h-1.5 w-1.5 rounded-full transition-colors',
                            i === sentenceIdx
                              ? 'bg-primary'
                              : 'bg-muted-foreground/30'
                          )}
                        />
                      ))}
                    </div>
                  )}

                  {/* Favorite sentence */}
                  {onFavorite && (
                    <div className="flex justify-center mt-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={(e) => {
                          e.stopPropagation()
                          onFavorite(sentenceIdx)
                        }}
                      >
                        <Star className="mr-1 h-3 w-3" />
                        收藏此句
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Rating buttons */}
      <div className="grid grid-cols-3 gap-2 mt-4">
        <Button
          variant="outline"
          className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
          onClick={() => handleRate(1)}
        >
          不认识
        </Button>
        <Button
          variant="outline"
          className="border-yellow-200 text-yellow-600 hover:bg-yellow-50 hover:text-yellow-700"
          onClick={() => handleRate(3)}
        >
          模糊
        </Button>
        <Button
          variant="outline"
          className="border-green-200 text-green-600 hover:bg-green-50 hover:text-green-700"
          onClick={() => handleRate(5)}
        >
          认识
        </Button>
      </div>

      {/* Master button */}
      {onMaster && (
        <div className="flex justify-center mt-3">
          <Button
            variant="ghost"
            size="sm"
            className="text-xs"
            onClick={() => onMaster()}
          >
            标记已掌握，移入低频复习池
          </Button>
        </div>
      )}
    </div>
  )
}

export default WordCard
