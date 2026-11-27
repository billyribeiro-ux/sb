type Picture = HTMLVideoElement | HTMLImageElement

export interface FilmLook {
  exposure: number
  saturation: number
}

/** A moving picture that the still hides until the visitor looks for it. */
export interface FilmLive {
  source: string
  /** Seconds of the source to play before it starts over. */
  until: number
  /** Whether the still this canvas grades is the picture on screen right now. */
  showing: () => boolean
}

export interface FilmGradeOptions {
  live?: FilmLive
}

export interface FilmGrade {
  /** Cross-fades the frame to or from a brand-colour print: 1 is a full amber print, 0 is the finished grade. */
  washTo: (amount: number, duration: number) => void
  destroy: () => void
}

const frameInterval = 1000 / 24
const resizeSettle = 120
const slicePass = 1700
const sliceInterval = 7600
// Where each slice waits when it is out of the picture, and how long it follows the one before it.
const slices = [{ out: -.44, wait: 0 }, { out: .38, wait: 70 }, { out: -.3, wait: 150 }]

const vertexSource = `
  attribute vec2 aPosition;
  varying vec2 vUv;

  void main() {
    vUv = aPosition * 0.5 + 0.5;
    gl_Position = vec4(aPosition, 0.0, 1.0);
  }
`

// One pass of film finishing over a picture: lens, halation, a print curve, split tone, grain.
const fragmentSource = `
  #ifdef GL_FRAGMENT_PRECISION_HIGH
  precision highp float;
  #else
  precision mediump float;
  #endif

  varying vec2 vUv;
  uniform sampler2D uPicture;
  uniform sampler2D uLive;
  uniform vec2 uSize;
  uniform vec4 uRect;
  uniform float uTime;
  uniform float uExposure;
  uniform float uSaturation;
  uniform float uWash;
  uniform float uLiveReady;
  uniform vec3 uSlide;
  uniform float uPointer;

  float hash(vec2 point) { return fract(sin(dot(point, vec2(127.1, 311.7))) * 4375.585); }
  float luma(vec3 color) { return dot(color, vec3(0.2126, 0.7152, 0.0722)); }
  vec3 picture(vec2 uv) { return texture2D(uPicture, uv).rgb; }

  // The print itself: exposure, a shoulder on the highlights, lifted blacks, split tone, grain and the lens.
  vec3 print(vec3 color, vec2 middle, vec2 frag, float time) {
    color *= uExposure * 1.04;
    color = mix(color, 1.0 - exp(-color * 1.42), 0.6);
    color = mix(color, smoothstep(0.0, 1.0, color), 0.5);
    color = color * 0.955 + vec3(0.020, 0.024, 0.034);

    float light = luma(color);
    color += (1.0 - smoothstep(0.0, 0.5, light)) * vec3(-0.016, 0.004, 0.034);
    color += smoothstep(0.45, 1.0, light) * vec3(0.034, 0.012, -0.026);
    color = mix(vec3(luma(color)), color, uSaturation * 1.14);

    float grain = hash(frag + floor(mod(time, 60.0) * 24.0) * 17.13) - 0.5;
    color += grain * 0.075 * (1.3 - smoothstep(0.0, 0.85, luma(color)));
    color *= 1.0 - 0.3 * dot(middle, middle) * 2.5;
    return color;
  }

  void main() {
    vec2 frag = vec2(vUv.x, 1.0 - vUv.y) * uSize;
    vec2 uv = (frag - uRect.xy) / uRect.zw;
    vec2 middle = uv - 0.5;

    // Lens: red and blue part company toward the corners.
    vec2 spread = middle * dot(middle, middle) * 0.006;
    vec3 color = vec3(picture(uv + spread).r, picture(uv).g, picture(uv - spread).b);

    // Halation: bright light bleeds a warm halo into the film around it.
    vec2 reach = vec2(0.009, 0.016);
    vec3 glow = picture(uv + reach) + picture(uv - reach)
              + picture(uv + vec2(reach.x, -reach.y)) + picture(uv + vec2(-reach.x, reach.y))
              + picture(uv + vec2(reach.x, 0.0)) + picture(uv + vec2(-reach.x, 0.0))
              + picture(uv + vec2(0.0, reach.y)) + picture(uv + vec2(0.0, -reach.y));
    glow += picture(uv + reach * 2.4) + picture(uv - reach * 2.4)
          + picture(uv + vec2(reach.x, -reach.y) * 2.4) + picture(uv + vec2(-reach.x, reach.y) * 2.4);
    color += max(glow / 12.0 - 0.58, 0.0) * vec3(1.0, 0.62, 0.42) * 0.9;

    color = print(color, middle, frag, uTime);

    // The still comes alive: three slices of the moving picture around the pointer, each slid in from its own side.
    if (uLiveReady > 0.5) {
      vec3 moving = vec3(0.0);
      float cover = 0.0;
      for (int band = 0; band < 3; band++) {
        float index = float(band);
        float centre = index < 0.5 ? -0.082 : (index < 1.5 ? 0.0 : 0.088);
        float breadth = index < 0.5 ? 0.024 : (index < 1.5 ? 0.04 : 0.02);
        float slide = index < 0.5 ? uSlide.x : (index < 1.5 ? uSlide.y : uSlide.z);
        // Torn edges: each slice sits a little lower on alternating columns.
        float tear = step(0.5, fract(uv.x * 26.0 + index * 0.37)) * 0.004;
        float offset = (frag.y - uPointer) / uSize.y - centre + tear;
        float weight = 1.0 - smoothstep(0.78, 1.0, abs(offset) / breadth);
        vec2 liveUv = vec2(uv.x - slide, uv.y);
        weight *= step(0.0, liveUv.x) * step(liveUv.x, 1.0);
        moving += print(texture2D(uLive, clamp(liveUv, 0.0, 1.0)).rgb, middle, frag, uTime + index) * weight;
        cover += weight;
      }
      color = mix(color, moving / max(cover, 0.0001), clamp(cover, 0.0, 1.0));
    }

    // Arrival: the frame opens as a brand-colour print and resolves into the grade.
    vec3 amber = mix(vec3(0.09, 0.05, 0.02), vec3(0.97, 0.79, 0.54), smoothstep(0.0, 1.0, luma(color)));
    color = mix(color, amber, uWash);

    gl_FragColor = vec4(clamp(color, 0.0, 1.0), 1.0);
  }
`

