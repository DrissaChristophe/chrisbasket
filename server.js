require('dotenv').config();
const express      = require('express');
const session      = require('express-session');
const MongoStore   = require('connect-mongo');
const multer       = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary   = require('cloudinary').v2;
const mongoose     = require('mongoose');
const path         = require('path');

const Chaussure    = require('./config/Chaussure');
const app          = express();
const PORT         = process.env.PORT || 3000;

// ── Cloudinary ───────────────────────────────────────────
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ── Multer → upload direct vers Cloudinary ───────────────
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder:          'chrisbasket',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation:  [{ width: 900, height: 700, crop: 'limit', quality: 'auto' }],
  },
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

// ── MongoDB ──────────────────────────────────────────────
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ MongoDB connecté'))
  .catch(err => { console.error('❌ MongoDB:', err.message); process.exit(1); });

// ── Middleware ───────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
  secret:            process.env.SESSION_SECRET || 'chrisbasket-secret',
  resave:            false,
  saveUninitialized: false,
  store:             MongoStore.create({ mongoUrl: process.env.MONGODB_URI }),
  cookie:            { maxAge: 24 * 60 * 60 * 1000 },
}));

function requireAdmin(req, res, next) {
  if (req.session && req.session.admin) return next();
  res.redirect('/admin/login');
}

// ════════════════════════════════════════════════════════
//  ROUTES PUBLIQUES
// ════════════════════════════════════════════════════════

app.get('/', (req, res) =>
  res.sendFile(path.join(__dirname, 'views', 'index.html')));

app.get('/api/chaussures', async (req, res) => {
  try {
    const { q } = req.query;
    const filtre = q && q.trim() ? { $text: { $search: q.trim() } } : {};
    const chaussures = await Chaussure.find(filtre).sort({ dateAjout: -1 });
    res.json(chaussures);
  } catch (e) { res.status(500).json({ erreur: e.message }); }
});

// ════════════════════════════════════════════════════════
//  ROUTES ADMIN
// ════════════════════════════════════════════════════════

app.get('/admin/login', (req, res) => {
  if (req.session.admin) return res.redirect('/admin');
  res.sendFile(path.join(__dirname, 'views', 'login.html'));
});

app.post('/admin/login', (req, res) => {
  const { username, password } = req.body;
  if (
    username === (process.env.ADMIN_USERNAME || 'admin') &&
    password === (process.env.ADMIN_PASSWORD || 'chrisbasket2025')
  ) {
    req.session.admin = true;
    res.redirect('/admin');
  } else {
    res.redirect('/admin/login?erreur=1');
  }
});

app.get('/admin/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/admin/login');
});

app.get('/admin', requireAdmin, (req, res) =>
  res.sendFile(path.join(__dirname, 'views', 'admin.html')));

app.get('/api/admin/chaussures', requireAdmin, async (req, res) => {
  try {
    const list = await Chaussure.find().sort({ dateAjout: -1 });
    res.json(list);
  } catch (e) { res.status(500).json({ erreur: e.message }); }
});

// ── Ajouter ──────────────────────────────────────────────
app.post('/api/admin/chaussures', requireAdmin,
  upload.array('photos', 3),
  async (req, res) => {
    try {
      const { nom, description, prix, tailles, stock } = req.body;
      if (!nom || !prix) return res.status(400).json({ erreur: 'Nom et prix requis.' });

      const photos        = (req.files || []).map(f => f.path);     // URL Cloudinary
      const cloudinaryIds = (req.files || []).map(f => f.filename); // public_id

      const chaussure = await Chaussure.create({
        nom,
        description: description || '',
        prix:        parseFloat(prix),
        categorie:   'Unisexe',
        tailles:     tailles ? tailles.split(',').map(t => t.trim()).filter(Boolean) : [],
        stock:       parseInt(stock) || 0,
        photos,
        cloudinaryIds,
      });
      res.json({ success: true, chaussure });
    } catch (e) { res.status(500).json({ erreur: e.message }); }
  }
);

// ── Modifier ──────────────────────────────────────────────
app.put('/api/admin/chaussures/:id', requireAdmin,
  upload.array('photos', 3),
  async (req, res) => {
    try {
      const chaussure = await Chaussure.findById(req.params.id);
      if (!chaussure) return res.status(404).json({ erreur: 'Introuvable.' });

      const { nom, description, prix, tailles, stock, photosExistantes } = req.body;

      // URLs que le client a décidé de garder
      const urlsGardees = photosExistantes
        ? (Array.isArray(photosExistantes) ? photosExistantes : [photosExistantes])
        : [];

      // Supprimer de Cloudinary les photos retirées
      const photosRetirees = chaussure.photos.filter(p => !urlsGardees.includes(p));
      const idsRetires = (chaussure.cloudinaryIds || []).filter((_, i) =>
        photosRetirees.includes(chaussure.photos[i])
      );
      if (idsRetires.length) {
        await Promise.all(idsRetires.map(id => cloudinary.uploader.destroy(id)));
      }

      // Nouvelles photos
      const nouvellesUrls = (req.files || []).map(f => f.path);
      const nouveauxIds   = (req.files || []).map(f => f.filename);

      // IDs conservés (correspondant aux URLs gardées)
      const idsGardes = (chaussure.cloudinaryIds || []).filter((_, i) =>
        urlsGardees.includes(chaussure.photos[i])
      );

      chaussure.nom           = nom || chaussure.nom;
      chaussure.description   = description ?? chaussure.description;
      chaussure.prix          = prix ? parseFloat(prix) : chaussure.prix;
      chaussure.tailles       = tailles
        ? tailles.split(',').map(t => t.trim()).filter(Boolean)
        : chaussure.tailles;
      chaussure.stock         = stock !== undefined ? parseInt(stock) : chaussure.stock;
      chaussure.photos        = [...urlsGardees, ...nouvellesUrls].slice(0, 3);
      chaussure.cloudinaryIds = [...idsGardes,   ...nouveauxIds  ].slice(0, 3);

      await chaussure.save();
      res.json({ success: true, chaussure });
    } catch (e) { res.status(500).json({ erreur: e.message }); }
  }
);

// ── Supprimer ─────────────────────────────────────────────
app.delete('/api/admin/chaussures/:id', requireAdmin, async (req, res) => {
  try {
    const chaussure = await Chaussure.findById(req.params.id);
    if (!chaussure) return res.status(404).json({ erreur: 'Introuvable.' });

    // Supprimer toutes les photos de Cloudinary
    if (chaussure.cloudinaryIds && chaussure.cloudinaryIds.length) {
      await Promise.all(chaussure.cloudinaryIds.map(id => cloudinary.uploader.destroy(id)));
    }

    await chaussure.deleteOne();
    res.json({ success: true });
  } catch (e) { res.status(500).json({ erreur: e.message }); }
});

// ── Start ─────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🏀 ChrisBasket → http://localhost:${PORT}`);
  console.log(`🔐 Admin      → http://localhost:${PORT}/admin/login`);
  console.log(`☁️  Cloudinary → ${process.env.CLOUDINARY_CLOUD_NAME || '⚠️ non configuré'}`);
});
