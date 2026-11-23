import type { Action } from 'svelte/action';
import { heroChapters, performanceStart, widePerformanceFraming, type HeroFraming } from './hero-chapters';

const motionQuery = '(prefers-reduced-motion: no-preference) and (min-height: 35rem)';
const closingLead = .032;
const closingTail = .074;
const captionLead = .026;
const captionExitLead = .048;
const captionFadeOut = .079;
const cutawayLead = .04;
const cutawayTail = .043;
const cutawayIndex = heroChapters.findIndex(chapter => chapter.id === 'flow');
const cutawayStart = heroChapters[cutawayIndex].start;
const cutawayEnd = heroChapters[cutawayIndex + 1].start;

function framingStyles(framing: HeroFraming) {
  return {
    '--session-scale': framing.scale,
    '--session-pan': `${framing.xPercent}%`,
    '--session-rise': `${framing.yPercent}%`,
    '--session-shade': framing.shade,
    '--session-brightness': framing.brightness ?? 1,
    '--session-saturation': framing.saturation ?? 1,
  };
}

export interface HeroSequenceOptions {
  openingEdit?: boolean;
  arrivedThroughIntro?: boolean;
  onOpeningProgress?: (progress: number) => void;
  sweepCymbal?: (progress: number) => void;
  onPictureChange?: (active: boolean, matchingOpening?: boolean) => void;
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
  const film = element('finale');
  const caption = element('finale-title');
  const flash = element('flash');
  const lightLeak = element('leak');
  const scrollInstruction = element('scroll');
  const sceneCount = element('scene-count');
  const sceneName = element('scene-name');
  const sceneMeter = element('scene-meter');
  const chapters = [...root.querySelectorAll<HTMLElement>('[data-hero-chapter]')];
  if (!portrait || !backdrop || !session || !type || !details || !light ||
      !film || !caption || chapters.length !== heroChapters.length) return;

  const layers = {
    portrait, backdrop, session, type, details, light, film, caption,
    flash, lightLeak, scrollInstruction, sceneCount, sceneName, sceneMeter,
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
      portrait, backdrop, session, type, details, light, film, caption,
      flash, lightLeak, scrollInstruction, sceneCount, sceneName, sceneMeter,
    } = layers;
    const discovery = chapters[chapters.length - 1];
    const discoveryStart = heroChapters[heroChapters.length - 1].start;
    const discoveryImage = discovery.querySelector<HTMLImageElement>('img');
    const openingStart = heroChapters[0].start;
    const editedOpening = Boolean(options.openingEdit);
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
      let matchingOpening = false;
      let cutawayActive = false;
      let activeChapter: HTMLElement | undefined;