function compile(gl: WebGLRenderingContext, stage: number, source: string) {
  const shader = gl.createShader(stage)
  if (!shader) return null

  gl.shaderSource(shader, source)
  gl.compileShader(shader)
  if (gl.getShaderParameter(shader, gl.COMPILE_STATUS)) return shader

  gl.deleteShader(shader)
  return null
}

interface Resources {
  texture: WebGLTexture
  live: WebGLTexture
  program: WebGLProgram
  uniforms: {
    size: WebGLUniformLocation | null
    rect: WebGLUniformLocation | null
    time: WebGLUniformLocation | null
    exposure: WebGLUniformLocation | null
    saturation: WebGLUniformLocation | null
    wash: WebGLUniformLocation | null
    live: WebGLUniformLocation | null
    liveReady: WebGLUniformLocation | null
    slide: WebGLUniformLocation | null
    pointer: WebGLUniformLocation | null
  }
  destroy: () => void
}

function setup(gl: WebGLRenderingContext) {
  const vertex = compile(gl, gl.VERTEX_SHADER, vertexSource)
  const fragment = compile(gl, gl.FRAGMENT_SHADER, fragmentSource)
  const program = vertex && fragment ? gl.createProgram() : null
  const buffer = gl.createBuffer()
  const texture = gl.createTexture()
  const live = gl.createTexture()

  if (program && vertex && fragment) {
    gl.attachShader(program, vertex)
    gl.attachShader(program, fragment)
    gl.linkProgram(program)
  }
  if (vertex) gl.deleteShader(vertex)
  if (fragment) gl.deleteShader(fragment)

  function destroy() {
    if (buffer) gl.deleteBuffer(buffer)
    if (texture) gl.deleteTexture(texture)
    if (live) gl.deleteTexture(live)
    if (program) gl.deleteProgram(program)
  }

  if (!program || !buffer || !texture || !live || !gl.getProgramParameter(program, gl.LINK_STATUS)) {
    destroy()
    return null
  }

  const position = gl.getAttribLocation(program, 'aPosition')
  const uniforms = {
    size: gl.getUniformLocation(program, 'uSize'),
    rect: gl.getUniformLocation(program, 'uRect'),
    time: gl.getUniformLocation(program, 'uTime'),
    exposure: gl.getUniformLocation(program, 'uExposure'),
    saturation: gl.getUniformLocation(program, 'uSaturation'),
    wash: gl.getUniformLocation(program, 'uWash'),
    live: gl.getUniformLocation(program, 'uLive'),
    liveReady: gl.getUniformLocation(program, 'uLiveReady'),
    slide: gl.getUniformLocation(program, 'uSlide'),
    pointer: gl.getUniformLocation(program, 'uPointer'),
  }
  const picture = gl.getUniformLocation(program, 'uPicture')
  if (position < 0 || !picture || Object.values(uniforms).some((location) => !location)) {
    destroy()
    return null
  }

  gl.useProgram(program)
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW)
  gl.enableVertexAttribArray(position)
  gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0)

  for (const [unit, name, target] of [[gl.TEXTURE0, picture, texture], [gl.TEXTURE1, uniforms.live, live]] as const) {
    gl.activeTexture(unit)
    gl.bindTexture(gl.TEXTURE_2D, target)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
    gl.uniform1i(name, unit === gl.TEXTURE0 ? 0 : 1)
  }
  gl.activeTexture(gl.TEXTURE0)

  return { texture, live, program, uniforms, destroy }
}

