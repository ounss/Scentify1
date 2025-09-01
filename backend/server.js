// backend/server.js - VERSION CORRIGÉE FINALE
import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import { errorHandler } from "./middleware/errorHandler.js";
import {
  testEmailConnection,
  getRequiredEnvVars,
} from "./services/emailService.js";

// Routes
import userRoutes from "./routes/userRoutes.js";
import parfumRoutes from "./routes/parfumRoutes.js";
import noteRoutes from "./routes/noteRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import contactRoutes from "./routes/contactRoutes.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 10000;

// Détection environnement
const isProduction = process.env.NODE_ENV === "production";
const baseUrl = isProduction
  ? "https://scentify-perfume.onrender.com"
  : `http://localhost:${PORT}`;

// Route racine
app.get("/", (req, res) => {
  res.json({
    message: "Scentify API est en ligne !",
    status: "success",
    version: "1.0.0",
    environment: process.env.NODE_ENV || "development",
    baseUrl: baseUrl,
    endpoints: {
      health: `${baseUrl}/api/health`,
      testEmail: `${baseUrl}/api/test-email`,
      users: `${baseUrl}/api/users`,
      parfums: `${baseUrl}/api/parfums`,
      notes: `${baseUrl}/api/notes`,
      admin: `${baseUrl}/api/admin`,
      contact: `${baseUrl}/api/contact`,
    },
  });
});

// CORS Configuration
const corsOptions = {
  origin: function (origin, callback) {
    if (!isProduction) {
      callback(null, true);
      return;
    }

    const allowedOrigins = [
      process.env.CLIENT_URL,
      process.env.FRONTEND_URL,
      "https://scentify-perfumes.onrender.com",
      "https://scentify-perfume.onrender.com",
    ].filter(Boolean);

    console.log(`CORS Check - Origin: ${origin}`);
    console.log(`Allowed origins:`, allowedOrigins);

    if (!origin || allowedOrigins.includes(origin)) {
      console.log(`CORS autorisé pour: ${origin}`);
      callback(null, true);
    } else {
      console.warn(`CORS bloqué: ${origin}`);
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  exposedHeaders: ["X-Total-Count"],
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));

// Sécurité production
if (isProduction) {
  app.use((req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "DENY");
    res.setHeader("X-XSS-Protection", "1; mode=block");
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    next();
  });
  app.set("trust proxy", 1);
}

// Parsers
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Log des requêtes
app.use((req, res, next) => {
  console.log(
    `${req.method} ${req.path} - Origin: ${req.get("origin") || "none"}`
  );
  next();
});

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    message: "Scentify API fonctionnel",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
    environment: process.env.NODE_ENV || "development",
    baseUrl: baseUrl,
    cors: {
      allowedOrigins: [
        process.env.CLIENT_URL,
        process.env.FRONTEND_URL,
        "https://scentify-perfumes.onrender.com",
        "https://scentify-perfume.onrender.com",
      ].filter(Boolean),
    },
  });
});

// Test email endpoint
app.get("/api/test-email", async (req, res) => {
  try {
    const isWorking = await testEmailConnection();
    res.json({
      emailService: isWorking ? "OK" : "ERROR",
      configuration: getRequiredEnvVars() ? "OK" : "MISSING_VARS",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      emailService: "ERROR",
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

// Routes API
app.use("/api/users", userRoutes);
app.use("/api/parfums", parfumRoutes);
app.use("/api/notes", noteRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/contact", contactRoutes);

// 404 pour API
app.use("/api/*", (req, res) => {
  res.status(404).json({
    message: "Endpoint API non trouvé",
    path: req.path,
    availableEndpoints: [
      "/api/health",
      "/api/users",
      "/api/parfums",
      "/api/notes",
      "/api/admin",
      "/api/contact",
    ],
  });
});

// Middleware d'erreur
app.use(errorHandler);

// Connexion MongoDB et démarrage
mongoose
  .connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log("MongoDB connecté");

    // Test email non bloquant
    try {
      if (getRequiredEnvVars()) {
        const emailWorking = await testEmailConnection();
        console.log(emailWorking ? "Service email OK" : "Service email KO");
      } else {
        console.log("Variables email manquantes - service désactivé");
      }
    } catch (e) {
      console.warn("Test email échoué (non bloquant):", e?.message);
    }

    // Démarrage serveur
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`\nServeur Scentify démarré avec succès !`);
      console.log(`Port: ${PORT}`);
      console.log(`Mode: ${process.env.NODE_ENV || "development"}`);
      console.log(
        `Frontend: ${
          process.env.CLIENT_URL || "https://scentify-perfumes.onrender.com"
        }`
      );
      console.log(`API Base: ${baseUrl}`);
      console.log(`Health: ${baseUrl}/api/health`);
      console.log(`Test Email: ${baseUrl}/api/test-email`);

      console.log(`\nVariables d'environnement:`);
      console.log(`   NODE_ENV: ${process.env.NODE_ENV || "development"}`);
      console.log(
        `   DATABASE: ${process.env.MONGODB_URI ? "OK" : "MANQUANT"}`
      );
      console.log(
        `   JWT_SECRET: ${process.env.JWT_SECRET ? "OK" : "MANQUANT"}`
      );
      console.log(`   CLIENT_URL: ${process.env.CLIENT_URL || "MANQUANT"}`);
      console.log(
        `   EMAIL_USER: ${process.env.EMAIL_USER ? "OK" : "MANQUANT"}`
      );

      if (isProduction) {
        console.log(`\nAPI disponible sur: ${baseUrl}`);
        console.log(
          `Frontend connecté: https://scentify-perfumes.onrender.com`
        );
      }
    });
  })
  .catch((err) => {
    console.error("Erreur MongoDB:", err);
    process.exit(1);
  });

// Gestion erreurs globales
process.on("unhandledRejection", (err) => {
  console.error("Unhandled Promise Rejection:", err);
  console.log("Arrêt du serveur...");
  process.exit(1);
});

process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
  console.log("Arrêt du serveur...");
  process.exit(1);
});
