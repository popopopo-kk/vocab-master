/**
 * 常见英语停用词 — 导入文本时自动过滤
 */
const STOP_WORDS = new Set([
  'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'i',
  'it', 'for', 'not', 'on', 'with', 'he', 'as', 'you', 'do', 'at',
  'this', 'but', 'his', 'by', 'from', 'they', 'we', 'say', 'her', 'she',
  'or', 'an', 'will', 'my', 'one', 'all', 'would', 'there', 'their',
  'what', 'so', 'up', 'out', 'if', 'about', 'who', 'get', 'which',
  'go', 'me', 'when', 'make', 'can', 'like', 'time', 'no', 'just',
  'him', 'know', 'take', 'people', 'into', 'year', 'your', 'good',
  'some', 'could', 'them', 'see', 'other', 'than', 'then', 'now',
  'look', 'only', 'come', 'its', 'over', 'think', 'also', 'back',
  'after', 'use', 'two', 'how', 'our', 'work', 'first', 'well',
  'way', 'even', 'new', 'want', 'because', 'any', 'these', 'give',
  'day', 'most', 'us', 'is', 'was', 'are', 'been', 'being', 'had',
  'has', 'were', 'does', 'did', 'am', 'very', 'too', 'each', 'own',
  'same', 'more', 'much', 'may', 'should', 'here', 'still', 'last',
  'between', 'both', 'few', 'those', 'while', 'without', 'through',
  'during', 'before', 'after', 'above', 'below', 'under', 'again',
  'further', 'once', 'every', 'might', 'really', 'almost', 'always',
  'never', 'sometimes', 'often', 'used', 'using', 'another',
])

/**
 * 从文本中提取单词
 * @param {string} text — 英文文本
 * @param {Object} [options]
 * @param {number} [options.minLength=3] — 最小单词长度
 * @param {boolean} [options.filterStopWords=true] — 过滤常见词
 * @param {Set<string>} [options.extraStopWords] — 额外排除词
 * @returns {{ word: string, count: number, context: { en: string }[] }[]} 按频率降序排列
 */
export function extractWords(text, options = {}) {
  const { minLength = 3, filterStopWords = true, extraStopWords } = options

  // 按句子分割
  const sentences = text
    .split(/[.!?]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0)

  // 提取单词
  const words = text
    .toLowerCase()
    .replace(/[^a-z\s'-]/g, ' ')
    .split(/\s+/)
    .map((w) => w.replace(/^['-]+|['-]+$/g, ''))
    .filter((w) => w.length >= minLength && /[a-z]/.test(w))

  // 过滤停用词
  const filtered = filterStopWords
    ? words.filter((w) => {
        if (STOP_WORDS.has(w)) return false
        if (extraStopWords?.has(w)) return false
        return true
      })
    : words

  // 统计频率
  const freq = new Map()
  filtered.forEach((w) => {
    freq.set(w, (freq.get(w) || 0) + 1)
  })

  // 为每个单词找上下文句子
  const result = [...freq.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([word, count]) => {
      const contexts = sentences
        .filter((s) => s.toLowerCase().includes(word))
        .slice(0, 2)
        .map((en) => ({ en, cn: '', source: 'imported' }))

      return { word, count, context: contexts }
    })

  return result
}

/**
 * 将提取的单词转换为词库格式
 * @param {{ word: string, count: number, context: { en: string }[] }[]} extracted
 * @param {string} sourceLabel — 来源标签
 * @returns {Array} 词库格式的单词数组
 */
export function toWordEntries(extracted, sourceLabel = 'imported') {
  return extracted.map((item, index) => ({
    id: `imp_${Date.now()}_${index}`,
    word: item.word,
    phonetic: '',
    meaning: '',
    level: 'personal',
    sentences: item.context.length > 0 ? item.context : [{ en: item.word, cn: '', source: sourceLabel }],
    mastered: false,
    mistakeCount: 0,
    tags: [sourceLabel],
    source: 'imported',
    frequency: item.count,
  }))
}

/** 预留：PDF/EPUB 解析器接口 */
export const fileParsers = {
  pdf: null,
  epub: null,
}

/** 预留：AI 批量生成例句接口 */
export async function aiGenerateExamples(words) {
  return Promise.resolve(words.map((w) => ({ ...w })))
}
