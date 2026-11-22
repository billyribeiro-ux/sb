import type { Action } from 'svelte/action';

const motionQuery = '(prefers-reduced-motion: no-preference)';

export const cinematicMotion: Action<HTMLElement> = (root) => {
  const preference = window.matchMedia(motionQuery);
  let disposed = false;
  let revert: (() => void) | undefined;
  let playedIntro = false;

  async function mount() {
    const [{ gsap }, { ScrollTrigger }] = await Promise.all([
      import('gsap'),
      import('gsap/ScrollTrigger'),
    ]);
    if (disposed) return;

    gsap.registerPlugin(ScrollTrigger);
    const media = gsap.matchMedia(root);
    revert = () => media.revert();

    media.add(motionQuery, () => {
      const hero = root.querySelector<HTMLElement>('[data-motion-hero]:not([data-hero-sequence])');
      if (hero && hero.getBoundingClientRect().top < window.innerHeight &&
          !playedIntro && window.scrollY < 36) {
        playedIntro = true;
        const lines = hero.querySelectorAll<HTMLElement>('[data-motion-line]');
        const details = hero.querySelectorAll<HTMLElement>('[data-motion-intro]');
        const lens = hero.querySelector<HTMLElement>('[data-motion-lens]');
        const flash = hero.querySelector<HTMLElement>('[data-motion-flash]');
        const opening = gsap.timeline({ defaults: { ease: 'power4.out' } });

        if (lens) opening.from(lens, { scale: 1.13, duration: 1.45 }, 0);
        if (flash) opening.fromTo(flash, { opacity: 0.18 }, { opacity: 0, duration: 0.55 }, 0);
        if (lines.length) {
          opening.from(lines, {
            yPercent: 105, skewY: 7, opacity: 0.28, duration: 1.04,
            stagger: reducedStagger(lines.length),
          }, 0.12);
        }
        if (details.length) {
          opening.from(details, { y: 23, opacity: 0.15, duration: 0.72, stagger: 0.09 }, 0.4);
        }
      }

      for (const element of root.querySelectorAll<HTMLElement>('[data-motion-reveal]')) {
        if (element.getBoundingClientRect().top < window.innerHeight * 0.86) continue;
        gsap.from(element, {
          y: 42,
          opacity: 0.25,
          duration: 0.92,
          ease: 'power3.out',
          scrollTrigger: { trigger: element, start: 'top 88%', once: true },
        });
      }

      for (const frame of root.querySelectorAll<HTMLElement>('[data-motion-frame]')) {
        if (frame.getBoundingClientRect().top < window.innerHeight * 0.80) continue;
        gsap.fromTo(frame, { clipPath: 'inset(16% 0% 16% 0%)' }, {
          clipPath: 'inset(0% 0% 0% 0%)',
          ease: 'power2.out',
          duration: 1.05,
          scrollTrigger: { trigger: frame, start: 'top 90%', once: true },
        });
      }
    });

    media.add({ motion: motionQuery, wide: '(min-width: 850px)' }, (context) => {
      if (!context.conditions?.motion) return;
      const wide = Boolean(context.conditions.wide);
      for (const screen of root.querySelectorAll<HTMLElement>('[data-motion-film-screen]')) {
        const video = screen.querySelector('video');
        const film = gsap.timeline({
          defaults: { ease: 'none' },
          scrollTrigger: {
            trigger: screen,
            start: 'top 92%',
            end: wide ? 'top 35%' : 'top 54%',
            scrub: 0.4,
          },
        });

        film.fromTo(screen, {
          clipPath: wide ? 'inset(27% 12% 27% 12%)' : 'inset(13% 6% 13% 6%)',
        }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1 }, 0);
        if (video) film.fromTo(video, { scale: 1.105 }, { scale: 1, duration: 1 }, 0);
      }

      if (wide) {
        for (const layer of root.querySelectorAll<HTMLElement>('[data-motion-parallax]')) {
          const frame = layer.parentElement;
          if (!frame) continue;
          gsap.fromTo(layer, { scale: 1.035 }, {
            scale: 1.13,
            ease: 'none',
            scrollTrigger: { trigger: frame, start: 'top bottom', end: 'bottom top', scrub: 0.8 },
          });
        }

        for (const words of root.querySelectorAll<HTMLElement>('[data-motion-type-track]')) {
          const frame = words.parentElement;
          if (!frame) continue;
          gsap.fromTo(words, { xPercent: 6 }, {
            xPercent: -19, ease: 'none',
            scrollTrigger: { trigger: frame, start: 'top bottom', end: 'bottom top', scrub: 0.6 },
          });
        }
      }

    });

    void document.fonts?.ready.then(() => {
      if (!disposed) ScrollTrigger.refresh();
    });
  }

  function startWhenMotionIsAllowed() {
    if (!preference.matches) return;
    preference.removeEventListener('change', startWhenMotionIsAllowed);
    void mount().catch(() => revert?.());
  }

  preference.addEventListener('change', startWhenMotionIsAllowed);
  startWhenMotionIsAllowed();

  return {
    destroy() {
      preference.removeEventListener('change', startWhenMotionIsAllowed);
      disposed = true;
      revert?.();
    },
  };
};

function reducedStagger(count: number) {
  return count > 2 ? 0.035 : 0.13;
}
