import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { BookOpen, RotateCcw, Trophy, AlertTriangle, Brain, ArrowRight } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Switch } from '@/components/ui/switch'
import { getStudyLog, getSettings, saveSettings } from '@/utils/storage'
import { getDueReviews, getMasteredWords, getMistakeWords, seedIfEmpty } from '@/utils/srs'
import { REVIEW_WARNING_THRESHOLD } from '@/config/app'
import { HomeSkeleton } from '@/components/Skeleton'
import TEST_WORDS from '@/data/words'

function today() {
  return new Date().toISOString().split('T')[0]
}

function Home() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ studied: 0, due: 0, mastered: 0, mistakes: 0 })
  const [smartMode, setSmartMode] = useState(false)

  const loadStats = useCallback(async () => {
    await seedIfEmpty(TEST_WORDS)

    const [log, dueReviews, mastered, mistakes] = await Promise.all([
      getStudyLog(),
      getDueReviews(),
      getMasteredWords(),
      getMistakeWords(),
    ])

    const todayStr = today()
    const studiedToday = log.filter(
      (entry) => entry.date === todayStr && entry.type === 'new'
    ).length

    setStats({
      studied: studiedToday,
      due: dueReviews.length,
      mastered: mastered.length,
      mistakes: mistakes.length,
    })

    const settings = await getSettings()
    setSmartMode(settings.smartMode || false)
    setLoading(false)
  }, [])

  useEffect(() => {
    loadStats()
  }, [loadStats])

  const handleSmartModeToggle = async (checked) => {
    setSmartMode(checked)
    const settings = await getSettings()
    settings.smartMode = checked
    await saveSettings(settings)
  }

  const showWarning = stats.due > REVIEW_WARNING_THRESHOLD
  const totalWords = 20
  const masteredPercent = totalWords > 0 ? Math.round((stats.mastered / totalWords) * 100) : 0

  const smartRecommend = smartMode
    ? { newCount: Math.max(1, Math.round(stats.due * 0.33)), reviewTarget: stats.due }
    : null

  if (loading) return <HomeSkeleton />

  return (
    <div className="p-4 space-y-5 animate-fade-in">
      {/* 顶部统计卡片 */}
      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <BookOpen className="h-4 w-4 text-blue-500" />
              今日新学
            </div>
            <p className="text-2xl font-bold mt-1">{stats.studied}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <RotateCcw className="h-4 w-4 text-orange-500" />
              待复习
            </div>
            <p className="text-2xl font-bold mt-1">{stats.due}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Trophy className="h-4 w-4 text-green-500" />
              已掌握
            </div>
            <p className="text-2xl font-bold mt-1">{stats.mastered}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              错词数
            </div>
            <p className="text-2xl font-bold mt-1">{stats.mistakes}</p>
          </CardContent>
        </Card>
      </div>

      {/* 掌握进度条 */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">掌握进度</span>
          <span>{masteredPercent}%</span>
        </div>
        <Progress value={masteredPercent} />
      </div>

      {/* 双入口按钮 */}
      <div className="grid grid-cols-2 gap-3">
        <Button
          className="h-20 text-base font-semibold bg-blue-500 hover:bg-blue-600"
          onClick={() => navigate('/study')}
        >
          <BookOpen className="mr-2 h-5 w-5" />
          今日新学
        </Button>
        <Button
          className="h-20 text-base font-semibold bg-orange-500 hover:bg-orange-600"
          onClick={() => navigate('/review')}
        >
          <RotateCcw className="mr-2 h-5 w-5" />
          今日复习
        </Button>
      </div>

      {/* 预警横幅 */}
      {showWarning && (
        <div className="flex items-center justify-between rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-3">
          <div className="flex items-center gap-2 text-sm text-yellow-700">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>复习队列较满，建议优先巩固旧词</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-yellow-700 hover:text-yellow-800 shrink-0"
            onClick={() => navigate('/review')}
          >
            去复习
            <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
        </div>
      )}

      {/* 智能模式 */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm font-medium">智能推荐模式</p>
                <p className="text-xs text-muted-foreground">
                  自动推荐今日计划（新词:复习 = 1:3）
                </p>
              </div>
            </div>
            <Switch checked={smartMode} onCheckedChange={handleSmartModeToggle} />
          </div>

          {smartMode && smartRecommend && (
            <div className="mt-3 flex items-center gap-2 rounded-md bg-muted px-3 py-2 text-sm">
              <Badge variant="secondary">今日推荐</Badge>
              <span>
                新学 {smartRecommend.newCount} 词 + 复习 {smartRecommend.reviewTarget} 词
              </span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default Home
