import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export default function Header() {
  const [search, setSearch] = useState("");
  const { user, dispatch } = useAuth();
  const navigate = useNavigate();

  const handleSearch = (e) => {
    e.preventDefault();
    if (search.trim()) navigate(`/?search=${search}`);
  };

  const logout = () => {
    dispatch({ type: "LOGOUT" });
    navigate("/");
  };

  return (
    <header className="header">
      <Link to="/" className="logo">
        Scentify
      </Link>

      <form onSubmit={handleSearch} className="search">
        <input
          type="text"
          placeholder="Rechercher un parfum..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button type="submit">🔍</button>
      </form>

      <nav>
        {user ? (
          <>
            <Link to="/profile">{user.username}</Link>
            <button onClick={logout}>Déconnexion</button>
          </>
        ) : (
          <Link to="/login">Connexion</Link>
        )}
      </nav>
    </header>
  );
}
