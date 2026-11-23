const vertexSource = `
  attribute vec2 position;
  varying vec2 uv;

  void main() {
    uv = position * .5 + .5;
    gl_Position = vec4(position, 0., 1.);
  }
`;

const fragmentSource = `
  precision mediump float;
  varying vec2 uv;
  uniform float cue;
  uniform float strength;
  uniform float aspect;

  float noise(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 4375.585);
  }

  void main() {
    vec2 p = uv;
    p.x += (p.y - .45) * .36 / aspect;
    float center = mix(-.18, .88, cue);
    float beam = exp(-9. * pow((p.x - center) * 3.15, 2.));
    float spill = exp(-6. * pow((p.x - center) * 1.65, 2.));
    float falloff = 1. - smoothstep(.12, .73, abs(p.y - .48));
    float grain = .88 + noise(floor(gl_FragCoord.xy)) * .12;
    vec3 warm = mix(vec3(.48, .28, .17), vec3(.95, .71, .48), beam * .7);
    gl_FragColor = vec4(warm, (beam * .125 + spill * .075) * strength * falloff * grain);
  }
`;

export function mountCaptionLight(canvas: HTMLCanvasElement) {
  const gl = canvas.getContext('webgl', { alpha: true, premultipliedAlpha: false, antialias: false });
  if (!gl) return;

  function compile(kind: number, source: string) {
    const shader = gl!.createShader(kind);
    if (!shader) return null;
    gl!.shaderSource(shader, source);
    gl!.compileShader(shader);
    return gl!.getShaderParameter(shader, gl!.COMPILE_STATUS) ? shader : null;
  }

  const vertex = compile(gl.VERTEX_SHADER, vertexSource);
  const fragment = compile(gl.FRAGMENT_SHADER, fragmentSource);
  const program = gl.createProgram();
  const buffer = gl.createBuffer();
  if (!vertex || !fragment || !program || !buffer) return;
  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.linkProgram(program);
  gl.deleteShader(vertex);
  gl.deleteShader(fragment);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    gl.deleteProgram(program);
    gl.deleteBuffer(buffer);
    return;
  }

  gl.useProgram(program);
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  const position = gl.getAttribLocation(program, 'position');
  gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(position);
  const cue = gl.getUniformLocation(program, 'cue');
  const strength = gl.getUniformLocation(program, 'strength');
  const aspect = gl.getUniformLocation(program, 'aspect');
  let level = 0;
  let progress = 0;

  function draw(amount = progress, opacity = level) {
    if (gl!.isContextLost()) return;
    progress = amount;
    level = opacity;
    gl!.uniform1f(cue, progress);
    gl!.uniform1f(strength, level);
    gl!.drawArrays(gl!.TRIANGLE_STRIP, 0, 4);
  }

  const resize = new ResizeObserver(() => {
    canvas.width = Math.max(1, Math.round(canvas.clientWidth * .65));
    canvas.height = Math.max(1, Math.round(canvas.clientHeight * .65));
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.uniform1f(aspect, canvas.width / canvas.height);
    draw();
  });
  resize.observe(canvas);

  return {
    draw,
    destroy() {
      resize.disconnect();
      gl.deleteBuffer(buffer);
      gl.deleteProgram(program);
    },
  };
}
