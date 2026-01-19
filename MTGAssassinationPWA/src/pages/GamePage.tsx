import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  addKill,
  finishGame,
  Game,
  listDecks,
  listPlayers,
  loadGame,
  undoLastKill
} from '../lib/db';
import { computeAssassinScores } from '../lib/scoring';

export default function GamePage() {
  const { gameId } = useParams();
  const nav = useNavigate();
  const [game, setGame] = useState<Game | null>(null);
  const [playerName, setPlayerName] = useState<Record<string, string>>({});
  const [deckName, setDeckName] = useState<Record<string, string>>({});
  const [killer, setKiller] = useState('');
  const [victim, setVictim] = useState('');
  const [target, setTarget] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    if (!gameId) return;
    const g = await loadGame(gameId);
    setGame(g);
  }

  useEffect(() => {
    (async () => {
      if (!gameId) return;
      const [players, decks] = await Promise.all([listPlayers(), listDecks()]);
      const pn: Record<string, string> = {};
      for (const p of players) pn[p.id] = p.name;
      setPlayerName(pn);
      const dn: Record<string, string> = {};
      for (const d of decks) dn[d.id] = d.name;
      setDeckName(dn);
      await refresh();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameId]);

  const aliveAndDead = useMemo(() => {
    if (!game) return { alive: [], dead: [] as string[], placements: [] as string[] };
    const dead = (game.placements ?? []).slice();
    const alive = game.playerIds.filter((id) => !dead.includes(id));
    return { alive, dead, placements: dead };
  }, [game]);

  const previewScores = useMemo(() => {
    if (!game) return null;
    const alive = aliveAndDead.alive;
    const placementsSoFar = aliveAndDead.placements;
    // Si partie pas finie, on ne connaît pas le survivant final => on ne calcule pas le bonus placement complet.
    // On affiche quand même un aperçu: points de kills + placement déjà connus.
    const res = computeAssassinScores({
      playerIdsInGame: game.playerIds,
      kills: game.kills ?? [],
      placements: placementsSoFar,
      leaderPlayerIdAtStart: game.leaderPlayerIdAtStart
    });
    return { ...res, alive };
  }, [game, aliveAndDead]);

  if (!gameId) return <div className="card">Game ID manquant.</div>;
  if (!game) return <div className="card">Chargement...</div>;

  const playersInGame = game.playerIds;

  return (
    <div className="row">
      <div className="card">
        <h2>Partie</h2>
        <div className="small">
          Statut: <span className="badge">{game.status}</span>
        </div>
        {error && <div style={{ color: 'salmon' }}>{error}</div>}

        <h3 style={{ marginTop: 12 }}>Ajouter un kill</h3>

        <label className="small">Tueur</label>
        <select value={killer} onChange={(e) => setKiller(e.target.value)}>
          <option value="">--</option>
          {playersInGame.map((id) => (
            <option key={id} value={id}>
              {playerName[id] ?? id}
            </option>
          ))}
        </select>

        <label className="small" style={{ marginTop: 8 }}>
          Victime
        </label>
        <select value={victim} onChange={(e) => setVictim(e.target.value)}>
          <option value="">--</option>
          {aliveAndDead.alive.map((id) => (
            <option key={id} value={id}>
              {playerName[id] ?? id}
            </option>
          ))}
        </select>

        <label className="small" style={{ marginTop: 8 }}>
          Cible révélée
        </label>
        <select value={target} onChange={(e) => setTarget(e.target.value)}>
          <option value="">--</option>
          {playersInGame.map((id) => (
            <option key={id} value={id}>
              {playerName[id] ?? id}
            </option>
          ))}
        </select>

        <div style={{ height: 10 }} />
        <button
          className="btn btn-primary"
          disabled={game.status !== 'active' || !killer || !victim || !target || killer === victim}
          onClick={async () => {
            try {
              setError(null);
              await addKill(gameId, { killerPlayerId: killer, victimPlayerId: victim, targetPlayerId: target });
              setVictim('');
              setTarget('');
              await refresh();
            } catch (e: any) {
              setError(e?.message ?? 'Erreur');
            }
          }}
        >
          Valider le kill
        </button>
        <div className="small" style={{ marginTop: 8 }}>
          Decks: {playersInGame.map((id) => `${playerName[id] ?? id}: ${deckName[game.deckByPlayerId[id]] ?? '-'}`).join(' · ')}
        </div>

        <div className="row" style={{ marginTop: 14 }}>
          <button
            className="btn btn-ghost"
            disabled={game.status !== 'active' || (game.kills?.length ?? 0) === 0}
            onClick={async () => {
              if (!confirm('Annuler le dernier kill ?')) return;
              try {
                setError(null);
                await undoLastKill(gameId);
                await refresh();
              } catch (e: any) {
                setError(e?.message ?? 'Erreur');
              }
            }}
          >
            Annuler dernier kill
          </button>
          <button
            className="btn btn-primary"
            disabled={game.status !== 'active' || aliveAndDead.alive.length !== 1}
            onClick={async () => {
              if (!confirm('Terminer la partie et attribuer les points ?')) return;
              try {
                setError(null);
                await finishGame(gameId);
                await refresh();
                nav('/leaderboard');
              } catch (e: any) {
                setError(e?.message ?? 'Erreur');
              }
            }}
          >
            Terminer la partie
          </button>
        </div>
        {aliveAndDead.alive.length !== 1 && (
          <div className="small" style={{ marginTop: 8 }}>
            Pour terminer, il faut qu’il ne reste qu’un survivant (actuellement: {aliveAndDead.alive.length}).
          </div>
        )}
      </div>

      <div className="card">
        <h3>Vivants</h3>
        <ul>
          {aliveAndDead.alive.map((id) => (
            <li key={id}>{playerName[id] ?? id}</li>
          ))}
        </ul>

        <h3>Morts (ordre)</h3>
        <ol>
          {aliveAndDead.dead.map((id) => (
            <li key={id}>{playerName[id] ?? id}</li>
          ))}
        </ol>

        <h3>Historique des kills</h3>
        <ol>
          {(game.kills ?? []).map((k, idx) => (
            <li key={idx}>
              <b>{playerName[k.killerPlayerId] ?? k.killerPlayerId}</b> tue{' '}
              <b>{playerName[k.victimPlayerId] ?? k.victimPlayerId}</b> (cible révélée:{' '}
              {playerName[k.targetPlayerId] ?? k.targetPlayerId})
            </li>
          ))}
        </ol>
      </div>

      <div className="card">
        <h3>Aperçu points (en cours)</h3>
        <div className="small">
          Les points de placement complet (survivant) sont attribués uniquement à la fin.
        </div>
        {!previewScores ? (
          <div>—</div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Joueur</th>
                <th>Kills</th>
                <th>Placement</th>
                <th>Bonus leader</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {playersInGame.map((id) => (
                <tr key={id}>
                  <td>{playerName[id] ?? id}</td>
                  <td>{previewScores.killPointsByPlayerId[id] ?? 0}</td>
                  <td>{previewScores.placementPointsByPlayerId[id] ?? 0}</td>
                  <td>{previewScores.leaderBonusByPlayerId[id] ?? 0}</td>
                  <td>{previewScores.scoresByPlayerId[id] ?? 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
