import {
  CHORDS, FRET_END, FRET_START, OPEN_SHAPES, PITCHES, PRESETS, RHYTHMS, STRINGS,
  getChord, scaleFor, shapeFor, spellTone
} from './theory.js';

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

export function renderFretboard(current) {
  const root = current.notes[0];
  const scaleInfo = scaleFor(current);
  const scale = scaleInfo.steps.map(step => PITCHES[(PITCHES.indexOf(root) + step) % 12]);
  const scaleNames = scale.map((note, index) => spellTone(current.displayNotes[0], scaleInfo.degrees[index], note));
  const isScale = byId('viewMode').value === 'scale';
  const activeNotes = isScale ? scale : current.notes;
  const activeNames = isScale ? scaleNames : current.displayNotes;
  byId('selectedName').textContent = current.name;
  byId('noteList').textContent = current.displayNotes.join(' · ');
  byId('formula').textContent = current.formula;
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
  [...STRINGS].reverse().forEach((open, stringIndex) => {
    const stringNumber = stringIndex + 1;
    const stringName = stringNumber === 1 ? '高音 E' : stringNumber === 6 ? '低音 E' : `${open} 弦`;
    const label = document.createElement('div');
    label.className = 'string-label';
    label.setAttribute('aria-label', `第 ${stringNumber} 弦，${stringName}`);
    const strong = document.createElement('strong');
    const small = document.createElement('small');
    strong.textContent = open;
    small.textContent = stringNumber;
    label.append(strong, small);
    cells.push(label);
    for (let fret = FRET_START; fret <= FRET_END; fret++) {
      const note = PITCHES[(PITCHES.indexOf(open) + fret) % 12];
      const active = activeNotes.includes(note);
      const kind = note === root ? 'root' : active ? 'tone' : '';
      const displayNote = active ? activeNames[activeNotes.indexOf(note)] : note;
      const string = document.createElement('div');
      string.className = 'string';
      const button = document.createElement('button');
      button.className = `note ${kind}`;
      button.dataset.note = note;
      button.setAttribute('aria-label', `第 ${stringNumber} 弦第 ${fret} 格：${displayNote}${kind === 'root' ? '，根音' : kind ? '，已選音' : ''}`);
      button.textContent = kind ? displayNote : '';
      string.append(button);
      cells.push(string);
    }
  });
  byId('fretboardGrid').replaceChildren(...cells);
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
    const card = document.createElement('button');
    card.className = 'sequence-card';
    card.dataset.remove = index;
    card.title = `移除 ${name}`;
    const strong = document.createElement('strong');
    const small = document.createElement('small');
    strong.textContent = name;
    small.textContent = chord.displayNotes.join(' · ');
    card.append(strong, small);
    const controls = document.createElement('span');
    controls.className = 'move-controls';
    [-1, 1].forEach(delta => {
      const button = document.createElement('button');
      button.dataset.move = `${index},${delta}`;
      button.setAttribute('aria-label', `${name} ${delta < 0 ? '向前' : '向後'}移`);
      button.textContent = delta < 0 ? '‹' : '›';
      controls.append(button);
    });
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
}

export function settingsText(settings) {
  return `${settings.bpm} BPM · ${settings.meter}/4 · ${RHYTHMS[settings.rhythm].label}`;
}

export function renderTransport(state, settings, statusMessage = '') {
  const active = state.phase === 'countIn' || state.phase === 'playing' || state.phase === 'finishing';
  byId('progressionPlayButton').textContent = active ? 'Ⅱ 暫停行進' : '▶ 行進';
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
    document.querySelectorAll('.sequence-card').forEach((card, index) => card.classList.toggle('playing', index === step.progressionIndex));
    byId('transportStatus').textContent = `第 ${step.progressionIndex + 1} 顆 ${step.chordName} · ${step.settings.bpm} BPM · ${step.settings.meter}/4 · ${RHYTHMS[step.settings.rhythm].label}`;
  }
}

export function clearPlayingCards() {
  document.querySelectorAll('.sequence-card').forEach(card => card.classList.remove('playing'));
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
