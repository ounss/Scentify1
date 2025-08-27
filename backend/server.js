import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import { errorHandler } from "./middleware/errorHandler.js";

// Import routes
import userRoutes from "./routes/userRoutes.js";
import parfumRoutes from "./routes/parfumRoutes.js";
import noteRoutes from "./routes/noteRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001; // Utiliser 5001 au lieu de 5000

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

// Error handler middleware
app.use(errorHandler);

// MongoDB Connection
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log(`MongoDB connecté: ${conn.connection.host}`);
  } catch (error) {
    console.error("Erreur MongoDB:", error);
    process.exit(1);
  }
};

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    message: "Scentify API fonctionnel",
    timestamp: new Date().toISOString(),
  });
});

// Start server
const startServer = async () => {
  await connectDB();

  app.listen(PORT, () => {
    console.log(`🚀 Serveur démarré sur le port ${PORT}`);
    console.log(
      `📱 Frontend URL: ${process.env.CLIENT_URL || "http://localhost:3000"}`
    );
    console.log(`🔗 API URL: http://localhost:${PORT}/api`);
  });
};

startServer().catch(console.error);
