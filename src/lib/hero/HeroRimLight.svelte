<script lang="ts">
  import { onMount } from 'svelte'
  import { createHeroRimLight } from './hero-rim-light'

  let { centerX = 0.69, centerY = 0.85 }: {
    centerX?: number
    centerY?: number
  } = $props()

  let surface: HTMLDivElement
  let canvas: HTMLCanvasElement
  let renderer: ReturnType<typeof createHeroRimLight> | undefined
  let stageCrop = $state(false)
  let sweepProgress = 0
  let rendered = $state(false)
  let pulses = $state(0)

  onMount(() => {
    const target = canvas.closest<HTMLElement>('[data-hero-stage]') ?? canvas.parentElement?.parentElement
    if (!target) return

    const crop = matchMedia('(max-width: 850px), (max-aspect-ratio: 5/4)')
    const updateCrop = () => { stageCrop = crop.matches }
    updateCrop()
    crop.addEventListener('change', updateCrop)
    renderer = createHeroRimLight(canvas, target, (ready) => { rendered = ready })
    renderer.sweep(sweepProgress)
    return () => {
      crop.removeEventListener('change', updateCrop)
      renderer?.destroy()
    }
  })

  const x = $derived(stageCrop ? 0.48 : centerX)
  const y = $derived(stageCrop ? 0.76 : centerY)

  $effect(() => {
    const positionX = x
    const positionY = y
    renderer?.position(positionX, positionY)
  })

  export function sweep(progress: number) {
    if (progress === sweepProgress) return

    sweepProgress = progress
    renderer?.sweep(progress)
    if (!rendered) {
      surface?.style.setProperty('--sweep-x', `${(progress - 0.5) * 70}%`)
      surface?.style.setProperty('--sweep-gain', String(Math.sin(progress * Math.PI) * 0.62))
    }
  }

  export function strike() {
    if (rendered) renderer?.strike()
    else pulses += 1
  }
</script>

<div
  bind:this={surface}
  class="rim-light"
  class:rendered
  aria-hidden="true"
  style:--rim-x={`${x * 100}%`}
  style:--rim-y={`${y * 100}%`}
>
  <div class="fallback">
    {#if pulses}
      {#key pulses}<span class="fallback-strike"></span>{/key}
    {/if}
  </div>
  <canvas bind:this={canvas}></canvas>
</div>

<style>
  .rim-light {
    position: absolute;
    inset: 0;
    overflow: clip;
    pointer-events: none;
    opacity: var(--hero-rim-opacity, 1);
    mix-blend-mode: screen;
    --glow-x: var(--hero-rim-x, var(--rim-x));
    --glow-y: var(--hero-rim-y, var(--rim-y));
  }

  canvas {
    position: absolute;
    inset: auto 0 0;
    inline-size: 100%;
    block-size: 40%;
    visibility: hidden;
  }

  .fallback {
    position: absolute;
    inset: 0;
    clip-path: inset(62% 0 0);
    background:
      radial-gradient(ellipse 29% 10% at var(--glow-x) var(--glow-y), #ffffff3e, #ffffff22 39%, transparent 84%),
      radial-gradient(ellipse 34% 18% at var(--glow-x) calc(var(--glow-y) + 8%), transparent 59%, #ffffff16 65%, transparent 73%);
    mask-image: linear-gradient(transparent 63%, #000 78%, #000 89%, transparent);
  }

  .fallback::before {
    content: '';
    position: absolute;
    inset: 0;
    background: radial-gradient(ellipse 12% 8% at var(--glow-x) var(--glow-y), #ffffff96, #ffffff21 57%, transparent);
    opacity: var(--sweep-gain, 0);
    transform: translateX(var(--sweep-x, 0%));
  }

  .rendered .fallback { visibility: hidden; }
  .rendered canvas { visibility: visible; }

  .fallback-strike {
    position: absolute;
    inset-inline-start: var(--glow-x);
    inset-block-start: var(--glow-y);
    inline-size: 64%;
    block-size: 37%;
    border: 1px solid #fff;
    border-radius: 50%;
    box-shadow: 0 0 1.1rem #ffffff70, inset 0 0 1.1rem #ffffff50;
    animation: resonance .85s cubic-bezier(.12,.65,.4,1) both;
  }

  @keyframes resonance {
    from { transform: translate(-50%, -50%) scale(.08); opacity: .85; }
    to { transform: translate(-50%, -50%) scale(1); opacity: 0; }
  }

  @media (prefers-reduced-motion: reduce) {
    .fallback-strike { display: none; }
  }
</style>
