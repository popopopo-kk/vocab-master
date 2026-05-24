/**
 * 主题系统 — 预留动态切换
 *
 * 当前主题通过 CSS 变量 (src/index.css) 定义
 * 本文件为后续动态主题切换预留接口
 */

/** 预设主题色板 */
export const PRESETS = {
  default: {
    primary: { h: 0, s: 0, l: 9 },
    name: '默认',
  },
  blue: {
    primary: { h: 217, s: 91, l: 60 },
    name: '蓝色',
  },
  green: {
    primary: { h: 142, s: 71, l: 45 },
    name: '绿色',
  },
  purple: {
    primary: { h: 271, s: 81, l: 56 },
    name: '紫色',
  },
}

/**
 * 应用 HSL 主题色到 CSS 变量
 * @param {{ h: number, s: number, l: number }} color
 */
export function applyPrimaryColor(color) {
  const root = document.documentElement
  root.style.setProperty('--primary', `${color.h} ${color.s}% ${color.l}%`)
}

/**
 * 切换深色/浅色模式
 * @param {"light"|"dark"} mode
 */
export function setThemeMode(mode) {
  document.documentElement.classList.toggle('dark', mode === 'dark')
  try {
    localStorage.setItem('vocab_theme_mode', mode)
  } catch {}
}

/**
 * 获取已保存的主题模式
 * @returns {"light"|"dark"}
 */
export function getThemeMode() {
  try {
    return localStorage.getItem('vocab_theme_mode') || 'light'
  } catch {
    return 'light'
  }
}

/**
 * 应用完整预设主题
 * @param {string} presetKey — PRESETS key
 */
export function applyPreset(presetKey) {
  const preset = PRESETS[presetKey]
  if (!preset) return
  applyPrimaryColor(preset.primary)
  try {
    localStorage.setItem('vocab_theme_preset', presetKey)
  } catch {}
}

/**
 * 用户自定义主题色 — 预留
 * @param {string} cssVar — CSS 变量名
 * @param {string} value — HSL 值 "H S% L%"
 */
export function setCustomColor(cssVar, value) {
  document.documentElement.style.setProperty(cssVar, value)
}
