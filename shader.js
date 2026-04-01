/* ============================================================
   shader.js
   Owns: main background WebGL domain-warp shader (#shader-canvas),
         shaderTheme / shaderThemeTarget globals (read by player.js viz)
   ============================================================ */

// Exported globals — read by player.js (viz) and ui.js (toggleTheme)
window.shaderTheme       = 0.0;
window.shaderThemeTarget = 0.0;
window.uTheme            = null; // WebGL uniform location, set below

(function () {
  const canvas = document.getElementById('shader-canvas');
  const gl = canvas.getContext('webgl');
  if (!gl) return;

  const vsSource = `
    attribute vec4 aVertexPosition;
    void main() { gl_Position = aVertexPosition; }
  `;

  // Domain-warp Simplex noise, theme-blended palette
  // u_theme: 0.0 = dark mode, 1.0 = light mode (animated by render loop)
  const fsSource = `
    precision highp float;
    uniform vec2  u_resolution;
    uniform float u_time;
    uniform float u_theme;

    vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec3 permute(vec3 x) { return mod289(((x * 34.0) + 1.0) * x); }

    float snoise(vec2 v) {
      const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                         -0.577350269189626, 0.024390243902439);
      vec2 i  = floor(v + dot(v, C.yy));
      vec2 x0 = v - i + dot(i, C.xx);
      vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
      vec4 x12 = x0.xyxy + C.xxzz;
      x12.xy -= i1;
      i = mod289(i);
      vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
      vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
      m = m*m; m = m*m;
      vec3 x = 2.0 * fract(p * C.www) - 1.0;
      vec3 h  = abs(x) - 0.5;
      vec3 ox = floor(x + 0.5);
      vec3 a0 = x - ox;
      m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
      vec3 g;
      g.x  = a0.x  * x0.x  + h.x  * x0.y;
      g.yz = a0.yz * x12.xz + h.yz * x12.yw;
      return 130.0 * dot(m, g);
    }

    void main() {
      vec2 st = gl_FragCoord.xy / u_resolution.xy;
      st.x *= u_resolution.x / u_resolution.y;

      vec2 q = vec2(
        snoise(st + 0.05 * u_time),
        snoise(st + vec2(1.0))
      );
      vec2 r = vec2(
        snoise(st + 1.0 * q + vec2(1.7, 9.2) + 0.15 * u_time),
        snoise(st + 1.0 * q + vec2(8.3, 2.8) + 0.12 * u_time)
      );
      float f = snoise(st + r);

      // Dark palette — near-black with cool highlights
      vec3 dark1  = vec3(0.02, 0.02, 0.02);
      vec3 dark2  = vec3(0.12, 0.12, 0.15);
      vec3 dark3  = vec3(0.18, 0.20, 0.24);

      // Light palette — warm off-whites
      vec3 light1 = vec3(0.94, 0.93, 0.90);
      vec3 light2 = vec3(0.88, 0.86, 0.83);
      vec3 light3 = vec3(0.82, 0.80, 0.77);

      vec3 darkColor  = mix(dark1,  dark2,  f + 0.5);
           darkColor  = mix(darkColor,  dark3,  r.x * r.y);

      vec3 lightColor = mix(light1, light2, f + 0.5);
           lightColor = mix(lightColor, light3, r.x * r.y);

      gl_FragColor = vec4(mix(darkColor, lightColor, u_theme), 1.0);
    }
  `;

  function compileShader(gl, type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    return shader;
  }

  const prog = gl.createProgram();
  gl.attachShader(prog, compileShader(gl, gl.VERTEX_SHADER, vsSource));
  gl.attachShader(prog, compileShader(gl, gl.FRAGMENT_SHADER, fsSource));
  gl.linkProgram(prog);
  gl.useProgram(prog);

  const verts = new Float32Array([-1,-1, 1,-1, -1,1, 1,1]);
  const buf   = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, verts, gl.STATIC_DRAW);

  const posLoc  = gl.getAttribLocation(prog, 'aVertexPosition');
  gl.enableVertexAttribArray(posLoc);
  gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

  const uResolution = gl.getUniformLocation(prog, 'u_resolution');
  const uTime       = gl.getUniformLocation(prog, 'u_time');
  window.uTheme     = gl.getUniformLocation(prog, 'u_theme');

  function resizeCanvas() {
    const pr = window.devicePixelRatio || 1;
    canvas.width  = window.innerWidth  * pr;
    canvas.height = window.innerHeight * pr;
    gl.viewport(0, 0, canvas.width, canvas.height);
  }
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);

  function render(time) {
    gl.uniform2f(uResolution, canvas.width, canvas.height);
    gl.uniform1f(uTime, time * 0.001);
    // Smoothly lerp toward target theme value
    window.shaderTheme += (window.shaderThemeTarget - window.shaderTheme) * 0.05;
    gl.uniform1f(window.uTheme, window.shaderTheme);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    requestAnimationFrame(render);
  }
  requestAnimationFrame(render);
})();
