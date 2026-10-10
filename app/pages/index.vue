<script setup lang="ts">
import { CHORDS, PRESETS, PITCHES, fretboard, getChord, type Chord } from '~/domain/theory'
import { addChord, createEmptyTimeline, type Meter, type Timeline } from '~/domain/timeline'

const search = ref(''); const filter = ref('all'); const current = ref<Chord>(getChord('Cmaj7'))
const theme = ref('system'); const guitarTheme = ref('electric'); const bpm = ref(90); const meter = ref<Meter>(4); const countIn = ref(true)
const loop = ref(false); const metronome = ref(false)
const timeline = ref<Timeline>(createEmptyTimeline()); const toast = ref(''); const playing = ref(false); const playingEventId = ref(''); const status = ref('90 BPM · 4/4')
const announcement = ref(''); let toastTimer: ReturnType<typeof setTimeout> | undefined; let playTimer: ReturnType<typeof setTimeout> | undefined
const hydrated = ref(false)
const filteredChords = computed(() => CHORDS.filter(chord => (filter.value === 'all' || chord.type === filter.value) && chord.name.toLowerCase().includes(search.value.toLowerCase())))
const cells = computed(() => fretboard(current.value)); const chordNames = new Set(CHORDS.map(chord => chord.name))

function notify(message: string) { toast.value = message; clearTimeout(toastTimer); toastTimer = setTimeout(() => toast.value = '', 2400) }
function applyTheme(value: string) {
  theme.value = value; const dark = value === 'dark' || (value === 'system' && matchMedia('(prefers-color-scheme: dark)').matches)
  document.documentElement.dataset.theme = dark ? 'dark' : 'light'; document.querySelector('meta[name="theme-color"]')?.setAttribute('content', dark ? '#0b1020' : '#f6f8fc')
  import('~/services/storage.client').then(storage => storage.saveTheme(value))
}
function persist() { import('~/services/storage.client').then(storage => { storage.saveTimeline(timeline.value); storage.savePractice({ version: 3, bpm: bpm.value, meter: meter.value, countIn: countIn.value, currentChord: current.value.name }) }) }
function choose(chord: Chord) { current.value = chord; persist(); notify(`已選擇 ${chord.name}`) }
function addCurrent() { timeline.value = addChord(timeline.value, current.value.name, meter.value); persist(); notify(`${current.value.name} 已加入最早空位`) }
function loadPreset(names: string[]) { timeline.value = names.reduce((value, name) => addChord(value, name, meter.value), createEmptyTimeline()); persist(); notify('已載入預設行進') }
function removeEvent(barId: string, eventId: string) {
  timeline.value = { ...timeline.value, bars: timeline.value.bars.map(bar => bar.id === barId ? { ...bar, events: bar.events.filter(event => event.id !== eventId) } : bar).filter((bar, index, bars) => bar.events.length || index === 0 || index < bars.length - 1) }; persist()
}
function changeMeter(value: number) {
  const next = value === 3 ? 3 : 4; const limit = next * 16
  if (timeline.value.bars.some(bar => bar.events.some(event => event.startTick + event.durationTicks > limit))) { notify('既有和弦超出新拍號容量，請先調整時間軸'); return }
  meter.value = next; persist()
}
async function soundChord() { const audio = await import('~/services/audio.client'); audio.playChord(current.value); notify(`${current.value.name} 正在發聲`) }
async function soundCell(midi: number) { const audio = await import('~/services/audio.client'); audio.playMidi(midi) }
async function togglePlayback() {
  if (playing.value) { clearTimeout(playTimer); playing.value = false; playingEventId.value = ''; (await import('~/services/audio.client')).stopAudio(); status.value = `已停止 · ${bpm.value} BPM`; return }
  const queue = timeline.value.bars.flatMap((bar, barIndex) => bar.events.map(event => ({ ...event, barIndex }))).sort((a, b) => a.barIndex - b.barIndex || a.startTick - b.startTick)
  if (!queue.length) return notify('先加入至少一個和弦')
  playing.value = true; const beatSeconds = 60 / bpm.value; const countInSeconds = countIn.value ? meter.value * beatSeconds : 0; status.value = countIn.value ? '預備拍準備中' : '播放中'
  const audio = await import('~/services/audio.client')
  queue.forEach(event => {
    const start = countInSeconds + (event.barIndex * meter.value * 16 + event.startTick) / 16 * beatSeconds
    setTimeout(() => { if (!playing.value) return; playingEventId.value = event.id; audio.playChord(getChord(event.chord), Math.max(.12, event.durationTicks / 16 * beatSeconds * .88)) }, start * 1000)
  })
  const total = countInSeconds + timeline.value.bars.length * meter.value * beatSeconds
  playTimer = setTimeout(() => { playing.value = false; playingEventId.value = ''; status.value = '行進完成'; if (loop.value) togglePlayback() }, total * 1000)
}
let metronomeTimer: ReturnType<typeof setInterval> | undefined
async function toggleMetronome() {
  metronome.value = !metronome.value
  clearInterval(metronomeTimer)
  if (metronome.value) {
    const audio = await import('~/services/audio.client')
    audio.playMidi(84, .08)
    metronomeTimer = setInterval(() => audio.playMidi(84, .08), 60000 / bpm.value)
  }
}
function download() { const content = timeline.value.bars.map((bar, index) => `第 ${index + 1} 小節：${bar.events.map(event => `${event.chord}@${event.startTick}/${event.durationTicks}`).join('、') || '休止'}`).join('\n'); const url = URL.createObjectURL(new Blob([content], { type: 'text/plain;charset=utf-8' })); const anchor = document.createElement('a'); anchor.href = url; anchor.download = 'chordroom-timeline.txt'; anchor.click(); URL.revokeObjectURL(url) }

