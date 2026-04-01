/* ============================================================
   player.js
   Owns: TRACKS list, audio element control, Web Audio API,
         Canvas 2D frequency-bar visualizer, panel toggle
   Exports: player, loadTrack(), togglePlayer(), togglePlay(),
            nextTrack(), prevTrack(), initVisualizer(), drawViz()
   Depends on: shader.js (window.shaderTheme)
   ============================================================ */

/* ── Track list ─────────────────────────────────────────────
   { title, artist, file: 'music/filename.mp3', cover: 'music/filename.jpeg' }
   ---------------------------------------------------------- */
const TRACKS = [
  { title: "alive",       artist: 'khel',     file: 'music/khel.mp3',     cover: 'music/khel.jpeg'     },
  { title: "world's end", artist: 'confetti', file: 'music/confetti.mp3', cover: 'music/confetti.jpeg' },
  { title: 'sequence',    artist: 'spade',    file: 'music/spade.mp3',    cover: 'music/spade.jpeg'    },
];

/* ── State ─────────────────────────────────────────────────── */
window._isPlaying    = false;
window._currentTrack = 0;
window._trackLoaded  = false;

const player  = document.getElementById('audio-player');
const trigger = document.getElementById('m-trigger');
const panel   = document.getElementById('m-panel');
const vSlider = document.getElementById('v-slider');

player.volume = 0.3;
vSlider.addEventListener('input', e => { player.volume = e.target.value; });

/* ── Panel ─────────────────────────────────────────────────── */
function togglePlayer() {
  if (!window._trackLoaded) {
    loadTrack(window._currentTrack);
    window._trackLoaded = true;
  }
  panel.classList.toggle('open');
}

/* ── Track loading ─────────────────────────────────────────── */
function loadTrack(index) {
  const track = TRACKS[index];
  player.src  = track.file;
  document.getElementById('s-title').textContent  = track.title;
  document.getElementById('s-artist').textContent = track.artist;

  const artWrap     = document.getElementById('m-art');
  const placeholder = document.getElementById('art-placeholder');

  if (track.cover) {
    artWrap.style.backgroundImage = `url(${track.cover})`;
    if (placeholder) placeholder.style.display = 'none';
  } else {
    artWrap.style.backgroundImage = 'none';
    if (placeholder) placeholder.style.display = 'block';
  }

  player.load();
}

/* ── Track navigation ──────────────────────────────────────── */
function nextTrack() {
  window._currentTrack = (window._currentTrack + 1) % TRACKS.length;
  loadTrack(window._currentTrack);
  if (window._isPlaying) player.play();
}
function prevTrack() {
  window._currentTrack = (window._currentTrack - 1 + TRACKS.length) % TRACKS.length;
  loadTrack(window._currentTrack);
  if (window._isPlaying) player.play();
}
player.addEventListener('ended', nextTrack);

/* ── Play / pause ──────────────────────────────────────────── */
async function togglePlay() {
  if (window._isPlaying) {
    player.pause();
    document.getElementById('play-icon').style.display  = 'block';
    document.getElementById('pause-icon').style.display = 'none';
    trigger.classList.remove('is-playing');
    window._isPlaying = false;
  } else {
    try {
      initVisualizer();
      if (audioCtx && audioCtx.state === 'suspended') await audioCtx.resume();
      await player.play();
      document.getElementById('play-icon').style.display  = 'none';
      document.getElementById('pause-icon').style.display = 'block';
      trigger.classList.add('is-playing');
      window._isPlaying = true;
      drawViz();
    } catch (e) {
      console.error('Playback failed:', e);
    }
  }
}


/* ============================================================
   Canvas 2D frequency-bar visualizer
   — 64 mirrored bars, smooth lerp, theme-aware
   ============================================================ */

let audioCtx, analyser, sourceNode, vizRaf;
let vizReady   = false;
let smoothedViz = null;

const VIZ_BARS = 64;

function initVisualizer() {
  if (vizReady) return;
  audioCtx  = new (window.AudioContext || window.webkitAudioContext)();
  analyser  = audioCtx.createAnalyser();
  analyser.fftSize = 512;
  analyser.smoothingTimeConstant = 0.82;
  sourceNode = audioCtx.createMediaElementSource(player);
  sourceNode.connect(analyser);
  analyser.connect(audioCtx.destination);
  vizReady = true;
}

function drawViz() {
  const canvas = document.getElementById('viz-canvas');
  if (!canvas || !analyser) return;

  // Cancel any previous loop
  cancelAnimationFrame(vizRaf);

  const ctx      = canvas.getContext('2d');
  const dpr      = window.devicePixelRatio || 1;
  const freqData = new Uint8Array(analyser.frequencyBinCount);

  // Per-bar smooth values persisted across frames
  if (!smoothedViz) smoothedViz = new Float32Array(VIZ_BARS);

  function resize() {
    const W = canvas.offsetWidth  * dpr;
    const H = canvas.offsetHeight * dpr;
    if (canvas.width !== W || canvas.height !== H) {
      canvas.width  = W;
      canvas.height = H;
    }
  }

  function frame() {
    vizRaf = requestAnimationFrame(frame);
    resize();
    analyser.getByteFrequencyData(freqData);

    const W     = canvas.width;
    const H     = canvas.height;
    const midY  = H / 2;
    const isLight = (window.shaderTheme || 0) > 0.5;

    ctx.clearRect(0, 0, W, H);

    // Bar geometry
    const barW    = Math.max(1.5, (W / VIZ_BARS) * 0.48);
    const spacing = (W - barW * VIZ_BARS) / (VIZ_BARS + 1);

    for (let i = 0; i < VIZ_BARS; i++) {
      // Log-scale frequency mapping (emphasises bass + mids)
      const t   = i / VIZ_BARS;
      const bin = Math.floor(Math.pow(t, 0.75) * freqData.length * 0.8);
      const raw = freqData[Math.min(bin, freqData.length - 1)] / 255;

      // Lerp for smooth decay
      smoothedViz[i] += (raw - smoothedViz[i]) * 0.22;
      const v = smoothedViz[i];

      if (v < 0.005) continue;

      const x    = spacing + i * (barW + spacing);
      const barH = v * midY * 0.88;
      const rad  = Math.min(barW / 2, 2.5);

      const alpha = 0.2 + v * 0.8;

      if (isLight) {
        ctx.fillStyle = `rgba(0,0,0,${alpha})`;
      } else {
        // Subtle warm white tint in dark mode
        const lum = Math.round(220 + v * 35);
        ctx.fillStyle = `rgba(${lum},${lum},${Math.round(lum * 0.96)},${alpha})`;
      }

      // Top half (up from center)
      ctx.beginPath();
      ctx.roundRect(x, midY - barH, barW, barH, [rad, rad, 0, 0]);
      ctx.fill();

      // Bottom half (mirror, down from center)
      ctx.beginPath();
      ctx.roundRect(x, midY, barW, barH, [0, 0, rad, rad]);
      ctx.fill();
    }

    // Center hairline
    ctx.fillStyle = isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.05)';
    ctx.fillRect(0, midY - 0.5, W, 1);
  }

  frame();
}
