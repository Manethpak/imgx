import type { EditorPreset } from '../../types/image'

const STORAGE_KEY = 'imgx-presets'

export function loadPresets(): EditorPreset[] {
  if (typeof window === 'undefined') return []

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as EditorPreset[]
    if (!Array.isArray(parsed)) return []
    return parsed.sort((a, b) => b.createdAt - a.createdAt)
  } catch {
    return []
  }
}

export function savePresets(presets: EditorPreset[]) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(presets))
}