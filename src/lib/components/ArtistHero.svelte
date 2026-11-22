<script lang="ts">
  import { onMount } from 'svelte';
  import ArrowDownIcon from 'phosphor-svelte/lib/ArrowDownIcon';
  import PlayIcon from 'phosphor-svelte/lib/PlayIcon';
  import WaveformIcon from 'phosphor-svelte/lib/WaveformIcon';
  import PerformanceFilm from './PerformanceFilm.svelte';
  import ArtistOpening from './ArtistOpening.svelte';
  import HeroRimLight from '#lib/motion/HeroRimLight.svelte';
  import { heroSequence } from '#lib/motion/hero-sequence';
  import { createCymbalAudio } from '#lib/motion/cymbal-audio';
  import './artist-hero.css';

  let { onwatch, filmBlocked }: { onwatch: (event: MouseEvent) => void; filmBlocked: boolean } = $props();
  let root: HTMLElement;
  let rimLight: HeroRimLight;
  let audio: ReturnType<typeof createCymbalAudio> | undefined;
  let filmPrepared = $state(false);
  let filmActive = $state(false);
  let filmAngle = $state('Side angle');
  let strikes = $state(0);

  onMount(() => {
    const prepare = () => { filmPrepared = true; };
    const start = () => { filmActive = true; };
    const stop = () => { filmActive = false; };
    root.addEventListener('herofilmprepare', prepare);
    root.addEventListener('herofilmstart', start);
    root.addEventListener('herofilmstop', stop);

    return () => {
      root.removeEventListener('herofilmprepare', prepare);
      root.removeEventListener('herofilmstart', start);
      root.removeEventListener('herofilmstop', stop);
      audio?.destroy();
    };
  });

  function sweepCymbal(progress: number) {
    rimLight?.sweep(progress);
  }

  function updateShot(time: number) {
    filmAngle = time < 1.467 ? 'Side angle'
      : time < 5.833 ? 'Front angle'
      : time < 8.6 ? 'Overhead'
      : 'Wide shot';
  }

  function strike() {
    document.dispatchEvent(new CustomEvent('sergio:audio-focus', { detail: root }));
    strikes += 1;
    rimLight?.strike();
    audio ??= createCymbalAudio();
    audio.strike();
  }

  const firstName = [...'Sergio'];
  const lastName = [...'Bellotti'];
  const portraitCrop = '(max-width: 850px), (max-aspect-ratio: 5/4)';
  const portraitSizes = 'max(100vw, 72svh, 27rem)';
  const openingSizes = 'max(90vw, 150svh, 55.5rem)';
</script>

<section
  class="artist-hero"
  data-motion-hero
  data-hero-sequence
  use:heroSequence={sweepCymbal}
  bind:this={root}
  aria-labelledby="hero-title"
>
  <h1 class="hero-accessible-title" id="hero-title" tabindex="-1">Sergio Bellotti</h1>
  <div class="hero-stage" data-hero-stage>
  <div class="hero-poster" data-hero-poster>
    <picture class="hero-plate" data-hero-backdrop>
      <source media={portraitCrop} srcset="/images/hero-mobile-768.webp 768w, /images/hero-mobile.webp 1200w, /images/hero-mobile-1920.webp 1920w" sizes={portraitSizes} />
      <img
        src="/images/hero.webp"
        srcset="/images/hero-1280.webp 1280w, /images/hero.webp 2560w, /images/hero-3840.webp 3840w"
        sizes={openingSizes}
        alt="Sergio Bellotti smiling behind a hammered bronze cymbal"
        width="2560"
        height="1706"
        fetchpriority="high"
      />
    </picture>
    <div class="hero-poster-shade"></div>
    <picture class="hero-subject" data-hero-foreground aria-hidden="true">
      <source media={portraitCrop} srcset="/images/hero-subject-mobile-768.webp 768w, /images/hero-subject-mobile.webp 1200w, /images/hero-subject-mobile-1920.webp 1920w" sizes={portraitSizes} />
      <img
        src="/images/hero-subject.webp"
        srcset="/images/hero-subject-1280.webp 1280w, /images/hero-subject.webp 2560w, /images/hero-subject-3840.webp 3840w"
        sizes={openingSizes}
        alt=""
        width="2560"
        height="1706"
        fetchpriority="low"
      />
    </picture>
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
      <span class="hero-name-first" aria-hidden="true"><span data-hero-name-line>{#each firstName as character}<span data-hero-letter>{character}</span>{/each}</span></span>
      <span class="hero-name-last" aria-hidden="true"><span data-hero-name-line>{#each lastName as character}<span data-hero-letter>{character}</span>{/each}</span></span>
    </div>
  </div>

  <div class="hero-session" data-hero-session>
    <picture class="hero-session-frame">
      <source media={portraitCrop} srcset="/images/performance-mobile-768.webp 768w, /images/performance-mobile.webp 1200w, /images/hero-session-mobile-1920.webp 1920w" sizes="max(100vw, 80svh)" />
      <img
        data-hero-session-image
        src="/images/performance.webp"
        srcset="/images/performance-1280.webp 1280w, /images/performance.webp 2560w, /images/performance-3840.webp 3840w"
        sizes="max(100vw, 150svh)"
        alt=""
        width="2560"
        height="1706"
        decoding="async"
        fetchpriority="low"
      />
    </picture>
    <div class="hero-session-title">
      <p class="hero-film-label hero-film-line"><span data-hero-session-line>Anticipation</span></p>
      <p class="hero-film-line"><span data-hero-session-line>Before the hit</span></p>
      <p class="hero-film-copy hero-film-line"><span data-hero-session-line>Sergio in the studio · from the artist’s photo archive</span></p>
    </div>
  </div>

  <div class="hero-bronze" data-hero-bronze aria-hidden="true">
    <img src="/images/hero-bronze-1280.webp" srcset="/images/hero-bronze-1280.webp 1280w, /images/hero-bronze.webp 2560w" sizes="100vw" width="1280" height="672" decoding="async" fetchpriority="low" alt="" />
  </div>
  <div class="hero-darkroom" data-hero-darkroom aria-hidden="true"></div>

  <div class="hero-finale" data-hero-finale aria-hidden="true" inert>
    <div class="hero-finale-screen" data-hero-video>
      <PerformanceFilm
        src="/videos/sergio-notes-between.mp4"
        src4k="/videos/sergio-notes-between-4k.mp4"
        poster="/videos/sergio-notes-between-poster.webp"
        label="Sergio Bellotti performing Happy People 7/4 in the studio"
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
      <div>{#each Array(7) as _}<i></i>{/each}</div>
    </div>
  </div>

  <div class="hero-impact" data-hero-impact aria-hidden="true"></div>

  <div class="hero-meta" data-hero-details>
    <p class="hero-origin" data-hero-opening-copy>Bari, Italy <span></span> Boston, MA</p>
    <p class="hero-roles" data-hero-opening-copy>Drummer · Educator · Producer</p>
    <p class="hero-credential" data-hero-opening-copy>Associate Professor of Percussion<br />Berklee College of Music</p>
  </div>

  <div class="hero-dock">
    <a class="hero-scroll" href="#hear-the-difference">
      <ArrowDownIcon size={17} weight="bold" />
      <span>Hear the difference</span>
    </a>
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
