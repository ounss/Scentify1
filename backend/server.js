// backend/server.js - AJOUT VÉRIFICATION EMAIL AU DÉMARRAGE
import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import { errorHandler } from "./middleware/errorHandler.js";
import {
  testEmailConnection,
  getRequiredEnvVars,
} from "./services/emailService.js";

// Import routes
import userRoutes from "./routes/userRoutes.js";
import parfumRoutes from "./routes/parfumRoutes.js";
import noteRoutes from "./routes/noteRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import contactRoutes from "./routes/contactRoutes.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 10000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Serveur sur port ${PORT}`);
});

// ✅ CORS CONFIGURATION POUR PRODUCTION
const corsOptions = {
  origin: function (origin, callback) {
    // En développement, autoriser toutes les origines
    if (process.env.NODE_ENV === "development") {
      callback(null, true);
      return;
    }

    // En production, liste blanche des domaines autorisés
    const allowedOrigins = [
      process.env.CLIENT_URL,
      process.env.FRONTEND_URL,
      // Ajouter d'autres domaines si nécessaire
      "https://your-frontend-domain.com",
      "https://www.your-frontend-domain.com",
    ].filter(Boolean); // Supprimer les valeurs undefined

    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`🚫 CORS blocked: ${origin} not in whitelist`);
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  exposedHeaders: ["X-Total-Count"], // Pour la pagination
};

app.use(cors(corsOptions));

// ✅ MIDDLEWARE DE SÉCURITÉ SUPPLÉMENTAIRE
if (process.env.NODE_ENV === "production") {
  // Headers de sécurité
  app.use((req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "DENY");
    res.setHeader("X-XSS-Protection", "1; mode=block");
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    next();
  });

  // Trust proxy pour Render/Heroku
  app.set("trust proxy", 1);
}

// Middleware
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    credentials: true,
  })
);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Routes
app.use("/api/users", userRoutes);
app.use("/api/parfums", parfumRoutes);
app.use("/api/notes", noteRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/contact", contactRoutes);

// Error handler middleware
app.use(errorHandler);

// MongoDB Connection
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log(`✅ MongoDB connecté: ${conn.connection.host}`);
    return true;
  } catch (error) {
    console.error("❌ Erreur MongoDB:", error);
    return false;
  }
};

// ✅ Vérification configuration email
const checkEmailConfiguration = async () => {
  console.log("\n🔧 Vérification configuration email...");

  if (!getRequiredEnvVars()) {
    console.log("⚠️  Service email désactivé - variables manquantes");
    return false;
  }

  const isEmailWorking = await testEmailConnection();
  if (isEmailWorking) {
    console.log("✅ Service email configuré et prêt");
  } else {
    console.log("⚠️  Service email configuré mais connexion échouée");
  }

  return isEmailWorking;
};

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    message: "Scentify API fonctionnel",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
    environment: process.env.NODE_ENV || "development",
  });
});

// ✅ Test endpoint pour email
app.get("/api/test-email", async (req, res) => {
  try {
    const isWorking = await testEmailConnection();
    res.json({
      emailService: isWorking ? "OK" : "ERROR",
      configuration: getRequiredEnvVars() ? "OK" : "MISSING_VARS",
    });
  } catch (error) {
    res.status(500).json({
      emailService: "ERROR",
      error: error.message,
    });
  }
});

// Start server avec vérifications
const startServer = async () => {
  console.log("🚀 Démarrage du serveur Scentify...\n");

  // 1. Connexion MongoDB
  const mongoConnected = await connectDB();
  if (!mongoConnected) {
    console.error("❌ Impossible de démarrer sans MongoDB");
    process.exit(1);
  }

  // 2. Vérification email (non bloquant)
  await checkEmailConfiguration();

  // 3. Démarrage serveur
  app.listen(PORT, () => {
    console.log(`\n🎉 Serveur Scentify démarré avec succès !`);
    console.log(`🌐 Port: ${PORT}`);
    console.log(
      `📱 Frontend: ${process.env.CLIENT_URL || "http://localhost:3000"}`
    );
    console.log(`🔗 API: http://localhost:${PORT}/api`);
    console.log(`🏥 Health: http://localhost:${PORT}/api/health`);
    console.log(`📧 Test Email: http://localhost:${PORT}/api/test-email`);

    if (process.env.NODE_ENV === "development") {
      console.log(`\n🔧 Mode développement`);
      console.log(`📊 Admin panel: http://localhost:3000/admin`);
    }

    console.log(`\n📝 Variables d'environnement importantes:`);
    console.log(`   DATABASE: ${process.env.MONGODB_URI ? "✅" : "❌"}`);
    console.log(`   JWT_SECRET: ${process.env.JWT_SECRET ? "✅" : "❌"}`);
    console.log(`   EMAIL_USER: ${process.env.EMAIL_USER ? "✅" : "❌"}`);
    console.log(`   EMAIL_PASS: ${process.env.EMAIL_PASS ? "✅" : "❌"}`);
  });
};

// Gestion des erreurs non capturées
process.on("unhandledRejection", (err) => {
  console.error("❌ Unhandled Promise Rejection:", err);
  console.log("🔄 Arrêt du serveur...");
  process.exit(1);
});

process.on("uncaughtException", (err) => {
  console.error("❌ Uncaught Exception:", err);
  console.log("🔄 Arrêt du serveur...");
  process.exit(1);
});

startServer().catch(console.error);
