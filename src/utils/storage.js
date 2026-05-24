const STORAGE_KEYS = {
  words: 'vocab_words',
  studyLog: 'vocab_study_log',
  settings: 'vocab_settings',
}

function read(key) {
  return Promise.resolve().then(() => {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : null
  })
}

function write(key, data) {
  return Promise.resolve().then(() => {
    localStorage.setItem(key, JSON.stringify(data))
    return data
  })
}

/**
 * @returns {Promise<Array>}
 */
export function getWords() {
  return read(STORAGE_KEYS.words).then((data) => data || [])
}

/**
 * @param {Array} words
 * @returns {Promise<Array>}
 */
export function saveWords(words) {
  return write(STORAGE_KEYS.words, words)
}

/**
 * @returns {Promise<Array>}
 */
export function getStudyLog() {
  return read(STORAGE_KEYS.studyLog).then((data) => data || [])
}

/**
 * @param {Array} log
 * @returns {Promise<Array>}
 */
export function saveStudyLog(log) {
  return write(STORAGE_KEYS.studyLog, log)
}

/**
 * @returns {Promise<Object>}
 */
export function getSettings() {
  return read(STORAGE_KEYS.settings).then((data) => data || {})
}

/**
 * @param {Object} settings
 * @returns {Promise<Object>}
 */
export function saveSettings(settings) {
  return write(STORAGE_KEYS.settings, settings)
}

/**
 * 预留：从云端同步数据
 * @returns {Promise<void>}
 */
export function syncToCloud() {
  return Promise.resolve()
}

/**
 * 预留：同步到云端
 * @returns {Promise<void>}
 */
export function syncFromCloud() {
  return Promise.resolve()
}
