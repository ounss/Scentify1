// tests/setup.js
const { MongoMemoryServer } = require("mongodb-memory-server");
const mongoose = require("mongoose");

let mongod;

// Setup avant tous les tests
beforeAll(async () => {
  // Créer une instance MongoDB en mémoire
  mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();

  // Se connecter à la base de test
  await mongoose.connect(uri);

  console.log("✅ Base de données de test connectée");
});

// Nettoyer après tous les tests
afterAll(async () => {
  // Fermer la connexion
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();

  // Arrêter le serveur MongoDB en mémoire
  await mongod.stop();

  console.log("✅ Base de données de test fermée");
});

// Nettoyer après chaque test
afterEach(async () => {
  // Supprimer toutes les collections
  const collections = mongoose.connection.collections;

  for (const key in collections) {
    const collection = collections[key];
    await collection.deleteMany({});
  }
});

// Variables d'environnement pour les tests
process.env.JWT_SECRET = "test-secret-key";
process.env.NODE_ENV = "test";
