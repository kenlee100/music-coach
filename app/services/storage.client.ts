import type { Meter, Timeline } from '~/domain/timeline'
import { migrateProgression } from '~/domain/timeline'
import { CHORDS, getChord, getDefaultScaleId, getScaleOptions } from '~/domain/theory'

const PROGRESSION_KEY = 'chordcraft-progression'
const PRACTICE_KEY = 'chordroom-practice'
const THEME_KEY = 'chordroom-theme'
const GUITAR_KEY = 'chordroom-guitar-theme'
const DEFAULT_PRACTICE: PracticeSettings = { version: 4, bpm: 90, meter: 4, countIn: true, currentChord: 'Cmaj7', viewMode: 'chord', selectedScaleId: 'ionian' }

export interface PracticeSettings {
  version: 4
  bpm: number
  meter: Meter
  countIn: boolean
  currentChord: string
  viewMode: 'chord' | 'scale'
  selectedScaleId: string
}

const read = (key: string) => { try { return localStorage.getItem(key) } catch { return null } }
const write = (key: string, value: string) => { try { localStorage.setItem(key, value); return true } catch { return false } }
const json = (key: string) => { try { return JSON.parse(read(key) || 'null') } catch { return null } }

export const loadTimeline = (meter: Meter, validChord: (name: string) => boolean) => migrateProgression(json(PROGRESSION_KEY), meter, validChord)
export const saveTimeline = (timeline: Timeline) => write(PROGRESSION_KEY, JSON.stringify(timeline))
export const normalizePractice = (value: unknown): PracticeSettings => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return { ...DEFAULT_PRACTICE }
  const stored = value as Record<string, unknown>
  const version = stored.version == null ? 0 : Number(stored.version)
  if (![0, 1, 2, 3, 4].includes(version)) return { ...DEFAULT_PRACTICE }
  const restoreSelection = version >= 2
  const currentChord = restoreSelection && typeof stored.currentChord === 'string' && CHORDS.some(chord => chord.name === stored.currentChord)
    ? stored.currentChord
    : DEFAULT_PRACTICE.currentChord
  const chord = getChord(currentChord)
  const selectedScaleId = restoreSelection && typeof stored.selectedScaleId === 'string' && getScaleOptions(chord).some(option => option.id === stored.selectedScaleId)
    ? stored.selectedScaleId
    : getDefaultScaleId(chord)
  return {
    version: 4 as const,
    bpm: Math.min(240, Math.max(40, Number(stored.bpm) || DEFAULT_PRACTICE.bpm)),
    meter: Number(stored.meter) === 3 ? 3 as const : 4 as const,
    countIn: stored.countIn !== false,
    currentChord,
    viewMode: restoreSelection && stored.viewMode === 'scale' ? 'scale' : 'chord',
    selectedScaleId
  }
}
export const loadPractice = () => normalizePractice(json(PRACTICE_KEY))
export const savePractice = (value: PracticeSettings) => write(PRACTICE_KEY, JSON.stringify(normalizePractice(value)))
export const loadTheme = () => ['system', 'light', 'dark'].includes(read(THEME_KEY) || '') ? read(THEME_KEY)! : 'system'
export const saveTheme = (value: string) => write(THEME_KEY, ['system', 'light', 'dark'].includes(value) ? value : 'system')
export const loadGuitarTheme = () => read(GUITAR_KEY) === 'acoustic' ? 'acoustic' : 'electric'
export const saveGuitarTheme = (value: string) => write(GUITAR_KEY, value === 'acoustic' ? 'acoustic' : 'electric')
