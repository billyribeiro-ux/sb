<script lang="ts">
  import PlusIcon from 'phosphor-svelte/lib/PlusIcon';
  import GalleryDialog from '#lib/components/GalleryDialog.svelte';
  import { cinematicMotion } from '#lib/motion/cinematic-motion';
  import { artist } from '#lib/site';
  import drumCircle from './drum-circle.webp';
  import groupSession from './group-session.webp';
  import PulseStudy from '../education/PulseStudy.svelte';
  import '../about/editorial.css';

  const classesPage = 'https://www.sergiobellotti.com/classes';
  const clinicNotes = 'https://college.berklee.edu/percussion/events/percussion-days-2026-sergio-bellotti-the-hidden-pulse-ghost-notes-explorations';

  const formats = {
    workshop: {
      label: 'Group workshops',
      heading: 'Play the tune together.',
      description: 'For schools and ensembles working on groove, repertoire, or how the rhythm section locks in. Bring a tune your group is learning and connect the technique to what the music needs.',
      topics: ['Time and feel', 'Playing with a bassist', 'Repertoire in context'],
    },
    clinic: {
      label: 'Technique clinics',
      heading: 'Explore the hidden pulse.',
      description: 'Take a closer look at what changes the feel of a groove. At Berklee’s 2026 Percussion Days, Sergio demonstrated how quiet snare strokes and the hi-hat can shape sixteenth-note and triplet patterns.',
      topics: ['Ghost notes and dynamics', 'Hi-hat coordination', 'Moeller technique'],
    },
    circle: {
      label: 'Drum circles',
      heading: 'Find a shared groove.',
      description: 'For community groups that want to make music together. Start with a pulse everyone can follow, then build layers as participants listen and respond to one another.',
      topics: ['Keeping a shared pulse', 'Call and response', 'Listening across the circle'],
    },
  } as const;
  type Format = keyof typeof formats;
  const formatOptions = ['workshop', 'clinic', 'circle'] as const satisfies readonly Format[];

  const photos = [
    {
      src: '/images/workshop.webp',
      preview: '/images/workshop-768.webp',
      alt: 'Sergio Bellotti with participants standing among drum kits at the Taipei International Percussion Summer Camp',
      caption: 'Taipei International Percussion Summer Camp',
      credit: '2017 · Artist archive',
      width: 2000,
      height: 1502,
      previewWidth: 768,
      previewHeight: 576,
    },
    {
      // Official Group Lessons archive, IMG_4046.
      src: groupSession,
      preview: groupSession,
      alt: 'Sergio Bellotti with a group of musicians gathered around a drum kit',
      caption: 'Group session',
      credit: 'Artist archive',
      width: 1700,
      height: 1278,
      previewWidth: 1700,
      previewHeight: 1278,
    },
    {
      // Official Group Lessons archive, DRUMCIRCLE1.
      src: drumCircle,
      preview: drumCircle,
      alt: 'Participants sit around a circle with hand drums during a group session',
      caption: 'Drum circle',
      credit: 'Artist archive',
      width: 1600,
      height: 1195,
      previewWidth: 1600,
      previewHeight: 1195,
    },
  ] as const;

  let selectedFormat = $state<Format>('workshop');
  let galleryIndex = $state<number | null>(null);
  const format = $derived(formats[selectedFormat]);

  function openPhoto(event: MouseEvent, index: number) {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    galleryIndex = index;
  }
</script>

<svelte:head>
  <title>Workshops &amp; Clinics | Sergio Bellotti</title>
  <meta name="description" content="Explore drum workshops, percussion clinics, and drum circles with Sergio Bellotti, Associate Professor of Percussion at Berklee College of Music." />
</svelte:head>

