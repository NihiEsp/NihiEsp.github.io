/* ============================================================
   projects.js
   Renders work/projects gallery from PROJECTS array.
   Edit PROJECTS below to add / remove entries.
   img: leave empty '' for the numbered placeholder.
   ============================================================ */

const PROJECTS = [
  {
    num: '01',
    title: 'Reel 001',
    year: '2025',
    roles: ['Motion Design', 'After Effects'],
    desc: 'Personal motion reel — experimental typography, transitions, and visual rhythm.',
    img: '',
    link: '#'
  },
  {
    num: '02',
    title: 'Brand Identity',
    year: '2025',
    roles: ['Visual Design', 'Art Direction'],
    desc: 'Full brand identity package for an independent artist — logotype, color, and motion guidelines.',
    img: '',
    link: '#'
  },
  {
    num: '03',
    title: 'Editorial Series',
    year: '2024',
    roles: ['Design', 'Layout'],
    desc: 'A series of editorial spreads exploring brutalist grid systems and deliberate negative space.',
    img: '',
    link: '#'
  },
  {
    num: '04',
    title: 'Campaign Direction',
    year: '2024',
    roles: ['Management', 'Creative Direction'],
    desc: 'Creative direction and team coordination for a multi-platform digital launch campaign.',
    img: '',
    link: '#'
  },
  {
    num: '05',
    title: 'Type Study',
    year: '2025',
    roles: ['Design', 'Typography'],
    desc: 'Ongoing series of typographic explorations — motion and static forms, variable fonts.',
    img: '',
    link: '#'
  },
  {
    num: '06',
    title: 'Void',
    year: '2023',
    roles: ['Visual Design', 'After Effects'],
    desc: 'Abstract visual series. Noise, grain, and silence as primary design elements.',
    img: '',
    link: '#'
  },
];

(function renderProjects() {
  const grid = document.getElementById('project-grid');
  if (!grid) return;

  grid.innerHTML = PROJECTS.map(p => {
    const thumbInner = p.img
      ? `<img src="${p.img}" alt="${p.title}" loading="lazy">`
      : `<div class="project-thumb-placeholder"><span class="project-num">${p.num}</span></div>`;

    const roles = p.roles.map(r => `<span class="project-role">${r}</span>`).join('');

    return `
      <div class="project-card gs-project">
        <a href="${p.link}" class="project-thumb-link" aria-label="View ${p.title}">
          <div class="project-thumb">
            ${thumbInner}
            <div class="project-overlay">
              <span class="project-arrow">↗</span>
            </div>
          </div>
        </a>
        <div class="project-meta">
          <div class="project-top">
            <h3 class="project-title">${p.title}</h3>
            <span class="project-year">${p.year}</span>
          </div>
          <div class="project-roles">${roles}</div>
          <p class="project-desc">${p.desc}</p>
        </div>
      </div>`;
  }).join('');
})();
