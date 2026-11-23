<script lang="ts">
  import { afterNavigate } from '$app/navigation';
  import { onDestroy } from 'svelte';

  const duration = 1120;
  let running = $state(false);
  let entered = false;
  let timer: number | undefined;

  afterNavigate(({ type, to }) => {
    if (entered) return;
    entered = true;

    const hash = to?.url.hash;
    if (type !== 'enter' || document.hidden || window.scrollY > 4 ||
        (hash && hash !== '#top') || matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    running = true;
    timer = window.setTimeout(() => { running = false; }, duration);
  });

  onDestroy(() => {
    if (timer !== undefined) window.clearTimeout(timer);
  });
</script>

<p
  class="opening"
  data-artist-opening
  data-opening-motion={running ? 'active' : undefined}
  style:--opening-duration={duration + 'ms'}
>
  <span class="light" aria-hidden="true"></span>
  <span class="title">The Notes Between</span>
  <span class="line" aria-hidden="true"></span>
</p>

<style>
  .opening {
    position: relative;
    display: flex;
    align-items: center;
    gap: .65rem;
    isolation: isolate;
    width: fit-content;
    max-width: 100%;
    overflow: clip;
    margin: 0 0 .65rem;
    padding-block: .19rem;
    color: #f8d6b0;
    font: 670 clamp(.72rem, 1vw, .88rem)/1.3 var(--body, system-ui);
    letter-spacing: .18em;
    text-transform: uppercase;
    text-shadow: 0 1px 12px #000, 0 1px 4px #000;
    pointer-events: none;
  }

  .light {
    position: absolute;
    z-index: -1;
    inset: -80% -20%;
    opacity: 0;
    background: linear-gradient(105deg, transparent 30%, #ffffff32 50%, transparent 68%);
    mask-image: linear-gradient(90deg, transparent 5%, #000 41%, transparent 87%);
  }

  .line {
    width: clamp(1.7rem, 4vw, 3.8rem);
    flex-shrink: 1;
    height: 1px;
    background: linear-gradient(90deg, #edb987, #edb98738);
    transform-origin: left center;
  }

  @media (prefers-reduced-motion: no-preference) {
    .opening[data-opening-motion='active'] .light {
      animation: light-pass var(--opening-duration) cubic-bezier(.2, .65, .34, 1) both;
    }

    .opening[data-opening-motion='active'] .title {
      animation: settle-title 650ms cubic-bezier(.18, .74, .28, 1) both;
    }

    .opening[data-opening-motion='active'] .line {
      animation: settle-line 710ms cubic-bezier(.18, .74, .28, 1) both;
    }
  }

  @keyframes light-pass {
    0% { opacity: 0; transform: translateX(-60%) skewX(-14deg); }
    28% { opacity: .85; }
    75% { opacity: .38; }
    100% { opacity: 0; transform: translateX(72%) skewX(-14deg); }
  }

  @keyframes settle-title {
    from { opacity: .72; transform: translateY(.23em); }
    to { opacity: 1; transform: translateY(0); }
  }

  @keyframes settle-line {
    from { opacity: .5; transform: scaleX(.28); }
    to { opacity: 1; transform: scaleX(1); }
  }
</style>
