import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  Award,
  BarChart3,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ClipboardList,
  Database,
  Download,
  GitMerge,
  Lock,
  MapPin,
  Phone,
  Plus,
  RefreshCw,
  Search,
  Settings,
  Shield,
  Trash2,
  Upload,
  Users,
  Vote,
} from 'lucide-react';
import {
  AuditLogRecord,
  CandidateRecord,
  CandidateStatus,
  ConstituencyRecord,
  ElectionConfigData,
  LeaderboardEntry,
  OfficialResultRecord,
  PartyConfig,
  UserPredictionData,
  UserProfileData,
} from '../types/election';
import {
  DEFAULT_PARTY_BANDS,
  getBandByStart,
  getBandDisplaySeats,
  getPartyColor,
} from '../data/upParties';
import {
  DEFAULT_ALLIANCE_BANDS,
  UP_ALLIANCES,
  getAllianceCodeForParty,
} from '../data/upAlliances';
import { parseCandidatesCsv, parseSeatsCsv } from '../utils/csvParser';

interface AdminDashboardProps {
  parties: PartyConfig[];
  constituencies: ConstituencyRecord[];
  candidates: CandidateRecord[];
  electionConfig: ElectionConfigData;
  officialResults: Record<number, OfficialResultRecord>;
  leaderboard: LeaderboardEntry[];
  allUsers: UserProfileData[];
  allUserPredictions: UserPredictionData[];
  auditLogs: AuditLogRecord[];
  onImportSeatsCsv: (csvText: string) => Promise<number>;
  onSaveCandidate: (cand: CandidateRecord) => Promise<void>;
  onImportCandidatesCsv: (cands: CandidateRecord[]) => Promise<number>;
  onDeleteCandidate: (id: string) => Promise<void>;
  onSaveParty: (party: PartyConfig) => Promise<void>;
  onSaveElectionConfig: (cfg: ElectionConfigData) => Promise<void>;
  onSaveOfficialResult: (res: OfficialResultRecord) => Promise<void>;
  onRecalculateLeaderboard: () => Promise<number>;
}

