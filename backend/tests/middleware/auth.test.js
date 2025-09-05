// 2. TESTS MIDDLEWARES
// ==========================================

// tests/middleware/authMiddleware.test.js
const jwt = require("jsonwebtoken");
const authMiddleware = require("../../middleware/authMiddleware");
const User = require("../../models/User");

jest.mock("../../models/User");

describe("Auth Middleware", () => {
  let req, res, next;

  beforeEach(() => {
    req = { headers: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();
  });

  test("should pass with valid token", async () => {
    const userId = "validUserId";
    const token = jwt.sign({ id: userId }, process.env.JWT_SECRET);

    req.headers.authorization = `Bearer ${token}`;
    User.findById.mockResolvedValue({ _id: userId, email: "test@test.com" });

    await authMiddleware(req, res, next);

    expect(req.user).toBeDefined();
    expect(next).toHaveBeenCalled();
  });

  test("should fail without token", async () => {
    await authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      message: "Token d'accès requis",
    });
    expect(next).not.toHaveBeenCalled();
  });

  test("should fail with invalid token", async () => {
    req.headers.authorization = "Bearer invalid-token";

    await authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });
});
