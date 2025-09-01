// backend/server.js - VERSION FUSIONNÉE & CORRIGÉE
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
import contactRoutes from "./routes/contactRoutes.js"; // ✅ correct

dotenv.config();

const app = express();
const PORT = process.env.PORT || 10000;

app.get("/", (req, res) => {
  res.json({
    message: "🌸 Scentify API est en ligne !",
    status: "success",
    version: "1.0.0",
    endpoints: {
      health: "/api/health",
      testEmail: "/api/test-email",
      users: "/api/users",
      parfums: "/api/parfums",
      notes: "/api/notes",
      admin: "/api/admin",
      contact: "/api/contact",
    },
    documentation: "Accédez aux endpoints via /api/[route]",
  });
});

// ✅ CORS: configuration unique
const corsOptions = {
  origin: function (origin, callback) {
    if (process.env.NODE_ENV === "development") {
      callback(null, true);
      return;
    }

    const allowedOrigins = [
      process.env.CLIENT_URL,
      process.env.FRONTEND_URL,
      "https://scentify-perfume.onrender.com/",
      "https://scentify-perfumes.onrender.com/",
    ].filter(Boolean);

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
  exposedHeaders: ["X-Total-Count"],
};

// ✅ Sécurité prod
if (process.env.NODE_ENV === "production") {
  app.use((req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "DENY");
    res.setHeader("X-XSS-Protection", "1; mode=block");
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    next();
  });
  // Render/Vercel: IPs/proxy
  app.set("trust proxy", 1);
}

// ✅ CORS appliqué une seule fois
app.use(cors(corsOptions));

// Parsers
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Health check (avant errorHandler)
app.get("/api/health", (req, res) => {
  res.json({
    message: "Scentify API fonctionnel",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
    environment: process.env.NODE_ENV || "development",
  });
});

// ✅ Test endpoint email
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

// Routes API
app.use("/api/users", userRoutes);
app.use("/api/parfums", parfumRoutes);
app.use("/api/notes", noteRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/contact", contactRoutes); // ✅ correct

// Middleware d'erreur (après les routes)
app.use(errorHandler);

// Connexion MongoDB puis démarrage serveur
mongoose
  .connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log("✅ MongoDB connecté");

    // Optionnel: test du service email au démarrage (non bloquant)
    try {
      await testEmailConnection();
    } catch (e) {
      console.warn(
        "⚠️ Test email au démarrage: échec (non bloquant)",
        e?.message
      );
    }

    app.listen(PORT, "0.0.0.0", () => {
      console.log(`✅ Serveur sur port ${PORT}`);
      console.log(`🌍 Mode: ${process.env.NODE_ENV || "development"}`);
      console.log(
        `📱 Frontend: ${process.env.CLIENT_URL || "http://localhost:3000"}`
      );
      console.log(`🔗 API: http://localhost:${PORT}/api`);
      console.log(`🏥 Health: http://localhost:${PORT}/api/health`);
      console.log(`📧 Test Email: http://localhost:${PORT}/api/test-email`);

      console.log(`\n📝 Variables d'environnement importantes:`);
      console.log(
        `   DATABASE (MONGODB_URI): ${process.env.MONGODB_URI ? "✅" : "❌"}`
      );
      console.log(`   JWT_SECRET: ${process.env.JWT_SECRET ? "✅" : "❌"}`);
      console.log(`   EMAIL_USER: ${process.env.EMAIL_USER ? "✅" : "❌"}`);
      console.log(`   EMAIL_PASS: ${process.env.EMAIL_PASS ? "✅" : "❌"}`);
    });
  })
  .catch((err) => {
    console.error("❌ Erreur MongoDB:", err);
    process.exit(1);
  });

// Gestion erreurs globales
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
