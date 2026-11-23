export type PulseNote = 'rest' | 'ghost' | 'accent';

export const pulseTempo = 84;
export const pulseBeats = [
  ['rest', 'ghost', 'rest', 'rest'],
  ['accent', 'rest', 'rest', 'ghost'],
  ['rest', 'rest', 'ghost', 'rest'],
  ['accent', 'rest', 'rest', 'ghost'],
] as const;

export function findAudioContext() {
  const browser = window as Window & { webkitAudioContext?: typeof AudioContext };
  return window.AudioContext ?? browser.webkitAudioContext;
}

function snareStroke(context: BaseAudioContext, accented: boolean) {
  const duration = accented ? 0.16 : 0.095;
  const volume = accented ? 0.48 : 0.11;
  const { sampleRate } = context;
  const length = Math.ceil(duration * sampleRate);
  const buffer = context.createBuffer(1, length, sampleRate);
  const samples = buffer.getChannelData(0);
  let filtered = 0;

  for (let frame = 0; frame < length; frame += 1) {
    const time = frame / sampleRate;
    const noise = Math.random() * 2 - 1;
    filtered += 0.22 * (noise - filtered);
    const wires = (noise - 0.65 * filtered) * Math.exp(-time * (accented ? 30 : 49));
    const body = Math.sin(2 * Math.PI * (174 * time + 0.36 * (1 - Math.exp(-time * 90))));
    const head = body * Math.exp(-time * 65);
    const edge = Math.min(1, time / 0.0015, (duration - time) / 0.008);
    samples[frame] = (wires * 0.73 + head * 0.27) * volume * edge;
  }

  return buffer;
}

function backingStroke(context: BaseAudioContext, instrument: 'kick' | 'hat') {
  const kick = instrument === 'kick';
  const duration = kick ? 0.22 : 0.075;
  const length = Math.ceil(duration * context.sampleRate);
  const buffer = context.createBuffer(1, length, context.sampleRate);
  const samples = buffer.getChannelData(0);
  let previousNoise = 0;

  for (let frame = 0; frame < length; frame += 1) {
    const time = frame / context.sampleRate;
    const edge = Math.min(1, time / 0.0015, (duration - time) / 0.008);
    if (kick) {
      const sweep = 51 * time + 1.3 * (1 - Math.exp(-time * 66));
      samples[frame] = Math.sin(2 * Math.PI * sweep) * Math.exp(-time * 22) * edge * 0.26;
    } else {
      const noise = Math.random() * 2 - 1;
      samples[frame] = (noise - previousNoise * 0.8) * Math.exp(-time * 63) * edge * 0.034;
      previousNoise = noise;
    }
  }

  return buffer;
}

function createPulseRenderer(context: BaseAudioContext, withBacking: boolean) {
  const output = context.createGain();
  const strokes = { accent: snareStroke(context, true), ghost: snareStroke(context, false) };
  const backing = withBacking
    ? { kick: backingStroke(context, 'kick'), hat: backingStroke(context, 'hat') }
    : undefined;
  const scheduled = new Set<AudioBufferSourceNode>();
  output.connect(context.destination);

  function setMuted(muted: boolean) {
    const level = muted ? 0 : 1;
    output.gain.cancelScheduledValues(context.currentTime);
    if (context.state === 'running') output.gain.setTargetAtTime(level, context.currentTime, 0.006);
    else output.gain.value = level;
  }

  function playStroke(buffer: AudioBuffer, start: number) {
    const source = context.createBufferSource();
    source.buffer = buffer;
    source.connect(output);
    source.start(start);
    scheduled.add(source);
    source.onended = () => {
      source.disconnect();
      scheduled.delete(source);
    };
  }

  function schedule(notes: readonly PulseNote[], start: number, stepDuration: number) {
    for (const [step, note] of notes.entries()) {
      const time = start + step * stepDuration;
      if (note !== 'rest') playStroke(strokes[note], time);
      if (!backing) continue;
      if (step % 2 === 0) playStroke(backing.hat, time);
      if (step % 8 === 0) playStroke(backing.kick, time);
    }
  }

  function stop() {
    for (const source of scheduled) {
      source.onended = null;
      source.stop();
      source.disconnect();
    }
    scheduled.clear();
  }

  return { schedule, setMuted, stop };
}

export function createPulseAudio(context: AudioContext, withBacking = false) {
  return { context, ...createPulseRenderer(context, withBacking) };
}

export async function renderPulseComparison(
  sampleRate: number,
  withoutGhostNotes: readonly PulseNote[],
  withGhostNotes: readonly PulseNote[],
  stepDuration: number,
) {
  const browser = window as Window & { webkitOfflineAudioContext?: typeof OfflineAudioContext };
  const Offline = window.OfflineAudioContext ?? browser.webkitOfflineAudioContext;
  if (!Offline) throw new Error('Offline audio rendering is unavailable');

  const framesPerBar = Math.round(withGhostNotes.length * stepDuration * sampleRate);
  const barDuration = framesPerBar / sampleRate;
  const gridDuration = barDuration / withGhostNotes.length;
  const context = new Offline(1, framesPerBar * 2, sampleRate);
  const renderer = createPulseRenderer(context, true);
  // Render both versions together so the backbeat and backing samples are identical.
  renderer.schedule(withoutGhostNotes, 0, gridDuration);
  renderer.schedule(withGhostNotes, barDuration, gridDuration);
  const buffer = await context.startRendering();
  return { buffer, barDuration, gridDuration };
}
