import { useState, useCallback } from 'react'

/**
 * 默认提示阶梯
 * 第0级：无提示
 * 第1级：显示完整首字母
 * 第2级：显示完整单词
 * 第3级：显示例句
 */
const DEFAULT_LADDER = [
  null,
  'firstLetterFull',
  'fullWord',
  'exampleSentence',
]

/**
 * 渐进提示 Hook
 * @param {Object} word — 当前单词数据
 * @param {string[]} [customLadder] — 自定义提示阶梯，覆盖默认
 * @returns {{ hintLevel: number, currentHint: string|null, nextHint: () => void, resetHints: () => void, maxLevel: number }}
 */
export function useHints(word, customLadder) {
  const [hintLevel, setHintLevel] = useState(0)
  const ladder = customLadder || DEFAULT_LADDER
  const maxLevel = ladder.length - 1

  const nextHint = useCallback(() => {
    setHintLevel((prev) => Math.min(prev + 1, maxLevel))
  }, [maxLevel])

  const resetHints = useCallback(() => {
    setHintLevel(0)
  }, [])

  const currentHint = resolveHint(ladder[hintLevel], word)

  return { hintLevel, currentHint, nextHint, resetHints, maxLevel }
}

function resolveHint(type, word) {
  if (!type || !word) return null

  switch (type) {
    case 'firstLetterFull':
      return `${word.word[0]}${'_'.repeat(word.word.length - 1)}`
    case 'fullWord':
      return word.word
    case 'exampleSentence': {
      const s = word.sentences?.[0]
      return s ? `${s.en} (${s.cn})` : word.meaning
    }
    default:
      return null
  }
}
