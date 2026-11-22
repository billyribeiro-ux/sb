<script lang="ts">
  import type { Attachment } from 'svelte/attachments';
  import ArrowDownIcon from 'phosphor-svelte/lib/ArrowDownIcon';
  import PlayIcon from 'phosphor-svelte/lib/PlayIcon';
  import WaveformIcon from 'phosphor-svelte/lib/WaveformIcon';
  import PerformanceFilm from './PerformanceFilm.svelte';
  import ArtistOpening from './ArtistOpening.svelte';
  import HeroRimLight from '#lib/motion/HeroRimLight.svelte';
  import { cinemaScrollTo, heroSequence } from '#lib/motion/hero-sequence';
  import { createCymbalAudio } from '#lib/motion/cymbal-audio';
  import { heroChapters, notesFilm, performanceStart } from './hero-chapters';
  import './artist-hero.css';

  let { onwatch, filmBlocked }: { onwatch: (event: MouseEvent) => void; filmBlocked: boolean } = $props();
  let rootEl: HTMLElement | undefined;
  let rimLight: HeroRimLight | undefined;
  let audio: ReturnType<typeof createCymbalAudio> | undefined;
  let filmPrepared = $state(false);
  let filmActive = $state(false);
  let filmAngle = $state('Front angle');
  let activeScene = $state('portrait');
  let activeBeat = $state(-1);
  let strikes = $state(0);

  const firstChars = [...'Sergio'].map((char, index) => ({ id: `f-${index}`, char }));
  const lastChars = [...'Bellotti'].map((char, index) => ({ id: `l-${index}`, char }));
  const meterBeats = [0, 1, 2, 3, 4, 5, 6] as const;

  const scenes = [
    { id: 'portrait', label: 'Opening', start: 0 },
    ...heroChapters.map((chapter) => ({ id: chapter.id, label: chapter.title, start: chapter.start })),
    { id: 'film', label: 'Happy People 7/4', start: performanceStart },
  ].sort((a, b) => a.start - b.start);

  const activeSceneIndex = $derived(Math.max(0, scenes.findIndex((scene) => scene.id === activeScene)));
  const activeSceneLabel = $derived(scenes[activeSceneIndex]?.label ?? 'Opening');

  function sweepCymbal(progress: number) {
    rimLight?.sweep(progress);
  }

  function handleSceneChange(scene: string) {
    activeScene = scene;
  }

  const mountHero: Attachment<HTMLElement> = (node) => {
    rootEl = node;
    const prepare = () => { filmPrepared = true; };
    const start = () => { filmActive = true; };
    const stop = () => {
      filmActive = false;
      activeBeat = -1;
    };
    node.addEventListener('herofilmprepare', prepare);
    node.addEventListener('herofilmstart', start);
    node.addEventListener('herofilmstop', stop);

    const sequence = heroSequence(node, { sweepCymbal, onSceneChange: handleSceneChange });

    return () => {
      sequence?.destroy?.();
      node.removeEventListener('herofilmprepare', prepare);
      node.removeEventListener('herofilmstart', start);
      node.removeEventListener('herofilmstop', stop);
      audio?.destroy();
      rootEl = undefined;
    };
  };

  function updateShot(time: number) {
    filmAngle = time < 4.033333 ? 'Front angle'
      : time < 6.8 ? 'Overhead'
      : 'Wide shot';
    // Happy People 7/4 pulse (~112 BPM -> 1.867 beats/sec)
    activeBeat = filmActive && time > 0.05 ? Math.floor(time * (112 / 60)) % 7 : -1;
  }

  function strike() {
    if (rootEl) document.dispatchEvent(new CustomEvent('sergio:audio-focus', { detail: rootEl }));
    strikes += 1;
    rimLight?.strike();
    audio ??= createCymbalAudio();
    audio.strike();
  }

  function jumpToScene(scene: { id: string; start: number }) {
    if (!rootEl) return;
    const runway = rootEl.clientHeight - window.innerHeight;
    if (runway <= 0) return;
    const top = rootEl.getBoundingClientRect().top + window.scrollY;
    const offset = scene.id === 'portrait' ? 0
      : scene.id === 'discovery' ? 0.992
      : scene.id === 'film' ? Math.min(0.92, scene.start + 0.09)
      : Math.min(0.99, scene.start + 0.055);
    void cinemaScrollTo(top + offset * runway);
  }

  function nextScene() {
    const current = scenes.findIndex((scene) => scene.id === (rootEl?.dataset.scene ?? activeScene));
    const next = scenes[current + 1];
    if (!next) return;
    jumpToScene(next);
  }

  const portraitCrop = '(max-width: 850px), (max-aspect-ratio: 5/4)';
