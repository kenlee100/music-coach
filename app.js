import { CHORDS, PITCHES, PRESETS, getChord, presetItems } from './theory.js';
import { createChordPreview, createScalePlaybackQueue } from './fretboard-model.js';
import { createPreviewController } from './preview-controller.js';
import { createSequenceSortController } from './sequence-sort-controller.js';
import {
  loadGuitarTheme, loadPracticeSettings, loadProgression, loadTheme,
  saveGuitarTheme, savePracticeSettings, saveProgression, saveTheme
} from './storage.js';
import { createTransport } from './transport.js';
import {
  byId, clearPlayingCards, populateKeys, renderChordHint, renderFretboard, renderFretLabels,
  renderList, renderPresets, renderScaleOptions, renderSequence, renderSoundingCell,
  renderStep, renderTransport, settingsText
} from './views.js';

const practice = loadPracticeSettings();
const state = {
  current: CHORDS.find(chord => chord.name === practice.currentChord),
  filter: 'all',
  key: practice.key,
  sequence: [],
  practice,
  selectedScaleId: practice.selectedScaleId,
  fretboardModel: null
};
state.sequence = loadProgression(presetItems(PRESETS[1], state.key));

let toastTimer;
let sequenceSortController;

function toast(message) {
  const node = byId('toast');
  node.textContent = message;
  node.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => node.classList.remove('show'), 2100);
}

function setSaveStatus(saved) {
  byId('saveStatus').textContent = saved ? '已自動儲存' : '儲存失敗，重新開啟後可能不會保留';
}

function persistPracticeSettings() {
  setSaveStatus(savePracticeSettings(state.practice));
}

function persistProgression() {
  setSaveStatus(saveProgression(state.sequence));
}

function refreshChordViews() {
  renderList(state.current, state.filter);
  state.selectedScaleId = renderScaleOptions(state.current, state.selectedScaleId);
  state.fretboardModel = renderFretboard(state.current, state.selectedScaleId);
}

function updateTransport(stateSnapshot = transport.snapshot(), message = '') {
  renderTransport(stateSnapshot, state.practice, message);
}

const transport = createTransport({
  getSequence: () => state.sequence,
  getSettings: () => state.practice,
  onStateChange: transportState => {
    if (transportState.phase === 'idle') clearPlayingCards();
    updateTransport(transportState);
  },
  onStep: renderStep,
  onFinish: () => updateTransport(transport.snapshot(), `行進完成 · ${settingsText(state.practice)}`)
});

const preview = createPreviewController({
  onStateChange: previewState => {
    const playing = previewState.mode === 'chord';
    byId('playButton').classList.toggle('playing', playing);
    byId('playButton').setAttribute('aria-pressed', String(playing));
  },
  onCellChange: renderSoundingCell,
  onChordHint: renderChordHint
});

function choose(name) {
  const chord = CHORDS.find(item => item.name === name);
  if (!chord) return;
  preview.cancel();
  state.current = chord;
  refreshChordViews();
  state.practice.currentChord = chord.name;
  state.practice.selectedScaleId = state.selectedScaleId;
  persistPracticeSettings();
  toast(`已選擇 ${name}，可加入目前行進`);
}

function stopProgressionIfActive() {
  if (transport.snapshot().phase !== 'idle') transport.stopProgression();
}

function refreshSequence() {
  sequenceSortController?.reset();
  renderSequence(state.sequence);
  persistProgression();
}

function download() {
  if (!state.sequence.length) {
    toast('先加入至少一個和弦');
    return;
  }
  const lines = [
    'Chordroom｜吉他和弦行進', '', '和弦行進：', state.sequence.join(' → '), '', '組成音：',
    ...state.sequence.map((name, index) => `${index + 1}. ${name}: ${getChord(name).displayNotes.join(' · ')}`),
    '', '提示：先練習各和弦的實際組成音，再觀察相鄰和弦之間距離最近的聲部連接。'
  ];
  const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
  const anchor = document.createElement('a');
  anchor.href = URL.createObjectURL(blob);
  anchor.download = 'chordroom-progression.txt';
  anchor.click();
  URL.revokeObjectURL(anchor.href);
  toast('文字檔已匯出');
}

