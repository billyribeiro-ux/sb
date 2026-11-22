<script lang="ts">
  import ArtistHero from '#lib/components/ArtistHero.svelte';
  import Cymbal from '#lib/motion/Cymbal.svelte';
  import { cinematicMotion } from '#lib/motion/cinematic-motion';
  import ReelDialog from '#lib/components/ReelDialog.svelte';
  import GalleryDialog from '#lib/components/GalleryDialog.svelte';
  import PerformanceFilm from '#lib/components/PerformanceFilm.svelte';
  import { artist } from '#lib/site';
  import PlusIcon from 'phosphor-svelte/lib/PlusIcon';
  import './home.css';

  let reelOpen = $state(false);
  let galleryIndex = $state<number | null>(null);

  const gallery = [
    { src: '/images/drum-solo.webp', thumb: '/images/drum-solo-1280.webp', alt: 'Sergio Bellotti facing the camera behind a red Yamaha drum kit', caption: 'On the kit', width: 2000, height: 1334 },
    { src: '/images/home-stage.webp', thumb: '/images/home-stage-thumb.webp', alt: 'Sergio smiles while playing a pink drum kit under violet stage light', caption: 'Live on stage', width: 1440, height: 1152 },
    { src: '/images/recording.webp', thumb: '/images/home-recording-thumb.webp', alt: 'An overhead view of Sergio at a red drum kit', caption: 'In the studio', width: 2000, height: 1334 },
    { src: '/images/workshop.webp', thumb: '/images/home-taipei-thumb.webp', alt: 'Sergio and participants at the Taipei International Percussion Summer Camp', caption: 'Taipei percussion camp', width: 2000, height: 1502 },
    { src: '/images/contact-portrait.webp', thumb: '/images/home-cymbal-thumb.webp', alt: 'Sergio holds a cymbal outdoors', caption: 'Away from the kit', width: 2000, height: 1334 },
  ];

  function playReel(event: MouseEvent) {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    reelOpen = true;
  }
</script>

<svelte:head>
  <title>Sergio Bellotti | Drummer, Educator &amp; Producer</title>
  <meta name="description" content="Sergio Bellotti is a Boston-based drummer, producer and Berklee associate professor of percussion. Explore his performances, recordings, and drum education." />
  <meta property="og:title" content="Sergio Bellotti | Drummer, Educator &amp; Producer" />
  <meta property="og:description" content="Live performance, records, and drum education from Sergio Bellotti." />
  <meta property="og:type" content="website" />
</svelte:head>

