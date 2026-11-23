<script lang="ts">
  import { cinematicMotion } from '#lib/motion/cinematic-motion';
  import '../about/editorial.css';

  const email = 'sergiobellotti@gmail.com';
  const inquiries = [
    {
      title: 'Live bookings',
      description: 'Send the date, venue, and lineup you have in mind.',
      subject: 'Live performance inquiry',
    },
    {
      title: 'Sessions and scores',
      description: 'Share a little about the music, your timeline, and what you need recorded.',
      subject: 'Recording or scoring inquiry',
    },
    {
      title: 'Lessons and clinics',
      description: 'Tell Sergio about your playing or the group you’re organizing.',
      subject: 'Lesson or clinic inquiry',
    },
  ] as const;

  const emailFor = (subject: string) => `mailto:${email}?subject=${encodeURIComponent(subject)}`;
</script>

<svelte:head>
  <title>Contact &amp; Booking | Sergio Bellotti</title>
  <meta
    name="description"
    content="Contact Sergio Bellotti for live bookings, recording, film scoring, private lessons, clinics, and press requests."
  />
</svelte:head>

<div class="contact" use:cinematicMotion>
  <section class="intro" aria-labelledby="contact-title" data-motion-hero>
    <div class="intro-copy">
      <p class="eyebrow" data-motion-intro>Contact &amp; booking</p>
      <h1 id="contact-title" aria-label="Let’s make something move.">
        <span class="editorial-line" aria-hidden="true"><span data-motion-line>Let’s make</span></span>
        <span class="editorial-line" aria-hidden="true"><span data-motion-line>something <em>move.</em></span></span>
      </h1>
      <div data-motion-intro>
        <p class="lede">
          For a show, a session, a lesson, or a new collaboration, reach Sergio directly.
        </p>
        <div class="contact-links">
          <a class="email-link" href={`mailto:${email}`}>{email}</a>
          <a class="whatsapp-link" href="https://wa.me/16173127090">WhatsApp</a>
        </div>
      </div>
    </div>
    <figure class="portrait" data-motion-reveal>
      <div class="editorial-media editorial-crop">
        <img
          src="/images/contact-portrait.webp" width="2000" height="1334" srcset="/images/contact-portrait-768.webp 768w, /images/contact-portrait-1280.webp 1280w, /images/contact-portrait.webp 2000w" sizes="(max-width: 768px) 89vw, 42vw"
          alt="Portrait of Sergio Bellotti with a gold cymbal by the rocks"
          fetchpriority="high"
        />
      </div>
      <figcaption class="editorial-caption">Sergio Bellotti · Artist portrait</figcaption>
    </figure>
  </section>

  <section class="inquiries section-layout" aria-labelledby="inquiries-title" data-motion-reveal>
    <div>
      <p class="eyebrow">Work with Sergio</p>
      <h2 id="inquiries-title">Start a conversation</h2>
    </div>
    <ul class="inquiry-list">
      {#each inquiries as inquiry (inquiry.subject)}
        <li data-motion-reveal>
          <h3><a href={emailFor(inquiry.subject)}>{inquiry.title}</a></h3>
          <p>{inquiry.description}</p>
        </li>
      {/each}
    </ul>
  </section>

  <section class="press section-layout" aria-labelledby="press-title" data-motion-reveal>
    <div>
      <p class="eyebrow">For presenters and media</p>
      <h2 id="press-title">Press resources</h2>
    </div>
    <div class="press-copy">
      <p>Get high-resolution promotional photos from the official press page, or email Sergio for the latest kit.</p>
      <div class="press-links">
        <a href="https://www.sergiobellotti.com/e-press-kit">Official press page</a>
        <a href={emailFor('Press kit request')}>Request the press kit</a>
      </div>
    </div>
  </section>
</div>

<style>
  .contact {
    --contact-ink: var(--text, #f1eae0);
    --contact-muted: var(--text-muted, #bfb5a9);
    --contact-gold: var(--accent, #deb079);
    --contact-border: color-mix(in srgb, var(--contact-ink) 18%, transparent);
    --contact-gutter: clamp(1.25rem, 5vw, 5rem);
    max-inline-size: 92rem;
    margin-inline: auto;
    padding-inline: var(--contact-gutter);
    color: var(--contact-ink);
  }

  .intro {
    display: grid;
    grid-template-columns: minmax(0, 1.15fr) minmax(0, 0.85fr);
    align-items: center;
    gap: clamp(2rem, 6vw, 6rem);
    padding-block: clamp(4rem, 10vw, 9rem) clamp(4rem, 9vw, 8rem);
  }

  .eyebrow {
    margin: 0 0 1.25rem;
    color: var(--contact-gold);
    font-size: 0.875rem;
    font-weight: 650;
    line-height: 1.45;
    letter-spacing: 0.12em;
    text-transform: uppercase;
  }

  h1,
  h2,
  h3 {
    margin: 0;
    font-family: var(--display, sans-serif);
  }

  h1 {
    font-size: clamp(3.75rem, 7.25vw, 8.5rem);
    font-weight: 400;
    line-height: 0.92;
    letter-spacing: -0.065em;
  }

  h1 em {
    color: var(--contact-gold);
    font-weight: inherit;
    font-style: normal;
  }

  .lede,
  .press-copy p,
  .inquiry-list p {
    color: var(--contact-muted);
    line-height: 1.65;
  }

  .lede {
    max-inline-size: 34ch;
    margin: 1.75rem 0 0;
    font-size: clamp(1rem, 1.7vw, 1.25rem);
  }

  .contact-links,
  .press-links {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.75rem 1.5rem;
  }

  .contact-links {
    margin-block-start: 2rem;
  }

  .contact-links a,
  .press-links a {
    display: inline-flex;
    align-items: center;
    min-block-size: 2.75rem;
  }

  .email-link {
    max-inline-size: 100%;
    padding: 0.6em 1.15em;
    border-radius: 100vmax;
    background: var(--contact-gold);
    color: #17110c;
    font-weight: 700;
    line-height: 1.35;
    text-decoration: none;
    overflow-wrap: anywhere;
  }

  .email-link:hover {
    background: color-mix(in srgb, var(--contact-gold), #ffffff 18%);
  }

  .whatsapp-link,
  .press-links a {
    color: var(--contact-ink);
    text-decoration: underline;
    text-decoration-color: var(--contact-gold);
    text-underline-offset: 0.35em;
  }

  .portrait {
    --crop-ratio: 5 / 4;
    --subject-position: 34% top;
    --editorial-muted: var(--contact-muted);
    --editorial-rule: var(--contact-border);
  }

  .section-layout {
    display: grid;
    grid-template-columns: minmax(0, 0.85fr) minmax(0, 1.15fr);
    align-items: start;
    gap: clamp(2rem, 6vw, 6rem);
    padding-block: clamp(2.75rem, 6vw, 5rem);
    border-block-start: 1px solid var(--contact-border);
  }

  h2 {
    max-inline-size: 12ch;
    font-size: clamp(2.35rem, 4.35vw, 4.75rem);
    font-weight: 650;
    line-height: 0.98;
    letter-spacing: -0.055em;
  }

  .inquiry-list {
    display: grid;
    gap: 0;
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .inquiry-list li {
    padding-block: 1rem;
    border-block-start: 1px solid var(--contact-border);
  }

  .inquiry-list li:first-child {
    padding-block-start: 0;
    border-block-start: 0;
  }

  .inquiry-list h3 {
    font-size: clamp(1.3rem, 2vw, 1.7rem);
    font-weight: 650;
    line-height: 1.2;
  }

  .inquiry-list a {
    display: inline-flex;
    align-items: center;
    min-block-size: 2.75rem;
    color: var(--contact-ink);
    text-decoration: underline;
    text-decoration-color: var(--contact-gold);
    text-underline-offset: 0.27em;
  }

  .press-copy p,
  .inquiry-list p {
    max-inline-size: 57ch;
    margin: 0.15rem 0 0;
  }

  .press-links {
    margin-block-start: 0.7rem;
  }

  .press {
    padding-block-end: clamp(4rem, 8vw, 7rem);
  }

  @media (max-width: 48rem) {
    .intro,
    .section-layout {
      grid-template-columns: 1fr;
    }

    .intro {
      gap: 2.35rem;
    }

    .portrait {
      --crop-ratio: 4 / 3;
    }

    h1 {
      font-size: clamp(2.65rem, 11.4vw, 5.5rem);
    }

    h2 {
      max-inline-size: 18ch;
    }
  }
</style>
