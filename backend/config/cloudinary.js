// backend/config/cloudinary.js
import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";

// Configuration Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Vérification de la configuration
export const testCloudinaryConnection = async () => {
  try {
    const result = await cloudinary.api.ping();
    console.log("✅ Cloudinary connected:", result);
    return true;
  } catch (error) {
    console.error("❌ Cloudinary connection failed:", error);
    return false;
  }
};

// Storage pour les parfums
export const parfumStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "scentify/parfums",
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
    transformation: [
      { width: 500, height: 500, crop: "fill", quality: "auto" },
    ],
    public_id: (req, file) =>
      `parfum_${Date.now()}_${Math.round(Math.random() * 1e9)}`,
  },
});

// Storage pour les avatars
export const avatarStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "scentify/avatars",
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
    transformation: [
      {
        width: 200,
        height: 200,
        crop: "fill",
        quality: "auto",
        gravity: "face",
      },
    ],
    public_id: (req, file) => `avatar_${req.user._id}_${Date.now()}`,
  },
});

// Helper pour supprimer une image
export const deleteFromCloudinary = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    console.log("🗑️ Image deleted from Cloudinary:", result);
    return result;
  } catch (error) {
    console.error("❌ Failed to delete from Cloudinary:", error);
    throw error;
  }
};

export default cloudinary;
