import { useEffect, useState } from 'react';
import { addPlayer, deletePlayer, listPlayers, Player } from '../lib/db';

export default function PlayersPage() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    setLoading(true);
    setError(null);
    try {
      const data = await listPlayers();
      setPlayers(data);
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
      <h2>Joueurs</h2>
      {error && <div className="small" style={{ color: 'salmon' }}>{error}</div>}

      <div className="row">
        <div>
          <label className="small">Ajouter un joueur</label>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nom" />
        </div>
        <div>
          <label className="small">&nbsp;</label>
          <button
            className="btn btn-primary"
            disabled={!name.trim()}
            onClick={async () => {
              try {
                await addPlayer(name);
                setName('');
                await refresh();
              } catch (e: any) {
                setError(e?.message ?? 'Erreur');
              }
            }}
          >
            Ajouter
          </button>
        </div>
      </div>

      <div style={{ marginTop: 12 }} className="small">
        {loading ? 'Chargement...' : `${players.length} joueur(s)`}
      </div>

      <table className="table" style={{ marginTop: 10 }}>
        <thead>
          <tr>
            <th>Nom</th>
            <th style={{ width: 140 }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {players.map((p) => (
            <tr key={p.id}>
              <td>{p.name}</td>
              <td>
                <button
                  className="btn btn-ghost"
                  onClick={async () => {
                    if (!confirm(`Supprimer ${p.name} ?`)) return;
                    try {
                      await deletePlayer(p.id);
                      await refresh();
                    } catch (e: any) {
                      setError(e?.message ?? 'Erreur');
                    }
                  }}
                >
                  Supprimer
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