</script>

<section
  class="artist-hero"
  data-motion-hero
  data-hero-sequence
  {@attach mountHero}
  aria-labelledby="hero-title"
>
  <h1 class="hero-accessible-title" id="hero-title" tabindex="-1">Sergio Bellotti</h1>
  <div class="hero-stage" data-hero-stage>
    <div class="hero-poster" data-hero-poster>
      <picture class="hero-plate" data-hero-backdrop>
        <source media={portraitCrop} srcset="/images/hero-opening-mobile-768.webp 768w, /images/hero-opening-mobile.webp 1200w" sizes="max(100vw, 80svh)" />
        <img
          src="/images/hero-opening.webp"
          srcset="/images/hero-opening-1280.webp 1280w, /images/hero-opening.webp 3840w"
          sizes="max(100vw, 150svh)"
          alt="Sergio Bellotti behind a bronze cymbal in the studio"
          width="3840"
          height="2560"
          fetchpriority="high"
        />
      </picture>
      <div class="hero-poster-shade"></div>
      <div class="hero-rim" data-hero-rim aria-hidden="true">
        <HeroRimLight bind:this={rimLight} />
      </div>
      {#if strikes}
        {#key strikes}
          <div class="hero-strike-trace" aria-hidden="true"><span></span><span></span></div>
        {/key}
      {/if}
      <div class="hero-poster-vignette"></div>
      <div class="hero-name" data-hero-type>
        <ArtistOpening />
        <span class="hero-name-first" aria-hidden="true">
          <span class="hero-name-mask" data-hero-name-line>
            {#each firstChars as item (item.id)}<span class="hero-char" data-hero-char>{item.char}</span>{/each}
          </span>
        </span>
        <span class="hero-name-last" aria-hidden="true">
          <span class="hero-name-mask" data-hero-name-line>
            {#each lastChars as item (item.id)}<span class="hero-char" data-hero-char>{item.char}</span>{/each}
          </span>
        </span>
      </div>
    </div>

    {#each heroChapters as chapter, index (chapter.id)}
      <section
        class={['hero-chapter', chapter.motion && 'hero-motion-chapter']}
        data-hero-chapter={chapter.id}
        inert
        aria-labelledby={`hero-chapter-${chapter.id}`}
        style:--chapter-focus={chapter.position}
        style:--chapter-origin={chapter.origin ?? '50% 18%'}
        style:--chapter-tint={chapter.tint}
      >
        <div class="hero-chapter-plate" data-chapter-plate data-hero-video={chapter.motion ? '' : undefined}>
          <img
            data-src={chapter.image.startsWith('/') ? chapter.image : `/images/${chapter.image}`}
            data-srcset={chapter.srcset}
            sizes="100vw"
            alt=""
            decoding="async"
          />
          {#if chapter.motion}
            <video
              data-src={chapter.motion}
              data-chapter-motion
              preload="none"
              muted
              playsinline
              loop
              aria-hidden="true"
              onplaying={(event) => { event.currentTarget.dataset.playing = 'true'; }}
              onpause={(event) => { delete event.currentTarget.dataset.playing; }}
            ></video>
          {/if}
        </div>
        <div class="hero-chapter-grade" aria-hidden="true"></div>
        <div class="hero-chapter-copy">
          <p class="hero-chapter-index hero-film-line" aria-hidden="true">
            <span data-chapter-line>{String(index + 1).padStart(2, '0')} / {String(heroChapters.length).padStart(2, '0')}</span>
          </p>
          <h2 class="hero-film-line" id={`hero-chapter-${chapter.id}`}><span data-chapter-line>{chapter.title}</span></h2>
          <p class="hero-film-line"><span data-chapter-line>{chapter.copy}</span></p>
          {#if chapter.id === 'discovery'}
            <a href="#hear-the-difference" data-chapter-link>Try the ghost-note comparison</a>
          {/if}
        </div>
      </section>
    {/each}

    <div class="hero-finale" data-hero-finale aria-hidden="true" inert>
      <div class="hero-finale-screen" data-hero-video>
        <PerformanceFilm
          {...notesFilm}
          prepared={filmPrepared}
          active={filmActive && !filmBlocked}
          loop={false}
          ontime={updateShot}
          heroMode
        />
      </div>
      <div class="hero-finale-title" data-hero-finale-title>
        <p class="hero-film-label hero-film-line"><span data-hero-film-line>Release · Studio performance</span></p>
        <p class="hero-film-line"><span data-hero-film-line>Happy People 7/4</span></p>
        <p class="hero-film-copy hero-film-line"><span data-hero-film-line>Seven beats to the bar.</span></p>
      </div>
      <p class="hero-shot" data-hero-shot aria-hidden="true">
        {#key filmAngle}<span>{filmAngle}</span>{/key}
      </p>
      <div class="hero-meter" data-hero-meter aria-hidden="true">
        <span>7 / 4</span>
        <div>
          {#each meterBeats as beat (beat)}
            <i class={[activeBeat === beat && 'beat-live']}></i>
          {/each}
        </div>
      </div>
    </div>

    <div class="hero-grain" aria-hidden="true"></div>
    <div class="hero-edit-shadow" data-hero-edit-shadow aria-hidden="true"></div>
    <div class="hero-cut-light" data-hero-cut-light aria-hidden="true"></div>

    <div class="hero-meta" data-hero-details>
      <p class="hero-origin" data-hero-meta-line>Bari, Italy <span></span> Boston, MA</p>
      <p class="hero-roles" data-hero-meta-line>Drummer · Educator · Producer</p>
      <p class="hero-credential" data-hero-meta-line>Associate Professor of Percussion<br />Berklee College of Music</p>
    </div>

    <div class="hero-dock">
      <div class="hero-dock-left">
        <button class="hero-scroll hero-next" type="button" onclick={nextScene}>
          <ArrowDownIcon size={17} weight="bold" />
          <span>Next scene</span>
        </button>
        <a class="hero-scroll" href="#hear-the-difference">
          <ArrowDownIcon size={17} weight="bold" />
          <span>Hear the difference</span>
        </a>
      </div>

      <nav class="hero-reel-nav" aria-label="Film chapters">
        <span class="hero-reel-readout" aria-hidden="true">
          <strong>{String(activeSceneIndex + 1).padStart(2, '0')}</strong>
          <span>/ {String(scenes.length).padStart(2, '0')}</span>
          <em>{activeSceneLabel}</em>
        </span>
        <div class="hero-reel-ticks">
          {#each scenes as scene, index (scene.id)}
            <button
              type="button"
              class={['hero-reel-tick', activeScene === scene.id && 'is-current', index < activeSceneIndex && 'is-past']}
              aria-label={`Jump to ${scene.label}`}
              aria-current={activeScene === scene.id ? 'step' : undefined}
              onclick={() => jumpToScene(scene)}
            >
              <span></span>
            </button>
          {/each}
        </div>
      </nav>

      <div class="hero-actions">
        <button class="hero-strike" type="button" onclick={strike}>
          <WaveformIcon size={19} weight="regular" />
          <span>Strike cymbal</span>
        </button>
        <a class="hero-watch" href="#performance-film" onclick={onwatch}>
          <PlayIcon size={15} weight="fill" />
          <span>Watch performance</span>
        </a>
      </div>
      <span class="hero-progress" data-hero-progress aria-hidden="true"></span>
    </div>
  </div>
</section>