onMounted(async () => {
  const storage = await import('~/services/storage.client'); const practice = storage.loadPractice()
  bpm.value = practice.bpm; meter.value = practice.meter; countIn.value = practice.countIn; current.value = getChord(chordNames.has(practice.currentChord) ? practice.currentChord : 'Cmaj7')
  timeline.value = storage.loadTimeline(meter.value, name => chordNames.has(name)); theme.value = storage.loadTheme(); guitarTheme.value = storage.loadGuitarTheme(); applyTheme(theme.value)
  hydrated.value = true
})
watch([bpm, countIn], () => { status.value = `${bpm.value} BPM · ${meter.value}/4`; if (import.meta.client) persist() })
</script>

<template>
  <a class="skip-link" href="#practice">跳至練習區</a>
  <main class="app-shell" :data-ready="hydrated">
    <header class="topbar"><a class="brand" href="#practice" aria-label="Chordroom 首頁">CHORD<span>/</span>ROOM</a><nav aria-label="主要導覽"><a href="#practice">和弦室</a><a href="#fretboard">指板</a><a href="#progression">時間軸</a></nav><div class="topbar-tools"><label class="theme-control"><span>主題</span><select :value="theme" @change="applyTheme(($event.target as HTMLSelectElement).value)"><option value="system">跟隨系統</option><option value="light">淺色</option><option value="dark">深色</option></select></label><span class="session-dot">LOCAL PRACTICE</span></div></header>
    <section id="practice" class="workspace">
      <aside class="chord-panel"><div class="panel-title"><div><p class="kicker"><span>01</span> CHORD LIBRARY</p><h1>今天想練什麼？</h1></div><span>{{ filteredChords.length }}</span></div><label class="search"><span aria-hidden="true">⌕</span><input v-model="search" type="search" placeholder="找和弦：Cmaj7、Dm、G7" aria-label="搜尋和弦"></label><div class="filters" aria-label="和弦分類"><button v-for="item in [{ id: 'all', label: '全部' }, { id: 'major', label: '大' }, { id: 'minor', label: '小' }, { id: 'seventh', label: '七' }, { id: 'other', label: '其他' }]" :key="item.id" class="filter" :class="{ active: filter === item.id }" @click="filter = item.id">{{ item.label }}</button></div><div class="chord-list"><button v-for="chord in filteredChords" :key="chord.name" class="chord-card" :class="{ active: current.name === chord.name }" @click="choose(chord)"><strong>{{ chord.name }}</strong><small>{{ chord.notes.join(' · ') }}</small></button></div></aside>
      <section id="fretboard" class="fretboard-panel"><div class="selected-bar"><div><p class="kicker"><span>02</span> CURRENT CHORD</p><div class="chord-name">{{ current.name }}</div></div><div class="notes-readout"><p class="kicker">TONE MAP <span>{{ current.formula }}</span></p><strong>{{ current.notes.join(' · ') }}</strong></div><button class="add-button" @click="addCurrent">加入時間軸 ＋</button></div><div class="listen-deck"><div><p class="kicker">LISTEN / MONITOR</p><strong>{{ current.label }}</strong></div><button class="primary-sound" @click="soundChord">▶ 播放和弦</button></div><div class="fretboard-controls"><label><span class="kicker">GUITAR FINISH</span><select v-model="guitarTheme" @change="import('~/services/storage.client').then(s => s.saveGuitarTheme(guitarTheme))"><option value="electric">電吉他</option><option value="acoustic">木吉他</option></select></label><p class="legend"><span class="root-dot" />根音 <span class="tone-dot" />組成音</p></div><div class="fretboard-scroll"><div class="fretboard-wrap" :class="guitarTheme" role="grid" :aria-label="`${guitarTheme === 'acoustic' ? '木吉他' : '電吉他'}指板`"><template v-for="(string, stringIndex) in 6" :key="string"><span class="string-label">{{ ['高E','B','G','D','A','低E'][stringIndex] }}</span><template v-for="cell in cells.filter(value => value.stringIndex === stringIndex)" :key="`${cell.stringIndex}-${cell.fret}`"><button v-if="cell.active" class="note" :class="cell.root ? 'root' : 'tone'" :aria-label="`${cell.stringName} 弦第 ${cell.fret} 格 ${cell.note}`" @click="soundCell(cell.midi)">{{ cell.note }}</button><span v-else class="note inactive" aria-hidden="true" /></template></template></div><div class="fret-labels"><span /><span v-for="fret in 22" :key="fret">{{ fret }}</span></div></div></section>
    </section>
    <section id="progression" class="progression-area"><div class="progression-title"><div><p class="kicker"><span>03</span> RHYTHM TIMELINE</p><h2>多小節和弦時間軸</h2><p>拖曳方塊移動；拖曳兩側把手改變時值。空白位置代表休止。</p></div><div class="progression-meta"><label>拍號<select :value="meter" @change="changeMeter(Number(($event.target as HTMLSelectElement).value))"><option :value="4">4/4</option><option :value="3">3/4</option></select></label><label class="tempo-control">速度<span class="tempo-input"><input v-model.number="bpm" type="range" min="40" max="240"><input v-model.number="bpm" type="number" min="40" max="240"><span>BPM</span></span></label><label class="count-in-control"><input v-model="countIn" type="checkbox"><span>預備拍</span></label></div></div><div class="presets"><button v-for="preset in PRESETS" :key="preset.title" class="preset" @click="loadPreset(preset.names)"><small>{{ preset.title }}</small><strong>{{ preset.names.join('–') }}</strong></button></div><RhythmTimeline v-model="timeline" :meter="meter" :playing-event-id="playingEventId" @remove="removeEvent" @announce="message => { announcement = message; persist() }" /><p class="sr-only" aria-live="polite">{{ announcement }}</p><div class="transport"><button class="transport-play" :aria-pressed="playing" @click="togglePlayback">{{ playing ? '■ 停止行進' : '▶ 播放行進' }}</button><button class="timeline-control" :aria-pressed="metronome" @click="toggleMetronome">● 節拍器</button><button class="timeline-control" :aria-pressed="loop" @click="loop = !loop">↻ 重複</button><p role="status">{{ status }}</p><div class="export-actions"><span class="save-status">變更會自動儲存</span><button @click="download">下載 .txt</button></div></div></section>
    <footer><span>CHORDROOM / 2026</span><p>標準調弦 · 1–22 格 · 1/64 網格</p><span>LISTEN / ARRANGE / PLAY</span></footer>
  </main><div class="toast" :class="{ show: toast }" role="status" aria-live="polite">{{ toast }}</div>
</template>
