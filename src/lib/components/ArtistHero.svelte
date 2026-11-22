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
  import { heroChapters, notesFilm } from './hero-chapters';
  import './artist-hero.css';

  let { onwatch, filmBlocked }: { onwatch: (event: MouseEvent) => void; filmBlocked: boolean } = $props();
  let root: HTMLElement;
  let rimLight: HeroRimLight;
  let audio: ReturnType<typeof createCymbalAudio> | undefined;
  let filmPrepared = $state(false);
  let filmActive = $state(false);
  let filmAngle = $state('Front angle');
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
    filmAngle = time < 4.033333 ? 'Front angle'
      : time < 6.8 ? 'Overhead'
      : 'Wide shot';
  }

  function strike() {
    document.dispatchEvent(new CustomEvent('sergio:audio-focus', { detail: root }));
    strikes += 1;
    rimLight?.strike();
    audio ??= createCymbalAudio();
    audio.strike();
  }

  const portraitCrop = '(max-width: 850px), (max-aspect-ratio: 5/4)';
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
      <source media={portraitCrop} srcset="/images/hero-opening-mobile-768.webp 768w, /images/hero-opening-mobile.webp 1200w" sizes="min(100vw, 46svh)" />
      <img
        src="/images/hero-opening.webp"
        srcset="/images/hero-opening-1280.webp 1280w, /images/hero-opening.webp 3840w"
        sizes="67vw"
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
      <span class="hero-name-first" aria-hidden="true"><span data-hero-name-line>Sergio</span></span>
      <span class="hero-name-last" aria-hidden="true"><span data-hero-name-line>Bellotti</span></span>
    </div>
  </div>

  {#each heroChapters as chapter (chapter.id)}
    <section
      class="hero-chapter"
      data-hero-chapter={chapter.id}
      inert
      aria-labelledby={`hero-chapter-${chapter.id}`}
      style:--chapter-focus={chapter.position}
      style:--chapter-tint={chapter.tint}
    >
      <picture class="hero-chapter-plate" data-chapter-plate>
        {#if chapter.mobile}<source media={portraitCrop} data-srcset={chapter.mobile} />{/if}
        <img data-src={chapter.image.startsWith('/') ? chapter.image : `/images/${chapter.image}`} data-srcset={chapter.srcset} sizes="(max-width: 850px) 100vw, 78vw" alt="" decoding="async" />
      </picture>
      <div class="hero-chapter-grade" aria-hidden="true"></div>
      <div class="hero-chapter-copy">
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
      <div>{#each Array(7) as _}<i></i>{/each}</div>
    </div>
  </div>

  <div class="hero-cut-light" data-hero-cut-light aria-hidden="true"></div>

  <div class="hero-meta" data-hero-details>
    <p class="hero-origin">Bari, Italy <span></span> Boston, MA</p>
    <p class="hero-roles">Drummer · Educator · Producer</p>
    <p class="hero-credential">Associate Professor of Percussion<br />Berklee College of Music</p>
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
