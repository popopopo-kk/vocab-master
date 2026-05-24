/**
 * Levenshtein 编辑距离算法
 * @param {string} a
 * @param {string} b
 * @returns {number}
 */
function levenshtein(a, b) {
  const alen = a.length
  const blen = b.length
  const matrix = Array.from({ length: alen + 1 }, () =>
    Array(blen + 1).fill(0)
  )
  for (let i = 0; i <= alen; i++) matrix[i][0] = i
  for (let j = 0; j <= blen; j++) matrix[0][j] = j
  for (let i = 1; i <= alen; i++) {
    for (let j = 1; j <= blen; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      )
    }
  }
  return matrix[alen][blen]
}

function normalize(s) {
  return s.trim().replace(/\s+/g, ' ').toLowerCase()
}

/**
 * 评分答案
 * @param {string} input — 用户输入
 * @param {string} answer — 正确答案
 * @param {"firstLetter"|"dictation"|"selectWord"|"translate"} type — 题型
 * @param {boolean} [strictMode=false] — 严格模式（完全匹配才算对）
 * @returns {{ grade: "perfect"|"minor"|"retry", feedback: string, distance: number }}
 */
export function gradeAnswer(input, answer, type, strictMode = false) {
  const rawA = normalize(input || '')
  const rawB = normalize(answer)
  const dist = levenshtein(rawA, rawB)

  // 完全匹配
  if (rawA === rawB) {
    return { grade: 'perfect', feedback: '完全正确！', distance: 0 }
  }

  // selectWord 题型由组件层面判断对错，这里只走文本比较
  if (type === 'selectWord') {
    return {
      grade: 'retry',
      feedback: `正确答案是: ${answer}`,
      distance: dist,
    }
  }

  // 严格模式：不完全匹配就算错
  if (strictMode) {
    return {
      grade: 'retry',
      feedback: `不完全匹配，正确答案是: ${answer}`,
      distance: dist,
    }
  }

  // Levenshtein ≤ 2 → 小错误
  if (dist <= 2) {
    const hints = []
    if (rawA.length !== rawB.length) hints.push('长度不一致')
    hints.push(`正确拼写: ${answer}`)
    return { grade: 'minor', feedback: hints.join('；'), distance: dist }
  }

  // firstLetter 题型额外检查：前缀不少于2个匹配字符
  if (type === 'firstLetter') {
    const prefix = rawB.slice(0, 2)
    if (rawA.startsWith(prefix)) {
      return {
        grade: 'minor',
        feedback: `开头正确，但拼写有误。正确拼写: ${answer}`,
        distance: dist,
      }
    }
  }

  // dictation 题型：发音近似容忍
  if (type === 'dictation' && dist <= 4) {
    return {
      grade: 'minor',
      feedback: `发音近似但拼写有误。正确拼写: ${answer}`,
      distance: dist,
    }
  }

  return {
    grade: 'retry',
    feedback: `不正确。正确答案是: ${answer}`,
    distance: dist,
  }
}

/**
 * 预留：调用外部 AI API 评分
 * @param {string} input
 * @param {string} answer
 * @returns {Promise<{grade: string, feedback: string}>}
 */
export async function aiGrade(input, answer) {
  // 预留接口，后续接入 AI API
  return { grade: 'retry', feedback: 'AI 评分暂未接入' }
}

/** 预留：用户自定义同义词库 */
export const customSynonyms = {}
