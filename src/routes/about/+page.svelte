<script lang="ts">
  import { cinematicMotion } from '#lib/motion/cinematic-motion';
  import AtlanticJourney from './AtlanticJourney.svelte';
  import './editorial.css';

  const milestones = [
    {
      date: 'Early years',
      title: 'Learning the instrument in Italy',
      description: 'Bellotti began studying rudiments, reading, and traditional rhythms with Michele Di Monte in Bari. Orchestra work took him to Turin, and playing on cruise ships broadened his repertoire.'
    },
    {
      date: '1995',
      title: 'Crossing to Boston',
      description: 'He moved to Boston to study at Berklee College of Music. He went on to play on local stages and co-found the fusion group Spajazzy with bassist Tino D’Agostino.'
    },
    {
      date: '2002',
      title: 'Joining the Berklee faculty',
      description: 'Bellotti joined the Percussion Department. His teaching spans drum set fundamentals, Moeller technique, fusion repertoire, and the relationship between bass and drums.'
    },
    {
      date: '2023',
      title: 'Scoring for the screen',
      description: 'His percussion-based score for Antonio Palumbo’s Il Vecchio e il Muro earned Best Soundtrack at the Tulipani di Seta Nera festival.'
    }
  ] as const;
</script>

<svelte:head>
  <title>Sergio Bellotti | Biography, Berklee Faculty and Drummer</title>
  <meta name="description" content="Explore Sergio Bellotti’s journey from Bari to Boston, his career as a drummer and composer, and his work in Berklee’s Percussion Department." />
</svelte:head>

<div use:cinematicMotion class="editorial-route about">
  <div class="editorial-shell opening" data-motion-hero>
    <div class="opening-copy">
      <p class="editorial-kicker" data-motion-intro>Biography</p>
      <h1 aria-label="From Bari to Boston.">
        <span class="editorial-line" aria-hidden="true"><span data-motion-line>From Bari</span></span>
        <span class="editorial-line" aria-hidden="true"><span data-motion-line>to Boston.</span></span>
      </h1>
      <div data-motion-intro>
        <p class="editorial-lede">Sergio Bellotti is a drummer, composer, and Associate Professor of Percussion at Berklee College of Music.</p>
        <a class="editorial-link" href="https://college.berklee.edu/people/sergio-bellotti">Berklee faculty profile</a>
      </div>
    </div>
    <figure class="portrait">
      <div class="editorial-media editorial-crop" data-motion-frame>
        <div class="editorial-crop-image" data-motion-parallax>
          <img src="/images/portrait.webp" width="2000" height="1334" srcset="/images/portrait-768.webp 768w, /images/portrait-1280.webp 1280w, /images/portrait.webp 2000w" sizes="(max-width: 880px) 89vw, (max-width: 100rem) 46vw, 46rem" alt="Sergio Bellotti looks at the camera between two white drumheads" fetchpriority="high" />
        </div>
      </div>
      <figcaption class="editorial-caption">
        <span>Sergio Bellotti</span>
        <span>Drummer, composer and educator</span>
      </figcaption>
    </figure>
  </div>

  <AtlanticJourney />

  <section class="editorial-shell biography" aria-labelledby="biography-heading">
    <div class="biography-intro" data-motion-reveal>
      <p class="editorial-kicker">On the bandstand and in the classroom</p>
      <h2 id="biography-heading">A life in rhythm.</h2>
      <div class="editorial-body">
        <p>Bellotti’s work moves between jazz, fusion, and music shaped by his Italian roots. He co-leads ensembles, records with artists across genres, and composes for film.</p>
        <p>His performance and recording credits include Mike Stern, Nathan East, Robben Ford, Bob James, and Wayne Krantz. In Boston, he plays with pianist Frank Wilkins and bassist Wesley Wirth in WeJazzUp.</p>
      </div>
    </div>
    <ol class="timeline" aria-label="Career milestones">
      {#each milestones as milestone (milestone.title)}
        <li data-motion-reveal>
          <p class="milestone-date">{milestone.date}</p>
          <div class="editorial-body">
            <h3>{milestone.title}</h3>
            <p>{milestone.description}</p>
          </div>
        </li>
      {/each}
    </ol>
  </section>

  <section class="editorial-cta">
    <div class="editorial-shell" data-motion-reveal>
      <p class="editorial-kicker">The music</p>
      <h2>Hear where the rhythm goes.</h2>
      <a class="editorial-link" href="/work/">Explore projects and recordings</a>
    </div>
  </section>
</div>

<style>
  .opening {
    display: grid;
    grid-template-columns: minmax(0, 0.9fr) minmax(0, 1fr);
    align-items: center;
    gap: clamp(2rem, 5vw, 5.5rem);
  }

  .opening h1 {
    font-size: clamp(4.25rem, 10.45vw, 11rem);
    text-wrap: initial;
  }

  .opening .editorial-link {
    margin-top: 1.3rem;
  }

  .portrait {
    --crop-ratio: 5 / 4;
    --subject-position: 47% 46%;
  }

  .biography {
    display: grid;
    grid-template-columns: minmax(0, 0.8fr) minmax(0, 1fr);
    gap: clamp(2.4rem, 6.5vw, 7rem);
    margin-top: clamp(5rem, 12vw, 11rem);
  }

  .timeline {
    padding-inline-start: 1.5rem;
    margin: 0;
    border-inline-start: 1px solid var(--editorial-rule);
    list-style: none;
  }

  .timeline li {
    position: relative;
    display: grid;
    grid-template-columns: 7rem minmax(0, 1fr);
    align-items: baseline;
    gap: 1rem;
    padding-block: 1.45rem 2.2rem;
    border-top: 1px solid var(--editorial-rule);
  }

  .timeline li::before {
    content: '';
    position: absolute;
    inset: -0.33rem auto auto -1.83rem;
    inline-size: 0.63rem;
    block-size: 0.63rem;
    border-radius: 50%;
    background: var(--editorial-accent);
  }

  .timeline li:last-child {
    border-bottom: 1px solid var(--editorial-rule);
  }

  .milestone-date {
    color: var(--editorial-accent);
    margin: 0;
    font-size: 0.85rem;
    font-weight: 650;
  }

  .timeline p + .editorial-body p {
    margin-top: 0.55rem;
  }

  @media (min-width: 55.01rem) {
    .biography-intro {
      position: sticky;
      top: 2.5rem;
      align-self: start;
    }
  }

  @media (max-width: 55rem) {
    .opening,
    .biography {
      grid-template-columns: 1fr;
    }

    .opening h1 {
      font-size: clamp(4.25rem, 14.7vw, 8.75rem);
    }

    .portrait {
      --crop-ratio: 4 / 3;
    }
  }

  @media (max-width: 35rem) {
    .timeline li {
      grid-template-columns: 1fr;
      gap: 0.45rem;
    }
  }
</style>
