import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import api from "../services/api";

export default function VerifyEmail() {
  const [status, setStatus] = useState("loading");
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const token = searchParams.get("token");
    if (!token) {
      setStatus("error");
      return;
    }

    api
      .get(`/users/verify-email?token=${token}`)
      .then(() => setStatus("success"))
      .catch(() => setStatus("error"));
  }, [searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      {status === "loading" && <p>Vérification...</p>}
      {status === "success" && (
        <div className="text-center">
          <h1>✅ Email vérifié !</h1>
          <p>Vous pouvez maintenant vous connecter.</p>
        </div>
      )}
      {status === "error" && <p>❌ Lien invalide</p>}
    </div>
  );
}
