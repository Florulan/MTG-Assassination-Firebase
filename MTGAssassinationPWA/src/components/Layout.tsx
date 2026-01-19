import { Link, Outlet, useLocation } from 'react-router-dom';
import { clearAppCode } from '../lib/appCode';

export default function Layout() {
  const loc = useLocation();

  return (
    <div className="container">
      <header className="row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontWeight: 800, fontSize: 18 }}>MTG Assassin</div>
          <div style={{ fontSize: 12, opacity: 0.8 }}>{loc.pathname}</div>
        </div>
        <button
          className="btn btn-ghost"
          onClick={() => {
            clearAppCode();
            window.location.href = '/unlock';
          }}
        >
          Verrouiller
        </button>
      </header>

      <nav className="row" style={{ flexWrap: 'wrap', marginTop: 12 }}>
        <Link className="btn btn-ghost" to="/">
          Accueil
        </Link>
        <Link className="btn btn-ghost" to="/new">
          Nouvelle partie
        </Link>
        <Link className="btn btn-ghost" to="/history">
          Historique
        </Link>
        <Link className="btn btn-ghost" to="/leaderboard">
          Classement
        </Link>
        <Link className="btn btn-ghost" to="/players">
          Joueurs
        </Link>
        <Link className="btn btn-ghost" to="/decks">
          Decks
        </Link>
      </nav>

      <main style={{ marginTop: 14 }}>
        <Outlet />
      </main>

      <footer style={{ marginTop: 18, opacity: 0.7, fontSize: 12 }}>
        Astuce: ajoute le site à l’écran d’accueil pour un mode “app”.
      </footer>
    </div>
  );
}