      // Theatrical title-sequence entrance (headroom-safe scale from upper-center origin)
      let introTimeline: gsap.core.Timeline | undefined;
      if (!options.arrivedThroughIntro && window.scrollY < 24 && !document.hidden) {
        const intro = gsap.timeline({ defaults: { ease: 'power4.out' } });
        introTimeline = intro;
        if (backdropImg && !editedOpening) {
          intro.fromTo(
            backdropImg,
            { scale: 1.045 },
            { scale: 1, duration: 1.45, ease: 'power3.out' },
            0
          );
        }
        if (chars.length) {
          intro.from(chars, {
            y: 84,
            rotationX: -72,
            transformOrigin: '50% 100%',
            opacity: 0,
            filter: 'blur(8px)',
            duration: 1.15,
            stagger: 0.032,
            clearProps: 'transform,opacity,filter',
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
      if (flash) gsap.set(flash, { autoAlpha: 0 });
      if (lightLeak) gsap.set(lightLeak, { autoAlpha: 0, xPercent: -125 });

      const timeline = gsap.timeline({ paused: true, defaults: { ease: 'none' } });
      const sessionReveal = openingStart * .38;
      const openingBlendStart = openingStart - .024;
      const openingBlendEnd = openingStart + .065;
      const sessionPlayback = editedOpening ? openingStart : openingBlendStart - .026;
      const grooveCaptionStart = openingStart - (editedOpening ? .048 : captionLead);
      const closingEnd = discoveryStart + closingTail;
      const typeTravel = gsap.utils.clamp(44, 76, window.innerHeight * .085);

      function revealCaption(lines: NodeListOf<HTMLElement>, start: number) {
        gsap.set(lines, {
          y: (index) => index === 0 ? typeTravel * .55 : typeTravel * .34,
          filter: 'blur(5px)', autoAlpha: 0,
        });
        timeline.to(lines, {
          y: 0, autoAlpha: 1, filter: 'blur(0px)',
          duration: .068, stagger: .012, ease: 'power3.out',
        }, start);
      }

      function exitCaption(lines: NodeListOf<HTMLElement>, boundary: number) {
        const start = boundary - captionExitLead;
        timeline.to(lines, {
          y: (index) => index === 0 ? -typeTravel * .45 : -typeTravel * .28,
          filter: 'blur(5px)', autoAlpha: 0,
          duration: captionFadeOut, ease: 'power2.in',
        }, start);
        return start + captionFadeOut;
      }

      function opticalCue(start: number, strength = .28) {
        if (flash) {
          timeline.to(flash, { autoAlpha: strength, duration: .014, ease: 'power2.in' }, start)
            .to(flash, { autoAlpha: 0, duration: .07, ease: 'power2.out' }, start + .014);
        }
        if (lightLeak) {
          timeline.fromTo(lightLeak,
            { autoAlpha: 0, xPercent: -125 },
            { autoAlpha: .72, xPercent: 340, duration: .12, ease: 'power2.inOut', immediateRender: false },
            start - .018,
          ).to(lightLeak, { autoAlpha: 0, duration: .035 }, start + .102);
        }
      }

      if (editedOpening) {
        // The pullback and first performance angle are frames of the same edit.
        timeline
          .set(session, { autoAlpha: 1, '--session-live-opacity': 1, '--session-shade': 0 }, 0)
          .to(portrait, { '--hero-opening-grade': 0, duration: openingStart * .66, ease: 'sine.inOut' }, openingStart * .34)
          .set(portrait, { autoAlpha: 0 }, openingStart);
      } else {
        timeline
          .to(illumination, { progress: 1, duration: openingStart, ease: 'sine.inOut' }, 0)
          .to(light, { '--hero-rim-opacity': .9, duration: openingStart * .6, ease: 'sine.inOut' }, openingStart * .2)
          .set(session, { autoAlpha: 1 }, sessionReveal)
          .fromTo(session, { '--session-live-opacity': 0 }, {
            '--session-live-opacity': 1, duration: .03, ease: 'sine.inOut', immediateRender: false,
          }, sessionPlayback)
          .to(portrait, {
            '--hero-opening-grade': 0, '--hero-still-scale': .74,
            duration: openingStart - sessionReveal, ease: 'sine.inOut',
          }, sessionReveal)
          .to(portrait, {
            autoAlpha: 0, duration: openingBlendEnd - openingBlendStart, ease: 'sine.inOut',
          }, openingBlendStart);
      }

      timeline
        .to(type, {
          y: -typeTravel, filter: 'blur(5px)', autoAlpha: 0, duration: .092, ease: 'sine.inOut',
        }, grooveCaptionStart - .053)
        .to(details, {
          y: -typeTravel * .46, filter: 'blur(4px)', autoAlpha: 0, duration: .08, ease: 'sine.inOut',
        }, grooveCaptionStart - .044);

      if (scrollInstruction) timeline.to(scrollInstruction, { autoAlpha: 0, duration: .045 }, grooveCaptionStart - .04);
      opticalCue(grooveCaptionStart - .02, .42);

      if (cutaway) {
        timeline
          .fromTo(cutaway,
            { autoAlpha: 0, clipPath: 'inset(48% 0 48% 0)' },
            { autoAlpha: 1, clipPath: 'inset(0% 0 0% 0)', duration: .075, ease: 'power3.out', immediateRender: false },
            cutawayStart - .029,
          )
          .to(cutaway, {
            autoAlpha: 0, clipPath: 'inset(0 0 100% 0)', duration: cutawayTail + .028, ease: 'power2.in',
          }, cutawayEnd - .028);
      }

      // The moving picture keeps its own time. Scroll cues only change its framing and captions.
      for (const [index, chapter] of chapters.entries()) {
        const { start, id, framing } = heroChapters[index];
        const lines = chapter.querySelectorAll<HTMLElement>('[data-chapter-line]');
        const plate = chapter.querySelector<HTMLElement>('[data-chapter-plate]');
        const titleChars = chapter.querySelectorAll<HTMLElement>('[data-hero-title-char]');
        const nextStart = id === 'anticipation' ? performanceStart : heroChapters[index + 1]?.start ?? 1;
        const closing = chapter === discovery;
        const captionStart = index === 0 ? grooveCaptionStart : start - captionLead;

        chapter.style.zIndex = String(closing ? 24 : 10 + index);
        if (closing) {
          timeline.fromTo(chapter,
            { clipPath: 'inset(9% 6%)' },
            { clipPath: 'inset(0% 0%)', duration: closingLead + closingTail, ease: 'power3.out', immediateRender: false },
            start - closingLead,
          ).to(chapter, {
            autoAlpha: 1, duration: closingLead + closingTail, ease: 'sine.inOut',
          }, start - closingLead);
          opticalCue(start - closingLead, .5);
        } else {
          timeline.set(chapter, { autoAlpha: 1 }, captionStart);
          if (index > 0) opticalCue(captionStart + .004, id === 'anticipation' ? .44 : .22);
        }

        if (framing) {
          timeline.to(session, {
            ...framingStyles(framing), duration: .086, ease: 'sine.inOut',
          }, start - .021);
        }

        if (plate) {
          timeline.fromTo(plate, { scale: 1.035 }, {
            scale: 1, duration: 1 - start + closingLead, ease: 'sine.out', immediateRender: false,
          }, start - closingLead);
        }

        gsap.set(titleChars, { yPercent: 128, rotationX: -72, opacity: 0, transformOrigin: '0% 100%' });
        timeline.to(titleChars, {
          yPercent: 0, rotationX: 0, opacity: 1,
          duration: .075, stagger: .0032, ease: 'power4.out',
        }, captionStart + .012);
        revealCaption(lines, captionStart);

        if (!closing) {
          const hiddenAt = exitCaption(lines, nextStart);
          timeline.set(chapter, { autoAlpha: 0 }, hiddenAt);
        }
      }

      // Open the performance back to its full frame before the closing photo.
      film.style.zIndex = '20';
      timeline
        .set(film, { autoAlpha: 1 }, performanceStart - captionLead)
        .to(session, {
          ...framingStyles(widePerformanceFraming), duration: .096, ease: 'sine.inOut',
        }, performanceStart - .026)
        .set(film, { autoAlpha: 0 }, closingEnd)
        .set(session, { autoAlpha: 0 }, closingEnd);
      revealCaption(filmLines, performanceStart - captionLead);
      exitCaption(filmLines, discoveryStart);
      opticalCue(performanceStart - captionLead, .58);

      function sync() {
        const progress = timeline.progress();
        options.onOpeningProgress?.(progress / openingStart);
        if (progress > 0.015 && introTimeline?.isActive()) {
          introTimeline.progress(1);
        }

        const index = heroChapters.findLastIndex(chapter => progress >= chapter.start);
        const inFilm = progress >= performanceStart && progress < discoveryStart;
        const visibleIndex = progress >= grooveCaptionStart ? Math.max(0, index) : index;
        const nextChapter = inFilm ? undefined : chapters[visibleIndex];
        const scene = inFilm ? 'film' : heroChapters[index]?.id ?? 'portrait';

        if (root.dataset.scene !== scene) root.dataset.scene = scene;

        const statusChapter = !inFilm && nextChapter ? heroChapters[visibleIndex] : undefined;
        const nextCount = inFilm ? 'LIVE' : statusChapter ? `${String(visibleIndex + 1).padStart(2, '0')} / 07` : '00 / 07';
        const nextName = inFilm ? 'Happy People 7/4' : statusChapter?.title ?? 'Opening titles';
        if (sceneCount && sceneCount.textContent !== nextCount) sceneCount.textContent = nextCount;
        if (sceneName && sceneName.textContent !== nextName) sceneName.textContent = nextName;
        if (sceneMeter) sceneMeter.style.transform = `scaleX(${progress})`;

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

        if (progress >= .52 && discoveryImage?.dataset.src) {
          if (discoveryImage.dataset.srcset) discoveryImage.srcset = discoveryImage.dataset.srcset;
          discoveryImage.src = discoveryImage.dataset.src;
          discoveryImage.removeAttribute('data-src');
        }

        const nextPicture = progress >= sessionPlayback && progress < closingEnd;
        const nextMatch = !editedOpening && nextPicture && progress < openingBlendEnd;
        if (nextPicture !== pictureActive || nextMatch !== matchingOpening) {
          pictureActive = nextPicture;
          matchingOpening = nextMatch;
          options.onPictureChange?.(pictureActive, matchingOpening);
        }
        const nextCutaway = Boolean(cutaway && progress >= cutawayStart - cutawayLead && progress < cutawayEnd + cutawayTail);
        if (nextCutaway !== cutawayActive) {
          cutawayActive = nextCutaway;
          options.onCutawayChange?.(cutawayActive);
        }
        film.inert = !inFilm;
        film.setAttribute('aria-hidden', String(!inFilm));
      }

      timeline.eventCallback('onUpdate', () => {
        if (!editedOpening && timeline.progress() >= 0.02) {
          options.sweepCymbal?.(illumination.progress);
        }
        sync();
      });

      ScrollTrigger.create({
        animation: timeline,
        trigger: root,
        start: 'top top',
        end: 'bottom bottom',
        scrub: 1.1,
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
        options.onOpeningProgress?.(0);
        film.inert = true;
        film.setAttribute('aria-hidden', 'true');
        delete root.dataset.scene;
        delete root.dataset.cinematic;
        if (sceneCount) sceneCount.textContent = '00 / 07';
        if (sceneName) sceneName.textContent = 'Opening titles';
        if (sceneMeter) sceneMeter.style.transform = 'scaleX(0)';
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
