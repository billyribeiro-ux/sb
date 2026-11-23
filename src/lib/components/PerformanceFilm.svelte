<script lang="ts">
  import { onMount } from 'svelte';
  import PlayIcon from 'phosphor-svelte/lib/PlayIcon';
  import PauseIcon from 'phosphor-svelte/lib/PauseIcon';
  import SpeakerHighIcon from 'phosphor-svelte/lib/SpeakerHighIcon';
  import SpeakerSlashIcon from 'phosphor-svelte/lib/SpeakerSlashIcon';

  let { src, src4k, poster, label, active = true, autoplay = true, loop = true }: {
    src: string;
    src4k?: string;
    poster: string;
    label: string;
    active?: boolean;
    autoplay?: boolean;
    loop?: boolean;
  } = $props();
  let video: HTMLVideoElement;
  let paused = $state(true);
  let muted = $state(true);
  let quality = $state<'hd' | '4k'>('hd');
  const mediaSource = $derived(quality === '4k' ? src4k ?? src : src);
  let switchPlayback: { time: number; wasPlaying: boolean } | undefined;
  let prohibitedAutoplay = false;
  let manualPlay = false;
  let playingArea = false;
  let update = () => {};

  onMount(() => {
    const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
    const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
    const { width, height } = video.getBoundingClientRect();
    const density = window.devicePixelRatio || 1;
    const needsUhd = width * density > 1280 || height * density > 720;
    if (src4k && !connection?.saveData && !reducedMotion.matches &&
        (needsUhd || matchMedia('(min-width: 1024px)').matches)) quality = '4k';
    const observer = new IntersectionObserver(([entry]) => {
      playingArea = entry.isIntersecting && entry.intersectionRatio >= 0.4;
      update();
    }, { threshold: 0.4 });

    update = () => {
      if (!active || document.hidden || !playingArea || prohibitedAutoplay || (!autoplay && !manualPlay) ||
        (reducedMotion.matches && !manualPlay)) {
        video.pause();
      } else if (video.paused) {
        void video.play().catch(() => {});
      }
    };
    observer.observe(video);
    function pauseForOtherAudio(event: Event) {
      if ((event as CustomEvent<Element>).detail === video || video.paused) return;
      prohibitedAutoplay = true;
      manualPlay = false;
      video.pause();
    }
    document.addEventListener('visibilitychange', update);
    document.addEventListener('sergio:audio-focus', pauseForOtherAudio);
    reducedMotion.addEventListener('change', update);
    return () => {
      observer.disconnect();
      document.removeEventListener('visibilitychange', update);
      document.removeEventListener('sergio:audio-focus', pauseForOtherAudio);
      reducedMotion.removeEventListener('change', update);
      video.pause();
    };
  });

  $effect(() => {
    if (active) update();
    else video?.pause();
  });

  function claimPlayback() {
    document.dispatchEvent(new CustomEvent('sergio:audio-focus', { detail: video }));
  }

  function toggleQuality() {
    switchPlayback = { time: video.currentTime, wasPlaying: !video.paused };
    quality = quality === '4k' ? 'hd' : '4k';
    video.preload = 'metadata';
    video.pause();
  }

  function restorePlayback() {
    if (!switchPlayback) return;
    const { time, wasPlaying } = switchPlayback;
    switchPlayback = undefined;
    video.currentTime = Math.min(time, Math.max(0, video.duration - .1));
    if (wasPlaying && active) void video.play().catch(() => {});
  }

  function toggleSound() {
    muted = !muted;
    video.muted = muted;
    if (!muted) claimPlayback();
    if (!muted && video.paused) {
      manualPlay = true;
      prohibitedAutoplay = false;
      void video.play().catch(() => {});
    }
  }

  function togglePlay() {
    if (video.paused) {
      prohibitedAutoplay = false;
      manualPlay = true;
      void video.play().catch(() => {});
    } else {
      prohibitedAutoplay = true;
      manualPlay = false;
      video.pause();
    }
  }
</script>

<div class="film-player">
  <video
    bind:this={video}
    src={mediaSource}
    {poster}
    aria-label={label}
    {muted}
    playsinline
    {loop}
    preload="none"
    onloadedmetadata={restorePlayback}
    oncanplay={() => update()}
    onplay={() => { paused = false; claimPlayback(); }}
    onended={() => { prohibitedAutoplay = true; manualPlay = false; }}
    onpause={() => { paused = true; }}
  ></video>
  <div class="film-controls" inert={!active}>
    {#if src4k}
      <button type="button" class="quality" onclick={toggleQuality}
        aria-label={quality === '4k' ? 'Switch to HD playback' : 'Switch to 4K upscale'}
        title={quality === '4k' ? '4K upscale from the studio master' : 'HD playback'}
      >{quality === '4k' ? '4K' : 'HD'}</button>
    {/if}
    <button type="button" onclick={toggleSound} aria-label={muted ? 'Unmute film' : 'Mute film'}>
      {#if muted}<SpeakerSlashIcon size={18} />{:else}<SpeakerHighIcon size={18} />{/if}
      <span>{muted ? 'Sound off' : 'Sound on'}</span>
    </button>
    <button type="button" onclick={togglePlay} aria-label={paused ? 'Play film' : 'Pause film'}>
      {#if paused}<PlayIcon weight="fill" size={15} />{:else}<PauseIcon weight="fill" size={15} />{/if}
      <span>{paused ? 'Play' : 'Pause'}</span>
    </button>
  </div>
  <noscript><a href={src}>Open performance video</a></noscript>
</div>

<style>
  .film-player { position: relative; background: #15100d; aspect-ratio: 16 / 9; overflow: clip; }
  video { display: block; width: 100%; height: 100%; object-fit: cover; }
  .film-controls, noscript a { position: absolute; inset: auto 1rem 1rem auto; }
  .film-controls { display: flex; gap: .4rem; }
  button, a {
    display: inline-flex;
    align-items: center; justify-content: center; gap: .55rem; min-height: 2.75rem;
    padding: .48rem .85rem; border: 1px solid #e7be8a8c; background: #120e0be8;
    color: #f8edde; font-size: .825rem; cursor: pointer;
  }
  button:hover, a:hover { background: #3a2718; }
  .quality { font-weight: 720; min-width: 2.75rem; }
  @media (max-width: 600px) {
    .film-controls, noscript a { inset: auto .5rem .5rem auto; }
  }
</style>
