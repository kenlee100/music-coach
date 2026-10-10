<script setup lang="ts">
import { fretboard, getScaleOptions, scaleFor, type Chord } from '~/domain/theory'

const props = defineProps<{
  chord: Chord
  guitarTheme: string
  viewMode: 'chord' | 'scale'
  selectedScaleId: string
}>()
const emit = defineEmits<{
  add: []
  'play-chord': []
  'play-scale': [midis: number[], name: string]
  'play-note': [midi: number]
  'update:guitar-theme': [value: string]
  'update:view-mode': [value: 'chord' | 'scale']
  'update:selected-scale-id': [value: string]
}>()

const stringLabels = ['高E', 'B', 'G', 'D', 'A', '低E']
const markers = [{ fret: 3, position: 2.5 }, { fret: 5, position: 4.5 }, { fret: 7, position: 6.5 }, { fret: 9, position: 8.5 }, { fret: 12, position: 11.5 }]
const scaleOptions = computed(() => getScaleOptions(props.chord))
const scale = computed(() => scaleFor(props.chord, props.selectedScaleId))
const cells = computed(() => fretboard(props.chord, props.viewMode, props.selectedScaleId))
const scaleMidis = computed(() => fretboard(props.chord, 'scale', props.selectedScaleId)
  .filter(cell => cell.active)
  .sort((left, right) => right.stringIndex - left.stringIndex || left.fret - right.fret)
  .map(cell => cell.midi))

function changeViewMode(value: string) {
  emit('update:view-mode', value === 'scale' ? 'scale' : 'chord')
}
</script>

<template>
  <section id="fretboard" class="fretboard-panel">
    <div class="selected-bar">
      <div>
        <p class="kicker"><span>02</span> CURRENT CHORD</p>
        <div class="chord-name">{{ chord.name }}</div>
      </div>
      <div class="notes-readout">
        <p class="kicker">TONE MAP <span>{{ chord.formula }}</span></p>
        <strong>{{ chord.notes.join(' · ') }}</strong>
      </div>
      <button class="add-button" @click="emit('add')">加入時間軸 ＋</button>
    </div>
    <div class="listen-deck">
      <div>
        <p class="kicker">LISTEN / MONITOR</p>
        <strong>{{ chord.label }}</strong>
      </div>
      <div class="sound-actions">
        <button class="primary-sound" @click="emit('play-chord')">▶ 播放和弦</button>
        <button class="secondary-sound" @click="emit('play-scale', scaleMidis, scale.name)">↗ 播放音階</button>
      </div>
    </div>
    <div class="fretboard-controls">
      <label>
        <span class="kicker">FRETBOARD VIEW</span>
        <select :value="viewMode" @change="changeViewMode(($event.target as HTMLSelectElement).value)">
          <option value="chord">和弦組成音</option>
          <option value="scale">相容音階</option>
        </select>
      </label>
      <label v-if="viewMode === 'scale'">
        <span class="kicker">COMPATIBLE SCALE</span>
        <select :value="selectedScaleId" @change="emit('update:selected-scale-id', ($event.target as HTMLSelectElement).value)">
          <option v-for="option in scaleOptions" :key="option.id" :value="option.id">{{ option.label }}</option>
        </select>
      </label>
      <label>
        <span class="kicker">GUITAR FINISH</span>
        <select :value="guitarTheme" @change="emit('update:guitar-theme', ($event.target as HTMLSelectElement).value)">
          <option value="electric">電吉他</option>
          <option value="acoustic">木吉他</option>
        </select>
      </label>
      <p class="legend"><span class="root-dot" />根音 <span class="tone-dot" />{{ viewMode === 'scale' ? '音階音' : '組成音' }}</p>
    </div>
    <div class="fretboard-scroll">
      <div class="fretboard-wrap" :class="guitarTheme" role="grid" :aria-label="`${guitarTheme === 'acoustic' ? '木吉他' : '電吉他'}指板`">
        <span v-for="string in 6" :key="`string-${string}`" class="fretboard-string" :class="`fretboard-string-${string}`" aria-hidden="true" />
        <span
          v-for="marker in markers"
          :key="`marker-${marker.fret}`"
          class="fret-marker"
          :class="{ double: marker.fret === 12 }"
          :style="`--fret-position:${marker.position}`"
          aria-hidden="true"
        />
        <template v-for="(string, stringIndex) in 6" :key="string">
          <span class="string-label">{{ stringLabels[stringIndex] }}</span>
          <template v-for="cell in cells.filter(value => value.stringIndex === stringIndex)" :key="`${cell.stringIndex}-${cell.fret}`">
            <button
              v-if="cell.active"
              class="note"
              :class="cell.root ? 'root' : 'tone'"
              :aria-label="`${cell.stringName} 弦第 ${cell.fret} 格 ${cell.displayName}`"
              @click="emit('play-note', cell.midi)"
            >
              {{ cell.displayName }}
            </button>
            <span v-else class="note inactive" aria-hidden="true" />
          </template>
        </template>
      </div>
      <div class="fret-labels"><span /><span v-for="fret in 22" :key="fret">{{ fret }}</span></div>
    </div>
    <strong v-if="viewMode === 'scale'" class="scale-summary">{{ scale.name }} · {{ scale.formula }}</strong>
    <p v-if="viewMode === 'scale'" class="scale-context">{{ scale.context }}相容音階仍需依調性與和弦功能判斷。</p>
  </section>
</template>
