import {
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
  increment
} from 'firebase/firestore';
import { db } from './firebase';
import { getAppCode } from './appCode';
import { computeAssassinScores, Kill } from './scoring';

export type Player = { id: string; name: string };
export type Deck = { id: string; name: string };
export type LeaderRow = { playerId: string; totalPoints: number };

export type Game = {
  id: string;
  createdAt?: any;
  endedAt?: any;
  status: 'active' | 'finished';
  playerIds: string[];
  deckByPlayerId: Record<string, string>;
  kills: Kill[];
  placements: string[]; // morts + survivant à la fin
  leaderPlayerIdAtStart: string | null;
  scoresByPlayerId: Record<string, number>;
  pointsAwardedByPlayerId: Record<string, number>;
  winnerPlayerId: string | null;
  appCode?: string;
};

function requireCode(): string {
  const c = getAppCode();
  if (!c) throw new Error('App verrouillée : code manquant.');
  return c;
}

// -------------------- Players --------------------

export async function listPlayers(): Promise<Player[]> {
  const snap = await getDocs(query(collection(db, 'players'), orderBy('name')));
  return snap.docs.map((d) => ({ id: d.id, name: (d.data() as any).name }));
}

export async function addPlayer(name: string) {
  const appCode = requireCode();
  const ref = doc(collection(db, 'players'));
  await setDoc(ref, { name, createdAt: serverTimestamp(), appCode });
}

// IMPORTANT: delete ne passe pas nos rules “appCodeOk()” (delete n’a pas request.resource.data)
export async function deletePlayer(_playerId: string) {
  throw new Error('Suppression désactivée (simplifier les règles).');
}

// -------------------- Decks --------------------

export async function listDecks(): Promise<Deck[]> {
  const snap = await getDocs(query(collection(db, 'decks'), orderBy('name')));
  return snap.docs.map((d) => ({ id: d.id, name: (d.data() as any).name }));
}

export async function addDeck(name: string) {
  const appCode = requireCode();
  const ref = doc(collection(db, 'decks'));
  await setDoc(ref, { name, createdAt: serverTimestamp(), appCode });
}

// IMPORTANT: delete ne passe pas nos rules “appCodeOk()”
export async function deleteDeck(_deckId: string) {
  throw new Error('Suppression désactivée (simplifier les règles).');
}

// -------------------- Games --------------------

export async function listActiveGames(): Promise<Game[]> {
  const snap = await getDocs(
    query(collection(db, 'games'), where('status', '==', 'active'), orderBy('createdAt', 'desc'))
  );
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as Game[];
}

export async function listFinishedGames(limitCount = 50): Promise<Game[]> {
  const snap = await getDocs(
    query(collection(db, 'games'), where('status', '==', 'finished'), orderBy('endedAt', 'desc'))
  );
  return snap.docs.slice(0, limitCount).map((d) => ({ id: d.id, ...(d.data() as any) })) as Game[];
}

export async function getGame(gameId: string): Promise<Game> {
  const g = await getDoc(doc(db, 'games', gameId));
  if (!g.exists()) throw new Error('Partie introuvable');
  return { id: g.id, ...(g.data() as any) } as Game;
}

// Exports attendus par les pages
export const loadGame = getGame;

export async function getLeaderAtStart(): Promise<LeaderRow | null> {
  const snap = await getDocs(collection(db, 'leaderboard'));
  let best: LeaderRow | null = null;

  snap.docs.forEach((d) => {
    const data = d.data() as any;
    const pts = typeof data.totalPoints === 'number' ? data.totalPoints : 0;
    const row: LeaderRow = { playerId: d.id, totalPoints: pts };
    if (!best || row.totalPoints > best.totalPoints) best = row;
  });

  return best;
}

export async function createGame(params: {
  playerIds: string[];
  deckByPlayerId: Record<string, string>;
  leaderPlayerIdAtStart?: string | null;
}): Promise<string> {
  const appCode = requireCode();
  const leaderAtStart =
    typeof params.leaderPlayerIdAtStart === 'string'
      ? params.leaderPlayerIdAtStart
      : (await getLeaderAtStart())?.playerId ?? null;

  const ref = doc(collection(db, 'games'));
  const game: Omit<Game, 'id'> = {
    status: 'active',
    playerIds: params.playerIds,
    deckByPlayerId: params.deckByPlayerId,
    kills: [],
    placements: [],
    leaderPlayerIdAtStart: leaderAtStart,
    scoresByPlayerId: {},
    pointsAwardedByPlayerId: {},
    winnerPlayerId: null,
    createdAt: serverTimestamp(),
    endedAt: null,
    appCode
  };

  await setDoc(ref, game);
  return ref.id;
}

