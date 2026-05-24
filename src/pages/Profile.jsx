import { useState, useEffect, useCallback } from 'react'
import {
  Bookmark, BarChart3, Upload, BookOpen, Settings, Download,
  Star, Trash2, TrendingUp, FileInput, AlertTriangle, Check,
  FileDown, FileUp, Eraser, Target,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Switch } from '@/components/ui/switch'
import { getSettings, saveSettings, getStudyLog, getWords, saveWords } from '@/utils/storage'
import { getMasteredWords, getMistakeWords } from '@/utils/srs'
import { extractWords, toWordEntries } from '@/utils/wordExtractor'
import { TARGET_LEVELS, DAILY_OPTIONS } from '@/components/OnboardingModal'

function Profile() {
  const [activeTab, setActiveTab] = useState('favorites')
  const [favorites, setFavorites] = useState([])
  const [favFilter, setFavFilter] = useState('all')
  const [studyStats, setStudyStats] = useState(null)
  const [settings, setSettings] = useState({})

  // Import tab state
  const [importText, setImportText] = useState('')
  const [extractedWords, setExtractedWords] = useState([])
  const [importDone, setImportDone] = useState(false)

  // Clear data confirm state
  const [confirmClear, setConfirmClear] = useState(false)

  const loadData = useCallback(async () => {
    const s = await getSettings()
    setSettings(s)

    // Favorites
    const allFavs = [
      ...(s.favoriteWords || []).map((w) => ({ ...w, type: 'word' })),
      ...(s.favoriteSentences || []).map((s) => ({ ...s, type: 'sentence' })),
    ]
    setFavorites(allFavs)

    // Study stats
    const log = await getStudyLog()
    const words = await getWords()
    const mastered = await getMasteredWords()

    const today = new Date().toISOString().split('T')[0]
    const todayLog = log.filter((e) => e.date === today)

    const last7Days = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const ds = d.toISOString().split('T')[0]
      last7Days.push({
        date: ds,
        count: log.filter((e) => e.date === ds).length,
      })
    }

    const avgQuality =
      log.length > 0
        ? (log.reduce((s, e) => s + (e.quality || 0), 0) / log.length).toFixed(1)
        : 0

    // Memory retention rate: words with interval >= 7 days / total studied
    const studied = words.filter((w) => w.srs?.lastReview)
    const retained = studied.filter((w) => (w.srs?.interval || 0) >= 7)
    const retentionRate = studied.length > 0
      ? Math.round((retained.length / studied.length) * 100)
      : 0

    setStudyStats({
      totalWords: words.length,
      mastered: mastered.length,
      todayStudied: todayLog.length,
      totalReviews: log.length,
      avgQuality,
      last7Days,
      streak: calcStreak(log),
      retentionRate,
      studiedCount: studied.length,
      retainedCount: retained.length,
    })
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const calcStreak = (log) => {
    let streak = 0
    const today = new Date()
    for (let i = 0; i < 365; i++) {
      const d = new Date(today)
      d.setDate(d.getDate() - i)
      const ds = d.toISOString().split('T')[0]
      if (log.some((e) => e.date === ds && e.type === 'new')) {
        streak++
      } else {
        break
      }
    }
    return streak
  }

  // -- Favorites --
  const handleRemoveFavorite = async (id) => {
    const s = { ...settings }
    s.favoriteWords = (s.favoriteWords || []).filter((w) => w.id !== id)
    s.favoriteSentences = (s.favoriteSentences || []).filter(
      (sent) => sent.id !== id
    )
    await saveSettings(s)
    setSettings(s)
    setFavorites((prev) => prev.filter((f) => f.id !== id))
  }

  const handleExportFavorites = () => {
    const data = JSON.stringify(favorites, null, 2)
    downloadJSON(data, 'vocab-favorites.json')
  }

  // -- Settings --
  const handleSettingChange = async (key, value) => {
    const s = { ...settings, [key]: value }
    setSettings(s)
    await saveSettings(s)
  }

  // -- Target level change: update all word levels --
  const handleLevelChange = async (level) => {
    const words = await getWords()
    words.forEach((w) => {
      if (w.source !== 'imported') {
        w.level = level
      }
    })
    await saveWords(words)
    handleSettingChange('targetLevel', level)
  }

  // -- Data export --
  const handleExportData = async () => {
    const words = await getWords()
    const log = await getStudyLog()
    const s = await getSettings()
    const data = JSON.stringify({ words, studyLog: log, settings: s }, null, 2)
    downloadJSON(data, `vocab-backup-${new Date().toISOString().split('T')[0]}.json`)
  }

  // -- Data import --
  const handleImportData = async () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = async (e) => {
      const file = e.target.files?.[0]
      if (!file) return
      try {
        const text = await file.text()
        const data = JSON.parse(text)
        if (data.words) await saveWords(data.words)
        if (data.settings) await saveSettings({ ...settings, ...data.settings })
        alert('数据导入成功！')
        loadData()
      } catch {
        alert('文件格式错误，请检查 JSON 格式')
      }
    }
    input.click()
  }

  // -- Clear data --
  const handleClearData = async () => {
    if (!confirmClear) {
      setConfirmClear(true)
      return
    }
    localStorage.clear()
    setConfirmClear(false)
    alert('数据已清空，刷新页面后重新开始')
    window.location.reload()
  }

  // -- Text import --
  const handleExtractWords = () => {
    if (!importText.trim()) return
    const extracted = extractWords(importText, { minLength: 3 })
    setExtractedWords(extracted)
    setImportDone(false)
  }

  const handleImportToWordBank = async () => {
    const entries = toWordEntries(extractedWords, 'imported')
    const existing = await getWords()
    const existingWords = new Set(existing.map((w) => w.word.toLowerCase()))
    const newEntries = entries.filter((e) => !existingWords.has(e.word.toLowerCase()))
    await saveWords([...existing, ...newEntries])
    setImportDone(true)
    setExtractedWords([])
    setImportText('')
    loadData()
  }

  // -- Helpers --
  const downloadJSON = (data, filename) => {
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  const filteredFavs =
    favFilter === 'all'
      ? favorites
      : favorites.filter((f) => f.type === favFilter)

  return (
    <div className="p-3 sm:p-4 pb-20">
      <h1 className="text-xl sm:text-2xl font-bold mb-4">我的</h1>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-5 mb-4 h-auto">
          <TabsTrigger value="favorites" className="text-[10px] sm:text-xs py-1.5">
            收藏
          </TabsTrigger>
          <TabsTrigger value="stats" className="text-[10px] sm:text-xs py-1.5">
            统计
          </TabsTrigger>
          <TabsTrigger value="import" className="text-[10px] sm:text-xs py-1.5">
            导入
          </TabsTrigger>
          <TabsTrigger value="mistakeBook" className="text-[10px] sm:text-xs py-1.5">
            错词本
          </TabsTrigger>
          <TabsTrigger value="settings" className="text-[10px] sm:text-xs py-1.5">
            设置
          </TabsTrigger>
        </TabsList>

        {/* ═══════ 我的收藏 ═══════ */}
        <TabsContent value="favorites">
          <div className="space-y-3">
            <div className="flex items-center gap-2 flex-wrap">
              <Button
                variant={favFilter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFavFilter('all')}
              >
                全部
              </Button>
              <Button
                variant={favFilter === 'word' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFavFilter('word')}
              >
                单词
              </Button>
              <Button
                variant={favFilter === 'sentence' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFavFilter('sentence')}
              >
                句子
              </Button>
              <div className="flex-1" />
              <Button
                variant="ghost"
                size="sm"
                onClick={handleExportFavorites}
                disabled={favorites.length === 0}
              >
                <Download className="mr-1 h-4 w-4" />
                导出
              </Button>
            </div>

            {filteredFavs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                <Bookmark className="h-10 w-10 mb-2" />
                <p className="text-sm">暂无收藏</p>
                <p className="text-xs">在学习或复习时点击收藏即可添加</p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredFavs.map((fav) => (
                  <Card key={fav.id}>
                    <CardContent className="p-3 flex items-start gap-3">
                      <div className="flex-1 min-w-0">
                        {fav.type === 'word' ? (
                          <div>
                            <p className="font-semibold text-sm sm:text-base">{fav.word}</p>
                            <p className="text-xs text-muted-foreground">{fav.meaning}</p>
                          </div>
                        ) : (
                          <div>
                            <p className="text-sm">{fav.en}</p>
                            <p className="text-xs text-muted-foreground">{fav.cn}</p>
                            {fav.word && (
                              <Badge variant="secondary" className="mt-1 text-[10px]">{fav.word}</Badge>
                            )}
                          </div>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 shrink-0 text-muted-foreground hover:text-red-500"
                        onClick={() => handleRemoveFavorite(fav.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        {/* ═══════ 学习统计 ═══════ */}
        <TabsContent value="stats">
          {studyStats ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <Card>
                  <CardContent className="p-3 sm:p-4 text-center">
                    <p className="text-xl sm:text-2xl font-bold">{studyStats.totalWords}</p>
                    <p className="text-[10px] sm:text-xs text-muted-foreground">总单词量</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-3 sm:p-4 text-center">
                    <p className="text-xl sm:text-2xl font-bold text-green-600">{studyStats.mastered}</p>
                    <p className="text-[10px] sm:text-xs text-muted-foreground">已掌握</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-3 sm:p-4 text-center">
                    <p className="text-xl sm:text-2xl font-bold">{studyStats.todayStudied}</p>
                    <p className="text-[10px] sm:text-xs text-muted-foreground">今日学习</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-3 sm:p-4 text-center">
                    <p className="text-xl sm:text-2xl font-bold text-orange-600">{studyStats.streak}天</p>
                    <p className="text-[10px] sm:text-xs text-muted-foreground">连续打卡</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-3 sm:p-4 text-center">
                    <p className="text-xl sm:text-2xl font-bold text-blue-600">{studyStats.retentionRate}%</p>
                    <p className="text-[10px] sm:text-xs text-muted-foreground">记忆留存率</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-3 sm:p-4 text-center">
                    <p className="text-xl sm:text-2xl font-bold">{studyStats.totalReviews}</p>
                    <p className="text-[10px] sm:text-xs text-muted-foreground">总复习次数</p>
                  </CardContent>
                </Card>
              </div>

              {/* 7-day chart */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    近7天学习量
                    {/* 预留：可切换 recharts / chart.js */}
                    <Badge variant="outline" className="text-[9px] ml-auto">纯 CSS 图表</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-end justify-between gap-1 h-24 sm:h-28">
                    {studyStats.last7Days.map((d) => {
                      const max = Math.max(...studyStats.last7Days.map((x) => x.count), 1)
                      const height = (d.count / max) * 100
                      const isToday = d.date === new Date().toISOString().split('T')[0]
                      return (
                        <div key={d.date} className="flex-1 flex flex-col items-center gap-1">
                          <span className="text-[10px] sm:text-xs font-medium">{d.count || ''}</span>
                          <div className="w-full bg-muted rounded-t-sm overflow-hidden" style={{ height: '80px' }}>
                            <div
                              className={`w-full mt-auto transition-all ${isToday ? 'bg-primary' : 'bg-primary/60'}`}
                              style={{ height: `${Math.max(height, 2)}%`, marginTop: `${100 - Math.max(height, 2)}%` }}
                            />
                          </div>
                          <span className="text-[9px] sm:text-[10px] text-muted-foreground">
                            {d.date.slice(5)}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>

              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">记忆留存率详情</span>
                <span className="font-medium">{studyStats.retainedCount} / {studyStats.studiedCount} 词 (间隔 ≥ 7天)</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">平均记忆质量</span>
                <span className="font-medium">{studyStats.avgQuality} / 5</span>
              </div>
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-16">加载中...</p>
          )}
        </TabsContent>

        {/* ═══════ 导入文本 ═══════ */}
        <TabsContent value="import">
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              粘贴英文文本，自动提取生词并建立个人单词本。已认识的词不会被重复添加。
            </p>

            <textarea
              className="w-full h-40 rounded-md border border-input bg-background p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="在此粘贴英文文章、段落或句子..."
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
            />

            <div className="flex gap-2">
              <Button
                className="flex-1"
                onClick={handleExtractWords}
                disabled={!importText.trim()}
              >
                <FileInput className="mr-2 h-4 w-4" />
                提取单词
              </Button>
              <Button variant="outline" disabled>
                上传文件
              </Button>
            </div>

            {/* Extraction results */}
            {extractedWords.length > 0 && (
              <Card>
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">
                      提取到 {extractedWords.length} 个单词
                    </p>
                    <Badge variant="secondary">已过滤常见词</Badge>
                  </div>

                  <div className="max-h-48 overflow-y-auto space-y-1 border rounded-md p-2">
                    {extractedWords.slice(0, 30).map((w) => (
                      <div key={w.word} className="flex items-center justify-between text-sm py-1 px-2 rounded hover:bg-muted">
                        <span className="font-medium">{w.word}</span>
                        <span className="text-xs text-muted-foreground">
                          {w.count}次
                          {w.context[0] && ` · ${w.context[0].en.slice(0, 40)}...`}
                        </span>
                      </div>
                    ))}
                    {extractedWords.length > 30 && (
                      <p className="text-xs text-muted-foreground text-center py-1">
                        ...还有 {extractedWords.length - 30} 个单词
                      </p>
                    )}
                  </div>

                  <Button className="w-full" onClick={handleImportToWordBank}>
                    <Upload className="mr-2 h-4 w-4" />
                    加入我的词库
                  </Button>
                </CardContent>
              </Card>
            )}

            {importDone && (
              <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                <Check className="h-4 w-4" />
                导入完成！新单词已加入词库，可在学习中遇到。
              </div>
            )}

            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">
                自动过滤 the / be / to / of 等 120+ 常见词
              </p>
              <p className="text-xs text-muted-foreground">
                预留：PDF/EPUB 解析 · AI 自动生成例句
              </p>
            </div>
          </div>
        </TabsContent>

        {/* ═══════ 错词本 (预留) ═══════ */}
        <TabsContent value="mistakeBook">
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <BookOpen className="h-10 w-10 mb-2" />
            <p className="text-sm font-medium">错词本</p>
            <p className="text-xs">功能开发中</p>
            <p className="text-xs mt-1">数据源 getMistakeWords() 已完成</p>
          </div>
        </TabsContent>

        {/* ═══════ 设置 ═══════ */}
        <TabsContent value="settings">
          <div className="space-y-4">
            {/* Target level */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium flex items-center gap-1.5">
                      <Target className="h-4 w-4" />
                      目标阶段
                    </p>
                    <p className="text-xs text-muted-foreground">切换词库级别（实时生效）</p>
                  </div>
                  <select
                    className="rounded-md border border-input bg-background px-2 py-1 text-sm"
                    value={settings.targetLevel || 'cet4'}
                    onChange={(e) => handleLevelChange(e.target.value)}
                  >
                    {TARGET_LEVELS.map((lvl) => (
                      <option key={lvl.value} value={lvl.value}>{lvl.label}</option>
                    ))}
                  </select>
                </div>
              </CardContent>
            </Card>

            {/* Daily count */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">每日新词数</p>
                    <p className="text-xs text-muted-foreground">每天学习的新单词数量</p>
                  </div>
                  <select
                    className="rounded-md border border-input bg-background px-2 py-1 text-sm"
                    value={settings.dailyNewCount || 20}
                    onChange={(e) => handleSettingChange('dailyNewCount', parseInt(e.target.value))}
                  >
                    {DAILY_OPTIONS.map((n) => (
                      <option key={n} value={n}>{n}</option>
                    ))}
                  </select>
                </div>
              </CardContent>
            </Card>

            {/* Study / Review / Smart mode settings — condensed for mobile */}
            <Card>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">学习模式</p>
                  </div>
                  <select
                    className="rounded-md border border-input bg-background px-2 py-1 text-sm"
                    value={settings.studyMode || 'sequential'}
                    onChange={(e) => handleSettingChange('studyMode', e.target.value)}
                  >
                    <option value="sequential">顺序</option>
                    <option value="random">随机</option>
                    <option value="hardFirst">难词优先</option>
                  </select>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">复习模式</p>
                  </div>
                  <select
                    className="rounded-md border border-input bg-background px-2 py-1 text-sm"
                    value={settings.reviewMode || 'allDue'}
                    onChange={(e) => handleSettingChange('reviewMode', e.target.value)}
                  >
                    <option value="allDue">全部到期</option>
                    <option value="mistakesOnly">仅错词</option>
                    <option value="random">随机抽查</option>
                  </select>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">智能推荐 (1:3)</p>
                  </div>
                  <Switch
                    checked={settings.smartMode || false}
                    onCheckedChange={(v) => handleSettingChange('smartMode', v)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">播放速率</p>
                  </div>
                  <select
                    className="rounded-md border border-input bg-background px-2 py-1 text-sm"
                    value={settings.playbackRate || 1.0}
                    onChange={(e) => handleSettingChange('playbackRate', parseFloat(e.target.value))}
                  >
                    <option value="0.5">0.5x</option>
                    <option value="0.75">0.75x</option>
                    <option value="1.0">1.0x</option>
                    <option value="1.25">1.25x</option>
                    <option value="1.5">1.5x</option>
                  </select>
                </div>
              </CardContent>
            </Card>

            {/* Data management */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">数据管理</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" size="sm" onClick={handleExportData}>
                    <FileDown className="mr-1 h-4 w-4" />
                    导出数据 (JSON)
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleImportData}>
                    <FileUp className="mr-1 h-4 w-4" />
                    导入数据 (JSON)
                  </Button>
                </div>
                <p className="text-[10px] text-muted-foreground">
                  导出包含全部词库+学习记录+设置。预留：Anki (.apkg) / Quizlet 格式导出。
                </p>

                <div className="pt-2 border-t">
                  {!confirmClear ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive w-full"
                      onClick={handleClearData}
                    >
                      <Eraser className="mr-1 h-4 w-4" />
                      清空全部数据
                    </Button>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                        <AlertTriangle className="h-4 w-4 shrink-0" />
                        确认清空？此操作不可恢复！
                      </div>
                      <div className="flex gap-2">
                        <Button variant="destructive" size="sm" className="flex-1" onClick={handleClearData}>
                          确认清空
                        </Button>
                        <Button variant="outline" size="sm" className="flex-1" onClick={() => setConfirmClear(false)}>
                          取消
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default Profile
