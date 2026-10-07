import {
  CHORDS, FRET_END, FRET_START, OPEN_SHAPES, PITCHES, PRESETS, RHYTHMS,
  getChord, getDefaultScaleId, getScaleOptions, shapeFor
} from './theory.js';
import { createFretboardModel } from './fretboard-model.js';

export const byId = id => document.getElementById(id);

function practiceTip(chord, isScale, scaleName) {
  if (isScale) return `<b>${scaleName}</b>是相容選項之一；請依調性與和弦功能決定實際用法。`;
  if (chord.name.endsWith('sus2') || chord.name.endsWith('sus4')) return `<b>${chord.name}</b>：聽根音、五音與掛留音，並觀察掛留音是否解決到三音。`;
  if (chord.type === 'seventh') return `<b>${chord.name}</b>：先定位根音，再比較三音與七音的聲部走向。`;
  if (chord.name.endsWith('dim')) return `<b>${chord.name}</b>：聽根音、降三度與減五度形成的緊張感。`;
  if (chord.name.endsWith('aug')) return `<b>${chord.name}</b>：聽根音、大三度與升五度形成的對稱張力。`;
  return `<b>${chord.name}</b>：根音確立中心，三音決定大小調色彩，五音提供穩定支撐。`;
}

export function renderList(current, filter) {
  const term = byId('chordSearch').value.trim().toLowerCase();
  const shown = CHORDS.filter(chord =>
    (filter === 'all' || chord.type === filter) &&
    (chord.name.toLowerCase().includes(term) || chord.notes.join(' ').toLowerCase().includes(term) || chord.displayNotes.join(' ').toLowerCase().includes(term))
  );
  byId('chordCount').textContent = `${shown.length} 個`;
  byId('chordList').replaceChildren(...(shown.length
    ? shown.map(chord => {
      const button = document.createElement('button');
      button.className = `chord-card ${chord.name === current.name ? 'active' : ''}`;
      button.dataset.chord = chord.name;
      const name = document.createElement('strong');
      const notes = document.createElement('small');
      name.textContent = chord.name;
      notes.textContent = chord.displayNotes.join(' · ');
      button.append(name, notes);
      return button;
    })
    : [Object.assign(document.createElement('p'), { className: 'sequence-empty', textContent: '找不到相符和弦' })]
  ));
}

export function renderFretboard(current, selectedScaleId) {
  const isScale = byId('viewMode').value === 'scale';
  byId('toneLegendLabel').textContent = isScale ? '音階音' : '和弦組成音';
  const model = createFretboardModel(current, isScale ? 'scale' : 'chord', selectedScaleId);
  const scaleInfo = model.scale;
  byId('selectedName').textContent = current.name;
  byId('noteList').textContent = current.displayNotes.join(' · ');
  byId('noteListMobile').textContent = current.displayNotes.join(' · ');
  byId('formula').textContent = current.formula;
  byId('formulaMobile').textContent = current.formula;
  byId('scaleName').textContent = scaleInfo.name;
  byId('soundLabel').textContent = `${current.name} ${isScale ? scaleInfo.name : '和弦'}`;
  byId('shapeName').textContent = OPEN_SHAPES[current.name]?.label || '四弦音高配置';
  byId('shapeFrets').textContent = shapeFor(current);
  const insight = byId('insight').querySelector('p');
  insight.replaceChildren();
  const tip = practiceTip(current, isScale, scaleInfo.name);
  const [heading, detail] = tip.split('</b>');
  const bold = document.createElement('b');
  bold.textContent = heading.replace('<b>', '');
  insight.append(bold, document.createTextNode(detail || ''));

  const cells = [];
  [...model.strings].reverse().forEach(stringModel => {
    const { stringNumber, openName: open, label: stringName } = stringModel;
    const label = document.createElement('div');
    label.className = 'string-label';
    label.setAttribute('aria-label', `第 ${stringNumber} 弦，${stringName}`);
    const strong = document.createElement('strong');
    const small = document.createElement('small');
    strong.textContent = open;
    small.textContent = stringNumber;
    label.append(strong, small);
    cells.push(label);
    stringModel.frets.forEach(cell => {
      const string = document.createElement('div');
      string.className = `string ${cell.fret > 7 ? 'far-fret' : ''}`;
      const note = document.createElement(cell.active ? 'button' : 'span');
      note.className = `note ${cell.kind} ${cell.active ? (isScale ? 'scale-tone' : 'chord-tone') : ''}`;
      if (cell.active) {
        note.dataset.stringNumber = cell.stringNumber;
        note.dataset.fret = cell.fret;
        note.dataset.midi = cell.midi;
        note.dataset.pitchClass = cell.pitchClass;
        note.dataset.displayName = cell.displayName;
        const roleLabel = cell.kind === 'root' ? '根音' : isScale ? '音階音' : '和弦組成音';
        note.setAttribute('aria-label', `第 ${stringNumber} 弦第 ${cell.fret} 格：${cell.displayName}，${roleLabel}`);
        note.textContent = cell.displayName;
      } else {
        note.setAttribute('aria-hidden', 'true');
      }
      string.append(note);
      cells.push(string);
    });
  });
  [3, 5, 7, 9, 12].forEach(fret => {
    const marker = document.createElement('span');
    marker.className = `fret-marker ${fret === 12 ? 'double' : ''}`;
    marker.style.setProperty('--fret-position', fret - 0.5);
    marker.setAttribute('aria-hidden', 'true');
    cells.push(marker);
  });
  byId('fretboardGrid').replaceChildren(...cells);
  return model;
}