export async function addKillToGame(gameId: string, kill: Omit<Kill, 'createdAt'>) {
  const appCode = requireCode();
  const game = await getGame(gameId);
  if (game.status !== 'active') throw new Error('Partie terminée');

  const newKill: Kill = { ...kill, createdAt: Date.now() };
  const kills = [...(game.kills ?? []), newKill];

  // placements = morts (ordre)
  const alive = new Set(game.playerIds);
  for (const deadId of game.placements ?? []) alive.delete(deadId);

  if (alive.has(kill.victimPlayerId)) {
    const placements = [...(game.placements ?? []), kill.victimPlayerId];
    await updateDoc(doc(db, 'games', gameId), { kills, placements, appCode });
  } else {
    await updateDoc(doc(db, 'games', gameId), { kills, appCode });
  }
}

// Export attendu par GamePage
export const addKill = addKillToGame;

export async function undoLastKill(gameId: string) {
  const appCode = requireCode();
  const game = await getGame(gameId);
  if (game.status !== 'active') throw new Error('Partie terminée');

  const kills = [...(game.kills ?? [])];
  kills.pop();

  const placements = recomputePlacements(game.playerIds, kills);
  await updateDoc(doc(db, 'games', gameId), { kills, placements, appCode });
}

function recomputePlacements(playerIds: string[], kills: Kill[]): string[] {
  const alive = new Set(playerIds);
  const placements: string[] = [];
  for (const k of kills) {
    if (alive.has(k.victimPlayerId)) {
      alive.delete(k.victimPlayerId);
      placements.push(k.victimPlayerId);
    }
  }
  return placements;
}

export async function finalizeGame(gameId: string, playerIdToName: Record<string, string>) {
  const appCode = requireCode();
  const game = await getGame(gameId);
  if (game.status !== 'active') throw new Error('Partie déjà terminée');

  const placementsSoFar = [...(game.placements ?? [])];
  const alive = new Set(game.playerIds);
  for (const d of placementsSoFar) alive.delete(d);

  if (alive.size !== 1) {
    throw new Error(`Impossible de terminer : il reste ${alive.size} survivants (il doit en rester 1).`);
  }

  const winnerPlayerId = [...alive][0];
  const placements = [...placementsSoFar, winnerPlayerId]; // survivant en dernier (comme ton Streamlit)

  const scoresRes = computeAssassinScores({
    playerIdsInGame: game.playerIds,
    kills: game.kills ?? [],
    placements,
    leaderPlayerIdAtStart: game.leaderPlayerIdAtStart
  });

  const scoresByPlayerId = scoresRes.scoresByPlayerId;

  const batch = writeBatch(db);

  batch.update(doc(db, 'games', gameId), {
    status: 'finished',
    endedAt: serverTimestamp(),
    winnerPlayerId,
    placements,
    scoresByPlayerId,
    pointsAwardedByPlayerId: scoresByPlayerId,
    appCode
  });

  for (const [playerId, points] of Object.entries(scoresByPlayerId)) {
    const ref = doc(db, 'leaderboard', playerId);
    batch.set(
      ref,
      {
        playerId,
        playerName: playerIdToName[playerId] ?? playerId,
        totalPoints: increment(points),
        gamesPlayed: increment(1),
        updatedAt: serverTimestamp(),
        appCode
      },
      { merge: true }
    );
  }

  await batch.commit();
}

// Export attendu par GamePage (version simple)
export async function finishGame(gameId: string) {
  const players = await listPlayers();
  const map: Record<string, string> = {};
  for (const p of players) map[p.id] = p.name;
  return finalizeGame(gameId, map);
}

// Export attendu par HistoryPage
export async function listGames(): Promise<Game[]> {
  const snap = await getDocs(query(collection(db, 'games'), orderBy('createdAt', 'desc')));
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as Game[];
}

// -------------------- Leaderboard --------------------

export async function listLeaderboard(): Promise<
  Array<{ playerId: string; playerName: string; totalPoints: number; gamesPlayed: number }>
> {
  const snap = await getDocs(collection(db, 'leaderboard'));
  const rows = snap.docs.map((d) => {
    const data = d.data() as any;
    return {
      playerId: d.id,
      playerName: data.playerName ?? d.id,
      totalPoints: typeof data.totalPoints === 'number' ? data.totalPoints : 0,
      gamesPlayed: typeof data.gamesPlayed === 'number' ? data.gamesPlayed : 0
    };
  });
  rows.sort((a, b) => b.totalPoints - a.totalPoints || b.gamesPlayed - a.gamesPlayed);
  return rows;
}
