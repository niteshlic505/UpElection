import {
  ConstituencyPick,
  LeaderboardEntry,
  OfficialResultRecord,
} from '../types/election';
import { getBandDisplaySeats } from '../data/upParties';
import { UP_ALLIANCES, getAllianceCodeForParty } from '../data/upAlliances';

export const CONTEST_SCORING_RULES = {
  POINTS_PER_PREDICTION: 1,
  POINTS_CORRECT_CONSTITUENCY_WINNER: 5,
  POINTS_CORRECT_PARTY_SEATS: 20,
  POINTS_CORRECT_ALLIANCE_SEATS: 50,
  SEAT_RANGE_TOLERANCE: 10,
} as const;

export interface PredictionPointsBreakdown {
  partyPredictionCount: number;
  alliancePredictionCount: number;
  constituencyPredictionCount: number;
  totalPredictions: number;
  predictionPoints: number;
}

export interface OfficialAccuracyBreakdown {
  correctConstituencies: number;
  constituencyAccuracyPoints: number;
  correctPartyBands: number;
  partyAccuracyPoints: number;
  correctAllianceBands: number;
  allianceAccuracyPoints: number;
  officialPoints: number;
}

function normalizeCandidateName(name?: string | null): string {
  return (name || '').trim().toLowerCase().replace(/\s+/g, ' ');
}

/**
 * Every prediction — whether in party seats, alliance seats, or candidate constituency —
 * fetches and gains the user 1 point.
 */
export function calculatePredictionPoints(
  partyBands: Record<string, number> | undefined,
  allianceBands: Record<string, number> | undefined,
  constituencyPicks: Record<string, ConstituencyPick | string> | undefined,
): PredictionPointsBreakdown {
  const partyPredictionCount = Object.values(partyBands || {}).filter(
    (bandStart) => getBandDisplaySeats(bandStart) > 0,
  ).length;

  const alliancePredictionCount = Object.values(allianceBands || {}).filter(
    (bandStart) => getBandDisplaySeats(bandStart) > 0,
  ).length;

  const constituencyPredictionCount = Object.keys(constituencyPicks || {}).length;

  const totalPredictions =
    partyPredictionCount + alliancePredictionCount + constituencyPredictionCount;

  return {
    partyPredictionCount,
    alliancePredictionCount,
    constituencyPredictionCount,
    totalPredictions,
    predictionPoints: totalPredictions * CONTEST_SCORING_RULES.POINTS_PER_PREDICTION,
  };
}

/**
 * Official contest accuracy rules:
 * - +5 points for every correctly chosen winning candidate of each constituency
 * - +20 points for each party whose predicted seat number is within a range of 10 of actual seats won
 * - +50 points for each alliance whose predicted seat number is within a range of 10 of actual seats won
 */
export function calculateOfficialAccuracy(
  partyBands: Record<string, number> | undefined,
  allianceBands: Record<string, number> | undefined,
  constituencyPicks: Record<string, ConstituencyPick> | undefined,
  officialResults: Record<number, OfficialResultRecord>,
): OfficialAccuracyBreakdown {
  const declaredResults = Object.values(officialResults).filter((r) => r.declared);
  if (declaredResults.length === 0) {
    return {
      correctConstituencies: 0,
      constituencyAccuracyPoints: 0,
      correctPartyBands: 0,
      partyAccuracyPoints: 0,
      correctAllianceBands: 0,
      allianceAccuracyPoints: 0,
      officialPoints: 0,
    };
  }

  let correctConstituencies = 0;
  const actualPartyCounts: Record<string, number> = {};
  const actualAllianceCounts: Record<string, number> = {};

  declaredResults.forEach((res) => {
    const winParty = res.winnerParty.trim().toUpperCase();
    actualPartyCounts[winParty] = (actualPartyCounts[winParty] || 0) + 1;

    const winAlliance = getAllianceCodeForParty(winParty);
    actualAllianceCounts[winAlliance] = (actualAllianceCounts[winAlliance] || 0) + 1;

    const pick = constituencyPicks?.[String(res.acNo)];
    if (pick) {
      const pickedCand = normalizeCandidateName(pick.candidateName);
      const actualWinner = normalizeCandidateName(res.winnerName);
      if (pickedCand && actualWinner && pickedCand === actualWinner) {
        correctConstituencies += 1;
      }
    }
  });

  // Party seat prediction within range of 10 -> +20 pts per party predicted
  let correctPartyBands = 0;
  Object.entries(partyBands || {}).forEach(([partyCode, bandStart]) => {
    const predictedSeats = getBandDisplaySeats(bandStart);
    if (predictedSeats <= 0) return;
    const actualSeats = actualPartyCounts[partyCode.toUpperCase()] || 0;
    if (Math.abs(predictedSeats - actualSeats) <= CONTEST_SCORING_RULES.SEAT_RANGE_TOLERANCE) {
      correctPartyBands += 1;
    }
  });

  // Alliance seat prediction within range of 10 -> +50 pts per alliance predicted
  let correctAllianceBands = 0;
  UP_ALLIANCES.forEach((alliance) => {
    const bandStart = allianceBands?.[alliance.code] ?? 0;
    const predictedSeats = getBandDisplaySeats(bandStart);
    if (predictedSeats <= 0) return;
    const actualSeats = actualAllianceCounts[alliance.code] || 0;
    if (Math.abs(predictedSeats - actualSeats) <= CONTEST_SCORING_RULES.SEAT_RANGE_TOLERANCE) {
      correctAllianceBands += 1;
    }
  });

  const constituencyAccuracyPoints =
    correctConstituencies * CONTEST_SCORING_RULES.POINTS_CORRECT_CONSTITUENCY_WINNER;
  const partyAccuracyPoints =
    correctPartyBands * CONTEST_SCORING_RULES.POINTS_CORRECT_PARTY_SEATS;
  const allianceAccuracyPoints =
    correctAllianceBands * CONTEST_SCORING_RULES.POINTS_CORRECT_ALLIANCE_SEATS;

  return {
    correctConstituencies,
    constituencyAccuracyPoints,
    correctPartyBands,
    partyAccuracyPoints,
    correctAllianceBands,
    allianceAccuracyPoints,
    officialPoints: constituencyAccuracyPoints + partyAccuracyPoints + allianceAccuracyPoints,
  };
}

export function getEntryPredictionPoints(entry: LeaderboardEntry): number {
  if (typeof entry.predictionPoints === 'number') {
    return entry.predictionPoints;
  }
  const partyCnt = entry.partyPredictionCount ?? (entry.partyAllocated > 0 ? 1 : 0);
  const allianceCnt = entry.alliancePredictionCount ?? ((entry.allianceAllocated ?? 0) > 0 ? 1 : 0);
  const seatCnt = entry.completedSeats ?? 0;
  const fallbackDerived = partyCnt + allianceCnt + seatCnt;
  return entry.civicScore > 0 ? Math.min(entry.civicScore, 450) : fallbackDerived;
}

export function getEntryTotalPoints(entry: LeaderboardEntry): number {
  return getEntryPredictionPoints(entry) + (entry.officialPoints || 0);
}
