export type Kill = {
  killerPlayerId: string; // tueur
  victimPlayerId: string; // victime
  targetPlayerId: string; // cible révélée
  createdAt?: number; // epoch ms (client)
};

export type ScoresResult = {
  scoresByPlayerId: Record<string, number>;
  placementPointsByPlayerId: Record<string, number>;
  killPointsByPlayerId: Record<string, number>;
  leaderBonusByPlayerId: Record<string, number>;
};

function initScores(playerIds: string[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const id of playerIds) out[id] = 0;
  return out;
}

/**
 * Reproduction fidèle de la logique de streamlit_app.py :
 * - points de kill: +2 (cible==tueur) / +4 (cible==victime) / +1 sinon
 * - bonus +1 si la victime était leader global au début de la partie
 * - points de placement: +(i+1) selon l'ordre de `placements` (morts + survivant à la fin)
 */
export function computeAssassinScores(params: {
  playerIdsInGame: string[];
  kills: Kill[];
  placements: string[];
  leaderPlayerIdAtStart?: string | null;
}): ScoresResult {
  const { playerIdsInGame, kills, placements, leaderPlayerIdAtStart } = params;

  const scores = initScores(playerIdsInGame);
  const killPoints = initScores(playerIdsInGame);
  const placementPoints = initScores(playerIdsInGame);
  const leaderBonus = initScores(playerIdsInGame);

  for (const k of kills) {
    const tueur = k.killerPlayerId;
    const victime = k.victimPlayerId;
    const cible = k.targetPlayerId;

    let pts = 1;
    if (cible === tueur) pts = 2;
    else if (cible === victime) pts = 4;

    scores[tueur] = (scores[tueur] ?? 0) + pts;
    killPoints[tueur] = (killPoints[tueur] ?? 0) + pts;

    if (leaderPlayerIdAtStart && victime === leaderPlayerIdAtStart) {
      scores[tueur] = (scores[tueur] ?? 0) + 1;
      leaderBonus[tueur] = (leaderBonus[tueur] ?? 0) + 1;
    }
  }

  for (let i = 0; i < placements.length; i++) {
    const playerId = placements[i];
    const pts = i + 1;
    scores[playerId] = (scores[playerId] ?? 0) + pts;
    placementPoints[playerId] = (placementPoints[playerId] ?? 0) + pts;
  }

  for (const id of playerIdsInGame) {
    scores[id] ??= 0;
    killPoints[id] ??= 0;
    placementPoints[id] ??= 0;
    leaderBonus[id] ??= 0;
  }

  return {
    scoresByPlayerId: scores,
    placementPointsByPlayerId: placementPoints,
    killPointsByPlayerId: killPoints,
    leaderBonusByPlayerId: leaderBonus
  };
}
