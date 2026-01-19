import { Link } from 'react-router-dom';

export default function HomePage() {
  return (
    <div className="card">
      <h2>Accueil</h2>
      <p className="small">
        Flow recommandé: crée une partie, enregistre les kills, termine la partie.
        Ensuite, le classement global est mis à jour (points cumulés).
      </p>

      <div className="row">
        <Link className="btn btn-primary" to="/new">
          Nouvelle partie
        </Link>
        <Link className="btn btn-ghost" to="/history">
          Historique
        </Link>
        <Link className="btn btn-ghost" to="/leaderboard">
          Classement global
        </Link>
        <Link className="btn btn-ghost" to="/players">
          Gérer joueurs
        </Link>
        <Link className="btn btn-ghost" to="/decks">
          Gérer decks
        </Link>
      </div>
    </div>
  );
}
