import jwt from "jsonwebtoken";
import User from "../models/User.js";

export const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      // ✅ Extraire le token
      token = req.headers.authorization.split(" ")[1];
      console.log("🔐 Token reçu:", token.substring(0, 20) + "...");

      // ✅ Vérifier le token JWT
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log("✅ Token décodé, user ID:", decoded.id);

      // ✅ Chercher l'utilisateur dans la base
      const user = await User.findById(decoded.id).select("-password");

      if (!user) {
        console.log("❌ Utilisateur non trouvé pour ID:", decoded.id);
        return res.status(401).json({ message: "Utilisateur non trouvé" });
      }

      console.log("✅ Utilisateur trouvé:", user.username);

      // ✅ Attacher l'utilisateur à la requête
      req.user = user;
      next();
    } catch (error) {
      console.error("❌ Erreur auth middleware:", error.message);

      if (error.name === "JsonWebTokenError") {
        return res.status(401).json({ message: "Token invalide" });
      } else if (error.name === "TokenExpiredError") {
        return res.status(401).json({ message: "Token expiré" });
      } else {
        return res.status(401).json({ message: "Erreur d'authentification" });
      }
    }
  } else {
    console.log("❌ Pas de token Authorization dans les headers");
    console.log("Headers reçus:", req.headers);
    return res.status(401).json({ message: "Pas de token, accès refusé" });
  }
};

export const admin = (req, res, next) => {
  if (req.user && req.user.isAdmin) {
    console.log("✅ Accès admin autorisé pour:", req.user.username);
    next();
  } else {
    console.log(
      "❌ Accès admin refusé pour:",
      req.user?.username || "utilisateur non identifié"
    );
    res.status(403).json({ message: "Accès administrateur requis" });
  }
};
