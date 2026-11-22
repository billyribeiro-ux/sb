<script lang="ts">
  import PerformanceFilm from '#lib/components/PerformanceFilm.svelte';
  import { cinematicMotion } from '#lib/motion/cinematic-motion';
  import '../about/editorial.css';

  const ensembles = [
    {
      title: 'Spajazzy',
      description: 'Jazz fusion led by Bellotti and bassist Tino D’Agostino. The band’s records feature guitarist Mike Stern and keyboardist Steve Hunt.',
      href: 'https://www.sergiobellotti.com/spajazzy',
      label: 'Explore Spajazzy'
    },
    {
      title: 'WeJazzUp',
      description: 'A Boston ensemble with pianist Frank Wilkins and bassist Wesley Wirth, known for its sessions at Slade’s.',
      href: 'https://www.sergiobellotti.com/wejazzup',
      label: 'Explore WeJazzUp'
    },
    {
      title: 'VOLARE',
      description: 'Bellotti’s smooth-jazz interpretations of Italian pop from the 1970s through the 1990s.',
      href: 'https://www.berklee.edu/events/volare-the-soul-of-italian-music',
      label: 'See the Berklee program'
    },
    {
      title: 'CHANTaSONIC',
      description: 'Bellotti and Wesley Wirth co-lead a project with drums, bass, guitar, and vocals from both musicians.',
      href: 'https://www.sergiobellotti.com/chantasonic',
      label: 'Explore CHANTaSONIC'
    }
  ] as const;
</script>

<svelte:head>
  <title>Music, Projects and Film Scores | Sergio Bellotti</title>
  <meta name="description" content="Explore Sergio Bellotti’s live projects, discography, studio sessions, and film scores, including Spajazzy, PANoDRUMa, and VOLARE." />
</svelte:head>

