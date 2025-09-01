// ==========================================
// TESTS BACKEND - SCENTIFY
// ==========================================

// 1. TESTS MODÈLES MONGODB (avec Mongoose)
// ==========================================

// tests/models/User.test.js
const mongoose = require('mongoose');
const User = require('../../models/User');
const bcrypt = require('bcryptjs');

describe('User Model', () => {
  beforeAll(async () => {
    await mongoose.connect(process.env.MONGODB_TEST_URI);
  });

  beforeEach(async () => {
    await User.deleteMany({});
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  describe('Validation', () => {
    test('should create user with valid data', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        role: 'user'
      };

      const user = new User(userData);
      const savedUser = await user.save();

      expect(savedUser.email).toBe(userData.email);
      expect(savedUser.role).toBe('user');
      expect(savedUser.favorite_perfumes).toEqual([]);
    });

    test('should fail with invalid email', async () => {
      const userData = {
        email: 'invalid-email',
        password: 'password123'
      };

      const user = new User(userData);
      await expect(user.save()).rejects.toThrow();
    });

    test('should fail with duplicate email', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123'
      };

      await new User(userData).save();
      const duplicateUser = new User(userData);
      
      await expect(duplicateUser.save()).rejects.toThrow();
    });
  });

  describe('Password encryption', () => {
    test('should hash password before saving', async () => {
      const password = 'plaintext123';
      const user = new User({
        email: 'test@example.com',
        password
      });

      await user.save();
      expect(user.password).not.toBe(password);
      expect(await bcrypt.compare(password, user.password)).toBe(true);
    });
  });
});


// ==========================================


// ==========================================


// ==========================================
// 4. TESTS ROUTES API
// ==========================================


// ==========================================
// 5. TESTS UTILITAIRES
// ==========================================

// tests/utils/validation.test.js
const { validateEmail, validatePassword } = require('../../utils/validation');

describe('Validation Utils', () => {
  describe('validateEmail', () => {
    test('should validate correct email formats', () => {
      expect(validateEmail('test@example.com')).toBe(true);
      expect(validateEmail('user.name+tag@domain.co.uk')).toBe(true);
    });

    test('should reject invalid email formats', () => {
      expect(validateEmail('invalid-email')).toBe(false);
      expect(validateEmail('test@')).toBe(false);
      expect(validateEmail('@domain.com')).toBe(false);
    });
  });

  describe('validatePassword', () => {
    test('should validate strong passwords', () => {
      expect(validatePassword('StrongPass123!')).toBe(true);
      expect(validatePassword('MyPassword1')).toBe(true);
    });

    test('should reject weak passwords', () => {
      expect(validatePassword('123')).toBe(false);
      expect(validatePassword('password')).toBe(false);
      expect(validatePassword('')).toBe(false);
    });
  });
});

// ==========================================
// 6. TESTS D'INTÉGRATION BASE DE DONNÉES
// ==========================================

// tests/integration/database.test.js
const mongoose = require('mongoose');
const User = require('../../models/User');
const Parfum = require('../../models/Parfum');

describe('Database Integration', () => {
  beforeAll(async () => {
    await mongoose.connect(process.env.MONGODB_TEST_URI);
  });

  beforeEach(async () => {
    await User.deleteMany({});
    await Parfum.deleteMany({});
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  test('should handle user-parfum relationships correctly', async () => {
    // Créer un parfum
    const parfum = await new Parfum({
      name: 'Test Parfum',
      brand: 'Test Brand',
      gender: 'mixte'
    }).save();

    // Créer un utilisateur avec ce parfum en favori
    const user = await new User({
      email: 'test@test.com',
      password: 'password123',
      favorite_perfumes: [parfum._id]
    }).save();

    // Vérifier la relation
    const populatedUser = await User.findById(user._id)
      .populate('favorite_perfumes');
    
    expect(populatedUser.favorite_perfumes).toHaveLength(1);
    expect(populatedUser.favorite_perfumes[0].name).toBe('Test Parfum');
  });
});

// ==========================================
