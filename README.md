# 🏀 ChrisBasket — Guide Complet

## Structure du projet
```
chrisbasket/
├── server.js              ← Serveur Node.js
├── package.json
├── .env.example           ← Modèle pour vos variables
├── .gitignore
├── config/
│   └── Chaussure.js       ← Modèle MongoDB
├── views/
│   ├── index.html         ← Boutique publique
│   ├── login.html         ← Connexion admin
│   └── admin.html         ← Tableau de bord admin
└── public/
    ├── css/style.css
    ├── css/admin.css
    ├── js/boutique.js
    ├── js/admin.js
    └── uploads/           ← Photos (créé automatiquement)
```

---

## ÉTAPE 1 — Base de données MongoDB Atlas (Gratuit)

1. Allez sur **https://mongodb.com/atlas** → Créez un compte gratuit
2. Créez un **Cluster gratuit (M0)**
3. Dans "Database Access" → Ajoutez un utilisateur avec un mot de passe
4. Dans "Network Access" → Cliquez "Add IP Address" → "Allow Access from Anywhere"
5. Dans votre cluster → Cliquez **Connect** → **Connect your application**
6. Copiez la string de connexion, elle ressemble à :
   ```
   mongodb+srv://monuser:monpassword@cluster0.xxxxx.mongodb.net/chrisbasket
   ```

---

## ÉTAPE 2 — Déploiement sur Render (Gratuit)

### 2.1 Préparer GitHub
1. Créez un compte sur **https://github.com**
2. Créez un nouveau dépôt (repository) public nommé `chrisbasket`
3. Dans VS Code, ouvrez le terminal :
   ```bash
   git init
   git add .
   git commit -m "Premier déploiement ChrisBasket"
   git branch -M main
   git remote add origin https://github.com/VOTRE_USERNAME/chrisbasket.git
   git push -u origin main
   ```

### 2.2 Déployer sur Render
1. Allez sur **https://render.com** → Créez un compte gratuit
2. Cliquez **New** → **Web Service**
3. Connectez votre compte GitHub et sélectionnez le dépôt `chrisbasket`
4. Configurez :
   - **Name** : chrisbasket
   - **Runtime** : Node
   - **Build Command** : `npm install`
   - **Start Command** : `npm start`
5. Descendez vers **Environment Variables** et ajoutez :
   | Clé | Valeur |
   |-----|--------|
   | `MONGODB_URI` | votre string MongoDB Atlas |
   | `SESSION_SECRET` | une phrase secrète longue |
   | `ADMIN_USERNAME` | admin |
   | `ADMIN_PASSWORD` | votre mot de passe choisi |
   | `WHATSAPP_NUMBER` | votre numéro sans + |
6. Cliquez **Create Web Service**

⏳ Render déploie en 2-3 minutes. Votre site sera accessible sur :
`https://chrisbasket.onrender.com`

---

## ÉTAPE 3 — Test en local (avant déploiement)

1. Copiez `.env.example` en `.env` et remplissez les valeurs
2. Dans le terminal VS Code :
   ```bash
   npm install
   npm start
   ```
3. Ouvrez **http://localhost:3000**

---

## Accès Admin
- URL : `https://votre-site.onrender.com/admin/login`
- Utilisateur : valeur de `ADMIN_USERNAME`
- Mot de passe : valeur de `ADMIN_PASSWORD`

---

## Notes importantes
- ⚠️ Sur Render (plan gratuit), le serveur s'endort après 15 min d'inactivité.
  Le premier chargement peut prendre ~30 secondes.
- 📸 Les photos uploadées sont stockées localement. Sur Render, elles sont
  **effacées à chaque redéploiement**. Pour les garder, utilisez **Cloudinary**
  (gratuit) — demandez à Claude de vous aider à l'intégrer quand vous êtes prêt.
- 🔄 Chaque `git push` redéploie automatiquement votre site sur Render.
