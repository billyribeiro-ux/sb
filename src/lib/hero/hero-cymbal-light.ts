export interface CymbalGeometry {
  /** Cymbal centre and radius as fractions of the poster: x and r of its width, y of its height. */
  x: number;
  y: number;
  r: number;
}

export interface CymbalOrigin {
  x: number;
  y: number;
  r: number;
}

/** The bronze cymbal in the studio opening poster. */
export const studioCymbal: CymbalGeometry = { x: 920 / 1920, y: 870 / 1080, r: 392 / 1920 };

const frameInterval = 1000 / 30;
const ringDuration = 1.6;
const resizeSettle = 120;

const vertexSource = `
  attribute vec2 aPosition;
  varying vec2 vUv;

  void main() {
    vUv = aPosition * 0.5 + 0.5;
    gl_Position = vec4(aPosition, 0.0, 1.0);
  }
`

// A light pass over the cymbal in the poster. The shader samples the photograph through the same
// cover transform the browser uses for the still, so the bronze itself decides where light lands.
const fragmentSource = `
  #ifdef GL_FRAGMENT_PRECISION_HIGH
  precision highp float;
  #else
  precision mediump float;
  #endif

  varying vec2 vUv;
  uniform sampler2D uPhoto;
  uniform vec2 uSize;
  uniform vec4 uImage;
  uniform vec2 uCenter;
  uniform float uRadius;
  uniform vec2 uLight;
  uniform float uSweep;
  uniform float uStrike;
  uniform float uLevel;
  uniform float uStill;

  float gaussian(float value) { return exp(-value * value); }
  float tone(vec3 color) { return dot(color, vec3(0.2126, 0.7152, 0.0722)); }

  // Luminance slope of the poster along a direction: the hammered relief turning toward the light.
  float slope(vec2 imageUv, vec2 direction, float reach) {
    vec2 stride = direction * reach / uImage.zw;
    return tone(texture2D(uPhoto, imageUv + stride).rgb) - tone(texture2D(uPhoto, imageUv - stride).rgb);
  }

  void main() {
    vec2 frag = vec2(vUv.x, 1.0 - vUv.y) * uSize;
    vec2 p = (frag - uCenter) / uRadius;
    float dist = length(p);

    // The kit hides the lower half of the cymbal, so only its upper arc is lit.
    float arc = 1.0 - smoothstep(-0.36, -0.1, p.y);
    float inside = 1.0 - smoothstep(0.93, 1.0, dist);

    vec2 imageUv = (frag - uImage.xy) / uImage.zw;
    vec3 photo = texture2D(uPhoto, imageUv).rgb;
    float shade = tone(photo);
    float bronze = arc * inside * mix(0.5, smoothstep(0.22, 0.44, shade), uStill);
    float edge = arc * mix(0.5, smoothstep(0.12, 0.3, shade), uStill);

    vec2 toLight = uLight - frag;
    vec2 toward = toLight / max(length(toLight), 0.0001);
    float relief = 1.0 - exp(-9.0 * (max(0.0, slope(imageUv, toward, 1.0)) + max(0.0, slope(imageUv, toward, 3.0)) * 1.4));

    // Resting edge light, brighter on the side that faces the light.
    float facing = max(0.0, dot(p / max(dist, 0.0001), toward));
    float rim = gaussian((dist - 0.962) / 0.024) * edge * (0.42 + 0.58 * facing);
    float halo = gaussian((dist - 1.0) / 0.14) * arc * 0.09;

    // A pool of light that follows the pointer and lifts the darker bronze.
    vec2 poolAt = clamp((uLight - uCenter) / uRadius, vec2(-0.7), vec2(0.7));
    poolAt.y = min(poolAt.y, -0.25);
    float pool = gaussian(length(p - poolAt) / 0.5) * bronze * (0.3 + 0.7 * (1.0 - shade)) * 0.34;

    // One reflection travelling across the disc while the title settles.
    float band = gaussian((dot(p, vec2(0.8, -0.6)) - mix(-1.25, 1.25, uSweep)) / 0.19);
    float sweep = band * sin(uSweep * 3.14159265) * bronze * (0.22 + 0.9 * relief) * 0.8;

    // A strike sends a wave out through the metal and sets the edge trembling.
    float since = max(uStrike, 0.0);
    float ringing = step(0.0, uStrike);
    float settled = 1.0 - pow(1.0 - min(since / 1.25, 1.0), 3.0);
    float wave = gaussian((dist - (0.08 + 1.6 * settled)) / 0.085);
    float echo = gaussian((dist - (0.02 + 1.25 * settled)) / 0.24) * 0.4;
    float flare = gaussian(length(p - vec2(0.0, -0.3)) / (0.18 + since * 0.8)) * exp(-since * 9.0);
    float tremble = 1.0 + 0.75 * sin(since * 57.0) * exp(-since * 1.7) * ringing;
    float strike = ringing * ((wave * arc * (0.25 + 0.75 * relief) + echo * bronze * 0.5) * exp(-since * 2.1) * 0.85 + flare * 1.2);

    float light = (rim * tremble + halo) * 0.8 + pool + sweep + strike + relief * bronze * 0.07;
    float alpha = clamp(light, 0.0, 1.0) * uLevel;

    vec3 warm = vec3(1.0, 0.86, 0.64);
    vec3 white = vec3(1.0, 0.97, 0.9);
    vec3 color = mix(warm, white, clamp(strike * 1.4 + sweep * 1.2 + pool, 0.0, 1.0));
    gl_FragColor = vec4(color * alpha, alpha);
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
  buffer: WebGLBuffer
  texture: WebGLTexture
  program: WebGLProgram
  uniforms: {
    size: WebGLUniformLocation | null
    image: WebGLUniformLocation | null
    center: WebGLUniformLocation | null
    radius: WebGLUniformLocation | null
    light: WebGLUniformLocation | null
    sweep: WebGLUniformLocation | null
    strike: WebGLUniformLocation | null
    level: WebGLUniformLocation | null
    still: WebGLUniformLocation | null
  }
  destroy: () => void
}

function setup(gl: WebGLRenderingContext) {
  const vertex = compile(gl, gl.VERTEX_SHADER, vertexSource)
  const fragment = compile(gl, gl.FRAGMENT_SHADER, fragmentSource)
  const program = vertex && fragment ? gl.createProgram() : null
  const buffer = gl.createBuffer()
  const texture = gl.createTexture()

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
    if (program) gl.deleteProgram(program)
  }

  if (!program || !buffer || !texture || !gl.getProgramParameter(program, gl.LINK_STATUS)) {
    destroy()
    return null
  }

  const position = gl.getAttribLocation(program, 'aPosition')
  const uniforms = {
    size: gl.getUniformLocation(program, 'uSize'),
    image: gl.getUniformLocation(program, 'uImage'),
    center: gl.getUniformLocation(program, 'uCenter'),
    radius: gl.getUniformLocation(program, 'uRadius'),
    light: gl.getUniformLocation(program, 'uLight'),
    sweep: gl.getUniformLocation(program, 'uSweep'),
    strike: gl.getUniformLocation(program, 'uStrike'),
    level: gl.getUniformLocation(program, 'uLevel'),
    still: gl.getUniformLocation(program, 'uStill'),
  }
  if (position < 0 || Object.values(uniforms).some((location) => !location)) {
    destroy()
    return null
  }

  gl.useProgram(program)
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW)
  gl.enableVertexAttribArray(position)
  gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0)

  gl.bindTexture(gl.TEXTURE_2D, texture)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
  gl.uniform1i(gl.getUniformLocation(program, 'uPhoto'), 0)

  return { buffer, texture, program, uniforms, destroy }
}

function objectPosition(photo: HTMLImageElement) {
  const [x, y] = getComputedStyle(photo).objectPosition.split(/\s+/)
  return [Number.parseFloat(x) / 100 || 0, Number.parseFloat(y) / 100 || 0]
}

/** Uniform scale that the poster applies above both the canvas and the photograph. */
function posterScale(poster: HTMLElement) {
  const transform = getComputedStyle(poster).transform
  return transform === 'none' ? 1 : new DOMMatrix(transform).a || 1
}

export function createCymbalLight(canvas: HTMLCanvasElement, stage: HTMLElement, geometry: CymbalGeometry) {
  const hero = stage.closest<HTMLElement>('[data-hero-sequence]')
  const poster = canvas.closest<HTMLElement>('.hero-poster')
  const photo = stage.querySelector<HTMLImageElement>('.hero-plate img')
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)')
  const hover = window.matchMedia('(hover: hover) and (pointer: fine)')

  let gl: WebGLRenderingContext | null = null
  let resources: Resources | null = null
  let unavailable = false
  let inView = false
  let raf = 0
  let lastFrame = -Infinity
  let lastLevel = -Infinity
  let lastAim = -Infinity
  let strikeAt = -Infinity
  let sweepProgress = 0
  let level = 0
  let uploaded = false
  let backingReady = false
  let layoutDirty = true
  let resizeAfter = Infinity
  let width = 1
  let height = 1
  let layout = 1
  let image = { x: 0, y: 0, width: 1, height: 1 }
  let center = { x: 0, y: 0 }
  let radius = 1
  let pointer: { x: number; y: number } | undefined
  const light = { x: 0, y: 0 }

  // The light belongs to the title frame only: it yields to the picture once the opening is scrubbed.
  const showing = () => Boolean(hero && hero.dataset.scene === 'portrait' && !stage.hasAttribute('data-opening-scrub'))
  const wanted = () => showing() && inView && !document.hidden

  function upload() {
    if (!gl || !resources || uploaded || !photo || !photo.naturalWidth) return
    gl.bindTexture(gl.TEXTURE_2D, resources.texture)
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, photo)
    uploaded = true
    layoutDirty = true
  }

  function measure(now: number) {
    const box = canvas.getBoundingClientRect()
    if (!box.width || !box.height || !photo?.naturalWidth || !poster) return

    const density = Math.min(0.72, 1180 / box.width, 760 / box.height)
    width = Math.max(1, Math.round(box.width * density))
    height = Math.max(1, Math.round(box.height * density))
    if (!backingReady || now >= resizeAfter) {
      if (canvas.width !== width) canvas.width = width
      if (canvas.height !== height) canvas.height = height
      backingReady = true
      resizeAfter = Infinity
    }

    const scale = posterScale(poster)
    const frame = photo.getBoundingClientRect()
    layout = box.width / scale
    const fit = Math.max(frame.width / scale / photo.naturalWidth, frame.height / scale / photo.naturalHeight)
    const [x, y] = objectPosition(photo)
    const shown = { x: photo.naturalWidth * fit, y: photo.naturalHeight * fit }
    image = {
      x: (frame.left - box.left) / scale + (frame.width / scale - shown.x) * x,
      y: (frame.top - box.top) / scale + (frame.height / scale - shown.y) * y,
      width: shown.x,
      height: shown.y,
    }
    center = { x: image.x + geometry.x * image.width, y: image.y + geometry.y * image.height }
    radius = Math.max(1, geometry.r * image.width)
    layoutDirty = false
  }

  function render(now: number) {
    if (!gl || !resources) return
    upload()
    if (layoutDirty || now >= resizeAfter) measure(now)

    // With nothing to follow, the light drifts slowly along the upper arc so the bronze keeps breathing.
    const angle = motion.matches ? -2.1 : -Math.PI / 2 + Math.sin(now * 0.00016) * 1.2
    const target = pointer ?? {
      x: center.x + Math.cos(angle) * radius * 1.15,
      y: center.y + Math.sin(angle) * radius * 1.15,
    }
    const aim = motion.matches ? 1 : 1 - Math.exp(-(now - lastAim) / 110)
    const fade = motion.matches ? 1 : 1 - Math.exp(-(now - lastLevel) / 300)
    lastAim = now
    lastLevel = now
    light.x += (target.x - light.x) * aim
    light.y += (target.y - light.y) * aim
    level += ((wanted() ? 1 : 0) - level) * fade

    const scale = width / layout
    const since = (now - strikeAt) / 1000
    const { uniforms } = resources

    // The shader uses the current layout; the old backing store can scale until it settles.
    gl.viewport(0, 0, canvas.width, canvas.height)
    gl.clearColor(0, 0, 0, 0)
    gl.clear(gl.COLOR_BUFFER_BIT)
    gl.uniform2f(uniforms.size, width, height)
    gl.uniform4f(uniforms.image, image.x * scale, image.y * scale, image.width * scale, image.height * scale)
    gl.uniform2f(uniforms.center, center.x * scale, center.y * scale)
    gl.uniform1f(uniforms.radius, radius * scale)
    gl.uniform2f(uniforms.light, light.x * scale, light.y * scale)
    gl.uniform1f(uniforms.sweep, sweepProgress)
    gl.uniform1f(uniforms.strike, since >= 0 && since < ringDuration ? since : -1)
    gl.uniform1f(uniforms.level, level)
    gl.uniform1f(uniforms.still, uploaded ? 1 : 0)
    gl.drawArrays(gl.TRIANGLES, 0, 3)
  }

  function animating(now: number) {
    return (now - strikeAt) / 1000 < ringDuration || (sweepProgress > 0 && sweepProgress < 1)
  }

  function frame(now: number) {
    raf = 0
    if (!gl || !resources) return

    const goal = wanted() ? 1 : 0
    if (goal === 0 && level <= 0.004) {
      level = 0
      return
    }
    if (now - lastFrame >= frameInterval || (motion.matches && (layoutDirty || now >= resizeAfter))) {
      lastFrame = now
      render(now)
    }
    // The light keeps drifting while the title frame is on screen; a still frame only needs redrawing mid-fade.
    if ((goal === 1 && (!motion.matches || animating(now) || (uploaded && resizeAfter !== Infinity))) ||
        (level > 0 && level < 1)) raf = requestAnimationFrame(frame)
  }

  function schedule() {
    if (!raf && resources) raf = requestAnimationFrame(frame)
  }

  function start() {
    if (unavailable) return
    if (!gl) {
      try {
        gl = canvas.getContext('webgl', {
          alpha: true,
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
      uploaded = false
      backingReady = false
      layoutDirty = true
    }
    schedule()
  }

  function aim(event: PointerEvent) {
    if (!hover.matches || motion.matches || event.pointerType === 'touch') return
    const box = canvas.getBoundingClientRect()
    const scale = poster ? posterScale(poster) : 1
    pointer = { x: (event.clientX - box.left) / scale, y: (event.clientY - box.top) / scale }
    lastAim = performance.now() - frameInterval
    schedule()
  }

  function release() {
    pointer = undefined
    lastAim = performance.now() - frameInterval
    schedule()
  }

  function handleContextLoss(event: Event) {
    event.preventDefault()
    resources = null
    uploaded = false
    stop()
  }

  function handleContextRestore() {
    unavailable = false
    start()
  }

  function stop() {
    if (raf) cancelAnimationFrame(raf)
    raf = 0
  }

  function photoChanged() {
    uploaded = false
    layoutDirty = true
    schedule()
  }

  function layoutChanged() {
    layoutDirty = true
    resizeAfter = performance.now() + resizeSettle
    schedule()
  }

  const intersection = new IntersectionObserver(([entry]) => {
    inView = entry.isIntersecting
    start()
  })
  const size = new ResizeObserver(layoutChanged)
  const scene = new MutationObserver(schedule)

  intersection.observe(stage)
  size.observe(canvas)
  if (hero) scene.observe(hero, { attributes: true, attributeFilter: ['data-scene'] })
  scene.observe(stage, { attributes: true, attributeFilter: ['data-opening-scrub'] })
  stage.addEventListener('pointermove', aim, { passive: true })
  stage.addEventListener('pointerleave', release)
  photo?.addEventListener('load', photoChanged)
  document.addEventListener('visibilitychange', start)
  window.addEventListener('resize', layoutChanged)
  motion.addEventListener('change', release)
  hover.addEventListener('change', release)
  canvas.addEventListener('webglcontextlost', handleContextLoss)
  canvas.addEventListener('webglcontextrestored', handleContextRestore)
  start()

  return {
    /** Position of the opening reflection, 0 to 1. */
    sweep(progress: number) {
      if (motion.matches || progress === sweepProgress) return
      sweepProgress = progress
      schedule()
    },
    strike() {
      if (motion.matches || !wanted()) return
      strikeAt = performance.now()
      lastFrame = -Infinity
      schedule()
    },
    /** Where a strike lands, in stage pixels, while the cymbal is on screen. */
    origin(): CymbalOrigin | undefined {
      if (!photo?.naturalWidth || !wanted()) return undefined
      const shown = photo.getBoundingClientRect()
      const bounds = stage.getBoundingClientRect()
      const fit = Math.max(shown.width / photo.naturalWidth, shown.height / photo.naturalHeight)
      const [x, y] = objectPosition(photo)
      return {
        x: shown.left - bounds.left + (shown.width - photo.naturalWidth * fit) * x + geometry.x * photo.naturalWidth * fit,
        y: shown.top - bounds.top + (shown.height - photo.naturalHeight * fit) * y + geometry.y * photo.naturalHeight * fit,
        r: geometry.r * photo.naturalWidth * fit,
      }
    },
    destroy() {
      stop()
      intersection.disconnect()
      size.disconnect()
      scene.disconnect()
      stage.removeEventListener('pointermove', aim)
      stage.removeEventListener('pointerleave', release)
      photo?.removeEventListener('load', photoChanged)
      document.removeEventListener('visibilitychange', start)
      window.removeEventListener('resize', layoutChanged)
      motion.removeEventListener('change', release)
      hover.removeEventListener('change', release)
      canvas.removeEventListener('webglcontextlost', handleContextLoss)
      canvas.removeEventListener('webglcontextrestored', handleContextRestore)
      resources?.destroy()
      resources = null
      gl?.getExtension('WEBGL_lose_context')?.loseContext()
      gl = null
    },
  }
}
