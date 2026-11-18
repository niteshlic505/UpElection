import React, { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import {
  CheckCircle2,
  Clock,
  CloudCheck,
  Crown,
  Gift,
  Info,
  PieChart as PieIcon,
  ShieldCheck,
  Smartphone,
  Trophy,
  UserCheck,
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
import { TOTAL_UP_SEATS, getBandByStart, getBandDisplaySeats, getPartyColor } from '../data/upParties';
import { TRANSLATIONS } from '../i18n/translations';
import { ChartSegment, DoughnutChart3D } from './DoughnutChart3D';

interface LeaderboardSummaryTabProps {
  initialSubView: 'leaderboard' | 'summary';
  userProfile: UserProfileData | null;
  isSignedIn: boolean;
  language: AppLanguage;
  prediction: UserPredictionData;
  parties: PartyConfig[];
  constituencies: ConstituencyRecord[];
  leaderboard: LeaderboardEntry[];
  electionConfig: ElectionConfigData;
  countdownText: string;
  civicPoints: number;
  onNavigate: (tab: AppTab) => void;
  onSubmitForecast: () => Promise<void>;
  onOpenAuthModal: () => void;
}

export const LeaderboardSummaryTab: React.FC<LeaderboardSummaryTabProps> = ({
  initialSubView,
  userProfile,
  isSignedIn,
  language,
  prediction,
  parties,
  constituencies,
  leaderboard,
  electionConfig,
  countdownText,
  civicPoints,
  onNavigate,
  onSubmitForecast,
  onOpenAuthModal,
}) => {
  const t = TRANSLATIONS[language].leaderboard;
  const rT = TRANSLATIONS[language].rewards;
  const [subView, setSubView] = useState<'leaderboard' | 'summary'>(initialSubView);
  const [showScoringRules, setShowScoringRules] = useState(false);
  const [pickSearch, setPickSearch] = useState('');
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);

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

  const rankedBoard = useMemo(() => {
    const map = new Map<string, LeaderboardEntry>();
    leaderboard.forEach((entry) => {
      if (entry.optIn) map.set(entry.uid, entry);
    });

    if (isSignedIn && userProfile) {
      map.set(userProfile.uid, {
        uid: userProfile.uid,
        publicAlias: userProfile.publicAlias || userProfile.displayName,
        optIn: userProfile.leaderboardOptIn,
        completionPercent: seatPercent,
        completedSeats,
        partyAllocated: totalAllocated,
        civicScore: civicPoints,
        officialPoints: map.get(userProfile.uid)?.officialPoints ?? 0,
        correctConstituencies: map.get(userProfile.uid)?.correctConstituencies ?? 0,
        correctPartyBands: map.get(userProfile.uid)?.correctPartyBands ?? 0,
      });
    }

    return Array.from(map.values())
      .filter((e) => e.optIn || e.uid === userProfile?.uid)
      .sort((a, b) => {
        const scoreA = a.officialPoints > 0 ? a.officialPoints : a.civicScore;
        const scoreB = b.officialPoints > 0 ? b.officialPoints : b.civicScore;
        if (scoreB !== scoreA) return scoreB - scoreA;
        return b.completionPercent - a.completionPercent;
      });
  }, [leaderboard, isSignedIn, userProfile, seatPercent, completedSeats, totalAllocated, civicPoints]);

  const topThree = rankedBoard.slice(0, 3);
  const restRows = rankedBoard.slice(3, 30);
  const myRankIndex = userProfile
    ? rankedBoard.findIndex((r) => r.uid === userProfile.uid)
    : -1;

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

  const getInitials = (name: string) =>
    name
      .split(/\s+/)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase() || '')
      .join('') || 'U';

  const handleConfirmSubmit = async () => {
    await onSubmitForecast();
    setSubmitMessage(
      isSignedIn
        ? language === 'hi'
          ? 'आपका 2027 UP Mandate पूर्वानुमान सबमिट होकर Firebase क्लाउड में सिंक हो गया है।'
          : 'Your 2027 UP Mandate forecast has been marked as submitted and synced to Firebase Cloud.'
        : language === 'hi'
        ? 'लोकल रूप से सहेजा गया। क्लाउड पर सबमिट करने के लिए मोबाइल OTP या Google से साइन इन करें।'
        : 'Forecast saved locally. Sign in with Mobile OTP or Google to submit to Firebase Cloud.',
    );
  };

  return (
    <div className="space-y-5">
      {/* Segmented Switch: Leaderboard | My Summary */}
      <div className="rounded-2xl bg-white dark:bg-[#0E1A36] border border-slate-200/80 dark:border-slate-800 p-1.5 up-md3-elev-1 max-w-md mx-auto">
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
      <div className="rounded-3xl bg-gradient-to-r from-[#091534] via-[#12265B] to-[#0E3168] text-white p-4 sm:p-5 up-gold-rim up-neon-edge flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#FF9933] to-[#F59E0B] text-slate-950 flex items-center justify-center shrink-0 up-float-3d">
            <Gift className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-amber-300">
              {rT.badgeFree} · {rT.prizeSub}
            </div>
            <h3 className="font-display font-bold text-sm sm:text-base text-white">
              {rT.title}
            </h3>
          </div>
        </div>
        <div className="font-display font-extrabold text-xl text-[#F59E0B] font-mono-num up-neon-text-gold shrink-0">
          {rT.prizeAmount}
        </div>
      </div>

      {subView === 'leaderboard' ? (
        <div className="space-y-5">
          {/* 3D Neon Podium Navy Card */}
          <div className="rounded-3xl text-white p-5 sm:p-7 shadow-xl bg-gradient-to-br from-[#08122C] via-[#0F2250] to-[#132C66] up-neon-rim up-neon-edge">
            <div className="flex items-center justify-between gap-3 mb-6">
              <div>
                <div className="flex items-center gap-2">
                  <Crown className="w-5 h-5 text-[#F59E0B]" />
                  <h2 className="font-display font-bold text-lg text-[#F59E0B]">
                    {t.openBoardTitle}
                  </h2>
                </div>
                <p className="text-xs text-blue-200/85 mt-0.5">{t.openBoardSub}</p>
              </div>
              <button
                type="button"
                onClick={() => setShowScoringRules((p) => !p)}
                className="text-xs font-semibold text-cyan-300 hover:text-white underline cursor-pointer shrink-0"
              >
                {t.scoringRulesBtn}
              </button>
            </div>

            {showScoringRules && (
              <div className="mb-6 rounded-2xl bg-white/10 border border-white/15 p-4 text-xs text-blue-100 space-y-1.5">
                <div className="font-bold text-[#F59E0B]">{t.scoringTitle}</div>
                <div>· {t.ruleConstituency}</div>
                <div>· {t.rulePartyBand}</div>
                <div>· {t.ruleCompletion}</div>
                <div>· {t.rulePreCount}</div>
                <div className="text-amber-200 font-semibold pt-1">{t.rulePools}</div>
              </div>
            )}

            {rankedBoard.length === 0 ? (
              <div className="py-8 text-center text-sm text-blue-100">
                {t.emptyOpenBoard}
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-3 items-end up-stage-3d">
                {/* #2 */}
                <motion.div
                  initial={{ opacity: 0, y: 16, rotateX: -8 }}
                  animate={{ opacity: 1, y: 0, rotateX: 0 }}
                  transition={{ duration: 0.25, delay: 0.05 }}
                  className="rounded-2xl bg-white/10 border border-cyan-300/25 p-3 sm:p-4 text-center up-card-3d"
                >
                  {topThree[1] ? (
                    <>
                      <div className="w-11 h-11 rounded-full bg-slate-200 text-slate-900 font-display font-bold text-sm flex items-center justify-center mx-auto mb-2">
                        {getInitials(topThree[1].publicAlias)}
                      </div>
                      <div className="text-xs font-bold text-cyan-300 font-mono-num">#2</div>
                      <div className="font-display font-bold text-xs sm:text-sm text-white truncate mt-0.5">
                        {topThree[1].publicAlias}
                      </div>
                      <div className="text-xs text-[#F59E0B] font-mono-num font-bold mt-1">
                        {(topThree[1].officialPoints || topThree[1].civicScore).toLocaleString()} pts
                      </div>
                    </>
                  ) : (
                    <div className="py-6 text-xs text-blue-200/60">#2</div>
                  )}
                </motion.div>

                {/* #1 */}
                <motion.div
                  initial={{ opacity: 0, y: 20, rotateX: -8 }}
                  animate={{ opacity: 1, y: 0, rotateX: 0 }}
                  transition={{ duration: 0.28 }}
                  className="rounded-2xl bg-gradient-to-b from-amber-500/25 to-amber-600/10 border border-amber-400/65 p-4 sm:p-5 text-center up-gold-rim up-card-3d"
                >
                  {topThree[0] ? (
                    <>
                      <Crown className="w-5 h-5 text-[#F59E0B] mx-auto mb-1.5" />
                      <div className="w-12 h-12 rounded-full bg-[#F59E0B] text-slate-950 font-display font-extrabold text-sm flex items-center justify-center mx-auto mb-2 shadow-md">
                        {getInitials(topThree[0].publicAlias)}
                      </div>
                      <div className="text-xs font-bold text-[#F59E0B] font-mono-num">#1</div>
                      <div className="font-display font-bold text-sm sm:text-base text-white truncate mt-0.5">
                        {topThree[0].publicAlias}
                      </div>
                      <div className="text-xs sm:text-sm text-white font-mono-num font-bold mt-1">
                        {(topThree[0].officialPoints || topThree[0].civicScore).toLocaleString()} pts
                      </div>
                    </>
                  ) : (
                    <div className="py-8 text-xs text-amber-200">#1</div>
                  )}
                </motion.div>

                {/* #3 */}
                <motion.div
                  initial={{ opacity: 0, y: 16, rotateX: -8 }}
                  animate={{ opacity: 1, y: 0, rotateX: 0 }}
                  transition={{ duration: 0.25, delay: 0.1 }}
                  className="rounded-2xl bg-white/10 border border-amber-300/25 p-3 sm:p-4 text-center up-card-3d"
                >
                  {topThree[2] ? (
                    <>
                      <div className="w-11 h-11 rounded-full bg-amber-700 text-white font-display font-bold text-sm flex items-center justify-center mx-auto mb-2">
                        {getInitials(topThree[2].publicAlias)}
                      </div>
                      <div className="text-xs font-bold text-amber-300 font-mono-num">#3</div>
                      <div className="font-display font-bold text-xs sm:text-sm text-white truncate mt-0.5">
                        {topThree[2].publicAlias}
                      </div>
                      <div className="text-xs text-[#F59E0B] font-mono-num font-bold mt-1">
                        {(topThree[2].officialPoints || topThree[2].civicScore).toLocaleString()} pts
                      </div>
                    </>
                  ) : (
                    <div className="py-6 text-xs text-blue-200/60">#3</div>
                  )}
                </motion.div>
              </div>
            )}
          </div>

          {/* Ranked List Card */}
          <div className="rounded-3xl bg-white dark:bg-[#0E1A36] border border-slate-200/80 dark:border-slate-800 p-4 sm:p-6 up-md3-elev-1 space-y-3">
            {restRows.map((entry, idx) => {
              const rank = idx + 4;
              const isMe = userProfile?.uid === entry.uid;
              return (
                <div
                  key={entry.uid}
                  className={`rounded-2xl p-3.5 flex items-center justify-between gap-3 ${
                    isMe
                      ? 'bg-blue-50 dark:bg-blue-950/60 border border-blue-400 dark:border-cyan-500/60'
                      : 'bg-slate-50/70 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-7 text-center font-mono-num font-bold text-xs text-slate-500 dark:text-slate-400">
                      #{rank}
                    </span>
                    <div className="w-9 h-9 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200 font-display font-bold text-xs flex items-center justify-center shrink-0">
                      {getInitials(entry.publicAlias)}
                    </div>
                    <div className="min-w-0">
                      <span className="font-display font-bold text-sm text-slate-900 dark:text-white truncate block">
                        {entry.publicAlias} {isMe && '(You)'}
                      </span>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono-num">
                        {entry.completedSeats}/403 · {entry.partyAllocated}/403
                      </div>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-mono-num font-bold text-sm text-slate-900 dark:text-white">
                      {(entry.officialPoints || entry.civicScore).toLocaleString()} pts
                    </div>
                    <div className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 font-mono-num">
                      {entry.completionPercent}%
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Current User Highlight Bar */}
            {isSignedIn && userProfile ? (
              <div className="rounded-2xl p-4 bg-blue-50/90 dark:bg-blue-950/60 border border-blue-300 dark:border-cyan-500/50 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="font-mono-num font-extrabold text-sm text-[#1D4ED8] dark:text-cyan-400">
                    #{myRankIndex >= 0 ? myRankIndex + 1 : '—'}
                  </span>
                  <div className="w-10 h-10 rounded-full bg-[#1D4ED8] text-white font-display font-bold text-xs flex items-center justify-center shrink-0">
                    YOU
                  </div>
                  <div className="min-w-0">
                    <span className="font-display font-bold text-sm text-slate-900 dark:text-white truncate block">
                      {userProfile.publicAlias}
                    </span>
                    <div className="text-xs text-blue-700 dark:text-blue-300">
                      {userProfile.leaderboardOptIn ? t.publicAliasActive : t.hiddenFromBoard}
                    </div>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="font-mono-num font-bold text-sm text-slate-900 dark:text-white">
                    {civicPoints} pts
                  </div>
                  <div className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 font-mono-num">
                    {seatPercent}%
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl p-4 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 text-xs text-slate-600 dark:text-slate-300">
                  <UserCheck className="w-4 h-4 text-blue-600 dark:text-cyan-400 shrink-0" />
                  <span>{t.emptyOpenBoard}</span>
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

            <p className="text-center text-xs text-slate-500 dark:text-slate-400 pt-2">
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
                  {prediction.lastSyncedAtMs
                    ? new Date(prediction.lastSyncedAtMs).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : 'Real-time'}
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