export function renderScaleOptions(chord, selectedId) {
  const options = getScaleOptions(chord);
  const select = byId('scaleOptionSelect');
  select.replaceChildren(...options.map(option => {
    const element = document.createElement('option');
    element.value = option.id;
    element.textContent = option.label;
    return element;
  }));
  const resolved = options.some(option => option.id === selectedId) ? selectedId : getDefaultScaleId(chord);
  select.value = resolved;
  byId('scaleOptionControl').hidden = byId('viewMode').value !== 'scale';
  return resolved;
}

export function renderChordHint(hint) {
  const container = byId('openStringHints');
  byId('fretboardGrid').classList.toggle('chord-previewing', Boolean(hint));
  if (!hint) {
    container.replaceChildren();
    container.hidden = true;
    document.querySelectorAll('.note.hinted').forEach(note => note.classList.remove('hinted'));
    return;
  }
  container.hidden = false;
  const label = document.createElement('strong');
  label.textContent = '空弦：';
  container.replaceChildren(label, ...hint.openStrings.map(string => {
    const span = document.createElement('span');
    span.textContent = `${string.label}（0）`;
    return span;
  }));
  hint.fretted.forEach(cell => {
    byId('fretboardGrid').querySelector(`[data-string-number="${cell.stringNumber}"][data-fret="${cell.fret}"]`)?.classList.add('hinted');
  });
}

export function renderSoundingCell(cell) {
  document.querySelectorAll('.note.sounding').forEach(note => note.classList.remove('sounding'));
  if (!cell) return;
  byId('fretboardGrid').querySelector(`[data-string-number="${cell.stringNumber}"][data-fret="${cell.fret}"]`)?.classList.add('sounding');
}

export function renderFretLabels() {
  const scroll = byId('fretboard').querySelector('.fretboard-scroll');
  const labels = byId('fretboard').querySelector('.fret-labels');
  if (labels.parentElement !== scroll) scroll.append(labels);
  const spacer = document.createElement('span');
  spacer.className = 'string-label-spacer';
  spacer.setAttribute('aria-hidden', 'true');
  const frets = Array.from({ length: FRET_END - FRET_START + 1 }, (_, index) => {
    const label = document.createElement('span');
    label.setAttribute('aria-label', `第 ${index + FRET_START} 格`);
    label.textContent = index + FRET_START;
    return label;
  });
  labels.replaceChildren(spacer, ...frets);
  labels.setAttribute('aria-label', '第 1 至第 22 格標示');
  document.querySelector('footer p').textContent = '標準調弦 · 1–22 格';
}

export function renderPresets() {
  const buttons = PRESETS.map((preset, index) => {
    const button = document.createElement('button');
    button.className = 'preset';
    button.dataset.preset = index;
    const title = document.createElement('small');
    const name = document.createElement('strong');
    title.textContent = preset.title;
    name.textContent = preset.name;
    button.append(title, name);
    return button;
  });
  byId('presets').replaceChildren(...buttons);
}

