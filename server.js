require('dotenv').config();
const express    = require('express');
const session    = require('express-session');
const MongoStore = require('connect-mongo');
const multer     = require('multer');
const mongoose   = require('mongoose');
const path       = require('path');
const fs         = require('fs');

const Chaussure  = require('./config/Chaussure');
const app        = express();
const PORT       = process.env.PORT || 3000;

// ── Connexion MongoDB ────────────────────────────────────
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ MongoDB connecté'))
  .catch(err => {
    console.error('❌ MongoDB erreur:', err.message);
    process.exit(1);
  });

// ── Upload (Multer) ──────────────────────────────────────
const uploadDir = path.join(__dirname, 'public', 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  }
});
const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const ok = /jpeg|jpg|png|webp/.test(file.mimetype);
    cb(null, ok);
  },
  limits: { fileSize: 5 * 1024 * 1024 }
});

// ── Middleware ───────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
  secret: process.env.SESSION_SECRET || 'chrisbasket-secret',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({ mongoUrl: process.env.MONGODB_URI }),
  cookie: { maxAge: 24 * 60 * 60 * 1000 }
}));

// ── Auth guard ───────────────────────────────────────────
function requireAdmin(req, res, next) {
  if (req.session && req.session.admin) return next();
  res.redirect('/admin/login');
}

// ════════════════════════════════════════════════════════
//  ROUTES PUBLIQUES
// ════════════════════════════════════════════════════════

app.get('/', (req, res) =>
  res.sendFile(path.join(__dirname, 'views', 'index.html')));

// API liste chaussures (avec recherche)
app.get('/api/chaussures', async (req, res) => {
  try {
    const { q } = req.query;
    let filtre = {};
    if (q && q.trim()) {
      filtre = { $text: { $search: q.trim() } };
    }
    const chaussures = await Chaussure.find(filtre).sort({ dateAjout: -1 });
    res.json(chaussures);
  } catch (e) {
    res.status(500).json({ erreur: e.message });
  }
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

// API admin : liste
app.get('/api/admin/chaussures', requireAdmin, async (req, res) => {
  try {
    const chaussures = await Chaussure.find().sort({ dateAjout: -1 });
    res.json(chaussures);
  } catch (e) {
    res.status(500).json({ erreur: e.message });
  }
});

// API admin : ajouter (3 photos max)
app.post('/api/admin/chaussures', requireAdmin,
  upload.array('photos', 3),
  async (req, res) => {
    try {
      const { nom, description, prix, categorie, tailles, stock } = req.body;
      if (!nom || !prix) return res.status(400).json({ erreur: 'Nom et prix requis.' });
      const photos = (req.files || []).map(f => '/uploads/' + f.filename);
      const chaussure = await Chaussure.create({
        nom, description, prix: parseFloat(prix),
        categorie: categorie || 'Unisexe',
        tailles: tailles ? tailles.split(',').map(t => t.trim()).filter(Boolean) : [],
        stock: parseInt(stock) || 0,
        photos
      });
      res.json({ success: true, chaussure });
    } catch (e) {
      res.status(500).json({ erreur: e.message });
    }
  }
);

// API admin : modifier
app.put('/api/admin/chaussures/:id', requireAdmin,
  upload.array('photos', 3),
  async (req, res) => {
    try {
      const chaussure = await Chaussure.findById(req.params.id);
      if (!chaussure) return res.status(404).json({ erreur: 'Introuvable.' });

      const { nom, description, prix, categorie, tailles, stock, photosExistantes } = req.body;

      // Photos conservées depuis le client + nouvelles
      let photosGardees = photosExistantes
        ? (Array.isArray(photosExistantes) ? photosExistantes : [photosExistantes])
        : [];
      const nouvellesPhotos = (req.files || []).map(f => '/uploads/' + f.filename);
      let toutesPhotos = [...photosGardees, ...nouvellesPhotos].slice(0, 3);

      // Supprimer les anciennes photos retirées
      const photosSupprimees = chaussure.photos.filter(p => !photosGardees.includes(p));
      photosSupprimees.forEach(p => {
        const filePath = path.join(__dirname, 'public', p);
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      });

      chaussure.nom         = nom || chaussure.nom;
      chaussure.description = description ?? chaussure.description;
      chaussure.prix        = prix ? parseFloat(prix) : chaussure.prix;
      chaussure.categorie   = categorie || chaussure.categorie;
      chaussure.tailles     = tailles ? tailles.split(',').map(t => t.trim()).filter(Boolean) : chaussure.tailles;
      chaussure.stock       = stock !== undefined ? parseInt(stock) : chaussure.stock;
      chaussure.photos      = toutesPhotos;

      await chaussure.save();
      res.json({ success: true, chaussure });
    } catch (e) {
      res.status(500).json({ erreur: e.message });
    }
  }
);

// API admin : supprimer
app.delete('/api/admin/chaussures/:id', requireAdmin, async (req, res) => {
  try {
    const chaussure = await Chaussure.findById(req.params.id);
    if (!chaussure) return res.status(404).json({ erreur: 'Introuvable.' });
    chaussure.photos.forEach(p => {
      const filePath = path.join(__dirname, 'public', p);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    });
    await chaussure.deleteOne();
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ erreur: e.message });
  }
});

// ── Start ────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🏀 ChrisBasket sur http://localhost:${PORT}`);
  console.log(`🔐 Admin : http://localhost:${PORT}/admin/login`);
});
