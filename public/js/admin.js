// ── État ─────────────────────────────────────────────────
let chaussures = [];
let modeEdit = false;
let idEdit = null;
// slots[i] = { file: File|null, existingUrl: string|null }
let slots = [
  { file: null, existingUrl: null },
  { file: null, existingUrl: null },
  { file: null, existingUrl: null }
];

// ── Toast ─────────────────────────────────────────────────
function showToast(msg, err = false) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = 'toast' + (err ? ' error' : '') + ' show';
  setTimeout(() => t.classList.remove('show'), 3500);
}

// ── Chargement ────────────────────────────────────────────
async function charger() {
  try {
    const res = await fetch('/api/admin/chaussures');
    chaussures = await res.json();
    afficherTable();
    mettreAJourStats();
  } catch (e) { showToast('Erreur de chargement', true); }
}

function mettreAJourStats() {
  document.getElementById('s-total').textContent = chaussures.length;
  document.getElementById('s-stock').textContent = chaussures.filter(c => c.stock > 0).length;
  document.getElementById('s-rupture').textContent = chaussures.filter(c => c.stock <= 0).length;
}

function afficherTable() {
  const tbody = document.getElementById('tbody');
  if (!chaussures.length) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:3rem;color:rgba(255,255,255,0.25)">Aucune chaussure. Cliquez sur "+ Ajouter".</td></tr>`;
    return;
  }
  tbody.innerHTML = chaussures.map(c => {
    const enStock = c.stock > 0;
    const photosHtml = c.photos && c.photos.length
      ? `<div class="td-imgs">${c.photos.map(p => `<img src="${p}" class="td-img"/>`).join('')}</div>`
      : `<div class="td-no-img">👟</div>`;
    return `<tr>
      <td>${photosHtml}</td>
      <td style="font-weight:500">${c.nom}</td>
      <td style="color:var(--accent);font-weight:700">${Number(c.prix).toLocaleString('fr-FR')} FCFA</td>
      <td><span class="badge ${enStock ? 'badge-green' : 'badge-red'}">${enStock ? c.stock + ' en stock' : 'Rupture'}</span></td>
      <td style="font-size:.8rem;color:rgba(255,255,255,0.4)">${c.tailles && c.tailles.length ? c.tailles.join(', ') : '—'}</td>
      <td><div class="actions">
        <button class="btn btn-outline btn-sm" onclick="ouvrirEdition('${c._id}')">✏️ Modifier</button>
        <button class="btn btn-danger btn-sm" onclick="supprimer('${c._id}','${c.nom.replace(/'/g,"\\'")}')">🗑️</button>
      </div></td>
    </tr>`;
  }).join('');
}

// ── Slots photo ───────────────────────────────────────────
function previewSlot(index, input) {
  const file = input.files[0];
  if (!file) return;
  slots[index].file = file;
  slots[index].existingUrl = null;
  const reader = new FileReader();
  reader.onload = e => {
    document.getElementById(`preview-${index}`).src = e.target.result;
    document.getElementById(`slot-${index}`).classList.add('has-photo');
  };
  reader.readAsDataURL(file);
}

function removeSlot(index, event) {
  event.preventDefault();
  event.stopPropagation();
  slots[index] = { file: null, existingUrl: null };
  document.getElementById(`preview-${index}`).src = '';
  document.getElementById(`slot-${index}`).classList.remove('has-photo');
  // reset input
  const input = document.querySelector(`#slot-${index} input[type="file"]`);
  input.value = '';
}

function resetSlots() {
  [0, 1, 2].forEach(i => {
    slots[i] = { file: null, existingUrl: null };
    document.getElementById(`preview-${i}`).src = '';
    document.getElementById(`slot-${i}`).classList.remove('has-photo');
    const input = document.querySelector(`#slot-${i} input[type="file"]`);
    input.value = '';
  });
}

