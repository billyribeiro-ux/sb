<script lang="ts">
  import ArrowCounterClockwiseIcon from 'phosphor-svelte/lib/ArrowCounterClockwiseIcon';
  import { landPaths } from './north-atlantic-land';
  import { cities, mapHeight, mapWidth, meridians, parallels, project, routePath } from './journey-geography';

  const id = $props.id();
  const places = cities.map((city) => ({ ...city, ...project(city) }));
  let replayRoute = $state<() => void>();

  function mountMap(node: HTMLDivElement) {
    const line = node.querySelector<SVGPathElement>('[data-journey-line]');
    const tracer = node.querySelector<SVGCircleElement>('[data-journey-tracer]');
    if (!line || !tracer || !('IntersectionObserver' in window)) return;

    const motion = matchMedia('(prefers-reduced-motion: no-preference)');
    const length = line.getTotalLength();
    let frame = 0;

    const draw = (progress: number) => {
      const point = line.getPointAtLength(length * progress);
      line.style.strokeDashoffset = String(1 - progress);
      tracer.setAttribute('cx', String(point.x));
      tracer.setAttribute('cy', String(point.y));
    };

    function play() {
      if (!motion.matches) return;
      observer.disconnect();
      cancelAnimationFrame(frame);
      node.dataset.mapState = 'playing';
      draw(0);
      const start = performance.now();

      function advance(time: number) {
        const fraction = Math.min(1, (time - start) / 2200);
        draw((1 - Math.cos(Math.PI * fraction)) / 2);
        if (fraction < 1) frame = requestAnimationFrame(advance);
        else node.dataset.mapState = 'complete';
      }

      frame = requestAnimationFrame(advance);
    }

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.intersectionRatio >= 0.4) play();
    }, { threshold: 0.4 });

    function updatePreference() {
      observer.disconnect();
      cancelAnimationFrame(frame);
      replayRoute = motion.matches ? play : undefined;
      node.dataset.mapState = motion.matches ? 'ready' : 'static';
      draw(motion.matches ? 0 : 1);
      if (motion.matches) observer.observe(node);
    }

    motion.addEventListener('change', updatePreference);
    updatePreference();

    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
      motion.removeEventListener('change', updatePreference);
    };
  }
</script>

