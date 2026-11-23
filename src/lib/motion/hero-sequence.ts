import type { Action } from 'svelte/action';
import { heroChapters, performanceStart, widePerformanceFraming, type HeroFraming } from '#lib/components/hero-chapters';

const motionQuery = '(prefers-reduced-motion: no-preference) and (min-height: 35rem)';
const openingDissolve = .048;
const closingDissolve = .064;
const captionFadeOut = .032;

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
    const openingStart = heroChapters[0].start;
    const chars = type.querySelectorAll<HTMLElement>('[data-hero-char]');
    const metaLines = details.querySelectorAll<HTMLElement>('[data-hero-meta-line]');
    const backdropImg = backdrop.querySelector<HTMLImageElement>('img');
    const filmLines = caption.querySelectorAll<HTMLElement>('[data-hero-film-line]');

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
            y: 12,
            opacity: 0,
            duration: 0.76,
            stagger: 0.017,
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

      function revealCaption(lines: NodeListOf<HTMLElement>, start: number, slow = false) {
        gsap.set(lines, { y: 8, autoAlpha: 0 });
        timeline.to(lines, {
          y: 0, autoAlpha: 1,
          duration: slow ? 0.044 : 0.032, stagger: 0.006, ease: 'sine.out',
        }, start);
      }

      function exitCaption(lines: NodeListOf<HTMLElement>, end: number) {
        const start = end - 0.015;
        timeline.to(lines, { y: -5, autoAlpha: 0, duration: captionFadeOut, ease: 'sine.inOut' }, start);
        return start + captionFadeOut;
      }

      // Opening portrait: slow Steadicam push anchored near Sergio's eyes (zero head clip) + parting credits
      timeline
        .to(backdrop, { scale: 1.055, duration: 0.165, ease: 'sine.inOut' }, 0.008)
        .to(illumination, { progress: 1, duration: 0.145, ease: 'sine.inOut' }, 0.028)
        .to(light, { '--hero-rim-opacity': 1.04, duration: 0.085, ease: 'sine.inOut' }, 0.055)
        .to(type, { y: -7, autoAlpha: 0, duration: 0.044, ease: 'sine.inOut' }, openingStart - 0.01)
        .to(details, { y: -5, autoAlpha: 0, duration: 0.042, ease: 'sine.inOut' }, openingStart - 0.008)
        .set(session, { autoAlpha: 1 }, openingStart)
        .to(portrait, { autoAlpha: 0, duration: openingDissolve, ease: 'sine.inOut' }, openingStart);

      // The moving picture keeps its own time. Scroll cues only change its framing and captions.
      for (const [index, chapter] of chapters.entries()) {
        const { start, id, framing } = heroChapters[index];
        const lines = chapter.querySelectorAll<HTMLElement>('[data-chapter-line]');
        const plate = chapter.querySelector<HTMLElement>('[data-chapter-plate]');
        const nextStart = id === 'anticipation' ? performanceStart : heroChapters[index + 1]?.start ?? 1;
        const closing = chapter === discovery;
        const captionStart = start + (index === 0 || closing ? 0.017 : 0.009);

        chapter.style.zIndex = String(closing ? 24 : 10 + index);
        if (closing) {
          timeline.to(chapter, { autoAlpha: 1, duration: closingDissolve, ease: 'sine.inOut' }, start);
        } else {
          timeline.set(chapter, { autoAlpha: 1 }, start);
        }

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

        revealCaption(lines, captionStart, closing);

        if (!closing) {
          const hiddenAt = exitCaption(lines, nextStart);
          timeline.set(chapter, { autoAlpha: 0 }, hiddenAt);
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
      revealCaption(filmLines, performanceStart + 0.009);
      exitCaption(filmLines, discoveryStart);

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

        const nextPicture = progress >= openingStart && progress < discoveryStart + closingDissolve;
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
      });
      sync();

      return () => {
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
