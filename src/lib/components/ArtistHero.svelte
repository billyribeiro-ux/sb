<script lang="ts">
  import { onMount } from 'svelte';
  import ArrowDownIcon from 'phosphor-svelte/lib/ArrowDownIcon';
  import PlayIcon from 'phosphor-svelte/lib/PlayIcon';
  import WaveformIcon from 'phosphor-svelte/lib/WaveformIcon';
  import PerformanceFilm from './PerformanceFilm.svelte';
  import HeroRimLight from '#lib/motion/HeroRimLight.svelte';
  import { heroSequence } from '#lib/motion/hero-sequence';
  import { createCymbalAudio } from '#lib/motion/cymbal-audio';
  import { artist } from '#lib/site';
  import './artist-hero.css';

  let { onwatch }: { onwatch: (event: MouseEvent) => void } = $props();
  let root: HTMLElement;
  let rimLight: HeroRimLight;
  let audio: ReturnType<typeof createCymbalAudio> | undefined;
  let filmActive = $state(false);
  let strikes = $state(0);

  onMount(() => {
    const start = () => { filmActive = true; };
    const stop = () => { filmActive = false; };
    root.addEventListener('herofilmstart', start);
    root.addEventListener('herofilmstop', stop);

    return () => {
      root.removeEventListener('herofilmstart', start);
      root.removeEventListener('herofilmstop', stop);
      audio?.destroy();
    };
  });

  function strike() {
    strikes += 1;
    rimLight?.strike();
    audio ??= createCymbalAudio();
    audio.strike();
  }

  const firstName = [...'Sergio'];
  const lastName = [...'Bellotti'];
</script>

<section
  class="artist-hero"
  data-motion-hero
  data-hero-sequence
  use:heroSequence
  bind:this={root}
  aria-labelledby="hero-title"
>
  <h1 class="hero-accessible-title" id="hero-title">Sergio Bellotti</h1>
  <div class="hero-stage" data-hero-stage>
  <div class="hero-poster" data-hero-poster>
    <picture class="hero-plate" data-hero-backdrop>
      <source media="(max-width: 750px)" srcset="/images/hero-mobile-768.webp 768w, /images/hero-mobile.webp 1200w" sizes="100vw" />
      <img
        src="/images/hero.webp"
        srcset="/images/hero-1280.webp 1280w, /images/hero.webp 2560w, /images/hero-3840.webp 3840w"
        sizes="100vw"
        alt="Sergio Bellotti smiling behind a hammered bronze cymbal"
        width="2560"
        height="1706"
        fetchpriority="high"
      />
    </picture>
    <div class="hero-poster-shade"></div>
    <div class="hero-name" aria-hidden="true" data-hero-type>
      <span class="hero-name-first" aria-hidden="true">{#each firstName as character}<span data-hero-letter>{character}</span>{/each}</span>
      <span class="hero-name-last" aria-hidden="true">{#each lastName as character}<span data-hero-letter>{character}</span>{/each}</span>
    </div>
    <picture class="hero-subject" data-hero-foreground aria-hidden="true">
      <source media="(max-width: 750px)" srcset="/images/hero-subject-mobile-768.webp 768w, /images/hero-subject-mobile.webp 1200w" sizes="100vw" />
      <img
        src="/images/hero-subject.webp"
        srcset="/images/hero-subject-1280.webp 1280w, /images/hero-subject.webp 2560w, /images/hero-subject-3840.webp 3840w"
        sizes="100vw"
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
  </div>

  <div class="hero-finale" data-hero-finale aria-hidden="true">
    <div class="hero-finale-screen" data-hero-video>
      <PerformanceFilm
        src="/videos/sergio-hero-finale.mp4"
        src4k="/videos/sergio-hero-finale-4k.mp4"
        poster="/videos/sergio-hero-finale-poster.webp"
        label="Sergio Bellotti performing Happy People 7/4 in the studio"
        active={filmActive}
        heroMode
      />
    </div>
    <div class="hero-finale-title" data-hero-finale-title aria-hidden="true">
      <p class="hero-film-label">In session</p>
      <p>Happy People 7/4</p>
    </div>
  </div>

  <div class="hero-meta" data-hero-details>
    <p class="hero-origin">Bari, Italy <span></span> Boston, MA</p>
    <p class="hero-roles">Drummer.<br />Educator.<br />Producer.</p>
  </div>

  <div class="hero-dock">
    <a class="hero-scroll" href="#performance-film">
      <ArrowDownIcon size={17} weight="bold" />
      <span>See Sergio play</span>
    </a>
    <div class="hero-actions">
      <button class="hero-strike" type="button" onclick={strike}>
        <WaveformIcon size={19} weight="regular" />
        <span>Strike cymbal</span>
      </button>
      <a class="hero-watch" href={`https://www.youtube.com/watch?v=${artist.reel}`} onclick={onwatch}>
        <PlayIcon size={15} weight="fill" />
        <span>Watch performance</span>
      </a>
    </div>
    <span class="hero-progress" data-hero-progress aria-hidden="true"></span>
  </div>
  </div>
</section>