function dimensions(source: Picture): [number, number] {
  return 'videoWidth' in source
    ? [source.videoWidth, source.videoHeight]
    : [source.naturalWidth, source.naturalHeight];
}

/** How the browser fits the picture into its box, so the grade covers it pixel for pixel. */
function placement(source: Picture, box: { width: number; height: number; picture: [number, number] }) {
  const [across, down] = getComputedStyle(source).objectPosition.split(/\s+/)
  const fit = Math.max(box.width / box.picture[0], box.height / box.picture[1])
  const shown = { x: box.picture[0] * fit, y: box.picture[1] * fit }
  return {
    x: (box.width - shown.x) * (Number.parseFloat(across) / 100 || 0),
    y: (box.height - shown.y) * (Number.parseFloat(down) / 100 || 0),
    width: shown.x,
    height: shown.y,
  }
}

const isVideo = (source: Picture): source is HTMLVideoElement => source.tagName === 'VIDEO'

/**
 * Grades one picture in place: the canvas sits over the video or still and shows the finished frame.
 * Until a graded frame exists the canvas is transparent, so the plain picture is what visitors see.
 */
export function createFilmGrade(
  canvas: HTMLCanvasElement | null,
  source: Picture | null,
  look: () => FilmLook,
  options: FilmGradeOptions = {},
): FilmGrade {
  return canvas && source ? grade(canvas, source, look, options) : { washTo() {}, destroy() {} };
}

