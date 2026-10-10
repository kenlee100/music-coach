import type { Meter, Timeline } from '~/domain/timeline'
import { migrateProgression } from '~/domain/timeline'

const PROGRESSION_KEY = 'chordcraft-progression'
const PRACTICE_KEY = 'chordroom-practice'
const THEME_KEY = 'chordroom-theme'
const GUITAR_KEY = 'chordroom-guitar-theme'

const read = (key: string) => { try { return localStorage.getItem(key) } catch { return null } }
const write = (key: string, value: string) => { try { localStorage.setItem(key, value); return true } catch { return false } }
const json = (key: string) => { try { return JSON.parse(read(key) || 'null') } catch { return null } }

export const loadTimeline = (meter: Meter, validChord: (name: string) => boolean) => migrateProgression(json(PROGRESSION_KEY), meter, validChord)
export const saveTimeline = (timeline: Timeline) => write(PROGRESSION_KEY, JSON.stringify(timeline))
export const loadPractice = () => {
  const value = json(PRACTICE_KEY) || {}
  return { version: 3, bpm: Math.min(240, Math.max(40, Number(value.bpm) || 90)), meter: Number(value.meter) === 3 ? 3 as const : 4 as const, countIn: value.countIn !== false, currentChord: typeof value.currentChord === 'string' ? value.currentChord : 'Cmaj7' }
}
export const savePractice = (value: object) => write(PRACTICE_KEY, JSON.stringify(value))
export const loadTheme = () => ['system', 'light', 'dark'].includes(read(THEME_KEY) || '') ? read(THEME_KEY)! : 'system'
export const saveTheme = (value: string) => write(THEME_KEY, value)
export const loadGuitarTheme = () => read(GUITAR_KEY) === 'acoustic' ? 'acoustic' : 'electric'
export const saveGuitarTheme = (value: string) => write(GUITAR_KEY, value)