function chargerPhotosExistantes(photos) {
  [0, 1, 2].forEach(i => {
    if (photos && photos[i]) {
      slots[i].existingUrl = photos[i];
      slots[i].file = null;
      document.getElementById(`preview-${i}`).src = photos[i];
      document.getElementById(`slot-${i}`).classList.add('has-photo');
    }
  });
}

// ── Modal ─────────────────────────────────────────────────
function ouvrirModal() {
  modeEdit = false; idEdit = null;
  document.getElementById('modal-titre').textContent = 'Ajouter une Chaussure';
  document.getElementById('btn-save').textContent = '💾 Sauvegarder';
  ['f-nom','f-desc','f-prix','f-tailles','f-stock'].forEach(id => document.getElementById(id).value = '');
  resetSlots();
  document.getElementById('overlay').classList.add('open');
}

function ouvrirEdition(id) {
  const c = chaussures.find(x => x._id === id);
  if (!c) return;
  modeEdit = true; idEdit = id;
  document.getElementById('modal-titre').textContent = 'Modifier la Chaussure';
  document.getElementById('btn-save').textContent = '💾 Mettre à jour';
  document.getElementById('f-nom').value = c.nom;
  document.getElementById('f-desc').value = c.description || '';
  document.getElementById('f-prix').value = c.prix;
  document.getElementById('f-tailles').value = c.tailles ? c.tailles.join(', ') : '';
  document.getElementById('f-stock').value = c.stock;
  resetSlots();
  chargerPhotosExistantes(c.photos);
  document.getElementById('overlay').classList.add('open');
}

function fermerModal() { document.getElementById('overlay').classList.remove('open'); }
function closeOverlay(e) { if (e.target === document.getElementById('overlay')) fermerModal(); }

// ── Sauvegarder ───────────────────────────────────────────
async function sauvegarder() {
  const nom = document.getElementById('f-nom').value.trim();
  const prix = document.getElementById('f-prix').value;
  if (!nom || !prix) { showToast('Le nom et le prix sont obligatoires.', true); return; }

  const formData = new FormData();
  formData.append('nom', nom);
  formData.append('description', document.getElementById('f-desc').value.trim());
  formData.append('prix', prix);
  formData.append('categorie', 'Unisexe');
  formData.append('tailles', document.getElementById('f-tailles').value);
  formData.append('stock', document.getElementById('f-stock').value || 0);

  // Photos existantes gardées
  slots.forEach(s => {
    if (s.existingUrl) formData.append('photosExistantes', s.existingUrl);
  });
  // Nouvelles photos
  slots.forEach(s => {
    if (s.file) formData.append('photos', s.file);
  });

  const btn = document.getElementById('btn-save');
  btn.textContent = '⏳ En cours...';
  btn.disabled = true;

  try {
    const url = modeEdit ? `/api/admin/chaussures/${idEdit}` : '/api/admin/chaussures';
    const method = modeEdit ? 'PUT' : 'POST';
    const res = await fetch(url, { method, body: formData });
    const data = await res.json();
    if (data.success) {
      fermerModal();
      await charger();
      showToast(modeEdit ? '✅ Chaussure mise à jour !' : '✅ Chaussure ajoutée !');
    } else {
      showToast(data.erreur || 'Erreur inconnue.', true);
    }
  } catch (e) {
    showToast('Erreur de connexion.', true);
  } finally {
    btn.textContent = '💾 Sauvegarder';
    btn.disabled = false;
  }
}

// ── Supprimer ─────────────────────────────────────────────
async function supprimer(id, nom) {
  if (!confirm(`Supprimer "${nom}" ? Cette action est irréversible.`)) return;
  try {
    const res = await fetch(`/api/admin/chaussures/${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (data.success) { await charger(); showToast('🗑️ Chaussure supprimée.'); }
    else showToast(data.erreur || 'Erreur.', true);
  } catch (e) { showToast('Erreur de connexion.', true); }
}

// ── Init ─────────────────────────────────────────────────
charger();
