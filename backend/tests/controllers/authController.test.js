// 3. TESTS CONTRÔLEURS
// ==========================================

// tests/controllers/authController.test.js
const authController = require("../../controllers/authController");
const User = require("../../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

jest.mock("../../models/User");
jest.mock("bcryptjs");
jest.mock("jsonwebtoken");

describe("Auth Controller", () => {
  let req, res;

  beforeEach(() => {
    req = { body: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
  });

  describe("register", () => {
    test("should register new user successfully", async () => {
      const userData = {
        email: "test@example.com",
        password: "password123",
      };

      req.body = userData;
      User.findOne.mockResolvedValue(null);
      User.prototype.save = jest.fn().mockResolvedValue({
        _id: "userId",
        email: userData.email,
      });

      await authController.register(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        message: "Utilisateur créé avec succès",
        user: expect.objectContaining({ email: userData.email }),
      });
    });

    test("should fail if user already exists", async () => {
      req.body = { email: "existing@test.com", password: "password123" };
      User.findOne.mockResolvedValue({ email: "existing@test.com" });

      await authController.register(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: "Un utilisateur avec cet email existe déjà",
      });
    });
  });

  describe("login", () => {
    test("should login successfully with valid credentials", async () => {
      const userData = {
        email: "test@example.com",
        password: "password123",
      };

      req.body = userData;
      const mockUser = {
        _id: "userId",
        email: userData.email,
        password: "hashedPassword",
      };

      User.findOne.mockResolvedValue(mockUser);
      bcrypt.compare.mockResolvedValue(true);
      jwt.sign.mockReturnValue("fake-jwt-token");

      await authController.login(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: "Connexion réussie",
        token: "fake-jwt-token",
        user: expect.objectContaining({ email: userData.email }),
      });
    });

    test("should fail with invalid credentials", async () => {
      req.body = { email: "test@test.com", password: "wrongpassword" };
      User.findOne.mockResolvedValue(null);

      await authController.login(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        message: "Identifiants invalides",
      });
    });
  });
});
