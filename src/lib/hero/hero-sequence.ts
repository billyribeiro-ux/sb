import type { Action } from 'svelte/action';
import { heroChapters, performanceStart, widePerformanceFraming, type HeroFraming } from './hero-chapters';

const motionQuery = '(prefers-reduced-motion: no-preference) and (min-height: 35rem)';
const closingLead = .032;
const closingTail = .074;
const captionLead = .026;
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
  const chapters = [...root.querySelectorAll<HTMLElement>('[data-hero-chapter]')];
  if (!portrait || !backdrop || !session || !type || !details || !light ||
      !film || !caption || chapters.length !== heroChapters.length) return;

  const layers = {
    portrait, backdrop, session, type, details, light, film, caption,
    flash, lightLeak, scrollInstruction,
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
      flash, lightLeak, scrollInstruction,
    } = layers;
    const discovery = chapters[chapters.length - 1];
    const discoveryStart = heroChapters[heroChapters.length - 1].start;
    const discoveryImage = discovery.querySelector<HTMLImageElement>('img');
    const openingStart = heroChapters[0].start;
    const editedOpening = Boolean(options.openingEdit);
    const chars = type.querySelectorAll<HTMLElement>('[data-hero-char]');
    const sponsorScenes = root.querySelectorAll<HTMLElement>('[data-hero-sponsor-scene]');
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

      gsap.set(sponsorScenes, { autoAlpha: 0 });
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
      const openingHandoff = editedOpening ? openingStart * .72 : openingStart;
      const sessionPlayback = editedOpening ? openingHandoff : openingBlendStart - .026;
      const grooveCaptionStart = openingStart - (editedOpening ? .048 : captionLead);
      const closingEnd = discoveryStart + closingTail;
      const typeTravel = gsap.utils.clamp(44, 76, window.innerHeight * .085);

      interface CaptionMoment {
        start: number;
        exitAt: number | undefined;
        animation: gsap.core.Timeline;
        started: boolean;
        completed: boolean;
        exitRequested: boolean;
      }

      const captionMoments: CaptionMoment[] = [];
      let captionsInitialized = false;
      let lastCaptionProgress = 0;

      function captionMoment(
        lines: NodeListOf<HTMLElement>,
        titleChars: NodeListOf<HTMLElement> | undefined,
        start: number,
        exitAt: number | undefined,
      ) {
        gsap.set(lines, {
          y: (index) => index === 0 ? typeTravel * .55 : typeTravel * .34,
          filter: 'blur(5px)', autoAlpha: 0,
        });
        if (titleChars) {
          gsap.set(titleChars, { yPercent: 128, rotationX: -72, opacity: 0, transformOrigin: '0% 100%' });
        }
        const animation = gsap.timeline({ paused: true });
        const moment: CaptionMoment = { start, exitAt, animation, started: false, completed: false, exitRequested: false };
        animation.to(lines, {
          y: 0, autoAlpha: 1, filter: 'blur(0px)',
          duration: .65, stagger: .07, ease: 'power3.out',
        }, 0);
        if (titleChars?.length) {
          animation.to(titleChars, {
            yPercent: 0, rotationX: 0, opacity: 1,
            duration: .8, stagger: .022, ease: 'power4.out',
          }, .08);
        }
        if (exitAt !== undefined) {
          animation.addPause(1.25, () => {
            if (moment.exitRequested) animation.play();
          }).to(lines, {
            y: (index) => index === 0 ? -typeTravel * .45 : -typeTravel * .28,
            filter: 'blur(3px)', autoAlpha: 0,
            duration: .75, ease: 'sine.inOut',
          }, 1.25);
          if (titleChars?.length) {
            animation.to(titleChars, {
              yPercent: -55, rotationX: 15, opacity: 0,
              duration: .75, stagger: .006, ease: 'sine.inOut',
            }, 1.25);
          }
        }
        animation.eventCallback('onComplete', () => {
          moment.completed = true;
          syncCaptions(captionTrigger.progress);
        });
        captionMoments.push(moment);
      }

      function syncCaptions(progress: number) {
        const jumped = Math.abs(progress - lastCaptionProgress) > .12;
        lastCaptionProgress = progress;
        const latestIndex = captionMoments.findLastIndex(moment => progress >= moment.start);
        if (!captionsInitialized || jumped) {
          for (const [index, moment] of captionMoments.entries()) {
            if (index >= latestIndex || moment.started) continue;
            moment.started = true;
            moment.completed = true;
            moment.exitRequested = true;
            moment.animation.progress(1, true).pause();
          }
          captionsInitialized = true;
        }
        for (const moment of captionMoments) {
          if (progress < moment.start) {
            moment.started = false;
            moment.completed = false;
            moment.exitRequested = false;
            moment.animation.pause(0);
          } else if (moment.exitAt !== undefined && progress >= moment.exitAt) {
            moment.exitRequested = true;
          }
        }
        const activeIndex = captionMoments.findIndex(moment => moment.started && !moment.completed);
        for (const moment of captionMoments) {
          if (moment.started && !moment.completed && moment.exitRequested && moment.animation.paused()) {
            moment.animation.play();
          }
        }
        if (activeIndex >= 0) return;
        const targetIndex = jumped
          ? latestIndex
          : captionMoments.findIndex(moment => !moment.completed && progress >= moment.start);
        const target = captionMoments[targetIndex];
        if (!target || target.started) return;
        target.started = true;
        target.animation.play(0);
      }

      function opticalCue(start: number, strength = .28, queue: gsap.core.Timeline = timeline) {
        if (flash) {
          queue.to(flash, { autoAlpha: strength, duration: .014, ease: 'power2.in' }, start)
            .to(flash, { autoAlpha: 0, duration: .07, ease: 'power2.out' }, start + .014);
        }
        if (lightLeak) {
          queue.fromTo(lightLeak,
            { autoAlpha: 0, xPercent: -125 },
            { autoAlpha: .72, xPercent: 340, duration: .12, ease: 'power2.inOut', immediateRender: false },
            start - .018,
          ).to(lightLeak, { autoAlpha: 0, duration: .035 }, start + .102);
        }
      }

      function sponsorMoment(id: string, entrance: number, hold: number, exit: number) {
        const scene = root.querySelector<HTMLElement>(`[data-hero-sponsor-scene="${id}"]`);
        const atmosphere = root.querySelector<HTMLElement>('[data-hero-sponsor-atmosphere]');
        const frame = root.querySelector<HTMLElement>('[data-hero-stage]');
        const connector = scene?.querySelector<HTMLElement>('.hero-sponsor-connector');
        const descriptor = scene?.querySelector<HTMLElement>('.hero-sponsor-descriptor');
        const echo = scene?.querySelector<HTMLElement>('.hero-sponsor-echo');
        const shockwave = scene?.querySelector<HTMLElement>('.hero-sponsor-shockwave');
        const flare = scene?.querySelector<HTMLElement>('.hero-sponsor-flare');
        if (!scene) return;
        const animation = gsap.timeline({ paused: true });
        const exitStart = entrance + hold;
        const direction = id === 'sabian' ? 1 : -1;
        const originX = frame
          ? id === 'sabian'
            ? frame.clientWidth - scene.offsetLeft + scene.offsetWidth * .5
            : frame.clientWidth * .5 - (scene.offsetLeft + scene.offsetWidth * .5)
          : 0;
        const originY = frame
          ? id === 'sabian'
            ? scene.offsetHeight * .15
            : frame.clientHeight * .46 - (scene.offsetTop + scene.offsetHeight * .5)
          : 0;
        opticalCue(entrance - .12, .38, animation);
        if (atmosphere) {
          animation.fromTo(atmosphere,
            { autoAlpha: 0 },
            { autoAlpha: .96, duration: entrance * .72, ease: 'sine.inOut', immediateRender: false },
            0,
          ).to(atmosphere, { autoAlpha: 0, duration: exit, ease: 'sine.inOut' }, exitStart);
        }
        animation.fromTo(scene,
          { autoAlpha: 0, filter: 'blur(12px)' },
          { autoAlpha: 1, filter: 'blur(0px)', duration: entrance, ease: 'sine.inOut', immediateRender: false },
          0,
        ).fromTo(scene,
          {
            scale: 4.2, x: originX, y: originY, rotation: -4 * direction,
            rotationY: -16 * direction, transformPerspective: 1200,
          },
          {
            scale: 1, x: 0, y: 0, rotation: 0, rotationY: 0,
            duration: entrance, ease: 'power2.inOut', immediateRender: false,
          },
          0,
        ).to(scene, { scale: 1.025, duration: hold, ease: 'sine.inOut' }, entrance)
        .to(scene, {
          autoAlpha: 0, scale: .65, x: -40 * direction, y: 12,
          rotationY: 10 * direction, filter: 'blur(5px)', duration: exit, ease: 'sine.inOut',
        }, exitStart);
        if (echo) {
          animation.fromTo(echo,
            { autoAlpha: .7, scale: 1, filter: 'blur(0px)' },
            { autoAlpha: 0, scale: 1.65, filter: 'blur(8px)', duration: entrance * .65, ease: 'power2.out', immediateRender: false },
            entrance * .82,
          );
        }
        if (shockwave) {
          animation.fromTo(shockwave,
            { autoAlpha: .85, scale: .3 },
            { autoAlpha: 0, scale: 2.1, duration: entrance * .75, ease: 'power2.out', immediateRender: false },
            entrance * .85,
          );
        }
        if (descriptor) {
          animation.fromTo(descriptor,
            { autoAlpha: 0, y: 12, letterSpacing: '.9em' },
            { autoAlpha: 1, y: 0, letterSpacing: '.42em', duration: entrance * .55, ease: 'power3.out', immediateRender: false },
            entrance * .65,
          );
        }
        if (connector) {
          animation.fromTo(connector,
            { scaleX: 0, autoAlpha: 0, transformOrigin: '100% 50%' },
            { scaleX: 1, autoAlpha: 1, duration: entrance * .55, ease: 'power2.out', immediateRender: false },
            entrance * .55,
          ).to(connector, {
            scaleX: 0, autoAlpha: 0, duration: exit * .8, ease: 'sine.inOut',
          }, exitStart);
        }
        if (flare) {
          animation.fromTo(flare,
            { xPercent: -170, autoAlpha: 0 },
            { xPercent: 170, autoAlpha: 1, duration: entrance * .65, ease: 'power2.inOut', immediateRender: false },
            entrance * .35,
          ).to(flare, { autoAlpha: 0, duration: entrance * .2 }, entrance);
        }
        return animation;
      }

      if (editedOpening) {
        const sponsorMoments = [
          {
            id: 'sabian', at: .035, exitAt: .173, holdAt: 2.75,
            animation: sponsorMoment('sabian', 1.9, .85, .95), triggered: false, queued: false, exitRequested: false,
          },
          {
            id: 'yamaha', at: .278, exitAt: .338, holdAt: 2.5,
            animation: sponsorMoment('yamaha', 1.7, .8, .9), triggered: false, queued: false, exitRequested: false,
          },
          {
            id: 'remo', at: .47, exitAt: .53, holdAt: 2.5,
            animation: sponsorMoment('remo', 1.7, .8, .9), triggered: false, queued: false, exitRequested: false,
          },
          {
            id: 'prologix', at: .76, exitAt: .84, holdAt: 2.5,
            animation: sponsorMoment('prologix', 1.7, .8, .9), triggered: false, queued: false, exitRequested: false,
          },
        ];
        type SponsorMoment = (typeof sponsorMoments)[number];
        let sponsorProgress = 0;
        let activeSponsor: SponsorMoment | undefined;

        for (const moment of sponsorMoments) {
          moment.animation?.addPause(moment.holdAt, () => {
            if (moment.exitRequested) moment.animation?.play();
          });
        }

        function startSponsor(moment: SponsorMoment) {
          if (!moment.animation || activeSponsor === moment) return;
          if (activeSponsor) {
            moment.queued = true;
            return;
          }
          activeSponsor = moment;
          moment.triggered = true;
          moment.queued = false;
          moment.animation.eventCallback('onComplete', () => {
            activeSponsor = undefined;
            const next = sponsorMoments.find(candidate => candidate.queued && sponsorProgress >= candidate.at);
            if (next) startSponsor(next);
          }).play(0);
        }

        function syncSponsors(progress: number) {
          sponsorProgress = progress;
          for (const moment of sponsorMoments) {
            if (progress < moment.at) {
              moment.queued = false;
              if (moment !== activeSponsor) {
                moment.triggered = false;
                moment.exitRequested = false;
                moment.animation?.pause(0);
              }
              continue;
            }
            if (progress >= moment.exitAt) moment.exitRequested = true;
            if (!moment.triggered || moment.queued) {
              startSponsor(moment);
            } else if (moment.exitRequested && moment.animation?.paused()) {
              moment.animation.play();
            }
          }
        }

        const sponsorTrigger = ScrollTrigger.create({
          trigger: root,
          start: 'top top',
          end: 'bottom bottom',
          onUpdate: self => syncSponsors(self.progress),
          onRefresh: self => syncSponsors(self.progress),
        });
        syncSponsors(sponsorTrigger.progress);
        // The pullback and first performance angle are frames of the same edit.
        timeline
          .set(session, { autoAlpha: 1, '--session-live-opacity': 1, '--session-shade': 0 }, 0)
          .to(portrait, { '--hero-opening-grade': 0, duration: openingHandoff * .66, ease: 'sine.inOut' }, openingHandoff * .34)
          .set(portrait, { autoAlpha: 0 }, openingHandoff);
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

        captionMoment(lines, titleChars, captionStart, closing ? undefined : nextStart);
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
      captionMoment(filmLines, undefined, performanceStart - captionLead, discoveryStart);
      opticalCue(performanceStart - captionLead, .58);

      const captionTrigger = ScrollTrigger.create({
        trigger: root,
        start: 'top top',
        end: 'bottom bottom',
        onUpdate: self => syncCaptions(self.progress),
        onRefresh: self => syncCaptions(self.progress),
      });
      syncCaptions(captionTrigger.progress);

      function sync() {
        const progress = timeline.progress();
        options.onOpeningProgress?.(progress / openingHandoff);
        if (progress > 0.015 && introTimeline?.isActive()) {
          introTimeline.progress(1);
        }

        const index = heroChapters.findLastIndex(chapter => progress >= chapter.start);
        const inFilm = progress >= performanceStart && progress < discoveryStart;
        const visibleIndex = progress >= grooveCaptionStart ? Math.max(0, index) : index;
        const nextChapter = inFilm ? undefined : chapters[visibleIndex];
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
