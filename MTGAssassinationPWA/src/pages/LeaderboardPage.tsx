import { useEffect, useState } from 'react';
import { listLeaderboard } from '../lib/db';

export default function LeaderboardPage() {
  const [rows, setRows] = useState<
    Array<{ playerId: string; playerName: string; totalPoints: number; gamesPlayed: number }>
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    setLoading(true);
    try {
      setError(null);
      const r = await listLeaderboard();
      setRows(r);
    } catch (e: any) {
      setError(e?.message ?? 'Erreur');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  return (
    <div className="card">
      <h2>Classement global</h2>
      <p className="small">Tri: points décroissants, puis games played.</p>

      <button className="btn btn-ghost" onClick={refresh} disabled={loading}>
        Rafraîchir
      </button>

      {error && <div style={{ marginTop: 10 }}>❌ {error}</div>}
      {loading ? (
        <div>Chargement…</div>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>#</th>
              <th>Joueur</th>
              <th>Points</th>
              <th>Parties</th>
              <th>Moy. points/partie</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, idx) => (
              <tr key={r.playerId}>
                <td>{idx + 1}</td>
                <td>{r.playerName}</td>
                <td>{r.totalPoints}</td>
                <td>{r.gamesPlayed}</td>
                <td>
                  {r.gamesPlayed > 0 ? (r.totalPoints / r.gamesPlayed).toFixed(2) : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
