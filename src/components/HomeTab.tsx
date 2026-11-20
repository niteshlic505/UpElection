import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  Clock,
  Crown,
  FileText,
  Gift,
  GitMerge,
  Lock,
  MapPin,
  PieChart,
  ShieldCheck,
  Smartphone,
  Trophy,
} from 'lucide-react';
import {
  AppLanguage,
  AppTab,
  ElectionConfigData,
  PartyConfig,
  UserPredictionData,
  UserProfileData,
} from '../types/election';
import { TOTAL_UP_SEATS, getBandByStart, getBandDisplaySeats } from '../data/upParties';
import { TRANSLATIONS } from '../i18n/translations';
import { getPublicContestantId } from '../utils/uniqueId';
import upVidhanTwilightImg from '../assets/images/up_vidhan_twilight_1794969822354.jpg';
import { PWAInstallButton } from './PWAInstallButton';
import { PrizeShowcaseCard } from './PrizeShowcaseCard';

const UP_MONTAGE_ART = './assets/aistudio/UP_Election_App_Icon_1024_d13a55bb.jpg';

interface HomeTabProps {
  userProfile: UserProfileData | null;
  isSignedIn: boolean;
  isSyncing: boolean;
  language: AppLanguage;
  prediction: UserPredictionData;
  parties: PartyConfig[];
  electionConfig: ElectionConfigData;
  countdownText: string;
  userRankDisplay: string;
  civicPoints: number;
  onOpenAuthModal: () => void;
  onGoogleSignIn: () => void;
  onNavigate: (tab: AppTab, subView?: 'leaderboard' | 'summary') => void;
  onOpenLegal: () => void;
}

