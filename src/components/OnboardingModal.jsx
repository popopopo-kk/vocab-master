import { useState } from 'react'
import { GraduationCap, BookOpen, Target, Sliders, Check, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

const TARGET_LEVELS = [
  { value: 'beginner', label: '零基础', desc: '从最常用词汇开始' },
  { value: 'cet4', label: '四六级', desc: '大学英语四六级词库' },
  { value: 'postgrad', label: '考研', desc: '研究生入学考试词汇' },
  { value: 'ielts', label: '雅思', desc: 'IELTS 学术词汇' },
  { value: 'toefl', label: '托福', desc: 'TOEFL iBT 词库' },
  { value: 'academic', label: '学术', desc: '学术论文高频词汇' },
]

const DAILY_OPTIONS = [10, 20, 30, 50]

const QUIZ_TYPE_OPTIONS = [
  { value: 'firstLetter', label: '首字母填空' },
  { value: 'dictation', label: '听写' },
  { value: 'selectWord', label: '选词填空' },
  { value: 'translate', label: '中译英' },
]

const TOTAL_STEPS = 4

/**
 * 首次引导流程模态框
 * @param {Object} props
 * @param {boolean} props.open
 * @param {(open: boolean) => void} props.onOpenChange
 * @param {(config: Object) => void} props.onComplete — 完成回调，传入用户配置
 */
function OnboardingModal({ open, onOpenChange, onComplete }) {
  const [step, setStep] = useState(0)
  const [targetLevel, setTargetLevel] = useState('cet4')
  const [dailyCount, setDailyCount] = useState(20)
  const [quizTypes, setQuizTypes] = useState(
    QUIZ_TYPE_OPTIONS.map((q) => q.value)
  )

  const progress = ((step + 1) / TOTAL_STEPS) * 100

  const toggleQuizType = (type) => {
    setQuizTypes((prev) =>
      prev.includes(type)
        ? prev.filter((t) => t !== type)
        : [...prev, type]
    )
  }

  const handleComplete = () => {
    onComplete({
      targetLevel,
      dailyNewCount: dailyCount,
      preferredQuizTypes: quizTypes,
      onboardingComplete: true,
      onboardingDate: new Date().toISOString(),
    })
    onOpenChange?.(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        {/* Progress */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>第 {step + 1} / {TOTAL_STEPS} 步</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} />
        </div>

        {/* Step 0 — Welcome */}
        {step === 0 && (
          <div className="space-y-5 text-center py-4">
            <Sparkles className="mx-auto h-12 w-12 text-primary" />
            <DialogHeader>
              <DialogTitle className="text-xl">欢迎使用 Vocab Master</DialogTitle>
              <DialogDescription>
                基于 SM-2 间隔记忆算法的智能背单词工具
                <br />
                只需 4 步，开始你的学习之旅
              </DialogDescription>
            </DialogHeader>
            <Button className="w-full" onClick={() => setStep(1)}>
              开始设置
            </Button>
          </div>
        )}

        {/* Step 1 — Target Level */}
        {step === 1 && (
          <div className="space-y-4 py-2">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                选择目标阶段
              </DialogTitle>
              <DialogDescription>
                词库将根据你的目标调整词汇范围
              </DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-2">
              {TARGET_LEVELS.map((lvl) => (
                <button
                  key={lvl.value}
                  className={cn(
                    'flex flex-col items-center gap-1 rounded-lg border p-3 text-left transition-colors',
                    targetLevel === lvl.value
                      ? 'border-primary bg-primary/5 ring-1 ring-primary'
                      : 'border-input hover:border-primary/50 hover:bg-muted'
                  )}
                  onClick={() => setTargetLevel(lvl.value)}
                >
                  <span className="text-sm font-medium">{lvl.label}</span>
                  <span className="text-[10px] text-muted-foreground">
                    {lvl.desc}
                  </span>
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep(0)}>上一步</Button>
              <Button className="flex-1" onClick={() => setStep(2)}>下一步</Button>
            </div>
          </div>
        )}

        {/* Step 2 — Daily Count */}
        {step === 2 && (
          <div className="space-y-4 py-2">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                每日新词量
              </DialogTitle>
              <DialogDescription>
                建议每天 10-20 个以保证复习质量
              </DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-4 gap-2">
              {DAILY_OPTIONS.map((n) => (
                <button
                  key={n}
                  className={cn(
                    'rounded-lg border px-4 py-3 text-center text-lg font-bold transition-colors',
                    dailyCount === n
                      ? 'border-primary bg-primary/5 ring-1 ring-primary'
                      : 'border-input hover:border-primary/50 hover:bg-muted'
                  )}
                  onClick={() => setDailyCount(n)}
                >
                  {n}
                </button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground text-center">
              可在设置中随时调整
            </p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep(1)}>上一步</Button>
              <Button className="flex-1" onClick={() => setStep(3)}>下一步</Button>
            </div>
          </div>
        )}

        {/* Step 3 — Quiz Types */}
        {step === 3 && (
          <div className="space-y-4 py-2">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Sliders className="h-5 w-5" />
                偏好题型
              </DialogTitle>
              <DialogDescription>
                选择你喜欢的练习方式（可多选，后续可调整）
              </DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-2">
              {QUIZ_TYPE_OPTIONS.map((q) => {
                const selected = quizTypes.includes(q.value)
                return (
                  <button
                    key={q.value}
                    className={cn(
                      'flex items-center gap-2 rounded-lg border p-3 transition-colors',
                      selected
                        ? 'border-primary bg-primary/5'
                        : 'border-input hover:border-primary/50 opacity-60'
                    )}
                    onClick={() => toggleQuizType(q.value)}
                  >
                    <div
                      className={cn(
                        'h-4 w-4 rounded border-2 flex items-center justify-center transition-colors',
                        selected
                          ? 'border-primary bg-primary'
                          : 'border-muted-foreground'
                      )}
                    >
                      {selected && <Check className="h-3 w-3 text-primary-foreground" />}
                    </div>
                    <span className="text-sm">{q.label}</span>
                  </button>
                )
              })}
            </div>
            {quizTypes.length === 0 && (
              <p className="text-xs text-destructive text-center">
                请至少选择一种题型
              </p>
            )}
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep(2)}>上一步</Button>
              <Button
                className="flex-1"
                onClick={handleComplete}
                disabled={quizTypes.length === 0}
              >
                <GraduationCap className="mr-2 h-4 w-4" />
                开始学习
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

export { TARGET_LEVELS, DAILY_OPTIONS }
export default OnboardingModal
