<script lang="ts">
  import { onMount } from 'svelte'
  import { startAtmosphere } from './atmosphere'

  let { class: additionalClass = '' }: { class?: string } = $props()
  let canvas: HTMLCanvasElement

  onMount(() => startAtmosphere(canvas))
</script>

<canvas bind:this={canvas} class={`atmosphere ${additionalClass}`} aria-hidden="true"></canvas>

<style>
  .atmosphere {
    position: absolute;
    inset: 0;
    display: block;
    inline-size: 100%;
    block-size: 100%;
    pointer-events: none;
    visibility: hidden;
    mix-blend-mode: screen;
  }
</style>
