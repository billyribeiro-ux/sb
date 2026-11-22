const vertexSource = `
  precision highp float;
  attribute vec2 aSurface;
  uniform float uAspect;
  uniform float uStrike;
  uniform vec2 uPointer;
  varying vec3 vPosition;
  varying vec2 vSurface;
  varying vec3 vNormal;

  float sq(float v) { return v * v; }

  float elevation(float r) {
    float bell = 0.225 * exp(-pow(r / 0.192, 2.8));
    float bow = 0.074 * (1.0 - r * r);
    float lip = 0.012 * exp(-sq((r - 0.984) / 0.027));
    float pulse = max(uStrike, 0.0);
    float movingRing = 0.085 + pulse * 1.55;
    float wave = 0.043 * exp(-7.4 * pulse) * exp(-sq((r - movingRing) * 8.0));
    return bell + bow + lip + wave * sin((r - movingRing) * 47.0) * step(0.0, uStrike);
  }

  void main() {
    float r = length(aSurface);
    float h = elevation(r);
    vec2 outward = aSurface / max(r, 0.0001);
    float slope = (elevation(r + 0.002) - elevation(max(r - 0.002, 0.0))) * 250.0;
    vPosition = vec3(aSurface.x, h, aSurface.y);
    vNormal = normalize(vec3(-slope * outward.x, 1.0, -slope * outward.y));
    vSurface = aSurface;

    float angle = 0.72 + uPointer.y * 0.075;
    vec3 eyeDirection = vec3(0.0, sin(angle), cos(angle));
    vec3 up = vec3(0.0, cos(angle), -sin(angle));
    vec2 projected = vec2(vPosition.x, dot(vPosition, up));
    float roll = 0.135 + uPointer.x * 0.035;
    projected = mat2(cos(roll), -sin(roll), sin(roll), cos(roll)) * projected;
    float depth = dot(vPosition, eyeDirection);
    float zoom = min(0.925, 1.28 / uAspect);
    float perspective = 4.9 / (4.9 - depth);
    gl_Position = vec4(projected.x * zoom * perspective,
                       (projected.y * perspective + 0.064) * zoom * uAspect,
                       -depth * 0.38, 1.0);
  }
`

