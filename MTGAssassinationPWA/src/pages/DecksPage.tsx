import { useEffect, useState } from 'react';
import { addDeck, deleteDeck, listDecks, Deck } from '../lib/db';

export default function DecksPage() {
  const [decks, setDecks] = useState<Deck[]>([]);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    setLoading(true);
    try {
      setDecks(await listDecks());
      setError(null);
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
      <h2>Decks</h2>
      <p className="small">Ajoute/supprime des decks (FireStore).</p>

      <div className="row">
        <div>
          <label className="small">Nom du deck</label>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Mono-Red..." />
        </div>
        <div style={{ alignSelf: 'end' }}>
          <button
            className="btn btn-primary"
            disabled={loading || !name.trim()}
            onClick={async () => {
              try {
                await addDeck(name.trim());
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

      {error && <div style={{ marginTop: 10 }} className="small">❌ {error}</div>}

      <div style={{ marginTop: 12 }} className="small">
        {loading ? 'Chargement...' : `${decks.length} deck(s)`}
      </div>

      <table className="table" style={{ marginTop: 12 }}>
        <thead>
          <tr>
            <th>Nom</th>
            <th style={{ width: 120 }}></th>
          </tr>
        </thead>
        <tbody>
          {decks.map((d) => (
            <tr key={d.id}>
              <td>{d.name}</td>
              <td>
                <button
                  className="btn btn-ghost"
                  onClick={async () => {
                    if (!confirm(`Supprimer ${d.name} ?`)) return;
                    try {
                      await deleteDeck(d.id);
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
