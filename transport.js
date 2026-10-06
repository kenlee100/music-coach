import { getAudioContext, scheduleChord, scheduleClick, stopAudio } from './audio-engine.js';
import { getChord, RHYTHMS } from './theory.js';

export function createTransport({ getSequence, getSettings, onStateChange, onStep, onFinish }) {
  const state = {
    phase: 'idle',
    metronome: false,
    loop: false,
    progressionIndex: 0
  };
  let activeSettings = { ...getSettings() };
  let subdivisionIndex = 0;
  let nextNoteTime = 0;
  let schedulerTimer;
  let finishTimer;
  let runId = 0;

  const progressionScheduling = () => state.phase === 'countIn' || state.phase === 'playing';
  const progressionEngaged = () => progressionScheduling() || state.phase === 'finishing';

  function snapshot() {
    return { ...state };
  }

  function emitState() {
    onStateChange(snapshot());
  }

  function stopClock() {
    clearInterval(schedulerTimer);
    schedulerTimer = undefined;
    subdivisionIndex = 0;
    nextNoteTime = 0;
    runId++;
  }

  function cancelFinish() {
    clearTimeout(finishTimer);
    finishTimer = undefined;
  }

  function queueVisual(start, callback, scheduledRun = runId) {
    setTimeout(() => {
      if (scheduledRun === runId) callback();
    }, Math.max(0, (start - getAudioContext().currentTime) * 1000));
  }

  function stepDuration(index, settings) {
    const beat = 60 / settings.bpm;
    if (settings.rhythm === 'swing') return index % 2 === 0 ? beat * 2 / 3 : beat / 3;
    return beat / RHYTHMS[settings.rhythm].subdivisions;
  }

  function finishProgression(at) {
    cancelFinish();
    finishTimer = setTimeout(() => {
      finishTimer = undefined;
      state.phase = 'idle';
      state.progressionIndex = 0;
      emitState();
      onFinish();
      if (!state.metronome) stopClock();
    }, Math.max(0, (at - getAudioContext().currentTime) * 1000));
  }

  function advanceStep() {
    const subdivisions = RHYTHMS[activeSettings.rhythm].subdivisions;
    const total = activeSettings.meter * subdivisions;
    nextNoteTime += stepDuration(subdivisionIndex, activeSettings);
    subdivisionIndex++;
    if (subdivisionIndex < total) return;

    subdivisionIndex = 0;
    activeSettings = { ...getSettings() };
    if (state.phase === 'countIn') {
      state.phase = 'playing';
      state.progressionIndex = 0;
      emitState();
      return;
    }
    if (state.phase !== 'playing') return;

    state.progressionIndex++;
    if (state.progressionIndex < getSequence().length) return;
    if (state.loop) {
      state.progressionIndex = 0;
      return;
    }
    finishProgression(nextNoteTime);
    state.phase = 'finishing';
  }

  function scheduleStep() {
    const subdivisions = RHYTHMS[activeSettings.rhythm].subdivisions;
    const start = nextNoteTime;
    const visualStep = {
      subdivision: subdivisionIndex,
      progressionIndex: state.progressionIndex,
      settings: { ...activeSettings },
      phase: state.phase,
      chordName: getSequence()[state.progressionIndex]
    };
    const isBeat = subdivisionIndex % subdivisions === 0;
    scheduleClick(start, subdivisionIndex === 0, isBeat);
    if (state.phase === 'playing' && visualStep.chordName) {
      const duration = Math.max(0.07, Math.min(0.52, stepDuration(subdivisionIndex, activeSettings) * 0.68));
      scheduleChord(getChord(visualStep.chordName), start, duration);
    }
    queueVisual(start, () => onStep(visualStep));
    advanceStep();
  }

  function scheduler() {
    const context = getAudioContext();
    while ((progressionScheduling() || state.metronome) && nextNoteTime < context.currentTime + 0.1) scheduleStep();
  }

  function startClock() {
    cancelFinish();
    stopAudio();
    stopClock();
    activeSettings = { ...getSettings() };
    nextNoteTime = getAudioContext().currentTime + 0.07;
    scheduler();
    schedulerTimer = setInterval(scheduler, 25);
  }

  function stopProgression(reset = true) {
    cancelFinish();
    state.phase = 'idle';
    if (reset) state.progressionIndex = 0;
    runId++;
    if (!state.metronome) {
      stopClock();
      stopAudio();
    }
    emitState();
  }

  function toggleProgression() {
    if (progressionEngaged()) {
      stopProgression();
      return 'stopped';
    }
    if (!getSequence().length) return 'empty';
    const keepMetronome = state.metronome;
    stopClock();
    stopAudio();
    state.metronome = keepMetronome;
    state.phase = getSettings().countIn ? 'countIn' : 'playing';
    state.progressionIndex = 0;
    emitState();
    startClock();
    return 'started';
  }

  function toggleMetronome() {
    state.metronome = !state.metronome;
    if (state.metronome && state.phase === 'idle') startClock();
    if (!state.metronome && state.phase === 'idle') {
      stopClock();
      stopAudio();
    }
    emitState();
  }

  function toggleLoop() {
    state.loop = !state.loop;
    emitState();
    return state.loop;
  }

  function stopForPreview() {
    cancelFinish();
    state.phase = 'idle';
    state.metronome = false;
    state.progressionIndex = 0;
    stopClock();
    stopAudio();
    emitState();
  }

  return { snapshot, stopProgression, toggleProgression, toggleMetronome, toggleLoop, stopForPreview };
}
