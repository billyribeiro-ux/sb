const vertexShader = `
  attribute vec2 aPosition;
  varying vec2 vUv;

  void main() {
    vUv = aPosition * 0.5 + 0.5;
    gl_Position = vec4(aPosition, 0.0, 1.0);
  }
`

const fragmentShader = `
  precision mediump float;

  varying vec2 vUv;
  uniform float uTime;
  uniform float uAspect;

  float filmGrain(vec2 pixel) {
    vec3 p = fract(vec3(pixel.xyx) * 0.1013);
    p += dot(p, p.yzx + 13.71);
    return fract((p.x + p.y) * p.z);
  }

  void main() {
    vec2 offset = vUv - vec2(0.91 + 0.06 * sin(uTime * 0.31), 0.77);
    offset.x *= clamp(uAspect, 0.85, 2.4);
    offset *= vec2(1.2, 2.25);
    float glow = exp(-dot(offset, offset) * 1.5);
    float edge = smoothstep(0.16, 0.75, vUv.x) * smoothstep(0.03, 0.54, vUv.y);
    float breath = 0.85 + 0.15 * sin(uTime * 0.36 + 0.5);
    float grain = (filmGrain(gl_FragCoord.xy) - 0.5) * 0.028;
    float alpha = max(0.0, glow * edge * breath * (0.3 + grain));
    float luminance = mix(0.281, 0.636, glow);

    gl_FragColor = vec4(vec3(luminance * alpha), alpha);
  }
`

type Resources = {
  program: WebGLProgram
  vertexBuffer: WebGLBuffer
  elapsed: WebGLUniformLocation
  aspect: WebGLUniformLocation
}

function compile(gl: WebGLRenderingContext, type: number, source: string) {
  const shader = gl.createShader(type)
  if (!shader) return null

  gl.shaderSource(shader, source)
  gl.compileShader(shader)

  if (gl.getShaderParameter(shader, gl.COMPILE_STATUS)) return shader

  gl.deleteShader(shader)
  return null
}

function initialize(gl: WebGLRenderingContext): Resources | null {
  const vertex = compile(gl, gl.VERTEX_SHADER, vertexShader)
  const fragment = compile(gl, gl.FRAGMENT_SHADER, fragmentShader)
  const program = gl.createProgram()

  if (!program || !vertex || !fragment) {
    if (vertex) gl.deleteShader(vertex)
    if (fragment) gl.deleteShader(fragment)
    if (program) gl.deleteProgram(program)
    return null
  }

  gl.attachShader(program, vertex)
  gl.attachShader(program, fragment)
  gl.linkProgram(program)
  gl.deleteShader(vertex)
  gl.deleteShader(fragment)

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    gl.deleteProgram(program)
    return null
  }

  const position = gl.getAttribLocation(program, 'aPosition')
  const elapsed = gl.getUniformLocation(program, 'uTime')
  const aspect = gl.getUniformLocation(program, 'uAspect')
  const vertexBuffer = gl.createBuffer()

  if (position < 0 || !elapsed || !aspect || !vertexBuffer) {
    if (vertexBuffer) gl.deleteBuffer(vertexBuffer)
    gl.deleteProgram(program)
    return null
  }

  gl.useProgram(program)
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer)
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW)
  gl.enableVertexAttribArray(position)
  gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0)

  return { program, vertexBuffer, elapsed, aspect }
}

export function startAtmosphere(canvas: HTMLCanvasElement): () => void {
  const preference = window.matchMedia('(prefers-reduced-motion: reduce)')
  let context: WebGLRenderingContext | null = null
  let resources: Resources | null = null
  let frame: number | undefined
  let lastFrame = 0
  let elapsed = 0
  let inView = false
  let contextUnavailable = false

  function stop() {
    if (frame !== undefined) cancelAnimationFrame(frame)
    frame = undefined
    lastFrame = 0
  }

  function draw(now: number) {
    frame = undefined
    if (!context || !resources) return

    if (!lastFrame || now - lastFrame >= 1000 / 24) {
      if (lastFrame) elapsed += (now - lastFrame) / 1000
      lastFrame = now
      context.uniform1f(resources.elapsed, elapsed % (2 * Math.PI * 100))
      context.drawArrays(context.TRIANGLES, 0, 3)
    }

    frame = requestAnimationFrame(draw)
  }

  function resize(width: number, height: number) {
    if (!context || !resources || width <= 0 || height <= 0) return

    const resolution = Math.min(0.75, 1120 / width, 720 / height)
    canvas.width = Math.max(1, Math.round(width * resolution))
    canvas.height = Math.max(1, Math.round(height * resolution))
    context.viewport(0, 0, canvas.width, canvas.height)
    context.uniform1f(resources.aspect, width / height)
  }

  function update() {
    if (preference.matches || !inView || document.hidden || contextUnavailable) {
      stop()
      if (preference.matches) canvas.style.visibility = 'hidden'
      return
    }

    if (!context) {
      try {
        context = canvas.getContext('webgl', {
          alpha: true,
          antialias: false,
          depth: false,
          stencil: false,
          powerPreference: 'low-power',
          failIfMajorPerformanceCaveat: true
        })
      } catch {
        contextUnavailable = true
        return
      }

      if (!context) {
        contextUnavailable = true
        return
      }
    }

    if (!resources && !context.isContextLost()) {
      resources = initialize(context)
      if (!resources) contextUnavailable = true
      else resize(canvas.clientWidth, canvas.clientHeight)
    }

    canvas.style.visibility = resources ? 'visible' : 'hidden'

    if (resources && frame === undefined) frame = requestAnimationFrame(draw)
  }

  function handleContextLoss(event: Event) {
    event.preventDefault()
    resources = null
    canvas.style.visibility = 'hidden'
    stop()
  }

  function handleContextRestore() {
    contextUnavailable = false
    update()
  }

  const intersection = new IntersectionObserver(([entry]) => {
    inView = entry.isIntersecting
    update()
  })
  const size = new ResizeObserver(([entry]) => {
    resize(entry.contentRect.width, entry.contentRect.height)
  })

  canvas.addEventListener('webglcontextlost', handleContextLoss)
  canvas.addEventListener('webglcontextrestored', handleContextRestore)
  document.addEventListener('visibilitychange', update)
  preference.addEventListener('change', update)

  intersection.observe(canvas)
  size.observe(canvas)

  return () => {
    stop()
    intersection.disconnect()
    size.disconnect()
    canvas.removeEventListener('webglcontextlost', handleContextLoss)
    canvas.removeEventListener('webglcontextrestored', handleContextRestore)
    document.removeEventListener('visibilitychange', update)
    preference.removeEventListener('change', update)

    if (context && resources) {
      context.deleteBuffer(resources.vertexBuffer)
      context.deleteProgram(resources.program)
    }
  }
}
