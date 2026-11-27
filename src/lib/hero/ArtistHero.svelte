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
  import HeroCymbalLight from './HeroCymbalLight.svelte';
  import HeroDepthPortrait from './HeroDepthPortrait.svelte';
  import { heroMotionQuery, heroSequence } from './hero-sequence';
  import { mountHeroPerformance } from './hero-performance';
  import { filmGrain } from './hero-grain';
  import { filmWheel } from './hero-scroll';
  import { createFilmGrade } from './hero-film-grade';
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
    showFlowCutaway?: boolean;
    revealOnLoad?: boolean;
    lowerTitle?: boolean;
  }

  let {
    filmOpen = $bindable(false),
    comparisonHref = '#hear-the-difference',
    filmHref = '#performance-film',
    openingEdit,
    showFlowCutaway = true,
    revealOnLoad = false,
    lowerTitle = false,
  }: Props = $props();
  let rootEl: HTMLElement | undefined;
  let camera: HTMLElement | undefined;
  let cymbalLight = $state<HeroCymbalLight>();
  let depthPortrait = $state<HeroDepthPortrait>();
  let audio: ReturnType<typeof createCymbalAudio> | undefined;
  let transport = $state<ReturnType<typeof mountHeroPerformance>>();
  let soundPlaying = $state(false);
  let introPhase = $state<'waiting' | 'revealing'>();
  let previewReveal = $state<'holding' | 'playing' | 'complete'>('holding');
  let beginIntro: (() => void) | undefined;
  let finishIntro: (() => void) | undefined;
  let strikes = $state(0);
  const arrivalDuration = 1300;

  const firstChars = [...'Sergio'].map((char, index) => ({ id: `f-${index}`, char }));
  const lastChars = [...'Bellotti'].map((char, index) => ({ id: `l-${index}`, char }));
  const sponsors: { id: string; logo: string; label: string; descriptor: string; width: number; height: number; echo?: boolean }[] = [
    { id: 'sabian', logo: '/images/sabian-logo.svg', label: 'Sabian', descriptor: 'Cymbals', width: 208, height: 64 },
    { id: 'yamaha', logo: '/images/yamaha-logo.svg', label: 'Yamaha', descriptor: 'Drums', width: 224, height: 49 },
    { id: 'remo', logo: '/images/remo-logo.svg', label: 'Remo', descriptor: 'Drumheads', width: 224, height: 85, echo: false },
    { id: 'prologix', logo: '/images/prologix-logo.png', label: 'ProLogix', descriptor: 'Practice pads', width: 224, height: 81 },
  ];

  // A strike lands like a hit to the camera: a push in, then a shake that settles.
  const impact = [
    { transform: 'scale(1.016) translate(0, 0)', offset: 0 },
    { transform: 'scale(1.011) translate(-3px, 2px)', offset: .14 },
    { transform: 'scale(1.008) translate(2.4px, -1.6px)', offset: .28 },
    { transform: 'scale(1.005) translate(-1.5px, 1px)', offset: .44 },
    { transform: 'scale(1.003) translate(.9px, -.6px)', offset: .62 },
    { transform: 'scale(1) translate(0, 0)', offset: 1 },
  ];

  function sweepCymbal(progress: number) {
    cymbalLight?.sweep(progress);
  }

  const mountHero: Attachment<HTMLElement> = (node) => {
    const stage = node.querySelector<HTMLElement>('[data-hero-stage]');
    const video = node.querySelector<HTMLVideoElement>('[data-hero-session-picture]');
    const soundtrack = node.querySelector<HTMLAudioElement>('[data-hero-soundtrack]');
    const cutaway = node.querySelector<HTMLVideoElement>('[data-hero-flow-picture]');
    if (!stage || !video || !soundtrack) return;

    rootEl = node;
    let sequence: ReturnType<typeof heroSequence>;
    let introTimer = 0;
    let washTimer = 0;
    let previewTimer = 0;
    let pictureRequested = false;
    const deepLink = location.hash && location.hash !== '#top';
    let skipPreviewReveal = Boolean(deepLink) || window.scrollY >= 24;
    const cinematicMotion = matchMedia(heroMotionQuery);
    let pictureReleased = !revealOnLoad || skipPreviewReveal || !cinematicMotion.matches;
    const motionPreference = matchMedia('(prefers-reduced-motion: reduce)');
    const playback = mountHeroPerformance(stage, video, soundtrack, (playing) => {
      soundPlaying = playing;
    }, cutaway, openingEdit);
    transport = playback;
    const wheel = filmWheel(node);
    const session = node.querySelector<HTMLElement>('[data-hero-session]');
    const still = node.querySelector<HTMLImageElement>('.hero-plate img');
    // The performance takes its exposure and saturation from the chapter framing.
    const look = () => ({
      exposure: Number(session?.style.getPropertyValue('--session-brightness')) || 1,
      saturation: Number(session?.style.getPropertyValue('--session-saturation')) || 1,
    });
    // The title still hides the first seconds of the performance, so it comes alive wherever the visitor looks.
    // Before the camera pulls back the framing holds, and the cymbal lifts inside the frozen photograph.
    const portrait = createFilmGrade(node.querySelector('.hero-portrait-grade'), still, look, revealOnLoad ? {} : {
      live: {
        source: openingEdit?.picture ?? heroSession.picture,
        until: 2.9,
        showing: () => node.dataset.cinematic === 'true' && node.dataset.scene === 'portrait' && !stage.hasAttribute('data-opening-scrub'),
      },
    });
    const performanceGrade = createFilmGrade(node.querySelector('.hero-session-frame canvas'), video, look);
    const grades = [portrait, performanceGrade];

    function startSequence(arrivedThroughIntro = false) {
      playback.prepareOpening();
      sequence = heroSequence(node, {
        sweepCymbal,
        openingEdit: Boolean(openingEdit),
        playFromStart: revealOnLoad,
        arrivedThroughIntro,
        onOpeningProgress: (progress) => {
          if (revealOnLoad) {
            if (progress >= .12) {
              skipPreviewReveal = true;
              if (previewReveal === 'playing') previewReveal = 'complete';
            }
            return;
          }
          if (openingEdit) playback.seekOpening(progress);
          else depthPortrait?.seek(progress);
        },
        onPictureChange: (active, matchingOpening) => {
          pictureRequested = active;
          if (pictureReleased) playback.setPictureActive(active, matchingOpening);
        },
        onCutawayChange: playback.setCutawayActive,
      });
    }

    function finishIfReduced() {
      if (!motionPreference.matches) return;
      // However the arrival is cut short, the frame must not be left as a print.
      window.clearTimeout(washTimer);
      portrait.washTo(0, 400);
      finishIntro?.();
    }

    function holdPreviewImage() {
      previewTimer = window.setTimeout(() => {
        pictureReleased = true;
        playback.setPictureActive(pictureRequested);
      }, 1000);
    }

    function showPreviewPicture() {
      previewReveal = skipPreviewReveal ? 'complete' : 'playing';
    }

    function settleInterruptedReveal() {
      if (!cinematicMotion.matches && previewReveal === 'playing') previewReveal = 'complete';
    }

    if (revealOnLoad) {
      playback.setSound(false);
      video.addEventListener('playing', showPreviewPicture, { once: true });
      cinematicMotion.addEventListener('change', settleInterruptedReveal);
      if (!pictureReleased) {
        if (still && !still.complete) {
          still.addEventListener('load', holdPreviewImage, { once: true });
          still.addEventListener('error', holdPreviewImage, { once: true });
        } else holdPreviewImage();
      }
      startSequence();
    } else if (!deepLink && window.scrollY < 24 && !motionPreference.matches) {
      introPhase = 'waiting';
      // The frame waits behind the title card as a brand-colour print and resolves as it opens.
      portrait.washTo(1, 0);
      beginIntro = () => {
        if (introPhase !== 'waiting') return;
        window.clearTimeout(introTimer);
        if (motionPreference.matches) {
          portrait.washTo(0, 400);
          finishIntro?.();
          return;
        }
        playback.prepareOpening();
        introPhase = 'revealing';
        // The frame opens as an amber print, then resolves into the full grade as the picture sharpens.
        washTimer = window.setTimeout(() => portrait.washTo(0, 2000), 480);
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
      window.clearTimeout(washTimer);
      window.clearTimeout(previewTimer);
      still?.removeEventListener('load', holdPreviewImage);
      still?.removeEventListener('error', holdPreviewImage);
      video.removeEventListener('playing', showPreviewPicture);
      cinematicMotion.removeEventListener('change', settleInterruptedReveal);
      previewReveal = 'holding';
      motionPreference.removeEventListener('change', finishIfReduced);
      beginIntro = undefined;
      finishIntro = undefined;
      introPhase = undefined;
      sequence?.destroy?.();
      playback.destroy();
      wheel.destroy();
      grades.forEach((grade) => grade.destroy());
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

  function finishPreviewReveal(event: AnimationEvent) {
    if (previewReveal === 'playing' && event.target === event.currentTarget && event.animationName === 'hero-preview-pullback') {
      previewReveal = 'complete';
    }
  }

  // Splits a line around its emphasised phrase so a highlight can wipe in behind it.
  function emphasisParts(copy: string, phrase?: string) {
    const at = phrase ? copy.indexOf(phrase) : -1;
    if (!phrase || at < 0) return [{ text: copy, emphasised: false }];
    return [
      { text: copy.slice(0, at), emphasised: false },
      { text: phrase, emphasised: true },
      { text: copy.slice(at + phrase.length), emphasised: false },
    ];
  }

  function strike() {
    if (rootEl) document.dispatchEvent(new CustomEvent('sergio:audio-focus', { detail: rootEl }));
    const origin = cymbalLight?.origin();
    rootEl?.style.setProperty('--hero-strike-x', origin ? `${origin.x}px` : '54%');
    rootEl?.style.setProperty('--hero-strike-y', origin ? `${origin.y}px` : '46%');
    strikes += 1;
    cymbalLight?.strike();
    if (camera && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
      camera.animate(impact, { duration: 860, easing: 'cubic-bezier(.16, 1, .3, 1)' });
    }
    audio ??= createCymbalAudio();
    audio.strike();
  }

  const portraitCrop = '(max-width: 850px), (max-aspect-ratio: 5/4)';
</script>

{#snippet openingTitle()}
  <div class="hero-name" data-hero-type>
    <ArtistOpening arrivalDuration={introPhase === 'revealing' ? arrivalDuration : 0} />
    <span class="hero-name-first" aria-hidden="true">
      {#each firstChars as item, index (item.id)}
        <span class="hero-char" data-hero-char data-char={item.char} style:--arrival-index={index}>{item.char}</span>
      {/each}
    </span>
    <span class="hero-name-last" aria-hidden="true">
      {#each lastChars as item, index (item.id)}
        <span class="hero-char" data-hero-char data-char={item.char} style:--arrival-index={index + firstChars.length}>{item.char}</span>
      {/each}
    </span>
  </div>
{/snippet}

{#snippet openingDetails()}
  <div class="hero-meta" data-hero-details>
    <p class="hero-origin" data-hero-meta-line>Bari, Italy <span></span> Boston, MA</p>
    <p class="hero-roles" data-hero-meta-line>Drummer · Educator · Producer</p>
    <p class="hero-credential" data-hero-meta-line>Associate Professor of Percussion<br />Berklee College of Music</p>
  </div>
{/snippet}

<section
  class="artist-hero"
  data-motion-hero
  data-hero-sequence
  data-intro-phase={introPhase}
  data-preview-reveal={revealOnLoad ? previewReveal : undefined}
  style:--hero-arrival-duration={arrivalDuration + 'ms'}
  data-opening-edit={openingEdit ? 'true' : undefined}
  {@attach mountHero}
  aria-labelledby="hero-title"
>
  <h1 class="hero-accessible-title" id="hero-title" tabindex="-1">Sergio Bellotti</h1>
  {#if !revealOnLoad}
    <ArtistLoader open={introPhase === 'waiting'} {soundPlaying} onenter={enterSite} />
  {/if}
  <audio data-hero-soundtrack src={heroSession.soundtrack} preload="none" loop></audio>
  <div class="hero-stage" data-hero-stage>
    <div class="hero-camera" bind:this={camera}>
      <div class="hero-session" data-hero-session data-hero-video aria-hidden="true">
        <img class="hero-session-still" src={openingEdit?.poster ?? heroSession.poster} alt="" loading="lazy" decoding="async" />
        <div class="hero-session-frame" onanimationend={finishPreviewReveal}>
          <video
            data-hero-session-picture
            src={openingEdit?.picture ?? heroSession.picture}
            poster={openingEdit?.poster ?? heroSession.poster}
            muted
            playsinline
            preload="none"
            loop={!openingEdit}
          ></video>
          <canvas data-hero-grade></canvas>
        </div>
      </div>
      {#if showFlowCutaway}
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
      {/if}
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
          <canvas class="hero-portrait-grade" data-hero-grade></canvas>
        </div>
        <div class="hero-poster-shade"></div>
        <div class="hero-rim" data-hero-rim aria-hidden="true">
          <HeroCymbalLight bind:this={cymbalLight} />
        </div>
        <div class="hero-poster-vignette"></div>
      </div>
      {#if !lowerTitle}
        {@render openingTitle()}
      {/if}

      <div class="hero-sponsor-atmosphere" data-hero-sponsor-atmosphere aria-hidden="true"><span></span><span></span></div>
      {#each sponsors as sponsor (sponsor.id)}
        <div class="hero-sponsor-scene hero-sponsor-scene--{sponsor.id}" data-hero-sponsor-scene={sponsor.id}>
          <span class="hero-sponsor-connector" aria-hidden="true"></span>
          <div class="hero-sponsor-lockup">
            {#if sponsor.echo !== false}
              <img class="hero-sponsor-echo hero-sponsor-logo--{sponsor.id}" src={sponsor.logo} alt="" aria-hidden="true" width={sponsor.width} height={sponsor.height} />
            {/if}
            <span class="hero-sponsor-shockwave" aria-hidden="true"></span>
            <span class="hero-sponsor-mark">
              <span class="hero-sponsor-streak" aria-hidden="true"></span>
              <img class="hero-sponsor-logo hero-sponsor-logo--{sponsor.id}" src={sponsor.logo} alt={sponsor.label} width={sponsor.width} height={sponsor.height} />
              <span class="hero-sponsor-sheen hero-sponsor-sheen--{sponsor.id}" aria-hidden="true"></span>
            </span>
            <span class="hero-sponsor-descriptor">{sponsor.descriptor}</span>
            <span class="hero-sponsor-flare" aria-hidden="true"></span>
          </div>
        </div>
      {/each}

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
            <span class="hero-chapter-curtain" data-chapter-curtain aria-hidden="true"></span>
          {/if}
          <div class="hero-chapter-copy">
            <p class="hero-chapter-kicker" data-chapter-line><i class="hero-chapter-rule" aria-hidden="true"></i><span data-chapter-kicker>{chapter.kicker}</span></p>
            <h2 id={`hero-chapter-${chapter.id}`} aria-label={chapter.title} data-chapter-line data-chapter-title>
              {#each chapter.title.split(' ') as word, wordIndex (wordIndex)}
                <span class="hero-title-word" aria-hidden="true">
                  {#each [...word] as char, charIndex (charIndex)}<span class="hero-title-char" data-hero-title-char data-char={char}>{char}</span>{/each}
                </span>
              {/each}
            </h2>
            <p class="hero-chapter-description" data-chapter-line>{#each emphasisParts(chapter.copy, chapter.emphasis) as part, partIndex (partIndex)}{#if part.emphasised}<em class="hero-chapter-em" data-text={part.text}>{part.text}</em>{:else}{part.text}{/if}{/each}</p>
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
      <div class="hero-lens" aria-hidden="true"></div>
    </div>

    <div class="hero-mask hero-mask-top" data-hero-mask-top aria-hidden="true"></div>
    <div class="hero-mask hero-mask-bottom" data-hero-mask-bottom aria-hidden="true"></div>
    <div class="hero-optical-flash" data-hero-flash aria-hidden="true"></div>
    <div class="hero-optical-streak" data-hero-streak aria-hidden="true"></div>
    <div class="hero-light-leak" data-hero-leak aria-hidden="true"></div>
    {#if strikes}
      {#key strikes}
        <div class="hero-impact" aria-hidden="true">
          <span class="hero-impact-flash"></span>
          <span class="hero-impact-shade"></span>
          <span class="hero-impact-beam"></span>
          <span class="hero-impact-ring"></span>
          <span class="hero-impact-ring"></span>
          <span class="hero-impact-ring"></span>
        </div>
      {/key}
    {/if}
    <div class="hero-grain" aria-hidden="true" use:filmGrain></div>
    {#if revealOnLoad && previewReveal === 'playing'}
      <div class="hero-preview-light" aria-hidden="true"></div>
    {/if}
    {#if introPhase === 'revealing'}
      <div class="hero-arrival-burst" aria-hidden="true"><span></span><span></span></div>
    {/if}

    <div class="hero-scroll-instruction" data-hero-scroll aria-hidden="true">
      <span data-scramble>Scroll to enter the performance</span><i></i>
    </div>

    {#if lowerTitle}
      <div class="hero-opening-credits">
        {@render openingTitle()}
        {@render openingDetails()}
      </div>
    {:else}
      {@render openingDetails()}
    {/if}

    <div class="hero-dock">
      <div class="hero-dock-left">
        <a class="hero-scroll" href={comparisonHref} aria-label="Hear the difference">
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
        <a class="hero-watch" href={filmHref} aria-label="Watch performance" onclick={playReel}>
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
      <div class="hero-static-sponsors" aria-label="Sponsored by Sabian Cymbals, Yamaha Drums, Remo Drumheads, and ProLogix Practice Pads">
        <span>Sponsored by</span>
        <img src="/images/sabian-logo.svg" alt="Sabian Cymbals" width="112" height="35" />
        <img src="/images/yamaha-logo.svg" alt="Yamaha Drums" width="112" height="24" />
        <img src="/images/remo-logo.svg" alt="Remo Drumheads" width="112" height="42" />
        <img src="/images/prologix-logo.png" alt="ProLogix Practice Pads" width="112" height="40" />
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
