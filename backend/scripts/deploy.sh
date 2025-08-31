#!/bin/bash
# scripts/deploy.sh - Script de déploiement backend

echo "🚀 Déploiement Scentify Backend..."

# Vérifications pré-déploiement
echo "🔍 Vérifications..."

# Vérifier Node.js version
NODE_VERSION=$(node --version)
echo "Node.js version: $NODE_VERSION"

# Vérifier les variables d'environnement critiques
if [ -z "$MONGODB_URI" ]; then
  echo "❌ MONGODB_URI manquante"
  exit 1
fi

if [ -z "$JWT_SECRET" ]; then
  echo "❌ JWT_SECRET manquante"
  exit 1
fi

echo "✅ Variables d'environnement OK"

# Installation des dépendances
echo "📦 Installation des dépendances..."
npm ci --only=production

echo "🎉 Déploiement backend terminé !"