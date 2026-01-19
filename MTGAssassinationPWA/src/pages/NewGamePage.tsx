import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createGame, getLeaderAtStart, listDecks, listPlayers, Deck, Player } from '../lib/db';

export default function NewGamePage() {
  const nav = useNavigate();
  const [players, setPlayers] = useState<Player[]>([]);
  const [decks, setDecks] = useState<Deck[]>([]);
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [deckByPlayerId, setDeckByPlayerId] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const [p, d] = await Promise.all([listPlayers(), listDecks()]);
        setPlayers(p);
        setDecks(d);
      } catch (e: any) {
        setError(e?.message ?? 'Erreur');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const selectedIds = useMemo(
    () => players.filter((p) => selected[p.id]).map((p) => p.id),
    [players, selected]
  );

  if (loading) return <div className="card">Chargement…</div>;

  return (
    <div className="card">
      <h2>Nouvelle partie</h2>
      {error && <div className="small" style={{ color: '#ffb4b4' }}>{error}</div>}

      <h3>1) Joueurs</h3>
      <div className="row">
        {players.map((p) => (
          <label key={p.id} className="card" style={{ padding: 10 }}>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <input
                type="checkbox"
                checked={!!selected[p.id]}
                onChange={(e) => setSelected((s) => ({ ...s, [p.id]: e.target.checked }))}
                style={{ width: 18, height: 18 }}
              />
              <div>
                <div style={{ fontWeight: 700 }}>{p.name}</div>
                <div className="small">id: {p.id}</div>
              </div>
            </div>
          </label>
        ))}
      </div>

      <h3 style={{ marginTop: 10 }}>2) Decks</h3>
      <p className="small">Choisis un deck pour chaque joueur sélectionné.</p>
      <div className="row">
        {selectedIds.map((playerId) => {
          const player = players.find((p) => p.id === playerId)!;
          return (
            <div className="card" key={playerId} style={{ padding: 10 }}>
              <div style={{ fontWeight: 700, marginBottom: 6 }}>{player.name}</div>
              <select
                value={deckByPlayerId[playerId] ?? ''}
                onChange={(e) => setDeckByPlayerId((m) => ({ ...m, [playerId]: e.target.value }))}
              >
                <option value="">(sans deck)</option>
                {decks.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
          );
        })}
      </div>

      <div style={{ marginTop: 12 }}>
        <button
          className="btn btn-primary"
          disabled={selectedIds.length < 2}
          onClick={async () => {
            try {
              setError(null);
              const leader = await getLeaderAtStart();
              const gameId = await createGame({
                playerIds: selectedIds,
                deckByPlayerId,
                leaderPlayerIdAtStart: leader?.playerId ?? null
              });
              nav(`/game/${gameId}`);
            } catch (e: any) {
              setError(e?.message ?? 'Erreur');
            }
          }}
        >
          Démarrer la partie
        </button>
        {selectedIds.length < 2 && <div className="small">Sélectionne au moins 2 joueurs.</div>}
      </div>
    </div>
  );
}
