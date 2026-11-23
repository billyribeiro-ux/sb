<script lang="ts">
  import { tick } from 'svelte';
  import type { Attachment } from 'svelte/attachments';
  import ArrowDownIcon from 'phosphor-svelte/lib/ArrowDownIcon';
  import PlayIcon from 'phosphor-svelte/lib/PlayIcon';
  import SpeakerHighIcon from 'phosphor-svelte/lib/SpeakerHighIcon';
  import SpeakerSlashIcon from 'phosphor-svelte/lib/SpeakerSlashIcon';
  import WaveformIcon from 'phosphor-svelte/lib/WaveformIcon';
  import ArtistLoader from './ArtistLoader.svelte';
  import ArtistOpening from './ArtistOpening.svelte';
  import HeroRimLight from './HeroRimLight.svelte';
  import HeroDepthPortrait from './HeroDepthPortrait.svelte';
  import { heroSequence } from './hero-sequence';
  import { mountHeroPerformance } from './hero-performance';
  import { createCymbalAudio } from '#lib/motion/cymbal-audio';
  import ModalShell from '#lib/components/ModalShell.svelte';
  import PerformanceFilm from '#lib/components/PerformanceFilm.svelte';
  import { heroChapters, heroSession, notesFilm, type HeroOpeningEdit } from './hero-chapters';
  import './artist-hero.css';

  interface Props {
    filmOpen?: boolean;
    comparisonHref?: string;
    filmHref?: string;
    openingEdit?: HeroOpeningEdit;
  }

  let {
    filmOpen = $bindable(false),
    comparisonHref = '#hear-the-difference',
    filmHref = '#performance-film',
    openingEdit,
  }: Props = $props();
  let rootEl: HTMLElement | undefined;
  let rimLight = $state<HeroRimLight>();
  let depthPortrait = $state<HeroDepthPortrait>();
  let audio: ReturnType<typeof createCymbalAudio> | undefined;
  let transport = $state<ReturnType<typeof mountHeroPerformance>>();
  let soundPlaying = $state(false);
  let introPhase = $state<'waiting' | 'revealing'>();
  let beginIntro: (() => void) | undefined;
  let finishIntro: (() => void) | undefined;
  let strikes = $state(0);
  const arrivalDuration = 2200;

  const firstChars = [...'Sergio'].map((char, index) => ({ id: `f-${index}`, char }));
  const lastChars = [...'Bellotti'].map((char, index) => ({ id: `l-${index}`, char }));
  function sweepCymbal(progress: number) {
    rimLight?.sweep(progress);
  }

  const mountHero: Attachment<HTMLElement> = (node) => {
    const stage = node.querySelector<HTMLElement>('[data-hero-stage]');
    const video = node.querySelector<HTMLVideoElement>('[data-hero-session-picture]');
    const soundtrack = node.querySelector<HTMLAudioElement>('[data-hero-soundtrack]');
    const cutaway = node.querySelector<HTMLVideoElement>('[data-hero-flow-picture]');
    if (!stage || !video || !soundtrack || !cutaway) return;

    rootEl = node;
    let sequence: ReturnType<typeof heroSequence>;
    let introTimer = 0;
    const motionPreference = matchMedia('(prefers-reduced-motion: reduce)');
    const playback = mountHeroPerformance(stage, video, soundtrack, (playing) => {
      soundPlaying = playing;
    }, cutaway, openingEdit);
    transport = playback;

    function startSequence(arrivedThroughIntro = false) {
      playback.prepareOpening();
      sequence = heroSequence(node, {
        sweepCymbal,
        openingEdit: Boolean(openingEdit),
        arrivedThroughIntro,
        onOpeningProgress: (progress) => {
          if (openingEdit) playback.seekOpening(progress);
          else depthPortrait?.seek(progress);
        },
        onPictureChange: playback.setPictureActive,
        onCutawayChange: playback.setCutawayActive,
      });
    }

    function finishIfReduced() {
      if (motionPreference.matches) finishIntro?.();
    }

    const deepLink = location.hash && location.hash !== '#top';
    if (!deepLink && window.scrollY < 24 && !motionPreference.matches) {
      introPhase = 'waiting';
      beginIntro = () => {
        if (introPhase !== 'waiting') return;
        window.clearTimeout(introTimer);
        if (motionPreference.matches) {
          finishIntro?.();
          return;
        }
        playback.prepareOpening();
        introPhase = 'revealing';
        // The deadline also releases the page if a browser suspends the animation.
        introTimer = window.setTimeout(() => finishIntro?.(), arrivalDuration + 180);
      };
      finishIntro = () => {
        beginIntro = undefined;
        finishIntro = undefined;
        window.clearTimeout(introTimer);
        introPhase = undefined;
        startSequence(true);
        void tick().then(() => rootEl?.querySelector<HTMLElement>('#hero-title')?.focus({ preventScroll: true }));
      };
      motionPreference.addEventListener('change', finishIfReduced);
    } else {
      startSequence();
    }

    return () => {
      window.clearTimeout(introTimer);
      motionPreference.removeEventListener('change', finishIfReduced);
      beginIntro = undefined;
      finishIntro = undefined;
      introPhase = undefined;
      sequence?.destroy?.();
      playback.destroy();
      audio?.destroy();
      audio = undefined;
      rootEl = undefined;
      transport = undefined;
    };
  };

  $effect(() => transport?.setBlocked(filmOpen));

  function playReel(event: MouseEvent) {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    filmOpen = true;
  }

  function enterSite(withSound: boolean) {
    if (introPhase !== 'waiting') return;
    transport?.setSound(withSound);
    beginIntro?.();
  }

  function finishArrival(event: AnimationEvent) {
    if (event.target === event.currentTarget && event.animationName === 'hero-arrival-image') finishIntro?.();
  }

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
  data-intro-phase={introPhase}
  style:--hero-arrival-duration={arrivalDuration + 'ms'}
  data-opening-edit={openingEdit ? 'true' : undefined}
  {@attach mountHero}
  aria-labelledby="hero-title"
