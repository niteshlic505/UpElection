import React, { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import {
  Award,
  BarChart3,
  Check,
  CheckCircle2,
  Clock,
  CloudCheck,
  Copy,
  Crown,
  GitMerge,
  Info,
  Lock,
  MapPin,
  PieChart as PieIcon,
  Search,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Trophy,
  UserCheck,
  Users,
  Vote,
} from 'lucide-react';
import {
  AppLanguage,
  AppTab,
  ConstituencyRecord,
  ElectionConfigData,
  LeaderboardEntry,
  PartyConfig,
  UserPredictionData,
  UserProfileData,
} from '../types/election';
import {
  TOTAL_UP_SEATS,
  getBandByStart,
  getBandDisplaySeats,
  getPartyColor,
  getPartyMeta,
} from '../data/upParties';
import { TRANSLATIONS } from '../i18n/translations';
import {
  CONTEST_SCORING_RULES,
  calculatePredictionPoints,
  getEntryPredictionPoints,
  getEntryTotalPoints,
} from '../utils/scoring';
import {
  getPublicContestantId,
  getUniqueIdBadgeCode,
} from '../utils/uniqueId';
import { CommunityVotesAggregate } from '../utils/communityVotes';
import { ChartSegment, DoughnutChart3D } from './DoughnutChart3D';
import { PrizeShowcaseCard } from './PrizeShowcaseCard';

interface LeaderboardSummaryTabProps {
  initialSubView: 'leaderboard' | 'summary';
  userProfile: UserProfileData | null;
  isSignedIn: boolean;
  language: AppLanguage;
  prediction: UserPredictionData;
  parties: PartyConfig[];
  constituencies: ConstituencyRecord[];
  leaderboard: LeaderboardEntry[];
  communityVotes: CommunityVotesAggregate;
  electionConfig: ElectionConfigData;
  countdownText: string;
  civicPoints: number;
  onNavigate: (tab: AppTab) => void;
  onSubmitForecast: () => Promise<void>;
  onOpenAuthModal: () => void;
}

type CommunityVoteTab = 'parties' | 'alliances' | 'constituencies';

export const LeaderboardSummaryTab: React.FC<LeaderboardSummaryTabProps> = ({
  initialSubView,
  userProfile,
  isSignedIn,
  language,
  prediction,
  parties,
  constituencies,
  leaderboard,
  communityVotes,
  electionConfig,
  countdownText,
  civicPoints,
  onNavigate,
  onSubmitForecast,
  onOpenAuthModal,
}) => {
  const t = TRANSLATIONS[language].leaderboard;
  const rT = TRANSLATIONS[language].rewards;
  const isHi = language === 'hi';

  const [subView, setSubView] = useState<'leaderboard' | 'summary'>(initialSubView);
  const [communityTab, setCommunityTab] = useState<CommunityVoteTab>('parties');
  const [seatVoteSearch, setSeatVoteSearch] = useState('');
  const [pickSearch, setPickSearch] = useState('');
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState(false);

  const completedSeats = Object.keys(prediction.constituencyPicks).length;
  const remainingSeats = TOTAL_UP_SEATS - completedSeats;
  const seatPercent = Math.round((completedSeats / TOTAL_UP_SEATS) * 100);

  const activeParties = useMemo(
    () => [...parties].filter((p) => p.active).sort((a, b) => a.order - b.order),
    [parties],
  );

  const partySegments: ChartSegment[] = useMemo(
    () =>
      activeParties.map((p) => {
        const bandStart = prediction.partyBands[p.code] ?? 0;
        const band = getBandByStart(bandStart);
        const seats = getBandDisplaySeats(bandStart);
        return {
          code: p.code,
          name: p.shortName,
          color: p.color,
          seats,
          rangeLabel: `${band.label} (${seats})`,
        };
      }),
    [activeParties, prediction.partyBands],
  );

  const totalAllocated = partySegments.reduce((s, x) => s + x.seats, 0);

  const myPredictionBreakdown = useMemo(
    () =>
      calculatePredictionPoints(
        prediction.partyBands,
        prediction.allianceBands,
        prediction.constituencyPicks,
      ),
    [prediction.partyBands, prediction.allianceBands, prediction.constituencyPicks],
  );

  const myUniqueId = userProfile ? getPublicContestantId(userProfile) : null;

  const rankedBoard = useMemo(() => {
    const map = new Map<string, LeaderboardEntry>();
    leaderboard.forEach((entry) => {
      if (entry.optIn) {
        const uniqueUserId = getPublicContestantId(entry);
        map.set(entry.uid, {
          ...entry,
          uniqueUserId,
          publicAlias: uniqueUserId,
        });
      }
    });

    if (isSignedIn && userProfile) {
      const existing = map.get(userProfile.uid);
      const uniqueUserId = getPublicContestantId(userProfile);
      map.set(userProfile.uid, {
        uid: userProfile.uid,
        uniqueUserId,
        publicAlias: uniqueUserId,
        optIn: userProfile.leaderboardOptIn,
        completionPercent: seatPercent,
        completedSeats,
        partyAllocated: totalAllocated,
        allianceAllocated: prediction.allianceAllocated ?? 0,
        partyPredictionCount: myPredictionBreakdown.partyPredictionCount,
        alliancePredictionCount: myPredictionBreakdown.alliancePredictionCount,
        predictionPoints: myPredictionBreakdown.predictionPoints,
        civicScore: myPredictionBreakdown.predictionPoints,
        officialPoints: existing?.officialPoints ?? 0,
        correctConstituencies: existing?.correctConstituencies ?? 0,
        correctPartyBands: existing?.correctPartyBands ?? 0,
        correctAllianceBands: existing?.correctAllianceBands ?? 0,
      });
    }

    return Array.from(map.values())
      .filter((e) => e.optIn || e.uid === userProfile?.uid)
      .sort((a, b) => {
        const totalA = getEntryTotalPoints(a);
        const totalB = getEntryTotalPoints(b);
        if (totalB !== totalA) return totalB - totalA;
        if ((b.officialPoints || 0) !== (a.officialPoints || 0)) {
          return (b.officialPoints || 0) - (a.officialPoints || 0);
        }
        return (b.completedSeats || 0) - (a.completedSeats || 0);
      });
  }, [
    leaderboard,
    isSignedIn,
    userProfile,
    seatPercent,
    completedSeats,
    totalAllocated,
    prediction.allianceAllocated,
    myPredictionBreakdown,
  ]);

  const topThree = rankedBoard.slice(0, 3);
  const myRankIndex = userProfile
    ? rankedBoard.findIndex((r) => r.uid === userProfile.uid)
    : -1;
  const myRankedEntry = myRankIndex >= 0 ? rankedBoard[myRankIndex] : null;

  const filteredConstituencyVotes = useMemo(() => {
    const q = seatVoteSearch.trim().toLowerCase();
    if (!q) return communityVotes.constituencyVotes.slice(0, 50);
    return communityVotes.constituencyVotes
      .filter(
        (seat) =>
          String(seat.acNo) === q ||
          `#${seat.acNo}` === q ||
          seat.constituencyName.toLowerCase().includes(q) ||
          seat.district.toLowerCase().includes(q) ||
          seat.candidates.some(
            (c) =>
              c.candidateName.toLowerCase().includes(q) ||
              c.party.toLowerCase().includes(q),
          ),
      )
      .slice(0, 60);
  }, [communityVotes.constituencyVotes, seatVoteSearch]);

  const myPickRows = useMemo(() => {
    const q = pickSearch.trim().toLowerCase();
    return Object.entries(prediction.constituencyPicks)
      .map(([acKey, pick]) => {
        const acNo = Number(acKey);
        const seat = constituencies.find((c) => c.acNo === acNo);
        return {
          acNo,
          seatName: seat?.name || `AC #${acNo}`,
          district: seat?.district || '',
          pick,
        };
      })
      .filter((row) => {
        if (!q) return true;
        return (
          String(row.acNo) === q ||
          row.seatName.toLowerCase().includes(q) ||
          row.district.toLowerCase().includes(q) ||
          row.pick.candidateName.toLowerCase().includes(q) ||
          row.pick.party.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => a.acNo - b.acNo);
  }, [prediction.constituencyPicks, constituencies, pickSearch]);

  const handleCopyUniqueId = () => {
    if (!myUniqueId) return;
    void navigator.clipboard?.writeText(myUniqueId).then(() => {
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    });
  };

  const handleConfirmSubmit = async () => {
    await onSubmitForecast();
    setSubmitMessage(
      isSignedIn
        ? isHi
          ? 'आपका 2027 UP Janmat पूर्वानुमान सबमिट होकर Firebase क्लाउड में सिंक हो गया है।'
          : 'Your 2027 UP Janmat forecast has been marked as submitted and synced to Firebase Cloud.'
        : isHi
        ? 'लोकल रूप से सहेजा गया। क्लाउड पर सबमिट करने के लिए मोबाइल OTP या Google से साइन इन करें।'
        : 'Forecast saved locally. Sign in with Mobile OTP or Google to submit to Firebase Cloud.',
    );
  };

  return (
    <div className="space-y-5">
      {/* Segmented Switch: Leaderboard | My Summary */}
      <div className="rounded-2xl bg-white/95 dark:bg-[#0C1732]/95 backdrop-blur-md border border-amber-500/20 dark:border-cyan-400/20 p-1.5 up-md3-elev-1 max-w-md mx-auto">
        <div className="grid grid-cols-2 gap-1.5">
          <button
            type="button"
            onClick={() => setSubView('leaderboard')}
            className={`py-2.5 px-4 rounded-xl text-xs sm:text-sm font-display font-bold flex items-center justify-center gap-2 transition-all up-md3-ripple cursor-pointer ${
              subView === 'leaderboard'
                ? 'bg-[#0A1633] dark:bg-[#1D4ED8] text-white up-neon-rim'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Trophy className="w-4 h-4 text-[#F59E0B]" />
            <span>{t.tabLeaderboard}</span>
          </button>

          <button
            type="button"
            onClick={() => setSubView('summary')}
            className={`py-2.5 px-4 rounded-xl text-xs sm:text-sm font-display font-bold flex items-center justify-center gap-2 transition-all up-md3-ripple cursor-pointer ${
              subView === 'summary'
                ? 'bg-[#0A1633] dark:bg-[#1D4ED8] text-white up-neon-rim'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <PieIcon className="w-4 h-4 text-cyan-400" />
            <span>{t.tabSummary}</span>
          </button>
        </div>
      </div>

      {/* Free Tier ₹50 Lakh Winner Prizes Banner */}
      <PrizeShowcaseCard
        badgeFree={rT.badgeFree}
        prizeSub={rT.prizeSub}
        title={rT.title}
        prizeAmount={rT.prizeAmount}
        variant="compact"
      />

      {subView === 'leaderboard' ? (
        <div className="space-y-5">
          {/* Official Contest Scoring Rules Card (Always Visible) */}
          <div className="rounded-3xl bg-white/95 dark:bg-[#0C1732]/95 backdrop-blur-md border border-amber-500/30 dark:border-cyan-400/25 p-5 sm:p-6 up-md3-elev-1 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-base sm:text-lg text-slate-900 dark:text-white">
                    {isHi ? 'प्रतियोगिता अंक नियम व विजेता चयन' : 'Official Contest Scoring Rules'}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {isHi
                      ? 'अंत में सर्वाधिक कुल अंक प्राप्त करने वाला उपयोगकर्ता विजेता घोषित होगा।'
                      : 'The user with the most total points at the end is declared as the winner.'}
                  </p>
                </div>
              </div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-[11px] font-bold text-emerald-700 dark:text-emerald-300">
                <Lock className="w-3.5 h-3.5" />
                {isHi ? 'केवल यूनिक ID · नाम पूर्णतः गोपनीय' : 'Unique ID Only · Names Hidden'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="rounded-2xl p-3.5 bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-800/60">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700 dark:text-blue-300">
                    {isHi ? 'प्रत्येक अनुमान' : 'Every Prediction'}
                  </span>
                  <span className="font-mono-num font-extrabold text-base text-blue-700 dark:text-cyan-300">
                    +{CONTEST_SCORING_RULES.POINTS_PER_PREDICTION} pt
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  {isHi
                    ? 'पार्टी सीट, गठबंधन सीट या विधानसभा उम्मीदवार — हर अनुमान पर 1 अंक।'
                    : 'Every prediction made in party seats, alliance seats, or constituency candidates earns 1 point.'}
                </p>
              </div>

              <div className="rounded-2xl p-3.5 bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/60">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
                    {isHi ? 'सही विजेता उम्मीदवार' : 'Winning Candidate'}
                  </span>
                  <span className="font-mono-num font-extrabold text-base text-emerald-700 dark:text-emerald-300">
                    +{CONTEST_SCORING_RULES.POINTS_CORRECT_CONSTITUENCY_WINNER} pts
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  {isHi
                    ? 'प्रत्येक विधानसभा के सही विजेता उम्मीदवार के चुनाव पर 5 अंक।'
                    : 'Every correctly chosen winning candidate of each constituency fetches 5 points.'}
                </p>
              </div>

              <div className="rounded-2xl p-3.5 bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/60">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-300">
                    {isHi ? 'पार्टी सीट (±10 रेंज)' : 'Party Seats (±10 Range)'}
                  </span>
                  <span className="font-mono-num font-extrabold text-base text-amber-700 dark:text-amber-300">
                    +{CONTEST_SCORING_RULES.POINTS_CORRECT_PARTY_SEATS} pts
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  {isHi
                    ? 'प्रत्येक पार्टी की जीती हुई सीटों की संख्या 10 के अंतर के भीतर सही चुनने पर 20 अंक।'
                    : 'Correctly choosing the seat count won by each party within a range of 10 fetches 20 points.'}
                </p>
              </div>

              <div className="rounded-2xl p-3.5 bg-purple-50/70 dark:bg-purple-950/40 border border-purple-200/80 dark:border-purple-800/60">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-purple-700 dark:text-purple-300">
                    {isHi ? 'गठबंधन सीट (±10 रेंज)' : 'Alliance Seats (±10 Range)'}
                  </span>
                  <span className="font-mono-num font-extrabold text-base text-purple-700 dark:text-purple-300">
                    +{CONTEST_SCORING_RULES.POINTS_CORRECT_ALLIANCE_SEATS} pts
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  {isHi
                    ? 'प्रत्येक गठबंधन की जीती हुई सीटों की संख्या 10 के अंतर के भीतर सही चुनने पर 50 अंक।'
                    : 'Correctly choosing the seat count won by each alliance within a range of 10 fetches 50 points.'}
                </p>
              </div>
            </div>
          </div>

          {/* 3D Neon Anonymous Podium Navy Card */}
          <div className="rounded-3xl text-white p-5 sm:p-7 shadow-xl bg-gradient-to-br from-[#08122C] via-[#0F2250] to-[#132C66] up-neon-rim up-neon-edge">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
              <div>
                <div className="flex items-center gap-2">
                  <Crown className="w-5 h-5 text-[#F59E0B]" />
                  <h2 className="font-display font-bold text-lg text-[#F59E0B]">
                    {t.openBoardTitle}
                  </h2>
                </div>
                <p className="text-xs text-blue-200/85 mt-0.5">
                  {isHi
                    ? 'यूनिक पहचान संख्या (ID) द्वारा 100% गोपनीय रैंकिंग · सर्वाधिक अंक = विजेता'
                    : '100% Anonymous Rankings by Unique Identification Number · Highest Total Points Wins'}
                </p>
              </div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/10 border border-white/15 text-xs font-mono-num text-cyan-200">
                <Users className="w-3.5 h-3.5 text-[#F59E0B]" />
                <span>
                  {rankedBoard.length}{' '}
                  {isHi ? 'पंजीकृत प्रतियोगी' : rankedBoard.length === 1 ? 'Contestant' : 'Contestants'}
                </span>
              </div>
            </div>

            {rankedBoard.length === 0 ? (
              <div className="py-8 text-center text-sm text-blue-100">{t.emptyOpenBoard}</div>
            ) : (
              <div className="grid grid-cols-3 gap-1.5 sm:gap-3 items-end up-stage-3d">
                {/* #2 */}
                <motion.div
                  initial={{ opacity: 0, y: 16, rotateX: -8 }}
                  animate={{ opacity: 1, y: 0, rotateX: 0 }}
                  transition={{ duration: 0.25, delay: 0.05 }}
                  className="rounded-2xl bg-white/10 border border-cyan-300/25 p-2.5 sm:p-4 text-center up-card-3d min-w-0"
                >
                  {topThree[1] ? (
                    (() => {
                      const id2 = getPublicContestantId(topThree[1]);
                      const isMe2 = userProfile?.uid === topThree[1].uid;
                      return (
                        <>
                          <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-slate-200 text-slate-900 font-mono-num font-extrabold text-xs sm:text-sm flex items-center justify-center mx-auto mb-1.5 sm:mb-2">
                            {getUniqueIdBadgeCode(id2)}
                          </div>
                          <div className="text-[11px] sm:text-xs font-bold text-cyan-300 font-mono-num">
                            #2
                          </div>
                          <div className="font-mono-num font-bold text-[10px] sm:text-xs text-white truncate mt-0.5">
                            {id2}
                          </div>
                          {isMe2 && (
                            <div className="text-[10px] font-bold text-emerald-300 mt-0.5">
                              {isHi ? '(आप)' : '(You)'}
                            </div>
                          )}
                          <div className="text-[10px] sm:text-xs text-[#F59E0B] font-mono-num font-bold mt-1 truncate">
                            {getEntryTotalPoints(topThree[1]).toLocaleString()} pts
                          </div>
                        </>
                      );
                    })()
                  ) : (
                    <div className="py-6 text-xs text-blue-200/60">#2</div>
                  )}
                </motion.div>

                {/* #1 */}
                <motion.div
                  initial={{ opacity: 0, y: 20, rotateX: -8 }}
                  animate={{ opacity: 1, y: 0, rotateX: 0 }}
                  transition={{ duration: 0.28 }}
                  className="rounded-2xl bg-gradient-to-b from-amber-500/25 to-amber-600/10 border border-amber-400/65 p-3 sm:p-5 text-center up-gold-rim up-card-3d min-w-0"
                >
                  {topThree[0] ? (
                    (() => {
                      const id1 = getPublicContestantId(topThree[0]);
                      const isMe1 = userProfile?.uid === topThree[0].uid;
                      return (
                        <>
                          <Crown className="w-4 h-4 sm:w-5 sm:h-5 text-[#F59E0B] mx-auto mb-1 sm:mb-1.5" />
                          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[#F59E0B] text-slate-950 font-mono-num font-extrabold text-xs sm:text-sm flex items-center justify-center mx-auto mb-1.5 sm:mb-2 shadow-md">
                            {getUniqueIdBadgeCode(id1)}
                          </div>
                          <div className="text-[11px] sm:text-xs font-bold text-[#F59E0B] font-mono-num">
                            #1 {isHi ? 'अग्रणी' : 'LEADER'}
                          </div>
                          <div className="font-mono-num font-extrabold text-[11px] sm:text-sm text-white truncate mt-0.5">
                            {id1}
                          </div>
                          {isMe1 && (
                            <div className="text-[10px] font-bold text-emerald-300 mt-0.5">
                              {isHi ? '(आप)' : '(You)'}
                            </div>
                          )}
                          <div className="text-[11px] sm:text-sm text-white font-mono-num font-extrabold mt-1 truncate">
                            {getEntryTotalPoints(topThree[0]).toLocaleString()} pts
                          </div>
                        </>
                      );
                    })()
                  ) : (
                    <div className="py-8 text-xs text-amber-200">#1</div>
                  )}
                </motion.div>

                {/* #3 */}
                <motion.div
                  initial={{ opacity: 0, y: 16, rotateX: -8 }}
                  animate={{ opacity: 1, y: 0, rotateX: 0 }}
                  transition={{ duration: 0.25, delay: 0.1 }}
                  className="rounded-2xl bg-white/10 border border-amber-300/25 p-2.5 sm:p-4 text-center up-card-3d min-w-0"
                >
                  {topThree[2] ? (
                    (() => {
                      const id3 = getPublicContestantId(topThree[2]);
                      const isMe3 = userProfile?.uid === topThree[2].uid;
                      return (
                        <>
                          <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-amber-700 text-white font-mono-num font-extrabold text-xs sm:text-sm flex items-center justify-center mx-auto mb-1.5 sm:mb-2">
                            {getUniqueIdBadgeCode(id3)}
                          </div>
                          <div className="text-[11px] sm:text-xs font-bold text-amber-300 font-mono-num">
                            #3
                          </div>
                          <div className="font-mono-num font-bold text-[10px] sm:text-xs text-white truncate mt-0.5">
                            {id3}
                          </div>
                          {isMe3 && (
                            <div className="text-[10px] font-bold text-emerald-300 mt-0.5">
                              {isHi ? '(आप)' : '(You)'}
                            </div>
                          )}
                          <div className="text-[10px] sm:text-xs text-[#F59E0B] font-mono-num font-bold mt-1 truncate">
                            {getEntryTotalPoints(topThree[2]).toLocaleString()} pts
                          </div>
                        </>
                      );
                    })()
                  ) : (
                    <div className="py-6 text-xs text-blue-200/60">#3</div>
                  )}
                </motion.div>
              </div>
            )}
          </div>

          {/* Ranked List by Unique Identification Number ONLY */}
          <div className="rounded-3xl bg-white dark:bg-[#0E1A36] border border-slate-200/80 dark:border-slate-800 p-4 sm:p-6 up-md3-elev-1 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-1 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-display font-bold text-sm sm:text-base text-slate-900 dark:text-white flex items-center gap-2">
                <Trophy className="w-4 h-4 text-[#F59E0B]" />
                {isHi ? 'यूनिक ID रैंकिंग सूची' : 'Anonymous Rankings by Unique ID'}
              </h3>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                {isHi ? 'अनुमान अंक (+1) + सटीकता अंक (+5/+20/+50)' : 'Prediction Pts (+1) + Accuracy Pts (+5/+20/+50)'}
              </span>
            </div>

            {rankedBoard.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-500 dark:text-slate-400">
                {isHi ? 'अभी कोई रैंकिंग प्रविष्टि उपलब्ध नहीं है।' : 'No leaderboard entries yet.'}
              </div>
            ) : (
              <div className="space-y-2.5">
                {rankedBoard.slice(0, 50).map((entry, idx) => {
                  const rank = idx + 1;
                  const isMe = userProfile?.uid === entry.uid;
                  const contestantId = getPublicContestantId(entry);
                  const predPts = getEntryPredictionPoints(entry);
                  const accPts = entry.officialPoints || 0;
                  const totalPts = predPts + accPts;

                  return (
                    <div
                      key={entry.uid}
                      className={`rounded-2xl p-3.5 flex flex-wrap sm:flex-nowrap items-center justify-between gap-3 ${
                        isMe
                          ? 'bg-blue-50 dark:bg-blue-950/60 border border-blue-400 dark:border-cyan-500/60'
                          : 'bg-slate-50/70 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span
                          className={`w-8 text-center font-mono-num font-extrabold text-xs ${
                            rank === 1
                              ? 'text-amber-500'
                              : rank === 2
                              ? 'text-cyan-600 dark:text-cyan-400'
                              : rank === 3
                              ? 'text-amber-700 dark:text-amber-400'
                              : 'text-slate-500 dark:text-slate-400'
                          }`}
                        >
                          #{rank}
                        </span>
                        <div className="w-9 h-9 rounded-xl bg-[#0A1633] dark:bg-blue-950 text-[#F59E0B] font-mono-num font-extrabold text-xs flex items-center justify-center shrink-0 border border-amber-400/30">
                          {getUniqueIdBadgeCode(contestantId)}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-mono-num font-extrabold text-sm text-slate-900 dark:text-white truncate">
                              {contestantId}
                            </span>
                            {isMe && (
                              <span className="px-1.5 py-0.5 rounded-md bg-blue-600 text-white text-[10px] font-bold">
                                {isHi ? 'आप' : 'YOU'}
                              </span>
                            )}
                          </div>
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-slate-500 dark:text-slate-400 font-mono-num mt-0.5">
                            <span>
                              {isHi ? 'विधानसभा' : 'Seats'}: {entry.completedSeats}/403
                            </span>
                            <span>·</span>
                            <span>
                              {isHi ? 'पार्टी' : 'Parties'}: {entry.partyPredictionCount ?? (entry.partyAllocated > 0 ? 1 : 0)}
                            </span>
                            <span>·</span>
                            <span>
                              {isHi ? 'गठबंधन' : 'Alliances'}: {entry.alliancePredictionCount ?? ((entry.allianceAllocated ?? 0) > 0 ? 1 : 0)}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right shrink-0 ml-auto">
                        <div className="font-mono-num font-extrabold text-sm sm:text-base text-slate-900 dark:text-white">
                          {totalPts.toLocaleString()} pts
                        </div>
                        <div className="text-[10px] sm:text-[11px] font-mono-num text-emerald-600 dark:text-emerald-400 font-semibold">
                          {isHi ? 'अनुमान' : 'Pred'}: +{predPts} · {isHi ? 'सटीकता' : 'Acc'}: +{accPts}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Current User Highlight Bar with Copyable Unique Identification Number */}
            {isSignedIn && userProfile && myUniqueId ? (
              <div className="rounded-2xl p-4 bg-blue-50/90 dark:bg-blue-950/60 border border-blue-300 dark:border-cyan-500/50 flex flex-wrap sm:flex-nowrap items-center justify-between gap-3 mt-2">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="font-mono-num font-extrabold text-sm text-[#1D4ED8] dark:text-cyan-400">
                    #{myRankIndex >= 0 ? myRankIndex + 1 : '—'}
                  </span>
                  <div className="w-10 h-10 rounded-xl bg-[#1D4ED8] text-white font-display font-bold text-xs flex items-center justify-center shrink-0">
                    YOU
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono-num font-extrabold text-sm text-slate-900 dark:text-white">
                        {myUniqueId}
                      </span>
                      <button
                        type="button"
                        onClick={handleCopyUniqueId}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-white dark:bg-slate-900 border border-blue-200 dark:border-cyan-700 text-[10px] font-semibold text-blue-700 dark:text-cyan-300 hover:bg-blue-100 dark:hover:bg-slate-800 cursor-pointer"
                      >
                        {copiedId ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedId ? (isHi ? 'कॉपी हुआ' : 'Copied') : (isHi ? 'ID कॉपी करें' : 'Copy ID')}</span>
                      </button>
                    </div>
                    <div className="text-[11px] text-blue-700 dark:text-blue-300 mt-0.5">
                      {userProfile.leaderboardOptIn
                        ? isHi
                          ? 'आपका नाम अन्य उपयोगकर्ताओं को कभी नहीं दिखेगा — केवल यही यूनिक ID सार्वजनिक है।'
                          : 'Your name is never shown to others — only this Unique ID appears on the leaderboard.'
                        : t.hiddenFromBoard}
                    </div>
                  </div>
                </div>
                <div className="text-right shrink-0 ml-auto">
                  <div className="font-mono-num font-extrabold text-base text-slate-900 dark:text-white">
                    {civicPoints.toLocaleString()} pts
                  </div>
                  <div className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 font-mono-num">
                    +{myPredictionBreakdown.predictionPoints} {isHi ? 'अनुमान' : 'pred'} · +
                    {myRankedEntry?.officialPoints ?? 0} {isHi ? 'सटीकता' : 'acc'}
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl p-4 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 text-xs text-slate-600 dark:text-slate-300">
                  <UserCheck className="w-4 h-4 text-blue-600 dark:text-cyan-400 shrink-0" />
                  <span>
                    {isHi
                      ? 'अपना स्थायी यूनिक पहचान नंबर (UPM-XXXXXXXX) पाने व रैंकिंग देखने के लिए लॉगिन करें।'
                      : 'Sign in to receive your permanent alphanumeric Unique Identification Number (UPM-XXXXXXXX) and join the rankings.'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={onOpenAuthModal}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#FF9933] to-[#F59E0B] text-slate-950 text-xs font-display font-extrabold up-md3-ripple cursor-pointer whitespace-nowrap"
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>{TRANSLATIONS[language].auth.signIn}</span>
                </button>
              </div>
            )}
          </div>

          {/* LIVE COMMUNITY VOTING PULSE (Visible to Every User!) */}
          <div className="rounded-3xl bg-white dark:bg-[#0E1A36] border border-slate-200/80 dark:border-slate-800 p-4 sm:p-6 up-md3-elev-1 space-y-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="font-display font-bold text-base sm:text-lg text-slate-900 dark:text-white flex items-center gap-2">
                  <Vote className="w-5 h-5 text-[#FF9933]" />
                  {isHi
                    ? 'सार्वजनिक मतदान आंकड़े (पार्टी, गठबंधन व विधानसभा उम्मीदवार)'
                    : 'Live Community Vote Counts (Parties, Alliances & Candidates)'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {isHi
                    ? 'देखें कितने उपयोगकर्ताओं ने किस पार्टी, गठबंधन और प्रत्येक विधानसभा के किस उम्मीदवार को जीतने के लिए चुना है।'
                    : 'See how many users have voted for each party, alliance, and which candidate in every constituency.'}
                </p>
              </div>

              {/* High-Level Community KPI Pills */}
              <div className="flex flex-wrap gap-2 text-xs font-mono-num">
                <div className="px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-cyan-300 font-bold">
                  {communityVotes.totalPartySeatVoters} {isHi ? 'पार्टी मतदाता' : 'Party Voters'}
                </div>
                <div className="px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 font-bold">
                  {communityVotes.totalAllianceSeatVoters} {isHi ? 'गठबंधन मतदाता' : 'Alliance Voters'}
                </div>
                <div className="px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 font-bold">
                  {communityVotes.totalCandidateVotesCast}{' '}
                  {isHi ? 'उम्मीदवार वोट' : 'Candidate Votes'}
                </div>
              </div>
            </div>

            {/* 3 Community Vote Sub-Tabs */}
            <div className="grid grid-cols-3 gap-1.5 p-1 rounded-2xl bg-slate-100 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setCommunityTab('parties')}
                className={`py-2.5 px-2 sm:px-3 rounded-xl text-xs font-display font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  communityTab === 'parties'
                    ? 'bg-[#0A1633] dark:bg-[#1D4ED8] text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-white/60 dark:hover:bg-slate-800/70'
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{isHi ? 'पार्टी सीट वोट' : 'Party Seats'}</span>
              </button>

              <button
                type="button"
                onClick={() => setCommunityTab('alliances')}
                className={`py-2.5 px-2 sm:px-3 rounded-xl text-xs font-display font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  communityTab === 'alliances'
                    ? 'bg-[#0A1633] dark:bg-[#1D4ED8] text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-white/60 dark:hover:bg-slate-800/70'
                }`}
              >
                <GitMerge className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{isHi ? 'गठबंधन वोट' : 'Alliance Seats'}</span>
              </button>

              <button
                type="button"
                onClick={() => setCommunityTab('constituencies')}
                className={`py-2.5 px-2 sm:px-3 rounded-xl text-xs font-display font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  communityTab === 'constituencies'
                    ? 'bg-[#0A1633] dark:bg-[#1D4ED8] text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-white/60 dark:hover:bg-slate-800/70'
                }`}
              >
                <MapPin className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">
                  {isHi ? 'उम्मीदवार वोट' : 'Candidate Picks'} ({communityVotes.votedConstituenciesCount})
                </span>
              </button>
            </div>

            {/* Panel 1: Party Seat Votes */}
            {communityTab === 'parties' && (
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {communityVotes.partyVotes.map((pv) => {
                    const meta = getPartyMeta(pv.code);
                    const pct =
                      communityVotes.totalPartySeatVoters > 0
                        ? Math.round((pv.voterCount / communityVotes.totalPartySeatVoters) * 100)
                        : 0;
                    return (
                      <div
                        key={pv.code}
                        className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50 p-4 space-y-2.5"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <span
                              className="w-3 h-3 rounded-full shrink-0"
                              style={{ backgroundColor: pv.color }}
                            />
                            <div className="min-w-0">
                              <div className="font-display font-bold text-sm text-slate-900 dark:text-white truncate">
                                {isHi ? meta?.shortHi || pv.code : pv.code}
                              </div>
                              <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                                {isHi ? meta?.nameHi || pv.name : pv.name}
                              </div>
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <div className="font-mono-num font-extrabold text-base text-slate-900 dark:text-white">
                              {pv.voterCount}
                            </div>
                            <div className="text-[10px] text-slate-500 dark:text-slate-400">
                              {isHi ? 'उपयोगकर्ता' : pv.voterCount === 1 ? 'user voted' : 'users voted'}
                            </div>
                          </div>
                        </div>

                        <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{
                              width: `${Math.max(pct, pv.voterCount > 0 ? 6 : 0)}%`,
                              backgroundColor: pv.color,
                            }}
                          />
                        </div>

                        <div className="flex items-center justify-between text-[11px] font-mono-num text-slate-600 dark:text-slate-300">
                          <span>
                            {isHi ? 'औसत सीटें:' : 'Avg seats:'}{' '}
                            <strong className="text-slate-900 dark:text-white">{pv.avgSeats}</strong>
                          </span>
                          <span>
                            {isHi ? 'शीर्ष रेंज:' : 'Top band:'}{' '}
                            <strong className="text-slate-900 dark:text-white">
                              {pv.topBandLabel}
                            </strong>
                            {pv.topBandVoters > 0 && ` (${pv.topBandVoters})`}
                          </span>
                        </div>

                        {pv.bandBreakdown.length > 0 && (
                          <div className="flex flex-wrap gap-1 pt-1 border-t border-slate-200/70 dark:border-slate-800">
                            {pv.bandBreakdown.map((b) => (
                              <span
                                key={b.bandStart}
                                className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[10px] font-mono-num text-slate-700 dark:text-slate-200"
                              >
                                {b.bandLabel}: <strong>{b.count}</strong>
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Panel 2: Alliance Seat Votes */}
            {communityTab === 'alliances' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {communityVotes.allianceVotes.map((av) => {
                  const pct =
                    communityVotes.totalAllianceSeatVoters > 0
                      ? Math.round((av.voterCount / communityVotes.totalAllianceSeatVoters) * 100)
                      : 0;
                  return (
                    <div
                      key={av.code}
                      className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50 p-4 space-y-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span
                            className="w-3.5 h-3.5 rounded-full shrink-0"
                            style={{ backgroundColor: av.color }}
                          />
                          <div className="min-w-0">
                            <div className="font-display font-bold text-sm sm:text-base text-slate-900 dark:text-white truncate">
                              {isHi ? av.nameHi : av.nameEn}
                            </div>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400">
                              {isHi ? '202+ बहुमत अनुमान:' : '202+ Majority picks:'}{' '}
                              <strong className="font-mono-num text-emerald-600 dark:text-emerald-400">
                                {av.majorityVoters}
                              </strong>
                            </div>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="font-mono-num font-extrabold text-xl text-slate-900 dark:text-white">
                            {av.voterCount}
                          </div>
                          <div className="text-[10px] text-slate-500 dark:text-slate-400">
                            {isHi ? 'उपयोगकर्ता वोट' : av.voterCount === 1 ? 'user voted' : 'users voted'}
                          </div>
                        </div>
                      </div>

                      <div className="h-2.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${Math.max(pct, av.voterCount > 0 ? 6 : 0)}%`,
                            backgroundColor: av.color,
                          }}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs font-mono-num">
                        <div className="rounded-xl bg-white dark:bg-slate-900/80 border border-slate-200/70 dark:border-slate-800 p-2.5">
                          <div className="text-[10px] text-slate-500 dark:text-slate-400">
                            {isHi ? 'औसत अनुमानित सीटें' : 'Avg Predicted Seats'}
                          </div>
                          <div className="font-bold text-sm text-slate-900 dark:text-white mt-0.5">
                            {av.avgSeats} / 403
                          </div>
                        </div>
                        <div className="rounded-xl bg-white dark:bg-slate-900/80 border border-slate-200/70 dark:border-slate-800 p-2.5">
                          <div className="text-[10px] text-slate-500 dark:text-slate-400">
                            {isHi ? 'सबसे लोकप्रिय सीट रेंज' : 'Most Voted Seat Range'}
                          </div>
                          <div className="font-bold text-sm text-slate-900 dark:text-white mt-0.5">
                            {av.topBandLabel}{' '}
                            {av.topBandVoters > 0 && (
                              <span className="text-xs text-blue-600 dark:text-cyan-400">
                                ({av.topBandVoters})
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {av.bandBreakdown.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {av.bandBreakdown.map((b) => (
                            <span
                              key={b.bandStart}
                              className="px-2 py-0.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] font-mono-num text-slate-700 dark:text-slate-200"
                            >
                              {b.bandLabel}: <strong>{b.count}</strong>{' '}
                              {isHi ? 'वोट' : b.count === 1 ? 'user' : 'users'}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Panel 3: Constituency Candidate Winner Votes */}
            {communityTab === 'constituencies' && (
              <div className="space-y-3.5">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={seatVoteSearch}
                    onChange={(e) => setSeatVoteSearch(e.target.value)}
                    placeholder={
                      isHi
                        ? 'सीट नं., विधानसभा क्षेत्र, जिला या उम्मीदवार का नाम खोजें...'
                        : 'Search AC No., constituency, district, or candidate name...'
                    }
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {filteredConstituencyVotes.length === 0 ? (
                  <div className="py-10 text-center space-y-2 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200/70 dark:border-slate-800">
                    <Sparkles className="w-7 h-7 text-amber-500 mx-auto" />
                    <div className="font-display font-bold text-sm text-slate-800 dark:text-white">
                      {communityVotes.constituencyVotes.length === 0
                        ? isHi
                          ? 'अभी तक किसी विधानसभा उम्मीदवार पर वोट दर्ज नहीं हुआ है'
                          : 'No constituency candidate votes recorded yet'
                        : isHi
                        ? 'इस खोज से कोई विधानसभा मेल नहीं खाती'
                        : 'No matching constituency found'}
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                      {isHi
                        ? 'विधानसभा क्षेत्र टैब पर जाकर उम्मीदवार चुनें — प्रत्येक अनुमान पर +1 अंक मिलेगा और वोट तुरंत यहाँ दिखेंगे।'
                        : 'Predict winning candidates in the Constituencies tab to earn +1 point per pick and see live candidate counts here.'}
                    </p>
                    <button
                      type="button"
                      onClick={() => onNavigate('constituencies')}
                      className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#1D4ED8] text-white text-xs font-bold cursor-pointer"
                    >
                      {isHi ? '403 विधानसभा क्षेत्र देखें →' : 'Browse 403 Constituencies →'}
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[540px] overflow-y-auto pr-1">
                    {filteredConstituencyVotes.map((seat) => (
                      <div
                        key={seat.acNo}
                        className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-slate-50/75 dark:bg-slate-900/50 p-4 space-y-2.5"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <div className="font-display font-bold text-sm text-slate-900 dark:text-white truncate">
                              <span className="font-mono-num text-blue-600 dark:text-cyan-400 mr-1.5">
                                #{seat.acNo}
                              </span>
                              {seat.constituencyName}
                            </div>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                              {seat.district}
                            </div>
                          </div>
                          <span className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] font-mono-num font-bold text-slate-700 dark:text-slate-200 shrink-0">
                            {seat.totalVoters}{' '}
                            {isHi ? 'वोट' : seat.totalVoters === 1 ? 'voter' : 'voters'}
                          </span>
                        </div>

                        <div className="space-y-2">
                          {seat.candidates.map((cand, cIdx) => {
                            const partyColor = getPartyColor(cand.party);
                            return (
                              <div key={cand.key} className="space-y-1">
                                <div className="flex items-center justify-between gap-2 text-xs">
                                  <div className="flex items-center gap-1.5 min-w-0">
                                    <span
                                      className="w-2.5 h-2.5 rounded-full shrink-0"
                                      style={{ backgroundColor: partyColor }}
                                    />
                                    <span className="font-semibold text-slate-900 dark:text-white truncate">
                                      {cIdx === 0 ? '★ ' : ''}
                                      {cand.candidateName}
                                    </span>
                                    <span
                                      className="text-[10px] font-bold shrink-0"
                                      style={{ color: partyColor }}
                                    >
                                      ({cand.party})
                                    </span>
                                  </div>
                                  <span className="font-mono-num font-bold text-slate-800 dark:text-slate-200 shrink-0">
                                    {cand.voterCount}{' '}
                                    <span className="text-[10px] font-normal text-slate-500 dark:text-slate-400">
                                      ({cand.sharePercent}%)
                                    </span>
                                  </span>
                                </div>
                                <div className="h-1.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                                  <div
                                    className="h-full rounded-full"
                                    style={{
                                      width: `${Math.max(cand.sharePercent, 6)}%`,
                                      backgroundColor: partyColor,
                                    }}
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <p className="text-center text-xs text-slate-500 dark:text-slate-400 pt-1">
              {t.footerNote}
            </p>
          </div>
        </div>
      ) : (
        /* MY SUMMARY VIEW */
        <div className="space-y-5">
          {/* Top Metrics Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 up-stage-3d">
            <div className="rounded-3xl bg-white dark:bg-[#0E1A36] border border-slate-200/80 dark:border-slate-800 p-5 up-md3-elev-1 up-card-3d flex items-center justify-between">
              <div>
                <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  {t.constituencyProgress}
                </div>
                <div className="font-display font-extrabold text-3xl text-slate-900 dark:text-white font-mono-num mt-1">
                  {completedSeats} / {TOTAL_UP_SEATS}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {t.seatsRemaining(remainingSeats)}
                </div>
              </div>
              <div className="w-16 h-16 rounded-full border-4 border-blue-600/20 flex items-center justify-center font-mono-num font-extrabold text-base text-[#1D4ED8] dark:text-cyan-400">
                {seatPercent}%
              </div>
            </div>

            <div className="rounded-3xl bg-white dark:bg-[#0E1A36] border border-slate-200/80 dark:border-slate-800 p-5 up-md3-elev-1 up-card-3d flex items-center justify-between">
              <div>
                <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  {t.predictionCutoff}
                </div>
                <div className="font-display font-extrabold text-2xl text-slate-900 dark:text-white font-mono-num mt-1">
                  {electionConfig.isLocked ? TRANSLATIONS[language].home.locked : countdownText}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {t.countingDayLabel}
                </div>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                <Clock className="w-5 h-5" />
              </div>
            </div>

            <div className="rounded-3xl bg-white dark:bg-[#0E1A36] border border-slate-200/80 dark:border-slate-800 p-5 up-md3-elev-1 up-card-3d flex items-center justify-between">
              <div>
                <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  {t.cloudSyncStatus}
                </div>
                <div className="font-display font-bold text-lg text-slate-900 dark:text-white mt-1">
                  {prediction.isSubmitted ? t.submitted : t.draftSynced}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-mono-num">
                  {myUniqueId ? `ID: ${myUniqueId}` : 'Real-time'}
                </div>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <CloudCheck className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Party Distribution Summary + Submit Action */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            <div className="lg:col-span-5 rounded-3xl bg-white dark:bg-[#0E1A36] border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 up-md3-elev-1 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-display font-bold text-base text-slate-900 dark:text-white">
                  {t.partyForecast}
                </h3>
                <button
                  type="button"
                  onClick={() => onNavigate('parties')}
                  className="text-xs font-semibold text-blue-600 dark:text-cyan-400 hover:underline cursor-pointer"
                >
                  {t.editBands}
                </button>
              </div>

              <div className="flex justify-center">
                <DoughnutChart3D
                  segments={partySegments}
                  centerLabel={String(totalAllocated)}
                  centerSublabel="/ 403"
                  size={176}
                />
              </div>

              <div className="space-y-2">
                {partySegments.map((seg) => (
                  <div key={seg.code} className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-2 font-semibold text-slate-800 dark:text-slate-200">
                      <span
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: seg.color }}
                      />
                      {seg.name}
                    </span>
                    <span className="font-mono-num font-bold text-slate-700 dark:text-slate-300">
                      {seg.rangeLabel}
                    </span>
                  </div>
                ))}
              </div>

              <button
                type="button"
                disabled={electionConfig.isLocked}
                onClick={() => void handleConfirmSubmit()}
                className="w-full py-3 rounded-xl bg-[#1D4ED8] hover:bg-blue-700 disabled:opacity-50 text-white font-display font-bold text-sm flex items-center justify-center gap-2 transition-colors up-neon-cyan up-md3-ripple cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>{prediction.isSubmitted ? t.updateForecast : t.submitForecast}</span>
              </button>

              {submitMessage && (
                <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 p-3 text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{submitMessage}</span>
                </div>
              )}
            </div>

            {/* Selected Constituencies List */}
            <div className="lg:col-span-7 rounded-3xl bg-white dark:bg-[#0E1A36] border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 up-md3-elev-1 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="font-display font-bold text-base text-slate-900 dark:text-white">
                    {t.yourPicksTitle(completedSeats)}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{t.editableUntil}</p>
                </div>
                <button
                  type="button"
                  onClick={() => onNavigate('constituencies')}
                  className="px-3.5 py-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 text-xs font-semibold hover:bg-blue-100 transition-colors cursor-pointer"
                >
                  {t.pickMoreSeats}
                </button>
              </div>

              <input
                type="text"
                value={pickSearch}
                onChange={(e) => setPickSearch(e.target.value)}
                placeholder={t.filterPicksPlaceholder}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400"
              />

              {myPickRows.length === 0 ? (
                <div className="py-10 text-center space-y-2">
                  <Info className="w-8 h-8 text-slate-400 mx-auto" />
                  <div className="font-display font-bold text-sm text-slate-800 dark:text-white">
                    {t.noPicksTitle}
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{t.noPicksSub}</p>
                </div>
              ) : (
                <div className="max-h-[420px] overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                  {myPickRows.map((row) => (
                    <div
                      key={row.acNo}
                      className="py-3 flex items-center justify-between gap-3 text-xs sm:text-sm"
                    >
                      <div className="min-w-0">
                        <div className="font-display font-bold text-slate-900 dark:text-white truncate">
                          <span className="font-mono-num text-blue-600 dark:text-cyan-400 mr-1.5">
                            #{row.acNo}
                          </span>
                          {row.seatName}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
                          {row.district} · {row.pick.candidateName}
                        </div>
                      </div>
                      <span
                        className="px-2.5 py-1 rounded-lg font-bold text-xs text-white shrink-0"
                        style={{ backgroundColor: getPartyColor(row.pick.party) }}
                      >
                        {row.pick.party}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
