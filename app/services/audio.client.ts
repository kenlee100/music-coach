import type { Chord } from '~/domain/theory'

let context: AudioContext | null = null
const active = new Set<OscillatorNode>()
const audioContext = () => context ||= new AudioContext()
export function stopAudio() { active.forEach(node => { try { node.stop() } catch {} }); active.clear() }
export function playMidi(midi: number, duration = .55, start = 0) {
  const ctx = audioContext(); const oscillator = ctx.createOscillator(); const gain = ctx.createGain()
  const at = ctx.currentTime + start
  oscillator.type = 'triangle'; oscillator.frequency.value = 440 * 2 ** ((midi - 69) / 12)
  gain.gain.setValueAtTime(.0001, at); gain.gain.exponentialRampToValueAtTime(.12, at + .015); gain.gain.exponentialRampToValueAtTime(.0001, at + duration)
  oscillator.connect(gain).connect(ctx.destination); oscillator.start(at); oscillator.stop(at + duration + .02); active.add(oscillator); oscillator.onended = () => active.delete(oscillator)
}
export function playChord(chord: Chord, duration = 1.2) {
  stopAudio(); chord.notes.forEach((note, index) => playMidi(48 + index * 4 + index, duration, index * .025))
}
