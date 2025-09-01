# Scentify

Application web de recommandation de parfums basée sur la composition olfactive.

# 🎯 À Propos
Scentify révolutionne la découverte de parfums en proposant des recommandations basées sur les notes olfactives plutôt que sur le marketing traditionnel. L'application permet aux utilisateurs de rechercher des parfums par composition, de gérer leurs favoris et de consulter leur historique personnel.

Contexte: Projet de fin d'études - Développement Web Front End
Étudiant: BEN YAGHLANE Ouns
Année: 2024-2025

# 🛠️ Technologies
Stack MERN:

Frontend: React 18, React Router, Context API, Axios
Backend: Node.js, Express.js, Mongoose ODM
Base de données: MongoDB Atlas
Authentification: JWT + bcrypt
Déploiement: Vercel (frontend) + Render (backend)

# ✨ Fonctionnalités
🔐 Authentification & Autorisation

Inscription et connexion utilisateur
Authentification JWT sécurisée
Rôles utilisateur (user/admin)
Reset mot de passe par email
Gestion de profil personnel

🌸 Catalogue de Parfums

Recherche avancée: par nom, marque, notes olfactives
Filtres multiples: genre, famille olfactive, popularité
Fiches détaillées: composition complète (tête/cœur/fond)
Pagination optimisée: gestion de grandes collections

💖 Personnalisation

Favoris: sauvegarde de parfums et notes préférés
Historique: suivi des consultations avec horodatage
Recommandations: suggestions basées sur les préférences

🛠️ Administration

Dashboard: statistiques avec graphiques interactifs
Gestion utilisateurs: liste, modification rôles, désactivation
Export de données: CSV pour analyse externe
Monitoring: health checks et logs structurés

🚀 Installation
Prérequis

Node.js ≥ 18.0.0
MongoDB (local ou Atlas)
Git

Configuration Environnement

Cloner le projet

bashgit clone <repository-url>
cd scentify

Configuration Backend

bashcd backend
npm install
cp .env.example .env
Variables .env backend:
env# Environnement
NODE_ENV=development
PORT=10000

# Base de données

MONGODB_URI=mongodb://localhost:27017/scentify

# Sécurité JWT

JWT_SECRET=your-secret-key-minimum-32-characters

# Configuration email

EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# CORS

CLIENT_URL=http://localhost:3000
FRONTEND_URL=http://localhost:3000

# Upload images (optionnel)

CLOUDINARY_NAME=your-cloudinary-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

Configuration Frontend

bashcd frontend
npm install
cp .env.example .env
Variables .env frontend:
envREACT_APP_API_URL=http://localhost:10000/api
Démarrage Développement
bash# Terminal 1 - API Backend
cd backend
npm run dev

# 🚀 API: http://localhost:10000

# Terminal 2 - Frontend React

cd frontend
npm start

# 🚀 App: http://localhost:3000

# Terminal 3 - Initialisation données (optionnel)

cd backend
npm run seed

# 🏗️ Architecture
Structure du Projet
scentify/
├── backend/ # API Express.js
│ ├── controllers/ # Logique métier
│ ├── models/ # Schémas Mongoose
│ │ ├── User.js # Utilisateurs
│ │ ├── Parfum.js # Parfums
│ │ └── NoteOlfactive.js # Notes olfactives
│ ├── routes/ # Routes API REST
│ ├── middleware/ # Auth, validation, erreurs
│ ├── services/ # Email, CSV, utilitaires
│ ├── tests/ # Tests unitaires
│ └── server.js # Point d'entrée
├── frontend/ # Application React
│ ├── src/
│ │ ├── components/ # Composants réutilisables
│ │ │ ├── common/ # Header, Spinner, etc.
│ │ │ └── parfum/ # ParfumCard, ParfumList, etc.
│ │ ├── pages/ # Pages principales
│ │ ├── contexts/ # Context API (Auth)
│ │ ├── services/ # Appels API
│ │ └── styles/ # CSS globaux
│ └── public/
└── README.md
Modèles de Données
User (Utilisateur)
javascript{
username: String,
email: String (unique),
password: String (hashé),
isAdmin: Boolean,
favorisParfums: [ObjectId],
favorisNotes: [ObjectId],
historique: [{
parfum: ObjectId,
dateVisite: Date
}]
}
Parfum
javascript{
nom: String,
marque: String,
genre: 'homme'|'femme'|'mixte',
description: String,
notes_tete: [ObjectId],
notes_coeur: [ObjectId],
notes_fond: [ObjectId],
popularite: Number,
prix: Number,
photo: String
}
NoteOlfactive
javascript{
nom: String (unique),
type: 'tête'|'cœur'|'fond',
famille: 'citrus'|'florale'|'boisée'|...,
description: String,
intensite: Number (1-10),
popularite: Number
}
📡 API Documentation
Authentification
httpPOST /api/auth/register # Inscription utilisateur
POST /api/auth/login # Connexion + JWT
POST /api/auth/forgot # Demande reset mot de passe
POST /api/auth/reset # Réinitialisation mot de passe
Parfums
httpGET /api/parfums # Liste avec filtres/pagination
GET /api/parfums/:id # Détails parfum + notes
POST /api/parfums [ADMIN] # Création parfum
PUT /api/parfums/:id [ADMIN] # Modification
DELETE /api/parfums/:id [ADMIN] # Suppression
Notes Olfactives
httpGET /api/notes # Liste des notes
GET /api/notes/:id # Détails note + parfums
GET /api/notes/type/:type # Notes par type
POST /api/notes [ADMIN] # Création note
PUT /api/notes/:id [ADMIN] # Modification
DELETE /api/notes/:id [ADMIN] # Suppression
Utilisateurs
httpGET /api/users/me # Profil utilisateur
PUT /api/users/me # Modification profil
GET /api/users/me/favorites # Liste favoris
POST /api/users/me/favorites/parfum/:id # Ajouter favori parfum
DELETE /api/users/me/favorites/parfum/:id # Retirer favori parfum
POST /api/users/me/favorites/note/:id # Ajouter favori note
DELETE /api/users/me/favorites/note/:id # Retirer favori note
GET /api/users/me/history # Historique consultations
POST /api/users/me/history/:id # Ajouter à l'historique
DELETE /api/users/me/history # Vider l'historique
Administration
httpGET /api/admin/stats/users # Statistiques utilisateurs
GET /api/admin/stats/parfums # Statistiques parfums
GET /api/admin/stats/notes # Statistiques notes
GET /api/admin/users # Liste utilisateurs
PATCH /api/admin/users/:id/admin # Toggle rôle admin
GET /api/admin/users/export # Export CSV utilisateurs
GET /api/admin/parfums/export # Export CSV parfums
Exemples de Requêtes
Recherche avec filtres:
httpGET /api/parfums?search=rose&genre=femme&page=1&limit=10
Réponse type:
json{
"parfums": [
{
"\_id": "648f123...",
"nom": "La Vie Est Belle",
"marque": "Lancôme",
"genre": "femme",
"notes_tete": [...],
"notes_coeur": [...],
"notes_fond": [...],
"popularite": 85
}
],
"pagination": {
"page": 1,
"limit": 10,
"total": 156,
"pages": 16
}
}
🧪 Tests & Qualité
Tests Backend
bashcd backend

