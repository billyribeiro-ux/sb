<script lang="ts">
  import { onMount } from 'svelte';
  import CaretLeftIcon from 'phosphor-svelte/lib/CaretLeftIcon';
  import CaretRightIcon from 'phosphor-svelte/lib/CaretRightIcon';
  import PauseIcon from 'phosphor-svelte/lib/PauseIcon';
  import PlayIcon from 'phosphor-svelte/lib/PlayIcon';
  import { heroChapters } from '#lib/hero/hero-chapters';
  import { mountCaptionLight } from './caption-light';

  const last = heroChapters.length - 1;
  let root: HTMLElement;
  let canvas: HTMLCanvasElement;
  let active = $state(0);
  let playing = $state(false);
  let goTo: ((index: number) => void) | undefined;
  let toggle: (() => void) | undefined;

  onMount(() => {
    let disposed = false;
    let revert: (() => void) | undefined;

    async function mount() {
      const [{ gsap }, { ScrollTrigger }] = await Promise.all([
        import('gsap'),
        import('gsap/ScrollTrigger'),
      ]);
      if (disposed) return;
      gsap.registerPlugin(ScrollTrigger);
      const media = gsap.matchMedia(root);
      revert = () => media.revert();

      media.add('(prefers-reduced-motion: no-preference)', () => {
        const panels = [...root.querySelectorAll<HTMLElement>('[data-caption-panel]')];
        const titles = panels.map((panel) => panel.querySelector<HTMLElement>('.caption-title')!);
        const copies = panels.map((panel) => panel.querySelector<HTMLElement>('.caption-copy')!);
        const glow = mountCaptionLight(canvas);
        const light = { cue: 0, energy: 0 };
        const session = { index: 0 };
        let playback: gsap.core.Tween | undefined;

        root.dataset.animated = 'true';
        const timeline = gsap.timeline({ paused: true });
        gsap.set(panels.slice(1), { visibility: 'hidden' });
        gsap.set(copies.slice(1), { y: 18, opacity: 0, filter: 'blur(5px)' });

        for (let index = 1; index < panels.length; index += 1) {
          const leaving = index - .39;
          const entering = leaving + .105;
          const letters = titles[index].querySelectorAll('.caption-letter');
          gsap.set(letters, { yPercent: 18, opacity: .24 });

          timeline
            .to(titles[index - 1], {
              y: -18, yPercent: -105, z: -105, rotateX: 10, opacity: 0,
              filter: 'blur(5px)', duration: .49, ease: 'power2.inOut',
            }, leaving)
            .to(copies[index - 1], {
              y: -22, opacity: 0, filter: 'blur(4px)', duration: .27, ease: 'power2.out',
            }, leaving + .025)
            .set(panels[index], { visibility: 'visible' }, entering)
            .fromTo(titles[index], {
              y: 30, yPercent: 62, z: -115, rotateX: -15, opacity: 0,
              filter: 'blur(6px)', '--caption-sheen': '0%',
            }, {
              y: 0, yPercent: 0, z: 0, rotateX: 0, opacity: 1,
              filter: 'blur(0px)', '--caption-sheen': '100%',
              duration: .54, ease: 'power3.out', immediateRender: false,
            }, entering)
            .to(letters, {
              yPercent: 0, opacity: 1, duration: .38, stagger: { amount: .14 },
              ease: 'power3.out',
            }, entering + .055)
            .to(copies[index], {
              y: 0, opacity: 1, filter: 'blur(0px)', duration: .34, ease: 'power2.out',
            }, entering + .19)
            .set(panels[index - 1], { visibility: 'hidden' }, leaving + .49)
            .set(session, { index }, entering + .205)
            .fromTo(light, { cue: 0, energy: 0 }, {
              cue: 1, duration: .68, ease: 'sine.inOut', immediateRender: false,
            }, leaving + .03)
            .to(light, { energy: 1, duration: .24, ease: 'sine.out' }, leaving + .045)
            .to(light, { energy: 0, duration: .42, ease: 'sine.inOut' }, leaving + .285);
        }

        timeline.to({}, { duration: .38 }, last + .35);

        let accessibleIndex = -1;
        function sync() {
          root.style.setProperty('--caption-progress', String(timeline.progress()));
          glow?.draw(light.cue, light.energy);
          if (accessibleIndex === session.index) return;
          if (accessibleIndex >= 0) panels[accessibleIndex].inert = true;
          accessibleIndex = session.index;
          panels[accessibleIndex].inert = false;
          active = accessibleIndex;
        }
        panels.slice(1).forEach((panel) => { panel.inert = true; });
        timeline.eventCallback('onUpdate', sync);
        const trigger = ScrollTrigger.create({
          animation: timeline, trigger: root, start: 'top top', end: 'bottom bottom',
          scrub: .44, onRefresh: sync,
        });
        sync();

        function stop() {
          playback?.kill();
          playback = undefined;
          playing = false;
        }

        function setScroll(progress: number, behavior: ScrollBehavior) {
          window.scrollTo({ top: trigger.start + (trigger.end - trigger.start) * progress, behavior });
        }

        goTo = (index) => {
          stop();
          const time = index === 0 ? 0 : index + .30;
          setScroll(time / timeline.duration(), 'smooth');
        };

        toggle = () => {
          if (playback) {
            stop();
            return;
          }
          let progress = gsap.utils.clamp(0, 1, (window.scrollY - trigger.start) / (trigger.end - trigger.start));
          if (progress > .995) {
            progress = 0;
            setScroll(0, 'instant');
          }
          const clock = { progress };
          playing = true;
          playback = gsap.to(clock, {
            progress: 1, duration: 15 * (1 - progress), ease: 'none',
            onUpdate: () => setScroll(clock.progress, 'instant'),
            onComplete: stop,
          });
        };

        function stopOnTouch(event: TouchEvent) {
          if (event.target instanceof Element && event.target.closest('.caption-buttons')) return;
          stop();
        }

        window.addEventListener('wheel', stop, { passive: true });
        window.addEventListener('touchstart', stopOnTouch, { passive: true });

        return () => {
          stop();
          trigger.kill();
          glow?.destroy();
          goTo = undefined;
          toggle = undefined;
          window.removeEventListener('wheel', stop);
          window.removeEventListener('touchstart', stopOnTouch);
          panels.forEach((panel) => { panel.inert = false; });
          root.style.removeProperty('--caption-progress');
          delete root.dataset.animated;
        };
      });
    }

    void mount();

    return () => {
      disposed = true;
      revert?.();
    };
  });