>
  <h1 class="hero-accessible-title" id="hero-title" tabindex="-1">Sergio Bellotti</h1>
  <ArtistLoader open={introPhase === 'waiting'} {soundPlaying} onenter={enterSite} />
  <audio data-hero-soundtrack src={heroSession.soundtrack} preload="none" loop></audio>
  <div class="hero-stage" data-hero-stage>
    <div class="hero-session" data-hero-session data-hero-video aria-hidden="true">
      <img class="hero-session-still" src={openingEdit?.poster ?? heroSession.poster} alt="" loading="lazy" decoding="async" />
      <video
        data-hero-session-picture
        src={openingEdit?.picture ?? heroSession.picture}
        poster={openingEdit?.poster ?? heroSession.poster}
        muted
        playsinline
        preload="none"
        loop={!openingEdit}
      ></video>
    </div>
    <div class="hero-flow-cutaway" data-hero-flow data-hero-video aria-hidden="true">
      <video
        data-hero-flow-picture
        src="/videos/sergio-flow-insert.mp4"
        poster="/videos/sergio-flow-insert-poster.webp"
        muted
        playsinline
        preload="none"
        loop
      ></video>
    </div>
    <div class="hero-poster" data-hero-poster>
      <div class="hero-plate" data-hero-backdrop onanimationend={finishArrival}>
        {#if openingEdit}
          <picture class="hero-portrait-picture">
            <img src={openingEdit.poster} alt="Sergio Bellotti behind a bronze cymbal in the studio"
              width="1920" height="1080" fetchpriority="high" />
          </picture>
        {:else}
          <picture class="hero-portrait-picture">
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
          <HeroDepthPortrait bind:this={depthPortrait} />
        {/if}
      </div>
      <div class="hero-poster-shade"></div>
      <div class="hero-rim" data-hero-rim aria-hidden="true">
        {#if !openingEdit}<HeroRimLight bind:this={rimLight} />{/if}
      </div>
      {#if strikes}
        {#key strikes}
          <div class="hero-strike-trace" aria-hidden="true"><span></span><span></span></div>
        {/key}
      {/if}
      <div class="hero-poster-vignette"></div>
    </div>
    <div class="hero-name" data-hero-type>
      <ArtistOpening arrivalDuration={introPhase === 'revealing' ? arrivalDuration : 0} />
      <span class="hero-name-first" aria-hidden="true">
        {#each firstChars as item, index (item.id)}
          <span class="hero-char" data-hero-char style:--arrival-index={index}>{item.char}</span>
        {/each}
      </span>
      <span class="hero-name-last" aria-hidden="true">
        {#each lastChars as item, index (item.id)}
          <span class="hero-char" data-hero-char style:--arrival-index={index + firstChars.length}>{item.char}</span>
        {/each}
      </span>
    </div>

    <div class="hero-sponsor-atmosphere" data-hero-sponsor-atmosphere aria-hidden="true"><span></span><span></span></div>
    <div class="hero-sponsor-scene hero-sponsor-scene--sabian" data-hero-sponsor-scene="sabian">
      <span class="hero-sponsor-connector" aria-hidden="true"></span>
      <div class="hero-sponsor-lockup">
        <img class="hero-sponsor-echo hero-sponsor-logo--sabian" src="/images/sabian-logo.svg" alt="" aria-hidden="true" width="208" height="64" />
        <span class="hero-sponsor-shockwave" aria-hidden="true"></span>
        <img class="hero-sponsor-logo hero-sponsor-logo--sabian" src="/images/sabian-logo.svg" alt="Sabian" width="208" height="64" />
        <span class="hero-sponsor-descriptor">Cymbals</span>
        <span class="hero-sponsor-flare" aria-hidden="true"></span>
      </div>
    </div>
    <div class="hero-sponsor-scene hero-sponsor-scene--yamaha" data-hero-sponsor-scene="yamaha">
      <span class="hero-sponsor-connector" aria-hidden="true"></span>
      <div class="hero-sponsor-lockup">
        <img class="hero-sponsor-echo hero-sponsor-logo--yamaha" src="/images/yamaha-logo.svg" alt="" aria-hidden="true" width="224" height="49" />
        <span class="hero-sponsor-shockwave" aria-hidden="true"></span>
        <img class="hero-sponsor-logo hero-sponsor-logo--yamaha" src="/images/yamaha-logo.svg" alt="Yamaha" width="224" height="49" />
        <span class="hero-sponsor-descriptor">Drums</span>
        <span class="hero-sponsor-flare" aria-hidden="true"></span>
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
          <p class="hero-chapter-kicker" data-chapter-line>{chapter.kicker}</p>
          <h2 id={`hero-chapter-${chapter.id}`} aria-label={chapter.title} data-chapter-line data-chapter-title>
            {#each chapter.title.split(' ') as word}
              <span class="hero-title-word" aria-hidden="true">
                {#each [...word] as char}<span class="hero-title-char" data-hero-title-char>{char}</span>{/each}
              </span>
            {/each}
          </h2>
          <p class="hero-chapter-description" data-chapter-line>{chapter.copy}</p>
          {#if chapter.id === 'discovery'}
            <a href={comparisonHref} data-chapter-line>Try the ghost-note comparison</a>
          {/if}
        </div>
      </section>
    {/each}

    <div class="hero-finale" data-hero-finale aria-hidden="true" inert>
      <div class="hero-finale-title" data-hero-finale-title>
        <p class="hero-film-label" data-hero-film-line>Release · Studio performance</p>
        <p class="hero-film-heading" data-hero-film-line>Happy People 7/4</p>
        <p class="hero-film-copy" data-hero-film-line>Seven beats to the bar.</p>
      </div>
    </div>

    <div class="hero-optical-flash" data-hero-flash aria-hidden="true"></div>
    <div class="hero-light-leak" data-hero-leak aria-hidden="true"></div>
    <div class="hero-grain" aria-hidden="true"></div>
    {#if introPhase === 'revealing'}
      <div class="hero-arrival-burst" aria-hidden="true"><span></span><span></span></div>
    {/if}

    <div class="hero-sequence-hud" aria-hidden="true">
      <span class="hero-scene-count" data-hero-scene-count>00 / 07</span>
      <span class="hero-scene-name" data-hero-scene-name>Opening titles</span>
      <span class="hero-scene-track"><span data-hero-scene-meter></span></span>
    </div>
    <div class="hero-scroll-instruction" data-hero-scroll aria-hidden="true">
      <span>Scroll to enter the performance</span><i></i>
    </div>

    <div class="hero-meta" data-hero-details>
      <p class="hero-origin" data-hero-meta-line>Bari, Italy <span></span> Boston, MA</p>
      <p class="hero-roles" data-hero-meta-line>Drummer · Educator · Producer</p>
      <p class="hero-credential" data-hero-meta-line>Associate Professor of Percussion<br />Berklee College of Music</p>
    </div>

    <div class="hero-dock">
      <div class="hero-dock-left">
        <a class="hero-scroll" href={comparisonHref}>
          <ArrowDownIcon size={17} weight="bold" />
          <span>Hear the difference</span>
        </a>
      </div>

      <div class="hero-actions">
        <button class="hero-sound" type="button" aria-label={soundPlaying ? 'Mute soundtrack' : 'Play soundtrack'} onclick={() => transport?.setSound(!soundPlaying)}>
          {#if soundPlaying}<SpeakerHighIcon size={18} />{:else}<SpeakerSlashIcon size={18} />{/if}
          <span>Sound {soundPlaying ? 'on' : 'off'}</span>
        </button>
        <button class="hero-strike" type="button" aria-label="Strike cymbal" onclick={strike}>
          <WaveformIcon size={19} weight="regular" />
          <span>Strike cymbal</span>
        </button>
        <a class="hero-watch" href={filmHref} onclick={playReel}>
          <PlayIcon size={15} weight="fill" />
          <span>Watch performance</span>
        </a>
      </div>
    </div>
  </div>

  <div class="hero-static-chapters" aria-labelledby="hero-static-title">
    <div class="hero-static-heading">
      <p>The Notes Between</p>
      <h2 id="hero-static-title">Seven movements.<br />One performance.</h2>
      <div class="hero-static-sponsors" aria-label="Sponsored by Yamaha Drums and Sabian Cymbals">
        <span>Sponsored by</span>
        <img src="/images/yamaha-logo.svg" alt="Yamaha Drums" width="112" height="24" />
        <img src="/images/sabian-logo.svg" alt="Sabian Cymbals" width="112" height="35" />
      </div>
    </div>
    {#each heroChapters as chapter, index (chapter.id)}
      <article class="hero-static-chapter">
        <span>{String(index + 1).padStart(2, '0')}</span>
        <h3>{chapter.title}</h3>
        <div><p>{chapter.copy}</p>{#if chapter.id === 'discovery'}<a href={comparisonHref}>Try the ghost-note comparison</a>{/if}</div>
      </article>
    {/each}
  </div>
</section>

<ModalShell open={filmOpen} title="Happy People 7/4" onclose={() => { filmOpen = false; }}>
  {#if filmOpen}
    <div class="hero-film-dialog">
      <PerformanceFilm {...notesFilm} loop={false} />
    </div>
  {/if}
</ModalShell>

<style>
  .hero-film-dialog {
    width: min(100%, 118svh);
    margin-inline: auto;
  }
</style>
