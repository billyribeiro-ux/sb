const vertexSource = `
  attribute vec2 aPosition;
  varying mediump vec2 vPosition;

  void main() {
    vPosition = aPosition * 0.5 + 0.5;
    gl_Position = vec4(aPosition, 0.0, 1.0);
  }
`

const fragmentSource = `
  precision mediump float;
  varying mediump vec2 vPosition;
  uniform vec2 uCenter;
  uniform vec2 uPointer;
  uniform float uStrike;
  uniform float uSweep;

  float gaussian(float value) { return exp(-value * value); }

  void main() {
    // The canvas covers the lower 40 percent of the image, below the face.
    vec2 image = vec2(vPosition.x, 1.0 - vPosition.y * 0.4);
    vec2 offset = image - uCenter;
    vec2 moving = offset - uPointer * vec2(0.067, 0.018);
    float curve = moving.y + 0.61 * moving.x * moving.x + 0.23 * moving.x;
    float lengthwise = gaussian(moving.x * 4.8);
    float localization = gaussian(offset.x * 3.65) * gaussian(offset.y * 7.15);
    float underFace = smoothstep(0.65, 0.79, image.y);
    float rightFade = 1.0 - smoothstep(0.91, 0.995, image.x);
    float bottomFade = 1.0 - smoothstep(0.93, 1.0, image.y);

    float front = gaussian((curve + 0.020) * 35.0) * lengthwise;
    float back = gaussian((curve - 0.027) * 62.0) * gaussian((moving.x + 0.063) * 4.4);
    float faint = gaussian((curve + 0.067) * 42.0) * gaussian((moving.x - 0.063) * 5.45);
    float softness = gaussian((curve + 0.034) * 13.0) * lengthwise;

    float strike = max(uStrike, 0.0);
    float distanceToHit = length(vec2(offset.x, offset.y * 1.73));
    float radius = 0.014 + 0.53 * strike;
    float surge = gaussian((distanceToHit - radius) * 63.0);
    float halo = gaussian((distanceToHit - radius) * 22.0);
    float impact = (0.72 * surge + 0.27 * halo) * exp(-3.35 * strike) * step(0.0, uStrike);

    float sheen = front * 0.32 + back * 0.18 + faint * 0.075;
    float travel = mix(-0.33, 0.28, uSweep);
    float reflection = gaussian((moving.x + moving.y * 1.16 - travel) * 17.0);
    float sweep = sin(uSweep * 3.141593) * reflection * gaussian(curve * 13.0);
    float alpha = clamp((sheen + softness * 0.145 + sweep * 0.55 + impact) * localization * underFace * rightFade * bottomFade, 0.0, 1.0);
    float luminance = mix(0.66, 0.84, min(1.0, front + sweep + surge * step(0.0, uStrike)));

    gl_FragColor = vec4(vec3(luminance * alpha), alpha);
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

function setup(gl: WebGLRenderingContext) {
  const vertex = compile(gl, gl.VERTEX_SHADER, vertexSource)
  const fragment = compile(gl, gl.FRAGMENT_SHADER, fragmentSource)
  const program = vertex && fragment ? gl.createProgram() : null

  if (program && vertex && fragment) {
    gl.attachShader(program, vertex)
    gl.attachShader(program, fragment)
    gl.linkProgram(program)
  }

  if (vertex) gl.deleteShader(vertex)
  if (fragment) gl.deleteShader(fragment)
  if (!program) return null

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    gl.deleteProgram(program)
    return null
  }

  const buffer = gl.createBuffer()
  const position = gl.getAttribLocation(program, 'aPosition')
  const center = gl.getUniformLocation(program, 'uCenter')
  const pointer = gl.getUniformLocation(program, 'uPointer')
  const strike = gl.getUniformLocation(program, 'uStrike')
  const sweep = gl.getUniformLocation(program, 'uSweep')

  function destroy() {
    gl.deleteBuffer(buffer)
    gl.deleteProgram(program)
  }

  if (!buffer || position < 0 || !center || !pointer || !strike || !sweep) {
    destroy()
    return null
  }

  gl.useProgram(program)
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW)
  gl.enableVertexAttribArray(position)
  gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0)

  return { center, pointer, strike, sweep, destroy }
}

export function createHeroRimLight(canvas: HTMLCanvasElement, target: HTMLElement, onReady: (ready: boolean) => void) {
  const preference = window.matchMedia('(prefers-reduced-motion: reduce)')
  let gl: WebGLRenderingContext | null = null
  let resources: ReturnType<typeof setup> = null
  let inView = false
  let unavailable = false
  let announced = false
  let raf = 0
  let width = 0
  let height = 0
  let lastDraw = -Infinity
  let strikeAt = -Infinity
  let centerX = 0.69
  let centerY = 0.85
  let x = 0
  let y = 0
  let pointerX = 0
  let pointerY = 0
  let sweepProgress = 0

  function stop() {
    if (raf) cancelAnimationFrame(raf)
    raf = 0
  }

  function schedule() {
    if (!raf && inView && !document.hidden && resources) raf = requestAnimationFrame(draw)
  }

  function draw(now: number) {
    raf = 0
    if (!gl || !resources || !width || !height) return

    if (now - lastDraw < 24) {
      schedule()
      return
    }

    lastDraw = now
    const elapsed = (now - strikeAt) / 1000
    const ringing = !preference.matches && elapsed >= 0 && elapsed < 1.05
    x = preference.matches ? 0 : x + (pointerX - x) * 0.13
    y = preference.matches ? 0 : y + (pointerY - y) * 0.13
    gl.viewport(0, 0, canvas.width, canvas.height)
    gl.uniform2f(resources.center, centerX, centerY)
    gl.uniform2f(resources.pointer, x, y)
    gl.uniform1f(resources.strike, ringing ? elapsed : -1)
    gl.uniform1f(resources.sweep, preference.matches ? 0 : sweepProgress)
    gl.drawArrays(gl.TRIANGLES, 0, 3)

    if (!announced) {
      announced = true
      onReady(true)
    }

    const traveling = Math.abs(pointerX - x) + Math.abs(pointerY - y) > 0.002
    if (ringing || (!preference.matches && traveling)) schedule()
  }

  function resize() {
    const cssWidth = canvas.clientWidth
    const cssHeight = canvas.clientHeight
    if (!cssWidth || !cssHeight) return

    const density = Math.min(0.8, 1050 / cssWidth, 370 / cssHeight)
    width = Math.max(1, Math.round(cssWidth * density))
    height = Math.max(1, Math.round(cssHeight * density))
    if (canvas.width !== width) canvas.width = width
    if (canvas.height !== height) canvas.height = height
    schedule()
  }

  function start() {
    if (!inView || document.hidden) {
      stop()
      return
    }

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
    }

    if (!gl) {
      unavailable = true
      return
    }

    if (!resources && !gl.isContextLost()) {
      resources = setup(gl)
      if (!resources) {
        unavailable = true
        return
      }

      resize()
    }

    schedule()
  }

  function aim(event: PointerEvent) {
    if (!inView || preference.matches || event.pointerType === 'touch') return

    const bounds = target.getBoundingClientRect()
    if (!bounds.width || !bounds.height) return

    pointerX = Math.min(1, Math.max(-1, 2 * (event.clientX - bounds.left) / bounds.width - 1))
    pointerY = Math.min(1, Math.max(-1, 2 * (event.clientY - bounds.top) / bounds.height - 1))
    schedule()
  }

  function resetPointer() {
    pointerX = 0
    pointerY = 0
    schedule()
  }

  function handleContextLoss(event: Event) {
    event.preventDefault()
    resources = null
    announced = false
    stop()
    onReady(false)
  }

  function handleContextRestore() {
    unavailable = false
    start()
  }

  const intersection = new IntersectionObserver(([entry]) => {
    inView = entry.isIntersecting
    start()
  })
  const size = new ResizeObserver(resize)

  intersection.observe(target)
  size.observe(canvas)
  target.addEventListener('pointermove', aim, { passive: true })
  target.addEventListener('pointerleave', resetPointer)
  document.addEventListener('visibilitychange', start)
  preference.addEventListener('change', resetPointer)
  canvas.addEventListener('webglcontextlost', handleContextLoss)
  canvas.addEventListener('webglcontextrestored', handleContextRestore)

  return {
    position(nextX: number, nextY: number) {
      centerX = nextX
      centerY = nextY
      schedule()
    },
    sweep(progress: number) {
      if (progress === sweepProgress) return

      sweepProgress = progress
      schedule()
    },
    strike() {
      if (preference.matches) return

      strikeAt = performance.now()
      schedule()
    },
    destroy() {
      stop()
      intersection.disconnect()
      size.disconnect()
      target.removeEventListener('pointermove', aim)
      target.removeEventListener('pointerleave', resetPointer)
      document.removeEventListener('visibilitychange', start)
      preference.removeEventListener('change', resetPointer)
      canvas.removeEventListener('webglcontextlost', handleContextLoss)
      canvas.removeEventListener('webglcontextrestored', handleContextRestore)
      resources?.destroy()
      resources = null
    }
  }
}
