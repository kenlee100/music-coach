import { playTone } from './audio-engine.js';
import { CHORDS, PITCHES, PRESETS, getChord, scaleFor, presetItems } from './theory.js';
import {
  loadGuitarTheme, loadPracticeSettings, loadProgression, loadTheme,
  saveGuitarTheme, savePracticeSettings, saveProgression, saveTheme
} from './storage.js';
import { createTransport } from './transport.js';
import {
  byId, clearPlayingCards, populateKeys, renderFretboard, renderFretLabels,
  renderList, renderPresets, renderSequence, renderStep, renderTransport, settingsText
} from './views.js';

const state = {
  current: CHORDS.find(chord => chord.name === 'Cmaj7'),
  filter: 'all',
  key: 'C',
  sequence: [],
  practice: loadPracticeSettings()
};
state.sequence = loadProgression(presetItems(PRESETS[1], state.key));

let toastTimer;
let chordButtonTimer;

function toast(message) {
  const node = byId('toast');
  node.textContent = message;
  node.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => node.classList.remove('show'), 2100);
}

function refreshChordViews() {
  renderList(state.current, state.filter);
  renderFretboard(state.current);
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

function choose(name) {
  const chord = CHORDS.find(item => item.name === name);
  if (!chord) return;
  state.current = chord;
  refreshChordViews();
  toast(`已選擇 ${name}，可加入目前行進`);
}

function stopProgressionIfActive() {
  if (transport.snapshot().phase !== 'idle') transport.stopProgression();
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
  const button = byId('playButton');
  button.classList.add('playing');
  button.setAttribute('aria-pressed', 'true');
  chord.notes.forEach((note, index) => playTone(note, index * 0.025, duration, index === 0 ? 3 : 4));
  clearTimeout(chordButtonTimer);
  chordButtonTimer = setTimeout(() => {
    button.classList.remove('playing');
    button.setAttribute('aria-pressed', 'false');
  }, duration * 1000);
  toast(`${chord.name} 正在發聲`);
}

function playScale() {
  transport.stopForPreview();
  const info = scaleFor(state.current);
  const notes = [
    ...info.steps.map(step => PITCHES[(PITCHES.indexOf(state.current.notes[0]) + step) % 12]),
    state.current.notes[0]
  ];
  notes.forEach((note, index) => playTone(note, index * 0.3, 0.28, index === notes.length - 1 ? 5 : 4));
  toast(`${info.name} 上行`);
}

function applyGuitarTheme(theme, announce = false) {
  const value = theme === 'acoustic' ? 'acoustic' : 'electric';
  const isAcoustic = value === 'acoustic';
  byId('guitarTheme').value = value;
  byId('fretboardGrid').classList.toggle('acoustic', isAcoustic);
  byId('fretboardGrid').setAttribute('aria-label', `${isAcoustic ? '木吉他' : '電吉他'}指板`);
  saveGuitarTheme(value);
  if (announce) toast(`已切換為${isAcoustic ? '木吉他' : '電吉他'}配色`);
}

function applyTheme(preference, announce = false) {
  const value = ['system', 'light', 'dark'].includes(preference) ? preference : 'system';
  const media = matchMedia('(prefers-color-scheme: dark)');
  const resolved = value === 'system' ? (media.matches ? 'dark' : 'light') : value;
  document.documentElement.dataset.theme = resolved;
  document.querySelector('meta[name="theme-color"]').content = resolved === 'dark' ? '#0b1020' : '#f6f8fc';
  byId('themeSelect').value = value;
  saveTheme(value);
  if (announce) toast(`已切換為${value === 'system' ? '跟隨系統' : value === 'dark' ? '深色' : '淺色'}主題`);
}

function clampTempo(value) {
  return Math.min(240, Math.max(40, Number(value) || 90));
}

function changePracticeSettings() {
  state.practice = {
    version: 1,
    bpm: clampTempo(byId('tempoInput').value),
    meter: Number(byId('meterSelect').value) === 3 ? 3 : 4,
    rhythm: byId('rhythmSelect').value,
    countIn: byId('countInToggle').checked
  };
  byId('tempoInput').value = state.practice.bpm;
  byId('tempoRange').value = state.practice.bpm;
  savePracticeSettings(state.practice);
  const transportState = transport.snapshot();
  if (transportState.phase === 'idle' && !transportState.metronome) updateTransport(transportState);
  else toast('新設定將於下一小節套用');
}

function initializeControls() {
  populateKeys();
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
  renderSequence(state.sequence);
  toast(`${state.current.name} 已加入目前行進`);
});
byId('viewMode').addEventListener('change', () => renderFretboard(state.current));
byId('keySelect').addEventListener('change', event => {
  stopProgressionIfActive();
  state.key = event.target.value;
  toast(`已切換至 ${state.key} 調，選擇預設即可套用轉調`);
});
byId('presets').addEventListener('click', event => {
  const button = event.target.closest('[data-preset]');
  if (!button) return;
  stopProgressionIfActive();
  state.sequence = presetItems(PRESETS[Number(button.dataset.preset)], state.key);
  document.querySelectorAll('.preset').forEach(item => item.classList.toggle('active', item === button));
  renderSequence(state.sequence);
  toast('已載入常見和弦行進');
});
byId('sequence').addEventListener('click', event => {
  stopProgressionIfActive();
  const move = event.target.closest('[data-move]');
  if (move) {
    const [index, delta] = move.dataset.move.split(',').map(Number);
    const target = index + delta;
    if (target < 0 || target >= state.sequence.length) return;
    [state.sequence[index], state.sequence[target]] = [state.sequence[target], state.sequence[index]];
    renderSequence(state.sequence);
    toast('和弦順序已調整');
    return;
  }
  const button = event.target.closest('[data-remove]');
  if (!button) return;
  const [removed] = state.sequence.splice(Number(button.dataset.remove), 1);
  renderSequence(state.sequence);
  toast(`已移除 ${removed}`);
});
byId('saveButton').addEventListener('click', () => {
  saveProgression(state.sequence);
  toast('行進與練習設定已儲存');
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
  const result = transport.toggleProgression();
  if (result === 'empty') toast('先加入至少一個和弦');
  if (result === 'started') updateTransport(transport.snapshot(), state.practice.countIn ? '預備拍準備中' : '行進準備中');
  if (result === 'stopped') updateTransport(transport.snapshot(), `已停止 · ${settingsText(state.practice)}`);
});
byId('metronomeButton').addEventListener('click', () => transport.toggleMetronome());
byId('loopButton').addEventListener('click', () => {
  const enabled = transport.toggleLoop();
  toast(enabled ? '重複播放已開啟' : '重複播放已關閉');
});

initializeControls();
renderList(state.current, state.filter);
renderFretboard(state.current);
renderFretLabels();
renderPresets();
renderSequence(state.sequence);
updateTransport();
