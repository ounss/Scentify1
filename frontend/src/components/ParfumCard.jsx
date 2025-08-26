export default function Header() {
  return (
    <header>
      <div className="container">
        <div className="brand" aria-label="Scentify">
          <div className="logo" aria-hidden="true">
            <img src="asset/logo.png" alt="" />
          </div>
          <h1>Scentify</h1>
        </div>

        <form
          className="search"
          role="search"
          aria-label="Recherche de parfums"
          onSubmit={(e) => e.preventDefault()}
        >
          <div className="search__field">
            <svg
              className="search__icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <circle cx="11" cy="11" r="7" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              id="q"
              name="q"
              type="search"
              placeholder="Rechercher par nom ou note…"
              autoComplete="off"
            />
            <button className="btn btn--primary" type="submit">
              Chercher
            </button>
          </div>

          <div className="filters" aria-label="Filtres rapides">
            <button className="chip" type="button">
              Boisé
            </button>
            <button className="chip" type="button">
              Fleuri
            </button>
            <button className="chip" type="button">
              Agrumes
            </button>
          </div>
        </form>
      </div>
    </header>
  );
}
