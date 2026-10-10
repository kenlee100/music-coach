<script setup lang="ts">
import { CHORDS, PRESETS, getChord, getDefaultScaleId, getScaleOptions, type Chord } from '~/domain/theory'
import { addChord, appendBar, createEmptyTimeline, createPresetTimeline, removeBar as removeTimelineBar, type Meter, type Timeline } from '~/domain/timeline'

const current = ref<Chord>(getChord('Cmaj7'))
const theme = ref('system')
const guitarTheme = ref('electric')
const bpm = ref(90)
const meter = ref<Meter>(4)
const countIn = ref(true)
const viewMode = ref<'chord' | 'scale'>('chord')
const selectedScaleId = ref(getDefaultScaleId(current.value))
const loop = ref(false)
const timeline = ref<Timeline>(createEmptyTimeline())
const selectedPresetTitle = ref(PRESETS[0]?.title || '')
const toast = ref('')
const announcement = ref('')
const hydrated = ref(false)
const chordNames = new Set(CHORDS.map(chord => chord.name))
let toastTimer: ReturnType<typeof setTimeout> | undefined

function notify(message: string) {
  toast.value = message
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => { toast.value = '' }, 2400)
}

const { playing, playingEventId, status, metronome, togglePlayback, stopPlayback, toggleMetronome } = usePracticeTransport({ timeline, bpm, meter, countIn, loop, notify })
const timelineHasEvents = computed(() => timeline.value.bars.some(bar => bar.events.length > 0))
const selectedPreset = computed(() => PRESETS.find(preset => preset.title === selectedPresetTitle.value) || PRESETS[0])

function applyTheme(value: string) {
  theme.value = value
  const dark = value === 'dark' || (value === 'system' && matchMedia('(prefers-color-scheme: dark)').matches)
  document.documentElement.dataset.theme = dark ? 'dark' : 'light'
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', dark ? '#0b1020' : '#f6f8fc')
  import('~/services/storage.client').then(storage => storage.saveTheme(value))
}

function persist() {
  import('~/services/storage.client').then(storage => {
    storage.saveTimeline(timeline.value)
    storage.savePractice({ version: 4, bpm: bpm.value, meter: meter.value, countIn: countIn.value, currentChord: current.value.name, viewMode: viewMode.value, selectedScaleId: selectedScaleId.value })
  })
}

function resolveScale(chord: Chord, selectedId: string) {
  return getScaleOptions(chord).some(option => option.id === selectedId) ? selectedId : getDefaultScaleId(chord)
}

function choose(chord: Chord) {
  current.value = chord
  selectedScaleId.value = resolveScale(chord, selectedScaleId.value)
  persist()
  notify(`已選擇 ${chord.name}`)
}

function stopBeforeStructureChange() {
  if (playing.value) stopPlayback()
}

function addCurrent() {
  stopBeforeStructureChange()
  timeline.value = addChord(timeline.value, current.value.name, meter.value)
  persist()
  notify(`${current.value.name} 已加入最早空位`)
}

function addBar() {
  stopBeforeStructureChange()
  timeline.value = appendBar(timeline.value)
  persist()
  notify('已新增小節')
}

function removeBar(barId: string, barIndex: number) {
  const bar = timeline.value.bars.find(item => item.id === barId)
  if (!bar || timeline.value.bars.length === 1) {
    notify('至少保留一個小節')
    return
  }
  if (bar.events.length && !window.confirm(`第 ${barIndex + 1} 小節包含 ${bar.events.length} 個和弦，刪除後無法復原。`)) return
  stopBeforeStructureChange()
  timeline.value = removeTimelineBar(timeline.value, barId)
  persist()
  announcement.value = `已刪除第 ${barIndex + 1} 小節`
  notify(`已刪除第 ${barIndex + 1} 小節`)
}

function applyPreset() {
  const preset = selectedPreset.value
  if (!preset) return
  if (timelineHasEvents.value && !window.confirm(`套用「${preset.title}」會取代目前時間軸，是否繼續？`)) return
  stopBeforeStructureChange()
  timeline.value = createPresetTimeline(preset.names, meter.value)
  persist()
  announcement.value = `已套用 ${preset.title} 行進`
  notify('已載入預設行進')
}

function removeEvent(barId: string, eventId: string) {
  stopBeforeStructureChange()
  timeline.value = {
    ...timeline.value,
    bars: timeline.value.bars.map(bar => bar.id === barId ? { ...bar, events: bar.events.filter(event => event.id !== eventId) } : bar)
  }
  persist()
}

function changeGuitarTheme(value: string) {
  guitarTheme.value = value
  import('~/services/storage.client').then(storage => storage.saveGuitarTheme(value))
}

function changeMeter(value: number) {
  const next = value === 3 ? 3 : 4
  const limit = next * 16
  if (timeline.value.bars.some(bar => bar.events.some(event => event.startTick + event.durationTicks > limit))) {
    notify('既有和弦超出新拍號容量，請先調整時間軸')
    return
  }
  stopBeforeStructureChange()
  meter.value = next
  persist()
}

async function soundChord() {
  const audio = await import('~/services/audio.client')
  audio.playChord(current.value)
  notify(`${current.value.name} 正在發聲`)
}

async function soundScale(midis: number[], name: string) {
  const audio = await import('~/services/audio.client')
  audio.playMidiSequence(midis)
  notify(`${name}，依低音弦到高音弦播放`)
}

