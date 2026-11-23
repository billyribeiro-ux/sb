<script lang="ts">
  import { artist } from '#lib/site';
  import SpeakerHighIcon from 'phosphor-svelte/lib/SpeakerHighIcon';

  interface Props {
    open: boolean;
    soundPlaying: boolean;
    onenter: (sound: boolean) => void;
  }

  let { open, soundPlaying, onenter }: Props = $props();
  let dialog = $state<HTMLDialogElement>();
  const titleId = $props.id();

  $effect(() => {
    if (open && dialog && !dialog.open) dialog.showModal();
    else if (!open && dialog?.open) dialog.close();
  });

  function skip(event: Event) {
    event.preventDefault();
    onenter(false);
  }
</script>

<dialog bind:this={dialog} aria-labelledby={titleId} oncancel={skip} data-artist-loader data-lenis-prevent>
  <div class="optics" aria-hidden="true">
    <div class="aperture aperture-left"></div><div class="aperture aperture-right"></div>
    <div class="spotlight"></div><div class="flare"></div><div class="grain"></div>
  </div>
  <div class="frame" aria-hidden="true"><span>SB / 001</span><span>A performance film</span><span>Boston · MA</span></div>

  <div class="title-card">
    <p class="presents">The notes between</p>
    <div class="monogram" aria-hidden="true">
      <span class="initial"><span>S</span></span><span class="stroke"></span><span class="initial"><span>B</span></span>
    </div>
    <div class="title-rule" aria-hidden="true"><span></span></div>
    <h2 id={titleId}>{artist.name}</h2>
    <p class="signature">{artist.tagline}</p>
    <p class="movements">A performance in seven movements</p>
  </div>

  <div class="actions">
    <p class="headphones">Headphones recommended</p>
    <div class="entry-buttons">
      <button type="button" class="with-sound" onclick={() => onenter(true)}>
        <SpeakerHighIcon size={18} aria-hidden="true" />
        {soundPlaying ? 'Continue with sound' : 'Enter with sound'}
      </button>
      <button type="button" class="skip-intro" onclick={() => onenter(false)}>Skip intro</button>
    </div>
  </div>
</dialog>

