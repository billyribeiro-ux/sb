const voiceLevel = 0.3
const maximumVoices = 3
const sampleRate = 48000
const tailSeconds = 1.55

// Frequencies, relative amplitudes, and damping of independent cymbal resonances.
const partials = [
  [891, 0.078, 5.9],
  [1217, 0.069, 7.7],
  [1723, 0.065, 6.1],
  [1961, 0.052, 8.3],
  [2347, 0.074, 8.9],
  [2861, 0.054, 11.1],
  [3373, 0.042, 9.1],
  [4153, 0.047, 11.4],
  [4973, 0.034, 13.2],
  [6173, 0.032, 15.2],
  [7979, 0.023, 16.7]
] as const

function synthesize(context: AudioContext) {
  const buffer = context.createBuffer(1, Math.round(sampleRate * tailSeconds), sampleRate)
  const samples = buffer.getChannelData(0)
  for (const [frequency, level, damping] of partials) {
    const phaseStep = 2 * Math.PI * frequency / sampleRate
    const decay = Math.exp(-damping / sampleRate)
    const recurrence = 2 * decay * Math.cos(phaseStep)
    let previous = 0
    let current = level * decay * Math.sin(phaseStep)

    // Advance each damped mode with a second-order recurrence.
    for (let index = 1; index < samples.length; index++) {
      samples[index] += current
      const next = recurrence * current - decay * decay * previous
      previous = current
      current = next
    }
  }

  let low = 0
  let high = 0
  let peak = 0

  for (let index = 0; index < samples.length; index++) {
    const time = index / sampleRate
    const noise = 2 * Math.random() - 1
    low += (noise - low) * 0.14
    high += (noise - high) * 0.63

    const attack = Math.min(1, time / 0.002)
    const release = Math.min(1, (tailSeconds - time) / 0.09)
    const rasp = (high - low) * (0.49 * Math.exp(-time * 65) + 0.36 * Math.exp(-time * 3.9))
    const shimmer = (noise - high) * 0.28 * Math.exp(-time * 5.8)
    const sample = (rasp + shimmer + samples[index]) * attack * release
    samples[index] = sample
    peak = Math.max(peak, Math.abs(sample))
  }

  if (peak > 0) {
    const scale = 0.74 / peak
    for (let index = 0; index < samples.length; index++) samples[index] *= scale
  }

  return buffer
}

type Voice = { source: AudioBufferSourceNode; volume: GainNode }

export function createCymbalAudio() {
  let context: AudioContext | undefined
  let sound: AudioBuffer | undefined
  let disposed = false
  const voices: Voice[] = []

  async function play() {
    if (disposed) return

    const AudioContextClass = globalThis.AudioContext ||
      (globalThis as typeof globalThis & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!AudioContextClass) return

    // Creation and resume both originate in the button's trusted click handler.
    const activeContext = context ??= new AudioContextClass()
    if (activeContext.state !== 'running') await activeContext.resume()
    if (disposed || activeContext.state !== 'running') return

    sound ??= synthesize(activeContext)

    const startTime = activeContext.currentTime
    const oldest = voices.length >= maximumVoices ? voices.shift() : undefined

    if (oldest) {
      oldest.volume.gain.setTargetAtTime(0, startTime, 0.003)
      oldest.source.stop(startTime + 0.018)
    }

    const source = activeContext.createBufferSource()
    const volume = activeContext.createGain()
    const voice = { source, volume }
    source.buffer = sound
    volume.gain.setValueAtTime(voiceLevel, startTime)
    source.connect(volume).connect(activeContext.destination)
    source.onended = () => {
      const index = voices.indexOf(voice)
      if (index >= 0) voices.splice(index, 1)
      source.disconnect()
      volume.disconnect()
    }
    voices.push(voice)
    source.start(startTime)
  }

  return {
    strike() {
      void play().catch(() => {
        // Visual feedback remains available when the browser or output device blocks audio.
      })
    },
    destroy() {
      disposed = true

      for (const { source, volume } of voices) {
        source.stop()
        source.disconnect()
        volume.disconnect()
      }

      voices.length = 0
      sound = undefined
      if (context && context.state !== 'closed') void context.close().catch(() => {})
    }
  }
}
