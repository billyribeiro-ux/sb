<script lang="ts">
  import { onMount } from 'svelte';
  import { createPulseAudio, findAudioContext, pulseBeats, pulseTempo } from '../audio/pulse-audio';

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
  const headingId = $props.id();

  let root: HTMLElement;
  let selection = $state<Version>('with');
  let playing = $state<Version | null>(null);
  let currentStep = $state<number | null>(null);
  let audioIssue = $state(false);
  let audio: ReturnType<typeof createPulseAudio> | undefined;
  let frame: number | undefined;
  let playbackId = 0;

  function stop() {
    playbackId += 1;
    if (frame !== undefined) cancelAnimationFrame(frame);
    frame = undefined;
    audio?.stop();
    playing = null;
    currentStep = null;
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
      audio ??= createPulseAudio(new Audio(), true);
      const { context } = audio;
      await context.resume();
      if (id !== playbackId) return;
      if (context.state !== 'running') {
        stop();
        audioIssue = true;
        return;
      }

      document.dispatchEvent(new CustomEvent<Element>('sergio:audio-focus', { detail: root }));
      const notes = patterns[version];
      const start = context.currentTime + 0.045;
      audio.schedule(notes, start, stepDuration);

      function draw() {
        const step = Math.floor((context.currentTime - start) / stepDuration);
        if (context.state !== 'running' || step >= notes.length) {
          stop();
          return;
        }

        currentStep = step < 0 ? null : step;
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
    function onAudioFocus(event: Event) {
      if ((event as CustomEvent<Element>).detail !== root) stop();
    }

    function onVisibilityChange() {
      if (!document.hidden) return;
      stop();
      if (audio) void audio.context.suspend().catch(() => {});
    }

    document.addEventListener('sergio:audio-focus', onAudioFocus);
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => {
      document.removeEventListener('sergio:audio-focus', onAudioFocus);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      stop();
      if (audio) void audio.context.close().catch(() => {});
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

    <div class="study">
      <p class="study-meta">Synthesized drum exercise <span>{pulseTempo} BPM · one bar</span></p>
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
      <a href="/education/#practice-heading">Explore Sergio’s drum education</a>
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
    margin-block-start: 1.1rem;
    color: var(--ivory);
    font-weight: 600;
    text-underline-offset: 0.25em;
    text-decoration-color: var(--bronze);
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
  .status { margin-top: 0.8rem; color: #f5ded1; }

  @media (max-width: 56rem) {
    .layout { grid-template-columns: minmax(0, 1fr); }
  }
</style>