export function renderSequence(sequence) {
  const scrollLeft = byId('sequence').scrollLeft;
  if (!sequence.length) {
    const empty = document.createElement('p');
    empty.className = 'sequence-empty';
    empty.textContent = '從左側選擇一個和弦，開始建立行進。';
    byId('sequence').replaceChildren(empty);
    return;
  }
  const nodes = [];
  sequence.forEach((name, index) => {
    const chord = getChord(name);
    const item = document.createElement('div');
    item.className = 'sequence-item';
    item.dataset.index = index;
    const card = document.createElement('div');
    card.className = 'sequence-card';
    const strong = document.createElement('strong');
    const small = document.createElement('small');
    strong.textContent = name;
    small.textContent = chord.displayNotes.join(' · ');
    card.append(strong, small);
    const controls = document.createElement('span');
    controls.className = 'move-controls';
    const handle = document.createElement('button');
    handle.dataset.dragHandle = '';
    handle.setAttribute('aria-label', `排序 ${name}，按空白鍵後使用左右方向鍵`);
    handle.setAttribute('aria-pressed', 'false');
    handle.textContent = '拖曳';
    const remove = document.createElement('button');
    remove.dataset.remove = index;
    remove.setAttribute('aria-label', `移除 ${name}`);
    remove.textContent = '×';
    controls.append(handle, remove);
    item.append(card, controls);
    nodes.push(item);
    if (index < sequence.length - 1) {
      const arrow = document.createElement('span');
      arrow.className = 'arrow';
      arrow.textContent = '→';
      nodes.push(arrow);
    }
  });
  byId('sequence').replaceChildren(...nodes);
  byId('sequence').scrollLeft = scrollLeft;
}

export function settingsText(settings) {
  return `${settings.bpm} BPM · ${settings.meter}/4 · ${RHYTHMS[settings.rhythm].label}`;
}

export function renderTransport(state, settings, statusMessage = '') {
  const active = state.phase === 'countIn' || state.phase === 'playing' || state.phase === 'finishing';
  byId('progressionPlayButton').textContent = active ? '■ 停止行進' : '▶ 行進';
  byId('progressionPlayButton').setAttribute('aria-pressed', String(active));
  byId('metronomeButton').textContent = state.metronome ? '■ 停止節拍器' : '● 節拍器';
  byId('metronomeButton').setAttribute('aria-pressed', String(state.metronome));
  byId('metronomeButton').classList.toggle('active', state.metronome);
  byId('loopButton').classList.toggle('active', state.loop);
  byId('loopButton').setAttribute('aria-pressed', String(state.loop));
  byId('transportStatus').textContent = statusMessage || settingsText(settings);
}

export function renderStep(step) {
  const subdivisions = RHYTHMS[step.settings.rhythm].subdivisions;
  byId('metronomeButton').classList.add('pulse');
  setTimeout(() => byId('metronomeButton').classList.remove('pulse'), 70);
  if (step.phase === 'countIn') {
    byId('transportStatus').textContent = `預備拍 ${Math.floor(step.subdivision / subdivisions) + 1} / ${step.settings.meter}`;
    return;
  }
  if (step.phase === 'playing' && step.chordName) {
    document.querySelectorAll('.sequence-card').forEach((card, index) => {
      const playing = index === step.progressionIndex;
      card.classList.toggle('playing', playing);
      if (playing) card.setAttribute('aria-current', 'step');
      else card.removeAttribute('aria-current');
    });
    byId('transportStatus').textContent = `第 ${step.progressionIndex + 1} 顆 ${step.chordName} · ${step.settings.bpm} BPM · ${step.settings.meter}/4 · ${RHYTHMS[step.settings.rhythm].label}`;
  }
}

export function clearPlayingCards() {
  document.querySelectorAll('.sequence-card').forEach(card => {
    card.classList.remove('playing');
    card.removeAttribute('aria-current');
  });
}

export function populateKeys() {
  const options = PITCHES.map(note => {
    const option = document.createElement('option');
    option.value = note;
    option.textContent = note;
    return option;
  });
  byId('keySelect').replaceChildren(...options);
}