</script>

<section class="caption-study" bind:this={root} style:--caption-count={heroChapters.length} aria-labelledby="caption-study-title">
  <div class="caption-stage">
    <div class="caption-plate" aria-hidden="true"></div>
    <canvas bind:this={canvas} class="caption-light" aria-hidden="true"></canvas>

    <div class="caption-heading">
      <h1 id="caption-study-title">The Notes Between</h1>
      <span>Chapter transitions</span>
    </div>

    <div class="caption-panels">
      {#each heroChapters as chapter (chapter.id)}
        <article class="caption-panel" data-caption-panel={chapter.id}>
          <h2 class="caption-title" aria-label={chapter.title}>
            {#each chapter.title.split(' ') as word}
              <span class="caption-word" aria-hidden="true">
                {#each [...word] as letter}<span class="caption-letter">{letter}</span>{/each}
              </span>
            {/each}
          </h2>
          <p class="caption-copy">{chapter.copy}</p>
        </article>
      {/each}
    </div>

    <div class="caption-controls">
      <p>Scroll to scrub</p>
      <div class="caption-buttons" aria-label="Chapter navigation">
        <button type="button" onclick={() => goTo?.(active - 1)} aria-label="Previous chapter" disabled={active === 0}>
          <CaretLeftIcon size={19} />
        </button>
        <button type="button" class="caption-play" onclick={() => toggle?.()}>
          {#if playing}<PauseIcon size={18} weight="fill" />{:else}<PlayIcon size={18} weight="fill" />{/if}
          {playing ? 'Pause sample' : 'Play sample'}
        </button>
        <button type="button" onclick={() => goTo?.(active + 1)} aria-label="Next chapter" disabled={active === last}>
          <CaretRightIcon size={19} />
        </button>
      </div>
      <span class="caption-meter" aria-hidden="true"></span>
    </div>
  </div>
</section>

<style>
  .caption-study {
    --caption-progress: 0;
    --caption-ivory: #fff2de;
    --caption-bronze: #edc192;
    background: #10100f;
    color: var(--caption-ivory);
  }

  .caption-study:global([data-animated='true']) { min-height: calc((var(--caption-count) * .78 + 1) * 100svh); }
  .caption-stage {
    position: relative;
    isolation: isolate;
    min-height: 100svh;
    padding: calc(var(--header) + 2rem) var(--gutter) 2rem;
  }
  :global([data-animated='true']) .caption-stage {
    position: sticky;
    top: 0;
    height: 100svh;
    overflow: clip;
  }

  .caption-plate, .caption-light { position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none; }
  .caption-plate {
    z-index: -2;
    inset-block-start: var(--header);
    height: auto;
    background:
      linear-gradient(90deg, #0e0d0cee 0%, #0e0d0cbd 49%, #0e0d0c66 100%),
      linear-gradient(0deg, #100e0cf2 0%, transparent 59%, #14100c80 100%),
      url('/videos/sergio-hero-session-poster.webp') 59% 0% / cover;
  }
  .caption-light { z-index: -1; mix-blend-mode: screen; }

  .caption-heading {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: .5rem 1rem;
    color: var(--caption-bronze);
    font-size: .85rem;
  }
  .caption-heading h1 { font: 600 1rem/1.4 var(--body); }
  .caption-heading span { padding-inline-start: 1rem; border-inline-start: 1px solid #edc19254; color: #e4d3be; }

  .caption-panels { margin-block: 4rem; }
  :global([data-animated='true']) .caption-panels {
    position: absolute;
    inset: calc(var(--header) + 4rem) var(--gutter) 7.5rem;
    margin: 0;
    perspective: 940px;
    perspective-origin: 20% 64%;
  }
  .caption-panel { margin-block: 2rem; }
  :global([data-animated='true']) .caption-panel {
    position: absolute;
    display: grid;
    grid-template-rows: 1fr max(5.4rem, 2lh);
    align-content: center;
    align-items: end;
    inset: 14% 0 2%;
    margin: 0;
    transform-style: preserve-3d;
    pointer-events: none;
  }

  .caption-title {
    --caption-sheen: 100%;
    max-inline-size: 11ch;
    margin-block: 0 .1em;
    color: var(--caption-ivory);
    font: 400 clamp(3.1rem, min(13vw, 21svh), 13.2rem)/.91 var(--display);
    letter-spacing: -.027em;
    text-transform: uppercase;
    text-wrap: balance;
    transform-origin: 10% 85%;
  }
  .caption-word { display: inline-block; }
  .caption-letter {
    display: inline-block;
    color: transparent;
    background: linear-gradient(122deg, #dfad7d 4%, #fff9eb 37%, #fff1da 91%) var(--caption-sheen) 0 / 225% 100%;
    background-clip: text;
  }
  .caption-copy {
    align-self: start;
    max-inline-size: 35ch;
    padding-block-start: .9rem;
    color: #f1dfca;
    font: 500 clamp(1rem, 1.75vw, 1.3rem)/1.5 var(--body);
    text-wrap: pretty;
  }

  .caption-controls { display: none; }
  :global([data-animated='true']) .caption-controls {
    position: absolute;
    inset: auto var(--gutter) max(1.2rem, env(safe-area-inset-bottom)) var(--gutter);
    display: grid;
    grid-template-columns: 1fr auto;
    align-items: center;
    gap: .72rem 1.2rem;
    color: #e8d8c4;
  }
  .caption-controls p { font-size: .88rem; }
  .caption-buttons { display: flex; gap: .45rem; }
  .caption-buttons button {
    display: inline-flex;
    min-width: 2.75rem;
    min-height: 2.75rem;
    align-items: center;
    justify-content: center;
    gap: .55rem;
    border: 1px solid #f8e0bf54;
    background: #13110fcd;
    color: var(--caption-ivory);
    cursor: pointer;
  }
  .caption-buttons button:hover:enabled { border-color: #edc192; background: #2d2118; }
  .caption-buttons button:disabled { opacity: .38; cursor: default; }
  .caption-buttons .caption-play { padding-inline: .9rem; font-size: .87rem; white-space: nowrap; }
  .caption-meter {
    grid-column: 1 / -1;
    height: 1px;
    background: #f8e0bf36;
    overflow: clip;
  }
  .caption-meter::before {
    display: block;
    content: '';
    height: 100%;
    background: var(--caption-bronze);
    transform: scaleX(var(--caption-progress));
    transform-origin: left;
  }

  @media (max-width: 600px) {
    .caption-plate {
      background:
        linear-gradient(0deg, #0e0d0cfa 5%, #0e0d0ca3 53%, #0e0d0c88 100%),
        url('/videos/sergio-hero-session-poster.webp') 48% center / cover;
    }
    :global([data-animated='true']) .caption-panels { inset-block-end: 8.2rem; }
    :global([data-animated='true']) .caption-panel { inset-block-start: 0; grid-template-rows: 1fr 5rem; }
    .caption-title { font-size: clamp(2.5rem, 12.5vw, 5.3rem); }
    .caption-heading { gap: .25rem .65rem; }
    .caption-heading span { padding-inline-start: .65rem; }
    :global([data-animated='true']) .caption-controls { grid-template-columns: 1fr; }
    .caption-buttons { justify-content: space-between; }
  }
</style>
