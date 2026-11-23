<script lang="ts">
  import { onMount } from 'svelte';
  import { findAudioContext, pulseBeats, pulseTempo, renderPulseComparison } from '../audio/pulse-audio';

  const versions = [
    { id: 'without', label: 'Without ghost notes' },
    { id: 'with', label: 'With ghost notes' },
  ] as const;
  type Version = (typeof versions)[number]['id'];

  const withGhostNotes = pulseBeats.flat();
  const patterns = {
    with: withGhostNotes,
    without: withGhostNotes.map((note) => note === 'ghost' ? 'rest' : note),
  } as const;
  const stepsPerBeat = pulseBeats[0].length;
  const stepDuration = 60 / pulseTempo / stepsPerBeat;
  const exitFadeDuration = 0.6;
  const headingId = $props.id();

  let root: HTMLElement;
  let study: HTMLDivElement;
  let selection = $state<Version>('with');
  let playing = $state<Version | null>(null);
  let currentStep = $state<number | null>(null);
  let audioIssue = $state(false);
  let audio: AudioContext | undefined;
  let groove: ReturnType<typeof renderPulseComparison> | undefined;
  let voice: {
    source: AudioBufferSourceNode;
    gain: GainNode;
    start: number;
    fading: boolean;
  } | undefined;
  let frame: number | undefined;
  let playbackId = 0;

  function stop(ended = false) {
    playbackId += 1;
    if (frame !== undefined) cancelAnimationFrame(frame);
    frame = undefined;
    if (voice) {
      const { source, gain } = voice;
      voice = undefined;
      source.onended = null;
      if (!ended) source.stop();
      source.disconnect();
      gain.disconnect();
    }
    playing = null;
    currentStep = null;
  }

  function fadeOnExit() {
    if (!voice || audio?.state !== 'running' || audio.currentTime < voice.start) {
      stop();
      return;
    }
    if (voice.fading) return;

    const start = audio.currentTime;
    const end = start + exitFadeDuration;
    voice.fading = true;
    voice.gain.gain.setValueAtTime(1, start);
    voice.gain.gain.linearRampToValueAtTime(0, end);
    voice.source.stop(end);
  }

  function stopFromControl() {
    const activeChoice = study.querySelector<HTMLButtonElement>('[aria-pressed="true"]');
    stop();
    activeChoice?.focus({ preventScroll: true });
  }

  async function play(version: Version) {
    const wasPlaying = playing === version;
    stop();
    if (wasPlaying) return;

    selection = version;
    audioIssue = false;
    const Audio = findAudioContext();
    if (!Audio) {
      audioIssue = true;
      return;
    }

    const id = ++playbackId;
    playing = version;

    try {
      const context = audio ??= new Audio();
      const resumed = context.resume();
      groove ??= renderPulseComparison(context.sampleRate, patterns.without, patterns.with, stepDuration).catch((error: unknown) => {
        groove = undefined;
        throw error;
      });
      const [{ buffer, barDuration, gridDuration }] = await Promise.all([groove, resumed]);
      if (id !== playbackId) return;
      if (context.state !== 'running') {
        stop();
        audioIssue = true;
        return;
      }

      document.dispatchEvent(new CustomEvent<Element>('sergio:audio-focus', { detail: root }));
      const start = context.currentTime + 0.045;
      const barStart = version === 'with' ? barDuration : 0;
      const loop = context.createBufferSource();
      const gain = context.createGain();
      loop.buffer = buffer;
      loop.loop = true;
      loop.loopStart = barStart;
      loop.loopEnd = barStart + barDuration;
      loop.connect(gain);
      gain.connect(context.destination);
      loop.start(start, barStart);
      voice = { source: loop, gain, start, fading: false };
      loop.onended = () => {
        if (voice?.source === loop) stop(true);
      };

      function draw() {
        if (context.state !== 'running') {
          stop();
          return;
        }

        const step = Math.floor((context.currentTime - start) / gridDuration);
        currentStep = step < 0 ? null : step % withGhostNotes.length;
        frame = requestAnimationFrame(draw);
      }

      draw();
    } catch {
      if (id !== playbackId) return;
      stop();
      audioIssue = true;
    }
  }

  onMount(() => {
    const viewport = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting && playing !== null) fadeOnExit();
    });
    viewport.observe(study);

    function onAudioFocus(event: Event) {
      if ((event as CustomEvent<Element>).detail !== root) stop();
    }

    function onVisibilityChange() {
      if (!document.hidden) return;
      stop();
      if (audio) void audio.suspend().catch(() => {});
    }

    document.addEventListener('sergio:audio-focus', onAudioFocus);
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => {
      viewport.disconnect();
      document.removeEventListener('sergio:audio-focus', onAudioFocus);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      stop();
      if (audio) void audio.close().catch(() => {});
    };
  });
</script>

