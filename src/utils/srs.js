import { getWords, saveWords, getStudyLog, saveStudyLog } from './storage.js'

const DEFAULT_EF = 2.5
const MIN_EF = 1.3
const MASTERED_INTERVAL = 60

function today() {
  return new Date().toISOString().split('T')[0]
}

/**
 * 确保单词有 SRS 字段，没有则初始化
 * @param {Object} word
 * @returns {Object}
 */
function ensureSRS(word) {
  if (!word.srs) {
    word.srs = {
      easeFactor: DEFAULT_EF,
      interval: 0,
      repetition: 0,
      nextReview: null,
      lastReview: null,
    }
  }
  return word
}

/**
 * SM-2 算法：根据记忆质量计算下次复习时间
 * @param {string} wordId — 单词 ID
 * @param {number} quality — 记忆质量 0-5（0=完全遗忘, 5=完美）
 * @param {number} [customEF] — 自定义初始 EF 系数，替代默认 2.5
 * @returns {Promise<{nextReviewDate: string, interval: number, easeFactor: number, repetition: number}>}
 */
export async function calculateNextReview(wordId, quality, customEF) {
  const words = await getWords()
  const word = words.find((w) => w.id === wordId)
  if (!word) throw new Error(`Word not found: ${wordId}`)

  ensureSRS(word)
  const srs = word.srs

  if (customEF !== undefined) {
    srs.easeFactor = customEF
  }

  if (quality >= 3) {
    if (srs.repetition === 0) {
      srs.interval = 1
    } else if (srs.repetition === 1) {
      srs.interval = 6
    } else {
      srs.interval = Math.round(srs.interval * srs.easeFactor)
    }
    srs.repetition += 1
  } else {
    srs.repetition = 0
    srs.interval = 1
  }

  srs.easeFactor =
    srs.easeFactor +
    (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
  if (srs.easeFactor < MIN_EF) srs.easeFactor = MIN_EF

  const nextReviewDate = new Date()
  nextReviewDate.setDate(nextReviewDate.getDate() + srs.interval)
  const nextReviewStr = nextReviewDate.toISOString().split('T')[0]

  srs.nextReview = nextReviewStr
  srs.lastReview = today()

  if (quality < 3) {
    word.mistakeCount = (word.mistakeCount || 0) + 1
  }

  if (srs.interval >= MASTERED_INTERVAL && srs.repetition >= 3) {
    word.mastered = true
  }

  await saveWords(words)

  const log = await getStudyLog()
  log.push({
    wordId,
    date: today(),
    quality,
    type: srs.repetition <= 1 ? 'new' : 'review',
    duration: 0,
  })
  await saveStudyLog(log)

  return {
    nextReviewDate: nextReviewStr,
    interval: srs.interval,
    easeFactor: Math.round(srs.easeFactor * 100) / 100,
    repetition: srs.repetition,
  }
}

/**
 * 获取今日到期复习的单词
 * @param {string} [date] — 指定日期 YYYY-MM-DD，默认今天
 * @returns {Promise<Array>}
 */
export async function getDueReviews(date) {
  const target = date || today()
  const words = await getWords()
  return words
    .map((w) => ensureSRS(w))
    .filter((w) => w.srs.nextReview && w.srs.nextReview <= target)
}

/**
 * 获取今日新词（尚未开始学习的单词）
 * @param {number} count — 需要数量
 * @param {string} [level] — 按级别筛选
 * @param {string[]} [excludeIds] — 排除的单词 ID
 * @returns {Promise<Array>}
 */
export async function getNewWords(count, level, excludeIds) {
  const words = await getWords()
  const excludeSet = new Set(excludeIds || [])
  let candidates = words
    .map((w) => ensureSRS(w))
    .filter((w) => !w.srs.nextReview && !excludeSet.has(w.id))

  if (level) {
    candidates = candidates.filter((w) => w.level === level)
  }

  return candidates.slice(0, count)
}

/**
 * 获取已掌握单词列表
 * @returns {Promise<Array>}
 */
export async function getMasteredWords() {
  const words = await getWords()
  return words.filter((w) => w.mastered)
}

/**
 * 获取错词列表（用于错词本）
 * @returns {Promise<Array>}
 */
export async function getMistakeWords() {
  const words = await getWords()
  return words
    .filter((w) => (w.mistakeCount || 0) > 0)
    .sort((a, b) => (b.mistakeCount || 0) - (a.mistakeCount || 0))
}

/**
 * 初始化测试数据到 localStorage（仅当无数据时）
 * @param {Array} seedWords
 * @returns {Promise<void>}
 */
export async function seedIfEmpty(seedWords) {
  const existing = await getWords()
  if (existing.length === 0) {
    await saveWords(seedWords)
  }
}
