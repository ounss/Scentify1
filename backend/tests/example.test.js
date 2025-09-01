// tests/example.test.js
describe("Configuration Jest", () => {
  test("devrait fonctionner correctement", () => {
    expect(1 + 1).toBe(2);
  });

  test("devrait avoir les variables d'environnement de test", () => {
    expect(process.env.NODE_ENV).toBe("test");
    expect(process.env.JWT_SECRET).toBeDefined();
  });
});

// Test simple avec votre base de données
const mongoose = require("mongoose");

describe("Base de données de test", () => {
  test("devrait être connectée", () => {
    expect(mongoose.connection.readyState).toBe(1); // 1 = connecté
  });
});
