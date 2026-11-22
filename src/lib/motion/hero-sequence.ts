import type { Action } from 'svelte/action';

const motionQuery = '(prefers-reduced-motion: no-preference) and (min-height: 35rem)';
const beats = {
  portraitDissolve: 0.20,
  studio: 0.38,
  buffer: 0.43,
  bridge: 0.52,
  cut: 0.69,
  controls: 0.83,
};

export const heroSequence: Action<HTMLElement, (progress: number) => void> = (root, sweepCymbal) => {
  const element = (name: string) => root.querySelector<HTMLElement>(`[data-hero-${name}]`);
  const stage = element('stage');
  const portrait = element('poster');
  const type = element('type');
  const details = element('details');
  const light = element('rim');
  const bronze = element('bronze');
  const darkroom = element('darkroom');
  const impact = element('impact');
  const studio = element('session');
  const studioImage = element('session-image');
  const film = element('finale');
  const caption = element('finale-title');
  const controls = element('finale-controls');
  const shot = element('shot');
  const meter = element('meter');
  const bar = element('progress');
  if (!stage || !portrait || !type || !details || !light || !bronze || !darkroom || !impact ||
      !studio || !studioImage || !film || !caption || !controls || !shot || !meter || !bar) return;

  const layers = { stage, portrait, type, details, light, bronze, darkroom, impact, studio,
    studioImage, film, controls, shot, meter, bar };
  const nameLines = type.querySelectorAll<HTMLElement>('[data-hero-name-line]');
  const title = type.querySelector('[data-artist-opening]');
  const studioLines = studio.querySelectorAll<HTMLElement>('[data-hero-session-line]');
  const filmLines = caption.querySelectorAll<HTMLElement>('[data-hero-film-line]');
  const preference = window.matchMedia(motionQuery);
  let disposed = false;
  let prepared = false;
  let revert: (() => void) | undefined;

  async function install() {
    const [{ gsap }, { ScrollTrigger }] = await Promise.all([
      import('gsap'), import('gsap/ScrollTrigger'),
    ]);
    if (disposed) return;

    const { stage, portrait, type, details, light, bronze, darkroom, impact, studio, studioImage,
      film, controls, shot, meter, bar } = layers;
    gsap.registerPlugin(ScrollTrigger);
    const queries = gsap.matchMedia(root);
    revert = () => queries.revert();

    queries.add(motionQuery, () => {
      root.dataset.cinematic = 'true';
      gsap.set(filmLines, { yPercent: 112 });
      gsap.set(studioLines, { yPercent: 112 });
      gsap.set([controls, shot, meter], { autoAlpha: 0 });
      gsap.set(bronze, { autoAlpha: 0 });
      const lighting = { progress: 0 };
      let stageVisible = false;
      let mediaActive = false;
      let controlsActive = false;

      const timeline = gsap.timeline({ paused: true, defaults: { ease: 'none' } });
      timeline
        .to(bar, { scaleX: 1, duration: 1 }, 0)
        .to(lighting, { progress: 1, duration: 0.30, ease: 'sine.inOut' }, 0.08)
        .to(light, { '--hero-rim-opacity': 1, duration: 0.16, ease: 'sine.inOut' }, 0.09)
        .to(details, { y: -14, autoAlpha: 0, duration: 0.16, ease: 'sine.inOut' }, 0.19)
        .to(title, { y: -6, autoAlpha: 0, duration: 0.10, ease: 'sine.inOut' }, 0.21)
        .to(nameLines, { yPercent: -105, opacity: 0, duration: 0.13, stagger: 0.018, ease: 'power2.inOut' }, 0.23)
        .set(studio, { visibility: 'visible' }, beats.portraitDissolve)
        .fromTo(studioImage, { scale: 1.065 }, { scale: 1, duration: 0.34, ease: 'sine.out', immediateRender: false }, beats.portraitDissolve)
        .to(portrait, { autoAlpha: 0, duration: beats.studio - beats.portraitDissolve, ease: 'sine.inOut' }, beats.portraitDissolve)
        .to(studioLines, { yPercent: 0, duration: 0.09, stagger: 0.022, ease: 'power3.out' }, 0.30)
        .to(studioLines, { yPercent: -112, duration: 0.075, stagger: 0.012, ease: 'power2.inOut' }, beats.bridge)
        .to(bronze, { autoAlpha: 1, duration: 0.09, ease: 'sine.inOut' }, beats.bridge)
        .fromTo(bronze, { scale: 1.11, yPercent: -5 }, { scale: 1, yPercent: 0, duration: 0.16, ease: 'power2.out', immediateRender: false }, beats.bridge)
        .to(darkroom, { opacity: 0.84, duration: 0.13, ease: 'power2.in' }, 0.55)
        // Match the bronze edge into the first frame. The audio transient stays in the edit.
        .set(film, { visibility: 'visible' }, beats.cut)
        .set([studio, bronze], { autoAlpha: 0 }, beats.cut)
        .to(darkroom, { opacity: 0, duration: 0.032, ease: 'power2.out' }, beats.cut)
        .to(impact, { opacity: 0.78, duration: 0.012, ease: 'power1.out' }, beats.cut)
        .to(impact, { opacity: 0, duration: 0.045, ease: 'power3.out' }, beats.cut + 0.012)
        .to(filmLines, { yPercent: 0, duration: 0.10, stagger: 0.016, ease: 'power3.out' }, 0.74)
        .to([shot, meter], { autoAlpha: 1, y: 0, duration: 0.095, stagger: 0.02, ease: 'power3.out' }, 0.78)
        .to(controls, { autoAlpha: 1, duration: 0.09, ease: 'sine.out' }, 0.81);

      function sync() {
        const p = timeline.progress();
        const scene = p < beats.portraitDissolve ? 'portrait'
          : p < beats.studio ? 'portrait-dissolve'
          : p < beats.bridge ? 'studio'
          : p < beats.cut ? 'bronze'
          : 'film';
        if (root.dataset.scene !== scene) root.dataset.scene = scene;
        const nextControls = stageVisible && p >= beats.controls;
        const nextActive = stageVisible && p >= beats.cut;
        if (stageVisible && p >= beats.buffer && !prepared) {
          prepared = true;
          root.dispatchEvent(new Event('herofilmprepare'));
        }
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
        stageVisible = entry.intersectionRatio >= 0.55;
        sync();
      }, { threshold: 0.55 });
      stageObserver.observe(stage);

      timeline.eventCallback('onUpdate', () => {
        sweepCymbal(lighting.progress);
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
        stageObserver.disconnect();
        if (mediaActive) root.dispatchEvent(new Event('herofilmstop'));
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
