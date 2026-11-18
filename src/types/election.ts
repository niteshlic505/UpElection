export type AppTab = 'home' | 'parties' | 'alliances' | 'constituencies' | 'leaderboard' | 'admin';
export type AppLanguage = 'en' | 'hi';

export type ElectionYear = '2007' | '2012' | '2017' | '2022' | '2027';
export type HistoricalYear = '2007' | '2012' | '2017' | '2022';

export interface PartyConfig {
  code: string;
  name: string;
  shortName: string;
  color: string;
  active: boolean;
  order: number;
  results2007: number;
  results2012: number;
  results2017: number;
  results2022: number;
}

export interface AllianceConfig {
  code: string;
  shortEn: string;
  shortHi: string;
  nameEn: string;
  nameHi: string;
  formulaEn: string;
  formulaHi: string;
  partyCodes: string[];
  color: string;
  results2007: number;
  results2012: number;
  results2017: number;
  results2022: number;
}

export interface SeatBand {
  index: number;
  start: number;
  end: number;
  label: string;
  representative: number;
}

export interface HistoricalYearResult {
  winnerName: string;
  winnerParty: string;
  winnerVotes: number | null;
  runnerUpName: string;
  runnerUpParty: string;
  runnerUpVotes: number | null;
}

export interface ConstituencyRecord {
  acNo: number;
  name: string;
  district: string;
  category?: 'GEN' | 'SC' | 'ST';
  totalElectors: number | null;
  hist2022: HistoricalYearResult;
  hist2017: HistoricalYearResult;
  hist2012: HistoricalYearResult;
  hist2007: HistoricalYearResult;
}

export type CandidateStatus = 'HISTORICAL' | 'ANNOUNCED' | 'OFFICIAL' | 'WITHDRAWN';

export interface CandidateRecord {
  id: string;
  acNo: number;
  name: string;
  party: string;
  status: CandidateStatus;
  source: string;
  photoUrl?: string;
  updatedAt?: string;
}

export interface ConstituencyPick {
  acNo?: number;
  constituencyName?: string;
  district?: string;
  candidateName: string;
  party: string;
  alliance?: string;
  source: string;
  updatedAtMs: number;
}

export interface SelectedSeatSummary {
  bandStart: number;
  bandLabel: string;
  seats: number;
}

export interface UserPredictionData {
  uid: string;
  publicAlias?: string;
  membershipTier?: 'FREE' | 'PRO' | 'PREMIUM';
  partyBands: Record<string, number>;
  selectedPartySeats?: Record<string, SelectedSeatSummary>;
  leadingParty?: string;
  allianceBands?: Record<string, number>;
  selectedAllianceSeats?: Record<string, SelectedSeatSummary>;
  allianceAllocated?: number;
  leadingAlliance?: string;
  totalAllocated: number;
  constituencyPicks: Record<string, ConstituencyPick>;
  completedCount: number;
  completionPercent: number;
  isSubmitted: boolean;
  createdAt?: unknown;
  updatedAt?: unknown;
  lastSyncedAtMs?: number;
}

export interface UserProfileData {
  uid: string;
  displayName: string;
  publicAlias: string;
  email?: string;
  phoneNumber?: string;
  authProvider?: 'google' | 'phone';
  photoURL?: string;
  leaderboardOptIn: boolean;
  consentAccepted: boolean;
  isPro?: boolean;
  membershipTier?: 'FREE' | 'PRO' | 'PREMIUM';
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface LeaderboardEntry {
  uid: string;
  publicAlias: string;
  optIn: boolean;
  membershipTier?: 'PRO' | 'PREMIUM';
  completionPercent: number;
  completedSeats: number;
  partyAllocated: number;
  civicScore: number;
  officialPoints: number;
  correctConstituencies: number;
  correctPartyBands: number;
  updatedAt?: unknown;
}

export interface ElectionConfigData {
  countingDateIso: string;
  deadlineIso: string;
  timezone: string;
  isLocked: boolean;
  blackoutActive: boolean;
  blackoutMessage: string;
  updatedAt?: unknown;
}

export interface OfficialResultRecord {
  acNo: number;
  winnerName: string;
  winnerParty: string;
  winnerVotes: number;
  declared: boolean;
  sourceUrl: string;
  verifiedAt?: unknown;
}

export interface AuditLogRecord {
  id: string;
  actorUid: string;
  actorEmail?: string;
  action: string;
  summary: string;
  createdAt?: unknown;
}
