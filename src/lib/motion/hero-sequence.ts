import type { Action } from 'svelte/action';
import { heroChapters, performanceStart } from '#lib/components/hero-chapters';

const motionQuery = '(prefers-reduced-motion: no-preference) and (min-height: 35rem)';
const openingDissolve = .048;
const closingDissolve = .064;

export interface HeroSequenceOptions {
  sweepCymbal?: (progress: number) => void;
  onPictureChange?: (active: boolean) => void;
}

export const heroSequence: Action<HTMLElement, HeroSequenceOptions> = (root, options = {}) => {
  const element = (name: string) => root.querySelector<HTMLElement>(`[data-hero-${name}]`);
  const portrait = element('poster');
  const backdrop = element('backdrop');
  const session = element('session');
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
    const filmLines = caption.querySelectorAll<HTMLElement>('[data-hero-film-line]');

    gsap.registerPlugin(ScrollTrigger);
    const queries = gsap.matchMedia(root);
    revert = () => queries.revert();

    queries.add(motionQuery, () => {
      root.dataset.cinematic = 'true';
      const illumination = { progress: 0 };
      const openingSweep = { progress: 0 };
      let pictureActive = false;
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

      // Base states: smooth optical stacking, zero harsh clip-path wipes
      gsap.set(chapters, { autoAlpha: 0 });
      gsap.set(film, { autoAlpha: 0 });
      gsap.set(session, { autoAlpha: 0 });
      gsap.set(filmLines, { yPercent: 108, autoAlpha: 0 });

      const timeline = gsap.timeline({ paused: true, defaults: { ease: 'none' } });

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

      // Theatrical dip-through-darkroom optical transitions across all 7 chapters
      for (const [index, chapter] of chapters.entries()) {
        const { start, id, framing } = heroChapters[index];
        const incomingLines = chapter.querySelectorAll<HTMLElement>('[data-chapter-line]');
        const plate = chapter.querySelector<HTMLElement>('[data-chapter-plate]');
        const link = chapter.querySelectorAll<HTMLElement>('[data-chapter-link]');
        const nextStart = id === 'anticipation' ? performanceStart : heroChapters[index + 1]?.start ?? 1;
        const captionStart = index === 0 ? start + 0.024 : start + 0.014;

        chapter.style.zIndex = String(10 + index);
        gsap.set(incomingLines, { yPercent: 108, autoAlpha: 0 });

        if (id === 'groove' || chapter === discovery) {
          timeline.to(chapter, {
            autoAlpha: 1,
            duration: chapter === discovery ? closingDissolve : openingDissolve,
            ease: 'sine.inOut',
          }, start);
        } else {
          timeline
            .fromTo(
              veil,
              { opacity: 0 },
              { opacity: 0.45, duration: 0.015, ease: 'power2.in', immediateRender: false },
              start - 0.015
            )
            .to(chapter, {
              autoAlpha: 1,
              duration: 0.022,
              ease: 'power2.out',
            }, start)
            .to(veil, {
              opacity: 0,
              duration: 0.022,
              ease: 'power2.out',
            }, start + 0.004);
        }

        if (framing) {
          timeline.to(session, {
            '--session-scale': framing.scale,
            '--session-pan': `${framing.xPercent}%`,
            duration: 0.026,
            ease: 'sine.out',
          }, start);
        }

        if (plate) {
          timeline.fromTo(plate, { scale: 1.035 }, {
            scale: 1, duration: 1 - start, ease: 'sine.out', immediateRender: false,
          }, start);
        }

        timeline.to(incomingLines, {
          yPercent: 0,
          autoAlpha: 1,
          duration: 0.026,
          stagger: 0.005,
          ease: 'power3.out',
        }, captionStart);

        if (chapter === discovery) {
          chapter.style.zIndex = '24';
          gsap.set(link, { y: 12, autoAlpha: 0 });
          timeline.to(link, { y: 0, autoAlpha: 1, duration: 0.022, ease: 'power3.out' }, start + 0.024);
        } else {
          timeline
            .to(incomingLines, {
              yPercent: -68,
              autoAlpha: 0,
              duration: 0.016,
              stagger: 0.003,
              ease: 'power2.inOut',
            }, nextStart - 0.018)
            .to(chapter, {
              autoAlpha: 0,
              duration: id === 'anticipation' ? 0.004 : 0.014,
              ease: 'power2.in',
            }, nextStart - (id === 'anticipation' ? 0 : 0.008));
        }
      }

      // Open the performance back to its full frame before the closing photo.
      film.style.zIndex = '20';
      timeline
        .fromTo(
          cutLight,
          { opacity: 0, scale: 0.92 },
          { opacity: 0.52, scale: 1.04, duration: 0.036, ease: 'sine.inOut', immediateRender: false },
          performanceStart - 0.028
        )
        .set(film, { autoAlpha: 1 }, performanceStart)
        .to(session, { '--session-scale': 1, '--session-pan': '0%', duration: 0.035, ease: 'sine.out' }, performanceStart)
        .to(cutLight, { opacity: 0, scale: 1.12, duration: 0.048, ease: 'power2.out' }, performanceStart + 0.008)
        .to(filmLines, {
          yPercent: 0, autoAlpha: 1, duration: 0.032, stagger: 0.006, ease: 'power3.out',
        }, performanceStart + 0.020)
        .to(filmLines, {
          yPercent: -72, autoAlpha: 0, duration: 0.024, stagger: 0.004, ease: 'power2.inOut',
        }, discoveryStart - 0.024)
        .set(film, { autoAlpha: 0 }, discoveryStart + closingDissolve)
        .set(session, { autoAlpha: 0 }, discoveryStart + closingDissolve);

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
