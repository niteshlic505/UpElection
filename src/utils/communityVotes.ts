import {
  ConstituencyRecord,
  LeaderboardEntry,
  PartyConfig,
  UserPredictionData,
} from '../types/election';
import { getBandByStart, getBandDisplaySeats, getPartyColor } from '../data/upParties';
import { UP_ALLIANCES, getAllianceCodeForParty } from '../data/upAlliances';

export interface BandVoteBreakdown {
  bandStart: number;
  bandLabel: string;
  count: number;
}

export interface CommunityPartyVoteSummary {
  code: string;
  name: string;
  shortName: string;
  color: string;
  voterCount: number;
  avgSeats: number;
  topBandLabel: string;
  topBandVoters: number;
  bandBreakdown: BandVoteBreakdown[];
}

export interface CommunityAllianceVoteSummary {
  code: string;
  shortEn: string;
  shortHi: string;
  nameEn: string;
  nameHi: string;
  color: string;
  voterCount: number;
  avgSeats: number;
  majorityVoters: number;
  topBandLabel: string;
  topBandVoters: number;
  bandBreakdown: BandVoteBreakdown[];
}

export interface CommunityCandidateVoteRow {
  key: string;
  acNo: number;
  constituencyName: string;
  district: string;
  candidateName: string;
  party: string;
  alliance: string;
  voterCount: number;
  sharePercent: number;
}

export interface CommunityConstituencyVoteSummary {
  acNo: number;
  constituencyName: string;
  district: string;
  totalVoters: number;
  leader: CommunityCandidateVoteRow;
  candidates: CommunityCandidateVoteRow[];
}

export interface CommunityVotesAggregate {
  totalParticipants: number;
  totalPartySeatVoters: number;
  totalAllianceSeatVoters: number;
  totalConstituencyVoters: number;
  totalCandidateVotesCast: number;
  votedConstituenciesCount: number;
  partyVotes: CommunityPartyVoteSummary[];
  partyVotesMap: Record<string, CommunityPartyVoteSummary>;
  allianceVotes: CommunityAllianceVoteSummary[];
  allianceVotesMap: Record<string, CommunityAllianceVoteSummary>;
  constituencyVotes: CommunityConstituencyVoteSummary[];
  constituencyVotesMap: Record<number, CommunityConstituencyVoteSummary>;
}

/**
 * Compact serializer for constituency picks stored inside public anonymized /leaderboard/{uid} docs.
 * Format: "Candidate Name|PARTY" (zero user PII, compact for 403 seats).
 */
export function serializeConstituencyVotes(
  picks: UserPredictionData['constituencyPicks'],
): Record<string, string> {
  const out: Record<string, string> = {};
  Object.entries(picks || {}).forEach(([acKey, pick]) => {
    if (!pick?.candidateName) return;
    const cleanName = pick.candidateName.replace(/\|/g, ' ').trim().slice(0, 80);
    const cleanParty = (pick.party || 'IND').replace(/\|/g, '').trim().toUpperCase().slice(0, 20);
    out[acKey] = `${cleanName}|${cleanParty}`;
  });
  return out;
}

export function parseConstituencyVoteValue(
  raw: string | { candidateName?: string; party?: string } | undefined,
): { candidateName: string; party: string } | null {
  if (!raw) return null;
  if (typeof raw === 'string') {
    const idx = raw.lastIndexOf('|');
    if (idx > 0) {
      return {
        candidateName: raw.slice(0, idx).trim(),
        party: raw.slice(idx + 1).trim().toUpperCase() || 'IND',
      };
    }
    return { candidateName: raw.trim(), party: 'IND' };
  }
  if (typeof raw === 'object' && raw.candidateName) {
    return {
      candidateName: String(raw.candidateName).trim(),
      party: String(raw.party || 'IND').trim().toUpperCase(),
    };
  }
  return null;
}