const fragmentSource = `
  precision highp float;
  uniform vec2 uPointer;
  uniform float uStrike;
  varying vec3 vPosition;
  varying vec2 vSurface;
  varying vec3 vNormal;

  float sq(float v) { return v * v; }

  vec2 randomPair(vec2 p) {
    vec3 mixed = fract(vec3(p.xyx) * vec3(0.1031, 0.1030, 0.0973));
    mixed += dot(mixed, mixed.yzx + 33.33);
    return fract((mixed.xx + mixed.yz) * mixed.zy);
  }

  vec3 hammered(vec2 p) {
    vec2 base = floor(p);
    vec2 part = fract(p);
    float distanceToDent = 8.0;
    vec2 center = vec2(0.0);
    for (int i = -1; i <= 1; i++) {
      for (int j = -1; j <= 1; j++) {
        vec2 neighbor = vec2(float(i), float(j));
        vec2 dent = neighbor + 0.78 * randomPair(base + neighbor) + 0.11 - part;
        float distanceSquared = dot(dent, dent);
        if (distanceSquared < distanceToDent) {
          distanceToDent = distanceSquared;
          center = dent;
        }
      }
    }
    float bend = exp(-distanceToDent * 6.0);
    return vec3(center * bend, bend);
  }

  void main() {
    float r = length(vSurface);
    vec2 radial = vSurface / max(r, 0.0001);
    float polar = atan(vSurface.y, vSurface.x);
    float grains = sin(r * 784.5 + 0.8 * sin(polar * 3.0) + 0.35 * sin(r * 93.0));
    float micro = sin(r * 1251.7 + 1.6 * sin(polar * 2.0));
    float cut = pow(0.5 + 0.5 * sin(r * 133.8 + 0.32 * sin(polar * 5.0)), 5.0);
    float bands = 0.5 + 0.5 * sin(r * 29.0);
    vec3 dents = hammered(vSurface * 25.0);
    float bowl = smoothstep(0.1, 0.4, r);
    float rim = smoothstep(0.975, 1.0, r);
    float bevel = smoothstep(0.018, 0.032, r) * (1.0 - smoothstep(0.035, 0.053, r));
    vec3 n = normalize(vNormal + vec3(
      radial.x * grains * 0.041 + dents.x * 0.25,
      0.0,
      radial.y * grains * 0.041 + dents.y * 0.25
    ));
    float angle = 0.72 + uPointer.y * 0.075;
    vec3 view = normalize(vec3(0.0, sin(angle), cos(angle)) * 4.9 - vPosition);
    vec3 key = normalize(vec3(-0.52 + 0.66 * uPointer.x, 0.77, -0.61));
    vec3 fill = normalize(vec3(0.74 + 0.23 * uPointer.x, 0.56, -0.54));
    vec3 halfKey = normalize(view + key);
    vec3 halfFill = normalize(view + fill);

    float direct = max(0.0, dot(n, key));
    float keyGloss = max(0.0, dot(n, halfKey));
    float fillGloss = max(0.0, dot(n, halfFill));
    float darkArc = 0.72 + 0.28 * sin(polar + 0.74);
    float fresnel = pow(1.0 - max(dot(n, view), 0.0), 3.5);
    float polish = 0.40 + 0.10 * grains + 0.035 * micro - 0.10 * cut + 0.085 * bands;
    vec3 color = vec3(0.49, 0.265, 0.073) * (0.37 + direct * 0.73) * darkArc * (0.59 + polish);
    color += vec3(0.96, 0.61, 0.22) * (pow(keyGloss, 16.0) * 0.34 + pow(keyGloss, 96.0) * 0.38);
    color += vec3(0.83, 0.51, 0.17) * pow(fillGloss, 35.0) * 0.23;
    color *= 0.89 + 0.14 * dents.z * bowl;
    color += vec3(0.69, 0.37, 0.12) * fresnel * (0.29 + 0.42 * rim);
    color += vec3(0.83, 0.50, 0.17) * bevel * 0.78;
    color *= 1.0 - 0.37 * smoothstep(0.9965, 1.0, r);
    color += vec3(0.68, 0.35, 0.055) * exp(-sq((r - 0.992) * 370.0)) * 0.33;

    float time = max(uStrike, 0.0);
    float waveCenter = 0.10 + time * 1.55;
    float shock = exp(-sq((r - waveCenter) * 27.0)) * exp(-2.6 * time) * step(0.0, uStrike);
    color += vec3(1.0, 0.56, 0.12) * shock * 0.58;
    color = pow(max(color, 0.0), vec3(0.77));
    gl_FragColor = vec4(color, 1.0);
  }
`

const ringCount = 58
const segmentCount = 128

function cymbalGeometry() {
  const points = new Float32Array((ringCount + 1) * (segmentCount + 1) * 2)
  const indices = new Uint16Array(ringCount * segmentCount * 6)

  for (let ring = 0; ring <= ringCount; ring++) {
    const radius = 0.019 + 0.981 * ring / ringCount

    for (let segment = 0; segment <= segmentCount; segment++) {
      const angle = segment / segmentCount * 2 * Math.PI
      const index = (ring * (segmentCount + 1) + segment) * 2
      points[index] = Math.cos(angle) * radius
      points[index + 1] = Math.sin(angle) * radius
    }
  }

  for (let ring = 0; ring < ringCount; ring++) {
    for (let segment = 0; segment < segmentCount; segment++) {
      const near = ring * (segmentCount + 1) + segment
      const far = near + segmentCount + 1
      const index = (ring * segmentCount + segment) * 6

      indices.set([near, far, near + 1, near + 1, far, far + 1], index)
    }
  }

  return { points, indices }
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

function buildProgram(gl: WebGLRenderingContext) {
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
  if (gl.getProgramParameter(program, gl.LINK_STATUS)) return program

  gl.deleteProgram(program)
  return null
}

type Renderer = {
  draw: (width: number, height: number, x: number, y: number, strike: number) => void
  destroy: () => void
}

function setup(gl: WebGLRenderingContext): Renderer | null {
  const program = buildProgram(gl)
  if (!program) return null

  const position = gl.getAttribLocation(program, 'aSurface')
  const aspect = gl.getUniformLocation(program, 'uAspect')
  const pointer = gl.getUniformLocation(program, 'uPointer')
  const strike = gl.getUniformLocation(program, 'uStrike')
  const vertices = gl.createBuffer()
  const elements = gl.createBuffer()

  const destroy = () => {
    gl.deleteBuffer(vertices)
    gl.deleteBuffer(elements)
    gl.deleteProgram(program)
  }

  if (position < 0 || !aspect || !pointer || !strike || !vertices || !elements) {
    destroy()
    return null
  }

  const mesh = cymbalGeometry()
  gl.useProgram(program)
  gl.bindBuffer(gl.ARRAY_BUFFER, vertices)
  gl.bufferData(gl.ARRAY_BUFFER, mesh.points, gl.STATIC_DRAW)
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, elements)
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, mesh.indices, gl.STATIC_DRAW)
  gl.enableVertexAttribArray(position)
  gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0)
  gl.enable(gl.DEPTH_TEST)
  gl.clearColor(0, 0, 0, 0)

  return {
    draw(width, height, x, y, hit) {
      gl.viewport(0, 0, width, height)
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
      gl.uniform1f(aspect, width / height)
      gl.uniform2f(pointer, x, y)
      gl.uniform1f(strike, hit)
      gl.drawElements(gl.TRIANGLES, mesh.indices.length, gl.UNSIGNED_SHORT, 0)
    },
    destroy
  }
}