function grade(canvas: HTMLCanvasElement, source: Picture, look: () => FilmLook, options: FilmGradeOptions): FilmGrade {
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)')
  const hoverable = window.matchMedia('(hover: hover) and (pointer: fine)')
  const stage = canvas.closest<HTMLElement>('[data-hero-stage]')
  let gl: WebGLRenderingContext | null = null
  let resources: Resources | null = null
  let unavailable = false
  let inView = false
  let raf = 0
  let lastFrame = -Infinity
  let lastTick = -Infinity
  let uploaded = -1
  let cost = 0
  let samples = 0
  let width = 1
  let height = 1
  let rect = { x: 0, y: 0, width: 1, height: 1 }
  let layoutDirty = true
  let resizeAfter = Infinity
  let wash = 0
  let washFrame = 0

  let livePlan = options.live
  let live: HTMLVideoElement | null = null
  let liveFrame = -1
  let liveReady = 0
  let liveCost = 0
  let liveOff = false
  let hovering = false
  let engaged = -1
  let seen = false
  let idleFrom = Infinity
  let idleUntil = 0
  const slide = slices.map((slice) => slice.out)
  let pointer = .62
  let pointerAim = .62

  function ready() {
    return Boolean(dimensions(source)[0]) && (!isVideo(source) || source.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA)
  }

  function measure(now: number) {
    const picture = dimensions(source)
    const box = { width: canvas.clientWidth, height: canvas.clientHeight }
    if (!picture[0] || !picture[1] || !box.width || !box.height) return

    // Resizing clears the drawing buffer. Only allocate as part of a draw and
    // keep using the existing buffer while the viewport is still changing.
    if (width === 1 || now >= resizeAfter) {
      const density = Math.min(window.devicePixelRatio || 1, 1.5, 1680 / Math.max(box.width, box.height))
      width = Math.max(1, Math.round(box.width * density))
      height = Math.max(1, Math.round(box.height * density))
      if (canvas.width !== width) canvas.width = width
      if (canvas.height !== height) canvas.height = height
      resizeAfter = Infinity
    }

    const placed = placement(source, { ...box, picture })
    const scaleX = width / box.width
    const scaleY = height / box.height
    rect = {
      x: placed.x * scaleX,
      y: placed.y * scaleY,
      width: placed.width * scaleX,
      height: placed.height * scaleY,
    }
    layoutDirty = false
  }

  /** The moving picture gets a player of its own, so the film's own playback is never disturbed. */
  function startLive() {
    if (live || !livePlan) return
    live = document.createElement('video')
    live.className = 'hero-live-picture'
    live.tabIndex = -1
    live.setAttribute('aria-hidden', 'true')
    live.muted = true
    live.defaultMuted = true
    live.playsInline = true
    live.preload = 'auto'
    live.src = livePlan.source
    // Browsers only keep a picture decoding while it is in the document, so it sits unseen with the film's video.
    stage?.querySelector('[data-hero-video]')?.appendChild(live)
  }

  // Slices of the moving picture: the pointer leads them, and they breathe by themselves between visits.
  function conductSlices(now: number, seconds: number) {
    if (!livePlan || liveOff) return
    const started = performance.now()
    const showing = !motion.matches && inView && !document.hidden && !document.querySelector('dialog[open]') && livePlan.showing()

    // The title gets a moment to settle before the still breathes for the first time.
    if (showing && !seen) {
      seen = true
      idleFrom = now + 2600
    } else if (!showing) {
      seen = false
    }

    if (showing && !hovering && now >= idleFrom) {
      idleUntil = now + slicePass
      idleFrom = now + sliceInterval
      startLive()
    }
    const idle = showing && !hovering && now < idleUntil
    if (idle) pointerAim = .66 - .26 * (1 - (idleUntil - now) / slicePass)

    if (showing && (hovering || idle)) {
      if (engaged < 0) engaged = now
      startLive()
    } else engaged = -1

    pointer += (pointerAim - pointer) * (1 - Math.exp(-seconds / .09))
    let open = false
    for (const [index, slice] of slices.entries()) {
      const inward = engaged >= 0 && now >= engaged + slice.wait
      slide[index] += ((inward ? 0 : slice.out) - slide[index]) * (1 - Math.exp(-seconds / (inward ? .15 : .11)))
      open ||= Math.abs(slide[index] - slice.out) > .004
    }

    if (live) {
      if (open && showing) {
        if (live.paused) void live.play().catch(() => {})
        if (live.currentTime >= livePlan.until - .06) live.currentTime = 0
        if (gl && resources && live.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA && live.currentTime !== liveFrame) {
          gl.activeTexture(gl.TEXTURE1)
          gl.bindTexture(gl.TEXTURE_2D, resources.live)
          gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, live)
          gl.activeTexture(gl.TEXTURE0)
          liveFrame = live.currentTime
        }
      } else if (!live.paused) {
        live.pause()
        live.currentTime = 0
      }
    }
    liveReady = open && live && liveFrame >= 0 ? 1 : 0

    // Give up the slices rather than the frame rate on a machine that cannot afford them.
    const spent = performance.now() - started
    liveCost += (spent - liveCost) / Math.min(samples + 1, 30)
    if (samples > 30 && liveCost > 14) {
      liveOff = true
      live?.pause()
      liveReady = 0
    }
  }

  function draw(now: number) {
    if (!gl || !resources) return

    const { exposure, saturation } = look()
    const { uniforms } = resources
    gl.viewport(0, 0, width, height)
    gl.uniform2f(uniforms.size, width, height)
    gl.uniform4f(uniforms.rect, rect.x, rect.y, rect.width, rect.height)
    gl.uniform1f(uniforms.time, motion.matches ? 0 : now / 1000)
    gl.uniform1f(uniforms.exposure, exposure)
    gl.uniform1f(uniforms.saturation, saturation)
    gl.uniform1f(uniforms.wash, wash)
    gl.uniform1f(uniforms.liveReady, liveReady)
    gl.uniform3f(uniforms.slide, slide[0], slide[1], slide[2])
    gl.uniform1f(uniforms.pointer, pointer * height)
    gl.drawArrays(gl.TRIANGLES, 0, 3)
  }

  function tick(now: number) {
    raf = 0
    if (!gl || !resources || !inView || document.hidden) return

    const seconds = Math.min(64, now - lastTick) / 1000
    lastTick = now

    if (now - lastFrame >= frameInterval) {
      lastFrame = now
      conductSlices(now, seconds)
      const started = performance.now()
      const fresh = uploaded < 0 || (isVideo(source) && (!source.paused || source.seeking || source.currentTime !== uploaded))
      if (fresh && ready()) {
        gl.bindTexture(gl.TEXTURE_2D, resources.texture)
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source)
        uploaded = isVideo(source) ? source.currentTime : 0
      }
      if (uploaded >= 0) {
        const resizing = layoutDirty || resizeAfter !== Infinity
        if (layoutDirty || now >= resizeAfter) measure(now)
        draw(now)
        if (!resizing) {
          cost += (performance.now() - started - cost) / Math.min(samples + 1, 30)
          samples += 1
          // Layout paints do not represent steady-state rendering cost.
          if (samples > 40 && cost > 9) {
            unavailable = true
            canvas.removeAttribute('data-graded')
            return
          }
        }
        canvas.setAttribute('data-graded', '')
      }
    }

    // With motion reduced one finished frame is enough.
    if (motion.matches && uploaded >= 0 && !washFrame && resizeAfter === Infinity && !layoutDirty) return
    raf = requestAnimationFrame(tick)
  }

  function schedule() {
    if (!raf && resources) raf = requestAnimationFrame(tick)
  }

  function stop() {
    if (raf) cancelAnimationFrame(raf)
    raf = 0
  }

  function start() {
    if (unavailable || !inView || document.hidden) {
      stop()
      return
    }
    if (!gl) {
      try {
        gl = canvas.getContext('webgl', {
          alpha: false,
          antialias: false,
          depth: false,
          stencil: false,
          powerPreference: 'low-power',
          failIfMajorPerformanceCaveat: true
        })
      } catch {
        unavailable = true
        return
      }
      if (!gl) {
        unavailable = true
        return
      }
    }
    if (!resources && !gl.isContextLost()) {
      resources = setup(gl)
      if (!resources) {
        unavailable = true
        return
      }
      layoutDirty = true
    }
    schedule()
  }

  function forget() {
    uploaded = -1
    layoutDirty = true
    schedule()
  }

  function layoutChanged() {
    layoutDirty = true
    resizeAfter = performance.now() + resizeSettle
    schedule()
  }

  function aim(event: PointerEvent) {
    if (!livePlan || event.pointerType === 'touch' || !hoverable.matches) return
    const box = canvas.getBoundingClientRect()
    pointerAim = Math.min(1, Math.max(0, (event.clientY - box.top) / box.height))
    idleUntil = 0
    schedule()
  }

  function handleContextLoss(event: Event) {
    event.preventDefault()
    resources = null
    uploaded = -1
    liveFrame = -1
    canvas.removeAttribute('data-graded')
    stop()
  }

  function handleContextRestore() {
    unavailable = false
    start()
  }

  function enter(event: PointerEvent) {
    if (event.pointerType === 'touch' || !hoverable.matches) return
    hovering = true
    aim(event)
  }

  function leave() {
    hovering = false
    schedule()
  }

  const intersection = new IntersectionObserver(([entry]) => {
    inView = entry.isIntersecting
    start()
  })
  const size = new ResizeObserver(layoutChanged)

  intersection.observe(canvas)
  size.observe(canvas)
  source.addEventListener('load', forget)
  source.addEventListener('loadeddata', forget)
  source.addEventListener('resize', forget)
  source.addEventListener('seeked', schedule)
  source.addEventListener('play', schedule)
  document.addEventListener('visibilitychange', start)
  motion.addEventListener('change', schedule)
  window.addEventListener('resize', layoutChanged)
  stage?.addEventListener('pointermove', aim, { passive: true })
  stage?.addEventListener('pointerenter', enter)
  stage?.addEventListener('pointerleave', leave)
  canvas.addEventListener('webglcontextlost', handleContextLoss)
  canvas.addEventListener('webglcontextrestored', handleContextRestore)
  start()

  return {
    washTo(amount: number, duration: number) {
      cancelAnimationFrame(washFrame)
      const from = wash
      const started = performance.now()
      const step = () => {
        const time = duration > 0 ? Math.min(1, (performance.now() - started) / duration) : 1;
        wash = from + (amount - from) * (1 - Math.pow(1 - time, 3))
        schedule()
        if (time < 1) washFrame = requestAnimationFrame(step)
        else washFrame = 0
      }
      step()
    },
    destroy() {
      stop()
      cancelAnimationFrame(washFrame)
      intersection.disconnect()
      size.disconnect()
      source.removeEventListener('load', forget)
      source.removeEventListener('loadeddata', forget)
      source.removeEventListener('resize', forget)
      source.removeEventListener('seeked', schedule)
      source.removeEventListener('play', schedule)
      document.removeEventListener('visibilitychange', start)
      motion.removeEventListener('change', schedule)
      window.removeEventListener('resize', layoutChanged)
      stage?.removeEventListener('pointermove', aim)
      stage?.removeEventListener('pointerenter', enter)
      stage?.removeEventListener('pointerleave', leave)
      live?.pause()
      live?.remove()
      if (live) {
        live.removeAttribute('src')
        live.load()
      }
      canvas.removeEventListener('webglcontextlost', handleContextLoss)
      canvas.removeEventListener('webglcontextrestored', handleContextRestore)
      resources?.destroy()
      resources = null
      gl?.getExtension('WEBGL_lose_context')?.loseContext()
      gl = null
    },
  }
}
