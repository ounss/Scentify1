// tests/controllers/parfumController.test.js
const parfumController = require("../../controllers/parfumController");
const Parfum = require("../../models/Parfum");

jest.mock("../../models/Parfum");

describe("Parfum Controller", () => {
  let req, res;

  beforeEach(() => {
    req = { params: {}, body: {}, query: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
  });

  describe("getAllParfums", () => {
    test("should return paginated parfums list", async () => {
      const mockParfums = [
        { name: "Parfum 1", brand: "Brand 1" },
        { name: "Parfum 2", brand: "Brand 2" },
      ];

      req.query = { page: 1, limit: 10 };
      Parfum.find.mockReturnValue({
        limit: jest.fn().mockReturnValue({
          skip: jest.fn().mockResolvedValue(mockParfums),
        }),
      });
      Parfum.countDocuments.mockResolvedValue(2);

      await parfumController.getAllParfums(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        parfums: mockParfums,
        currentPage: 1,
        totalPages: 1,
        totalCount: 2,
      });
    });
  });

  describe("searchParfums", () => {
    test("should search parfums by name and brand", async () => {
      const mockResults = [{ name: "Chanel N°5", brand: "Chanel" }];

      req.query = { q: "chanel" };
      Parfum.find.mockResolvedValue(mockResults);

      await parfumController.searchParfums(req, res);

      expect(Parfum.find).toHaveBeenCalledWith({
        $or: [
          { name: { $regex: "chanel", $options: "i" } },
          { brand: { $regex: "chanel", $options: "i" } },
        ],
      });
      expect(res.json).toHaveBeenCalledWith(mockResults);
    });
  });
});