function playChord(chord = state.current, duration = 1.45) {
  transport.stopForPreview();
  const midis = chord.notes.map((note, index) => 12 * ((index === 0 ? 3 : 4) + 1) + PITCHES.indexOf(note));
  preview.playChord(midis, createChordPreview(chord), duration);
  toast(`${chord.name} 正在發聲`);
}

function playScale() {
  transport.stopForPreview();
  const queue = createScalePlaybackQueue(state.fretboardModel);
  preview.playScale(queue);
  toast(`${state.fretboardModel.scale.name}，依低音弦到高音弦播放`);
}

function applyGuitarTheme(theme, announce = false) {
  const value = theme === 'acoustic' ? 'acoustic' : 'electric';
  const isAcoustic = value === 'acoustic';
  byId('guitarTheme').value = value;
  byId('fretboardGrid').classList.toggle('acoustic', isAcoustic);
  byId('fretboardGrid').setAttribute('aria-label', `${isAcoustic ? '木吉他' : '電吉他'}指板`);
  setSaveStatus(saveGuitarTheme(value));
  if (announce) toast(`已切換為${isAcoustic ? '木吉他' : '電吉他'}配色`);
}

function applyTheme(preference, announce = false) {
  const value = ['system', 'light', 'dark'].includes(preference) ? preference : 'system';
  const media = matchMedia('(prefers-color-scheme: dark)');
  const resolved = value === 'system' ? (media.matches ? 'dark' : 'light') : value;
  document.documentElement.dataset.theme = resolved;
  document.querySelector('meta[name="theme-color"]').content = resolved === 'dark' ? '#0b1020' : '#f6f8fc';
  byId('themeSelect').value = value;
  setSaveStatus(saveTheme(value));
  if (announce) toast(`已切換為${value === 'system' ? '跟隨系統' : value === 'dark' ? '深色' : '淺色'}主題`);
}

function clampTempo(value) {
  return Math.min(240, Math.max(40, Number(value) || 90));
}

function changePracticeSettings() {
  state.practice = {
    ...state.practice,
    bpm: clampTempo(byId('tempoInput').value),
    meter: Number(byId('meterSelect').value) === 3 ? 3 : 4,
    rhythm: byId('rhythmSelect').value,
    countIn: byId('countInToggle').checked
  };
  byId('tempoInput').value = state.practice.bpm;
  byId('tempoRange').value = state.practice.bpm;
  persistPracticeSettings();
  const transportState = transport.snapshot();
  if (transportState.phase === 'idle' && !transportState.metronome) updateTransport(transportState);
  else toast('新設定將於下一小節套用');
}

function initializeControls() {
  populateKeys();
  byId('keySelect').value = state.key;
  byId('viewMode').value = state.practice.viewMode;
  byId('tempoInput').value = state.practice.bpm;
  byId('tempoRange').value = state.practice.bpm;
  byId('meterSelect').value = String(state.practice.meter);
  byId('rhythmSelect').value = state.practice.rhythm;
  byId('countInToggle').checked = state.practice.countIn;
  applyGuitarTheme(loadGuitarTheme());
  applyTheme(loadTheme());
}

