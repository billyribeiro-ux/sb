const vertexSource = `
  attribute vec2 aPosition;
  varying vec2 vUv;
  void main() {
    vUv = aPosition * .5 + .5;
    gl_Position = vec4(aPosition, 0., 1.);
  }
`;

const fragmentSource = `
  precision highp float;
  varying vec2 vUv;
  uniform sampler2D uImage;
  uniform vec2 uSize;
  uniform float uPhotoAspect;
  uniform vec2 uPointer;
  uniform float uProgress;

  void main() {
    vec2 screen = vec2(vUv.x, 1. - vUv.y);
    float aspect = uSize.x / uSize.y;
    float pullback = smoothstep(.06, .88, uProgress);
    float closeHeight = max(1., aspect / uPhotoAspect);
    float wideHeight = max(.76, min(1., aspect / uPhotoAspect));
    float photoHeight = mix(closeHeight, wideHeight, pullback);
    vec2 photoSize = vec2(photoHeight * uPhotoAspect, photoHeight);
    vec2 position = vec2(screen.x * aspect, screen.y);
    vec2 cameraShift = uPointer * vec2(.008, .004) * sin(pullback * 3.14159);
    float top = .065 + max(0., 1. - photoHeight) * .14;
    vec2 uv = (position - vec2(aspect * .5, top) - cameraShift) / photoSize + vec2(.5, 0.);
    // Extend the studio’s top edge behind the masthead while keeping the portrait intact.
    uv.y = abs(uv.y);
    vec3 photo = texture2D(uImage, uv).rgb;

    // Fade only the overscan at the sides as the full studio frame comes
    // into view. Everything inside the frame moves at the same scale.
    vec2 distanceOutside = max(max(-uv, uv - 1.), vec2(0.));
    float overscan = smoothstep(0., .11, max(distanceOutside.x, distanceOutside.y));
    vec3 portrait = mix(photo, vec3(.04, .042, .048), overscan);

    // The timeline dissolves this intact frame into the playing session.
    gl_FragColor = vec4(portrait, 1.);
  }
`;

function compile(gl: WebGLRenderingContext, kind: number, source: string) {
  const shader = gl.createShader(kind);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (gl.getShaderParameter(shader, gl.COMPILE_STATUS)) return shader;
  gl.deleteShader(shader);
  return null;
}

