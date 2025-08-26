import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import helmet from "helmet";
import morgan from "morgan";
import compression from "compression";
import fs from "fs";
import rateLimit from "express-rate-limit";

// Routes
import userRoutes from "./routes/userRoutes.js";
import parfumRoutes from "./routes/parfumRoutes.js";
import noteRoutes from "./routes/noteRoutes.js";
// Retirer : import contactRoutes from "./routes/contactRoutes.js";

// Middleware
import { errorHandler } from "./middleware/errorHandler.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Créer les dossiers d'upload s'ils n'existent pas
const uploadDirs = ["uploads/parfums", "uploads/avatars"];
uploadDirs.forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Security middleware
app.use(helmet());

// Logging
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// Compression
app.use(compression());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: "Trop de requêtes, réessayez plus tard",
});
app.use("/api/", limiter);

// CORS configuration
app.use(
  cors({
    origin:
      process.env.NODE_ENV === "production"
        ? process.env.FRONTEND_URL
        : "http://localhost:3000",
    credentials: true,
  })
);

// Body parser middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Static files
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Routes
app.use("/api/users", userRoutes);
app.use("/api/parfums", parfumRoutes);
app.use("/api/notes", noteRoutes);
// Retirer : app.use("/api/contact", contactRoutes);

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
  });
});

// Error handling middleware
app.use(errorHandler);

// MongoDB connection
const connectDB = async () => {
  try {
    await mongoose.connect(
      process.env.MONGODB_URI || "mongodb://localhost:27017/scentify"
    );
    console.log("✅ MongoDB connecté");
  } catch (error) {
    console.error("❌ Erreur MongoDB:", error);
    process.exit(1);
  }
};

// Start server
const PORT = process.env.PORT || 5001;

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Serveur démarré sur le port ${PORT}`);
    console.log(
      `📧 Email service: ${
        process.env.SMTP_HOST ? "configuré" : "non configuré"
      }`
    );
  });
});

export default app;