export function buildCommunityVotesAggregate(
  leaderboard: LeaderboardEntry[],
  parties: PartyConfig[],
  constituencies: ConstituencyRecord[],
  currentUserSnapshot?: {
    uid: string;
    partyBands: Record<string, number>;
    allianceBands?: Record<string, number>;
    constituencyPicks: UserPredictionData['constituencyPicks'];
  },
): CommunityVotesAggregate {
  const seatLookup = new Map<number, ConstituencyRecord>();
  constituencies.forEach((c) => seatLookup.set(c.acNo, c));

  // Merge cloud leaderboard docs with current user's latest prediction (preventing double count)
  interface NormalizedVoter {
    uid: string;
    partyBands: Record<string, number>;
    allianceBands: Record<string, number>;
    constituencyVotes: Record<string, string>;
  }

  const voterMap = new Map<string, NormalizedVoter>();

  leaderboard.forEach((entry) => {
    voterMap.set(entry.uid, {
      uid: entry.uid,
      partyBands: entry.partyBands || {},
      allianceBands: entry.allianceBands || {},
      constituencyVotes: entry.constituencyVotes || {},
    });
  });

  if (currentUserSnapshot) {
    const hasAnyLocalVote =
      Object.values(currentUserSnapshot.partyBands || {}).some((v) => getBandDisplaySeats(v) > 0) ||
      Object.values(currentUserSnapshot.allianceBands || {}).some(
        (v) => getBandDisplaySeats(v) > 0,
      ) ||
      Object.keys(currentUserSnapshot.constituencyPicks || {}).length > 0;

    if (hasAnyLocalVote || voterMap.has(currentUserSnapshot.uid)) {
      voterMap.set(currentUserSnapshot.uid, {
        uid: currentUserSnapshot.uid,
        partyBands: currentUserSnapshot.partyBands || {},
        allianceBands: currentUserSnapshot.allianceBands || {},
        constituencyVotes: serializeConstituencyVotes(currentUserSnapshot.constituencyPicks || {}),
      });
    }
  }

  const voters = Array.from(voterMap.values());

  // 1. Party Seats Community Tallies
  let totalPartySeatVoters = 0;
  const partyVotersCount: Record<string, number> = {};
  const partySeatSums: Record<string, number> = {};
  const partyBandCounts: Record<string, Record<number, number>> = {};

  // 2. Alliance Seats Community Tallies
  let totalAllianceSeatVoters = 0;
  const allianceVotersCount: Record<string, number> = {};
  const allianceSeatSums: Record<string, number> = {};
  const allianceMajorityCount: Record<string, number> = {};
  const allianceBandCounts: Record<string, Record<number, number>> = {};

  // 3. Constituency Candidate Tallies
  let totalConstituencyVoters = 0;
  let totalCandidateVotesCast = 0;
  const acCandidateCounts = new Map<
    number,
    Map<string, { candidateName: string; party: string; count: number }>
  >();

  voters.forEach((voter) => {
    const activePartyEntries = Object.entries(voter.partyBands).filter(
      ([, bandStart]) => getBandDisplaySeats(bandStart) > 0,
    );
    if (activePartyEntries.length > 0) {
      totalPartySeatVoters += 1;
      activePartyEntries.forEach(([rawCode, bandStart]) => {
        const code = rawCode.toUpperCase();
        const seats = getBandDisplaySeats(bandStart);
        partyVotersCount[code] = (partyVotersCount[code] || 0) + 1;
        partySeatSums[code] = (partySeatSums[code] || 0) + seats;
        if (!partyBandCounts[code]) partyBandCounts[code] = {};
        partyBandCounts[code][bandStart] = (partyBandCounts[code][bandStart] || 0) + 1;
      });
    }

    const activeAllianceEntries = Object.entries(voter.allianceBands).filter(
      ([, bandStart]) => getBandDisplaySeats(bandStart) > 0,
    );
    if (activeAllianceEntries.length > 0) {
      totalAllianceSeatVoters += 1;
      activeAllianceEntries.forEach(([rawCode, bandStart]) => {
        const code = rawCode.toUpperCase();
        const seats = getBandDisplaySeats(bandStart);
        allianceVotersCount[code] = (allianceVotersCount[code] || 0) + 1;
        allianceSeatSums[code] = (allianceSeatSums[code] || 0) + seats;
        if (seats >= 202) {
          allianceMajorityCount[code] = (allianceMajorityCount[code] || 0) + 1;
        }
        if (!allianceBandCounts[code]) allianceBandCounts[code] = {};
        allianceBandCounts[code][bandStart] = (allianceBandCounts[code][bandStart] || 0) + 1;
      });
    }

    const seatEntries = Object.entries(voter.constituencyVotes);
    if (seatEntries.length > 0) {
      totalConstituencyVoters += 1;
      seatEntries.forEach(([acKey, rawVal]) => {
        const acNo = Number(acKey);
        if (!Number.isFinite(acNo) || acNo < 1 || acNo > 403) return;
        const parsed = parseConstituencyVoteValue(rawVal);
        if (!parsed || !parsed.candidateName) return;

        totalCandidateVotesCast += 1;
        let seatMap = acCandidateCounts.get(acNo);
        if (!seatMap) {
          seatMap = new Map();
          acCandidateCounts.set(acNo, seatMap);
        }
        const candKey = `${parsed.candidateName.toLowerCase()}__${parsed.party}`;
        const prev = seatMap.get(candKey);
        if (prev) {
          prev.count += 1;
        } else {
          seatMap.set(candKey, {
            candidateName: parsed.candidateName,
            party: parsed.party,
            count: 1,
          });
        }
      });
    }
  });

  const activeParties = [...parties].filter((p) => p.active).sort((a, b) => a.order - b.order);
  const partyVotesMap: Record<string, CommunityPartyVoteSummary> = {};
  const partyVotes: CommunityPartyVoteSummary[] = activeParties.map((party) => {
    const code = party.code.toUpperCase();
    const voterCount = partyVotersCount[code] || 0;
    const avgSeats = voterCount > 0 ? Math.round((partySeatSums[code] || 0) / voterCount) : 0;
    const bandEntries: BandVoteBreakdown[] = Object.entries(partyBandCounts[code] || {})
      .map(([startStr, count]) => {
        const bandStart = Number(startStr);
        return {
          bandStart,
          bandLabel: getBandByStart(bandStart).label,
          count,
        };
      })
      .sort((a, b) => (b.count !== a.count ? b.count - a.count : b.bandStart - a.bandStart));

    const summary: CommunityPartyVoteSummary = {
      code,
      name: party.name,
      shortName: party.shortName,
      color: party.color || getPartyColor(code),
      voterCount,
      avgSeats,
      topBandLabel: bandEntries[0]?.bandLabel || '—',
      topBandVoters: bandEntries[0]?.count || 0,
      bandBreakdown: bandEntries.slice(0, 4),
    };
    partyVotesMap[code] = summary;
    return summary;
  });

  const allianceVotesMap: Record<string, CommunityAllianceVoteSummary> = {};
  const allianceVotes: CommunityAllianceVoteSummary[] = UP_ALLIANCES.map((alliance) => {
    const code = alliance.code;
    const voterCount = allianceVotersCount[code] || 0;
    const avgSeats = voterCount > 0 ? Math.round((allianceSeatSums[code] || 0) / voterCount) : 0;
    const bandEntries: BandVoteBreakdown[] = Object.entries(allianceBandCounts[code] || {})
      .map(([startStr, count]) => {
        const bandStart = Number(startStr);
        return {
          bandStart,
          bandLabel: getBandByStart(bandStart).label,
          count,
        };
      })
      .sort((a, b) => (b.count !== a.count ? b.count - a.count : b.bandStart - a.bandStart));

    const summary: CommunityAllianceVoteSummary = {
      code,
      shortEn: alliance.shortEn,
      shortHi: alliance.shortHi,
      nameEn: alliance.nameEn,
      nameHi: alliance.nameHi,
      color: alliance.color,
      voterCount,
      avgSeats,
      majorityVoters: allianceMajorityCount[code] || 0,
      topBandLabel: bandEntries[0]?.bandLabel || '—',
      topBandVoters: bandEntries[0]?.count || 0,
      bandBreakdown: bandEntries.slice(0, 4),
    };
    allianceVotesMap[code] = summary;
    return summary;
  });

  const constituencyVotesMap: Record<number, CommunityConstituencyVoteSummary> = {};
  const constituencyVotes: CommunityConstituencyVoteSummary[] = [];

  acCandidateCounts.forEach((candMap, acNo) => {
    const seatMeta = seatLookup.get(acNo);
    const constituencyName = seatMeta?.name || `AC #${acNo}`;
    const district = seatMeta?.district || 'Uttar Pradesh';

    let totalVoters = 0;
    candMap.forEach((c) => {
      totalVoters += c.count;
    });

    const candidates: CommunityCandidateVoteRow[] = Array.from(candMap.entries())
      .map(([key, item]) => ({
        key: `${acNo}::${key}`,
        acNo,
        constituencyName,
        district,
        candidateName: item.candidateName,
        party: item.party,
        alliance: getAllianceCodeForParty(item.party),
        voterCount: item.count,
        sharePercent: totalVoters > 0 ? Math.round((item.count / totalVoters) * 100) : 0,
      }))
      .sort((a, b) =>
        b.voterCount !== a.voterCount
          ? b.voterCount - a.voterCount
          : a.candidateName.localeCompare(b.candidateName),
      );

    if (candidates.length > 0) {
      const seatSummary: CommunityConstituencyVoteSummary = {
        acNo,
        constituencyName,
        district,
        totalVoters,
        leader: candidates[0],
        candidates,
      };
      constituencyVotesMap[acNo] = seatSummary;
      constituencyVotes.push(seatSummary);
    }
  });

  constituencyVotes.sort((a, b) =>
    b.totalVoters !== a.totalVoters ? b.totalVoters - a.totalVoters : a.acNo - b.acNo,
  );

  return {
    totalParticipants: voters.length,
    totalPartySeatVoters,
    totalAllianceSeatVoters,
    totalConstituencyVoters,
    totalCandidateVotesCast,
    votedConstituenciesCount: constituencyVotes.length,
    partyVotes,
    partyVotesMap,
    allianceVotes,
    allianceVotesMap,
    constituencyVotes,
    constituencyVotesMap,
  };
}

export function getCandidateCommunityVotes(
  aggregate: CommunityVotesAggregate | undefined,
  acNo: number,
  candidateName: string,
  party: string,
): { voterCount: number; sharePercent: number; totalSeatVoters: number } {
  const seatSummary = aggregate?.constituencyVotesMap[acNo];
  if (!seatSummary) {
    return { voterCount: 0, sharePercent: 0, totalSeatVoters: 0 };
  }
  const normName = candidateName.trim().toLowerCase();
  const normParty = party.trim().toUpperCase();
  const match = seatSummary.candidates.find(
    (c) => c.candidateName.toLowerCase() === normName && c.party.toUpperCase() === normParty,
  );
  return {
    voterCount: match?.voterCount || 0,
    sharePercent: match?.sharePercent || 0,
    totalSeatVoters: seatSummary.totalVoters,
  };
}
