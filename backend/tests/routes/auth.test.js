// tests/routes/auth.test.js
const request = require("supertest");
const app = require("../../app");
const User = require("../../models/User");

jest.mock("../../models/User");

describe("/api/auth", () => {
  describe("POST /api/auth/register", () => {
    test("should register user with valid data", async () => {
      User.findOne.mockResolvedValue(null);
      User.prototype.save = jest.fn().mockResolvedValue({
        _id: "userId",
        email: "test@test.com",
      });

      const response = await request(app).post("/api/auth/register").send({
        email: "test@test.com",
        password: "password123",
      });

      expect(response.status).toBe(201);
      expect(response.body.message).toBe("Utilisateur créé avec succès");
    });

    test("should validate required fields", async () => {
      const response = await request(app).post("/api/auth/register").send({
        email: "test@test.com",
        // password manquant
      });

      expect(response.status).toBe(400);
    });
  });
});
