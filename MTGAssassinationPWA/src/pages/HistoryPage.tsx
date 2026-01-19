import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { listGames, listPlayers } from '../lib/db';

export default function HistoryPage() {
  const [games, setGames] = useState<any[]>([]);
  const [playerName, setPlayerName] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const [gs, ps] = await Promise.all([listGames(), listPlayers()]);
        const map: Record<string, string> = {};
        for (const p of ps) map[p.id] = p.name;
        setPlayerName(map);
        setGames(gs);
      } catch (e: any) {
        setError(e?.message ?? 'Erreur');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="card">
      <h2>Historique</h2>
      <p className="small">
        Les parties finies mettent à jour le classement global (points cumulés).
      </p>
      {error && <div className="small" style={{ color: '#ffb4b4' }}>{error}</div>}
      {loading ? (
        <div>Chargement…</div>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>Statut</th>
              <th>Joueurs</th>
              <th>Gagnant</th>
              <th>Points gagnant</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {games.map((g) => {
              const winner = g.winnerPlayerId ? (playerName[g.winnerPlayerId] ?? g.winnerPlayerId) : '—';
              const winnerPts = g.pointsAwardedByPlayerId?.[g.winnerPlayerId] ?? '—';
              const players = (g.playerIds ?? []).map((id: string) => playerName[id] ?? id).join(', ');
              return (
                <tr key={g.id}>
                  <td>{g.status}</td>
                  <td>{players}</td>
                  <td>{winner}</td>
                  <td>{winnerPts}</td>
                  <td>
                    <Link className="btn btn-ghost" to={`/game/${g.id}`}>
                      Ouvrir
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}