<style>
  dialog {
    --gold: #e6bd84; --ivory: #fff3df; --ease: cubic-bezier(.16, 1, .3, 1);
    position: fixed; inset: 0; inline-size: 100%; block-size: 100dvh; max-inline-size: none; max-block-size: none;
    padding: max(1.25rem, env(safe-area-inset-top)) var(--gutter, 1.25rem) max(1.5rem, env(safe-area-inset-bottom));
    margin: 0; border: 0; overflow: hidden auto; overscroll-behavior: contain;
    background: #030304; color: var(--ivory); isolation: isolate;
  }
  dialog:modal { display: grid; grid-template-rows: minmax(min-content, 1fr) auto; justify-items: center; gap: 1.5rem; }
  dialog::backdrop { background: #030304; }
  .optics, .spotlight, .flare, .grain, .aperture { position: absolute; pointer-events: none; }
  .optics { inset: 0; z-index: -1; overflow: hidden; }
  .aperture { inset-block: 0; width: 54%; background: #000; z-index: 4; }
  .aperture-left { left: 0; transform-origin: left; }
  .aperture-right { right: 0; transform-origin: right; }
  .spotlight { inset: -30%; background: radial-gradient(ellipse at 50% 46%, #b58a5b2e, #4c3b2b16 27%, transparent 60%); }
  .flare { left: 50%; top: 48%; width: 130%; height: 1px; transform: translate(-50%, -50%) scaleX(0); background: linear-gradient(90deg, transparent, #b4d7ff8c 25%, #fff 50%, #e6bd8499 75%, transparent); box-shadow: 0 0 18px #c5dcff8c, 0 0 80px #8ebcff40; }
  .grain { inset: -40%; opacity: .07; background-image: repeating-radial-gradient(circle at 30% 40%, #fff 0 1px, transparent 1px 4px); background-size: 9px 11px; animation: loader-grain .3s steps(3) infinite; }
  .frame { position: absolute; inset: 1.25rem var(--gutter, 1.25rem) auto; display: flex; justify-content: space-between; gap: 1rem; color: #c8b49a; font: 560 .63rem/1.4 var(--body); letter-spacing: .2em; text-transform: uppercase; }
  .title-card { position: relative; align-self: center; display: grid; justify-items: center; width: 100%; text-align: center; perspective: 1000px; }
  .presents { margin-bottom: clamp(1.5rem, 4svh, 3rem); color: var(--gold); font: 620 clamp(.65rem, 1.1vw, .82rem)/1.4 var(--body); letter-spacing: .55em; text-transform: uppercase; }
  .monogram { display: flex; align-items: center; justify-content: center; color: var(--ivory); font: 400 clamp(8rem, min(36vw, 44svh), 25rem)/.72 var(--display); text-shadow: 0 0 70px #f4d1a41f; transform-origin: 50% 55%; }
  .initial { display: block; padding: .08em .025em .12em; overflow: clip; }
  .initial span { display: block; }
  .stroke { width: .018em; height: .7em; margin-inline: .08em; rotate: 24deg; background: linear-gradient(transparent, var(--gold) 20% 80%, transparent); box-shadow: 0 0 24px #e6bd8459; }
  .title-rule { width: min(38rem, 72vw); height: 1px; margin-top: 1.4rem; overflow: hidden; background: #e6bd8426; }
  .title-rule span { display: block; width: 100%; height: 100%; background: linear-gradient(90deg, transparent, var(--gold), transparent); }
  h2 { margin-top: 1.1rem; font: 560 clamp(.72rem, 1.3vw, 1rem)/1.4 var(--body); letter-spacing: .42em; text-transform: uppercase; }
  .signature { margin-top: .45rem; color: var(--gold); font: 500 clamp(.8rem, 1.5vw, 1rem)/1.4 var(--body); letter-spacing: .35em; text-transform: uppercase; }
  .movements { margin-top: 1.25rem; color: #b9ad9e; font: 450 .72rem/1.5 var(--body); letter-spacing: .16em; text-transform: uppercase; }

  .actions { display: grid; justify-items: center; gap: .85rem; }
  .headphones { color: #a89c8e; font: 500 .66rem/1.4 var(--body); letter-spacing: .2em; text-transform: uppercase; }
  .entry-buttons { display: flex; justify-content: center; flex-wrap: wrap; gap: .55rem .9rem; }
  button { display: inline-flex; align-items: center; justify-content: center; gap: .6rem; min-block-size: 3rem; padding: .7rem 1.25rem; font: 620 .8rem/1.2 var(--body); letter-spacing: .04em; cursor: pointer; }
  .with-sound { background: var(--gold); color: #170f08; border: 1px solid var(--gold); }
  .with-sound:hover { background: #ffe0b2; border-color: #ffe0b2; }
  .skip-intro { border: 1px solid #e6bd8438; background: #05050580; color: #e9ddcc; }
  .skip-intro:hover { border-color: var(--gold); }
  button:focus-visible { outline: 2px solid #fff1d8; outline-offset: 4px; }

  dialog:modal .aperture-left { animation: aperture-left 1.65s .15s var(--ease) both; }
  dialog:modal .aperture-right { animation: aperture-right 1.65s .15s var(--ease) both; }
  dialog:modal .spotlight { animation: loader-breathe 3.2s ease-out both; }
  dialog:modal .flare { animation: loader-flare 2.1s .35s var(--ease) both; }
  dialog:modal .frame { animation: loader-fade-down 1s .9s var(--ease) both; }
  dialog:modal .presents { animation: loader-tracking 1.4s .55s var(--ease) both; }
  dialog:modal .monogram { animation: loader-monogram 2s .25s var(--ease) both; }
  dialog:modal .initial span { animation: loader-initial 1.25s .5s var(--ease) both; }
  dialog:modal .initial:last-child span { animation-delay: .62s; }
  dialog:modal .stroke { animation: loader-stroke 1.1s .8s var(--ease) both; }
  dialog:modal .title-rule span { animation: loader-rule 1.3s 1.05s var(--ease) both; }
  dialog:modal h2 { animation: loader-tracking 1.2s 1.15s var(--ease) both; }
  dialog:modal .signature, dialog:modal .movements { animation: loader-fade-up 1s 1.45s var(--ease) both; }
  dialog:modal .actions { animation: loader-fade-up 1s 1.65s var(--ease) both; }

  @keyframes aperture-left { to { transform: translateX(-96%); } }
  @keyframes aperture-right { to { transform: translateX(96%); } }
  @keyframes loader-breathe { from { opacity: 0; transform: scale(.7); } 45% { opacity: 1; } to { opacity: .75; transform: scale(1.15); } }
  @keyframes loader-flare { 0% { opacity: 0; transform: translate(-50%, -50%) scaleX(0); } 38% { opacity: 1; transform: translate(-50%, -50%) scaleX(1); } 100% { opacity: .18; transform: translate(-50%, -50%) scaleX(.72); } }
  @keyframes loader-monogram { from { opacity: 0; transform: scale(2.1) translateZ(-200px); filter: blur(18px); } 45% { opacity: 1; } to { opacity: 1; transform: scale(1); filter: blur(0); } }
  @keyframes loader-initial { from { transform: translateY(115%) rotateX(-65deg); } to { transform: translateY(0) rotateX(0); } }
  @keyframes loader-stroke { from { opacity: 0; scale: 1 0; } to { opacity: 1; scale: 1 1; } }
  @keyframes loader-rule { from { transform: scaleX(0); } to { transform: scaleX(1); } }
  @keyframes loader-tracking { from { opacity: 0; letter-spacing: .85em; filter: blur(5px); } to { opacity: 1; filter: blur(0); } }
  @keyframes loader-fade-up { from { opacity: 0; transform: translateY(22px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes loader-fade-down { from { opacity: 0; transform: translateY(-15px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes loader-grain { to { transform: translate(3%, -2%); } }
  @media (max-width: 600px) { .frame span:nth-child(2) { display: none; } .presents { letter-spacing: .35em; } .monogram { font-size: clamp(7rem, 48vw, 13rem); } .movements { font-size: .62rem; } }
  @media (max-height: 650px) { .presents { margin-bottom: .75rem; } .monogram { font-size: 38svh; } .title-rule { margin-top: .5rem; } .movements { display: none; } }
  @media (prefers-reduced-motion: reduce) {
    dialog:modal :is(.aperture, .spotlight, .flare, .frame, .presents, .monogram, .initial span, .stroke, .title-rule span, h2, .signature, .movements, .actions, .grain) { animation: none; }
    .aperture { display: none; } .flare { opacity: .2; transform: translate(-50%, -50%) scaleX(.7); }
  }
</style>
