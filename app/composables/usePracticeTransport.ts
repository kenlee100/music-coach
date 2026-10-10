import { computed, onUnmounted, ref, watch, type Ref } from 'vue'
import { getChord } from '~/domain/theory'
import type { Meter, Timeline } from '~/domain/timeline'

export type TransportPhase = 'idle' | 'count-in' | 'playing'

interface TransportOptions {
  timeline: Ref<Timeline>
  bpm: Ref<number>
  meter: Ref<Meter>
  countIn: Ref<boolean>
  loop: Ref<boolean>
  notify: (message: string) => void
}

export function usePracticeTransport(options: TransportOptions) {
  const phase = ref<TransportPhase>('idle')
  const playingEventId = ref('')
  const status = ref(`${options.bpm.value} BPM · ${options.meter.value}/4`)
  const metronome = ref(false)
  const playbackTimers = new Set<ReturnType<typeof setTimeout>>()
  let metronomeTimer: ReturnType<typeof setInterval> | undefined
  let generation = 0

  const playing = computed(() => phase.value !== 'idle')
  const schedule = (callback: () => void, delay: number) => {
    const timer = setTimeout(() => {
      playbackTimers.delete(timer)
      callback()
    }, delay)
    playbackTimers.add(timer)
  }
  const clearPlaybackTimers = () => {
    playbackTimers.forEach(timer => clearTimeout(timer))
    playbackTimers.clear()
  }
  const stopAudio = () => { void import('~/services/audio.client').then(audio => audio.stopAudio()) }
  const resetPlayback = () => {
    generation += 1
    clearPlaybackTimers()
    phase.value = 'idle'
    playingEventId.value = ''
    stopAudio()
  }

  async function startPlayback() {
    const queue = options.timeline.value.bars
      .flatMap((bar, barIndex) => bar.events.map(event => ({ ...event, barIndex })))
      .sort((a, b) => a.barIndex - b.barIndex || a.startTick - b.startTick)
    if (!queue.length) { options.notify('先加入至少一個和弦'); return }

    clearPlaybackTimers()
    const run = ++generation
    const beatSeconds = 60 / options.bpm.value
    const countInSeconds = options.countIn.value ? options.meter.value * beatSeconds : 0
    const audio = await import('~/services/audio.client')
    if (run !== generation) return
    phase.value = options.countIn.value ? 'count-in' : 'playing'
    status.value = options.countIn.value ? '預備拍準備中' : '播放中'

    queue.forEach(event => {
      const start = countInSeconds + (event.barIndex * options.meter.value * 16 + event.startTick) / 16 * beatSeconds
      schedule(() => {
        if (run !== generation) return
        phase.value = 'playing'
        status.value = '播放中'
        playingEventId.value = event.id
        audio.playChord(getChord(event.chord), Math.max(.12, event.durationTicks / 16 * beatSeconds * .88))
      }, start * 1000)
    })

    const total = countInSeconds + options.timeline.value.bars.length * options.meter.value * beatSeconds
    schedule(() => {
      if (run !== generation) return
      phase.value = 'idle'
      playingEventId.value = ''
      status.value = '行進完成'
      if (options.loop.value) void startPlayback()
    }, total * 1000)
  }

  async function togglePlayback() {
    if (playing.value) {
      resetPlayback()
      status.value = `已停止 · ${options.bpm.value} BPM`
      return
    }
    await startPlayback()
  }

  const startMetronome = async () => {
    clearInterval(metronomeTimer)
    const audio = await import('~/services/audio.client')
    if (!metronome.value) return
    audio.playMidi(84, .08)
    metronomeTimer = setInterval(() => audio.playMidi(84, .08), 60000 / options.bpm.value)
  }
  async function toggleMetronome() {
    metronome.value = !metronome.value
    clearInterval(metronomeTimer)
    if (metronome.value) await startMetronome()
  }

  watch(options.bpm, () => { if (metronome.value) void startMetronome() })
  watch([options.bpm, options.meter], () => {
    if (!playing.value) status.value = `${options.bpm.value} BPM · ${options.meter.value}/4`
  })
  onUnmounted(() => {
    resetPlayback()
    clearInterval(metronomeTimer)
  })

  return { phase, playing, playingEventId, status, metronome, togglePlayback, toggleMetronome }
}