<div class="editorial-route workshops" use:cinematicMotion>
  <div class="editorial-shell opening" data-motion-hero>
    <div>
      <p class="editorial-kicker" data-motion-intro>Group percussion instruction</p>
      <h1 aria-label="Workshops &amp; Clinics.">
        <span class="editorial-line" aria-hidden="true"><span data-motion-line>Workshops</span></span>
        <span class="editorial-line" aria-hidden="true"><span data-motion-line>&amp; Clinics.</span></span>
      </h1>
      <div data-motion-intro>
        <p class="editorial-lede">Work on groove, technique, and ensemble playing with Sergio Bellotti, Associate Professor of Percussion at Berklee College of Music.</p>
        <a class="editorial-link" href="#workshop-formats">Explore workshop formats</a>
      </div>
    </div>
    <figure class="opening-photo">
      <div class="editorial-media">
        <img
          src="/images/home-percussion-workshop.webp"
          srcset="/images/home-percussion-workshop-768.webp 768w, /images/home-percussion-workshop.webp 2000w"
          sizes="(max-width: 55rem) 89vw, (max-width: 100rem) 46vw, 46rem"
          width="2000"
          height="1334"
          alt="Sergio Bellotti with percussion students gathered around a drum kit"
          fetchpriority="high"
        />
      </div>
      <figcaption class="editorial-caption"><span>Percussion workshop</span><span>Artist archive</span></figcaption>
    </figure>
  </div>

  <section class="editorial-shell format-section" id="workshop-formats" aria-labelledby="format-heading">
    <div data-motion-reveal>
      <p class="editorial-kicker">Ways to work together</p>
      <h2 id="format-heading">Find the right format.</h2>
    </div>

    <div class="format-explorer" data-motion-reveal>
      <fieldset class="format-choices">
        <legend>Choose a workshop format</legend>
        <div class="format-options">
          {#each formatOptions as option (option)}
            <label>
              <input type="radio" name="workshop-format" value={option} bind:group={selectedFormat} />
              <span>{formats[option].label}</span>
            </label>
          {/each}
        </div>
      </fieldset>

      <div class="editorial-body format-detail" aria-live="polite" aria-atomic="true">
        <h3>{format.heading}</h3>
        <p>{format.description}</p>
        <ul class="topics">
          {#each format.topics as topic (topic)}<li>{topic}</li>{/each}
        </ul>
        {#if selectedFormat === 'clinic'}
          <a class="editorial-link" href={clinicNotes}>Read Berklee’s clinic notes</a>
        {/if}
      </div>
    </div>
  </section>

  <section class="editorial-shell clinic-practice" aria-labelledby="clinic-practice-heading">
    <h2 id="clinic-practice-heading" data-motion-reveal>Try a clinic exercise.</h2>
    <div data-motion-reveal><PulseStudy /></div>
  </section>

  <section class="editorial-shell archive" aria-labelledby="workshop-archive">
    <div class="archive-heading" data-motion-reveal>
      <h2 id="workshop-archive">From the workshop room.</h2>
      <a class="editorial-link" href={classesPage}>Sergio’s teaching archive</a>
    </div>
    <div class="photo-grid">
      {#each photos as photo, index (photo.src)}
        <figure data-motion-reveal>
          <a href={photo.src} aria-label={`Enlarge photograph: ${photo.caption}`} onclick={(event) => openPhoto(event, index)}>
            <img
              src={photo.preview}
              alt={photo.alt}
              width={photo.previewWidth}
              height={photo.previewHeight}
              loading="lazy"
              decoding="async"
            />
            <span class="enlarge" aria-hidden="true"><PlusIcon size={18} weight="bold" /></span>
          </a>
          <figcaption class="editorial-caption"><span>{photo.caption}</span><span>{photo.credit}</span></figcaption>
        </figure>
      {/each}
    </div>
  </section>

  <section class="editorial-cta">
    <div class="editorial-shell booking" data-motion-reveal>
      <div>
        <h2>Bring Sergio to your group.</h2>
        <p class="editorial-lede">Share where you’re based, the group’s experience level, and what you’d like to work on.</p>
        <a class="editorial-link" href="/contact/">Contact Sergio about a workshop</a>
      </div>
      <p class="sign-off">{artist.tagline}</p>
    </div>
  </section>
</div>

<GalleryDialog items={photos} bind:index={galleryIndex} title="Workshop photographs" />

<style>
  .opening,
  .format-section,
  .booking {
    display: grid;
    grid-template-columns: minmax(0, 0.9fr) minmax(0, 1fr);
    gap: clamp(2rem, 5vw, 5.5rem);
  }

  .opening { align-items: center; }

  .opening h1 {
    font-size: clamp(3.65rem, 9vw, 9.5rem);
    text-wrap: initial;
  }

  .opening .editorial-link { margin-top: 1.3rem; }
  .opening-photo img { width: 100%; height: auto; }

  #workshop-formats { scroll-margin-block-start: calc(var(--header, 5.45rem) + 1.5rem); }
  .format-section,
  .clinic-practice,
  .archive { margin-block-start: clamp(4.5rem, 9vw, 9rem); }

  .clinic-practice h2 { margin-block-end: 1.6rem; }

  .format-explorer { min-width: 0; }
  .format-choices { min-width: 0; padding: 0; margin: 0; border: 0; }
  .format-choices legend {
    padding: 0;
    margin-block-end: 0.65rem;
    color: var(--editorial-muted);
    font-size: 0.875rem;
    font-weight: 650;
  }

  .format-options { display: flex; flex-wrap: wrap; gap: 0.45rem; }

  .format-options label {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    min-width: 0;
    max-width: 100%;
    min-height: 2.75rem;
    padding: 0.5rem 0.8rem;
    border: 1px solid var(--editorial-rule);
    font-size: 0.875rem;
    font-weight: 650;
    cursor: pointer;
  }

  .format-options input {
    flex: none;
    width: 1rem;
    height: 1rem;
    margin: 0;
    accent-color: var(--editorial-accent);
    cursor: inherit;
  }

  .format-options label:hover { border-color: var(--editorial-ink); }
  .format-options label:has(input:checked) {
    color: var(--editorial-bg);
    border-color: var(--editorial-ink);
    background: var(--editorial-ink);
    color-scheme: dark;
  }

  .format-options label:has(input:focus-visible) {
    outline: 2px solid var(--editorial-accent);
    outline-offset: 2px;
  }

  .format-detail {
    min-block-size: 18rem;
    margin-block-start: 1.5rem;
    padding-block: 1.65rem;
    border-block: 1px solid var(--editorial-rule);
  }

  .format-detail p { margin-top: 0.8rem; }
  .format-detail .editorial-link { margin-top: 0.7rem; }
  .topics { padding-inline-start: 1.25rem; margin: 1rem 0 0; }
  .topics li + li { margin-top: 0.2rem; }

  .archive-heading {
    display: flex;
    flex-wrap: wrap;
    align-items: end;
    justify-content: space-between;
    gap: 1rem 2rem;
    margin-bottom: 1.6rem;
  }

  .photo-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: clamp(0.8rem, 2.2vw, 2rem);
  }

  .photo-grid a { display: block; position: relative; }
  .photo-grid img { width: 100%; height: auto; }
  .photo-grid a:hover .enlarge { background: var(--editorial-accent); }

  .enlarge {
    display: grid;
    place-items: center;
    position: absolute;
    inset: auto 0.55rem 0.55rem auto;
    width: 2.75rem;
    height: 2.75rem;
    color: white;
    background: #191713;
  }

  .booking { align-items: end; }
  .booking .sign-off {
    color: var(--editorial-accent);
    font: 400 clamp(3rem, 9vw, 8rem)/0.85 var(--display, sans-serif);
    text-align: end;
  }

  @media (max-width: 55rem) {
    .opening,
    .format-section,
    .booking { grid-template-columns: 1fr; }
    .opening h1 { font-size: clamp(3.65rem, 13.5vw, 8rem); }
    .booking .sign-off { text-align: start; }
  }

  @media (max-width: 39rem) {
    .photo-grid { grid-template-columns: 1fr; }
    .format-detail { min-block-size: 0; }
  }
</style>
