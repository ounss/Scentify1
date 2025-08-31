#!/bin/bash
# scripts/build.sh - Script de build frontend

echo "🏗️ Build Scentify Frontend..."

# Vérifier les variables d'environnement
if [ -z "$REACT_APP_API_URL" ]; then
  echo "❌ REACT_APP_API_URL manquante"
  exit 1
fi

echo "✅ Variables d'environnement OK"

# Build
echo "📦 Installation des dépendances..."
npm ci

echo "🏗️ Build de l'application..."
npm run build

echo "🎉 Build frontend terminé !"