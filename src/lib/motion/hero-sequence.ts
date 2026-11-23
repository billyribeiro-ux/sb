import type { Action } from 'svelte/action';
import { heroChapters, performanceStart, widePerformanceFraming, type HeroFraming } from '#lib/components/hero-chapters';

const motionQuery = '(prefers-reduced-motion: no-preference) and (min-height: 35rem)';
const openingDissolve = .048;
const closingDissolve = .064;

function framingStyles(framing: HeroFraming) {
  return {
    '--session-scale': framing.scale,
    '--session-pan': `${framing.xPercent}%`,
    '--session-rise': `${framing.yPercent}%`,
    '--session-shade': framing.shade,
  };
}

export interface HeroSequenceOptions {
  sweepCymbal?: (progress: number) => void;
  onPictureChange?: (active: boolean) => void;
  onCutawayChange?: (active: boolean) => void;
}

export const heroSequence: Action<HTMLElement, HeroSequenceOptions> = (root, options = {}) => {
  const element = (name: string) => root.querySelector<HTMLElement>(`[data-hero-${name}]`);
  const portrait = element('poster');
  const backdrop = element('backdrop');
  const session = element('session');
  const cutaway = element('flow');
  const type = element('type');
  const details = element('details');
  const light = element('rim');
  const cutLight = element('cut-light');
  const veil = element('edit-shadow');
  const film = element('finale');
  const caption = element('finale-title');
  const chapters = [...root.querySelectorAll<HTMLElement>('[data-hero-chapter]')];
  if (!portrait || !backdrop || !session || !type || !details || !light || !cutLight || !veil ||
      !film || !caption || chapters.length !== heroChapters.length) return;

  const layers = {
    portrait, backdrop, session, type, details, light, cutLight, veil, film, caption,
  };
  const preference = window.matchMedia(motionQuery);
  let disposed = false;
  let revert: (() => void) | undefined;

  async function install() {
    const [{ gsap }, { ScrollTrigger }] = await Promise.all([
      import('gsap'),
      import('gsap/ScrollTrigger'),
    ]);
    if (disposed) return;

    const {
      portrait, backdrop, session, type, details, light, cutLight, veil, film, caption,
    } = layers;
    const discovery = chapters[chapters.length - 1];
    const discoveryStart = heroChapters[heroChapters.length - 1].start;
    const discoveryImage = discovery.querySelector<HTMLImageElement>('img');
    const openingLabel = type.querySelector<HTMLElement>('[data-artist-opening]');
    const firstLine = type.querySelector<HTMLElement>('.hero-name-first');
    const lastLine = type.querySelector<HTMLElement>('.hero-name-last');
    const chars = type.querySelectorAll<HTMLElement>('[data-hero-char]');
    const metaLines = details.querySelectorAll<HTMLElement>('[data-hero-meta-line]');
    const backdropImg = backdrop.querySelector<HTMLImageElement>('img');
    const filmWords = [...caption.querySelectorAll<HTMLElement>('[data-hero-film-word]')];
    const filmLines = [...caption.querySelectorAll<HTMLElement>('[data-hero-film-line]')];

    gsap.registerPlugin(ScrollTrigger);
    const queries = gsap.matchMedia(root);
    revert = () => queries.revert();

    queries.add(motionQuery, () => {
      root.dataset.cinematic = 'true';
      const illumination = { progress: 0 };
      const openingSweep = { progress: 0 };
      let pictureActive = false;
      let cutawayActive = false;
      let activeChapter: HTMLElement | undefined;
      let velocityDecay = 0;

      // Theatrical title-sequence entrance (headroom-safe scale from upper-center origin)
      let introTimeline: gsap.core.Timeline | undefined;
      if (window.scrollY < 24 && !document.hidden) {
        const intro = gsap.timeline({ defaults: { ease: 'power4.out' } });
        introTimeline = intro;
        if (backdropImg) {
          intro.fromTo(
            backdropImg,
            { scale: 1.045 },
            { scale: 1, duration: 1.45, ease: 'power3.out' },
            0
          );
        }
        if (chars.length) {
          intro.from(chars, {
            yPercent: 108,
            opacity: 0,
            duration: 0.96,
            stagger: 0.022,
            clearProps: 'transform,opacity',
          }, 0.08);
        }
        if (metaLines.length) {
          intro.from(metaLines, {
            y: 14,
            opacity: 0,
            duration: 0.72,
            stagger: 0.075,
            ease: 'power3.out',
            clearProps: 'transform,opacity',
          }, 0.34);
        }
        intro.to(openingSweep, {
          progress: 1,
          duration: 1.25,
          ease: 'sine.inOut',
          onUpdate: () => {
            if (timeline.progress() < 0.02) options.sweepCymbal?.(openingSweep.progress);
          },
          onComplete: () => {
            if (timeline.progress() < 0.02) options.sweepCymbal?.(0);
          },
        }, 0.16);
      }

      gsap.set(chapters, { autoAlpha: 0 });
      gsap.set(film, { autoAlpha: 0 });
      gsap.set(session, { autoAlpha: 0, ...framingStyles(widePerformanceFraming) });
      if (cutaway) gsap.set(cutaway, { autoAlpha: 0 });

      const timeline = gsap.timeline({ paused: true, defaults: { ease: 'none' } });

      function revealCaption(words: HTMLElement[], lines: HTMLElement[], start: number, slow = false) {
        if (words.length) {
          gsap.set(words, { yPercent: 112, xPercent: 3, skewY: 2.2, autoAlpha: 0 });
          timeline.to(words, {
            yPercent: 0, xPercent: 0, skewY: 0, autoAlpha: 1,
            duration: slow ? 0.046 : 0.033, stagger: slow ? 0.006 : 0.004, ease: 'power4.out',
          }, start);
        }
        if (lines.length) {
          gsap.set(lines, { y: 12, autoAlpha: 0 });
          timeline.to(lines, {
            y: 0, autoAlpha: 1,
            duration: slow ? 0.043 : 0.03, stagger: 0.004, ease: 'power2.out',
          }, start + (words.length ? 0.016 : 0));
        }
      }

      function exitCaption(words: HTMLElement[], lines: HTMLElement[], end: number) {
        if (lines.length) {
          timeline.to(lines, { y: -8, autoAlpha: 0, duration: 0.017, ease: 'power2.in' }, end - 0.026);
        }
        if (words.length) {
          timeline.to(words, {
            yPercent: -106, xPercent: -1.25, skewY: -1.2, autoAlpha: 0,
            duration: 0.021, stagger: 0.002, ease: 'power2.in',
          }, end - 0.023);
        }
      }

      // Opening portrait: slow Steadicam push anchored near Sergio's eyes (zero head clip) + parting credits
      timeline
        .to(backdrop, { scale: 1.055, duration: 0.165, ease: 'sine.inOut' }, 0.008)
        .to(illumination, { progress: 1, duration: 0.145, ease: 'sine.inOut' }, 0.028)
        .to(light, { '--hero-rim-opacity': 1.04, duration: 0.085, ease: 'sine.inOut' }, 0.055)
        .to(details, { y: -14, autoAlpha: 0, duration: 0.036, ease: 'power2.inOut' }, 0.104)
        .to(openingLabel, { yPercent: -80, autoAlpha: 0, duration: 0.026, ease: 'power2.inOut' }, 0.102);

      if (firstLine) {
        timeline.to(firstLine, {
          yPercent: -32, autoAlpha: 0, duration: 0.038, ease: 'power2.inOut',
        }, 0.108);
      }
      if (lastLine) {
        timeline.to(lastLine, {
          yPercent: -18, scale: 1.028, autoAlpha: 0, duration: 0.04, ease: 'power2.inOut',
        }, 0.112);
      }

      timeline
        .set(session, { autoAlpha: 1 }, heroChapters[0].start)
        .to(portrait, { autoAlpha: 0, duration: openingDissolve, ease: 'sine.inOut' }, heroChapters[0].start);

      // The moving picture keeps its own time. Scroll cues only change its framing and captions.
      for (const [index, chapter] of chapters.entries()) {
        const { start, id, framing } = heroChapters[index];
        const words = [...chapter.querySelectorAll<HTMLElement>('[data-chapter-word]')];
        const lines = [...chapter.querySelectorAll<HTMLElement>('[data-chapter-line]')];
        const plate = chapter.querySelector<HTMLElement>('[data-chapter-plate]');
        const link = chapter.querySelectorAll<HTMLElement>('[data-chapter-link]');
        const nextStart = id === 'anticipation' ? performanceStart : heroChapters[index + 1]?.start ?? 1;
        const closing = chapter === discovery;
        const captionStart = start + (index === 0 || closing ? 0.022 : 0.013);

        chapter.style.zIndex = String(10 + index);
        timeline.to(chapter, {
          autoAlpha: 1, duration: closing ? closingDissolve : 0.024, ease: 'sine.inOut',
        }, start);

        if (framing) {
          timeline.to(session, {
            ...framingStyles(framing), duration: 0.046, ease: 'power2.inOut',
          }, start);
        }

        if (id === 'flow' && cutaway) {
          timeline
            .to(cutaway, { autoAlpha: 1, duration: 0.034, ease: 'sine.inOut' }, start)
            .to(cutaway, { autoAlpha: 0, duration: 0.028, ease: 'sine.inOut' }, nextStart - 0.012);
        }

        if (index > 0 && !closing) {
          timeline
            .to(veil, { opacity: 0.16, duration: 0.017, ease: 'sine.inOut' }, start - 0.008)
            .to(veil, { opacity: 0, duration: 0.028, ease: 'sine.out' }, start + 0.009);
        }

        if (plate) {
          timeline.fromTo(plate, { scale: 1.035 }, {
            scale: 1, duration: 1 - start, ease: 'sine.out', immediateRender: false,
          }, start);
        }

        revealCaption(words, lines, captionStart, closing);

        if (closing) {
          chapter.style.zIndex = '24';
          gsap.set(link, { y: 12, autoAlpha: 0 });
          timeline.to(link, { y: 0, autoAlpha: 1, duration: 0.029, ease: 'power3.out' }, start + 0.055);
        } else {
          exitCaption(words, lines, nextStart);
          timeline.to(chapter, {
            autoAlpha: 0, duration: 0.017, ease: 'power2.inOut',
          }, nextStart - 0.007);
        }
      }

      // Open the performance back to its full frame before the closing photo.
      film.style.zIndex = '20';
      timeline
        .fromTo(
          cutLight,
          { opacity: 0, scale: 0.92 },
          { opacity: 0.34, scale: 1.04, duration: 0.027, ease: 'sine.inOut', immediateRender: false },
          performanceStart - 0.022
        )
        .set(film, { autoAlpha: 1 }, performanceStart)
        .to(session, { ...framingStyles(widePerformanceFraming), duration: 0.051, ease: 'sine.inOut' }, performanceStart)
        .to(cutLight, { opacity: 0, scale: 1.12, duration: 0.042, ease: 'sine.out' }, performanceStart + 0.005)
        .set(film, { autoAlpha: 0 }, discoveryStart + closingDissolve)
        .set(session, { autoAlpha: 0 }, discoveryStart + closingDissolve);
      revealCaption(filmWords, filmLines, performanceStart + 0.016);
      exitCaption(filmWords, filmLines, discoveryStart);

      function sync() {
        const progress = timeline.progress();
        if (progress > 0.015 && introTimeline?.isActive()) {
          introTimeline.progress(1);
        }

        const index = heroChapters.findLastIndex(chapter => progress >= chapter.start);
        const inFilm = progress >= performanceStart && progress < discoveryStart;
        const nextChapter = inFilm ? undefined : chapters[index];
        const scene = inFilm ? 'film' : heroChapters[index]?.id ?? 'portrait';

        if (root.dataset.scene !== scene) root.dataset.scene = scene;

        if (activeChapter !== nextChapter) {
          if (activeChapter) {
            activeChapter.inert = true;
            delete activeChapter.dataset.shotActive;
          }
          if (nextChapter) {
            nextChapter.dataset.shotActive = 'true';
            nextChapter.inert = false;
          }
          activeChapter = nextChapter;
        }

        if (progress >= .6 && discoveryImage?.dataset.src) {
          if (discoveryImage.dataset.srcset) discoveryImage.srcset = discoveryImage.dataset.srcset;
          discoveryImage.src = discoveryImage.dataset.src;
          discoveryImage.removeAttribute('data-src');
        }

        const nextPicture = progress >= heroChapters[0].start && progress < discoveryStart + closingDissolve;
        if (nextPicture !== pictureActive) {
          pictureActive = nextPicture;
          options.onPictureChange?.(pictureActive);
        }
        const nextCutaway = Boolean(cutaway && scene === 'flow');
        if (nextCutaway !== cutawayActive) {
          cutawayActive = nextCutaway;
          options.onCutawayChange?.(cutawayActive);
        }
        film.inert = !inFilm;
        film.setAttribute('aria-hidden', String(!inFilm));
      }

      timeline.eventCallback('onUpdate', () => {
        if (timeline.progress() >= 0.02) {
          options.sweepCymbal?.(illumination.progress);
        }
        sync();
      });

      ScrollTrigger.create({
        animation: timeline,
        trigger: root,
        start: 'top top',
        end: 'bottom bottom',
        scrub: 0.62,
        onRefresh: sync,
        onUpdate: (self) => {
          const normalized = Math.max(-1, Math.min(1, self.getVelocity() / 2400));
          root.style.setProperty('--scroll-v', normalized.toFixed(3));
          window.clearTimeout(velocityDecay);
          velocityDecay = window.setTimeout(() => {
            root.style.setProperty('--scroll-v', '0');
          }, 140);
        },
      });
      sync();

      return () => {
        window.clearTimeout(velocityDecay);
        introTimeline?.kill();
        options.onPictureChange?.(false);
        options.onCutawayChange?.(false);
        if (activeChapter) {
          activeChapter.inert = true;
          delete activeChapter.dataset.shotActive;
        }
        for (const chapter of chapters) {
          chapter.style.removeProperty('z-index');
        }
        film.style.removeProperty('z-index');
        root.style.removeProperty('--scroll-v');
        options.sweepCymbal?.(0);
        film.inert = true;
        film.setAttribute('aria-hidden', 'true');
        delete root.dataset.scene;
        delete root.dataset.cinematic;
      };
    });

    void document.fonts?.ready.then(() => {
      if (!disposed) ScrollTrigger.refresh();
    });
  }

  function mountWhenAllowed() {
    if (!preference.matches) return;
    preference.removeEventListener('change', mountWhenAllowed);
    void install().catch(() => revert?.());
  }

  preference.addEventListener('change', mountWhenAllowed);
  mountWhenAllowed();

  return {
    destroy() {
      disposed = true;
      preference.removeEventListener('change', mountWhenAllowed);
      revert?.();
    },
  };
};
