// ── Config ───────────────────────────────────────────────
const WA_NUMBER = '+22673369164'; // ← Remplacez par votre numéro
let searchTimer = null;

// ── Init liens contact ───────────────────────────────────
document.getElementById('wa-link').href =
  `https://wa.me/${WA_NUMBER}?text=Bonjour!%20Je%20suis%20int%C3%A9ress%C3%A9(e)%20par%20une%20commande%20ChrisBasket.`;
document.getElementById('call-link').href = `tel:+${WA_NUMBER}`;

// ── Toast ────────────────────────────────────────────────
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 3000);
}

// ── Carrousel ────────────────────────────────────────────
function buildCarousel(photos, nom) {
  if (!photos || photos.length === 0) {
    return `<div class="card-carousel">
      <div class="carousel-placeholder"><div class="ph-icon">👟</div><div>Aucune photo</div></div>
    </div>`;
  }
  if (photos.length === 1) {
    return `<div class="card-carousel">
      <img src="${photos[0]}" alt="${nom}" loading="lazy"/>
    </div>`;
  }
  const imgs = photos.map((p, i) =>
    `<img src="${p}" alt="${nom} ${i+1}" loading="lazy" style="display:${i===0?'block':'none'};width:100%;height:100%;object-fit:cover;position:absolute;inset:0"/>`
  ).join('');
  const dots = photos.map((_, i) =>
    `<span class="carousel-dot${i===0?' active':''}" onclick="goDot(this,${i})"></span>`
  ).join('');
  return `
    <div class="card-carousel" style="position:relative">
      ${imgs}
      ${photos.length > 1 ? `
        <button class="carousel-arrow carousel-prev" onclick="carouselStep(this,-1)">‹</button>
        <button class="carousel-arrow carousel-next" onclick="carouselStep(this,1)">›</button>
        <div class="carousel-dots">${dots}</div>
      ` : ''}
    </div>`;
}

function carouselStep(btn, dir) {
  const carousel = btn.closest('.card-carousel');
  const imgs = carousel.querySelectorAll('img');
  const dots = carousel.querySelectorAll('.carousel-dot');
  let cur = [...imgs].findIndex(i => i.style.display !== 'none');
  imgs[cur].style.display = 'none';
  if (dots[cur]) dots[cur].classList.remove('active');
  cur = (cur + dir + imgs.length) % imgs.length;
  imgs[cur].style.display = 'block';
  if (dots[cur]) dots[cur].classList.add('active');
}

function goDot(dot, index) {
  const carousel = dot.closest('.card-carousel');
  const imgs = carousel.querySelectorAll('img');
  const dots = carousel.querySelectorAll('.carousel-dot');
  imgs.forEach((img, i) => img.style.display = i === index ? 'block' : 'none');
  dots.forEach((d, i) => d.classList.toggle('active', i === index));
}

// ── Chargement ───────────────────────────────────────────
async function charger(q = '') {
  const grid = document.getElementById('catalog-grid');
  grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1"><span class="empty-icon">⏳</span><p>Chargement...</p></div>`;
  try {
    const url = q ? `/api/chaussures?q=${encodeURIComponent(q)}` : '/api/chaussures';
    const res = await fetch(url);
    const chaussures = await res.json();

    document.getElementById('stat-count').textContent = chaussures.length;

    if (chaussures.length > 0 && !document.getElementById('hero-frame').querySelector('img')) {
      const premiere = chaussures.find(c => c.photos && c.photos.length > 0);
      if (premiere) {
        document.getElementById('hero-frame').innerHTML =
          `<img src="${premiere.photos[0]}" alt="${premiere.nom}" style="width:100%;height:100%;object-fit:cover"/>`;
      }
    }

    if (chaussures.length === 0) {
      grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1">
        <span class="empty-icon">🔍</span>
        <p>${q ? 'Aucun résultat pour "' + q + '".' : 'Aucune chaussure disponible pour le moment.'}</p>
      </div>`;
      return;
    }

    grid.innerHTML = chaussures.map(c => {
      const enStock = c.stock > 0;
      const tailles = c.tailles && c.tailles.length
        ? `<div class="shoe-tailles">📏 Tailles : ${c.tailles.join(', ')}</div>` : '';
      const waMsg = encodeURIComponent(`Bonjour! Je suis intéressé(e) par la chaussure "${c.nom}" chez ChrisBasket.`);
      return `
        <div class="shoe-card">
          ${buildCarousel(c.photos, c.nom)}
          <div class="shoe-card-body">
            <div class="shoe-tag">Unisexe</div>
            <div class="shoe-name">${c.nom}</div>
            <div class="shoe-desc">${c.description || ''}</div>
            ${tailles}
            <div class="stock-badge ${!enStock ? 'out' : ''}">
              ${enStock ? `✅ ${c.stock} paire(s) en stock` : '❌ Rupture de stock'}
            </div>
            <div class="shoe-footer">
              <div class="shoe-price">${Number(c.prix).toLocaleString('fr-FR')} FCFA</div>
              ${enStock
                ? `<a href="https://wa.me/${WA_NUMBER}?text=${waMsg}" class="shoe-inquire" target="_blank">Commander</a>`
                : `<span style="font-size:.8rem;color:rgba(255,255,255,0.3)">Indisponible</span>`}
            </div>
          </div>
        </div>`;
    }).join('');
  } catch (e) {
    grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1"><span class="empty-icon">❌</span><p>Erreur de chargement.</p></div>`;
  }
}

// ── Recherche ────────────────────────────────────────────
const searchInput = document.getElementById('search-input');
const searchClear = document.getElementById('search-clear');

searchInput.addEventListener('input', () => {
  const q = searchInput.value.trim();
  searchClear.classList.toggle('visible', q.length > 0);
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => charger(q), 350);
});

function clearSearch() {
  searchInput.value = '';
  searchClear.classList.remove('visible');
  charger();
}

// ── Init ─────────────────────────────────────────────────
charger();