export const HomeTab: React.FC<HomeTabProps> = ({
  userProfile,
  isSignedIn,
  isSyncing,
  language,
  prediction,
  parties,
  electionConfig,
  countdownText,
  userRankDisplay,
  civicPoints,
  onOpenAuthModal,
  onGoogleSignIn,
  onNavigate,
  onOpenLegal,
}) => {
  const [heroTilt, setHeroTilt] = useState({ rotateX: 0, rotateY: 0 });
  const [bgImgError, setBgImgError] = useState(false);
  const t = TRANSLATIONS[language];

  const allocated = parties.reduce(
    (sum, p) => (p.active ? sum + getBandDisplaySeats(prediction.partyBands[p.code] ?? 0) : sum),
    0,
  );
  const completedSeats = Object.keys(prediction.constituencyPicks).length;
  const overallPercent = Math.min(
    100,
    Math.round(((completedSeats / TOTAL_UP_SEATS) * 0.7 + (allocated > 0 ? 0.3 : 0)) * 100),
  );

  const initials = (userProfile?.publicAlias || userProfile?.displayName || 'UP')
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() || '')
    .join('');

  return (
    <div className="relative">
      {/* Full-Bleed Atmospheric UP Election Home Background Layer */}
      {!bgImgError && (
        <div
          aria-hidden="true"
          className="fixed inset-0 z-0 pointer-events-none overflow-hidden select-none"
        >
          <img
            src={UP_MONTAGE_ART}
            alt=""
            referrerPolicy="no-referrer"
            onError={() => setBgImgError(true)}
            className="w-full h-full object-cover object-center scale-105 opacity-[0.16] dark:opacity-[0.24] saturate-125"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#FAF6EE]/86 via-[#FAF6EE]/78 to-[#FAF6EE]/94 dark:from-[#050B1A]/86 dark:via-[#08132E]/78 dark:to-[#050B1A]/94" />
          <div className="absolute inset-0 up-desi-jaali opacity-60" />
        </div>
      )}

      <div className="relative z-10 space-y-5">
      {/* Legal Blackout Banner (Section 126 RP Act) */}
      {electionConfig.blackoutActive && (
        <div className="rounded-2xl bg-amber-50/95 dark:bg-amber-950/75 backdrop-blur-md border border-amber-300 dark:border-amber-700/60 p-4 flex items-start gap-3">
          <Lock className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-bold text-amber-900 dark:text-amber-200">
              {t.home.blackoutTitle}
            </h3>
            <p className="text-xs text-amber-800 dark:text-amber-300 mt-1 leading-relaxed">
              {electionConfig.blackoutMessage ||
                'In compliance with Section 126 of the Representation of the People Act, 1951 and ECI directions, public opinion forecasts are restricted during the 48-hour silence window.'}
            </p>
          </div>
        </div>
      )}

      {/* Signed-Out Welcome & Mobile OTP / Google Sign-In Splash Card */}
      {!isSignedIn && (
        <motion.div
          initial={{ opacity: 0, y: 12, rotateX: -3 }}
          animate={{ opacity: 1, y: 0, rotateX: 0 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="rounded-3xl overflow-hidden bg-gradient-to-br from-[#07112B]/96 via-[#0E2252]/95 to-[#1A43A8]/92 backdrop-blur-xl text-white p-5 sm:p-6 md:p-8 shadow-xl up-neon-rim up-neon-edge ring-1 ring-inset ring-white/10"
        >
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5 md:gap-6 items-center">
            <div className="md:col-span-8 space-y-3.5 sm:space-y-4">
              <div className="flex items-center gap-3 sm:gap-3.5">
                <img
                  src={UP_MONTAGE_ART}
                  alt="UP Mandate 2027 Emblem"
                  referrerPolicy="no-referrer"
                  className="w-13 h-13 sm:w-15 sm:h-15 rounded-2xl object-cover shadow-md border border-amber-300/50 bg-white/5 up-gold-rim shrink-0"
                />
                <div className="min-w-0">
                  <h2 className="font-display text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight truncate">
                    UP <span className="text-[#F59E0B] up-neon-text-gold">Mandate</span>
                  </h2>
                  <p className="text-xs sm:text-sm text-blue-100/90 truncate">{t.home.tagline}</p>
                </div>
              </div>
              <p className="text-xs sm:text-sm md:text-base text-blue-100/95 leading-relaxed max-w-2xl">
                {t.home.splashDesc}
              </p>
              <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2.5 sm:gap-3 pt-1">
                <button
                  type="button"
                  onClick={onOpenAuthModal}
                  className="inline-flex items-center justify-center gap-2.5 px-5 py-3 min-h-[44px] rounded-xl bg-gradient-to-r from-[#FF9933] via-[#F59E0B] to-amber-500 text-slate-950 font-display font-extrabold text-sm hover:from-amber-400 hover:to-amber-500 transition-all shadow-lg up-gold-rim up-md3-ripple cursor-pointer whitespace-nowrap"
                >
                  <Smartphone className="w-4 h-4 shrink-0" />
                  <span>{t.auth.continuePhone}</span>
                </button>

                <button
                  type="button"
                  onClick={onGoogleSignIn}
                  className="inline-flex items-center justify-center gap-2.5 px-5 py-3 min-h-[44px] rounded-xl bg-white text-slate-900 font-semibold text-sm hover:bg-blue-50 active:scale-[0.99] transition-all shadow-lg up-md3-ripple cursor-pointer whitespace-nowrap"
                >
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                    <path
                      fill="#4285F4"
                      d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17Z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.14C3.26 21.3 7.31 24 12 24Z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.28 14.24c-.24-.72-.38-1.49-.38-2.24s.14-1.52.38-2.24V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.99-3.14Z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.99 3.14c.95-2.85 3.6-4.96 6.72-4.96Z"
                    />
                  </svg>
                  <span>{t.auth.continueGoogle}</span>
                </button>

                <button
                  type="button"
                  onClick={onOpenLegal}
                  className="px-4 py-3 min-h-[44px] rounded-xl border border-white/25 text-xs font-medium text-blue-100 hover:bg-white/10 transition-colors up-md3-ripple cursor-pointer whitespace-nowrap text-center"
                >
                  {t.home.termsPrivacy}
                </button>
              </div>
            </div>

            <div className="md:col-span-4 hidden md:flex justify-end">
              <div className="rounded-2xl bg-white/10 backdrop-blur-sm border border-amber-300/25 p-4 w-full max-w-[275px] space-y-2.5">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-300">
                  <Gift className="w-4 h-4 shrink-0" />
                  <span>{t.home.civicTiers}</span>
                </div>
                <div className="text-xs text-blue-100 leading-relaxed">{t.home.civicTiersDesc}</div>
                <div className="pt-1.5 border-t border-white/15 text-[11px] text-cyan-200 font-mono-num">
                  {t.home.splashMeta}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Top Desktop Grid: User Profile + 3 KPIs */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 sm:gap-4 up-stage-3d">
        {/* User Identity & Cloud Sync Card */}
        <div className="lg:col-span-5 rounded-2xl up-glass-surface border border-amber-500/25 dark:border-cyan-400/20 ring-1 ring-inset ring-white/55 dark:ring-white/6 p-3.5 sm:p-5 flex flex-wrap sm:flex-nowrap items-center justify-between gap-3 sm:gap-4 up-md3-elev-1 up-card-3d">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            {userProfile?.photoURL ? (
              <img
                src={userProfile.photoURL}
                alt={userProfile.publicAlias}
                referrerPolicy="no-referrer"
                className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl object-cover border border-amber-300 dark:border-cyan-500/40 shrink-0"
              />
            ) : (
              <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br from-[#FF9933] via-[#1D4ED8] to-[#0F2766] text-white font-display font-bold text-sm sm:text-base flex items-center justify-center shrink-0 shadow-sm">
                {initials || 'UP'}
              </div>
            )}
            <div className="min-w-0">
              <div className="flex items-center gap-2 min-w-0 flex-wrap">
                <h2 className="font-display font-bold text-base sm:text-lg text-slate-900 dark:text-white truncate">
                  {isSignedIn ? userProfile?.publicAlias || userProfile?.displayName : t.auth.guestCitizen}
                </h2>
                {isSignedIn && userProfile && (
                  <span className="px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/70 border border-blue-200 dark:border-cyan-500/40 text-[10px] font-mono-num font-extrabold text-blue-700 dark:text-cyan-300 shrink-0">
                    ID: {getPublicContestantId(userProfile)}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                <CheckCircle2
                  className={`w-3.5 h-3.5 shrink-0 ${
                    isSignedIn ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600'
                  }`}
                />
                <span className="truncate">
                  {isSyncing
                    ? t.auth.syncingCloud
                    : isSignedIn
                    ? t.auth.syncedCloud
                    : t.auth.localDraft}
                </span>
              </div>
            </div>
          </div>

          <div className="shrink-0 inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-amber-50/90 dark:bg-amber-950/50 border border-amber-300/70 dark:border-amber-700/50 text-amber-800 dark:text-amber-300 text-xs font-semibold font-mono-num">
            <Crown className="w-3.5 h-3.5 text-amber-500" />
            <span>{userRankDisplay}</span>
          </div>
        </div>

        {/* 3 KPI Stat Cards */}
        <div className="lg:col-span-7 grid grid-cols-3 gap-2 sm:gap-4">
          <div className="rounded-2xl up-glass-surface border border-amber-500/25 dark:border-amber-400/20 ring-1 ring-inset ring-white/55 dark:ring-white/6 p-2.5 sm:p-4 flex flex-col items-center justify-center text-center up-md3-elev-1 up-card-3d">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-1.5 sm:mb-2">
              <Trophy className="w-4 h-4" />
            </div>
            <div className="font-display font-extrabold text-base sm:text-2xl text-slate-900 dark:text-white font-mono-num">
              {civicPoints}
            </div>
            <div className="text-[10px] sm:text-xs text-slate-600 dark:text-slate-400 mt-0.5 leading-tight">
              {t.home.civicPoints}
            </div>
          </div>

          <div className="rounded-2xl up-glass-surface border border-emerald-500/25 dark:border-emerald-400/20 ring-1 ring-inset ring-white/55 dark:ring-white/6 p-2.5 sm:p-4 flex flex-col items-center justify-center text-center up-md3-elev-1 up-card-3d">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-1.5 sm:mb-2">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div className="font-display font-extrabold text-base sm:text-2xl text-slate-900 dark:text-white font-mono-num">
              {overallPercent}%
            </div>
            <div className="text-[10px] sm:text-xs text-slate-600 dark:text-slate-400 mt-0.5 leading-tight">
              {t.home.completed}
            </div>
          </div>

          <div className="rounded-2xl up-glass-surface border border-cyan-500/25 dark:border-cyan-400/20 ring-1 ring-inset ring-white/55 dark:ring-white/6 p-2.5 sm:p-4 flex flex-col items-center justify-center text-center up-md3-elev-1 up-card-3d">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 flex items-center justify-center mb-1.5 sm:mb-2">
              <Clock className="w-4 h-4" />
            </div>
            <div className="font-display font-extrabold text-sm sm:text-2xl text-slate-900 dark:text-white font-mono-num whitespace-nowrap">
              {electionConfig.isLocked ? t.home.locked : countdownText}
            </div>
            <div className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-tight">
              {t.home.untilLock}
            </div>
          </div>
        </div>
      </div>

      {/* 3D Animated Free Tier & ₹50 Lakh Winner Prizes Showcase with Moving 3D Blue Line */}
      <PrizeShowcaseCard
        badgeFree={t.rewards.badgeFree}
        prizeSub={t.rewards.prizeSub}
        title={t.rewards.title}
        desc={t.rewards.desc}
        prizeAmount={t.rewards.prizeAmount}
        headline={t.rewards.headline}
        ctaLabel={t.rewards.ctaLeaderboard}
        onCtaClick={() => onNavigate('leaderboard', 'leaderboard')}
        variant="hero"
      />

      {/* Main Forecast Hero: UP Election 2027 3D Montage & Vidhan Bhawan Twilight + Seat Allocation */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch up-stage-3d">
        <motion.div
          animate={{ rotateX: heroTilt.rotateX, rotateY: heroTilt.rotateY }}
          transition={{ type: 'spring', stiffness: 190, damping: 22 }}
          onPointerMove={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const nx = (e.clientX - rect.left) / rect.width - 0.5;
            const ny = (e.clientY - rect.top) / rect.height - 0.5;
            setHeroTilt({ rotateX: -ny * 5, rotateY: nx * 6 });
          }}
          onPointerLeave={() => setHeroTilt({ rotateX: 0, rotateY: 0 })}
          style={{ transformStyle: 'preserve-3d' }}
          className="lg:col-span-7 rounded-3xl bg-[#08132E] text-white p-6 sm:p-7 relative overflow-hidden up-neon-rim up-neon-pulse up-neon-edge flex flex-col justify-between min-h-[320px]"
        >
          {/* Montage Backdrop Layer 1: UP Vidhan Bhawan Twilight */}
          <img
            src={upVidhanTwilightImg}
            alt="Uttar Pradesh Vidhan Bhawan and Rumi Darwaza at Twilight"
            referrerPolicy="no-referrer"
            className="absolute inset-0 w-full h-full object-cover object-center opacity-55 pointer-events-none select-none"
          />
          {/* Montage Backdrop Layer 2: User's UP Election 2027 Artwork blended cleanly into right side */}
          <img
            src={UP_MONTAGE_ART}
            alt=""
            aria-hidden="true"
            referrerPolicy="no-referrer"
            className="absolute right-0 inset-y-0 w-3/4 h-full object-cover object-center opacity-30 mix-blend-screen pointer-events-none select-none"
          />
          {/* Measured 4.5:1 Scrim Overlay */}
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-gradient-to-r from-[#050B1A]/95 via-[#091534]/85 to-[#091534]/55"
          />
          {/* Subtle Rumi Darwaza Arch Silhouette SVG Ornament */}
          <svg
            aria-hidden="true"
            viewBox="0 0 180 180"
            className="hidden sm:block absolute left-1/2 -translate-x-1/2 bottom-0 w-44 h-44 text-amber-300/12 pointer-events-none select-none"
            fill="none"
          >
            <path
              d="M20 180 V95 C20 55 55 24 90 12 C125 24 160 55 160 95 V180"
              stroke="currentColor"
              strokeWidth="1.8"
            />
            <path
              d="M42 180 V106 C42 74 65 48 90 36 C115 48 138 74 138 106 V180"
              stroke="currentColor"
              strokeWidth="1.2"
              strokeDasharray="4 4"
            />
          </svg>
          <div className="up-tiranga-bar absolute top-0 inset-x-0 opacity-95" aria-hidden="true" />

          {/* Split Interior: Left Editorial Copy + Actions / Right 3D Tilting Montage Showcase */}
          <div className="relative z-10 grid grid-cols-1 sm:grid-cols-12 gap-5 items-center flex-1 pt-2">
            {/* Mobile-first visual centerpiece appears sleekly on top on small phones, right on sm+ */}
            <div className="sm:col-span-7 order-2 sm:order-1 flex flex-col justify-between h-full space-y-4">
              <div className="space-y-2.5 sm:space-y-3" style={{ transform: 'translateZ(18px)' }}>
                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs font-semibold text-amber-300">
                  <span>{t.home.forecastTag}</span>
                  <span aria-hidden="true">·</span>
                  <span className="text-cyan-300">
                    {language === 'hi'
                      ? 'उत्तर प्रदेश · 75 जिले · 403 सीटें'
                      : 'Awadh to Purvanchal · 75 Districts'}
                  </span>
                </div>
                <h1 className="font-display text-2xl sm:text-3xl xl:text-4xl font-extrabold leading-tight text-balance drop-shadow-sm">
                  {t.home.heroTitle}
                </h1>
                <p className="text-xs sm:text-sm text-blue-100/95 leading-relaxed max-w-md">
                  {t.home.heroDesc}
                </p>
              </div>

              <div
                className="flex flex-col xs:flex-row sm:flex-row flex-wrap items-stretch sm:items-center gap-2.5 pt-1"
                style={{ transform: 'translateZ(24px)' }}
              >
                <button
                  type="button"
                  onClick={() => onNavigate('parties')}
                  className="inline-flex items-center justify-center gap-2 px-5 py-3 min-h-[44px] rounded-xl bg-gradient-to-r from-[#FF9933] to-[#F59E0B] hover:from-amber-400 hover:to-amber-500 text-slate-950 font-display font-extrabold text-sm transition-colors up-gold-rim up-md3-ripple cursor-pointer whitespace-nowrap"
                >
                  <span>{t.home.predictSeatsNow}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate('constituencies')}
                  className="inline-flex items-center justify-center gap-2 px-4 py-3 min-h-[44px] rounded-xl bg-white/15 hover:bg-white/25 text-white font-semibold text-sm border border-cyan-300/35 backdrop-blur-xs transition-colors up-md3-ripple cursor-pointer whitespace-nowrap"
                >
                  <span>{t.home.browse403Seats}</span>
                </button>
                <PWAInstallButton language={language} compact />
              </div>
            </div>

            {/* Right 3D Layered Montage Showcase (User Image + Vidhan Bhawan Accent) */}
            <div
              className="sm:col-span-5 order-1 sm:order-2 flex items-center justify-center sm:justify-end py-1"
              style={{ transform: 'translateZ(28px)' }}
            >
              <div className="relative w-36 h-36 sm:w-46 sm:h-46 lg:w-52 lg:h-52">
                {/* Back Tilted Vidhan Bhawan Card */}
                <div className="absolute -right-2.5 -bottom-2.5 w-full h-full rounded-3xl overflow-hidden border border-cyan-400/50 rotate-6 opacity-80 shadow-xl up-neon-cyan">
                  <img
                    src={upVidhanTwilightImg}
                    alt=""
                    aria-hidden="true"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                </div>
                {/* Primary 3D Floating UP Election Artwork Card */}
                <div className="relative w-full h-full rounded-3xl overflow-hidden border border-amber-300/60 bg-[#0B1736] shadow-2xl up-gold-rim up-neon-edge -rotate-2 hover:rotate-0 transition-transform duration-300 up-float-3d">
                  <img
                    src={UP_MONTAGE_ART}
                    alt="Uttar Pradesh Assembly Election 2027 Montage"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                  <div
                    aria-hidden="true"
                    className="absolute inset-0 bg-gradient-to-t from-[#050B1A]/35 via-transparent to-white/10 pointer-events-none"
                  />
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Current 2027 Seat Allocation Preview */}
        <div className="lg:col-span-5 rounded-3xl bg-white/95 dark:bg-[#0C1732]/95 backdrop-blur-md border border-amber-500/25 dark:border-cyan-400/20 p-5 sm:p-6 up-md3-elev-1 flex flex-col justify-between">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div>
              <h3 className="font-display font-bold text-base text-slate-900 dark:text-white">
                {t.home.currentAllocationTitle}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {t.home.allocationSub(completedSeats)}
              </p>
            </div>
            <span
              className={`px-3 py-1 rounded-lg text-xs font-bold font-mono-num whitespace-nowrap ${
                allocated === TOTAL_UP_SEATS
                  ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300'
                  : allocated > TOTAL_UP_SEATS
                  ? 'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300'
                  : 'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300'
              }`}
            >
              {allocated} / {TOTAL_UP_SEATS}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2.5">
            {parties
              .filter((p) => p.active)
              .sort((a, b) => {
                const diff =
                  getBandDisplaySeats(prediction.partyBands[b.code] ?? 0) -
                  getBandDisplaySeats(prediction.partyBands[a.code] ?? 0);
                return diff !== 0 ? diff : a.order - b.order;
              })
              .map((party) => {
                const bandStart = prediction.partyBands[party.code] ?? 0;
                const band = getBandByStart(bandStart);
                const val = getBandDisplaySeats(bandStart);
                const pct = Math.min(100, Math.round((val / TOTAL_UP_SEATS) * 100));
                return (
                  <div key={party.code} className="space-y-1">
                    <div className="flex items-center justify-between text-[11px] font-semibold gap-1">
                      <span className="text-slate-800 dark:text-slate-200 flex items-center gap-1.5 truncate">
                        <span
                          className="w-2 h-2 rounded-full inline-block shrink-0"
                          style={{ backgroundColor: party.color }}
                        />
                        <span className="truncate">{party.shortName || party.code}</span>
                      </span>
                      <span className="font-mono-num text-slate-600 dark:text-slate-300 shrink-0">
                        {band.label} ({val})
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{ width: `${pct}%`, backgroundColor: party.color }}
                      />
                    </div>
                  </div>
                );
              })}
          </div>

          <button
            type="button"
            onClick={() => onNavigate('parties')}
            className="mt-5 w-full py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/70 transition-colors up-md3-ripple cursor-pointer"
          >
            {t.home.adjustBands}
          </button>
        </div>
      </div>

      {/* Quick Access Strip */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-display font-bold text-base text-slate-900 dark:text-white">
            {t.home.quickAccess}
          </h3>
          <span className="text-xs text-slate-500 dark:text-slate-400 font-mono-num">
            {t.home.districtsSub}
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 up-stage-3d">
          <button
            type="button"
            onClick={() => onNavigate('parties')}
            className="rounded-2xl bg-white/95 dark:bg-[#0C1732]/95 backdrop-blur-md border border-amber-500/25 dark:border-slate-800 p-4 flex flex-col items-center gap-2.5 hover:border-amber-500 dark:hover:border-amber-400 transition-all up-md3-elev-1 up-md3-ripple up-card-3d cursor-pointer"
          >
            <div className="w-11 h-11 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <PieChart className="w-5 h-5" />
            </div>
            <span className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200">
              {t.home.quickPartySeats}
            </span>
          </button>

          <button
            type="button"
            onClick={() => onNavigate('alliances')}
            className="rounded-2xl bg-white/95 dark:bg-[#0C1732]/95 backdrop-blur-md border border-orange-500/25 dark:border-slate-800 p-4 flex flex-col items-center gap-2.5 hover:border-orange-500 dark:hover:border-orange-400 transition-all up-md3-elev-1 up-md3-ripple up-card-3d cursor-pointer"
          >
            <div className="w-11 h-11 rounded-xl bg-orange-50 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 flex items-center justify-center">
              <GitMerge className="w-5 h-5" />
            </div>
            <span className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200">
              {t.home.quickAlliances}
            </span>
          </button>

          <button
            type="button"
            onClick={() => onNavigate('constituencies')}
            className="rounded-2xl bg-white/95 dark:bg-[#0C1732]/95 backdrop-blur-md border border-cyan-500/25 dark:border-slate-800 p-4 flex flex-col items-center gap-2.5 hover:border-cyan-500 dark:hover:border-cyan-400 transition-all up-md3-elev-1 up-md3-ripple up-card-3d cursor-pointer"
          >
            <div className="w-11 h-11 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-cyan-400 flex items-center justify-center">
              <MapPin className="w-5 h-5" />
            </div>
            <span className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200">
              {t.home.quickSeats403}
            </span>
          </button>

          <button
            type="button"
            onClick={() => onNavigate('leaderboard', 'leaderboard')}
            className="rounded-2xl bg-white/95 dark:bg-[#0C1732]/95 backdrop-blur-md border border-amber-500/25 dark:border-slate-800 p-4 flex flex-col items-center gap-2.5 hover:border-amber-500 dark:hover:border-amber-400 transition-all up-md3-elev-1 up-md3-ripple up-card-3d cursor-pointer"
          >
            <div className="w-11 h-11 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Trophy className="w-5 h-5" />
            </div>
            <span className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200">
              {t.home.quickRankings}
            </span>
          </button>

          <button
            type="button"
            onClick={() => onNavigate('leaderboard', 'summary')}
            className="col-span-2 sm:col-span-1 rounded-2xl bg-white/95 dark:bg-[#0C1732]/95 backdrop-blur-md border border-emerald-500/25 dark:border-slate-800 p-4 flex flex-col items-center gap-2.5 hover:border-emerald-500 dark:hover:border-emerald-400 transition-all up-md3-elev-1 up-md3-ripple up-card-3d cursor-pointer"
          >
            <div className="w-11 h-11 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
            <span className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200">
              {t.home.quickSummary}
            </span>
          </button>
        </div>
      </div>

      {/* Security & Civic Protection Bar + Independent Legal Compliance Card */}
      <div className="rounded-2xl bg-white/95 dark:bg-[#0C1732]/95 backdrop-blur-md border border-emerald-500/25 dark:border-cyan-400/20 p-4 space-y-2.5 up-md3-elev-1 up-neon-emerald">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-semibold text-emerald-800 dark:text-emerald-300">
          <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>
            {language === 'hi'
              ? 'Firebase एन्क्रिप्टेड सुरक्षा'
              : 'Firebase Encrypted Sync'}
          </span>
          <span aria-hidden="true" className="text-slate-400">·</span>
          <span>
            {language === 'hi'
              ? '403 सत्यापित ECI विधानसभा क्षेत्र'
              : '403 Verified ECI Constituencies'}
          </span>
          <span aria-hidden="true" className="text-slate-400">·</span>
          <span>
            {language === 'hi'
              ? 'धारा 126 RP Act अनुपालन'
              : 'Section 126 RP Act Compliant'}
          </span>
          <span aria-hidden="true" className="text-slate-400">·</span>
          <span>
            {language === 'hi'
              ? '100% निःशुल्क भागीदारी'
              : '100% Free Civic Participation'}
          </span>
        </div>

        <div className="pt-2.5 border-t border-slate-200/70 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs text-slate-700 dark:text-slate-300">
          <span>{t.home.footerNotice}</span>
          <button
            type="button"
            onClick={onOpenLegal}
            className="text-blue-600 dark:text-cyan-400 font-semibold hover:underline whitespace-nowrap flex items-center gap-1 cursor-pointer shrink-0"
          >
            <BarChart3 className="w-3.5 h-3.5" />
            {t.home.legalScoringBtn}
          </button>
        </div>
      </div>
      </div>
    </div>
  );
};
