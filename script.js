/* script.js
 - Carrega cursos, popula catálogo, carrossel e páginas
 - Favoritos salvos em localStorage ('sb_favs')
 - Navegação simples: index.html, course.html?id=X, favorites.html
*/

const COURSES_JSON = 'data/courses.json';
let COURSES = [];
let FAVS = new Set(JSON.parse(localStorage.getItem('sb_favs') || '[]'));

// --- Helpers ---
const $ = sel => document.querySelector(sel);
const $$ = sel => Array.from(document.querySelectorAll(sel));
const fetchCourses = async () => {
  try {
    const res = await fetch(COURSES_JSON);
    const data = await res.json();
    COURSES = data;
    return data;
  } catch (err) {
    console.error('Erro ao carregar cursos', err);
    return [];
  }
};

function saveFavs(){ localStorage.setItem('sb_favs', JSON.stringify(Array.from(FAVS))); }

// --- Render catalog grid ---
async function renderCatalog(){
  const courses = COURSES.slice();
  const grid = $('#course-grid');
  if(!grid) return;
  grid.innerHTML = courses.map(c => courseCardHtml(c)).join('');
  // bind favorites & open
  $$('.card-open').forEach(btn => btn.addEventListener('click', e => {
    const id = e.currentTarget.dataset.id;
    window.location.href = `course.html?id=${id}`;
  }));
  $$('.fav-btn').forEach(btn => btn.addEventListener('click', e => {
    e.stopPropagation();
    const id = Number(e.currentTarget.dataset.id);
    toggleFav(id, e.currentTarget);
  }));
  // search binding
  const search = $('#search-input');
  if(search) search.addEventListener('input', () => filterAndRender());
}

function courseCardHtml(c){
  const isFav = FAVS.has(c.id);
  return `
    <article class="card course-card" title="${escapeHtml(c.title)}">
      <img src="${c.thumb}" alt="${escapeHtml(c.title)}" />
      <div>
        <h4>${escapeHtml(c.title)}</h4>
        <div class="course-meta">
          <span class="muted">${escapeHtml(c.category)} • ${escapeHtml(c.level)}</span>
          <span><strong>${escapeHtml(c.duration)}</strong></span>
        </div>
      </div>
      <div style="margin-top:10px;display:flex;gap:8px">
        <button class="btn card-open" data-id="${c.id}">Abrir</button>
        <button class="btn ghost fav-btn" data-id="${c.id}">${isFav ? 'Remover' : 'Favoritar'}</button>
      </div>
    </article>
  `;
}

// --- Course page ---
function renderCourseDetail(){
  const el = $('#course-detail');
  if(!el) return;
  const params = new URLSearchParams(location.search);
  const id = Number(params.get('id')) || null;
  if(!id){
    el.innerHTML = '<p class="muted">Curso não encontrado.</p>';
    return;
  }
  const c = COURSES.find(x => x.id === id);
  if(!c){ el.innerHTML = '<p class="muted">Curso não encontrado.</p>'; return; }

  el.innerHTML = `
    <div>
      <img src="${c.thumb}" alt="${escapeHtml(c.title)}" />
      <div class="course-info">
        <h2>${escapeHtml(c.title)}</h2>
        <p class="muted">${escapeHtml(c.category)} • ${escapeHtml(c.level)} • ${escapeHtml(c.duration)}</p>
        <p>${escapeHtml(c.description)}</p>
        <div style="margin-top:12px;display:flex;gap:8px">
          <button id="fav-toggle" class="btn">${FAVS.has(c.id) ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}</button>
          <a href="index.html" class="btn ghost">Voltar</a>
        </div>
      </div>
    </div>
    <aside>
      <div class="card">
        <h4>Conteúdo do curso</h4>
        <ul id="module-list" class="module-list"></ul>
      </div>
    </aside>
  `;

  // fake modules
  const modules = [
    "Introdução e objetivos",
    "Configuração do ambiente",
    "Módulos práticos",
    "Projeto final",
    "Avaliação e próximos passos"
  ];
  $('#module-list').innerHTML = modules.map((m,i) => `<li class="module"><span>${i+1}. ${escapeHtml(m)}</span><button class="btn ghost">Ver</button></li>`).join('');

  $('#fav-toggle').addEventListener('click', () => {
    toggleFav(c.id, $('#fav-toggle'));
    $('#fav-toggle').textContent = FAVS.has(c.id) ? 'Remover dos favoritos' : 'Adicionar aos favoritos';
  });
}