export function createDepthPortrait(
  canvas: HTMLCanvasElement,
  image: HTMLImageElement,
  stage: HTMLElement,
  plate: HTMLElement,
) {
  const motion = matchMedia('(prefers-reduced-motion: no-preference) and (min-height: 35rem)');
  const gl = canvas.getContext('webgl', { alpha: true, antialias: false, depth: false, powerPreference: 'low-power' });
  let disposed = false;
  let frame = 0;
  let progress = 0;
  let inView = false;
  let ready = false;
  let previousTime = 0;
  let x = 0;
  let y = 0;
  let targetX = 0;
  let targetY = 0;
  let source = '';
  const textures: WebGLTexture[] = [];
  let program: WebGLProgram | null = null;
  let buffer: WebGLBuffer | null = null;
  const uniforms: Record<string, WebGLUniformLocation | null> = {};

  function stop() {
    cancelAnimationFrame(frame);
    frame = 0;
    previousTime = 0;
  }

  function schedule() {
    if (!frame && ready && inView && !document.hidden && progress <= 1.02) {
      frame = requestAnimationFrame(draw);
    }
  }

  function draw(now: number) {
    frame = 0;
    if (!gl || !program || disposed) return;
    const delta = previousTime ? Math.min(now - previousTime, 64) : 16;
    previousTime = now;
    const smoothing = 1 - Math.exp(-delta / 110);
    x += (targetX - x) * smoothing;
    y += (targetY - y) * smoothing;
    gl.useProgram(program);
    gl.uniform2f(uniforms.uPointer, x, y);
    gl.uniform1f(uniforms.uProgress, motion.matches ? progress : 0);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    if (!plate.hasAttribute('data-depth-ready')) plate.dataset.depthReady = 'true';
    if (Math.abs(targetX - x) + Math.abs(targetY - y) > .002) schedule();
  }

  function upload(unit: number, name: string, pixels: TexImageSource) {
    if (!gl || !program) return;
    const texture = gl.createTexture();
    if (!texture) throw new Error('Portrait texture unavailable');
    textures.push(texture);
    gl.activeTexture(gl.TEXTURE0 + unit);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
    gl.uniform1i(gl.getUniformLocation(program, name), unit);
  }

  function resize() {
    if (!gl || !program || !image.naturalWidth) return;
    const width = plate.clientWidth;
    const height = plate.clientHeight;
    if (!width || !height) return;
    const density = Math.min(devicePixelRatio, 1.75, 2880 / width);
    canvas.width = Math.round(width * density);
    canvas.height = Math.round(height * density);
    gl.useProgram(program);
    gl.uniform2f(uniforms.uSize, width, height);
    gl.uniform1f(uniforms.uPhotoAspect, image.naturalWidth / image.naturalHeight);
    schedule();
  }

  function clearResources() {
    stop();
    ready = false;
    delete plate.dataset.depthReady;
    if (!gl) return;
    textures.splice(0).forEach(texture => gl.deleteTexture(texture));
    gl.deleteBuffer(buffer);
    gl.deleteProgram(program);
    buffer = null;
    program = null;
  }

  async function prepare() {
    if (!gl || disposed) return;
    try {
      await image.decode();
      if (disposed || (source === image.currentSrc && ready)) return;
      clearResources();
      source = image.currentSrc;
      const vertex = compile(gl, gl.VERTEX_SHADER, vertexSource);
      const fragment = compile(gl, gl.FRAGMENT_SHADER, fragmentSource);
      program = gl.createProgram();
      if (!vertex || !fragment || !program) {
        gl.deleteShader(vertex);
        gl.deleteShader(fragment);
        clearResources();
        return;
      }
      gl.attachShader(program, vertex);
      gl.attachShader(program, fragment);
      gl.linkProgram(program);
      gl.deleteShader(vertex);
      gl.deleteShader(fragment);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) { clearResources(); return; }
      gl.useProgram(program);
      buffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
      const position = gl.getAttribLocation(program, 'aPosition');
      gl.enableVertexAttribArray(position);
      gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
      for (const name of ['uSize', 'uPhotoAspect', 'uPointer', 'uProgress']) {
        uniforms[name] = gl.getUniformLocation(program, name);
      }
      upload(0, 'uImage', image);
      ready = true;
      resize();
    } catch {
      clearResources();
    }
  }

  function aim(event: PointerEvent) {
    if (event.pointerType !== 'mouse' || !motion.matches || progress >= 1) return;
    const bounds = stage.getBoundingClientRect();
    targetX = (event.clientX - bounds.left) / bounds.width * 2 - 1;
    targetY = (event.clientY - bounds.top) / bounds.height * 2 - 1;
    schedule();
  }

  function resetPointer() {
    targetX = 0;
    targetY = 0;
    schedule();
  }
  function visibility() { if (document.hidden) stop(); else schedule(); }
  function preference() {
    if (!motion.matches) progress = 0;
    resetPointer();
  }
  function contextLost(event: Event) { event.preventDefault(); clearResources(); }

  const intersection = new IntersectionObserver(([entry]) => {
    inView = entry.isIntersecting;
    if (inView) schedule(); else stop();
  });
  const size = new ResizeObserver(resize);
  intersection.observe(stage);
  size.observe(plate);
  image.addEventListener('load', prepare);
  stage.addEventListener('pointermove', aim, { passive: true });
  stage.addEventListener('pointerleave', resetPointer);
  document.addEventListener('visibilitychange', visibility);
  motion.addEventListener('change', preference);
  canvas.addEventListener('webglcontextlost', contextLost);
  canvas.addEventListener('webglcontextrestored', prepare);
  void prepare();

  return {
    seek(value: number) {
      const next = Math.min(1.02, value);
      if (progress === next) return;
      progress = next;
      schedule();
    },
    destroy() {
      disposed = true;
      clearResources();
      intersection.disconnect();
      size.disconnect();
      image.removeEventListener('load', prepare);
      stage.removeEventListener('pointermove', aim);
      stage.removeEventListener('pointerleave', resetPointer);
      document.removeEventListener('visibilitychange', visibility);
      motion.removeEventListener('change', preference);
      canvas.removeEventListener('webglcontextlost', contextLost);
      canvas.removeEventListener('webglcontextrestored', prepare);
    },
  };
}
