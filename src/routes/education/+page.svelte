<script lang="ts">
  import { cinematicMotion } from '#lib/motion/cinematic-motion';
  import PulseStudy from './PulseStudy.svelte';
  import '../about/editorial.css';

  const offerings = [
    {
      title: 'Private lessons',
      summary: 'One-to-one drum set instruction on technique, time, repertoire, and audition preparation. Ask about in-person and remote sessions.',
      href: 'mailto:sergiobellotti@gmail.com?subject=Private%20drum%20lesson%20inquiry',
      label: 'Ask about private lessons'
    },
    {
      title: 'Group workshops',
      summary: 'Hands-on sessions for schools, ensembles, and community groups. Formats include group classes, percussion clinics, and drum circles.',
      href: 'mailto:sergiobellotti@gmail.com?subject=Percussion%20workshop%20inquiry',
      label: 'Discuss a workshop'
    },
    {
      title: 'Masterclasses',
      summary: 'Focused sessions on the tools working drummers use, from rudiments and Moeller technique to interpreting a groove with an ensemble.',
      href: 'https://www.sergiobellotti.com/lectures-masterclasses',
      label: 'Explore lectures and clinics'
    }
  ] as const;
</script>

<svelte:head>
  <title>Drum Lessons, Workshops and Masterclasses | Sergio Bellotti</title>
  <meta name="description" content="Learn with Berklee Associate Professor Sergio Bellotti through private drum lessons, group workshops, and percussion masterclasses." />
</svelte:head>

<div use:cinematicMotion class="editorial-route education">
  <div class="education-stage" data-motion-hero>
    <header class="editorial-shell education-opening">
      <div>
        <p class="editorial-kicker" data-motion-intro>Education</p>
        <h1>
          <span class="editorial-line"><span data-motion-line>Make it groove.</span></span>
        </h1>
      </div>
      <div data-motion-intro>
        <p class="editorial-lede">Study drum set and percussion with Sergio Bellotti, Associate Professor of Percussion at Berklee College of Music.</p>
        <a class="editorial-link" href="#practice-heading">Explore the hidden pulse</a>
      </div>
    </header>
    <div class="editorial-shell workshop-shell">
      <figure class="workshop">
        <div class="editorial-media editorial-crop" data-motion-frame>
          <div class="editorial-crop-image" data-motion-parallax>
            <img src="/images/workshop.webp" width="2000" height="1502" srcset="/images/workshop-768.webp 768w, /images/workshop-1280.webp 1280w, /images/workshop.webp 2000w" sizes="(max-width: 100rem) 89vw, 86rem" alt="Sergio Bellotti taking a selfie with participants at the Taipei International Percussion Summer Camp" fetchpriority="high" />
          </div>
        </div>
        <figcaption class="editorial-caption">
          <span>Taipei International Percussion Summer Camp</span>
          <span>2017</span>
        </figcaption>
      </figure>
    </div>
  </div>

  <section class="editorial-shell options" aria-labelledby="options-heading">
    <div class="options-heading" data-motion-reveal>
      <p class="editorial-kicker">Ways to study</p>
      <h2 id="options-heading">Find your format.</h2>
    </div>
    <div class="options-list">
      {#each offerings as offering (offering.title)}
        <article class="editorial-body option" data-motion-reveal>
          <h3>{offering.title}</h3>
          <p>{offering.summary}</p>
          <a class="editorial-link" href={offering.href}>{offering.label}</a>
        </article>
      {/each}
    </div>
  </section>

  <section class="practice" aria-labelledby="practice-heading">
    <div class="editorial-shell practice-layout" data-motion-reveal>
      <div>
        <p class="editorial-kicker">From the classroom</p>
        <h2 id="practice-heading">The Hidden Pulse.</h2>
      </div>
      <div class="editorial-body">
        <p>At Berklee’s Percussion Days, Bellotti demonstrated how quiet snare strokes can change the shape of a groove. In his hi-hat shadow exercise, students can hear how ghost notes fill out sixteenth-note and triplet patterns.</p>
        <a class="editorial-link" href="https://college.berklee.edu/percussion/events/percussion-days-2026-sergio-bellotti-the-hidden-pulse-ghost-notes-explorations">Read the Berklee clinic notes</a>
      </div>
    </div>
    <div class="editorial-shell pulse-study" data-motion-reveal>
      <PulseStudy />
    </div>
  </section>

  <section class="editorial-cta">
    <div class="editorial-shell" data-motion-reveal>
      <p class="editorial-kicker">Lessons and clinics</p>
      <h2>Start a conversation.</h2>
      <a class="editorial-link" href="/contact/">Contact Sergio</a>
    </div>
  </section>
</div>

<style>
  .education-opening {
    display: grid;
    grid-template-columns: minmax(0, 1.65fr) minmax(0, 0.75fr);
    gap: clamp(1rem, 5vw, 4.5rem);
    align-items: end;
    margin-bottom: clamp(2.5rem, 5vw, 4.75rem);
  }

  .education-opening .editorial-lede {
    margin: 0;
  }

  .education-opening .editorial-link {
    margin-top: 1.2rem;
  }

  .education-opening h1 {
    font-size: clamp(4rem, 10.8vw, 11rem);
    text-wrap: balance;
  }

  .workshop {
    --crop-ratio: 4 / 3;
    --subject-position: 51% 69%;
  }

  .options {
    margin-block: clamp(4.5rem, 10vw, 10rem);
  }

  .options-heading {
    margin-bottom: 2.25rem;
  }

  .options-list {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: clamp(1rem, 4vw, 3.25rem);
  }

  .option {
    border-top: 1px solid var(--editorial-rule);
    padding-block: 1.35rem;
  }

  .option .editorial-link,
  .practice .editorial-link {
    margin-top: 1rem;
  }

  .practice {
    --editorial-bg: var(--night, #12110f);
    --editorial-ink: var(--paper, #f3f0e9);
    --editorial-muted: #bfb8ab;
    --editorial-accent: var(--accent, #d6aa6d);
    background: var(--editorial-bg);
    color: var(--editorial-ink);
    padding-block: clamp(3.5rem, 8vw, 7rem);
  }

  .practice-layout {
    display: grid;
    grid-template-columns: 1.1fr 1fr;
    align-items: end;
    gap: clamp(1.5rem, 6vw, 6rem);
  }

  .pulse-study {
    margin-top: clamp(2rem, 4vw, 4.5rem);
  }

  .practice .editorial-body p:first-child {
    margin-top: 0;
  }

  .education .editorial-cta {
    margin-top: 0;
    border-top: 0;
  }

  @media (max-width: 48rem) {
    .education-opening,
    .practice-layout {
      grid-template-columns: 1fr;
    }

    .options-list {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }

  @media (max-width: 32rem) {
    .education-opening h1 {
      font-size: clamp(3.5rem, 13vw, 6rem);
    }

    .options-list {
      grid-template-columns: 1fr;
    }
  }
</style>
