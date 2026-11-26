<script lang="ts">
  import { onMount } from 'svelte'
  import { createCymbalLight, studioCymbal, type CymbalGeometry, type CymbalOrigin } from './hero-cymbal-light'

  interface Props {
    cymbal?: CymbalGeometry
  }

  let { cymbal = studioCymbal }: Props = $props()

  let canvas: HTMLCanvasElement
  let light: ReturnType<typeof createCymbalLight> | undefined

  onMount(() => {
    const stage = canvas.closest<HTMLElement>('[data-hero-stage]')
    if (!stage) return

    light = createCymbalLight(canvas, stage, cymbal)
    return () => {
      light?.destroy()
      light = undefined
    }
  })

  export function sweep(progress: number) { light?.sweep(progress) }
  export function strike() { light?.strike() }
  export function origin(): CymbalOrigin | undefined { return light?.origin() }
</script>

<div class="cymbal-light" aria-hidden="true">
  <canvas bind:this={canvas}></canvas>
</div>

<style>
  .cymbal-light {
    position: absolute;
    inset: 0;
    mix-blend-mode: screen;
    pointer-events: none;
  }

  canvas {
    display: block;
    inline-size: 100%;
    block-size: 100%;
  }
</style>
