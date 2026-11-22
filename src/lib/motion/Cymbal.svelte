<script lang="ts">
  import WaveformIcon from 'phosphor-svelte/lib/WaveformIcon'
  import { onMount } from 'svelte'
  import { createCymbal } from './cymbal'
  import { createCymbalAudio } from './cymbal-audio'

  const id = $props.id()
  const audio = createCymbalAudio()
  const grooveRadii = Array.from({ length: 52 }, (_, i) => 56 + i * 4.45)
  const rays = [14, 38, 76, 109, 145, 176, 212, 249, 288, 320, 345]

  let canvas: HTMLCanvasElement
  let renderer: ReturnType<typeof createCymbal>
  let hasWebGl = $state(false)
  let strikeNumber = $state(0)

  onMount(() => {
    renderer = createCymbal(canvas, (ready) => { hasWebGl = ready })
    return () => {
      renderer?.destroy()
      audio.destroy()
    }
  })

  function aim(event: PointerEvent) {
    if (!renderer || event.pointerType === 'touch') return

    const bounds = (event.currentTarget as HTMLElement).getBoundingClientRect()
    renderer.point(
      2 * (event.clientX - bounds.left) / bounds.width - 1,
      2 * (event.clientY - bounds.top) / bounds.height - 1
    )
  }

  function strike() {
    strikeNumber += 1
    renderer?.strike()
    audio.strike()
  }
</script>

