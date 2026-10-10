import { noteToMidi, type Chord } from '~/domain/theory'

let context: AudioContext | null = null
const active = new Set<OscillatorNode>()
const audioContext = async () => {
  context ||= new AudioContext()
  if (context.state === 'suspended') await context.resume()
  return context
}
export function stopAudio() { active.forEach(node => { try { node.stop() } catch {} }); active.clear() }
export async function playMidi(midi: number, duration = .55, start = 0, volume = .12) {
  const ctx = await audioContext(); const oscillator = ctx.createOscillator(); const gain = ctx.createGain()
  const at = ctx.currentTime + start
  oscillator.type = 'triangle'; oscillator.frequency.value = 440 * 2 ** ((midi - 69) / 12)
  gain.gain.setValueAtTime(.0001, at); gain.gain.exponentialRampToValueAtTime(volume, at + .015); gain.gain.exponentialRampToValueAtTime(.0001, at + duration)
  oscillator.connect(gain).connect(ctx.destination); oscillator.start(at); oscillator.stop(at + duration + .02); active.add(oscillator); oscillator.onended = () => active.delete(oscillator)
}
export async function playChord(chord: Chord, duration = 1.2) {
  stopAudio()
  await Promise.all(chord.notes.map((note, index) => {
    const octave = index === 0 ? 3 : 4
    return playMidi(noteToMidi(note, octave), duration, index * .018, .075)
  }))
}
export async function playMidiSequence(midis: number[], interval = .22) {
  stopAudio()
  await Promise.all(midis.map((midi, index) => playMidi(midi, Math.min(.28, interval * .9), index * interval, .12)))
}