<section id="hear-the-difference" class="comparison" aria-labelledby={headingId} bind:this={root}>
  <div class="shell layout">
    <div class="copy">
      <p class="eyebrow">Practice demonstration</p>
      <h2 id={headingId}>Hear the difference.</h2>
      <p>Play the same groove both ways and listen for the quiet snare strokes between the backbeats.</p>
    </div>

    <div class="study" bind:this={study}>
      <p class="study-meta">Synthesized drum exercise <span>{pulseTempo} BPM · Loop</span></p>
      <div class="pattern" aria-hidden="true">
        {#each pulseBeats as beat, index (index)}
          <div class="beat">
            <span class="beat-count">{index + 1}</span>
            <div class="steps">
              {#each beat as _, subdivision (subdivision)}
                {@const step = index * stepsPerBeat + subdivision}
                <span class="step" class:current={currentStep === step}>
                  <span class={patterns[selection][step]}></span>
                </span>
              {/each}
            </div>
          </div>
        {/each}
      </div>

      <div class="choices">
        {#each versions as version (version.id)}
          <button
            type="button"
            aria-label={`Play ${version.label.toLowerCase()}`}
            aria-pressed={playing === version.id}
            onclick={() => play(version.id)}
          >
            <span class="control-icon" class:stop-icon={playing === version.id} aria-hidden="true"></span>
            {version.label}
          </button>
        {/each}
      </div>

      {#if audioIssue}
        <p class="status" role="status">This browser couldn’t start the sound. The snare pattern is still shown above.</p>
      {/if}
      <div class="study-footer">
        <a href="/education/#practice-heading">Explore Sergio’s drum education</a>
        {#if playing !== null}
          <button class="stop-control" type="button" aria-label="Stop drum comparison" onclick={stopFromControl}>
            <span class="control-icon stop-icon" aria-hidden="true"></span>
            Stop
          </button>
        {/if}
      </div>
    </div>
  </div>
</section>

<style>
  .comparison {
    --bronze: #e0a877;
    --ivory: #f7e9db;
    --edge: #b98a585c;
    color: var(--ivory);
    background: radial-gradient(ellipse at 80% 100%, #372219 0%, #1d1410 55%, #14100e 100%);
    border-block: 1px solid var(--edge);
    padding-block: clamp(3.2rem, 8vw, 7.5rem);
  }

  .layout {
    display: grid;
    grid-template-columns: minmax(0, 0.9fr) minmax(0, 1.1fr);
    align-items: end;
    gap: clamp(1.8rem, 6vw, 6.5rem);
  }

  .eyebrow { color: var(--bronze); }

  .copy h2 { font: 400 clamp(3.5rem, 7.4vw, 8rem)/0.84 var(--display, sans-serif); }
  .copy h2 + p { max-width: 39ch; color: #e5d2c0; }

  a {
    display: inline-block;
    color: var(--ivory);
    font-weight: 600;
    text-underline-offset: 0.25em;
    text-decoration-color: var(--bronze);
  }

  .study-footer {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 0.65rem 1rem;
    margin-block-start: 0.7rem;
    min-block-size: 2.75rem;
  }

  .study {
    border-block: 1px solid var(--edge);
    padding-block: 1.05rem;
  }

  .study-meta {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    column-gap: 0.8rem;
    color: #e5d2c0;
    font-size: 0.83rem;
  }

  .pattern,
  .steps {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }

  .pattern { margin-block: 1.05rem; gap: 0.35rem; }

  .beat-count {
    display: block;
    color: var(--bronze);
    font-size: 0.75rem;
    margin-bottom: 0.3rem;
  }

  .step {
    display: grid;
    place-items: center;
    min-block-size: clamp(2.35rem, 4vw, 3.2rem);
    border-block: 1px solid var(--edge);
    border-inline-start: 1px solid var(--edge);
  }

  .step:last-child { border-inline-end: 1px solid var(--edge); }
  .step.current { background: #b982592e; }

  .step span {
    inline-size: 0.18rem;
    aspect-ratio: 1;
    border-radius: 50%;
    background: #ac896a68;
  }

  .step .ghost { inline-size: 0.34rem; background: var(--ivory); }
  .step .accent { inline-size: 0.6rem; background: var(--bronze); }

  .choices {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0.45rem;
  }

  button {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.6rem;
    min-block-size: 2.75rem;
    padding: 0.5rem;
    border: 1px solid var(--bronze);
    background: transparent;
    color: var(--ivory);
    cursor: pointer;
    font-size: 0.88rem;
    font-weight: 650;
  }

  button:hover, button[aria-pressed='true'] {
    color: #1b120e;
    background: var(--bronze);
  }

  .control-icon {
    inline-size: 0.55rem;
    block-size: 0.65rem;
    flex: none;
    background: currentColor;
    clip-path: polygon(0 0, 100% 50%, 0 100%);
  }

  .stop-icon { inline-size: 0.6rem; block-size: 0.6rem; clip-path: none; }
  .stop-control { padding-inline: 0.8rem; }
  .status { margin-top: 0.8rem; color: #f5ded1; }

  @media (max-width: 56rem) {
    .layout { grid-template-columns: minmax(0, 1fr); }
  }
</style>
