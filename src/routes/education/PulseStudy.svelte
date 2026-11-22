<script lang="ts">
  import { onMount } from 'svelte';
  import { createPulseAudio, findAudioContext, pulseBeats as beats, pulseTempo as tempo } from '../../lib/audio/pulse-audio';

  const notes = beats.flat();
  const stepDuration = 60 / tempo / beats[0].length;

  let currentStep = $state<number | null>(null);
  let playing = $state(false);
  let muted = $state(false);
  let supportsAudio = $state(true);
  let audioIssue = $state(false);
  let audio: ReturnType<typeof createPulseAudio> | undefined;
  let frame: number | undefined;
  let playbackId = 0;

  function stop() {
    playbackId += 1;
    if (frame !== undefined) cancelAnimationFrame(frame);
    frame = undefined;
    audio?.stop();
    playing = false;
    currentStep = null;
  }

  async function toggle() {
    if (playing) {
      stop();
      return;
    }

    const id = ++playbackId;
    playing = true;
    audioIssue = false;

    let activeAudio: typeof audio;
    const Audio = findAudioContext();
    if (Audio) {
      try {
        audio ??= createPulseAudio(new Audio());
        await audio.context.resume();
        if (id !== playbackId) return;
        if (audio.context.state === 'running') activeAudio = audio;
      } catch {
        if (id !== playbackId) return;
      }
    }
    audioIssue = supportsAudio && !activeAudio;

    const context = activeAudio?.context;
    const clock = context ? () => context.currentTime : () => performance.now() / 1000;
    const start = clock() + (context ? 0.045 : 0);
    activeAudio?.setMuted(muted);
    activeAudio?.schedule(notes, start, stepDuration);

    function draw() {
      if (context && context.state !== 'running') {
        stop();
        return;
      }

      const step = Math.floor((clock() - start) / stepDuration);
      if (step >= notes.length) stop();
      else {
        currentStep = step < 0 ? null : step;
        frame = requestAnimationFrame(draw);
      }
    }

    draw();
  }

  function toggleMute() {
    muted = !muted;
    audio?.setMuted(muted);
  }

  onMount(() => {
    supportsAudio = Boolean(findAudioContext());

    function onVisibilityChange() {
      if (!document.hidden) return;
      stop();
      if (audio) void audio.context.suspend().catch(() => {});
    }

    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange);
      stop();
      if (audio) void audio.context.close().catch(() => {});
    };
  });
</script>

<div class="pattern">
  <div class="pattern-header">
    <div>
      <h3>A ghost-note groove</h3>
      <p>Listen for the louder backbeat on two and four. The smaller marks show the quieter strokes in between.</p>
    </div>
    <div class="pattern-actions">
      <button class="pattern-control" type="button" onclick={toggle}>
        {playing ? 'Stop playback' : 'Play one bar'}
      </button>
      {#if supportsAudio}
        <button class="mute-control" type="button" onclick={toggleMute} aria-label="Mute groove" aria-pressed={muted}>
          {muted ? 'Unmute' : 'Mute'}
        </button>
      {/if}
    </div>
  </div>
  {#if !supportsAudio || audioIssue}
    <p class="audio-note" role="status">The visual pattern is available. This browser couldn’t start the sound.</p>
  {/if}

  <div class="beat-grid" aria-hidden="true">
    {#each beats as notes, beat (beat)}
      <div class="beat">
        <span class="beat-count">{beat + 1}</span>
        <div class="notes">
          {#each notes as note, subdivision (subdivision)}
            <span class="step" class:current={currentStep === beat * notes.length + subdivision}>
              <span class:ghost={note === 'ghost'} class:accent={note === 'accent'}></span>
            </span>
          {/each}
        </div>
      </div>
    {/each}
  </div>
  <div class="pattern-legend">
    <span><i class="accent"></i> Backbeat</span>
    <span><i class="ghost"></i> Ghost note</span>
    <span>{tempo} BPM · one bar</span>
  </div>
</div>

<style>
  .pattern {
    --pattern-accent: var(--accent, #dfb37b);
    --pattern-edge: color-mix(in srgb, var(--pattern-accent), transparent 70%);
    padding: clamp(1.15rem, 3.2vw, 3.25rem);
    color: var(--paper);
    background: color-mix(in srgb, var(--night), var(--pattern-accent) 7%);
    border: 1px solid var(--pattern-edge);
  }

  .pattern-header {
    display: flex;
    justify-content: space-between;
    align-items: end;
    flex-wrap: wrap;
    gap: 1rem 2rem;
  }

  .pattern-header h3 {
    font: 400 clamp(2rem, 4.3vw, 4.6rem)/0.97 var(--display, sans-serif);
  }

  .pattern-header p {
    max-width: 51ch;
    margin-top: 0.55rem;
    color: #ddd1bf;
  }

  .pattern-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  .pattern-control,
  .mute-control {
    min-block-size: 2.8rem;
    padding: 0.6rem 1.3rem;
    border: 1px solid var(--pattern-accent);
    font-weight: 700;
    cursor: pointer;
  }

  .pattern-control {
    background: var(--pattern-accent);
    color: var(--night);
  }

  .pattern-control:hover {
    background: var(--paper);
  }

  .mute-control {
    background: transparent;
    color: var(--paper);
  }

  .mute-control:hover,
  .mute-control[aria-pressed='true'] {
    border-color: var(--paper);
    background: color-mix(in srgb, var(--paper), transparent 85%);
  }

  .audio-note {
    margin-top: 1rem;
    color: #ddd1bf;
  }

  .beat-grid {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: clamp(0.3rem, 1vw, 0.9rem);
    margin-top: 1.75rem;
  }

  .beat-count {
    display: block;
    margin-bottom: 0.35rem;
    color: var(--pattern-accent);
    font-size: 0.82rem;
    font-variant-numeric: tabular-nums;
  }

  .notes {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }

  .step {
    display: grid;
    place-items: center;
    height: clamp(2rem, 5vw, 4.2rem);
    border-block: 1px solid var(--pattern-edge);
    border-inline-start: 1px solid var(--pattern-edge);
  }

  .step:last-child {
    border-inline-end: 1px solid var(--pattern-edge);
  }

  .step.current {
    outline: 2px solid var(--pattern-accent);
    outline-offset: -2px;
    background: color-mix(in srgb, var(--pattern-accent), transparent 80%);
  }

  .step span {
    inline-size: 0.23rem;
    block-size: 0.23rem;
    border-radius: 50%;
    background: color-mix(in srgb, var(--pattern-accent), transparent 70%);
  }

  .step span.ghost,
  .pattern-legend i.ghost {
    inline-size: 0.42rem;
    block-size: 0.42rem;
    background: var(--paper);
  }

  .step span.accent,
  .pattern-legend i.accent {
    inline-size: 0.65rem;
    block-size: 0.65rem;
    background: var(--pattern-accent);
  }

  .pattern-legend {
    display: flex;
    flex-wrap: wrap;
    gap: 0.35rem 1.25rem;
    margin-top: 0.85rem;
    color: #ddd1bf;
    font-size: 0.78rem;
  }

  .pattern-legend span {
    display: flex;
    align-items: center;
    gap: 0.4rem;
  }

  .pattern-legend i {
    display: inline-block;
    border-radius: 50%;
  }
</style>
