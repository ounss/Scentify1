// backend/config/cloudinary.js
import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import dotenv from "dotenv";

dotenv.config();

// Configuration Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Storage pour les parfums
export const parfumStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "scentify/parfums",
    allowed_formats: ["jpg", "png", "webp", "jpeg"],
    transformation: [
      { width: 800, height: 800, crop: "limit" },
      { quality: "auto", fetch_format: "auto" },
    ],
    public_id: (req, file) => {
      const timestamp = Date.now();
      const random = Math.random().toString(36).substring(2, 8);
      return `parfum_${timestamp}_${random}`;
    },
  },
});

// Fonction de suppression Cloudinary
export const deleteParfumFromCloudinary = async (publicId) => {
  try {
    console.log(`🗑️ Suppression Cloudinary: ${publicId}`);
    const result = await cloudinary.uploader.destroy(publicId);
    console.log(`✅ Image supprimée: ${publicId}`);
    return result;
  } catch (error) {
    console.error(`❌ Erreur suppression (${publicId}):`, error.message);
    throw error;
  }
};

// Extraction du public_id d'une URL Cloudinary
export const extractPublicIdFromUrl = (url) => {
  if (!url || typeof url !== "string") return null;
  try {
    const urlParts = url.split("/");
    const uploadIndex = urlParts.findIndex((part) => part === "upload");
    if (uploadIndex === -1) return null;

    let pathAfterUpload = urlParts.slice(uploadIndex + 1);
    if (pathAfterUpload[0] && pathAfterUpload[0].startsWith("v")) {
      pathAfterUpload = pathAfterUpload.slice(1);
    }

    const fullPath = pathAfterUpload.join("/");
    return fullPath.split(".")[0];
  } catch (error) {
    console.error("Erreur extraction public_id:", error);
    return null;
  }
};

export default cloudinary;