type AdminSection =
  | 'overview'
  | 'candidateVotes'
  | 'users'
  | 'csv'
  | 'candidates'
  | 'parties'
  | 'config'
  | 'results'
  | 'audit';

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  parties,
  constituencies,
  candidates,
  electionConfig,
  officialResults,
  leaderboard,
  allUsers,
  allUserPredictions,
  auditLogs,
  onImportSeatsCsv,
  onSaveCandidate,
  onImportCandidatesCsv,
  onDeleteCandidate,
  onSaveParty,
  onSaveElectionConfig,
  onSaveOfficialResult,
  onRecalculateLeaderboard,
}) => {
  const [section, setSection] = useState<AdminSection>('overview');
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Candidate Votes analytics filters
  const [candVoteSearch, setCandVoteSearch] = useState('');
  const [candVoteAlliance, setCandVoteAlliance] = useState('ALL');
  const [candVoteParty, setCandVoteParty] = useState('ALL');
  const [candVoteViewMode, setCandVoteViewMode] = useState<'candidates' | 'seats'>('candidates');
  const [candVoteLeadingOnly, setCandVoteLeadingOnly] = useState(false);

  // User Choices inspector filters
  const [userSearch, setUserSearch] = useState('');
  const [userAllianceFilter, setUserAllianceFilter] = useState('ALL');
  const [userPartyFilter, setUserPartyFilter] = useState('ALL');
  const [userStatusFilter, setUserStatusFilter] = useState<'ALL' | 'SUBMITTED' | 'DRAFT'>('ALL');
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);
  const [pickFilterInsideUser, setPickFilterInsideUser] = useState('');

  // Manual Candidate form
  const [candAcNo, setCandAcNo] = useState(1);
  const [candName, setCandName] = useState('');
  const [candParty, setCandParty] = useState('BJP');
  const [candStatus, setCandStatus] = useState<CandidateStatus>('OFFICIAL');
  const [candSource, setCandSource] = useState('ECI Affidavit / Party Release');

  // Party form
  const [newPartyCode, setNewPartyCode] = useState('');
  const [newPartyName, setNewPartyName] = useState('');
  const [newPartyColor, setNewPartyColor] = useState('#1D4ED8');

  // Election config local draft
  const [cfgDraft, setCfgDraft] = useState<ElectionConfigData>(electionConfig);

  useEffect(() => {
    setCfgDraft(electionConfig);
  }, [electionConfig]);

  // Official result form
  const [resAcNo, setResAcNo] = useState(1);
  const [resWinnerName, setResWinnerName] = useState('');
  const [resWinnerParty, setResWinnerParty] = useState('BJP');
  const [resVotes, setResVotes] = useState(115000);
  const [resSourceUrl, setResSourceUrl] = useState('https://results.eci.gov.in');

  const notify = (msg: string) => {
    setErrorMsg(null);
    setStatusMsg(msg);
    setTimeout(() => setStatusMsg(null), 5000);
  };

  const handleSeatsFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    try {
      const text = await file.text();
      const rows = parseSeatsCsv(text);
      if (rows.length === 0) {
        setErrorMsg('No valid constituency rows detected. Ensure columns include ac_no, name, winner_name, winner_party.');
      } else {
        const count = await onImportSeatsCsv(text);
        notify(`Imported and synced ${count} constituency records to Firestore.`);
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to parse CSV.');
    } finally {
      setBusy(false);
    }
  };

  const handleCandidatesFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    try {
      const text = await file.text();
      const parsed = parseCandidatesCsv(text);
      if (parsed.length === 0) {
        setErrorMsg('No valid candidate rows found. Expected columns: ac_no, name, party, status, source.');
      } else {
        const count = await onImportCandidatesCsv(parsed);
        notify(`Uploaded ${count} 2027 candidates to Firestore.`);
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Candidate CSV upload failed.');
    } finally {
      setBusy(false);
    }
  };

  const handleAddCandidate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!candName.trim()) return;
    setBusy(true);
    try {
      const id = `${candAcNo}_${candName.toLowerCase().replace(/[^a-z0-9]+/g, '_').slice(0, 40)}`;
      await onSaveCandidate({
        id,
        acNo: candAcNo,
        name: candName.trim(),
        party: candParty.trim().toUpperCase(),
        status: candStatus,
        source: candSource.trim() || 'Admin Console',
      });
      setCandName('');
      notify(`Saved ${candName.trim()} (${candParty}) for AC #${candAcNo}.`);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to save candidate.');
    } finally {
      setBusy(false);
    }
  };

  const handleAddParty = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPartyCode.trim() || !newPartyName.trim()) return;
    setBusy(true);
    try {
      const code = newPartyCode.trim().toUpperCase();
      await onSaveParty({
        code,
        name: newPartyName.trim(),
        shortName: code,
        color: newPartyColor,
        active: true,
        order: parties.length + 1,
        results2007: 0,
        results2012: 0,
        results2017: 0,
        results2022: 0,
      });
      setNewPartyCode('');
      setNewPartyName('');
      notify(`Added party ${code} to Firestore.`);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to save party.');
    } finally {
      setBusy(false);
    }
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await onSaveElectionConfig(cfgDraft);
      notify('Election cutoff, lock status, and Section 126 blackout settings saved.');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to update election configuration.');
    } finally {
      setBusy(false);
    }
  };

  const handleSaveResult = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resWinnerName.trim()) return;
    setBusy(true);
    try {
      await onSaveOfficialResult({
        acNo: resAcNo,
        winnerName: resWinnerName.trim(),
        winnerParty: resWinnerParty.trim().toUpperCase(),
        winnerVotes: resVotes,
        declared: true,
        sourceUrl: resSourceUrl.trim() || 'https://results.eci.gov.in',
      });
      setResWinnerName('');
      notify(`Recorded verified ECI result for AC #${resAcNo}.`);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to record official result.');
    } finally {
      setBusy(false);
    }
  };

  const handleRecalc = async () => {
    setBusy(true);
    try {
      const updated = await onRecalculateLeaderboard();
      notify(`Recalculated official accuracy points across ${updated} leaderboard entries.`);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Recalculation failed.');
    } finally {
      setBusy(false);
    }
  };

  const avgCompletion =
    leaderboard.length > 0
      ? Math.round(leaderboard.reduce((s, l) => s + l.completionPercent, 0) / leaderboard.length)
      : 0;

  // Join /users + /user_predictions so admin sees every user's alliance, party & candidate picks
  const joinedUsers = useMemo(() => {
    const userMap = new Map<string, UserProfileData>();
    allUsers.forEach((u) => userMap.set(u.uid, u));
    const predMap = new Map<string, UserPredictionData>();
    allUserPredictions.forEach((p) => predMap.set(p.uid, p));

    const allUids = new Set<string>([...userMap.keys(), ...predMap.keys()]);
    const acLookup = new Map<number, ConstituencyRecord>();
    constituencies.forEach((c) => acLookup.set(c.acNo, c));

    return Array.from(allUids)
      .map((uid) => {
        const profile = userMap.get(uid);
        const pred = predMap.get(uid);
        const phoneNumber = profile?.phoneNumber || '';
        const authProvider: 'google' | 'phone' =
          profile?.authProvider || (phoneNumber && !profile?.email ? 'phone' : 'google');

        const allianceBands = pred?.allianceBands || DEFAULT_ALLIANCE_BANDS;
        const allianceSummary = UP_ALLIANCES.map((a) => {
          const bandStart = allianceBands[a.code] ?? 0;
          const band = getBandByStart(bandStart);
          const seats = getBandDisplaySeats(bandStart);
          return {
            code: a.code,
            name: a.shortEn,
            color: a.color,
            bandLabel: band.label,
            seats,
          };
        });
        const topAlliance = [...allianceSummary].sort((a, b) => b.seats - a.seats)[0];
        const leadingAlliance =
          pred?.leadingAlliance && pred.leadingAlliance !== 'NONE'
            ? pred.leadingAlliance
            : topAlliance && topAlliance.seats > 0
            ? topAlliance.code
            : 'NONE';

        const partyBands = pred?.partyBands || DEFAULT_PARTY_BANDS;
        const partySummary = Object.entries(partyBands)
          .map(([code, bandStart]) => {
            const band = getBandByStart(bandStart);
            const seats = getBandDisplaySeats(bandStart);
            return {
              code,
              bandLabel: band.label,
              seats,
              color: getPartyColor(code),
            };
          })
          .filter((p) => p.seats > 0)
          .sort((a, b) => b.seats - a.seats);
        const leadingParty =
          pred?.leadingParty && pred.leadingParty !== 'NONE'
            ? pred.leadingParty
            : partySummary[0]?.code || 'NONE';

        const picksList = Object.entries(pred?.constituencyPicks || {})
          .map(([acKey, pick]) => {
            const acNo = Number(acKey);
            const seat = acLookup.get(acNo);
            return {
              acNo,
              constituencyName: pick.constituencyName || seat?.name || `AC #${acKey}`,
              district: pick.district || seat?.district || 'Uttar Pradesh',
              candidateName: pick.candidateName,
              party: pick.party,
              alliance: pick.alliance || getAllianceCodeForParty(pick.party),
              source: pick.source,
            };
          })
          .sort((a, b) => a.acNo - b.acNo);

        return {
          uid,
          displayName: profile?.displayName || pred?.publicAlias || 'Registered Citizen',
          publicAlias: profile?.publicAlias || pred?.publicAlias || 'UP Forecaster',
          email: profile?.email || '',
          phoneNumber,
          authProvider,
          photoURL: profile?.photoURL,
          hasPredictionDoc: Boolean(pred),
          isSubmitted: Boolean(pred?.isSubmitted),
          totalAllocated: pred?.totalAllocated ?? 0,
          allianceAllocated:
            pred?.allianceAllocated ?? allianceSummary.reduce((s, a) => s + a.seats, 0),
          completedCount: picksList.length,
          completionPercent: pred?.completionPercent ?? 0,
          leadingAlliance,
          leadingParty,
          allianceSummary,
          partySummary,
          picksList,
        };
      })
      .sort((a, b) => {
        if (b.completedCount !== a.completedCount) return b.completedCount - a.completedCount;
        if (a.isSubmitted !== b.isSubmitted) return a.isSubmitted ? -1 : 1;
        return a.publicAlias.localeCompare(b.publicAlias);
      });
  }, [allUsers, allUserPredictions, constituencies]);

  const filteredJoinedUsers = useMemo(() => {
    const q = userSearch.trim().toLowerCase();
    return joinedUsers.filter((u) => {
      if (userStatusFilter === 'SUBMITTED' && !u.isSubmitted) return false;
      if (userStatusFilter === 'DRAFT' && u.isSubmitted) return false;
      if (userAllianceFilter !== 'ALL' && u.leadingAlliance !== userAllianceFilter) return false;
      if (
        userPartyFilter !== 'ALL' &&
        u.leadingParty !== userPartyFilter &&
        !u.partySummary.some((p) => p.code === userPartyFilter)
      ) {
        return false;
      }
      if (!q) return true;
      return (
        u.displayName.toLowerCase().includes(q) ||
        u.publicAlias.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.phoneNumber.toLowerCase().includes(q) ||
        u.uid.toLowerCase().includes(q) ||
        u.picksList.some(
          (p) =>
            p.candidateName.toLowerCase().includes(q) ||
            p.constituencyName.toLowerCase().includes(q) ||
            String(p.acNo) === q,
        )
      );
    });
  }, [joinedUsers, userSearch, userStatusFilter, userAllianceFilter, userPartyFilter]);

  const allianceConsensusCounts = useMemo(() => {
    const counts: Record<string, number> = { NDA: 0, INDIA: 0, THIRD_FRONT: 0, OTH_IND: 0 };
    joinedUsers.forEach((u) => {
      if (u.hasPredictionDoc && u.leadingAlliance in counts) {
        counts[u.leadingAlliance]++;
      }
    });
    return counts;
  }, [joinedUsers]);

  // Executive Vote Tally: Alliance, Party, Candidate & Constituency Votes
  const voteAnalytics = useMemo(() => {
    const usersWithPreds = joinedUsers.filter((u) => u.hasPredictionDoc);
    const totalCandidateVotesCast = joinedUsers.reduce((sum, u) => sum + u.completedCount, 0);

    // 1. Alliance Vote Tally
    const allianceCandidateCounts: Record<string, number> = {
      NDA: 0,
      INDIA: 0,
      THIRD_FRONT: 0,
      OTH_IND: 0,
    };
    const allianceSeatSums: Record<string, number> = {
      NDA: 0,
      INDIA: 0,
      THIRD_FRONT: 0,
      OTH_IND: 0,
    };
    const allianceMajorityVotes: Record<string, number> = {
      NDA: 0,
      INDIA: 0,
      THIRD_FRONT: 0,
      OTH_IND: 0,
    };
    const allianceParticipants: Record<string, number> = {
      NDA: 0,
      INDIA: 0,
      THIRD_FRONT: 0,
      OTH_IND: 0,
    };

    let totalAllianceForecasters = 0;
    usersWithPreds.forEach((u) => {
      if (u.allianceAllocated > 0 || u.leadingAlliance !== 'NONE') {
        totalAllianceForecasters++;
      }
      u.allianceSummary.forEach((a) => {
        allianceSeatSums[a.code] = (allianceSeatSums[a.code] || 0) + a.seats;
        if (a.seats > 0) {
          allianceParticipants[a.code] = (allianceParticipants[a.code] || 0) + 1;
        }
        if (a.seats >= 202) {
          allianceMajorityVotes[a.code] = (allianceMajorityVotes[a.code] || 0) + 1;
        }
      });
      u.picksList.forEach((p) => {
        const al = p.alliance || getAllianceCodeForParty(p.party);
        allianceCandidateCounts[al] = (allianceCandidateCounts[al] || 0) + 1;
      });
    });

    const allianceTally = UP_ALLIANCES.map((a) => {
      const leadingVotes = allianceConsensusCounts[a.code] || 0;
      const leadingShare =
        totalAllianceForecasters > 0
          ? Math.round((leadingVotes / totalAllianceForecasters) * 100)
          : 0;
      const candidateVotes = allianceCandidateCounts[a.code] || 0;
      const candidateShare =
        totalCandidateVotesCast > 0
          ? Math.round((candidateVotes / totalCandidateVotesCast) * 100)
          : 0;
      const avgSeats =
        totalAllianceForecasters > 0
          ? Math.round((allianceSeatSums[a.code] || 0) / totalAllianceForecasters)
          : 0;
      return {
        code: a.code,
        shortEn: a.shortEn,
        nameEn: a.nameEn,
        color: a.color,
        leadingVotes,
        leadingShare,
        majorityVotes: allianceMajorityVotes[a.code] || 0,
        selectedByUsers: allianceParticipants[a.code] || 0,
        avgSeats,
        candidateVotes,
        candidateShare,
      };
    }).sort((a, b) => {
      if (b.leadingVotes !== a.leadingVotes) return b.leadingVotes - a.leadingVotes;
      if (b.candidateVotes !== a.candidateVotes) return b.candidateVotes - a.candidateVotes;
      return b.avgSeats - a.avgSeats;
    });

    // 2. Party Vote Tally
    const partyLeadingVotes: Record<string, number> = {};
    const partySelectedUsers: Record<string, number> = {};
    const partySeatSums: Record<string, number> = {};
    const partyCandidateVotes: Record<string, number> = {};
    let totalPartyForecasters = 0;

    usersWithPreds.forEach((u) => {
      if (u.totalAllocated > 0 || u.leadingParty !== 'NONE') {
        totalPartyForecasters++;
        if (u.leadingParty && u.leadingParty !== 'NONE') {
          const lp = u.leadingParty.toUpperCase();
          partyLeadingVotes[lp] = (partyLeadingVotes[lp] || 0) + 1;
        }
      }
      u.partySummary.forEach((ps) => {
        const code = ps.code.toUpperCase();
        partySeatSums[code] = (partySeatSums[code] || 0) + ps.seats;
        if (ps.seats > 0) {
          partySelectedUsers[code] = (partySelectedUsers[code] || 0) + 1;
        }
      });
      u.picksList.forEach((p) => {
        const code = p.party.toUpperCase();
        partyCandidateVotes[code] = (partyCandidateVotes[code] || 0) + 1;
      });
    });

    const partyCodes = new Set<string>(parties.map((p) => p.code.toUpperCase()));
    Object.keys(partyLeadingVotes).forEach((c) => partyCodes.add(c));
    Object.keys(partyCandidateVotes).forEach((c) => partyCodes.add(c));

    const partyTally = Array.from(partyCodes)
      .map((code) => {
        const meta = parties.find((p) => p.code.toUpperCase() === code);
        const leadingVotes = partyLeadingVotes[code] || 0;
        const candidateVotes = partyCandidateVotes[code] || 0;
        const selectedUsers = partySelectedUsers[code] || 0;
        const avgSeats =
          totalPartyForecasters > 0
            ? Math.round((partySeatSums[code] || 0) / totalPartyForecasters)
            : 0;
        return {
          code,
          name: meta?.name || code,
          color: meta?.color || getPartyColor(code),
          alliance: getAllianceCodeForParty(code),
          leadingVotes,
          leadingShare:
            totalPartyForecasters > 0 ? Math.round((leadingVotes / totalPartyForecasters) * 100) : 0,
          selectedUsers,
          avgSeats,
          candidateVotes,
          candidateShare:
            totalCandidateVotesCast > 0
              ? Math.round((candidateVotes / totalCandidateVotesCast) * 100)
              : 0,
        };
      })
      .sort((a, b) => {
        if (b.leadingVotes !== a.leadingVotes) return b.leadingVotes - a.leadingVotes;
        if (b.candidateVotes !== a.candidateVotes) return b.candidateVotes - a.candidateVotes;
        if (b.selectedUsers !== a.selectedUsers) return b.selectedUsers - a.selectedUsers;
        return b.avgSeats - a.avgSeats;
      });

    // 3. Candidate & Constituency Vote Tally
    interface CandAccum {
      key: string;
      acNo: number;
      constituencyName: string;
      district: string;
      candidateName: string;
      party: string;
      alliance: string;
      votes: number;
      voters: string[];
    }
    const candMap = new Map<string, CandAccum>();
    const seatTotalVotes: Record<number, number> = {};

    joinedUsers.forEach((u) => {
      u.picksList.forEach((p) => {
        const partyCode = (p.party || 'IND').toUpperCase().trim();
        const candClean = (p.candidateName || 'Unnamed Candidate').trim();
        const allianceCode = p.alliance || getAllianceCodeForParty(partyCode);
        const key = `${p.acNo}::${candClean.toLowerCase()}::${partyCode}`;
        seatTotalVotes[p.acNo] = (seatTotalVotes[p.acNo] || 0) + 1;

        const existing = candMap.get(key);
        if (existing) {
          existing.votes += 1;
          if (existing.voters.length < 25) {
            existing.voters.push(u.publicAlias);
          }
        } else {
          candMap.set(key, {
            key,
            acNo: p.acNo,
            constituencyName: p.constituencyName,
            district: p.district,
            candidateName: candClean,
            party: partyCode,
            alliance: allianceCode,
            votes: 1,
            voters: [u.publicAlias],
          });
        }
      });
    });

    // Compute per-seat leader votes
    const seatMaxVotes: Record<number, number> = {};
    candMap.forEach((item) => {
      if (item.votes > (seatMaxVotes[item.acNo] || 0)) {
        seatMaxVotes[item.acNo] = item.votes;
      }
    });

    const candidateLeaderboard = Array.from(candMap.values())
      .map((item) => {
        const seatVotes = seatTotalVotes[item.acNo] || item.votes;
        return {
          ...item,
          seatTotalVotes: seatVotes,
          voteSharePercent: seatVotes > 0 ? Math.round((item.votes / seatVotes) * 100) : 0,
          isLeadingInSeat: item.votes > 0 && item.votes === seatMaxVotes[item.acNo],
        };
      })
      .sort((a, b) => {
        if (b.votes !== a.votes) return b.votes - a.votes;
        if (b.voteSharePercent !== a.voteSharePercent) return b.voteSharePercent - a.voteSharePercent;
        return a.acNo - b.acNo;
      });

    // Group by constituency for Seat-by-Seat Winner/Runner-Up summary
    const seatGroupMap = new Map<number, typeof candidateLeaderboard>();
    candidateLeaderboard.forEach((row) => {
      const arr = seatGroupMap.get(row.acNo) || [];
      arr.push(row);
      seatGroupMap.set(row.acNo, arr);
    });

    const constituencyVoteRows = Array.from(seatGroupMap.entries())
      .map(([acNo, list]) => {
        const sorted = [...list].sort((a, b) => b.votes - a.votes);
        const leader = sorted[0];
        const runnerUp = sorted[1] || null;
        return {
          acNo,
          constituencyName: leader.constituencyName,
          district: leader.district,
          totalVotes: seatTotalVotes[acNo] || leader.votes,
          candidatesCount: sorted.length,
          leader,
          runnerUp,
          allCandidates: sorted,
        };
      })
      .sort((a, b) => {
        if (b.totalVotes !== a.totalVotes) return b.totalVotes - a.totalVotes;
        return a.acNo - b.acNo;
      });

    return {
      totalVoters: joinedUsers.length,
      syncedForecasts: usersWithPreds.length,
      totalAllianceForecasters,
      totalPartyForecasters,
      totalCandidateVotesCast,
      votedConstituenciesCount: constituencyVoteRows.length,
      uniqueCandidatesVoted: candidateLeaderboard.length,
      allianceTally,
      partyTally,
      candidateLeaderboard,
      constituencyVoteRows,
    };
  }, [joinedUsers, allianceConsensusCounts, parties]);

  const filteredCandidateVotes = useMemo(() => {
    const q = candVoteSearch.trim().toLowerCase();
    return voteAnalytics.candidateLeaderboard.filter((c) => {
      if (candVoteLeadingOnly && !c.isLeadingInSeat) return false;
      if (candVoteAlliance !== 'ALL' && c.alliance !== candVoteAlliance) return false;
      if (candVoteParty !== 'ALL' && c.party !== candVoteParty) return false;
      if (!q) return true;
      return (
        c.candidateName.toLowerCase().includes(q) ||
        c.constituencyName.toLowerCase().includes(q) ||
        c.district.toLowerCase().includes(q) ||
        c.party.toLowerCase().includes(q) ||
        String(c.acNo) === q
      );
    });
  }, [
    voteAnalytics.candidateLeaderboard,
    candVoteSearch,
    candVoteAlliance,
    candVoteParty,
    candVoteLeadingOnly,
  ]);

  const filteredSeatVoteRows = useMemo(() => {
    const q = candVoteSearch.trim().toLowerCase();
    return voteAnalytics.constituencyVoteRows.filter((seat) => {
      if (candVoteAlliance !== 'ALL' && seat.leader.alliance !== candVoteAlliance) return false;
      if (candVoteParty !== 'ALL' && seat.leader.party !== candVoteParty) return false;
      if (!q) return true;
      return (
        seat.constituencyName.toLowerCase().includes(q) ||
        seat.district.toLowerCase().includes(q) ||
        String(seat.acNo) === q ||
        seat.allCandidates.some(
          (c) =>
            c.candidateName.toLowerCase().includes(q) || c.party.toLowerCase().includes(q),
        )
      );
    });
  }, [voteAnalytics.constituencyVoteRows, candVoteSearch, candVoteAlliance, candVoteParty]);

  const handleExportCandidateVotesCsv = () => {
    const escapeCsv = (val: string | number | boolean) => `"${String(val ?? '').replace(/"/g, '""')}"`;
    const headers = [
      'AC No',
      'Constituency',
      'District',
      'Candidate Name',
      'Party',
      'Alliance',
      'Votes Secured',
      'Total AC Votes',
      'Vote Share (%)',
      'Leading in Seat',
      'Sample Voters',
    ];
    const rows = filteredCandidateVotes.map((c) =>
      [
        c.acNo,
        c.constituencyName,
        c.district,
        c.candidateName,
        c.party,
        c.alliance,
        c.votes,
        c.seatTotalVotes,
        c.voteSharePercent,
        c.isLeadingInSeat ? 'YES' : 'NO',
        c.voters.join('; '),
      ]
        .map(escapeCsv)
        .join(','),
    );
    const csvContent = [headers.map(escapeCsv).join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `up-mandate-candidate-votes-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    notify(`Exported ${filteredCandidateVotes.length} candidate vote tallies to CSV.`);
  };

  const handleExportUserChoicesCsv = () => {
    const escapeCsv = (val: string | number) => {
      const str = String(val ?? '');
      return `"${str.replace(/"/g, '""')}"`;
    };
    const headers = [
      'UID',
      'Display Name',
      'Public Alias',
      'Auth Method',
      'Mobile Number',
      'Email',
      'Submitted',
      'Leading Alliance',
      'NDA Range (Seats)',
      'INDIA Range (Seats)',
      '3rd Front Range (Seats)',
      'Others & Ind Range (Seats)',
      'Leading Party',
      'Chosen Parties',
      'Candidate Picks Count',
      'Candidate Picks (AC: Candidate [Party / Alliance])',
    ];
    const rows = filteredJoinedUsers.map((u) => {
      const findAlliance = (code: string) => {
        const a = u.allianceSummary.find((x) => x.code === code);
        return a ? `${a.bandLabel} (${a.seats})` : '0–4 (0)';
      };
      const partiesStr = u.partySummary.map((p) => `${p.code}: ${p.bandLabel} (${p.seats})`).join('; ');
      const picksStr = u.picksList
        .map((p) => `AC#${p.acNo} ${p.constituencyName}: ${p.candidateName} (${p.party}/${p.alliance})`)
        .join(' | ');
      return [
        u.uid,
        u.displayName,
        u.publicAlias,
        u.authProvider === 'phone' ? 'MOBILE OTP' : 'GOOGLE',
        u.phoneNumber,
        u.email,
        u.isSubmitted ? 'YES' : 'NO',
        u.leadingAlliance,
        findAlliance('NDA'),
        findAlliance('INDIA'),
        findAlliance('THIRD_FRONT'),
        findAlliance('OTH_IND'),
        u.leadingParty,
        partiesStr,
        u.completedCount,
        picksStr,
      ]
        .map(escapeCsv)
        .join(',');
    });
    const csvContent = [headers.map(escapeCsv).join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `up-mandate-user-choices-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    notify(`Exported ${filteredJoinedUsers.length} user prediction records to CSV.`);
  };

  return (
    <div className="space-y-5">
      {/* Admin Header & Module Tabs */}
      <div className="rounded-3xl bg-gradient-to-br from-[#07112B] via-[#0D1E4A] to-[#0A1633] text-white p-5 sm:p-6 up-neon-rim up-md3-elev-3 relative overflow-hidden">
        <div className="up-tiranga-bar absolute top-0 left-0 right-0" aria-hidden="true" />
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#F59E0B] text-slate-950 flex items-center justify-center">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-display font-bold text-lg sm:text-xl">
                UP Mandate Administration Console
              </h2>
              <p className="text-xs text-blue-200">
                Role-based management for 403 seats, candidates, Section 126 blackout &amp; ECI verification
              </p>
            </div>
          </div>
          <span className="px-3 py-1 rounded-lg bg-white/10 text-xs font-mono-num text-amber-300">
            RBAC Verified Admin
          </span>
        </div>

        <div className="flex flex-wrap gap-2">
          {[
            { id: 'overview', label: 'Vote Tally (Alliances & Parties)' },
            {
              id: 'candidateVotes',
              label: `Candidate Votes (${voteAnalytics.totalCandidateVotesCast})`,
            },
            { id: 'users', label: `Voters (${joinedUsers.length})` },
            { id: 'csv', label: '403 CSV Import' },
            { id: 'candidates', label: 'Manage Candidates' },
            { id: 'parties', label: 'Parties' },
            { id: 'config', label: 'Deadline & Blackout' },
            { id: 'results', label: 'ECI Results & Scoring' },
            { id: 'audit', label: 'Audit Logs' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setSection(tab.id as AdminSection)}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                section === tab.id
                  ? 'bg-[#F59E0B] text-slate-950 font-bold'
                  : 'bg-white/10 text-blue-100 hover:bg-white/20'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {statusMsg && (
        <div className="rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 p-3.5 flex items-center gap-2 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{statusMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 p-3.5 flex items-center gap-2 text-xs font-semibold text-rose-700 dark:text-rose-300">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {section === 'overview' && (
        <div className="space-y-5">
          {/* Top Executive KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <button
              type="button"
              onClick={() => setSection('users')}
              className="rounded-2xl bg-white dark:bg-[#0F1B35] border border-slate-200 dark:border-slate-800 p-5 text-left hover:border-blue-400 transition-colors cursor-pointer up-md3-elev-1"
            >
              <Users className="w-5 h-5 text-blue-600 mb-2" />
              <div className="font-mono-num font-extrabold text-2xl text-slate-900 dark:text-white">
                {voteAnalytics.totalVoters}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400">
                Registered Voters ({voteAnalytics.syncedForecasts} Synced Forecasts) →
              </div>
            </button>

            <button
              type="button"
              onClick={() => setSection('candidateVotes')}
              className="rounded-2xl bg-white dark:bg-[#0F1B35] border border-slate-200 dark:border-slate-800 p-5 text-left hover:border-amber-400 transition-colors cursor-pointer up-md3-elev-1"
            >
              <Vote className="w-5 h-5 text-amber-600 mb-2" />
              <div className="font-mono-num font-extrabold text-2xl text-slate-900 dark:text-white">
                {voteAnalytics.totalCandidateVotesCast}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400">
                Candidate Votes Cast ({voteAnalytics.votedConstituenciesCount}/403 Seats) →
              </div>
            </button>

            <div className="rounded-2xl bg-white dark:bg-[#0F1B35] border border-slate-200 dark:border-slate-800 p-5 up-md3-elev-1">
              <GitMerge className="w-5 h-5 text-emerald-600 mb-2" />
              <div className="font-mono-num font-extrabold text-2xl text-slate-900 dark:text-white">
                {voteAnalytics.allianceTally[0]?.leadingVotes
                  ? `${voteAnalytics.allianceTally[0].shortEn} (${voteAnalytics.allianceTally[0].leadingVotes})`
                  : 'No Votes Yet'}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400">
                Most Chosen #1 Alliance ({voteAnalytics.totalAllianceForecasters} Alliance Voters)
              </div>
            </div>

            <div className="rounded-2xl bg-white dark:bg-[#0F1B35] border border-slate-200 dark:border-slate-800 p-5 up-md3-elev-1">
              <Award className="w-5 h-5 text-cyan-600 mb-2" />
              <div className="font-mono-num font-extrabold text-2xl text-slate-900 dark:text-white">
                {voteAnalytics.partyTally[0]?.leadingVotes || voteAnalytics.partyTally[0]?.candidateVotes
                  ? `${voteAnalytics.partyTally[0].code} (${voteAnalytics.partyTally[0].leadingVotes})`
                  : `${avgCompletion}%`}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400">
                #1 Leading Party · Avg Completion {avgCompletion}%
              </div>
            </div>
          </div>

          {/* 1. Alliance Vote Breakdown */}
          <div className="rounded-3xl bg-white dark:bg-[#0F1B35] border border-slate-200 dark:border-slate-800 p-5 sm:p-6 space-y-4 up-md3-elev-1">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="font-display font-bold text-base sm:text-lg text-slate-900 dark:text-white flex items-center gap-2">
                  <GitMerge className="w-4 h-4 text-[#FF9933]" />
                  Alliance Vote Tally — How Many People Chose Each Alliance
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Shows #1 alliance picks, 202+ majority predictions, average seats, and constituency candidate votes per alliance
                </p>
              </div>
              <span className="px-3 py-1 rounded-xl bg-slate-100 dark:bg-slate-900 text-xs font-mono-num font-bold text-slate-700 dark:text-slate-200">
                {voteAnalytics.totalAllianceForecasters} Alliance Voters
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3.5">
              {voteAnalytics.allianceTally.map((al, idx) => (
                <div
                  key={al.code}
                  className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50 p-4 space-y-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className="w-3 h-3 rounded-full shrink-0"
                        style={{ backgroundColor: al.color }}
                      />
                      <span className="font-display font-bold text-sm text-slate-900 dark:text-white truncate">
                        #{idx + 1} {al.shortEn}
                      </span>
                    </div>
                    <span className="px-2 py-0.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] font-mono-num font-bold text-slate-700 dark:text-slate-200">
                      {al.leadingShare}%
                    </span>
                  </div>

                  <div>
                    <div className="flex items-baseline justify-between text-xs mb-1">
                      <span className="text-slate-500 dark:text-slate-400">#1 Alliance Votes</span>
                      <span className="font-mono-num font-extrabold text-lg text-slate-900 dark:text-white">
                        {al.leadingVotes} <span className="text-[11px] font-normal text-slate-500">voters</span>
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${Math.max(al.leadingShare, al.leadingVotes > 0 ? 6 : 0)}%`,
                          backgroundColor: al.color,
                        }}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-1.5 pt-1 text-[11px]">
                    <div className="rounded-xl bg-white dark:bg-slate-900/80 p-2 text-center border border-slate-100 dark:border-slate-800">
                      <div className="font-mono-num font-bold text-slate-900 dark:text-white">
                        {al.candidateVotes}
                      </div>
                      <div className="text-[10px] text-slate-500">Seat Votes</div>
                    </div>
                    <div className="rounded-xl bg-white dark:bg-slate-900/80 p-2 text-center border border-slate-100 dark:border-slate-800">
                      <div className="font-mono-num font-bold text-slate-900 dark:text-white">
                        {al.avgSeats}
                      </div>
                      <div className="text-[10px] text-slate-500">Avg Seats</div>
                    </div>
                    <div className="rounded-xl bg-white dark:bg-slate-900/80 p-2 text-center border border-slate-100 dark:border-slate-800">
                      <div className="font-mono-num font-bold text-emerald-600 dark:text-emerald-400">
                        {al.majorityVotes}
                      </div>
                      <div className="text-[10px] text-slate-500">202+ Picks</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 2. Party Vote Tally Table */}
          <div className="rounded-3xl bg-white dark:bg-[#0F1B35] border border-slate-200 dark:border-slate-800 p-5 sm:p-6 space-y-4 up-md3-elev-1">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="font-display font-bold text-base sm:text-lg text-slate-900 dark:text-white flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-blue-600 dark:text-cyan-400" />
                  Party Vote Tally — Votes &amp; Candidate Choices by Party
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Ranked by #1 party predictions, users choosing &gt;0 seats, average predicted seats, and total candidate seat votes
                </p>
              </div>
              <span className="px-3 py-1 rounded-xl bg-slate-100 dark:bg-slate-900 text-xs font-mono-num font-bold text-slate-700 dark:text-slate-200">
                {voteAnalytics.totalPartyForecasters} Party Voters
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] uppercase tracking-wider text-slate-500">
                    <th className="py-2.5 pr-3">Party</th>
                    <th className="py-2.5 px-3">Alliance</th>
                    <th className="py-2.5 px-3 text-right">#1 Party Votes</th>
                    <th className="py-2.5 px-3 text-right">Chosen By Voters</th>
                    <th className="py-2.5 px-3 text-right">Avg Seats</th>
                    <th className="py-2.5 pl-3 text-right">Candidate Votes (403 ACs)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                  {voteAnalytics.partyTally.map((p) => (
                    <tr
                      key={p.code}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-900/40 transition-colors"
                    >
                      <td className="py-2.5 pr-3">
                        <div className="flex items-center gap-2">
                          <span
                            className="w-3 h-3 rounded-full shrink-0"
                            style={{ backgroundColor: p.color }}
                          />
                          <div>
                            <div className="font-bold text-slate-900 dark:text-white">{p.code}</div>
                            <div className="text-[11px] text-slate-500 truncate max-w-[180px]">
                              {p.name}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 font-semibold text-[11px] text-slate-700 dark:text-slate-300">
                          {p.alliance}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono-num">
                        <span className="font-extrabold text-slate-900 dark:text-white">
                          {p.leadingVotes}
                        </span>{' '}
                        <span className="text-slate-500">({p.leadingShare}%)</span>
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono-num font-semibold text-slate-700 dark:text-slate-200">
                        {p.selectedUsers}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono-num font-semibold text-slate-700 dark:text-slate-200">
                        {p.avgSeats}
                      </td>
                      <td className="py-2.5 pl-3 text-right font-mono-num">
                        <span className="font-extrabold text-blue-700 dark:text-cyan-300">
                          {p.candidateVotes}
                        </span>{' '}
                        <span className="text-slate-500">({p.candidateShare}%)</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* 3. Top Voted Candidates Quick Preview */}
          <div className="rounded-3xl bg-white dark:bg-[#0F1B35] border border-slate-200 dark:border-slate-800 p-5 sm:p-6 space-y-3 up-md3-elev-1">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="font-display font-bold text-base sm:text-lg text-slate-900 dark:text-white flex items-center gap-2">
                  <Vote className="w-4 h-4 text-emerald-600" />
                  Top Voted Candidates ({voteAnalytics.uniqueCandidatesVoted} Candidates Chosen)
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Most popular candidate picks across UP&apos;s 403 constituencies
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSection('candidateVotes')}
                className="px-3.5 py-2 rounded-xl bg-[#0A1633] hover:bg-[#10255A] text-white text-xs font-bold cursor-pointer"
              >
                View All Candidate Votes →
              </button>
            </div>

            {voteAnalytics.candidateLeaderboard.length === 0 ? (
              <p className="text-xs text-slate-500 dark:text-slate-400 py-3">
                No constituency candidate votes cast by users yet.
              </p>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {voteAnalytics.candidateLeaderboard.slice(0, 10).map((c) => (
                  <div
                    key={c.key}
                    className="py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs"
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-slate-900 dark:text-white">
                          {c.candidateName}
                        </span>
                        <span
                          className="px-2 py-0.5 rounded-md text-[10px] font-bold text-white"
                          style={{ backgroundColor: getPartyColor(c.party) }}
                        >
                          {c.party}
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[10px] font-semibold text-slate-600 dark:text-slate-300">
                          {c.alliance}
                        </span>
                        {c.isLeadingInSeat && (
                          <span className="px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold">
                            Leading AC #{c.acNo}
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        AC #{c.acNo} · {c.constituencyName} ({c.district})
                      </div>
                    </div>
                    <div className="text-right shrink-0 font-mono-num">
                      <div className="font-extrabold text-sm text-slate-900 dark:text-white">
                        {c.votes} {c.votes === 1 ? 'vote' : 'votes'}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {c.voteSharePercent}% of {c.seatTotalVotes} in AC
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {section === 'candidateVotes' && (
        <div className="space-y-4">
          {/* Header, Mode Toggle, Search & Export */}
          <div className="rounded-3xl bg-white dark:bg-[#0F1B35] border border-slate-200 dark:border-slate-800 p-4 sm:p-5 space-y-3.5 up-md3-elev-1">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="font-display font-bold text-base sm:text-lg text-slate-900 dark:text-white flex items-center gap-2">
                  <Vote className="w-4 h-4 text-[#FF9933]" />
                  Candidate &amp; Constituency Vote Tally
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {voteAnalytics.totalCandidateVotesCast} total candidate votes across{' '}
                  {voteAnalytics.votedConstituenciesCount} seats ·{' '}
                  {voteAnalytics.uniqueCandidatesVoted} unique candidates chosen
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <div className="inline-flex rounded-xl bg-slate-100 dark:bg-slate-900 p-1">
                  <button
                    type="button"
                    onClick={() => setCandVoteViewMode('candidates')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${
                      candVoteViewMode === 'candidates'
                        ? 'bg-[#1D4ED8] text-white'
                        : 'text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    By Candidate
                  </button>
                  <button
                    type="button"
                    onClick={() => setCandVoteViewMode('seats')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${
                      candVoteViewMode === 'seats'
                        ? 'bg-[#1D4ED8] text-white'
                        : 'text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    Seat-by-Seat (403 ACs)
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleExportCandidateVotesCsv}
                  disabled={filteredCandidateVotes.length === 0}
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#0A1633] hover:bg-[#10255A] disabled:opacity-40 text-white text-xs font-bold cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-[#F59E0B]" />
                  Export Votes CSV
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
              <div className="lg:col-span-2 relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={candVoteSearch}
                  onChange={(e) => setCandVoteSearch(e.target.value)}
                  placeholder="Search candidate, AC#, constituency, district, party..."
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs"
                />
              </div>

              <select
                value={candVoteAlliance}
                onChange={(e) => setCandVoteAlliance(e.target.value)}
                aria-label="Filter candidate votes by alliance"
                className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs font-medium"
              >
                <option value="ALL">All Alliances</option>
                {UP_ALLIANCES.map((a) => (
                  <option key={a.code} value={a.code}>
                    Alliance: {a.shortEn}
                  </option>
                ))}
              </select>

              <select
                value={candVoteParty}
                onChange={(e) => setCandVoteParty(e.target.value)}
                aria-label="Filter candidate votes by party"
                className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs font-medium"
              >
                <option value="ALL">All Parties</option>
                {parties.map((p) => (
                  <option key={p.code} value={p.code}>
                    Party: {p.code}
                  </option>
                ))}
              </select>

              <label className="flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs font-semibold cursor-pointer">
                <input
                  type="checkbox"
                  checked={candVoteLeadingOnly}
                  onChange={(e) => setCandVoteLeadingOnly(e.target.checked)}
                  disabled={candVoteViewMode === 'seats'}
                  className="w-4 h-4"
                />
                <span>Seat Leaders Only</span>
              </label>
            </div>
          </div>

          {candVoteViewMode === 'candidates' ? (
            <div className="rounded-3xl bg-white dark:bg-[#0F1B35] border border-slate-200 dark:border-slate-800 p-4 sm:p-5 up-md3-elev-1">
              {filteredCandidateVotes.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-6">
                  No candidate votes match your filters yet.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] uppercase tracking-wider text-slate-500">
                        <th className="py-2.5 pr-3">Candidate</th>
                        <th className="py-2.5 px-3">Constituency (AC #)</th>
                        <th className="py-2.5 px-3">Party / Alliance</th>
                        <th className="py-2.5 px-3 text-right">Votes Secured</th>
                        <th className="py-2.5 pl-3 text-right">AC Share</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                      {filteredCandidateVotes.map((c) => (
                        <tr
                          key={c.key}
                          className="hover:bg-slate-50/70 dark:hover:bg-slate-900/40"
                        >
                          <td className="py-2.5 pr-3">
                            <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                              <span>{c.candidateName}</span>
                              {c.isLeadingInSeat && (
                                <span className="px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold">
                                  #1
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-500 truncate max-w-[220px]">
                              Voters: {c.voters.slice(0, 4).join(', ')}
                              {c.voters.length > 4 ? ` +${c.voters.length - 4}` : ''}
                            </div>
                          </td>
                          <td className="py-2.5 px-3">
                            <div className="font-semibold text-slate-800 dark:text-slate-100">
                              AC #{c.acNo} · {c.constituencyName}
                            </div>
                            <div className="text-[11px] text-slate-500">{c.district}</div>
                          </td>
                          <td className="py-2.5 px-3">
                            <div className="flex items-center gap-1.5">
                              <span
                                className="px-2 py-0.5 rounded-md text-[10px] font-bold text-white"
                                style={{ backgroundColor: getPartyColor(c.party) }}
                              >
                                {c.party}
                              </span>
                              <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[10px] font-semibold text-slate-600 dark:text-slate-300">
                                {c.alliance}
                              </span>
                            </div>
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono-num">
                            <span className="font-extrabold text-sm text-slate-900 dark:text-white">
                              {c.votes}
                            </span>
                            <span className="text-slate-500"> / {c.seatTotalVotes}</span>
                          </td>
                          <td className="py-2.5 pl-3 text-right font-mono-num font-bold text-blue-700 dark:text-cyan-300">
                            {c.voteSharePercent}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {filteredSeatVoteRows.length === 0 ? (
                <div className="md:col-span-2 rounded-3xl bg-white dark:bg-[#0F1B35] border border-slate-200 dark:border-slate-800 p-8 text-center text-xs text-slate-500">
                  No constituency seat votes match your filters yet.
                </div>
              ) : (
                filteredSeatVoteRows.map((seat) => (
                  <div
                    key={seat.acNo}
                    className="rounded-2xl bg-white dark:bg-[#0F1B35] border border-slate-200 dark:border-slate-800 p-4 space-y-2.5 up-md3-elev-1"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <div className="font-display font-bold text-sm text-slate-900 dark:text-white flex items-center gap-1.5 truncate">
                          <MapPin className="w-3.5 h-3.5 text-[#FF9933] shrink-0" />
                          <span>
                            AC #{seat.acNo} · {seat.constituencyName}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500">{seat.district}</div>
                      </div>
                      <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-[11px] font-mono-num font-bold shrink-0">
                        {seat.totalVotes} {seat.totalVotes === 1 ? 'vote' : 'votes'}
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      {seat.allCandidates.map((cand, idx) => (
                        <div
                          key={cand.key}
                          className="rounded-xl bg-slate-50 dark:bg-slate-900/60 px-3 py-2 flex items-center justify-between gap-2 text-xs"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span
                              className={`font-mono-num font-bold text-[11px] ${
                                idx === 0
                                  ? 'text-emerald-600 dark:text-emerald-400'
                                  : 'text-slate-400'
                              }`}
                            >
                              #{idx + 1}
                            </span>
                            <span className="font-bold text-slate-900 dark:text-white truncate">
                              {cand.candidateName}
                            </span>
                            <span
                              className="px-1.5 py-0.5 rounded text-[10px] font-bold text-white shrink-0"
                              style={{ backgroundColor: getPartyColor(cand.party) }}
                            >
                              {cand.party}
                            </span>
                          </div>
                          <span className="font-mono-num font-bold text-slate-800 dark:text-slate-100 shrink-0">
                            {cand.votes} ({cand.voteSharePercent}%)
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}

      {section === 'users' && (
        <div className="space-y-4">
          {/* Aggregate User Choices Summary */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {UP_ALLIANCES.map((alliance) => (
              <div
                key={alliance.code}
                className="rounded-2xl bg-white dark:bg-[#0F1B35] border border-slate-200 dark:border-slate-800 p-4"
              >
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-200">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: alliance.color }}
                    />
                    {alliance.shortEn} Leading
                  </span>
                  <GitMerge className="w-4 h-4 text-slate-400" />
                </div>
                <div className="font-mono-num font-extrabold text-2xl text-slate-900 dark:text-white mt-1.5">
                  {allianceConsensusCounts[alliance.code] || 0}
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">
                  users predict {alliance.shortEn} #1
                </div>
              </div>
            ))}
          </div>

          {/* Search, Filters & Export Bar */}
          <div className="rounded-3xl bg-white dark:bg-[#0F1B35] border border-slate-200 dark:border-slate-800 p-4 sm:p-5 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="font-display font-bold text-base sm:text-lg text-slate-900 dark:text-white">
                  All User Choices (Alliances, Parties &amp; Candidates)
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Real-time view joined from Firebase <code className="font-mono">/users</code> &amp;{' '}
                  <code className="font-mono">/user_predictions</code>
                </p>
              </div>
              <button
                type="button"
                onClick={handleExportUserChoicesCsv}
                disabled={filteredJoinedUsers.length === 0}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0A1633] hover:bg-[#10255A] disabled:opacity-40 text-white text-xs font-bold cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-[#F59E0B]" />
                Export All User Data (CSV)
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
              <div className="lg:col-span-2 relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  placeholder="Search user name, mobile, email, alias, UID, or candidate..."
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs"
                />
              </div>

              <select
                value={userAllianceFilter}
                onChange={(e) => setUserAllianceFilter(e.target.value)}
                aria-label="Filter by leading alliance"
                className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs font-medium"
              >
                <option value="ALL">All Leading Alliances</option>
                {UP_ALLIANCES.map((a) => (
                  <option key={a.code} value={a.code}>
                    Alliance: {a.shortEn}
                  </option>
                ))}
              </select>

              <select
                value={userPartyFilter}
                onChange={(e) => setUserPartyFilter(e.target.value)}
                aria-label="Filter by chosen party"
                className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs font-medium"
              >
                <option value="ALL">All Chosen Parties</option>
                {parties.map((p) => (
                  <option key={p.code} value={p.code}>
                    Party: {p.code}
                  </option>
                ))}
              </select>

              <select
                value={userStatusFilter}
                onChange={(e) => setUserStatusFilter(e.target.value as 'ALL' | 'SUBMITTED' | 'DRAFT')}
                aria-label="Filter by submission status"
                className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs font-medium"
              >
                <option value="ALL">All Forecasts (Submitted &amp; Draft)</option>
                <option value="SUBMITTED">Submitted Final Only</option>
                <option value="DRAFT">In-Progress Drafts Only</option>
              </select>
            </div>
          </div>

          {/* Per-User Detailed Cards */}
          {filteredJoinedUsers.length === 0 ? (
            <div className="rounded-3xl bg-white dark:bg-[#0F1B35] border border-slate-200 dark:border-slate-800 p-8 text-center text-xs text-slate-500">
              No matching user predictions found in Firestore.
            </div>
          ) : (
            <div className="space-y-3">
              {filteredJoinedUsers.map((u) => {
                const isExpanded = expandedUserId === u.uid;
                const filteredPicks = pickFilterInsideUser.trim()
                  ? u.picksList.filter((p) => {
                      const q = pickFilterInsideUser.trim().toLowerCase();
                      return (
                        p.candidateName.toLowerCase().includes(q) ||
                        p.constituencyName.toLowerCase().includes(q) ||
                        p.party.toLowerCase().includes(q) ||
                        p.alliance.toLowerCase().includes(q) ||
                        String(p.acNo) === q
                      );
                    })
                  : u.picksList;

                return (
                  <div
                    key={u.uid}
                    className="rounded-3xl bg-white dark:bg-[#0F1B35] border border-slate-200 dark:border-slate-800 overflow-hidden up-md3-elev-1"
                  >
                    <button
                      type="button"
                      onClick={() => {
                        setPickFilterInsideUser('');
                        setExpandedUserId(isExpanded ? null : u.uid);
                      }}
                      className="w-full p-4 sm:p-5 flex flex-wrap items-center justify-between gap-3 text-left hover:bg-slate-50/70 dark:hover:bg-slate-900/40 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {u.photoURL ? (
                          <img
                            src={u.photoURL}
                            alt={u.displayName}
                            referrerPolicy="no-referrer"
                            className="w-10 h-10 rounded-xl object-cover shrink-0 border border-slate-200 dark:border-slate-700"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-xl bg-blue-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                            {u.publicAlias.slice(0, 2).toUpperCase()}
                          </div>
                        )}
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-display font-bold text-sm text-slate-900 dark:text-white truncate">
                              {u.displayName}
                            </span>
                            <span className="text-xs text-slate-500 dark:text-slate-400">
                              (@{u.publicAlias})
                            </span>
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold ${
                                u.authProvider === 'phone'
                                  ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300'
                                  : 'bg-blue-100 dark:bg-blue-500/20 text-blue-800 dark:text-blue-300'
                              }`}
                            >
                              {u.authProvider === 'phone' && <Phone className="w-3 h-3" />}
                              {u.authProvider === 'phone' ? 'MOBILE OTP' : 'GOOGLE'}
                            </span>
                            {u.isSubmitted && (
                              <span className="px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 text-[10px] font-bold">
                                Submitted
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono-num truncate">
                            {u.phoneNumber || u.email || 'No contact'} · UID: {u.uid}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 shrink-0">
                        <span className="px-2.5 py-1 rounded-lg bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-300 text-[11px] font-bold font-mono-num">
                          Alliance: {u.leadingAlliance}
                        </span>
                        <span className="px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 text-[11px] font-bold font-mono-num">
                          Party: {u.leadingParty}
                        </span>
                        <span className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-[11px] font-bold font-mono-num">
                          Candidates: {u.completedCount}/403
                        </span>
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4 text-slate-400" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-slate-400" />
                        )}
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="border-t border-slate-100 dark:border-slate-800 p-4 sm:p-5 bg-slate-50/60 dark:bg-slate-900/40 space-y-5">
                        {!u.hasPredictionDoc && (
                          <div className="rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 p-3 text-xs text-amber-800 dark:text-amber-300">
                            This user has registered in Firebase <code className="font-mono">/users</code> but has not saved a prediction to <code className="font-mono">/user_predictions</code> yet.
                          </div>
                        )}

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                          {/* Chosen Alliances */}
                          <div className="rounded-2xl bg-white dark:bg-[#0F1B35] border border-slate-200 dark:border-slate-800 p-4 space-y-2.5">
                            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-500">
                              <span>Chosen Alliances</span>
                              <span className="font-mono-num text-slate-700 dark:text-slate-200">
                                {u.allianceAllocated} / 403 seats
                              </span>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              {u.allianceSummary.map((a) => (
                                <div
                                  key={a.code}
                                  className="rounded-xl border border-slate-200/80 dark:border-slate-800 p-2.5 flex items-center justify-between gap-2 text-xs"
                                >
                                  <span className="flex items-center gap-1.5 font-semibold truncate">
                                    <span
                                      className="w-2.5 h-2.5 rounded-full shrink-0"
                                      style={{ backgroundColor: a.color }}
                                    />
                                    <span className="truncate">{a.name}</span>
                                  </span>
                                  <span className="font-mono-num font-bold text-slate-800 dark:text-slate-100 shrink-0">
                                    {a.bandLabel} ({a.seats})
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Chosen Parties */}
                          <div className="rounded-2xl bg-white dark:bg-[#0F1B35] border border-slate-200 dark:border-slate-800 p-4 space-y-2.5">
                            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-500">
                              <span>Chosen Parties</span>
                              <span className="font-mono-num text-slate-700 dark:text-slate-200">
                                {u.totalAllocated} / 403 seats
                              </span>
                            </div>
                            {u.partySummary.length === 0 ? (
                              <p className="text-xs text-slate-500">No party seats allocated yet.</p>
                            ) : (
                              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                {u.partySummary.map((p) => (
                                  <div
                                    key={p.code}
                                    className="rounded-xl border border-slate-200/80 dark:border-slate-800 p-2 flex items-center justify-between gap-1 text-xs"
                                  >
                                    <span className="flex items-center gap-1.5 font-bold truncate">
                                      <span
                                        className="w-2 h-2 rounded-full shrink-0"
                                        style={{ backgroundColor: p.color }}
                                      />
                                      <span className="truncate">{p.code}</span>
                                    </span>
                                    <span className="font-mono-num text-[11px] font-semibold shrink-0">
                                      {p.bandLabel}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Chosen Candidates (Constituency Picks) */}
                        <div className="rounded-2xl bg-white dark:bg-[#0F1B35] border border-slate-200 dark:border-slate-800 p-4 space-y-3">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                              Chosen Candidates ({u.picksList.length} / 403 Seats)
                            </span>
                            {u.picksList.length > 0 && (
                              <input
                                type="text"
                                value={pickFilterInsideUser}
                                onChange={(e) => setPickFilterInsideUser(e.target.value)}
                                placeholder="Filter user's picks by AC#, seat, candidate, party..."
                                className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs w-full sm:w-72"
                              />
                            )}
                          </div>

                          {filteredPicks.length === 0 ? (
                            <p className="text-xs text-slate-500">
                              No constituency candidate picks recorded for this filter.
                            </p>
                          ) : (
                            <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                              {filteredPicks.map((pick) => (
                                <div
                                  key={pick.acNo}
                                  className="py-2 flex flex-wrap items-center justify-between gap-2 text-xs"
                                >
                                  <div className="min-w-0">
                                    <span className="font-mono-num font-bold text-slate-500 mr-2">
                                      AC #{pick.acNo}
                                    </span>
                                    <span className="font-semibold text-slate-900 dark:text-white">
                                      {pick.constituencyName}
                                    </span>
                                    <span className="text-slate-500 ml-1.5">
                                      ({pick.district})
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2 shrink-0">
                                    <span className="font-bold text-slate-900 dark:text-white">
                                      {pick.candidateName}
                                    </span>
                                    <span
                                      className="px-2 py-0.5 rounded-md text-[10px] font-bold text-white"
                                      style={{ backgroundColor: getPartyColor(pick.party) }}
                                    >
                                      {pick.party}
                                    </span>
                                    <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[10px] font-semibold text-slate-600 dark:text-slate-300">
                                      {pick.alliance}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {section === 'csv' && (
        <div className="rounded-3xl bg-white dark:bg-[#0F1B35] border border-slate-200 dark:border-slate-800 p-6 space-y-4">
          <h3 className="font-display font-bold text-lg text-slate-900 dark:text-white">
            Import uttar-pradesh-2022-seats.csv (403 Constituencies)
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            Automatically maps <code className="font-mono">ac_no</code>, <code className="font-mono">name</code>,{' '}
            <code className="font-mono">total_electors</code>, <code className="font-mono">winner_name</code>,{' '}
            <code className="font-mono">winner_party</code>, <code className="font-mono">winner_votes</code>, the unnamed
            runner-up column (<code className="font-mono">runner_up_name</code>), <code className="font-mono">runner_up_party</code>, and{' '}
            <code className="font-mono">runner_up_votes</code> directly to Firestore while preserving missing values.
          </p>

          <label className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-[#1D4ED8] hover:bg-blue-700 text-white text-xs font-bold cursor-pointer">
            <Upload className="w-4 h-4" />
            <span>{busy ? 'Importing to Firestore...' : 'Select uttar-pradesh-2022-seats.csv'}</span>
            <input
              type="file"
              accept=".csv,text/csv"
              disabled={busy}
              onChange={(e) => void handleSeatsFile(e)}
              className="hidden"
            />
          </label>
        </div>
      )}

      {section === 'candidates' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <form
            onSubmit={(e) => void handleAddCandidate(e)}
            className="lg:col-span-5 rounded-3xl bg-white dark:bg-[#0F1B35] border border-slate-200 dark:border-slate-800 p-5 space-y-3"
          >
            <h3 className="font-display font-bold text-base text-slate-900 dark:text-white">
              Add / Update 2027 Candidate
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  AC No. (1–403)
                </label>
                <input
                  type="number"
                  min={1}
                  max={403}
                  value={candAcNo}
                  onChange={(e) => setCandAcNo(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Party Code
                </label>
                <input
                  type="text"
                  value={candParty}
                  onChange={(e) => setCandParty(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                Candidate Full Name
              </label>
              <input
                type="text"
                required
                value={candName}
                onChange={(e) => setCandName(e.target.value)}
                placeholder="e.g. Candidate Name"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Status
                </label>
                <select
                  value={candStatus}
                  onChange={(e) => setCandStatus(e.target.value as CandidateStatus)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm"
                >
                  <option value="ANNOUNCED">ANNOUNCED</option>
                  <option value="OFFICIAL">OFFICIAL</option>
                  <option value="HISTORICAL">HISTORICAL</option>
                  <option value="WITHDRAWN">WITHDRAWN</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Source Reference
                </label>
                <input
                  type="text"
                  value={candSource}
                  onChange={(e) => setCandSource(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                type="submit"
                disabled={busy}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#1D4ED8] text-white text-xs font-bold cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Save Candidate
              </button>

              <label className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold cursor-pointer">
                <Upload className="w-4 h-4" />
                Bulk CSV Upload
                <input
                  type="file"
                  accept=".csv,text/csv"
                  onChange={(e) => void handleCandidatesFile(e)}
                  className="hidden"
                />
              </label>
            </div>
          </form>

          <div className="lg:col-span-7 rounded-3xl bg-white dark:bg-[#0F1B35] border border-slate-200 dark:border-slate-800 p-5 space-y-3">
            <h3 className="font-display font-bold text-base text-slate-900 dark:text-white">
              Managed 2027 Candidates ({candidates.length})
            </h3>
            {candidates.length === 0 ? (
              <p className="text-xs text-slate-500 dark:text-slate-400">
                No 2027 candidates added yet. Add manually or upload a bulk CSV.
              </p>
            ) : (
              <div className="max-h-96 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                {candidates.map((c) => (
                  <div key={c.id} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                    <div>
                      <div className="font-bold text-slate-900 dark:text-white">
                        AC #{c.acNo} · {c.name} ({c.party})
                      </div>
                      <div className="text-slate-500 dark:text-slate-400">
                        Status: {c.status} · Source: {c.source}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => void onDeleteCandidate(c.id)}
                      className="p-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg cursor-pointer"
                      aria-label="Delete candidate"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {section === 'parties' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <form
            onSubmit={(e) => void handleAddParty(e)}
            className="lg:col-span-5 rounded-3xl bg-white dark:bg-[#0F1B35] border border-slate-200 dark:border-slate-800 p-5 space-y-3"
          >
            <h3 className="font-display font-bold text-base text-slate-900 dark:text-white">
              Add Political Party
            </h3>
            <input
              type="text"
              required
              value={newPartyCode}
              onChange={(e) => setNewPartyCode(e.target.value)}
              placeholder="Party Code (e.g. SBSP)"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm"
            />
            <input
              type="text"
              required
              value={newPartyName}
              onChange={(e) => setNewPartyName(e.target.value)}
              placeholder="Full Party Name"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm"
            />
            <div className="flex items-center gap-3">
              <label className="text-xs font-semibold">Color:</label>
              <input
                type="color"
                value={newPartyColor}
                onChange={(e) => setNewPartyColor(e.target.value)}
                className="w-10 h-10 rounded-lg border-0 cursor-pointer"
              />
            </div>
            <button
              type="submit"
              disabled={busy}
              className="px-5 py-2.5 rounded-xl bg-[#1D4ED8] text-white text-xs font-bold cursor-pointer"
            >
              Add Party
            </button>
          </form>

          <div className="lg:col-span-7 rounded-3xl bg-white dark:bg-[#0F1B35] border border-slate-200 dark:border-slate-800 p-5 space-y-2.5">
            <h3 className="font-display font-bold text-base text-slate-900 dark:text-white">
              Configured Parties ({parties.length})
            </h3>
            {parties.map((p) => (
              <div
                key={p.code}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 text-xs"
              >
                <div className="flex items-center gap-2.5">
                  <span className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: p.color }} />
                  <div>
                    <div className="font-bold text-slate-900 dark:text-white">
                      {p.code} — {p.name}
                    </div>
                    <div className="text-slate-500 font-mono-num">
                      07: {p.results2007} · 12: {p.results2012} · 17: {p.results2017} · 22: {p.results2022}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => void onSaveParty({ ...p, active: !p.active })}
                  className={`px-3 py-1 rounded-lg font-semibold cursor-pointer ${
                    p.active
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {p.active ? 'Active' : 'Inactive'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {section === 'config' && (
        <form
          onSubmit={(e) => void handleSaveConfig(e)}
          className="rounded-3xl bg-white dark:bg-[#0F1B35] border border-slate-200 dark:border-slate-800 p-6 space-y-4 max-w-2xl"
        >
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-blue-600" />
            <h3 className="font-display font-bold text-lg text-slate-900 dark:text-white">
              Deadline &amp; Section 126 Legal Blackout Controls
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold mb-1">Counting Date (ISO)</label>
              <input
                type="text"
                value={cfgDraft.countingDateIso}
                onChange={(e) => setCfgDraft({ ...cfgDraft, countingDateIso: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm font-mono-num"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">
                Prediction Cutoff (7:00 AM IST ISO)
              </label>
              <input
                type="text"
                value={cfgDraft.deadlineIso}
                onChange={(e) => setCfgDraft({ ...cfgDraft, deadlineIso: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm font-mono-num"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-6 pt-1">
            <label className="flex items-center gap-2 text-sm font-semibold cursor-pointer">
              <input
                type="checkbox"
                checked={cfgDraft.isLocked}
                onChange={(e) => setCfgDraft({ ...cfgDraft, isLocked: e.target.checked })}
                className="w-4 h-4"
              />
              Lock All User Predictions
            </label>

            <label className="flex items-center gap-2 text-sm font-semibold cursor-pointer">
              <input
                type="checkbox"
                checked={cfgDraft.blackoutActive}
                onChange={(e) => setCfgDraft({ ...cfgDraft, blackoutActive: e.target.checked })}
                className="w-4 h-4"
              />
              Activate Section 126 Statutory Silence Banner
            </label>
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1">Blackout Notice Message</label>
            <textarea
              rows={2}
              value={cfgDraft.blackoutMessage}
              onChange={(e) => setCfgDraft({ ...cfgDraft, blackoutMessage: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs"
            />
          </div>

          <button
            type="submit"
            disabled={busy}
            className="px-6 py-2.5 rounded-xl bg-[#1D4ED8] text-white text-xs font-bold cursor-pointer"
          >
            Save Configuration
          </button>
        </form>
      )}

      {section === 'results' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <form
            onSubmit={(e) => void handleSaveResult(e)}
            className="lg:col-span-6 rounded-3xl bg-white dark:bg-[#0F1B35] border border-slate-200 dark:border-slate-800 p-5 space-y-3"
          >
            <h3 className="font-display font-bold text-base text-slate-900 dark:text-white">
              Verify Official ECI Result
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <input
                type="number"
                min={1}
                max={403}
                value={resAcNo}
                onChange={(e) => setResAcNo(Number(e.target.value))}
                placeholder="AC No."
                className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm"
              />
              <input
                type="text"
                value={resWinnerParty}
                onChange={(e) => setResWinnerParty(e.target.value)}
                placeholder="Winning Party"
                className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm"
              />
            </div>
            <input
              type="text"
              required
              value={resWinnerName}
              onChange={(e) => setResWinnerName(e.target.value)}
              placeholder="Official ECI Winning Candidate Name"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm"
            />
            <div className="grid grid-cols-2 gap-3">
              <input
                type="number"
                value={resVotes}
                onChange={(e) => setResVotes(Number(e.target.value))}
                placeholder="Winner Votes"
                className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm"
              />
              <input
                type="text"
                value={resSourceUrl}
                onChange={(e) => setResSourceUrl(e.target.value)}
                placeholder="ECI Source URL"
                className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm"
              />
            </div>
            <div className="flex flex-wrap gap-3 pt-1">
              <button
                type="submit"
                disabled={busy}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-bold cursor-pointer"
              >
                Save Verified ECI Result
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => void handleRecalc()}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#0A1633] text-white text-xs font-bold cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Recalculate Leaderboard
              </button>
            </div>
          </form>

          <div className="lg:col-span-6 rounded-3xl bg-white dark:bg-[#0F1B35] border border-slate-200 dark:border-slate-800 p-5 space-y-2.5">
            <h3 className="font-display font-bold text-base text-slate-900 dark:text-white">
              Declared ECI Results ({Object.keys(officialResults).length})
            </h3>
            {Object.keys(officialResults).length === 0 ? (
              <p className="text-xs text-slate-500">
                No official 2027 counting results recorded yet.
              </p>
            ) : (
              <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                {Object.values(officialResults).map((r) => (
                  <div key={r.acNo} className="py-2 text-xs flex justify-between">
                    <span>
                      <strong>AC #{r.acNo}</strong> · {r.winnerName} ({r.winnerParty})
                    </span>
                    <span className="font-mono-num">{r.winnerVotes.toLocaleString('en-IN')}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {section === 'audit' && (
        <div className="rounded-3xl bg-white dark:bg-[#0F1B35] border border-slate-200 dark:border-slate-800 p-5 space-y-3">
          <h3 className="font-display font-bold text-base text-slate-900 dark:text-white">
            Immutable Administrative Audit Logs ({auditLogs.length})
          </h3>
          {auditLogs.length === 0 ? (
            <p className="text-xs text-slate-500">No administrative actions recorded yet.</p>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-96 overflow-y-auto">
              {auditLogs.map((log) => (
                <div key={log.id} className="py-2.5 text-xs">
                  <div className="font-bold text-slate-900 dark:text-white">
                    {log.action} — {log.summary}
                  </div>
                  <div className="text-slate-500 font-mono-num">
                    Actor: {log.actorEmail || log.actorUid}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
