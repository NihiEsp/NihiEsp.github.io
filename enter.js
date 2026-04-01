/* ============================================================
   enter.js
   Owns: enter-screen WebGL shader, GSAP letter/line animation,
         startExperience() (called by the Enter button)
   Depends on: GSAP (global), animations.js (initAnimations),
               player.js (loadTrack, initVisualizer, drawViz)
   ============================================================ */

/* ── WebGL noise shader behind the enter screen ──────────── */
(function () {
  const ec = document.getElementById('enter-canvas');
  const eg = ec.getContext('webgl');
  if (!eg) return;

  const vs = `attribute vec4 p; void main(){ gl_Position=p; }`;
  const fs = `
    precision highp float;
    uniform vec2 u_res; uniform float u_t;
    vec3 mod289(vec3 x){return x-floor(x*(1./289.))*289.;}
    vec2 mod289(vec2 x){return x-floor(x*(1./289.))*289.;}
    vec3 perm(vec3 x){return mod289(((x*34.)+1.)*x);}
    float snoise(vec2 v){
      const vec4 C=vec4(.211324865405187,.366025403784439,-.577350269189626,.024390243902439);
      vec2 i=floor(v+dot(v,C.yy)),x0=v-i+dot(i,C.xx),i1;
      i1=(x0.x>x0.y)?vec2(1,0):vec2(0,1);
      vec4 x12=x0.xyxy+C.xxzz; x12.xy-=i1; i=mod289(i);
      vec3 p2=perm(perm(i.y+vec3(0,i1.y,1))+i.x+vec3(0,i1.x,1));
      vec3 m=max(.5-vec3(dot(x0,x0),dot(x12.xy,x12.xy),dot(x12.zw,x12.zw)),0.);
      m=m*m; m=m*m;
      vec3 x2=2.*fract(p2*C.www)-1.,h=abs(x2)-.5,ox=floor(x2+.5),a0=x2-ox;
      m*=1.79284291400159-.85373472095314*(a0*a0+h*h);
      vec3 g2; g2.x=a0.x*x0.x+h.x*x0.y; g2.yz=a0.yz*x12.xz+h.yz*x12.yw;
      return 130.*dot(m,g2);
    }
    void main(){
      vec2 st=gl_FragCoord.xy/u_res; st.x*=u_res.x/u_res.y;
      vec2 q=vec2(snoise(st+.04*u_t), snoise(st+vec2(1.)));
      vec2 r=vec2(snoise(st+q+vec2(1.7,9.2)+.13*u_t), snoise(st+q+vec2(8.3,2.8)+.11*u_t));
      float f=snoise(st+r);
      vec3 c1=vec3(.015,.015,.018), c2=vec3(.10,.10,.13), c3=vec3(.20,.22,.28);
      vec3 col=mix(c1,c2,f+.5); col=mix(col,c3,r.x*r.y+.2);
      gl_FragColor=vec4(col,1.);
    }`;

  function mkShader(g, type, src) {
    const s = g.createShader(type);
    g.shaderSource(s, src);
    g.compileShader(s);
    return s;
  }

  const prog = eg.createProgram();
  eg.attachShader(prog, mkShader(eg, eg.VERTEX_SHADER, vs));
  eg.attachShader(prog, mkShader(eg, eg.FRAGMENT_SHADER, fs));
  eg.linkProgram(prog);
  eg.useProgram(prog);

  const buf = eg.createBuffer();
  eg.bindBuffer(eg.ARRAY_BUFFER, buf);
  eg.bufferData(eg.ARRAY_BUFFER, new Float32Array([-1,-1,1,-1,-1,1,1,1]), eg.STATIC_DRAW);

  const pos = eg.getAttribLocation(prog, 'p');
  eg.enableVertexAttribArray(pos);
  eg.vertexAttribPointer(pos, 2, eg.FLOAT, false, 0, 0);

  const uRes = eg.getUniformLocation(prog, 'u_res');
  const uT   = eg.getUniformLocation(prog, 'u_t');

  let enterRafId;

  function resizeEnter() {
    const pr = window.devicePixelRatio || 1;
    ec.width  = ec.offsetWidth  * pr;
    ec.height = ec.offsetHeight * pr;
    eg.viewport(0, 0, ec.width, ec.height);
  }
  resizeEnter();
  window.addEventListener('resize', resizeEnter);

  function renderEnter(t) {
    eg.uniform2f(uRes, ec.width, ec.height);
    eg.uniform1f(uT, t * 0.001);
    eg.drawArrays(eg.TRIANGLE_STRIP, 0, 4);
    enterRafId = requestAnimationFrame(renderEnter);
  }
  enterRafId = requestAnimationFrame(renderEnter);

  // Exposed so startExperience() can kill it
  window._stopEnterShader = () => cancelAnimationFrame(enterRafId);
})();


/* ── GSAP entrance animation ─────────────────────────────── */
window.addEventListener('DOMContentLoaded', () => {
  const letters = document.querySelectorAll('#enter-name span');
  const sub     = document.getElementById('enter-sub');
  const ring    = document.getElementById('enter-ring-wrap');
  const lineV   = document.querySelector('.enter-line');
  const lineH   = document.querySelector('.enter-line-h');

  // Cross-hair lines sweep in first
  gsap.to(lineV, { scaleY: 1, duration: 1.4, ease: 'power3.inOut', delay: 0.1 });
  gsap.to(lineH, { scaleX: 1, duration: 1.4, ease: 'power3.inOut', delay: 0.1 });

  // Letters stagger up
  gsap.to(letters, {
    y: 0, opacity: 1, duration: 1.2,
    stagger: 0.08, ease: 'power4.out', delay: 0.5
  });

  // Sub-text + ring fade in
  gsap.to(sub,  { y: 0, opacity: 1, duration: 1,   ease: 'power3.out', delay: 1.0 });
  gsap.to(ring, {       opacity: 1, duration: 1.2, ease: 'power3.out', delay: 1.3 });
});


/* ── startExperience — called by the Enter button ─────────── */
function startExperience() {
  if (window._stopEnterShader) window._stopEnterShader();

  const screen = document.getElementById('enter-screen');
  screen.classList.add('dismissed');
  screen.addEventListener('transitionend', () => { screen.style.display = 'none'; }, { once: true });

  document.body.classList.add('site-loaded');
  document.body.classList.remove('no-scroll');

  // Kick off GSAP scroll animations (animations.js)
  initAnimations();

  // Lazy-load + attempt autoplay (player.js handles autoplay policy gracefully)
  loadTrack(window._currentTrack || 0);
  window._trackLoaded = true;
  initVisualizer();
  player.play().then(() => {
    document.getElementById('play-icon').style.display  = 'none';
    document.getElementById('pause-icon').style.display = 'block';
    document.getElementById('m-trigger').classList.add('is-playing');
    window._isPlaying = true;
    drawViz();
  }).catch(() => {
    // Browser blocked autoplay — user presses play manually, no problem
  });
}
