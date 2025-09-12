// tests/setup.js
const { MongoMemoryServer } = require("mongodb-memory-server");
const mongoose = require("mongoose");

let mongod;

// Setup avant tous les tests
beforeAll(async () => {
  try {
    // Créer une instance MongoDB en mémoire
    mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();

    // Se connecter à la base de test
    await mongoose.connect(uri);

    console.log("✅ Base de données de test connectée");
  } catch (error) {
    console.error("❌ Erreur setup base de données:", error);
    throw error;
  }
});

// Nettoyer après tous les tests
afterAll(async () => {
  try {
    // Fermer la connexion
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.dropDatabase();
      await mongoose.connection.close();
    }

    // Arrêter le serveur MongoDB en mémoire
    if (mongod) {
      await mongod.stop();
    }

    console.log("✅ Base de données de test fermée");
  } catch (error) {
    console.error("❌ Erreur fermeture base de données:", error);
  }
});

// Nettoyer après chaque test
afterEach(async () => {
  try {
    // Supprimer toutes les collections
    const collections = mongoose.connection.collections;

    for (const key in collections) {
      const collection = collections[key];
      await collection.deleteMany({});
    }
  } catch (error) {
    console.warn("⚠️ Erreur nettoyage collections:", error);
  }
});

// Variables d'environnement pour les tests
process.env.JWT_SECRET = "test-secret-key-for-scentify-app";
process.env.NODE_ENV = "test";
process.env.MONGODB_URI = "mongodb://localhost:27017/scentify_test";
