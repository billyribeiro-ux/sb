import type { Action } from 'svelte/action';

const motionQuery = '(prefers-reduced-motion: no-preference)';

export const heroSequence: Action<HTMLElement> = (root) => {
  const element = (name: string) => root.querySelector<HTMLElement>(`[data-hero-${name}]`);
  const stage = element('stage');
  const portrait = element('poster');
  const type = element('type');
  const details = element('details');
  const light = element('rim');
  const film = element('finale');
  const caption = element('finale-title');
  const controls = element('finale-controls');
  const bar = element('progress');
  if (!stage || !portrait || !type || !details || !film || !caption || !controls || !bar || !light) return;

  const layers = { stage, portrait, type, details, light, film, caption, controls, bar };
  const preference = window.matchMedia(motionQuery);
  let disposed = false;
  let openingPlayed = false;
  let revert: (() => void) | undefined;

  async function install() {
    const [{ gsap }, { ScrollTrigger }] = await Promise.all([
      import('gsap'), import('gsap/ScrollTrigger'),
    ]);
    if (disposed) return;

    const { stage, portrait, type, details, light, film, caption, controls, bar } = layers;
    gsap.registerPlugin(ScrollTrigger);
    const queries = gsap.matchMedia(root);
    revert = () => queries.revert();

    queries.add(motionQuery, () => {
      root.dataset.cinematic = 'true';
      gsap.set(film, { autoAlpha: 0 });
      gsap.set(caption, { autoAlpha: 0, y: 28 });
      gsap.set(controls, { autoAlpha: 0 });
      let stageVisible = false;
      let mediaActive = false;
      let controlsActive = false;

      const timeline = gsap.timeline({ paused: true, defaults: { ease: 'none' } });
      timeline
        .to(bar, { scaleX: 1, duration: 1 }, 0)
        .to(type, { yPercent: -18, letterSpacing: '.01em', autoAlpha: 0, duration: 0.22, ease: 'power2.inOut' }, 0.06)
        .to(details, { y: -15, autoAlpha: 0, duration: 0.18, ease: 'power2.inOut' }, 0.08)
        .to(light, { '--hero-rim-opacity': 1.26, duration: 0.17, ease: 'sine.inOut' }, 0.11)
        .to(light, { '--hero-rim-opacity': 0.45, duration: 0.22, ease: 'sine.out' }, 0.28)
        .set(film, { autoAlpha: 1 }, 0.14)
        .to(portrait, { autoAlpha: 0, duration: 0.52, ease: 'sine.inOut' }, 0.14)
        .to(caption, { autoAlpha: 1, y: 0, duration: 0.26, ease: 'power3.out' }, 0.64)
        .to(controls, { autoAlpha: 1, duration: 0.16, ease: 'sine.out' }, 0.72);

      function sync() {
        const p = timeline.progress();
        root.dataset.scene = p < 0.14 ? 'portrait' : p < 0.66 ? 'dissolve' : 'film';
        const nextControls = stageVisible && p >= 0.76;
        const nextActive = stageVisible && p >= 0.34;
        if (nextActive !== mediaActive) {
          mediaActive = nextActive;
          root.dispatchEvent(new Event(mediaActive ? 'herofilmstart' : 'herofilmstop'));
        }
        if (nextControls !== controlsActive) {
          controlsActive = nextControls;
          controls.inert = !controlsActive;
          film.setAttribute('aria-hidden', String(!controlsActive));
        }
      }

      const stageObserver = new IntersectionObserver(([entry]) => {
        stageVisible = entry.intersectionRatio >= 0.55;
        sync();
      }, { threshold: 0.55 });
      stageObserver.observe(stage);

      timeline.eventCallback('onUpdate', sync);
      const trigger = ScrollTrigger.create({
        animation: timeline,
        trigger: root,
        start: 'top top',
        end: 'bottom bottom',
        scrub: 0.74,
        onUpdate: sync,
        onRefresh: sync,
      });
      sync();

      if (!openingPlayed && trigger.progress < 0.02 && stage.getBoundingClientRect().top < window.innerHeight) {
        openingPlayed = true;
        const letters = type.querySelectorAll<HTMLElement>('[data-hero-letter]');
        gsap.from(letters, {
          yPercent: 108, opacity: 0.4, duration: 0.82, stagger: 0.035, ease: 'power4.out',
        });
      }

      return () => {
        stageObserver.disconnect();
        if (mediaActive) root.dispatchEvent(new Event('herofilmstop'));
        controls.inert = true;
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
