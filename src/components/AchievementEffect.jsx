import { useEffect, useCallback } from 'react'
import confetti from 'canvas-confetti'

/**
 * 成就特效 — confetti 粒子效果
 * @param {Object} props
 * @param {boolean} props.trigger — 触发特效
 * @param {"perfect"|"streak"|"milestone"|"complete"} [props.type="perfect"] — 成就类型
 * @param {number} [props.duration=3000] — 持续时间 ms
 * @param {() => void} [props.onDone] — 特效结束回调
 */
function AchievementEffect({ trigger, type = 'perfect', duration = 3000, onDone }) {
  const fire = useCallback(() => {
    const defaults = {
      spread: 60,
      ticks: 50,
      gravity: 0.8,
      decay: 0.94,
      startVelocity: 20,
      colors: ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'],
    }

    switch (type) {
      case 'perfect':
        // Single burst from center
        confetti({
          ...defaults,
          particleCount: 80,
          origin: { x: 0.5, y: 0.5 },
          spread: 100,
        })
        break

      case 'streak':
        // Side cannons for streaks
        confetti({
          ...defaults,
          particleCount: 40,
          angle: 60,
          origin: { x: 0, y: 0.7 },
        })
        confetti({
          ...defaults,
          particleCount: 40,
          angle: 120,
          origin: { x: 1, y: 0.7 },
        })
        break

      case 'milestone':
        // Big celebration
        const end = Date.now() + duration
        const frame = () => {
          confetti({
            ...defaults,
            particleCount: 3,
            angle: 60,
            origin: { x: 0, y: 0.5 },
          })
          confetti({
            ...defaults,
            particleCount: 3,
            angle: 120,
            origin: { x: 1, y: 0.5 },
          })
          if (Date.now() < end) requestAnimationFrame(frame)
        }
        frame()
        break

      case 'complete':
        // Study/review completion — moderate celebration
        confetti({
          ...defaults,
          particleCount: 60,
          origin: { x: 0.5, y: 0.4 },
          spread: 80,
        })
        break

      default:
        confetti({ ...defaults, particleCount: 50 })
    }
  }, [type, duration])

  useEffect(() => {
    if (!trigger) return
    fire()
    const timer = setTimeout(() => onDone?.(), duration)
    return () => clearTimeout(timer)
  }, [trigger, fire, duration, onDone])

  return null
}

/**
 * 预留：多种成就触发配置
 *
 * 使用示例：
 * <AchievementEffect trigger={answerCorrect} type="perfect" />
 * <AchievementEffect trigger={streak >= 7} type="streak" />
 * <AchievementEffect trigger={wordsLearned >= 100} type="milestone" duration={5000} />
 * <AchievementEffect trigger={studyComplete} type="complete" />
 */
export default AchievementEffect