<div use:cinematicMotion class="editorial-route editorial-route--dark work">
  <div class="work-stage" data-motion-hero>
    <header class="editorial-shell work-opening">
      <div class="work-opening-copy">
        <p class="editorial-kicker" data-motion-intro>Selected work</p>
        <h1 aria-label="Music in motion.">
          <span class="editorial-line" aria-hidden="true"><span data-motion-line>Music in</span></span>
          <span class="editorial-line" aria-hidden="true"><span data-motion-line>motion.</span></span>
        </h1>
        <div data-motion-intro>
          <p class="editorial-lede">Live ensembles, studio sessions, and film scores. Follow Bellotti’s work from the club stage to the recording room.</p>
          <nav class="work-jumps" aria-label="Sections on this page">
            <a class="editorial-link" href="#live">Live projects</a>
            <a class="editorial-link" href="#studio">Studio</a>
            <a class="editorial-link" href="#film">Film scores</a>
          </nav>
        </div>
      </div>
    </header>
    <figure class="editorial-media editorial-crop stage" data-motion-frame>
      <div class="editorial-crop-image" data-motion-parallax>
        <img src="/images/stage.webp" width="2400" height="1800" srcset="/images/stage-768.webp 768w, /images/stage-1280.webp 1280w, /images/stage.webp 2400w" sizes="(max-width: 768px) 100vw, max(48rem, 65vw)" alt="Sergio Bellotti reaches toward a cymbal beside his red drum kit on a blue-lit stage" fetchpriority="high" />
      </div>
    </figure>
  </div>

  <section class="editorial-shell work-section" id="live" aria-labelledby="live-heading">
    <div class="work-heading" data-motion-reveal>
      <p class="editorial-kicker">Live</p>
      <h2 id="live-heading">The ensembles.</h2>
    </div>

    <article class="feature" data-motion-reveal>
      <figure class="panodruma">
        <div class="editorial-media" data-motion-frame>
          <img src="/images/panodruma.webp" width="1140" height="1600" srcset="/images/panodruma-768.webp 768w, /images/panodruma.webp 1140w" sizes="(max-width: 32rem) 89vw, 29rem" alt="PANoDRUMa concert poster featuring Loris Lombardo and Sergio Bellotti" loading="lazy" decoding="async" />
        </div>
        <figcaption class="editorial-caption">Concert poster from the archive</figcaption>
      </figure>
      <div class="editorial-body feature-copy">
        <h3>PANoDRUMa</h3>
        <p>Bellotti’s drum set, voice, and electronic and acoustic percussion meet Loris Lombardo’s handpan in a duo shaped by melody and pulse. They brought the project to Berklee’s Percussion Days and to TEDxFoggia.</p>
        <a class="editorial-link" href="https://tedxfoggia.com/talk/ritmo-e-cura-la-perfezione-del-battito/">Watch the TEDxFoggia performance</a>
      </div>
    </article>

    <div class="ensemble-list">
      {#each ensembles as ensemble (ensemble.title)}
        <article class="editorial-body ensemble" data-motion-reveal>
          <h3>{ensemble.title}</h3>
          <p>{ensemble.description}</p>
          <a class="editorial-link" href={ensemble.href}>{ensemble.label}</a>
        </article>
      {/each}
    </div>
  </section>

  <section class="editorial-shell work-section" id="studio" aria-labelledby="studio-heading">
    <div class="work-heading" data-motion-reveal>
      <p class="editorial-kicker">Recordings and production</p>
      <h2 id="studio-heading">In the studio.</h2>
    </div>
    <div class="feature" data-motion-reveal>
      <figure class="editorial-media editorial-crop feature-media recording" data-motion-frame>
        <div class="editorial-crop-image" data-motion-parallax>
          <img src="/images/recording.webp" width="2000" height="1334" srcset="/images/recording-768.webp 768w, /images/recording-1280.webp 1280w, /images/recording.webp 2000w" sizes="(max-width: 768px) 89vw, 48vw" alt="Sergio Bellotti playing a red sparkle drum set in a recording studio" loading="lazy" decoding="async" />
        </div>
      </figure>
      <div class="editorial-body feature-copy">
        <p>Bellotti’s recorded work includes Spajazzy’s <em>Mr. D</em> and <em>Downtown Boston</em>, Rocco Ventrella’s <em>Sweet Temptation</em>, and Igor Geržina’s <em>Metropolis</em>. His production work ranges from jazz to house.</p>
        <a class="editorial-link" href="https://www.sergiobellotti.com/music">Explore the discography</a>
      </div>
    </div>
    <figure class="session-film" data-motion-reveal>
      <PerformanceFilm
        src="/videos/sergio-session.mp4"
        src4k="/videos/sergio-session-4k.mp4"
        poster="/videos/sergio-session-poster.webp"
        label="Sergio Bellotti performing Mr. D"
      />
      <figcaption class="editorial-caption">
        <span>Mr. D</span>
        <span>From the studio archive</span>
      </figcaption>
    </figure>
  </section>

  <section class="editorial-shell work-section film" id="film" aria-labelledby="film-heading" data-motion-reveal>
    <div>
      <p class="editorial-kicker">Film scores</p>
      <h2 id="film-heading">Rhythm for the screen.</h2>
    </div>
    <div class="editorial-body">
      <p>For Antonio Palumbo’s <em>Il Vecchio e il Muro</em>, Bellotti composed with drums and percussion. The film won Best Soundtrack at Tulipani di Seta Nera in 2023. His other screen work includes <em>Tilt</em> and <em>Conto Terzi</em>.</p>
      <a class="editorial-link" href="https://www.sergiobellotti.com/film-scoring">Explore film credits</a>
    </div>
  </section>

  <section class="editorial-cta">
    <div class="editorial-shell" data-motion-reveal>
      <p class="editorial-kicker">Bookings and collaborations</p>
      <h2>Let’s make music.</h2>
      <a class="editorial-link" href="/contact/">Contact Sergio</a>
    </div>
  </section>
</div>

<style>
  .work {
    padding-block-start: 0;
  }

  .work-stage {
    position: relative;
    isolation: isolate;
    display: grid;
    min-height: clamp(33rem, calc(88svh - var(--header)), 60rem);
    align-items: center;
  }

  .work-opening {
    z-index: 1;
    padding-block: clamp(2.5rem, 5vw, 5.25rem);
  }

  .work-opening-copy {
    max-width: min(48vw, 52rem);
  }

  .work-opening h1 {
    text-wrap: nowrap;
    font-size: clamp(5rem, 11vw, 12.5rem);
  }

  .work-opening .editorial-line:last-child {
    color: var(--editorial-accent);
  }

  .work-opening .editorial-lede {
    max-width: 42ch;
  }

  .work-jumps {
    display: flex;
    flex-wrap: wrap;
    gap: 0.6rem 1.6rem;
    margin-top: 1.3rem;
  }

  .stage {
    --subject-position: 49% 26%;
    position: absolute;
    inset: 0 0 0 35%;
    aspect-ratio: auto;
    background: var(--editorial-bg);
  }

  .stage::after {
    content: '';
    position: absolute;
    z-index: 1;
    inset: 0;
    pointer-events: none;
    background: linear-gradient(90deg, var(--editorial-bg), transparent 47%);
  }

  .work-section {
    margin-top: clamp(4.5rem, 10vw, 9rem);
    scroll-margin-top: 7rem;
  }

  .work-heading {
    margin-bottom: clamp(1.5rem, 4vw, 3.25rem);
  }

  .feature,
  .film {
    display: grid;
    grid-template-columns: 1.2fr 1fr;
    align-items: center;
    gap: clamp(1.75rem, 5vw, 5rem);
  }

  .panodruma {
    width: min(100%, 29rem);
    margin-inline: auto;
  }

  .panodruma img {
    height: auto;
    object-fit: contain;
  }

  .recording {
    --crop-ratio: 3 / 2;
    --subject-position: 51% 12%;
  }

  .session-film {
    margin-top: clamp(2.5rem, 6vw, 5rem);
  }

  .feature-copy .editorial-link,
  .ensemble .editorial-link,
  .film .editorial-link {
    margin-top: 1.25rem;
  }

  .ensemble-list {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0 clamp(1.75rem, 5vw, 5rem);
    margin-top: clamp(3rem, 6vw, 6rem);
  }

  .ensemble {
    padding-block: 1.4rem 2rem;
    border-top: 1px solid var(--editorial-rule);
  }

  .film {
    padding-top: clamp(3rem, 6vw, 6rem);
    border-top: 1px solid var(--editorial-rule);
  }

  .film p:first-child,
  .feature-copy p:first-child {
    margin-top: 0;
  }

  @media (max-width: 48rem) {
    .feature,
    .film {
      grid-template-columns: 1fr;
    }

    .work-stage {
      min-height: auto;
    }

    .work-opening {
      padding-block: 3.75rem 2rem;
    }

    .work-opening h1 {
      font-size: clamp(4.5rem, 15vw, 8rem);
    }

    .work-opening-copy {
      max-width: 30rem;
    }

    .stage {
      --crop-ratio: 4 / 3;
      --subject-position: 49% 26%;
      position: relative;
      inset: auto;
      aspect-ratio: var(--crop-ratio);
    }

    .stage::after {
      background: linear-gradient(0deg, var(--editorial-bg), transparent 24%);
    }
  }

  @media (max-width: 33rem) {
    .ensemble-list {
      grid-template-columns: 1fr;
    }
  }
</style>