async function soundCell(midi: number) {
  const audio = await import('~/services/audio.client')
  audio.playMidi(midi)
}

function changeViewMode(value: 'chord' | 'scale') {
  viewMode.value = value
  persist()
}

function changeScale(value: string) {
  selectedScaleId.value = resolveScale(current.value, value)
  persist()
}

function download() {
  const content = timeline.value.bars.map((bar, index) => `第 ${index + 1} 小節：${bar.events.map(event => `${event.chord}@${event.startTick}/${event.durationTicks}`).join('、') || '休止'}`).join('\n')
  const url = URL.createObjectURL(new Blob([content], { type: 'text/plain;charset=utf-8' }))
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = 'chordroom-timeline.txt'
  anchor.click()
  URL.revokeObjectURL(url)
}

onMounted(async () => {
  const storage = await import('~/services/storage.client')
  const practice = storage.loadPractice()
  bpm.value = practice.bpm
  meter.value = practice.meter
  countIn.value = practice.countIn
  current.value = getChord(chordNames.has(practice.currentChord) ? practice.currentChord : 'Cmaj7')
  viewMode.value = practice.viewMode
  selectedScaleId.value = resolveScale(current.value, practice.selectedScaleId)
  timeline.value = storage.loadTimeline(meter.value, name => chordNames.has(name))
  theme.value = storage.loadTheme()
  guitarTheme.value = storage.loadGuitarTheme()
  applyTheme(theme.value)
  hydrated.value = true
})

watch([bpm, meter, countIn], () => { if (import.meta.client) persist() })
onUnmounted(() => clearTimeout(toastTimer))
</script>

<template>
  <a class="skip-link" href="#practice">跳至練習區</a>
  <main class="app-shell" :data-ready="hydrated">
    <header class="topbar">
      <a class="brand" href="#practice" aria-label="Chordroom 首頁">CHORD<span>/</span>ROOM</a>
      <nav aria-label="主要導覽"><a href="#practice">和弦室</a><a href="#fretboard">指板</a><a href="#progression">時間軸</a></nav>
      <div class="topbar-tools"><label class="theme-control"><span>主題</span><select :value="theme" @change="applyTheme(($event.target as HTMLSelectElement).value)"><option value="system">跟隨系統</option><option value="light">淺色</option><option value="dark">深色</option></select></label><span class="session-dot">LOCAL PRACTICE</span></div>
    </header>

    <section id="practice" class="workspace">
      <ChordLibrary :chords="CHORDS" :selected-name="current.name" @select="choose" />
      <GuitarFretboard :chord="current" :guitar-theme="guitarTheme" :view-mode="viewMode" :selected-scale-id="selectedScaleId" @add="addCurrent" @play-chord="soundChord" @play-scale="soundScale" @play-note="soundCell" @update:guitar-theme="changeGuitarTheme" @update:view-mode="changeViewMode" @update:selected-scale-id="changeScale" />
    </section>

    <section id="progression" class="progression-area">
      <div class="progression-title">
        <div><p class="kicker"><span>03</span> RHYTHM TIMELINE</p><h2>多小節和弦時間軸</h2><p>拖曳方塊移動；拖曳兩側把手改變時值。</p></div>
        <div class="progression-meta"><label>拍號<select :value="meter" @change="changeMeter(Number(($event.target as HTMLSelectElement).value))"><option :value="4">4/4</option><option :value="3">3/4</option></select></label><label class="tempo-control">速度<span class="tempo-input"><input v-model.number="bpm" type="range" min="40" max="240"><input v-model.number="bpm" type="number" min="40" max="240"><span>BPM</span></span></label><label class="count-in-control"><input v-model="countIn" type="checkbox"><span>預備拍</span></label></div>
      </div>
      <div class="preset-picker"><label for="progression-preset">常用和弦行進</label><select id="progression-preset" v-model="selectedPresetTitle"><option v-for="preset in PRESETS" :key="preset.title" :value="preset.title">{{ preset.title }}：{{ preset.names.join(' – ') }}</option></select><button type="button" class="preset-apply" @click="applyPreset">套用行進</button></div>
      <RhythmTimeline v-model="timeline" :meter="meter" :playing-event-id="playingEventId" @remove="removeEvent" @add-bar="addBar" @remove-bar="removeBar" @announce="message => { announcement = message; persist() }" />
      <p class="sr-only" aria-live="polite">{{ announcement }}</p>
      <div class="transport"><button class="transport-play" :aria-pressed="playing" @click="togglePlayback">{{ playing ? '■ 停止行進' : '▶ 播放行進' }}</button><button class="timeline-control" :aria-pressed="metronome" @click="toggleMetronome">● 節拍器</button><button class="timeline-control" :aria-pressed="loop" @click="loop = !loop">↻ 重複</button><p role="status">{{ status }}</p><div class="export-actions"><span class="save-status">變更會自動儲存</span><button @click="download">下載 .txt</button></div></div>
    </section>
    <footer><span>CHORDROOM / 2026</span><p>標準調弦 · 1–22 格 · 1/64 網格</p><span>LISTEN / ARRANGE / PLAY</span></footer>
  </main>
  <div class="toast" :class="{ show: toast }" role="status" aria-live="polite">{{ toast }}</div>
</template>
