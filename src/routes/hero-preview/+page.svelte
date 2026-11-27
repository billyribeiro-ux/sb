<script lang="ts">
  import { page } from '$app/state';
  import ArtistHero from '#lib/hero/ArtistHero.svelte';
  import { performanceOpeningEdit } from '#lib/hero/hero-chapters';
  import HeroCaptionStudy from './HeroCaptionStudy.svelte';

  const captionStudy = $derived(page.url.searchParams.get('study') === 'type');

</script>

<svelte:head>
  <title>{captionStudy ? 'Chapter transitions' : 'Hero preview'} | Sergio Bellotti</title>
  <meta name="robots" content="noindex" />
</svelte:head>

{#if captionStudy}
  <HeroCaptionStudy />
{:else}
  <ArtistHero openingEdit={performanceOpeningEdit} lowerTitle revealOnLoad showFlowCutaway={false} comparisonHref="/#hear-the-difference" filmHref="/#performance-film" />

  <div class="preview-exit">
    <a href="#top">Back to opening</a>
  </div>
{/if}

<style>
  .preview-exit {
    display: grid;
    min-block-size: 100svh;
    place-items: center;
    background: #0c0c0c;
    color: #fbecd8;
  }

  .preview-exit a {
    display: inline-flex;
    align-items: center;
    min-block-size: 2.75rem;
    text-underline-offset: .25em;
  }
</style>
