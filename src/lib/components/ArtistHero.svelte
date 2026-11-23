<script lang="ts">
  import type { Attachment } from 'svelte/attachments';
  import ArrowDownIcon from 'phosphor-svelte/lib/ArrowDownIcon';
  import PlayIcon from 'phosphor-svelte/lib/PlayIcon';
  import SpeakerHighIcon from 'phosphor-svelte/lib/SpeakerHighIcon';
  import SpeakerSlashIcon from 'phosphor-svelte/lib/SpeakerSlashIcon';
  import WaveformIcon from 'phosphor-svelte/lib/WaveformIcon';
  import ArtistOpening from './ArtistOpening.svelte';
  import HeroRimLight from '#lib/motion/HeroRimLight.svelte';
  import { heroSequence } from '#lib/motion/hero-sequence';
  import { mountHeroPerformance } from '#lib/motion/hero-performance';
  import { createCymbalAudio } from '#lib/motion/cymbal-audio';
  import { heroChapters, heroSession } from './hero-chapters';
  import './artist-hero.css';

  let { onwatch, filmBlocked }: { onwatch: (event: MouseEvent) => void; filmBlocked: boolean } = $props();
  let rootEl: HTMLElement | undefined;
  let rimLight: HeroRimLight | undefined;
  let audio: ReturnType<typeof createCymbalAudio> | undefined;
  let transport = $state<ReturnType<typeof mountHeroPerformance>>();
  let soundPlaying = $state(false);
  let strikes = $state(0);

  const firstChars = [...'Sergio'].map((char, index) => ({ id: `f-${index}`, char }));
  const lastChars = [...'Bellotti'].map((char, index) => ({ id: `l-${index}`, char }));
  function sweepCymbal(progress: number) {
    rimLight?.sweep(progress);
  }

  const mountHero: Attachment<HTMLElement> = (node) => {
    const stage = node.querySelector<HTMLElement>('[data-hero-stage]');
    const video = node.querySelector<HTMLVideoElement>('[data-hero-session-picture]');
    const soundtrack = node.querySelector<HTMLAudioElement>('[data-hero-soundtrack]');
    if (!stage || !video || !soundtrack) return;

    rootEl = node;
    const playback = mountHeroPerformance(stage, video, soundtrack, (playing) => { soundPlaying = playing; });
    transport = playback;
    const sequence = heroSequence(node, { sweepCymbal, onPictureChange: playback.setPictureActive });

    return () => {
      sequence?.destroy?.();
      playback.destroy();
      audio?.destroy();
      rootEl = undefined;
      transport = undefined;
    };
  };

  $effect(() => transport?.setBlocked(filmBlocked));

  function strike() {
    if (rootEl) document.dispatchEvent(new CustomEvent('sergio:audio-focus', { detail: rootEl }));
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
  {@attach mountHero}
  aria-labelledby="hero-title"
>
  <h1 class="hero-accessible-title" id="hero-title" tabindex="-1">Sergio Bellotti</h1>
  <audio data-hero-soundtrack src={heroSession.soundtrack} preload="none" loop></audio>
  <div class="hero-stage" data-hero-stage>
    <div class="hero-session" data-hero-session data-hero-video aria-hidden="true">
      <video
        data-hero-session-picture
        src={heroSession.picture}
        poster={heroSession.poster}
        muted
        playsinline
        preload="none"
        loop
      ></video>
    </div>
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

    {#each heroChapters as chapter (chapter.id)}
      <section
        class="hero-chapter"
        data-hero-chapter={chapter.id}
        inert
        aria-labelledby={`hero-chapter-${chapter.id}`}
      >
        {#if chapter.id === 'discovery'}
          <div class="hero-chapter-plate" data-chapter-plate>
            <img
              data-src="/images/home-percussion-workshop.webp"
              data-srcset="/images/home-percussion-workshop-768.webp 768w, /images/home-percussion-workshop.webp 2000w"
              sizes="100vw"
              alt=""
              decoding="async"
            />
          </div>
          <div class="hero-chapter-grade" aria-hidden="true"></div>
        {/if}
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
      <div class="hero-finale-title" data-hero-finale-title>
        <p class="hero-film-label hero-film-line"><span data-hero-film-line>Release · Studio performance</span></p>
        <p class="hero-film-line"><span data-hero-film-line>Happy People 7/4</span></p>
        <p class="hero-film-copy hero-film-line"><span data-hero-film-line>Seven beats to the bar.</span></p>
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
        <a class="hero-scroll" href="#hear-the-difference">
          <ArrowDownIcon size={17} weight="bold" />
          <span>Hear the difference</span>
        </a>
      </div>

      <div class="hero-actions">
        <button class="hero-sound" type="button" aria-label={soundPlaying ? 'Mute soundtrack' : 'Play soundtrack'} onclick={() => transport?.toggleSound()}>
          {#if soundPlaying}<SpeakerHighIcon size={18} />{:else}<SpeakerSlashIcon size={18} />{/if}
          <span>Sound {soundPlaying ? 'on' : 'off'}</span>
        </button>
        <button class="hero-strike" type="button" aria-label="Strike cymbal" onclick={strike}>
          <WaveformIcon size={19} weight="regular" />
          <span>Strike cymbal</span>
        </button>
        <a class="hero-watch" href="#performance-film" onclick={onwatch}>
          <PlayIcon size={15} weight="fill" />
          <span>Watch performance</span>
        </a>
      </div>
    </div>
  </div>
</section>
