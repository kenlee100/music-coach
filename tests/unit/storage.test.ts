import { beforeEach, describe, expect, it } from 'vitest'
import { loadPractice, savePractice } from '../../app/services/storage.client'

describe('practice storage migration', () => {
  beforeEach(() => localStorage.clear())

  it('falls back safely for an unknown schema version', () => {
    localStorage.setItem('chordroom-practice', JSON.stringify({ version: 99, bpm: 220, currentChord: 'G7' }))

    expect(loadPractice()).toEqual({ version: 4, bpm: 90, meter: 4, countIn: true, currentChord: 'Cmaj7', viewMode: 'chord', selectedScaleId: 'ionian' })
  })

  it('migrates version 2 settings and preserves its selected chord', () => {
    localStorage.setItem('chordroom-practice', JSON.stringify({ version: 2, bpm: 120, meter: 3, countIn: false, currentChord: 'G7', viewMode: 'scale', selectedScaleId: 'lydianDominant' }))

    expect(loadPractice()).toEqual({ version: 4, bpm: 120, meter: 3, countIn: false, currentChord: 'G7', viewMode: 'scale', selectedScaleId: 'lydianDominant' })
  })

  it('writes only normalized version 4 settings', () => {
    savePractice({ version: 4, bpm: 999, meter: 4, countIn: true, currentChord: 'Dm7', viewMode: 'scale', selectedScaleId: 'dorian' })

    expect(JSON.parse(localStorage.getItem('chordroom-practice') || '{}')).toEqual({ version: 4, bpm: 240, meter: 4, countIn: true, currentChord: 'Dm7', viewMode: 'scale', selectedScaleId: 'dorian' })
  })
})
