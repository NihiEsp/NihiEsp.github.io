/* ============================================================
   data.js
   Owns: Last.fm now-playing, currently.json watcher/working,
         visit counter (counterapi.dev), live uptime clock,
         footer year
   No external dependencies — all self-contained async fetches
   ============================================================ */

/* ── Last.fm now playing ─────────────────────────────────── */
const LFM_USER = 'NoodleDragon1';
const LFM_KEY  = '52f2a80a9fb33c63407f69a9ceb8e6cf';
const LFM_URL  = `https://ws.audioscrobbler.com/2.0/?method=user.getrecenttracks&user=${LFM_USER}&api_key=${LFM_KEY}&limit=1&format=json`;

async function fetchNowPlaying() {
  try {
    const res   = await fetch(LFM_URL);
    if (!res.ok) throw new Error('lfm ' + res.status);
    const data  = await res.json();
    const track = data.recenttracks?.track?.[0];
    const isLive = track?.['@attr']?.nowplaying === 'true';

    if (!track || !isLive) {
      document.getElementById('curr-track').textContent           = 'Nothing on';
      document.getElementById('curr-artist').textContent          = '';
      document.getElementById('curr-artist-static').textContent   = 'Not listening';
      document.getElementById('curr-live-wrap').style.display     = 'none';
      document.getElementById('curr-artist-static').style.display = 'block';
      return;
    }

    const title  = track.name;
    const artist = track.artist?.['#text'] || '';

    document.getElementById('curr-track').textContent           = title;
    document.getElementById('curr-artist').textContent          = artist;
    document.getElementById('curr-artist-static').textContent   = artist;
    document.getElementById('curr-live-wrap').style.display     = 'flex';
    document.getElementById('curr-artist-static').style.display = 'none';
  } catch (e) {
    console.warn('Last.fm fetch failed:', e);
  }
}

fetchNowPlaying();
setInterval(fetchNowPlaying, 30_000);


/* ── currently.json — watching / working ────────────────── */
// Edit data/currently.json to update these cards without touching JS.
async function fetchCurrently() {
  try {
    const res = await fetch('data/currently.json?v=' + Date.now());
    if (!res.ok) throw new Error('currently.json ' + res.status);
    const d = await res.json();

    if (d.watching) {
      document.getElementById('curr-watching').textContent     = d.watching.title || '—';
      document.getElementById('curr-watching-sub').textContent = d.watching.where || '';
    }
    if (d.working) {
      document.getElementById('curr-working').textContent      = d.working.title || '—';
      document.getElementById('curr-working-sub').textContent  = d.working.sub   || '';
    }
  } catch (e) {
    // Silently fail — static fallback '—' already in DOM
    console.warn('currently.json not found:', e);
  }
}

fetchCurrently();


/* ── Visit counter (counterapi.dev) ─────────────────────── */
const COUNTER_NS  = 'nihi-folio-2026';
const COUNTER_KEY = 'visits';
const COUNTER_URL = `https://api.counterapi.dev/v1/${COUNTER_NS}/${COUNTER_KEY}/up`;

async function initVisitCounter() {
  const el = document.getElementById('stat-visits');
  try {
    const res  = await fetch(COUNTER_URL);
    if (!res.ok) throw new Error('status ' + res.status);
    const data  = await res.json();
    const count = typeof data.count === 'number' ? data.count : parseInt(data.count, 10);
    if (isNaN(count)) throw new Error('no count');

    el.classList.remove('loading');
    // Animate counting up from near the final value
    let current = Math.max(0, count - 40);
    const step = () => {
      if (current < count) {
        current = Math.min(current + Math.ceil((count - current) / 8), count);
        el.textContent = current.toLocaleString();
        requestAnimationFrame(step);
      } else {
        el.textContent = count.toLocaleString();
      }
    };
    step();
  } catch (err) {
    document.getElementById('stat-visits').textContent = '—';
    console.warn('Visit counter unavailable:', err);
  }
}

initVisitCounter();


/* ── Live uptime clock ───────────────────────────────────── */
// Update SITE_BORN when you redeploy / reset
const SITE_BORN = new Date(2026, 2, 20); // March 20, 2026

function updateUptime() {
  const el          = document.getElementById('stat-uptime');
  const diff        = Date.now() - SITE_BORN.getTime();
  const totalSecs   = Math.floor(diff / 1000);
  const days        = Math.floor(totalSecs / 86400);
  const hours       = Math.floor((totalSecs % 86400) / 3600);
  const minutes     = Math.floor((totalSecs % 3600) / 60);
  const seconds     = totalSecs % 60;

  let display;
  if (days >= 365) {
    const years = Math.floor(days / 365);
    display = years + 'y ' + (days % 365) + 'd';
  } else if (days >= 1) {
    display = days + 'd ' + String(hours).padStart(2, '0') + 'h';
  } else {
    display = String(hours).padStart(2, '0') + ':' + String(minutes).padStart(2, '0') + ':' + String(seconds).padStart(2, '0');
  }

  el.textContent = display;
}

updateUptime();
setInterval(updateUptime, 1000);


/* ── Footer year ─────────────────────────────────────────── */
document.getElementById('footer-year').textContent = new Date().getFullYear();
