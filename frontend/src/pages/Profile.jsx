import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import ParfumCard from "../components/ParfumCard";

export default function Profile() {
  const [favoris, setFavoris] = useState({ parfums: [] });
  const { user, token } = useAuth();

  useEffect(() => {
    if (token) {
      fetch("/api/users/favoris", {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => res.json())
        .then(setFavoris);
    }
  }, [token]);

  return (
    <div className="profile">
      <h1>Profil de {user?.username}</h1>

      <section>
        <h2>Parfums favoris</h2>
        <div className="parfum-grid">
          {favoris.parfums.map((parfum) => (
            <ParfumCard key={parfum._id} parfum={parfum} />
          ))}
        </div>
      </section>
    </div>
  );
}
