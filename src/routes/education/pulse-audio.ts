export type PulseNote = 'rest' | 'ghost' | 'accent';

export function findAudioContext() {
  const browser = window as Window & { webkitAudioContext?: typeof AudioContext };
  return window.AudioContext ?? browser.webkitAudioContext;
}

function snareStroke(context: AudioContext, accented: boolean) {
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

export function createPulseAudio(context: AudioContext) {
  const output = context.createGain();
  const strokes = { accent: snareStroke(context, true), ghost: snareStroke(context, false) };
  const scheduled = new Set<AudioBufferSourceNode>();
  output.connect(context.destination);

  function setMuted(muted: boolean) {
    const level = muted ? 0 : 1;
    output.gain.cancelScheduledValues(context.currentTime);
    if (context.state === 'running') output.gain.setTargetAtTime(level, context.currentTime, 0.006);
    else output.gain.value = level;
  }

  function schedule(notes: readonly PulseNote[], start: number, stepDuration: number) {
    for (const [step, note] of notes.entries()) {
      if (note === 'rest') continue;
      const source = context.createBufferSource();
      source.buffer = strokes[note];
      source.connect(output);
      scheduled.add(source);
      source.onended = () => {
        source.disconnect();
        scheduled.delete(source);
      };
      source.start(start + step * stepDuration);
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

  return { context, schedule, setMuted, stop };
}
