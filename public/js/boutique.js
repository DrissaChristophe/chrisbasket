// ── Config ───────────────────────────────────────────────
const WA_NUMBER = '+22673369164'; // ← Remplacez par votre numéro
let searchTimer = null;
let modalPhotos = [];
let modalPhotoIndex = 0;

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

// ══════════════════════════════════════════════════════════
//  MODAL DÉTAIL CHAUSSURE
// ══════════════════════════════════════════════════════════

function ouvrirModal(c) {
  modalPhotos = c.photos && c.photos.length ? c.photos : [];
  modalPhotoIndex = 0;

  const enStock = c.stock > 0;
  const waMsg = encodeURIComponent(`Bonjour! Je suis intéressé(e) par la chaussure "${c.nom}" chez ChrisBasket.`);
  const tailles = c.tailles && c.tailles.length
    ? `<div class="modal-tailles"><span class="modal-label">📏 Tailles disponibles</span><div class="tailles-list">${c.tailles.map(t => `<span class="taille-badge">${t}</span>`).join('')}</div></div>`
    : '';

  document.getElementById('modal-detail').innerHTML = `
    <div class="detail-overlay" onclick="fermerModal(event)">
      <div class="detail-modal">

        <button class="detail-close" onclick="fermerModalBtn()">✕</button>

        <div class="detail-left">
          <div class="detail-main-photo" id="detail-main-photo">
            ${modalPhotos.length > 0
              ? `<img src="${modalPhotos[0]}" alt="${c.nom}" id="detail-photo-img"/>`
              : `<div class="detail-no-photo">👟</div>`}
          </div>
          ${modalPhotos.length > 1 ? `
            <div class="detail-thumbs" id="detail-thumbs">
              ${modalPhotos.map((p, i) => `
                <img src="${p}" alt="${c.nom} ${i+1}" class="detail-thumb ${i===0?'active':''}" onclick="changerPhoto(${i})"/>
              `).join('')}
            </div>` : ''}
        </div>

        <div class="detail-right">
          <div class="detail-tag">Unisexe</div>
          <div class="detail-nom">${c.nom}</div>
          <div class="detail-prix">${Number(c.prix).toLocaleString('fr-FR')} FCFA</div>
          <div class="detail-stock ${!enStock ? 'out' : ''}">
            ${enStock ? `✅ ${c.stock} paire(s) en stock` : '❌ Rupture de stock'}
          </div>
          ${c.description ? `<div class="detail-desc">${c.description}</div>` : ''}
          ${tailles}
          <div class="detail-actions">
            ${enStock
              ? `<a href="https://wa.me/${WA_NUMBER}?text=${waMsg}" class="detail-btn-wa" target="_blank">💬 Commander sur WhatsApp</a>`
              : `<span class="detail-btn-disabled">Indisponible</span>`}
            <a href="tel:+${WA_NUMBER}" class="detail-btn-call">📞 Appeler</a>
          </div>
        </div>

      </div>
    </div>`;

  document.getElementById('modal-detail').style.display = 'block';
  document.body.style.overflow = 'hidden';
}

function fermerModal(e) {
  if (e && e.target !== e.currentTarget) return;
  fermerModalBtn();
}

function fermerModalBtn() {
  document.getElementById('modal-detail').style.display = 'none';
  document.body.style.overflow = '';
}

function changerPhoto(index) {
  modalPhotoIndex = index;
  document.getElementById('detail-photo-img').src = modalPhotos[index];
  document.querySelectorAll('.detail-thumb').forEach((t, i) =>
    t.classList.toggle('active', i === index));
}

// Fermer avec Échap
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') fermerModalBtn();
});

// ── Carrousel carte ───────────────────────────────────────
function buildCarousel(photos, nom, chaussure) {
  const dataAttr = `data-shoe='${JSON.stringify(chaussure).replace(/'/g, "&#39;")}'`;

  if (!photos || photos.length === 0) {
    return `<div class="card-carousel" ${dataAttr} onclick="ouvrirModal(JSON.parse(this.dataset.shoe))">
      <div class="carousel-placeholder"><div class="ph-icon">👟</div><div>Aucune photo</div></div>
    </div>`;
  }

  const imgs = photos.map((p, i) =>
    `<img src="${p}" alt="${nom} ${i+1}" loading="lazy" style="display:${i===0?'block':'none'};width:100%;height:100%;object-fit:contain;background:#1a1a18;position:absolute;inset:0"/>`
  ).join('');

  const dots = photos.length > 1 ? photos.map((_, i) =>
    `<span class="carousel-dot${i===0?' active':''}" onclick="event.stopPropagation();goDot(this,${i})"></span>`
  ).join('') : '';

  const arrows = photos.length > 1 ? `
    <button class="carousel-arrow carousel-prev" onclick="event.stopPropagation();carouselStep(this,-1)">‹</button>
    <button class="carousel-arrow carousel-next" onclick="event.stopPropagation();carouselStep(this,1)">›</button>` : '';

  return `
    <div class="card-carousel" ${dataAttr} onclick="ouvrirModal(JSON.parse(this.dataset.shoe))" style="cursor:pointer;position:relative">
      ${imgs}
      ${arrows}
      ${dots ? `<div class="carousel-dots">${dots}</div>` : ''}
      <div class="carousel-zoom-hint">🔍 Cliquer pour voir les détails</div>
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

// ── Chargement ────────────────────────────────────────────
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
          `<img src="${premiere.photos[0]}" alt="${premiere.nom}" style="width:100%;height:100%;object-fit:contain;background:#1a1a18"/>`;
      }
    }

    if (chaussures.length === 0) {
      grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1">
        <span class="empty-icon">🔍</span>
        <p>${q ? `Aucun résultat pour "${q}".` : 'Aucune chaussure disponible pour le moment.'}</p>
      </div>`;
      return;
    }

    grid.innerHTML = chaussures.map(c => {
      const enStock = c.stock > 0;
      const waMsg = encodeURIComponent(`Bonjour! Je suis intéressé(e) par la chaussure "${c.nom}" chez ChrisBasket.`);
      return `
        <div class="shoe-card">
          ${buildCarousel(c.photos, c.nom, c)}
          <div class="shoe-card-body">
            <div class="shoe-tag">Unisexe</div>
            <div class="shoe-name" style="cursor:pointer" onclick="ouvrirModal(${JSON.stringify(c).replace(/"/g, '&quot;')})">${c.nom}</div>
            <div class="shoe-desc">${c.description ? c.description.substring(0, 80) + (c.description.length > 80 ? '...' : '') : ''}</div>
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

// ── Recherche ─────────────────────────────────────────────
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

// ── Init ──────────────────────────────────────────────────
charger();
