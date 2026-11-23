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
  <div class="title-card">
    <div class="monogram" aria-hidden="true">
      <span class="initial"><span>S</span></span>
      <span class="stroke"></span>
      <span class="initial"><span>B</span></span>
    </div>
    <h2 id={titleId}>{artist.name}</h2>
    <p class="signature">{artist.tagline}</p>
  </div>

  <div class="actions">
    <button type="button" class="with-sound" onclick={() => onenter(true)}>
      <SpeakerHighIcon size={18} aria-hidden="true" />
      {soundPlaying ? 'Continue with sound' : 'Enter with sound'}
    </button>
    <button type="button" class="skip-intro" onclick={() => onenter(false)}>Skip intro</button>
  </div>
</dialog>

<style>
  dialog {
    --loader-accent: #dfb67b;
    --loader-ease: cubic-bezier(.22, 1, .36, 1);
    position: fixed;
    inset: 0;
    inline-size: 100%;
    block-size: 100%;
    max-inline-size: none;
    max-block-size: none;
    padding: max(1.25rem, env(safe-area-inset-top)) 1rem max(clamp(2rem, 9svh, 6rem), env(safe-area-inset-bottom));
    margin: 0;
    border: 0;
    overflow: auto;
    overscroll-behavior: contain;
    background:
      radial-gradient(ellipse at 50% 41%, rgb(127 115 97 / 13%), transparent 56%),
      #0c0c0d;
    color: #f5eddf;
    opacity: 0;
    transition:
      opacity 380ms ease,
      display 380ms allow-discrete,
      overlay 380ms allow-discrete;
  }

  dialog:modal {
    display: grid;
    grid-template-rows: minmax(min-content, 1fr) auto;
    justify-items: center;
    gap: 1.75rem;
    opacity: 1;
    transition-duration: 180ms;
  }

  @starting-style {
    dialog:modal { opacity: 0; }
  }

  dialog::backdrop { background: transparent; }

  .title-card {
    align-self: center;
    display: grid;
    justify-items: center;
    gap: 0.9rem;
    margin-block: 0.5rem;
    text-align: center;
  }

  .monogram {
    display: flex;
    align-items: center;
    gap: 0.055em;
    color: var(--loader-accent);
    font: 400 clamp(4rem, min(31vw, 31svh), 13rem)/0.81 var(--display, sans-serif);
  }

  .initial {
    display: block;
    padding: 0.055em 0.04em;
    overflow: clip;
  }

  .initial span { display: block; }

  .stroke {
    flex: none;
    inline-size: 0.013em;
    block-size: 0.67em;
    rotate: 24deg;
    background: linear-gradient(transparent, currentColor 19% 81%, transparent);
  }

  h2 {
    font: 600 clamp(0.75rem, 2.4vw, 0.88rem)/1.4 var(--body, sans-serif);
    letter-spacing: 0.26em;
    text-transform: uppercase;
  }

  .signature {
    color: var(--loader-accent);
    font: 620 clamp(.8rem, 1.8vw, 1.05rem)/1.25 var(--body);
    letter-spacing: .2em;
  }

  dialog:modal .initial span { animation: loader-rise 880ms var(--loader-ease) 70ms both; }
  dialog:modal .initial:last-child span { animation-delay: 170ms; }
  dialog:modal .stroke { animation: loader-stroke 760ms var(--loader-ease) 110ms both; }
  dialog:modal h2 { animation: loader-title 640ms var(--loader-ease) 360ms both; }
  dialog:modal .signature { animation: loader-title 470ms var(--loader-ease) 490ms both; }

  @keyframes loader-rise {
    from { opacity: 0.15; transform: translateY(108%); }
    to { opacity: 1; transform: translateY(0); }
  }

  @keyframes loader-stroke {
    from { scale: 1 0; opacity: 0; }
    to { scale: 1; opacity: 1; }
  }

  @keyframes loader-title {
    from { opacity: 0; transform: translateY(0.45rem); }
    to { opacity: 1; transform: translateY(0); }
  }

  .actions {
    display: flex;
    justify-content: center;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.45rem 0.8rem;
  }

  button {
    display: inline-flex;
    align-items: center;
    gap: 0.55rem;
    min-block-size: 2.75rem;
    padding: 0.55rem 0.95rem;
    font: 630 0.875rem/1.25 var(--body, sans-serif);
    cursor: pointer;
  }

  .with-sound {
    background: var(--loader-accent);
    color: #1a130b;
    border: 1px solid var(--loader-accent);
  }

  .with-sound:hover { background: #efd0a3; }

  .skip-intro {
    border: 1px solid transparent;
    background: transparent;
    color: #e9ddcc;
  }

  .skip-intro:hover {
    text-decoration: underline;
    text-underline-offset: 0.25em;
  }

  button:focus-visible {
    outline: 2px solid #f6dfb9;
    outline-offset: 4px;
  }

  @media (prefers-reduced-motion: reduce) {
    dialog { transition: none; }
    dialog:modal :is(.initial span, .stroke, h2, .signature) { animation: none; }
  }
</style>
