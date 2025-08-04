import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export default function ParfumCard({ parfum }) {
  const { user, token } = useAuth();

  const toggleFavori = async () => {
    if (!user) return;

    await fetch(`/api/users/favoris/parfum/${parfum._id}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
  };

  return (
    <div className="parfum-card">
      <img src={parfum.photo_url} alt={parfum.nom} />
      <h3>{parfum.nom}</h3>
      <p className="type">{parfum.type}</p>
      <div className="notes">
        {parfum.notes_tete?.slice(0, 2).map((note) => (
          <span key={note} className="note">
            {note}
          </span>
        ))}
      </div>
      <div className="actions">
        <Link to={`/parfum/${parfum._id}`} className="btn-primary">
          Voir détails
        </Link>
        {user && (
          <button onClick={toggleFavori} className="btn-fav">
            ❤️
          </button>
        )}
      </div>
    </div>
  );
}