// --- Favorites page ---
function renderFavorites(){
  const grid = $('#favorites-grid');
  if(!grid) return;
  const favIds = Array.from(FAVS);
  if(favIds.length === 0){
    $('#no-favs') && ($('#no-favs').style.display = 'block');
    grid.innerHTML = '';
    return;
  }
  $('#no-favs') && ($('#no-favs').style.display = 'none');
  const favs = COURSES.filter(c => FAVS.has(c.id));
  grid.innerHTML = favs.map(c => `
    <article class="card course-card">
      <img src="${c.thumb}" alt="${escapeHtml(c.title)}" />
      <div><h4>${escapeHtml(c.title)}</h4><div class="course-meta"><span class="muted">${escapeHtml(c.category)}</span><span><strong>${escapeHtml(c.duration)}</strong></span></div></div>
      <div style="margin-top:10px;display:flex;gap:8px">
        <button class="btn" onclick="window.location.href='course.html?id=${c.id}'">Abrir</button>
        <button class="btn ghost" onclick="removeFav(${c.id})">Remover</button>
      </div>
    </article>
  `).join('');
}

// --- Toggle favorite ---
function toggleFav(id, btn){
  if(FAVS.has(id)) FAVS.delete(id);
  else FAVS.add(id);
  saveFavs();
  if(btn) btn.textContent = FAVS.has(id) ? 'Remover' : 'Favoritar';
  // re-render some areas
  renderCatalog();
  renderFavorites();
}

// helper for favorites remove from button in favorites.html
function removeFav(id){ FAVS.delete(id); saveFavs(); renderFavorites(); renderCatalog(); }

// --- Carousel ---
function initCarousel(){
  const track = document.querySelector('.carousel-track');
  const prev = document.querySelector('.carousel-prev');
  const next = document.querySelector('.carousel-next');
  if(!track) return;
  // take first 4 courses for carousel
  const items = COURSES.slice(0,5).map(c => {
    return `<div class="card" style="min-width:260px">
      <img src="${c.thumb}" style="width:100%;height:140px;object-fit:cover;border-radius:8px;margin-bottom:8px" />
      <h4>${escapeHtml(c.title)}</h4>
      <p class="muted">${escapeHtml(c.level)} • ${escapeHtml(c.duration)}</p>
      <div style="margin-top:8px"><button class="btn card-open" data-id="${c.id}">Abrir</button><button class="btn ghost fav-btn" data-id="${c.id}">${FAVS.has(c.id)?'Remover':'Favoritar'}</button></div>
    </div>`;
  }).join('');
  track.innerHTML = items;
  // simple sliding
  let index = 0;
  const maxIndex = Math.max(0, COURSES.slice(0,5).length - 1);
  function update(){ track.style.transform = `translateX(${ -index * (280) }px)`; }
  prev && prev.addEventListener('click', () => { index = Math.max(0, index-1); update(); setTimeout(bindCarouselButtons,100);});
  next && next.addEventListener('click', () => { index = Math.min(maxIndex, index+1); update(); setTimeout(bindCarouselButtons,100);});
  bindCarouselButtons();
  function bindCarouselButtons(){
    $$('.card-open').forEach(btn => btn.addEventListener('click', e => { const id = e.currentTarget.dataset.id; window.location.href = `course.html?id=${id}`; }));
    $$('.fav-btn').forEach(btn => btn.addEventListener('click', e => { e.stopPropagation(); toggleFav(Number(e.currentTarget.dataset.id), e.currentTarget); }));
  }
}

// --- Search/Filter/Sort ---
function filterAndRender(){
  const q = ($('#search-input') && $('#search-input').value.toLowerCase()) || '';
  const level = ($('#filter-level') && $('#filter-level').value) || 'all';
  const sort = ($('#sort-by') && $('#sort-by').value) || 'popular';
  let list = COURSES.slice();

  if(level !== 'all') list = list.filter(c => c.level === level);
  if(q) list = list.filter(c => (c.title + ' ' + c.description).toLowerCase().includes(q));
  if(sort === 'new') list = list.sort((a,b) => b.id - a.id);
  if(sort === 'duration') list = list.sort((a,b) => parseInt(a.duration) - parseInt(b.duration));

  const grid = $('#course-grid');
  if(!grid) return;
  grid.innerHTML = list.map(c => courseCardHtml(c)).join('');
  // rebind
  $$('.card-open').forEach(btn => btn.addEventListener('click', e => { const id = e.currentTarget.dataset.id; window.location.href = `course.html?id=${id}`; }));
  $$('.fav-btn').forEach(btn => btn.addEventListener('click', e => { e.stopPropagation(); toggleFav(Number(e.currentTarget.dataset.id), e.currentTarget); }));
}

// --- Escape html helper ---
function escapeHtml(str=''){ return String(str).replace(/[&<>"']/g, function(m){ return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[m]; }); }

// --- Init app (runs on every page that includes script.js) ---
(async function init(){
  await fetchCourses();

  // if on index.html
  if(document.getElementById('course-grid')){
    renderCatalog();
    initCarousel();
    // filters binds
    $('#filter-level') && $('#filter-level').addEventListener('change', filterAndRender);
    $('#sort-by') && $('#sort-by').addEventListener('change', filterAndRender);
  }

  // if on course.html
  if(document.getElementById('course-detail')){
    renderCourseDetail();
  }

  // if on favorites.html
  if(document.getElementById('favorites-grid')){
    renderFavorites();
  }

})();