byId('chordSearch').addEventListener('input', () => renderList(state.current, state.filter));
byId('filters').addEventListener('click', event => {
  const button = event.target.closest('[data-filter]');
  if (!button) return;
  state.filter = button.dataset.filter;
  document.querySelectorAll('.filter').forEach(item => item.classList.toggle('active', item === button));
  renderList(state.current, state.filter);
});
byId('chordList').addEventListener('click', event => {
  const button = event.target.closest('[data-chord]');
  if (button) choose(button.dataset.chord);
});
byId('addButton').addEventListener('click', () => {
  stopProgressionIfActive();
  state.sequence.push(state.current.name);
  refreshSequence();
  toast(`${state.current.name} 已加入目前行進`);
});
byId('viewMode').addEventListener('change', () => {
  preview.cancel();
  refreshChordViews();
  state.practice.viewMode = byId('viewMode').value;
  persistPracticeSettings();
});
byId('scaleOptionSelect').addEventListener('change', event => {
  preview.cancel();
  state.selectedScaleId = event.target.value;
  state.fretboardModel = renderFretboard(state.current, state.selectedScaleId);
  state.practice.selectedScaleId = state.selectedScaleId;
  persistPracticeSettings();
});
byId('fretboardGrid').addEventListener('click', event => {
  const note = event.target.closest('button.note[data-midi]');
  if (!note) return;
  transport.stopForPreview();
  preview.playNote({
    stringNumber: Number(note.dataset.stringNumber),
    fret: Number(note.dataset.fret),
    midi: Number(note.dataset.midi)
  });
});
byId('keySelect').addEventListener('change', event => {
  stopProgressionIfActive();
  state.key = event.target.value;
  state.practice.key = state.key;
  persistPracticeSettings();
  toast(`已切換至 ${state.key} 調，選擇預設即可套用轉調`);
});
byId('presets').addEventListener('click', event => {
  const button = event.target.closest('[data-preset]');
  if (!button) return;
  stopProgressionIfActive();
  state.sequence = presetItems(PRESETS[Number(button.dataset.preset)], state.key);
  document.querySelectorAll('.preset').forEach(item => item.classList.toggle('active', item === button));
  refreshSequence();
  toast('已載入常見和弦行進');
});
byId('sequence').addEventListener('click', event => {
  const button = event.target.closest('[data-remove]');
  if (!button) return;
  stopProgressionIfActive();
  const [removed] = state.sequence.splice(Number(button.dataset.remove), 1);
  refreshSequence();
  toast(`已移除 ${removed}`);
});
byId('exportButton').addEventListener('click', download);
byId('guitarTheme').addEventListener('change', event => applyGuitarTheme(event.target.value, true));
byId('themeSelect').addEventListener('change', event => applyTheme(event.target.value, true));
matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
  if (byId('themeSelect').value === 'system') applyTheme('system');
});
byId('tempoRange').addEventListener('input', event => {
  byId('tempoInput').value = event.target.value;
  changePracticeSettings();
});
byId('tempoInput').addEventListener('change', changePracticeSettings);
byId('meterSelect').addEventListener('change', changePracticeSettings);
byId('rhythmSelect').addEventListener('change', changePracticeSettings);
byId('countInToggle').addEventListener('change', changePracticeSettings);
byId('playButton').addEventListener('click', () => playChord());
byId('scalePlayButton').addEventListener('click', playScale);
byId('progressionPlayButton').addEventListener('click', () => {
  preview.cancel();
  const result = transport.toggleProgression();
  if (result === 'empty') toast('先加入至少一個和弦');
  if (result === 'started') updateTransport(transport.snapshot(), state.practice.countIn ? '預備拍準備中' : '行進準備中');
  if (result === 'stopped') updateTransport(transport.snapshot(), `已停止 · ${settingsText(state.practice)}`);
});
byId('metronomeButton').addEventListener('click', () => {
  preview.cancel();
  transport.toggleMetronome();
});
byId('loopButton').addEventListener('click', () => {
  const enabled = transport.toggleLoop();
  toast(enabled ? '重複播放已開啟' : '重複播放已關閉');
});

initializeControls();
renderList(state.current, state.filter);
state.selectedScaleId = renderScaleOptions(state.current, state.selectedScaleId);
state.fretboardModel = renderFretboard(state.current, state.selectedScaleId);
renderFretLabels();
renderPresets();
renderSequence(state.sequence);
updateTransport();

sequenceSortController = createSequenceSortController(byId('sequence'), {
  beforeSort: stopProgressionIfActive,
  onReorder: (from, to) => {
    const [moved] = state.sequence.splice(from, 1);
    state.sequence.splice(to, 0, moved);
    renderSequence(state.sequence);
    persistProgression();
  },
  onAnnounce: message => {
    byId('sequenceSortStatus').textContent = message;
    toast(message);
  }
});