<div class="instrument">
  <div
    class="instrument-stage"
    role="presentation"
    aria-hidden="true"
    onpointermove={aim}
    onpointerleave={() => renderer?.point(0, 0)}
  >
    <div class="shadow"></div>

    {#if strikeNumber}
      {#key strikeNumber}
        <div class="strike-effects back">
          <i></i><i></i><i></i>
        </div>
      {/key}
    {/if}

    <svg class="cymbal-fallback" class:replaced={hasWebGl} viewBox="0 0 660 456" aria-hidden="true">
      <defs>
        <linearGradient id={`${id}-metal`} x1="0" y1="0" x2="1" y2="0.82">
          <stop offset="0" stop-color="#321709" />
          <stop offset=".18" stop-color="#805020" />
          <stop offset=".36" stop-color="#efad55" />
          <stop offset=".52" stop-color="#ad6529" />
          <stop offset=".72" stop-color="#65401c" />
          <stop offset=".91" stop-color="#c18644" />
          <stop offset="1" stop-color="#eac08c" />
        </linearGradient>
        <radialGradient id={`${id}-reflection`} cx=".28" cy=".14" r=".75">
          <stop offset="0" stop-color="#fff0c5" stop-opacity=".9" />
          <stop offset=".2" stop-color="#e9ba80" stop-opacity=".66" />
          <stop offset=".53" stop-color="#b78135" stop-opacity=".12" />
          <stop offset="1" stop-color="#0e0806" stop-opacity=".42" />
        </radialGradient>
        <linearGradient id={`${id}-bell`} x1="0" y1="0" x2=".68" y2="1">
          <stop offset="0" stop-color="#fff0c8" />
          <stop offset=".24" stop-color="#cb883b" />
          <stop offset=".52" stop-color="#75461d" />
          <stop offset=".73" stop-color="#4d2c13" />
          <stop offset=".94" stop-color="#c18c50" />
          <stop offset="1" stop-color="#e8ae64" />
        </linearGradient>
        <pattern id={`${id}-hammer`} width="18" height="13" patternUnits="userSpaceOnUse">
          <path d="M1 1c6-3 10 1 9 5s-7 6-9 2 0-7 0-7M13 9c2-3 5-1 5 1s-6 4-5-1" fill="#3a1e0b" fill-opacity=".25" />
          <path d="M2 5c1-2 5-4 7-2m4 6 3-1" fill="none" stroke="#fbd194" stroke-opacity=".32" stroke-width=".6" />
        </pattern>
      </defs>
      <g transform="translate(329 224) rotate(-9)">
        <ellipse cx="0" cy="7" rx="288" ry="176" fill="#2a150b" />
        <ellipse cx="0" cy="0" rx="291" ry="176" fill={`url(#${id}-metal)`} />
        <ellipse cx="0" cy="0" rx="290" ry="175" fill={`url(#${id}-reflection)`} />
        <ellipse cx="0" cy="0" rx="288" ry="172" fill={`url(#${id}-hammer)`} opacity=".46" />
        {#each grooveRadii as radius, index (radius)}
          <ellipse cx="0" cy="0" rx={radius} ry={radius * 0.598} fill="none"
            stroke={index % 4 === 0 ? '#271007' : '#ffd294'}
            stroke-width={index % 4 === 0 ? '1.45' : '0.75'} opacity={index % 4 === 0 ? '.37' : '.29'} />
        {/each}
        <ellipse rx="289" ry="174" fill="none" stroke="#edbb77" stroke-width="1.5" opacity=".85" />
        <path d="M-73-4C-52-16-42-53-5-59 31-62 42-20 73-4c14 9 7 25-10 32C27 43-35 43-63 26-80 16-83 5-73-4Z"
          fill={`url(#${id}-bell)`} stroke="#c89454" stroke-width=".8" />
        <path d="M-67 20c35 17 106 18 135-5M-57 22c37 17 83 14 113-1M-48 31c31 10 63 9 89-1"
          fill="none" stroke="#e6ae64" stroke-opacity=".29" stroke-width="1" />
        <ellipse cx="-5" cy="-45" rx="8" ry="5.3" fill="#160d07" stroke="#f3c47c" stroke-width="2" />
      </g>
    </svg>

    <canvas bind:this={canvas} class:visible={hasWebGl} aria-hidden="true"></canvas>

    {#if strikeNumber}
      {#key strikeNumber}
        <div class="strike-effects front">
          <i></i>
          {#each rays as angle, index (angle)}
            <b style:--ray={`${angle}deg`} style:--spark-delay={`${(index % 4) * 21}ms`}></b>
          {/each}
        </div>
      {/key}
    {/if}
  </div>

  <button type="button" onclick={strike}>
    <WaveformIcon size={18} weight="regular" aria-hidden="true" />
    Strike the cymbal
  </button>
</div>

<style>
  .instrument {
    inline-size: 100%;
    display: grid;
    justify-items: center;
  }

  .instrument-stage {
    inline-size: 100%;
    aspect-ratio: 660 / 456;
    isolation: isolate;
    position: relative;
    overflow: hidden;
  }

  .shadow {
    position: absolute;
    inset: 30% 3% 2%;
    border-radius: 50%;
    background: radial-gradient(ellipse at 49% 50%, #070402 16%, rgb(9 4 1 / .76) 34%, transparent 66%);
    transform: rotate(-7deg);
    opacity: .8;
  }

  canvas, .cymbal-fallback, .strike-effects {
    position: absolute;
    inset: 0;
    inline-size: 100%;
    block-size: 100%;
    pointer-events: none;
  }

  canvas {
    visibility: hidden;
  }

  canvas.visible {
    visibility: visible;
  }

  .cymbal-fallback.replaced {
    visibility: hidden;
  }

  .strike-effects i {
    position: absolute;
    inset: 50% auto auto 50%;
    display: block;
    inline-size: 67%;
    aspect-ratio: 1.53;
    border: 1px solid rgb(255 194 101 / .92);
    border-radius: 50%;
    box-shadow: 0 0 1.1rem rgb(230 139 43 / .34), inset 0 0 .9rem rgb(230 139 43 / .5);
    animation: resonance .92s cubic-bezier(.14, .56, .35, 1) both;
  }

  .strike-effects i:nth-child(2) {
    animation-delay: 70ms;
  }

  .strike-effects i:nth-child(3) {
    animation-delay: 140ms;
  }

  .front i {
    inline-size: 50%;
    border-color: rgb(255 220 158 / .72);
    mix-blend-mode: screen;
    animation-duration: .56s;
  }

  .strike-effects b {
    position: absolute;
    inset: 50% auto auto 50%;
    inline-size: clamp(2rem, 18%, 9rem);
    block-size: 1px;
    background: linear-gradient(90deg, transparent 70%, #e6a460);
    transform-origin: left center;
    animation: spark .74s cubic-bezier(.09,.57,.32,1) var(--spark-delay) both;
  }

  button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: .65rem;
    min-block-size: 45px;
    padding: .55rem 1rem;
    color: #f2d7ac;
    background: #222018;
    border: 1px solid #785a35;
    border-radius: 100vmax;
    font: inherit;
    font-size: .86rem;
    line-height: 1.15;
    cursor: pointer;
    transition: background-color .2s, border-color .2s;
  }

  button:hover, button:active {
    border-color: #f2b564;
    background: #352413;
  }

  button:focus-visible {
    outline: 2px solid #f2b564;
    outline-offset: .3rem;
  }

  @keyframes resonance {
    from { transform: translate(-50%, -50%) rotate(-9deg) scale(.2); opacity: .94; }
    35% { opacity: .71; }
    to { transform: translate(-50%, -50%) rotate(-9deg) scale(1.6); opacity: 0; }
  }

  @keyframes spark {
    from { transform: rotate(var(--ray)) translateX(15%) scaleX(.06); opacity: .94; }
    to { transform: rotate(var(--ray)) translateX(240%) scaleX(.75); opacity: 0; }
  }

  @media (prefers-reduced-motion: reduce) {
    .strike-effects { display: none; }
    button { transition: none; }
  }
</style>
