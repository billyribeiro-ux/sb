<script lang="ts">
  import '@fontsource-variable/geist';
  import '../app.css';
  import { afterNavigate, onNavigate } from '$app/navigation';
  import { page } from '$app/state';
  import { artist, pages } from '#lib/site';
  import ListIcon from 'phosphor-svelte/lib/ListIcon';
  import XIcon from 'phosphor-svelte/lib/XIcon';
  import InstagramLogoIcon from 'phosphor-svelte/lib/InstagramLogoIcon';
  import YoutubeLogoIcon from 'phosphor-svelte/lib/YoutubeLogoIcon';
  import type { LayoutProps } from './$types';

  let { children }: LayoutProps = $props();
  let expanded = $state(false);
  let menuToggle: HTMLButtonElement;
  const path = $derived(page.url.pathname.replace(/\/$/, '') || '/');
  const home = $derived(path === '/');
  const light = $derived(['/about', '/education', '/workshops'].includes(path));

  afterNavigate(() => { expanded = false; });

  onNavigate((navigation) => {
    if (!document.startViewTransition || !navigation.to ||
        navigation.from?.url.pathname === navigation.to.url.pathname ||
        window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    return new Promise<void>((resume) => {
      const transition = document.startViewTransition(async () => {
        resume();
        await navigation.complete;
      });
      void transition.updateCallbackDone.catch(() => resume());
    });
  });

  function onMenuKey(event: KeyboardEvent) {
    if (event.key === 'Escape' && expanded) {
      expanded = false;
      menuToggle?.focus();
    }
  }
</script>

<svelte:window onkeydown={onMenuKey} />
<a class="skip" href="#main-content">Skip to content</a>
<div id="top"></div>
<header class="masthead" class:overlay={home} class:light class:expanded>
  <div class="masthead-inner shell">
    <a class="wordmark" href="/" aria-label="Sergio Bellotti home">
      <span class="brand-sticks" aria-hidden="true"></span>
      <span>SB<span class="wordmark-dot">.</span></span>
    </a>

    <nav id="primary-nav" aria-label="Primary" class:expanded>
      {#each pages as item (item.href)}
        <a class="nav-link" href={item.href} aria-current={path === item.href.slice(0,-1) ? 'page' : undefined}>{item.label}</a>
      {/each}
      <a class="nav-contact" href="/contact/" aria-current={path === '/contact' ? 'page' : undefined}>Get in touch</a>
    </nav>
    <button
      type="button"
      class="menu-toggle"
      aria-label={expanded ? 'Close menu' : 'Open menu'}
      aria-controls="primary-nav"
      aria-expanded={expanded}
      bind:this={menuToggle}
      onclick={() => { expanded = !expanded; }}
    >
      {#if expanded}<XIcon size={28} />{:else}<ListIcon size={28} />{/if}
    </button>
  </div>
</header>

<main id="main-content">
  {@render children()}
</main>

<footer class="site-footer">
  <div class="shell footer-content">
    <div class="footer-lead">
      <span class="eyebrow">Booking &amp; collaborations</span>
      <h2>{artist.tagline}</h2>
      <a class="footer-email" href={`mailto:${artist.email}`}>{artist.email}</a>
    </div>
    <nav class="footer-links" aria-label="Footer">
      {#each pages as item (item.href)}
        <a href={item.href}>{item.label}</a>
      {/each}
      <a href="/contact/">Contact</a>
    </nav>
    <div class="footer-social" aria-label="Social media">
      <a href={artist.instagram} aria-label="Sergio Bellotti on Instagram"><InstagramLogoIcon size={23} /></a>
      <a href={artist.youtube} aria-label="Sergio Bellotti on YouTube"><YoutubeLogoIcon size={23} /></a>
    </div>
    <div class="footer-base">
      <span>© {new Date().getFullYear()} Sergio Bellotti</span>
      <a href="#top">Back to top</a>
    </div>
  </div>
</footer>
