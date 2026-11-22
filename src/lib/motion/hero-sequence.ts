import type { Action } from 'svelte/action';
import { heroChapters, performanceStart } from '#lib/components/hero-chapters';

const motionQuery = '(prefers-reduced-motion: no-preference) and (min-height: 35rem)';
const overlap = .043;

function prepareImage(chapter: HTMLElement) {
  const image = chapter.querySelector<HTMLImageElement>('img[data-src]');
  if (!image?.dataset.src) return;

  for (const source of chapter.querySelectorAll<HTMLSourceElement>('source[data-srcset]')) {
    source.srcset = source.dataset.srcset ?? '';
  }
  if (image.dataset.srcset) image.srcset = image.dataset.srcset;
  image.src = image.dataset.src;
  image.removeAttribute('data-src');
}

export const heroSequence: Action<HTMLElement, (progress: number) => void> = (root, sweepCymbal) => {
  const element = (name: string) => root.querySelector<HTMLElement>(`[data-hero-${name}]`);
  const stage = element('stage');
  const portrait = element('poster');
  const type = element('type');
  const details = element('details');
  const light = element('rim');
  const cutLight = element('cut-light');
  const film = element('finale');
  const caption = element('finale-title');
  const controls = element('finale-controls');
  const shot = element('shot');
  const meter = element('meter');
  const bar = element('progress');
  const chapters = [...root.querySelectorAll<HTMLElement>('[data-hero-chapter]')];
  if (!stage || !portrait || !type || !details || !light || !cutLight || !film || !caption ||
      !controls || !shot || !meter || !bar || chapters.length !== heroChapters.length) return;

  const layers = { stage, portrait, type, details, light, cutLight, film, caption, controls, shot, meter, bar };
  const preference = window.matchMedia(motionQuery);
  let disposed = false;
  let filmPrepared = false;
  let revert: (() => void) | undefined;
  const requested = new Set<HTMLElement>();

  function preload(chapter: HTMLElement | undefined) {
    if (!chapter || requested.has(chapter)) return;
    requested.add(chapter);
    prepareImage(chapter);
  }

  async function install() {
    const [{ gsap }, { ScrollTrigger }] = await Promise.all([
      import('gsap'), import('gsap/ScrollTrigger'),
    ]);
    if (disposed) return;

    const { stage, portrait, type, details, light, cutLight, film, caption, controls, shot, meter, bar } = layers;
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

      gsap.set(filmLines, { y: 18, autoAlpha: 0 });
      gsap.set([controls, shot, meter], { autoAlpha: 0 });

      const timeline = gsap.timeline({ paused: true, defaults: { ease: 'none' } });
      timeline
        .to(bar, { scaleX: 1, duration: 1 }, 0)
        .to(illumination, { progress: 1, duration: .16, ease: 'sine.inOut' }, .045)
        .to(light, { '--hero-rim-opacity': .95, duration: .10, ease: 'sine.inOut' }, .08)
        .to(details, { y: -12, autoAlpha: 0, duration: .045, ease: 'sine.inOut' }, .13)
        .to(title, { yPercent: -82, autoAlpha: 0, duration: .042, stagger: .004, ease: 'power2.inOut' }, .137)
        .to(portrait, { autoAlpha: 0, duration: overlap, ease: 'sine.inOut' }, heroChapters[0].start);

      for (const [index, chapter] of chapters.entries()) {
        const { start } = heroChapters[index];
        const incomingLines = chapter.querySelectorAll('[data-chapter-line]');
        const plate = chapter.querySelector<HTMLElement>('[data-chapter-plate]');
        const isHoldFrame = heroChapters[index].id === 'anticipation';
        const textOut = isHoldFrame ? performanceStart : heroChapters[index + 1]?.start ?? 1;
        const link = chapter.querySelectorAll('[data-chapter-link]');
        gsap.set(incomingLines, { y: 21, autoAlpha: 0 });

        timeline
          .fromTo(chapter, { autoAlpha: 0 }, {
            autoAlpha: 1, duration: index === 0 ? .001 : overlap, ease: 'sine.inOut',
            immediateRender: false,
          }, start)
          .to(incomingLines, {
            y: 0, autoAlpha: 1, duration: .027, stagger: .007, ease: 'power3.out',
          }, start + .020);

        if (plate && !isHoldFrame) {
          timeline.fromTo(plate, { scale: index % 2 ? 1.022 : 1.06 }, {
            scale: index % 2 ? 1.057 : 1, duration: Math.min(1, textOut + .015) - start,
            ease: 'sine.out', immediateRender: false,
          }, start);
        }
        if (chapter === discovery) {
          timeline.fromTo(link, { y: 10, autoAlpha: 0 }, {
            y: 0, autoAlpha: 1, duration: .027, ease: 'power2.out', immediateRender: false,
          }, start + .043);
        } else {
          timeline.to(incomingLines, {
            y: -12, autoAlpha: 0, duration: .023, stagger: .005, ease: 'power2.in',
          }, textOut - .014);
          if (isHoldFrame) {
            timeline.to(chapter, { autoAlpha: 0, duration: .025, ease: 'sine.inOut' }, performanceStart - .005);
          } else {
            timeline.set(chapter, { autoAlpha: 0 }, textOut + overlap);
          }
        }
      }

      // Keep the moving highlight local to the cymbal while the next frame takes over.
      timeline
        .to(cutLight, { opacity: .72, xPercent: 0, duration: .052, ease: 'sine.inOut' }, performanceStart - .045)
        .set(film, { autoAlpha: 1 }, performanceStart - .014)
        .to(cutLight, { opacity: 0, xPercent: 10, duration: .055, ease: 'sine.out' }, performanceStart + .007)
        .to(filmLines, { y: 0, autoAlpha: 1, duration: .030, stagger: .005, ease: 'power3.out' }, performanceStart + .023)
        .to([shot, meter, controls], { autoAlpha: 1, duration: .025, stagger: .003, ease: 'sine.out' }, performanceStart + .032)
        .to(filmLines, { y: -12, autoAlpha: 0, duration: .026, stagger: .004, ease: 'power2.in' }, discoveryStart - .024)
        .set(film, { autoAlpha: 0 }, discoveryStart + overlap);

      function sync() {
        const progress = timeline.progress();
        const index = heroChapters.findLastIndex(chapter => progress >= chapter.start);
        const inFilm = progress >= performanceStart && progress < discoveryStart;
        const nextChapter = inFilm ? undefined : chapters[index];
        const scene = inFilm ? 'film' : heroChapters[index]?.id ?? 'portrait';
        if (root.dataset.scene !== scene) root.dataset.scene = scene;

        if (activeChapter !== nextChapter) {
          if (activeChapter) activeChapter.inert = true;
          if (nextChapter) nextChapter.inert = false;
          activeChapter = nextChapter;
        }

        if (stageVisible) {
          preload(chapters[index]);
          preload(chapters[index + 1]);
          if (progress >= .66 && !filmPrepared) {
            filmPrepared = true;
            root.dispatchEvent(new Event('herofilmprepare'));
          }
        }

        const nextActive = stageVisible && progress >= performanceStart && progress < discoveryStart + overlap;
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
        if (mediaActive) root.dispatchEvent(new Event('herofilmstop'));
        if (activeChapter) activeChapter.inert = true;
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
