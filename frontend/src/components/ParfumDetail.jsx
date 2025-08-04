import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";

export default function ParfumDetail() {
  const { id } = useParams();
  const [parfum, setParfum] = useState(null);

  useEffect(() => {
    fetch(`/api/parfums/${id}`)
      .then((res) => res.json())
      .then(setParfum);
  }, [id]);

  if (!parfum) return <div className="loading">Chargement...</div>;

  return (
    <div className="parfum-detail">
      <img src={parfum.photo_url} alt={parfum.nom} />
      <div className="info">
        <h1>{parfum.nom}</h1>
        <p className="type">{parfum.type}</p>

        <div className="notes-section">
          <h3>Notes de tête</h3>
          <div className="notes">
            {parfum.notes_tete?.map((note) => (
              <span key={note}>{note}</span>
            ))}
          </div>

          <h3>Notes de cœur</h3>
          <div className="notes">
            {parfum.notes_coeur?.map((note) => (
              <span key={note}>{note}</span>
            ))}
          </div>

          <h3>Notes de fond</h3>
          <div className="notes">
            {parfum.notes_fond?.map((note) => (
              <span key={note}>{note}</span>
            ))}
          </div>
        </div>

        <div className="buy-links">
          {parfum.buy_links?.map((link) => (
            <a key={link.label} href={link.url} target="_blank" rel="noopener">
              {link.label}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
