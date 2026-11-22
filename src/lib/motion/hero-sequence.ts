import type { Action } from 'svelte/action';
import { heroChapters, performanceStart } from '#lib/components/hero-chapters';

const motionQuery = '(prefers-reduced-motion: no-preference) and (min-height: 35rem)';
const openingDissolve = .055;
const closingDissolve = .032;

function prepareChapter(chapter: HTMLElement) {
  const image = chapter.querySelector<HTMLImageElement>('img[data-src]');
  if (image?.dataset.src) {
    if (image.dataset.srcset) image.srcset = image.dataset.srcset;
    image.src = image.dataset.src;
    image.removeAttribute('data-src');
  }
  const insert = chapter.querySelector<HTMLVideoElement>('video[data-src]');
  if (insert?.dataset.src) {
    insert.preload = 'auto';
    insert.src = insert.dataset.src;
    insert.removeAttribute('data-src');
  }
}

export const heroSequence: Action<HTMLElement, (progress: number) => void> = (root, sweepCymbal) => {
  const element = (name: string) => root.querySelector<HTMLElement>(`[data-hero-${name}]`);
  const stage = element('stage');
  const portrait = element('poster');
  const type = element('type');
  const details = element('details');
  const light = element('rim');
  const cutLight = element('cut-light');
  const editShadow = element('edit-shadow');
  const film = element('finale');
  const caption = element('finale-title');
  const controls = element('finale-controls');
  const shot = element('shot');
  const meter = element('meter');
  const bar = element('progress');
  const chapters = [...root.querySelectorAll<HTMLElement>('[data-hero-chapter]')];
  if (!stage || !portrait || !type || !details || !light || !cutLight || !editShadow || !film || !caption ||
      !controls || !shot || !meter || !bar || chapters.length !== heroChapters.length) return;

  const layers = { stage, portrait, type, details, light, cutLight, editShadow, film, caption, controls, shot, meter, bar };
  const preference = window.matchMedia(motionQuery);
  let disposed = false;
  let filmPrepared = false;
  let revert: (() => void) | undefined;
  const requested = new Set<HTMLElement>();

  function preload(chapter: HTMLElement | undefined) {
    if (!chapter || requested.has(chapter)) return;
    requested.add(chapter);
    prepareChapter(chapter);
  }

  async function install() {
    const [{ gsap }, { ScrollTrigger }] = await Promise.all([
      import('gsap'), import('gsap/ScrollTrigger'),
    ]);
    if (disposed) return;

    const { stage, portrait, type, details, light, cutLight, editShadow, film, caption, controls, shot, meter, bar } = layers;
    const discovery = chapters[chapters.length - 1];
    const discoveryStart = heroChapters[heroChapters.length - 1].start;
    const title = type.querySelectorAll('[data-artist-opening], [data-hero-name-line]');
    const filmLines = caption.querySelectorAll('[data-hero-film-line]');
    gsap.registerPlugin(ScrollTrigger);
    const queries = gsap.matchMedia(root);
    revert = () => queries.revert();

    queries.add(motionQuery, () => {
      root.dataset.cinematic = 'true';
      preload(chapters[0]);
      const illumination = { progress: 0 };
      let stageVisible = false;
      let mediaActive = false;
      let controlsActive = false;
      let activeChapter: HTMLElement | undefined;
      let activeInsert: HTMLVideoElement | undefined;

      function switchInsert(next?: HTMLVideoElement) {
        if (next === activeInsert) return;
        if (activeInsert) {
          activeInsert.pause();
          activeInsert.currentTime = 0;
        }
        activeInsert = next;
        if (next) void next.play().catch(() => {});
      }

      gsap.set(filmLines, { y: 18, autoAlpha: 0 });
      gsap.set([controls, shot, meter], { autoAlpha: 0 });

      const timeline = gsap.timeline({ paused: true, defaults: { ease: 'none' } });
      timeline
        .to(bar, { scaleX: 1, duration: 1 }, 0)
        .to(illumination, { progress: 1, duration: .16, ease: 'sine.inOut' }, .045)
        .to(light, { '--hero-rim-opacity': .95, duration: .10, ease: 'sine.inOut' }, .08)
        .to(details, { y: -9, autoAlpha: 0, duration: .031, ease: 'sine.inOut' }, .127)
        .to(title, { y: -15, autoAlpha: 0, duration: .035, stagger: .004, ease: 'power2.inOut' }, .136)
        .to(portrait, { autoAlpha: 0, duration: openingDissolve, ease: 'sine.inOut' }, heroChapters[0].start);

      for (const [index, chapter] of chapters.entries()) {
        const { start, id } = heroChapters[index];
        const incomingLines = chapter.querySelectorAll('[data-chapter-line]');
        const plate = chapter.querySelector<HTMLElement>('[data-chapter-plate]');
        const nextStart = id === 'anticipation' ? performanceStart : heroChapters[index + 1]?.start ?? 1;
        const captionStart = index === 0 ? start + .031 : start + .009;
        const link = chapter.querySelectorAll('[data-chapter-link]');
        gsap.set(incomingLines, { y: id === 'control' ? 6 : 14, autoAlpha: 0 });

        if (chapter === discovery) {
          gsap.set(chapter, { opacity: 0 });
          timeline.to(chapter, { opacity: 1, duration: closingDissolve, ease: 'sine.inOut' }, start);
        }
        timeline.to(incomingLines, {
          y: 0, autoAlpha: 1, duration: .021, stagger: .005, ease: 'power3.out',
        }, captionStart);

        if (plate && id === 'technique') {
          timeline.fromTo(plate, { scale: .99, xPercent: -.55 }, {
            scale: .96, xPercent: .55, duration: nextStart - start,
            ease: 'sine.out', immediateRender: false,
          }, start);
        }
        if (plate && id === 'musicality') {
          timeline.fromTo(plate, { scale: .96 }, {
            scale: 1, duration: nextStart - start, ease: 'sine.inOut', immediateRender: false,
          }, start);
        }
        if (chapter === discovery) {
          gsap.set(link, { y: 8, autoAlpha: 0 });
          timeline.to(link, { y: 0, autoAlpha: 1, duration: .019, ease: 'power2.out' }, start + .027);
        } else {
          timeline.to(incomingLines, {
            y: -6, autoAlpha: 0, duration: .013, ease: 'sine.in',
          }, nextStart - .013);
        }
        if (id === 'technique' || id === 'anticipation') {
          timeline
            .fromTo(editShadow, { opacity: 0, xPercent: -23 }, {
              opacity: .7, xPercent: 0, duration: .018, ease: 'sine.in', immediateRender: false,
            }, start - .018)
            .to(editShadow, { opacity: 0, xPercent: 17, duration: .022, ease: 'sine.out' }, start);
        }
      }

      // Keep the moving highlight local to the cymbal while the next frame takes over.
      timeline
        .to(cutLight, { opacity: .72, xPercent: 0, duration: .052, ease: 'sine.inOut' }, performanceStart - .045)
        .set(film, { autoAlpha: 1 }, performanceStart)
        .to(cutLight, { opacity: 0, xPercent: 10, duration: .055, ease: 'sine.out' }, performanceStart + .007)
        .to(filmLines, { y: 0, autoAlpha: 1, duration: .030, stagger: .005, ease: 'power3.out' }, performanceStart + .023)
        .to([shot, meter, controls], { autoAlpha: 1, duration: .025, stagger: .003, ease: 'sine.out' }, performanceStart + .032)
        .to(filmLines, { y: -12, autoAlpha: 0, duration: .026, stagger: .004, ease: 'power2.in' }, discoveryStart - .024)
        .set(film, { autoAlpha: 0 }, discoveryStart + closingDissolve);

      function sync() {
        const progress = timeline.progress();
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

        if (stageVisible) {
          preload(chapters[index]);
          preload(chapters[index + 1]);
          if (progress >= .55 && !filmPrepared) {
            filmPrepared = true;
            root.dispatchEvent(new Event('herofilmprepare'));
          }
        }

        const insert = nextChapter?.querySelector<HTMLVideoElement>('video[data-chapter-motion]');
        const cue = index === 0 ? heroChapters[0].start + openingDissolve : heroChapters[index]?.start;
        switchInsert(stageVisible && !document.hidden && cue !== undefined && progress >= cue
          ? insert ?? undefined : undefined);

        const nextActive = stageVisible && progress >= performanceStart && progress < discoveryStart + closingDissolve;
        const nextControls = stageVisible && inFilm && progress >= performanceStart + .046;
        if (nextActive !== mediaActive) {
          mediaActive = nextActive;
          root.dispatchEvent(new Event(mediaActive ? 'herofilmstart' : 'herofilmstop'));
        }
        if (nextControls !== controlsActive) {
          controlsActive = nextControls;
          film.inert = !controlsActive;
          film.setAttribute('aria-hidden', String(!controlsActive));
        }
      }

      const stageObserver = new IntersectionObserver(([entry]) => {
        stageVisible = entry.intersectionRatio >= .55;
        sync();
      }, { threshold: .55 });
      stageObserver.observe(stage);
      document.addEventListener('visibilitychange', sync);
      timeline.eventCallback('onUpdate', () => {
        sweepCymbal(illumination.progress);
        sync();
      });
      ScrollTrigger.create({
        animation: timeline,
        trigger: root,
        start: 'top top',
        end: 'bottom bottom',
        scrub: .68,
        onRefresh: sync,
      });
      sync();

      return () => {
        stageObserver.disconnect();
        document.removeEventListener('visibilitychange', sync);
        switchInsert();
        if (mediaActive) root.dispatchEvent(new Event('herofilmstop'));
        if (activeChapter) {
          activeChapter.inert = true;
          delete activeChapter.dataset.shotActive;
        }
        sweepCymbal(0);
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
