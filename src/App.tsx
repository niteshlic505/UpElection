import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, MotionConfig, motion } from 'motion/react';
import {
  User,
  deleteUser,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
} from 'firebase/auth';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import {
  ArrowLeft,
  GitMerge,
  Home,
  Info,
  Languages,
  MapPin,
  PieChart,
  Shield,
  Smartphone,
  Trophy,
  User as UserIcon,
} from 'lucide-react';
import {
  BOOTSTRAPPED_ADMIN_EMAIL,
  OperationType,
  auth,
  db,
  googleProvider,
  handleFirestoreError,
  handleRealtimeListenerError,
  isOfflineFirestoreError,
  testConnection,
} from './firebase';
import {
  AppLanguage,
  AppTab,
  AuditLogRecord,
  CandidateRecord,
  ConstituencyPick,
  ConstituencyRecord,
  ElectionConfigData,
  LeaderboardEntry,
  OfficialResultRecord,
  PartyConfig,
  SelectedSeatSummary,
  UserPredictionData,
  UserProfileData,
} from './types/election';
import { TRANSLATIONS } from './i18n/translations';
import {
  DEFAULT_PARTIES,
  DEFAULT_PARTY_BANDS,
  TOTAL_UP_SEATS,
  calculateAllocatedSeats,
  getBandByStart,
  getBandDisplaySeats,
} from './data/upParties';
import {
  DEFAULT_ALLIANCE_BANDS,
  UP_ALLIANCES,
  calculateAllianceAllocatedSeats,
  getAllianceCodeForParty,
} from './data/upAlliances';
import { UP_403_CONSTITUENCIES } from './data/upConstituencies403';
import { parseSeatsCsv } from './utils/csvParser';
import { HomeTab } from './components/HomeTab';
import { PartyPredictionTab } from './components/PartyPredictionTab';
import { AlliancePredictionTab } from './components/AlliancePredictionTab';
import { ConstituenciesTab } from './components/ConstituenciesTab';
import { LeaderboardSummaryTab } from './components/LeaderboardSummaryTab';
import { AdminDashboard } from './components/AdminDashboard';
import { AuthModal } from './components/AuthModal';
import { LegalComplianceModal, ProfileModal } from './components/ProfileAndLegalModals';

const LOCAL_DRAFT_KEY = 'up_mandate_draft_v1';
const THEME_KEY = 'up_mandate_theme';
const LANG_KEY = 'up_mandate_lang';

const DEFAULT_ELECTION_CONFIG: ElectionConfigData = {
  countingDateIso: '2027-03-11',
  deadlineIso: '2027-03-11T07:00:00+05:30',
  timezone: 'Asia/Kolkata',
  isLocked: false,
  blackoutActive: false,
  blackoutMessage:
    'Statutory Section 126 election silence period is active. Public forecasts are paused.',
};

function isLegacyPrefilledPartyBands(bands?: Record<string, number>): boolean {
  if (!bands) return false;
  return (
    bands.BJP === 160 &&
    bands.SP === 140 &&
    bands.BSP === 20 &&
    bands.INC === 20 &&
    bands.RLD === 20 &&
    (bands.AD ?? 0) === 0 &&
    (bands.NISHAD ?? 0) === 0 &&
    (bands.SBSP ?? 0) === 0 &&
    (bands.AIMIM ?? 0) === 0 &&
    (bands.ASP ?? 0) === 0 &&
    (bands.JANSATTA ?? 0) === 0 &&
    (bands.OTH ?? 0) === 0
  );
}

function isLegacyPrefilledAllianceBands(bands?: Record<string, number>): boolean {
  if (!bands) return false;
  return (
    bands.NDA === 180 &&
    bands.INDIA === 160 &&
    (bands.THIRD_FRONT ?? 0) === 0 &&
    bands.OTH_IND === 20
  );
}

function buildInitialPrediction(uid = 'guest'): UserPredictionData {
  try {
    const raw = localStorage.getItem(LOCAL_DRAFT_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<UserPredictionData>;
      const constituencyPicks = parsed.constituencyPicks || {};
      const completedCount = Object.keys(constituencyPicks).length;
      const isSubmitted = Boolean(parsed.isSubmitted);
      const rawPartyBands =
        !isSubmitted && completedCount === 0 && isLegacyPrefilledPartyBands(parsed.partyBands)
          ? {}
          : parsed.partyBands || {};
      const rawAllianceBands =
        !isSubmitted && completedCount === 0 && isLegacyPrefilledAllianceBands(parsed.allianceBands)
          ? {}
          : parsed.allianceBands || {};
      const partyBands = { ...DEFAULT_PARTY_BANDS, ...rawPartyBands };
      const allianceBands = { ...DEFAULT_ALLIANCE_BANDS, ...rawAllianceBands };
      return {
        uid,
        partyBands,
        allianceBands,
        totalAllocated: calculateAllocatedSeats(partyBands, DEFAULT_PARTIES),
        constituencyPicks,
        completedCount,
        completionPercent: Math.round((completedCount / TOTAL_UP_SEATS) * 100),
        isSubmitted,
        lastSyncedAtMs: parsed.lastSyncedAtMs,
      };
    }
  } catch {
    // ignore invalid local cache
  }
  return {
    uid,
    partyBands: { ...DEFAULT_PARTY_BANDS },
    allianceBands: { ...DEFAULT_ALLIANCE_BANDS },
    totalAllocated: calculateAllocatedSeats(DEFAULT_PARTY_BANDS, DEFAULT_PARTIES),
    constituencyPicks: {},
    completedCount: 0,
    completionPercent: 0,
    isSubmitted: false,
  };
}

function isStrictGoogleAdmin(user: User | null): boolean {
  if (!user || !user.emailVerified) return false;
  const targetEmail = BOOTSTRAPPED_ADMIN_EMAIL.toLowerCase().trim();
  const userEmail = user.email?.toLowerCase().trim();
  if (userEmail !== targetEmail) return false;
  return user.providerData.some(
    (provider) =>
      provider.providerId === 'google.com' &&
      (!provider.email || provider.email.toLowerCase().trim() === targetEmail),
  );
}

function formatCountdown(deadlineIso: string): string {
  const target = new Date(deadlineIso).getTime();
  const diff = target - Date.now();
  if (!Number.isFinite(target) || diff <= 0) return '0d 0h';
  const totalHours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(totalHours / 24);
  const hours = totalHours % 24;
  if (days > 0) return `${days}d ${hours}h`;
  const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  return `${hours}h ${mins}m`;
}