<div class="home" use:cinematicMotion>
  <ArtistHero onwatch={playReel} />

  <section class="reel" id="performance-film" aria-labelledby="reel-title">
    <div class="shell reel-top" data-motion-reveal>
      <div>
        <p class="eyebrow">The performance film</p>
        <h2 id="reel-title">Happy People 7/4.</h2>
      </div>
      <p>Front, side, and overhead angles show how Sergio moves across the kit.</p>
    </div>
    <div class="shell reel-frame" data-motion-film-screen>
      <PerformanceFilm
        src="/videos/sergio-performance.mp4"
        src4k="/videos/sergio-performance-4k.mp4"
        poster="/videos/sergio-performance-poster.webp"
        label="Sergio Bellotti performing Happy People 7/4 on a red drum kit"
      />
    </div>
    <div class="shell reel-bottom">
      <span>Studio performance</span>
      <a href="/work/">More music &amp; sessions</a>
    </div>
  </section>

  <section class="intro" id="about" aria-labelledby="intro-title">
    <div class="shell intro-grid">
      <figure class="intro-photo" data-motion-reveal>
        <div class="photo-overflow" data-motion-frame>
          <img src="/images/portrait.webp" srcset="/images/portrait-768.webp 768w, /images/portrait-1280.webp 1280w, /images/portrait.webp 2000w" sizes="(max-width: 750px) 92vw, 55vw" alt="Sergio Bellotti between two white drumheads" width="2000" height="1334" loading="lazy" decoding="async" data-motion-parallax />
        </div>
        <figcaption><span>Sergio Bellotti</span><span>Artist archive</span></figcaption>
      </figure>
      <div class="intro-copy" data-motion-reveal>
        <p class="eyebrow">Meet Sergio</p>
        <h2 id="intro-title">A life<br />in rhythm.</h2>
        <p class="intro-lead">From Bari to Boston, Sergio Bellotti has made a life around the drum kit.</p>
        <p>Onstage, in the studio, and at Berklee College of Music, he brings his feel for jazz and soul to the musicians he plays with and teaches.</p>
        <a class="text-link" href="/about/">Read Sergio’s story</a>
      </div>
    </div>
  </section>

  <section class="instrument-section" aria-labelledby="instrument-title">
    <div class="instrument-track" aria-hidden="true"><span data-motion-type-track>Drums &amp; percussion</span></div>
    <div class="shell instrument-grid">
      <div data-motion-reveal>
        <p class="eyebrow">Interactive instrument</p>
        <h2 id="instrument-title">Strike<br />the cymbal.</h2>
        <p>A strike sends a wave from the point of contact through the metal.</p>
      </div>
      <div class="instrument-model" data-motion-reveal><Cymbal /></div>
    </div>
  </section>

  <section class="work" aria-labelledby="work-title">
    <div class="shell">
      <div class="section-heading" data-motion-reveal>
        <div><p class="eyebrow">Music &amp; education</p><h2 id="work-title">Behind the kit.</h2></div>
      </div>
      <div class="work-grid">
        <article data-motion-reveal>
          <a href="/work/">
            <figure data-motion-frame>
              <img src="/images/home-stage.webp" srcset="/images/home-stage-768.webp 768w, /images/home-stage.webp 1440w" sizes="(max-width: 750px) 90vw, 46vw" alt="Sergio smiles while playing a pink drum kit under violet stage lighting" width="1440" height="1152" loading="lazy" decoding="async" data-motion-parallax />
            </figure>
            <div><h3>Live &amp; on record</h3><p>Explore the bands, sessions, and recordings.</p></div>
          </a>
        </article>
        <article data-motion-reveal>
          <a href="/education/">
            <figure data-motion-frame>
              <img src="/images/home-ensemble.webp" srcset="/images/home-ensemble-768.webp 768w, /images/home-ensemble-1280.webp 1280w, /images/home-ensemble.webp 1920w" sizes="(max-width: 750px) 90vw, 46vw" alt="Sergio Bellotti with an ensemble of musicians holding their instruments" width="1920" height="1536" loading="lazy" decoding="async" data-motion-parallax />
            </figure>
            <div><h3>Teaching &amp; clinics</h3><p>Private lessons, workshops, and percussion at Berklee.</p></div>
          </a>
        </article>
      </div>
    </div>
  </section>

  <section class="archive" aria-labelledby="archive-title">
    <div class="shell">
      <div class="section-heading" data-motion-reveal>
        <div><p class="eyebrow">Photo gallery</p><h2 id="archive-title">In the frame.</h2></div>
      </div>
      <div class="archive-grid">
        {#each gallery as image, index (image.src)}
          <a class="gallery-trigger" href={image.src} aria-label={`Enlarge photograph: ${image.caption}`} onclick={(event) => {
            if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
            event.preventDefault();
            galleryIndex = index;
          }}>
            <img src={image.thumb} alt={image.alt} width={image.width} height={image.height} loading="lazy" decoding="async" />
            <span class="gallery-icon"><PlusIcon size={20} /></span>
          </a>
        {/each}
      </div>
    </div>
  </section>
</div>

<ReelDialog bind:open={reelOpen} videoId={artist.reel} title="Sergio Bellotti live" />
<GalleryDialog bind:index={galleryIndex} items={gallery} title="From Sergio’s archive" />
