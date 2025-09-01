// tests/models/Parfum.test.js
const Parfum = require("../../models/Parfum");

describe("Parfum Model", () => {
  beforeEach(async () => {
    await Parfum.deleteMany({});
  });

  test("should create parfum with valid data", async () => {
    const parfumData = {
      name: "Chanel N°5",
      brand: "Chanel",
      gender: "féminin",
      notes: ["Rose", "Jasmin"],
      merchant_links: ["https://chanel.com"],
    };

    const parfum = new Parfum(parfumData);
    const savedParfum = await parfum.save();

    expect(savedParfum.name).toBe(parfumData.name);
    expect(savedParfum.notes).toHaveLength(2);
  });

  test("should validate gender field", async () => {
    const parfumData = {
      name: "Test Parfum",
      brand: "Test Brand",
      gender: "invalid-gender",
    };

    const parfum = new Parfum(parfumData);
    await expect(parfum.save()).rejects.toThrow();
  });
});