<section class="journey" aria-labelledby={`${id}-heading`}>
  <div class="editorial-shell">
    <header class="journey-heading" data-motion-reveal>
      <div>
        <p class="editorial-kicker">1995 · Italy to Massachusetts</p>
        <h2 id={`${id}-heading`}>Across the Atlantic.</h2>
      </div>
      <p>Sergio left Bari for Boston to study at Berklee College of Music. The move brought him into the city’s jazz scene and set the course for his work as a performer and teacher.</p>
    </header>

    <figure class="journey-figure">
      <div class="map-frame" data-journey-map data-map-state="static" {@attach mountMap}>
        <svg viewBox={`0 0 ${mapWidth} ${mapHeight}`} role="img" aria-labelledby={`${id}-map-title`}>
          <title id={`${id}-map-title`}>Bari, Italy, and Boston, Massachusetts, connected across the Atlantic Ocean</title>
          <defs>
            <radialGradient id={`${id}-sea`} cx="51%" cy="36%" r="71%">
              <stop stop-color="#1b242a" />
              <stop offset="1" stop-color="#101417" />
            </radialGradient>
            <linearGradient id={`${id}-land`} x1="0" y1="0" x2="0" y2="1">
              <stop stop-color="#374246" />
              <stop offset="1" stop-color="#252d31" />
            </linearGradient>
          </defs>
          <rect width={mapWidth} height={mapHeight} fill={`url(#${id}-sea)`} />
          <g class="graticule" aria-hidden="true">
            {#each meridians as x (x)}<path d={`M${x} 0V${mapHeight}`} />{/each}
            {#each parallels as y (y)}<path d={`M0 ${y}H${mapWidth}`} />{/each}
          </g>
          <g class="coastline" fill={`url(#${id}-land)`} fill-rule="evenodd" aria-hidden="true">
            {#each landPaths as path (path)}<path d={path} />{/each}
          </g>
          <text class="ocean-label" x="510" y="405" aria-hidden="true">NORTH ATLANTIC OCEAN</text>
          <path class="route-guide" d={routePath} />
          <path class="route-trace" data-journey-line d={routePath} pathLength="1" />
          {#each places as place (place.name)}
            <circle class="pin-ring" cx={place.x} cy={place.y} r="10" />
            <circle class="pin-dot" cx={place.x} cy={place.y} r="4" />
          {/each}
          <circle class="tracer" data-journey-tracer r="5" aria-hidden="true" />
        </svg>
        {#each places as place (place.name)}
          <div class="place" aria-hidden="true" style:left={`${place.x / mapWidth * 100}%`} style:top={`${place.y / mapHeight * 100}%`}>
            <strong>{place.name}</strong>
            <span>{place.region}</span>
          </div>
        {/each}
      </div>

      <figcaption class="journey-caption">
        <span>Map data <a href="https://www.naturalearthdata.com/">Natural Earth</a> and <a href="https://www.geonames.org/">GeoNames</a></span>
        {#if replayRoute}
          <button type="button" onclick={replayRoute}><ArrowCounterClockwiseIcon size={16} aria-hidden="true" />Replay route</button>
        {/if}
      </figcaption>
    </figure>
  </div>
</section>

<style>
  .journey {
    --journey-gold: #dfb881;
    margin-top: clamp(4.75rem, 10vw, 9.5rem);
    padding-block: clamp(3rem, 6vw, 6.25rem);
    color: #f3eee8;
    background: #101416;
  }

  .journey-heading {
    display: grid;
    grid-template-columns: minmax(0, 1.4fr) minmax(0, .6fr);
    align-items: end;
    gap: 1.25rem clamp(1.8rem, 4vw, 4rem);
    margin-bottom: clamp(1.5rem, 3vw, 3rem);
  }

  .journey-heading .editorial-kicker { color: var(--journey-gold); }
  .journey-heading > p { max-width: 37ch; color: #c6c2bc; }

  .map-frame {
    position: relative;
    overflow: hidden;
    border: 1px solid #566267;
    background: #101417;
  }

  svg[role='img'] { display: block; width: 100%; height: auto; }
  .graticule { stroke: #ffffff12; stroke-width: 1; }
  .coastline { stroke: #a4ada920; stroke-width: .9; stroke-linejoin: round; }
  .ocean-label { fill: #96a0a1; font-size: 12px; letter-spacing: .34em; text-anchor: middle; }
  .route-guide, .route-trace { fill: none; stroke-linecap: round; stroke-linejoin: round; vector-effect: non-scaling-stroke; }
  .route-guide { stroke: #dfb88170; stroke-width: 1; stroke-dasharray: 3 6; }
  .route-trace { stroke: var(--journey-gold); stroke-width: 2; stroke-dasharray: 1; }
  .pin-ring { fill: #0e1519; stroke: var(--journey-gold); stroke-width: 1.4; vector-effect: non-scaling-stroke; }
  .pin-dot { fill: var(--journey-gold); }
  .tracer { fill: #fff4df; opacity: 0; filter: drop-shadow(0 0 7px #ffcc86); }
  .map-frame:global([data-map-state='playing']) .tracer { opacity: 1; }

  .place {
    position: absolute;
    display: grid;
    justify-items: center;
    width: max-content;
    padding: .28rem .46rem;
    color: #f5f0e9;
    background: #101417eb;
    border: 1px solid #ffffff29;
    translate: -50% clamp(.5rem, 1.9vw, 1.25rem);
    line-height: 1.2;
    text-align: center;
    pointer-events: none;
  }

  .place strong { font-size: clamp(.8rem, 1.35vw, 1.2rem); font-weight: 660; }
  .place span { color: #c3c8ca; font-size: clamp(.59rem, 1vw, .72rem); }

  .journey-caption {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: .5rem 1.25rem;
    min-height: 3.35rem;
    color: #c6c2bc;
    font-size: .82rem;
  }

  .journey-caption a { text-decoration-color: var(--journey-gold); text-underline-offset: .25em; }
  .journey-caption button {
    display: inline-flex;
    align-items: center;
    gap: .45rem;
    min-height: 2.75rem;
    padding: .25rem 0 .25rem .4rem;
    color: var(--journey-gold);
    background: transparent;
    border: 0;
    cursor: pointer;
  }

  .journey-caption button:hover { text-decoration: underline; text-underline-offset: .25em; }
  .journey-caption :is(button, a):focus-visible { outline-color: var(--journey-gold); }

  @media (max-width: 48rem) {
    .journey-heading { grid-template-columns: 1fr; }
  }

  @media (max-width: 35rem) {
    .ocean-label { display: none; }
  }
</style>
