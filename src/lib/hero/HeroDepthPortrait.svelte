<script lang="ts">
  import { onMount } from 'svelte';
  import { createDepthPortrait } from './hero-depth-portrait';

  let canvas: HTMLCanvasElement;
  let renderer: ReturnType<typeof createDepthPortrait> | undefined;
  let progress = 0;

  onMount(() => {
    const plate = canvas.closest<HTMLElement>('[data-hero-backdrop]');
    const stage = canvas.closest<HTMLElement>('[data-hero-stage]');
    const image = plate?.querySelector('img');
    if (!plate || !stage || !image) return;
    renderer = createDepthPortrait(canvas, image, stage, plate);
    renderer.seek(progress);
    return () => renderer?.destroy();
  });

  export function seek(value: number) {
    progress = value;
    renderer?.seek(value);
  }
</script>

<canvas bind:this={canvas} class="hero-depth-canvas" aria-hidden="true"></canvas>