export default function App() {
  const [activeTab, setActiveTab] = useState<AppTab>('home');
  const [summarySubView, setSummarySubView] = useState<'leaderboard' | 'summary'>('leaderboard');

  const [darkMode, setDarkMode] = useState<boolean>(() => {
    try {
      return localStorage.getItem(THEME_KEY) === 'dark';
    } catch {
      return false;
    }
  });

  const [language, setLanguage] = useState<AppLanguage>(() => {
    try {
      return localStorage.getItem(LANG_KEY) === 'hi' ? 'hi' : 'en';
    } catch {
      return 'en';
    }
  });

  const [authReady, setAuthReady] = useState(false);
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfileData | null>(null);
  const [isAdminUser, setIsAdminUser] = useState(false);

  const [prediction, setPrediction] = useState<UserPredictionData>(() => buildInitialPrediction());
  const [parties, setParties] = useState<PartyConfig[]>(DEFAULT_PARTIES);
  const [constituencyOverrides, setConstituencyOverrides] = useState<
    Record<number, Partial<ConstituencyRecord>>
  >({});
  const [candidates, setCandidates] = useState<CandidateRecord[]>([]);
  const [officialResults, setOfficialResults] = useState<Record<number, OfficialResultRecord>>({});
  const [electionConfig, setElectionConfig] = useState<ElectionConfigData>(DEFAULT_ELECTION_CONFIG);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogRecord[]>([]);
  const [allUsers, setAllUsers] = useState<UserProfileData[]>([]);
  const [allUserPredictions, setAllUserPredictions] = useState<UserPredictionData[]>([]);
  const autoSyncTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [isSaving, setIsSaving] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [legalModalOpen, setLegalModalOpen] = useState(false);
  const [countdownText, setCountdownText] = useState(() =>
    formatCountdown(DEFAULT_ELECTION_CONFIG.deadlineIso),
  );

  // Sync dark mode class on <html>
  useEffect(() => {
    const root = document.documentElement;
    if (darkMode) root.classList.add('dark');
    else root.classList.remove('dark');
    try {
      localStorage.setItem(THEME_KEY, darkMode ? 'dark' : 'light');
    } catch {
      // ignore
    }
  }, [darkMode]);

  // Sync language preference on <html> and localStorage
  useEffect(() => {
    document.documentElement.lang = language;
    try {
      localStorage.setItem(LANG_KEY, language);
    } catch {
      // ignore
    }
  }, [language]);

  // Countdown tick
  useEffect(() => {
    setCountdownText(formatCountdown(electionConfig.deadlineIso));
    const id = setInterval(() => {
      setCountdownText(formatCountdown(electionConfig.deadlineIso));
    }, 30000);
    return () => clearInterval(id);
  }, [electionConfig.deadlineIso]);

  // Startup connection validation
  useEffect(() => {
    void testConnection();
  }, []);

  // Auth listener
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      setAuthReady(true);

      if (!user) {
        setUserProfile(null);
        setIsAdminUser(false);
        return;
      }

      const strictAdmin = isStrictGoogleAdmin(user);
      setIsAdminUser(strictAdmin);

      try {
        // Load or initialize /users/{uid}
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);

        const isPhoneOnly =
          Boolean(user.phoneNumber) &&
          !user.email &&
          user.providerData.some((p) => p.providerId === 'phone');
        const authProvider: 'google' | 'phone' = isPhoneOnly ? 'phone' : 'google';
        const phoneSuffix = user.phoneNumber ? user.phoneNumber.slice(-4) : '';
        const rawFallbackName =
          user.displayName || (phoneSuffix ? `UP Citizen ${phoneSuffix}` : 'UP Citizen');
        const defaultAlias = (
          user.displayName || (phoneSuffix ? `UP_${phoneSuffix}` : 'UP Forecaster')
        ).slice(0, 40);

        if (!userSnap.exists()) {
          const newProfile: Record<string, unknown> = {
            uid: user.uid,
            displayName: rawFallbackName.slice(0, 80),
            publicAlias: defaultAlias.length >= 2 ? defaultAlias : 'UP Citizen',
            authProvider,
            membershipTier: 'FREE',
            isPro: false,
            leaderboardOptIn: true,
            consentAccepted: true,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          };
          if (user.email) newProfile.email = user.email.slice(0, 160);
          if (user.phoneNumber) newProfile.phoneNumber = user.phoneNumber.slice(0, 24);
          if (user.photoURL) newProfile.photoURL = user.photoURL.slice(0, 500);

          await setDoc(userRef, newProfile);
          setUserProfile({
            uid: user.uid,
            displayName: String(newProfile.displayName),
            publicAlias: String(newProfile.publicAlias),
            email: user.email || undefined,
            phoneNumber: user.phoneNumber || undefined,
            authProvider,
            membershipTier: 'FREE',
            photoURL: user.photoURL || undefined,
            leaderboardOptIn: true,
            consentAccepted: true,
          });
        } else {
          const data = userSnap.data() as UserProfileData;
          setUserProfile({
            ...data,
            phoneNumber: data.phoneNumber || user.phoneNumber || undefined,
            authProvider: data.authProvider || authProvider,
          });
        }
      } catch (err) {
        if (isOfflineFirestoreError(err)) {
          const phoneSuffix = user.phoneNumber ? user.phoneNumber.slice(-4) : '';
          const fallbackAlias = (
            user.displayName || (phoneSuffix ? `UP_${phoneSuffix}` : 'UP Citizen')
          ).slice(0, 40);
          setUserProfile({
            uid: user.uid,
            displayName: (user.displayName || 'Citizen').slice(0, 80),
            publicAlias: fallbackAlias.length >= 2 ? fallbackAlias : 'UP Citizen',
            email: user.email || undefined,
            phoneNumber: user.phoneNumber || undefined,
            authProvider: user.phoneNumber && !user.email ? 'phone' : 'google',
            membershipTier: 'FREE',
            photoURL: user.photoURL || undefined,
            leaderboardOptIn: true,
            consentAccepted: true,
          });
        } else {
          handleFirestoreError(err, OperationType.GET, `users/${user.uid}`);
        }
      }
    });

    return () => unsub();
  }, []);

  // Firestore real-time listeners (strictly gated on authReady && firebaseUser)
  useEffect(() => {
    if (!authReady || !firebaseUser) return;
    const uid = firebaseUser.uid;

    // 1. User's own prediction document
    const predRef = doc(db, 'user_predictions', uid);
    const unsubPred = onSnapshot(
      predRef,
      (snap) => {
        if (snap.exists()) {
          const d = snap.data() as UserPredictionData;
          setPrediction({
            uid,
            partyBands: { ...DEFAULT_PARTY_BANDS, ...(d.partyBands || {}) },
            allianceBands: { ...DEFAULT_ALLIANCE_BANDS, ...(d.allianceBands || {}) },
            totalAllocated: d.totalAllocated ?? 0,
            constituencyPicks: d.constituencyPicks || {},
            completedCount: d.completedCount ?? 0,
            completionPercent: d.completionPercent ?? 0,
            isSubmitted: Boolean(d.isSubmitted),
            lastSyncedAtMs: Date.now(),
          });
        }
      },
      (error) => handleRealtimeListenerError(error, OperationType.GET, `user_predictions/${uid}`),
    );

    // 2. Public opted-in leaderboard
    const lbQuery = query(collection(db, 'leaderboard'), where('optIn', '==', true));
    const unsubLb = onSnapshot(
      lbQuery,
      (snap) => {
        const list = snap.docs.map((d) => d.data() as LeaderboardEntry);
        setLeaderboard(list);
      },
      (error) => handleRealtimeListenerError(error, OperationType.LIST, 'leaderboard'),
    );

    // 3. Election config
    const unsubCfg = onSnapshot(
      doc(db, 'election_config', 'global'),
      (snap) => {
        if (snap.exists()) {
          setElectionConfig(snap.data() as ElectionConfigData);
        }
      },
      (error) => handleRealtimeListenerError(error, OperationType.GET, 'election_config/global'),
    );

    // 4. Parties catalog (merge built-in UP parties with any Firestore Admin overrides)
    const unsubParties = onSnapshot(
      query(collection(db, 'parties'), orderBy('order', 'asc')),
      (snap) => {
        const mergedMap = new Map<string, PartyConfig>();
        DEFAULT_PARTIES.forEach((p) => mergedMap.set(p.code.toUpperCase(), p));
        snap.docs.forEach((d) => {
          const remote = d.data() as PartyConfig;
          const key = remote.code.toUpperCase();
          const fallback = mergedMap.get(key);
          mergedMap.set(key, {
            ...(fallback || {}),
            ...remote,
            shortName: remote.shortName || fallback?.shortName || remote.code,
          });
        });
        setParties(Array.from(mergedMap.values()).sort((a, b) => a.order - b.order));
      },
      (error) => handleRealtimeListenerError(error, OperationType.LIST, 'parties'),
    );

    // 5. Constituency CSV overrides
    const unsubConst = onSnapshot(
      collection(db, 'constituencies'),
      (snap) => {
        const map: Record<number, Partial<ConstituencyRecord>> = {};
        snap.docs.forEach((d) => {
          const raw = d.data();
          const acNo = Number(raw.acNo);
          if (acNo >= 1 && acNo <= 403) {
            map[acNo] = {
              name: raw.name,
              district: raw.district,
              totalElectors: raw.totalElectors ?? null,
              hist2022: {
                winnerName: raw.winnerName || '',
                winnerParty: raw.winnerParty || '',
                winnerVotes: raw.winnerVotes ?? null,
                runnerUpName: raw.runnerUpName || '',
                runnerUpParty: raw.runnerUpParty || '',
                runnerUpVotes: raw.runnerUpVotes ?? null,
              },
            };
          }
        });
        setConstituencyOverrides(map);
      },
      (error) => handleRealtimeListenerError(error, OperationType.LIST, 'constituencies'),
    );

    // 6. Managed 2027 candidates
    const unsubCands = onSnapshot(
      collection(db, 'candidates'),
      (snap) => {
        setCandidates(snap.docs.map((d) => d.data() as CandidateRecord));
      },
      (error) => handleRealtimeListenerError(error, OperationType.LIST, 'candidates'),
    );

    // 7. Official ECI results
    const unsubResults = onSnapshot(
      collection(db, 'official_results'),
      (snap) => {
        const map: Record<number, OfficialResultRecord> = {};
        snap.docs.forEach((d) => {
          const rec = d.data() as OfficialResultRecord;
          map[rec.acNo] = rec;
        });
        setOfficialResults(map);
      },
      (error) => handleRealtimeListenerError(error, OperationType.LIST, 'official_results'),
    );

    return () => {
      unsubPred();
      unsubLb();
      unsubCfg();
      unsubParties();
      unsubConst();
      unsubCands();
      unsubResults();
    };
  }, [authReady, firebaseUser]);

  // Admin real-time listeners: audit logs, all user profiles, and all user predictions
  useEffect(() => {
    if (!authReady || !firebaseUser || !isAdminUser || !isStrictGoogleAdmin(firebaseUser)) {
      setAuditLogs([]);
      setAllUsers([]);
      setAllUserPredictions([]);
      return;
    }
    const unsubLogs = onSnapshot(
      collection(db, 'audit_logs'),
      (snap) => {
        const list = snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<AuditLogRecord, 'id'>),
        }));
        setAuditLogs(list.reverse());
      },
      (error) => handleRealtimeListenerError(error, OperationType.LIST, 'audit_logs'),
    );
    const unsubUsers = onSnapshot(
      collection(db, 'users'),
      (snap) => {
        setAllUsers(snap.docs.map((d) => d.data() as UserProfileData));
      },
      (error) => handleRealtimeListenerError(error, OperationType.LIST, 'users'),
    );
    const unsubPreds = onSnapshot(
      collection(db, 'user_predictions'),
      (snap) => {
        setAllUserPredictions(snap.docs.map((d) => d.data() as UserPredictionData));
      },
      (error) => handleRealtimeListenerError(error, OperationType.LIST, 'user_predictions'),
    );
    return () => {
      unsubLogs();
      unsubUsers();
      unsubPreds();
    };
  }, [authReady, firebaseUser, isAdminUser]);

  // Merged 403 Constituencies (Built-in base + Firestore Admin CSV overrides)
  const constituencies: ConstituencyRecord[] = useMemo(() => {
    return UP_403_CONSTITUENCIES.map((base) => {
      const ov = constituencyOverrides[base.acNo];
      if (!ov) return base;
      return {
        ...base,
        name: ov.name || base.name,
        district: ov.district || base.district,
        totalElectors: ov.totalElectors ?? base.totalElectors,
        hist2022: ov.hist2022
          ? {
              winnerName: ov.hist2022.winnerName || base.hist2022.winnerName,
              winnerParty: ov.hist2022.winnerParty || base.hist2022.winnerParty,
              winnerVotes: ov.hist2022.winnerVotes ?? base.hist2022.winnerVotes,
              runnerUpName: ov.hist2022.runnerUpName || base.hist2022.runnerUpName,
              runnerUpParty: ov.hist2022.runnerUpParty || base.hist2022.runnerUpParty,
              runnerUpVotes: ov.hist2022.runnerUpVotes ?? base.hist2022.runnerUpVotes,
            }
          : base.hist2022,
      };
    });
  }, [constituencyOverrides]);

  // Derived civic points (non-monetary engagement score capped <= 1000)
  const civicPoints = useMemo(() => {
    const seatsCount = Object.keys(prediction.constituencyPicks).length;
    const allocated = calculateAllocatedSeats(prediction.partyBands, parties);
    const partyBonus = allocated === TOTAL_UP_SEATS ? 200 : allocated > 0 ? 100 : 0;
    const submitBonus = prediction.isSubmitted ? 50 : 0;
    return Math.min(1000, seatsCount * 2 + partyBonus + submitBonus);
  }, [prediction, parties]);

  // Persist helper (local cache + Firestore cloud sync)
  const persistPredictionToCloud = useCallback(
    async (nextPred: UserPredictionData) => {
      try {
        localStorage.setItem(LOCAL_DRAFT_KEY, JSON.stringify(nextPred));
      } catch {
        // ignore storage quota errors
      }

      if (!firebaseUser) return;

      setIsSaving(true);
      const uid = firebaseUser.uid;
      const predRef = doc(db, 'user_predictions', uid);
      const lbRef = doc(db, 'leaderboard', uid);

      const safeAllocated = Math.min(TOTAL_UP_SEATS, Math.max(0, Math.round(nextPred.totalAllocated)));
      const safeCompleted = Math.min(TOTAL_UP_SEATS, Math.max(0, nextPred.completedCount));
      const safePercent = Math.min(100, Math.max(0, Math.round((safeCompleted / TOTAL_UP_SEATS) * 100)));
      const safeCivicScore = Math.min(
        1000,
        safeCompleted * 2 + (safeAllocated === TOTAL_UP_SEATS ? 200 : safeAllocated > 0 ? 100 : 0) + (nextPred.isSubmitted ? 50 : 0),
      );

      try {
        const existingPred = await getDoc(predRef);
        const alliancePayload = nextPred.allianceBands || DEFAULT_ALLIANCE_BANDS;
        const safeAliasForPred = (
          userProfile?.publicAlias ||
          firebaseUser.displayName ||
          'UP Citizen'
        ).slice(0, 40);
        const finalAliasForPred = safeAliasForPred.length >= 1 ? safeAliasForPred : 'UP Citizen';
        const tierForPred = 'FREE' as const;

        const selectedPartySeats: Record<string, SelectedSeatSummary> = {};
        let leadingParty = 'NONE';
        let maxPartySeats = 0;
        Object.entries(nextPred.partyBands || {})
          .slice(0, 20)
          .forEach(([code, bandStart]) => {
            const band = getBandByStart(bandStart);
            const seats = getBandDisplaySeats(bandStart);
            selectedPartySeats[code] = {
              bandStart: band.start,
              bandLabel: band.label,
              seats,
            };
            if (seats > maxPartySeats) {
              maxPartySeats = seats;
              leadingParty = code;
            }
          });

        const selectedAllianceSeats: Record<string, SelectedSeatSummary> = {};
        let leadingAlliance = 'NONE';
        let maxAllianceSeats = 0;
        let allianceAllocatedRaw = 0;
        UP_ALLIANCES.forEach((alliance) => {
          const bandStart = alliancePayload[alliance.code] ?? 0;
          const band = getBandByStart(bandStart);
          const seats = getBandDisplaySeats(bandStart);
          allianceAllocatedRaw += seats;
          selectedAllianceSeats[alliance.code] = {
            bandStart: band.start,
            bandLabel: band.label,
            seats,
          };
          if (seats > maxAllianceSeats) {
            maxAllianceSeats = seats;
            leadingAlliance = alliance.code;
          }
        });
        const safeAllianceAllocated = Math.min(TOTAL_UP_SEATS, Math.max(0, allianceAllocatedRaw));

        const enrichedPicks: Record<string, ConstituencyPick> = {};
        Object.entries(nextPred.constituencyPicks || {}).forEach(([acKey, pick]) => {
          const acNum = Number(acKey);
          const acMeta = UP_403_CONSTITUENCIES.find((c) => c.acNo === acNum);
          enrichedPicks[acKey] = {
            ...pick,
            acNo: pick.acNo ?? (Number.isFinite(acNum) ? acNum : undefined),
            constituencyName: pick.constituencyName || acMeta?.name || `AC #${acKey}`,
            district: pick.district || acMeta?.district || 'Uttar Pradesh',
            alliance: pick.alliance || getAllianceCodeForParty(pick.party),
          };
        });

        const alignedPredFields = {
          publicAlias: finalAliasForPred,
          membershipTier: tierForPred,
          partyBands: nextPred.partyBands,
          selectedPartySeats,
          leadingParty,
          allianceBands: alliancePayload,
          selectedAllianceSeats,
          allianceAllocated: safeAllianceAllocated,
          leadingAlliance,
          totalAllocated: safeAllocated,
          constituencyPicks: enrichedPicks,
          completedCount: safeCompleted,
          completionPercent: safePercent,
          isSubmitted: nextPred.isSubmitted,
        };

        if (!existingPred.exists()) {
          await setDoc(predRef, {
            uid,
            ...alignedPredFields,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        } else {
          await updateDoc(predRef, {
            ...alignedPredFields,
            updatedAt: serverTimestamp(),
          });
        }

        const alias = (userProfile?.publicAlias || firebaseUser.displayName || 'UP Citizen').slice(0, 40);
        const safeAlias = alias.length >= 2 ? alias : 'UP Citizen';
        const existingLb = await getDoc(lbRef);
        if (!existingLb.exists()) {
          await setDoc(lbRef, {
            uid,
            publicAlias: safeAlias,
            optIn: userProfile?.leaderboardOptIn ?? true,
            completionPercent: safePercent,
            completedSeats: safeCompleted,
            partyAllocated: safeAllocated,
            civicScore: safeCivicScore,
            officialPoints: 0,
            correctConstituencies: 0,
            correctPartyBands: 0,
            updatedAt: serverTimestamp(),
          });
        } else {
          await updateDoc(lbRef, {
            publicAlias: safeAlias,
            optIn: userProfile?.leaderboardOptIn ?? true,
            completionPercent: safePercent,
            completedSeats: safeCompleted,
            partyAllocated: safeAllocated,
            civicScore: safeCivicScore,
            updatedAt: serverTimestamp(),
          });
        }
      } catch (err) {
        if (!isOfflineFirestoreError(err)) {
          handleFirestoreError(err, OperationType.WRITE, `user_predictions/${uid}`);
        }
      } finally {
        setIsSaving(false);
      }
    },
    [firebaseUser, userProfile],
  );

  const handleGoogleSignIn = async () => {
    setAuthError(null);
    try {
      const cred = await signInWithPopup(auth, googleProvider);
      if (cred.user) {
        setAuthModalOpen(false);
        // Check if cloud prediction already exists; if not, sync local draft up!
        const snap = await getDoc(doc(db, 'user_predictions', cred.user.uid));
        if (!snap.exists()) {
          await persistPredictionToCloud({ ...prediction, uid: cred.user.uid });
        }
      }
    } catch (err) {
      setAuthError(
        err instanceof Error ? err.message : 'Google Sign-In could not be completed.',
      );
      throw err;
    }
  };

  const handlePhoneVerified = async (uid: string, displayNameInput?: string) => {
    setAuthError(null);
    try {
      const currentUser = auth.currentUser;
      const cleanName = displayNameInput?.trim().slice(0, 80);
      const userRef = doc(db, 'users', uid);
      const userSnap = await getDoc(userRef);

      const phoneNumber = currentUser?.phoneNumber?.slice(0, 24);
      const phoneSuffix = phoneNumber ? phoneNumber.slice(-4) : '';
      const resolvedName =
        cleanName ||
        currentUser?.displayName ||
        (phoneSuffix ? `UP Citizen ${phoneSuffix}` : 'UP Citizen');
      const resolvedAlias = (
        cleanName ||
        currentUser?.displayName ||
        (phoneSuffix ? `UP_${phoneSuffix}` : 'UP Forecaster')
      ).slice(0, 40);

      if (!userSnap.exists()) {
        const newProfile: Record<string, unknown> = {
          uid,
          displayName: resolvedName,
          publicAlias: resolvedAlias.length >= 2 ? resolvedAlias : 'UP Citizen',
          authProvider: 'phone',
          membershipTier: 'FREE',
          isPro: false,
          leaderboardOptIn: true,
          consentAccepted: true,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        };
        if (phoneNumber) newProfile.phoneNumber = phoneNumber;
        await setDoc(userRef, newProfile);
        setUserProfile({
          uid,
          displayName: resolvedName,
          publicAlias: resolvedAlias.length >= 2 ? resolvedAlias : 'UP Citizen',
          phoneNumber,
          authProvider: 'phone',
          membershipTier: 'FREE',
          leaderboardOptIn: true,
          consentAccepted: true,
        });
      } else if (cleanName && cleanName.length >= 2) {
        await updateDoc(userRef, {
          displayName: cleanName,
          publicAlias: cleanName.slice(0, 40),
          updatedAt: serverTimestamp(),
        });
        setUserProfile((prev) =>
          prev
            ? {
                ...prev,
                displayName: cleanName,
                publicAlias: cleanName.slice(0, 40),
                phoneNumber: prev.phoneNumber || phoneNumber,
                authProvider: 'phone',
              }
            : prev,
        );
      }

      const predSnap = await getDoc(doc(db, 'user_predictions', uid));
      if (!predSnap.exists()) {
        await persistPredictionToCloud({ ...prediction, uid });
      }
    } catch (err) {
      if (!isOfflineFirestoreError(err)) {
        handleFirestoreError(err, OperationType.WRITE, `users/${uid}`);
      }
    }
  };

  const scheduleDebouncedCloudSync = useCallback(
    (nextPred: UserPredictionData, canSync: boolean) => {
      if (autoSyncTimerRef.current) {
        clearTimeout(autoSyncTimerRef.current);
      }
      if (!firebaseUser || electionConfig.isLocked || !canSync) return;
      autoSyncTimerRef.current = setTimeout(() => {
        void persistPredictionToCloud(nextPred);
      }, 1200);
    },
    [firebaseUser, electionConfig.isLocked, persistPredictionToCloud],
  );

  const handleUpdatePartyBands = async (
    nextBands: Record<string, number>,
    saveToCloud = false,
  ) => {
    const totalAllocated = calculateAllocatedSeats(nextBands, parties);
    const nextPred: UserPredictionData = {
      ...prediction,
      partyBands: nextBands,
      totalAllocated,
      lastSyncedAtMs: Date.now(),
    };
    setPrediction(nextPred);
    try {
      localStorage.setItem(LOCAL_DRAFT_KEY, JSON.stringify(nextPred));
    } catch {
      // ignore
    }
    if (saveToCloud && totalAllocated <= TOTAL_UP_SEATS) {
      if (autoSyncTimerRef.current) clearTimeout(autoSyncTimerRef.current);
      await persistPredictionToCloud(nextPred);
    } else {
      scheduleDebouncedCloudSync(nextPred, totalAllocated <= TOTAL_UP_SEATS);
    }
  };

  const handleUpdateAllianceBands = async (
    nextAllianceBands: Record<string, number>,
    saveToCloud = false,
  ) => {
    const allianceAllocated = calculateAllianceAllocatedSeats(nextAllianceBands);
    const nextPred: UserPredictionData = {
      ...prediction,
      allianceBands: nextAllianceBands,
      allianceAllocated,
      lastSyncedAtMs: Date.now(),
    };
    setPrediction(nextPred);
    try {
      localStorage.setItem(LOCAL_DRAFT_KEY, JSON.stringify(nextPred));
    } catch {
      // ignore
    }
    if (saveToCloud && allianceAllocated <= TOTAL_UP_SEATS) {
      if (autoSyncTimerRef.current) clearTimeout(autoSyncTimerRef.current);
      await persistPredictionToCloud(nextPred);
    } else {
      scheduleDebouncedCloudSync(nextPred, allianceAllocated <= TOTAL_UP_SEATS);
    }
  };

  const handleSelectCandidate = async (acNo: number, pick: ConstituencyPick) => {
    const seatMeta = constituencies.find((c) => c.acNo === acNo);
    const enrichedPick: ConstituencyPick = {
      ...pick,
      acNo,
      constituencyName: seatMeta?.name || `AC #${acNo}`,
      district: seatMeta?.district || 'Uttar Pradesh',
      alliance: getAllianceCodeForParty(pick.party),
    };
    const nextPicks = {
      ...prediction.constituencyPicks,
      [String(acNo)]: enrichedPick,
    };
    const completedCount = Object.keys(nextPicks).length;
    const nextPred: UserPredictionData = {
      ...prediction,
      constituencyPicks: nextPicks,
      completedCount,
      completionPercent: Math.round((completedCount / TOTAL_UP_SEATS) * 100),
      lastSyncedAtMs: Date.now(),
    };
    setPrediction(nextPred);
    await persistPredictionToCloud(nextPred);
  };

  const handleSubmitForecast = async () => {
    const nextPred: UserPredictionData = {
      ...prediction,
      isSubmitted: true,
      lastSyncedAtMs: Date.now(),
    };
    setPrediction(nextPred);
    await persistPredictionToCloud(nextPred);
  };

  const handleUpdateProfile = async (alias: string, leaderboardOptIn: boolean) => {
    if (!firebaseUser) return;
    const safeAlias = alias.slice(0, 40);
    try {
      await updateDoc(doc(db, 'users', firebaseUser.uid), {
        publicAlias: safeAlias,
        leaderboardOptIn,
        updatedAt: serverTimestamp(),
      });
      const lbRef = doc(db, 'leaderboard', firebaseUser.uid);
      const lbSnap = await getDoc(lbRef);
      if (lbSnap.exists()) {
        await updateDoc(lbRef, {
          publicAlias: safeAlias,
          optIn: leaderboardOptIn,
          updatedAt: serverTimestamp(),
        });
      }
      setUserProfile((prev) =>
        prev ? { ...prev, publicAlias: safeAlias, leaderboardOptIn } : prev,
      );
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${firebaseUser.uid}`);
    }
  };

  const handleDeleteAccountData = async () => {
    if (!firebaseUser) return;
    const uid = firebaseUser.uid;
    try {
      await deleteDoc(doc(db, 'user_predictions', uid));
      await deleteDoc(doc(db, 'leaderboard', uid));
      await deleteDoc(doc(db, 'users', uid));
      localStorage.removeItem(LOCAL_DRAFT_KEY);
      try {
        await deleteUser(firebaseUser);
      } catch {
        await signOut(auth);
      }
      setProfileModalOpen(false);
      setPrediction(buildInitialPrediction('guest'));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `users/${uid}`);
    }
  };

  const handleSignOut = async () => {
    setIsAdminUser(false);
    setActiveTab((prev) => (prev === 'admin' ? 'home' : prev));
    await signOut(auth);
    setProfileModalOpen(false);
  };

  // Admin handlers
  const logAdminAction = async (action: string, summary: string) => {
    if (!firebaseUser || !isStrictGoogleAdmin(firebaseUser)) return;
    const logId = `log_${Date.now()}`;
    await setDoc(doc(db, 'audit_logs', logId), {
      actorUid: firebaseUser.uid,
      actorEmail: firebaseUser.email || '',
      action: action.slice(0, 100),
      summary: summary.slice(0, 500),
      createdAt: serverTimestamp(),
    });
  };

  const handleImportSeatsCsv = async (csvText: string): Promise<number> => {
    const rows = parseSeatsCsv(csvText);
    if (rows.length === 0) return 0;

    // Firestore batches support up to 500 writes; split safely
    const chunkSize = 200;
    for (let i = 0; i < rows.length; i += chunkSize) {
      const batch = writeBatch(db);
      const slice = rows.slice(i, i + chunkSize);
      slice.forEach((row) => {
        const base = UP_403_CONSTITUENCIES.find((c) => c.acNo === row.acNo);
        const docData: Record<string, unknown> = {
          acNo: row.acNo,
          name: row.name.slice(0, 120),
          district: (row.district || base?.district || 'Uttar Pradesh').slice(0, 80),
          winnerName: row.winnerName.slice(0, 120),
          winnerParty: row.winnerParty.slice(0, 30),
          runnerUpName: row.runnerUpName.slice(0, 120),
          runnerUpParty: row.runnerUpParty.slice(0, 30),
          updatedAt: serverTimestamp(),
        };
        if (row.totalElectors !== null) docData.totalElectors = row.totalElectors;
        if (row.winnerVotes !== null) docData.winnerVotes = row.winnerVotes;
        if (row.runnerUpVotes !== null) docData.runnerUpVotes = row.runnerUpVotes;
        batch.set(doc(db, 'constituencies', String(row.acNo)), docData);
      });
      await batch.commit();
    }

    await logAdminAction('IMPORT_SEATS_CSV', `Imported ${rows.length} constituency rows from CSV`);
    return rows.length;
  };

  const handleSaveCandidate = async (cand: CandidateRecord) => {
    const docData: Record<string, unknown> = {
      id: cand.id,
      acNo: cand.acNo,
      name: cand.name.slice(0, 120),
      party: cand.party.slice(0, 30),
      status: cand.status,
      source: cand.source.slice(0, 200),
      updatedAt: serverTimestamp(),
    };
    if (cand.photoUrl) docData.photoUrl = cand.photoUrl.slice(0, 500);
    await setDoc(doc(db, 'candidates', cand.id), docData);
    await logAdminAction('SAVE_CANDIDATE', `Saved ${cand.name} (${cand.party}) for AC #${cand.acNo}`);
  };

  const handleImportCandidatesCsv = async (cands: CandidateRecord[]): Promise<number> => {
    const chunkSize = 200;
    for (let i = 0; i < cands.length; i += chunkSize) {
      const batch = writeBatch(db);
      cands.slice(i, i + chunkSize).forEach((cand) => {
        const docData: Record<string, unknown> = {
          id: cand.id,
          acNo: cand.acNo,
          name: cand.name.slice(0, 120),
          party: cand.party.slice(0, 30),
          status: cand.status,
          source: cand.source.slice(0, 200),
          updatedAt: serverTimestamp(),
        };
        if (cand.photoUrl) docData.photoUrl = cand.photoUrl.slice(0, 500);
        batch.set(doc(db, 'candidates', cand.id), docData);
      });
      await batch.commit();
    }
    await logAdminAction('IMPORT_CANDIDATES_CSV', `Bulk uploaded ${cands.length} 2027 candidates`);
    return cands.length;
  };

  const handleDeleteCandidate = async (id: string) => {
    await deleteDoc(doc(db, 'candidates', id));
    await logAdminAction('DELETE_CANDIDATE', `Removed candidate ${id}`);
  };

  const handleSaveParty = async (party: PartyConfig) => {
    await setDoc(doc(db, 'parties', party.code), {
      code: party.code.slice(0, 20),
      name: party.name.slice(0, 100),
      color: party.color.slice(0, 20),
      active: party.active,
      order: party.order,
      results2007: party.results2007,
      results2012: party.results2012,
      results2017: party.results2017,
      results2022: party.results2022,
      updatedAt: serverTimestamp(),
    });
    await logAdminAction('SAVE_PARTY', `Updated party ${party.code} (active=${party.active})`);
  };

  const handleSaveElectionConfig = async (cfg: ElectionConfigData) => {
    await setDoc(doc(db, 'election_config', 'global'), {
      countingDateIso: cfg.countingDateIso.slice(0, 60),
      deadlineIso: cfg.deadlineIso.slice(0, 60),
      timezone: cfg.timezone.slice(0, 40),
      isLocked: cfg.isLocked,
      blackoutActive: cfg.blackoutActive,
      blackoutMessage: cfg.blackoutMessage.slice(0, 500),
      updatedAt: serverTimestamp(),
    });
    await logAdminAction(
      'UPDATE_ELECTION_CONFIG',
      `Locked=${cfg.isLocked}, Blackout=${cfg.blackoutActive}, Deadline=${cfg.deadlineIso}`,
    );
  };

  const handleSaveOfficialResult = async (res: OfficialResultRecord) => {
    await setDoc(doc(db, 'official_results', String(res.acNo)), {
      acNo: res.acNo,
      winnerName: res.winnerName.slice(0, 120),
      winnerParty: res.winnerParty.slice(0, 30),
      winnerVotes: res.winnerVotes,
      declared: res.declared,
      sourceUrl: res.sourceUrl.slice(0, 500),
      verifiedAt: serverTimestamp(),
    });
    await logAdminAction('VERIFY_OFFICIAL_RESULT', `AC #${res.acNo}: ${res.winnerName} (${res.winnerParty})`);
  };

  const handleRecalculateLeaderboard = async (): Promise<number> => {
    const [predsSnap, lbSnap] = await Promise.all([
      getDocs(collection(db, 'user_predictions')),
      getDocs(collection(db, 'leaderboard')),
    ]);
    const lbIds = new Set(lbSnap.docs.map((d) => d.id));
    const officialList = Object.values(officialResults).filter((r) => r.declared);

    // Aggregate official seats won per party from declared ECI results
    const officialPartySeats: Record<string, number> = {};
    officialList.forEach((r) => {
      const code = r.winnerParty.toUpperCase();
      officialPartySeats[code] = (officialPartySeats[code] || 0) + 1;
    });

    let count = 0;
    const batch = writeBatch(db);
    predsSnap.docs.forEach((d) => {
      const p = d.data() as UserPredictionData;
      let correctConst = 0;
      officialList.forEach((res) => {
        const pick = p.constituencyPicks?.[String(res.acNo)];
        if (pick && pick.party.toUpperCase() === res.winnerParty.toUpperCase()) {
          correctConst++;
        }
      });

      let correctBands = 0;
      Object.entries(p.partyBands || {}).forEach(([partyCode, bandStart]) => {
        const band = getBandByStart(bandStart);
        const actual = officialPartySeats[partyCode.toUpperCase()] ?? 0;
        if (actual >= band.start && actual <= band.end) {
          correctBands++;
        }
      });

      const completionBonus = p.completedCount >= TOTAL_UP_SEATS ? 50 : 0;
      const officialPoints = correctConst * 10 + correctBands * 100 + completionBonus;

      if (lbIds.has(d.id)) {
        batch.update(doc(db, 'leaderboard', d.id), {
          officialPoints,
          correctConstituencies: correctConst,
          correctPartyBands: correctBands,
          updatedAt: serverTimestamp(),
        });
      }
      count++;
    });

    await batch.commit();
    await logAdminAction('RECALCULATE_LEADERBOARD', `Scored ${count} users against ${officialList.length} ECI results`);
    return count;
  };

  const userRankDisplay = useMemo(() => {
    if (!firebaseUser) return 'Top 10%';
    const sorted = [...leaderboard].sort((a, b) => b.civicScore - a.civicScore);
    const idx = sorted.findIndex((e) => e.uid === firebaseUser.uid);
    if (idx < 0 || sorted.length === 0) return 'Forecaster';
    return `Rank #${idx + 1}`;
  }, [firebaseUser, leaderboard]);

  const canAccessAdmin = isAdminUser && isStrictGoogleAdmin(firebaseUser);

  useEffect(() => {
    if (!canAccessAdmin && activeTab === 'admin') {
      setActiveTab('home');
    }
  }, [canAccessAdmin, activeTab]);

  const navigateTo = (tab: AppTab, subView?: 'leaderboard' | 'summary') => {
    if (tab === 'admin' && !canAccessAdmin) {
      setActiveTab('home');
      return;
    }
    if (subView) setSummarySubView(subView);
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const t = TRANSLATIONS[language];

  const headerTitle =
    activeTab === 'home'
      ? t.headers.home
      : activeTab === 'parties'
      ? t.headers.parties
      : activeTab === 'alliances'
      ? t.headers.alliances
      : activeTab === 'constituencies'
      ? t.headers.constituencies
      : activeTab === 'admin'
      ? t.headers.admin
      : t.headers.leaderboard;

  return (
    <MotionConfig reducedMotion="user">
    <div className="min-h-screen flex flex-col bg-[#FAF6EE] dark:bg-[#050B1A] up-desi-jaali text-slate-900 dark:text-slate-100 pb-20 md:pb-8">
      {/* Top Corporate Navy Material 3 App Bar with Saffron-White-Green Tiranga Accent */}
      <header className="sticky top-0 z-40 bg-gradient-to-r from-[#060E24]/95 via-[#0C1B44]/95 to-[#081330]/95 backdrop-blur-md text-white border-b border-cyan-400/15 shadow-[0_8px_30px_-10px_rgba(37,99,235,0.52)]">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 h-14 flex items-center justify-between gap-2 sm:gap-6">
          {/* Zone 1: Brand / Back */}
          <div className="flex items-center gap-2 min-w-0 shrink-0">
            {activeTab !== 'home' && (
              <button
                type="button"
                onClick={() => navigateTo('home')}
                aria-label="Back to Home"
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors cursor-pointer md:hidden"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}
            <button
              type="button"
              onClick={() => navigateTo('home')}
              className="flex items-center gap-2 cursor-pointer whitespace-nowrap shrink-0"
            >
              <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#FF9933] via-[#F59E0B] to-[#D97706] text-slate-950 font-display font-extrabold text-xs flex items-center justify-center shadow-sm ring-1 ring-amber-200/70">
                UP
              </span>
              <span className="font-display font-bold text-sm sm:text-lg tracking-tight flex items-center gap-1.5">
                {activeTab === 'home' ? (
                  <span>
                    UP <span className="text-[#FF9933]">Mandate</span>
                  </span>
                ) : (
                  <span className="md:hidden truncate max-w-[140px] inline-block align-bottom">{headerTitle}</span>
                )}
                {activeTab !== 'home' && (
                  <span className="hidden md:inline-flex items-center">
                    <span>
                      UP <span className="text-[#FF9933]">Mandate</span>
                    </span>
                  </span>
                )}
              </span>
            </button>
          </div>

          {/* Zone 2: Desktop Single-Line Nav Links */}
          <nav className="hidden md:flex items-center gap-5 lg:gap-6 text-sm font-medium text-blue-100/80">
            {[
              { id: 'home', label: t.nav.home },
              { id: 'parties', label: t.nav.parties },
              { id: 'alliances', label: t.nav.alliances },
              { id: 'constituencies', label: t.nav.constituencies },
              { id: 'leaderboard', label: t.nav.leaderboard },
            ].map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => navigateTo(item.id as AppTab)}
                  className={`relative py-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    isActive
                      ? 'text-white font-bold'
                      : 'hover:text-white'
                  }`}
                >
                  {item.label}
                  {isActive && (
                    <motion.span
                      layoutId="activeDesktopNav"
                      transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                      className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-gradient-to-r from-[#FF9933] via-[#F59E0B] to-cyan-300 shadow-[0_0_10px_rgba(245,158,11,0.85)]"
                    />
                  )}
                </button>
              );
            })}
            {canAccessAdmin && (
              <button
                type="button"
                onClick={() => navigateTo('admin')}
                className={`relative py-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer inline-flex items-center gap-1.5 ${
                  activeTab === 'admin'
                    ? 'text-[#F59E0B] font-bold'
                    : 'text-amber-200/90 hover:text-[#F59E0B]'
                }`}
              >
                <Shield className="w-3.5 h-3.5" />
                {t.nav.admin}
                {activeTab === 'admin' && (
                  <motion.span
                    layoutId="activeDesktopNav"
                    transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                    className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-gradient-to-r from-[#FF9933] to-[#F59E0B] shadow-[0_0_10px_rgba(245,158,11,0.85)]"
                  />
                )}
              </button>
            )}
          </nav>

          {/* Zone 3: Language Toggle (EN / हिं) + Legal Info + Profile / Premium Action */}
          <div className="flex items-center gap-2 shrink-0">
            <div
              role="group"
              aria-label="Language Switcher"
              className="h-9 p-0.5 rounded-xl bg-white/10 border border-white/15 flex items-center"
            >
              <Languages className="w-3.5 h-3.5 text-blue-200 ml-1.5 mr-1 hidden sm:block" />
              <button
                type="button"
                onClick={() => setLanguage('en')}
                className={`h-7.5 px-2 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                  language === 'en'
                    ? 'bg-[#F59E0B] text-slate-950 shadow-xs'
                    : 'text-blue-100/80 hover:text-white'
                }`}
              >
                EN
              </button>
              <button
                type="button"
                onClick={() => setLanguage('hi')}
                className={`h-7.5 px-2 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                  language === 'hi'
                    ? 'bg-[#F59E0B] text-slate-950 shadow-xs'
                    : 'text-blue-100/80 hover:text-white'
                }`}
              >
                हिं
              </button>
            </div>

            <button
              type="button"
              onClick={() => setLegalModalOpen(true)}
              aria-label="Legal Compliance & Scoring Rules"
              className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-[#F59E0B] flex items-center justify-center transition-colors cursor-pointer"
            >
              <Info className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => (firebaseUser ? setProfileModalOpen(true) : setAuthModalOpen(true))}
              aria-label="Account, Mobile OTP and Settings"
              className="h-9 px-3 rounded-full bg-gradient-to-r from-[#FF9933] via-[#F59E0B] to-[#E65100] hover:brightness-105 text-slate-950 flex items-center gap-1.5 text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 up-md3-ripple up-gold-rim"
            >
              {firebaseUser ? (
                <UserIcon className="w-4 h-4 shrink-0" />
              ) : (
                <Smartphone className="w-4 h-4 shrink-0" />
              )}
              <span className="hidden sm:inline max-w-[140px] truncate">
                {firebaseUser
                  ? userProfile?.publicAlias || t.auth.account
                  : t.auth.signIn}
              </span>
            </button>
          </div>
        </div>
        <div className="up-tiranga-bar w-full" aria-hidden="true" />
      </header>

      {/* Main Content Container */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 py-5 sm:py-6 up-stage-3d">
        {authError && (
          <div className="mb-4 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 p-3.5 text-xs font-semibold text-rose-700 dark:text-rose-300">
            {authError}
          </div>
        )}

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 12, rotateX: 3 }}
            animate={{ opacity: 1, y: 0, rotateX: 0 }}
            exit={{ opacity: 0, y: -6, rotateX: -2 }}
            transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
            style={{ transformStyle: 'preserve-3d' }}
          >

        {activeTab === 'home' && (
          <HomeTab
            userProfile={userProfile}
            isSignedIn={Boolean(firebaseUser)}
            isSyncing={isSaving}
            language={language}
            prediction={prediction}
            parties={parties}
            electionConfig={electionConfig}
            countdownText={countdownText}
            userRankDisplay={userRankDisplay}
            civicPoints={civicPoints}
            onOpenAuthModal={() => setAuthModalOpen(true)}
            onGoogleSignIn={() => void handleGoogleSignIn()}
            onNavigate={navigateTo}
            onOpenLegal={() => setLegalModalOpen(true)}
          />
        )}

        {activeTab === 'parties' && (
          <PartyPredictionTab
            parties={parties}
            prediction={prediction}
            electionConfig={electionConfig}
            isSignedIn={Boolean(firebaseUser)}
            isSaving={isSaving}
            language={language}
            onUpdatePartyBands={handleUpdatePartyBands}
            onGoogleSignIn={() => setAuthModalOpen(true)}
          />
        )}

        {activeTab === 'alliances' && (
          <AlliancePredictionTab
            prediction={prediction}
            electionConfig={electionConfig}
            isSignedIn={Boolean(firebaseUser)}
            isSaving={isSaving}
            language={language}
            onUpdateAllianceBands={handleUpdateAllianceBands}
            onGoogleSignIn={() => setAuthModalOpen(true)}
          />
        )}

        {activeTab === 'constituencies' && (
          <ConstituenciesTab
            constituencies={constituencies}
            candidates={candidates}
            parties={parties}
            officialResults={officialResults}
            prediction={prediction}
            electionConfig={electionConfig}
            isSaving={isSaving}
            language={language}
            onSelectCandidate={handleSelectCandidate}
          />
        )}

        {activeTab === 'leaderboard' && (
          <LeaderboardSummaryTab
            key={summarySubView}
            initialSubView={summarySubView}
            userProfile={userProfile}
            isSignedIn={Boolean(firebaseUser)}
            language={language}
            prediction={prediction}
            parties={parties}
            constituencies={constituencies}
            leaderboard={leaderboard}
            electionConfig={electionConfig}
            countdownText={countdownText}
            civicPoints={civicPoints}
            onNavigate={navigateTo}
            onSubmitForecast={handleSubmitForecast}
            onOpenAuthModal={() => setAuthModalOpen(true)}
          />
        )}

        {activeTab === 'admin' && canAccessAdmin && (
          <AdminDashboard
            parties={parties}
            constituencies={constituencies}
            candidates={candidates}
            electionConfig={electionConfig}
            officialResults={officialResults}
            leaderboard={leaderboard}
            allUsers={allUsers}
            allUserPredictions={allUserPredictions}
            auditLogs={auditLogs}
            onImportSeatsCsv={handleImportSeatsCsv}
            onSaveCandidate={handleSaveCandidate}
            onImportCandidatesCsv={handleImportCandidatesCsv}
            onDeleteCandidate={handleDeleteCandidate}
            onSaveParty={handleSaveParty}
            onSaveElectionConfig={handleSaveElectionConfig}
            onSaveOfficialResult={handleSaveOfficialResult}
            onRecalculateLeaderboard={handleRecalculateLeaderboard}
          />
        )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Mobile Fixed Material 3 Bottom Navigation Bar */}
      <nav
        aria-label="Primary Mobile Navigation"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-[#09142C]/95 backdrop-blur-md border-t border-amber-500/20 dark:border-cyan-400/20 pb-safe up-md3-elev-2"
      >
        <div className={`grid h-16 items-center ${canAccessAdmin ? 'grid-cols-6' : 'grid-cols-5'}`}>
          {[
            { id: 'home', label: t.nav.home, Icon: Home },
            { id: 'parties', label: t.nav.parties, Icon: PieChart },
            { id: 'alliances', label: t.nav.alliances, Icon: GitMerge },
            { id: 'constituencies', label: t.nav.constituencies, Icon: MapPin },
            { id: 'leaderboard', label: t.nav.leaderboard, Icon: Trophy },
            ...(canAccessAdmin ? [{ id: 'admin', label: t.nav.admin, Icon: Shield }] : []),
          ].map(({ id, label, Icon }) => {
            const active = activeTab === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => navigateTo(id as AppTab)}
                className={`flex flex-col items-center justify-center gap-1 h-full transition-colors cursor-pointer up-md3-ripple px-0.5 ${
                  active
                    ? 'text-[#1D4ED8] dark:text-cyan-300'
                    : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                <span className="relative w-12 h-7 rounded-full flex items-center justify-center">
                  {active && (
                    <motion.span
                      layoutId="activeMobileNavPill"
                      transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                      className="absolute inset-0 rounded-full bg-gradient-to-r from-amber-100 via-blue-100 to-cyan-100 dark:from-amber-500/25 dark:via-blue-500/30 dark:to-cyan-500/25 shadow-[0_0_16px_-3px_rgba(34,211,238,0.65)] ring-1 ring-amber-400/40 dark:ring-cyan-400/40"
                    />
                  )}
                  <Icon className={`relative z-10 w-4 h-4 ${active ? 'stroke-[2.4]' : 'stroke-[1.9]'}`} />
                </span>
                <span className="text-[10px] sm:text-[11px] font-semibold tracking-tight truncate max-w-full">
                  {label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Modals */}
      <AuthModal
        open={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        language={language}
        onGoogleSignIn={handleGoogleSignIn}
        onPhoneVerified={handlePhoneVerified}
      />

      <ProfileModal
        open={profileModalOpen}
        onClose={() => setProfileModalOpen(false)}
        userProfile={userProfile}
        prediction={prediction}
        isSignedIn={Boolean(firebaseUser)}
        isAdmin={canAccessAdmin}
        darkMode={darkMode}
        language={language}
        onToggleDarkMode={() => setDarkMode((d) => !d)}
        onOpenAuthModal={() => setAuthModalOpen(true)}
        onGoogleSignIn={() => void handleGoogleSignIn()}
        onUpdateProfile={handleUpdateProfile}
        onDeleteAccountData={handleDeleteAccountData}
        onSignOut={handleSignOut}
        onOpenAdmin={() => navigateTo('admin')}
      />

      <LegalComplianceModal
        open={legalModalOpen}
        onClose={() => setLegalModalOpen(false)}
      />
    </div>
    </MotionConfig>
  );
}