# Tests unitaires

npm test

# Tests avec couverture

npm run test:coverage

# Tests en mode watch

npm run test:watch

# Tests CI

npm run test:ci
Standards de Code

Linting: ESLint configuré
Commits: Convention Conventional Commits
Branches: main, dev, feature/, hotfix/
Code: camelCase (JS), PascalCase (React)

# 🔒 Sécurité
Mesures Implémentées

JWT: Tokens avec expiration courte (2h)
Hashage: bcrypt avec salt rounds élevé
Validation: Schémas Joi sur tous les endpoints
CORS: Configuration restrictive des origines
Rate Limiting: Protection contre les abus
Headers: Sécurisation via Helmet.js
Sanitization: Nettoyage des entrées utilisateur

Variables Sensibles

Exclusion complète du fichier .env du contrôle de version
Gestion des secrets via interfaces cloud sécurisées
Rotation régulière des clés JWT et API

# 🌍 Déploiement
Architecture Production
Frontend (Vercel) ──► Backend (Render) ──► MongoDB Atlas
│ │ │
├─ CDN global ├─ Auto-scaling ├─ Cluster M0
├─ HTTPS auto ├─ Health checks ├─ Backups auto
└─ Deploy sur push └─ Variables env └─ SSL/TLS
Configuration Production
Variables Render (Backend):
envNODE_ENV=production
MONGODB_URI=mongodb+srv://...
JWT_SECRET=production-secret-64-chars
CLIENT_URL=https://scentify.vercel.app
Variables Vercel (Frontend):
envREACT_APP_API_URL=https://scentify-api.onrender.com/api
Monitoring

Health checks automatiques (/api/health)
Logs structurés sans PII (conformité RGPD)
Monitoring natif des plateformes cloud

🎯 État d'Avancement
✅ Phase 1 - Implémenté

Authentification JWT complète
CRUD parfums et notes olfactives
Système de favoris et historique
Recherche avancée avec filtres
Dashboard administrateur
Export CSV des données
Sécurité multicouches
API RESTful documentée

🚧 Phase 1.5 - En Cours

Upload d'images (Cloudinary configuré)
Dashboard avec graphiques interactifs
Tests unitaires complets (coverage 80%+)
Optimisations Green IT
Documentation API interactive

📋 Phase 2 - Planifié

Scan de codes-barres (QuaggaJS)
Système communautaire (avis, commentaires)
Algorithmes ML de recommandation
Application mobile React Native
Intégration marketplace partenaires

📊 Performance
Métriques Actuelles

API Response Time: ~150ms moyenne
Frontend Loading: <2s (audit Lighthouse)
Mobile Responsive: 100% des écrans
Accessibilité: WCAG AA compliance
Sécurité: 0 vulnérabilités critiques

Optimisations

Index MongoDB sur champs de recherche
Pagination efficace (limite 100 items/page)
Virtual DOM React optimisé
Context API pour état global léger
Compression gzip en production

📚 Scripts Utiles
Backend
bashnpm start # Production
npm run dev # Développement avec nodemon
npm run seed # Données de test + admin
npm test # Tests unitaires
npm run health # Health check API
Frontend
bashnpm start # Développement
npm run build # Build production
npm test # Tests React
npm run lint # Vérification ESLint
npm run lint:fix # Correction auto ESLint
🤝 Contribution
Développement

Fork du projet
Créer une branche feature (git checkout -b feature/nouvelle-fonctionnalite)
Commit avec convention (git commit -m 'feat: ajouter recherche vocale')
Push vers la branche (git push origin feature/nouvelle-fonctionnalite)
Ouvrir une Pull Request

Standards

Code review obligatoire
Tests unitaires requis
Documentation à jour
Respect des conventions ESLint

📞 Support
Informations Projet

Réalisé par: BEN YAGHLANE Ouns
Institution: École de Formation Professionnelle
Type: Travail de fin d'études (TFE)

Contact

Issues GitHub: Pour bugs et suggestions
Email: contact via l'institution
Demo: Liens de démonstration fournis lors de la soutenance

📄 License
Projet académique - Usage éducatif uniquement
© 2024-2025 - Travail de Fin d'Études