export function createCymbal(canvas: HTMLCanvasElement, onReady: (ready: boolean) => void) {
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)')
  let gl: WebGLRenderingContext | null

  try {
    gl = canvas.getContext('webgl', {
      alpha: true,
      antialias: true,
      powerPreference: 'low-power',
      failIfMajorPerformanceCaveat: true
    })
  } catch {
    gl = null
  }
  if (!gl) return null

  let renderer = setup(gl)
  if (!renderer) return null

  let raf = 0
  let targetX = 0
  let targetY = 0
  let x = 0
  let y = 0
  let hitAt = -Infinity

  function requestFrame() {
    if (!raf && renderer) raf = requestAnimationFrame(draw)
  }

  function draw(now: number) {
    raf = 0
    if (!renderer) return

    const elapsed = (now - hitAt) / 1000
    const activeStrike = !motion.matches && elapsed >= 0 && elapsed <= 0.8
    x = motion.matches ? 0 : x + (targetX - x) * 0.16
    y = motion.matches ? 0 : y + (targetY - y) * 0.16
    renderer.draw(canvas.width, canvas.height, x, y, activeStrike ? elapsed : -1)

    const pointerStillMoving = Math.abs(targetX - x) + Math.abs(targetY - y) > 0.001
    if (activeStrike || (!motion.matches && pointerStillMoving)) requestFrame()
  }

  function fit() {
    const { clientWidth: width, clientHeight: height } = canvas
    if (!width || !height) return

    const pixelRatio = Math.min(window.devicePixelRatio || 1, 1.65, 960 / width)
    canvas.width = Math.round(width * pixelRatio)
    canvas.height = Math.round(height * pixelRatio)
    requestFrame()
  }

  function loseContext(event: Event) {
    event.preventDefault()
    renderer = null
    if (raf) cancelAnimationFrame(raf)
    raf = 0
    onReady(false)
  }

  function restoreContext() {
    if (!gl) return

    renderer = setup(gl)
    if (renderer) {
      fit()
      onReady(true)
    }
  }

  const size = new ResizeObserver(fit)
  size.observe(canvas)
  canvas.addEventListener('webglcontextlost', loseContext)
  canvas.addEventListener('webglcontextrestored', restoreContext)
  motion.addEventListener('change', requestFrame)
  fit()
  onReady(true)

  return {
    point(nextX: number, nextY: number) {
      if (motion.matches) return

      targetX = nextX
      targetY = nextY
      requestFrame()
    },
    strike() {
      if (motion.matches) return

      hitAt = performance.now()
      requestFrame()
    },
    destroy() {
      size.disconnect()
      if (raf) cancelAnimationFrame(raf)
      canvas.removeEventListener('webglcontextlost', loseContext)
      canvas.removeEventListener('webglcontextrestored', restoreContext)
      motion.removeEventListener('change', requestFrame)
      renderer?.destroy()
      renderer = null
    }
  }
}
