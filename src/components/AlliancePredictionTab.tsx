import React, { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CloudUpload,
  GitMerge,
  History,
  Lock,
  RotateCcw,
  SlidersHorizontal,
  Sparkles,
} from 'lucide-react';
import {
  AllianceConfig,
  AppLanguage,
  ElectionConfigData,
  ElectionYear,
  HistoricalYear,
  UserPredictionData,
} from '../types/election';
import {
  SEAT_BANDS,
  TOTAL_UP_SEATS,
  getBandByStart,
  getBandDisplaySeats,
  getPartyColor,
  getPartyMeta,
} from '../data/upParties';
import {
  DEFAULT_ALLIANCE_BANDS,
  UP_ALLIANCES,
  deriveAllianceBandsFromPartyBands,
  getHistoricalAllianceSeats,
  snapSeatsToBandStart,
} from '../data/upAlliances';
import { TRANSLATIONS } from '../i18n/translations';
import { ChartSegment, DoughnutChart3D } from './DoughnutChart3D';

interface AlliancePredictionTabProps {
  prediction: UserPredictionData;
  electionConfig: ElectionConfigData;
  isSignedIn: boolean;
  isSaving: boolean;
  language: AppLanguage;
  onUpdateAllianceBands: (nextBands: Record<string, number>, saveToCloud?: boolean) => Promise<void>;
  onGoogleSignIn: () => void;
}

const YEARS: ElectionYear[] = ['2007', '2012', '2017', '2022', '2027'];

export const AlliancePredictionTab: React.FC<AlliancePredictionTabProps> = ({
  prediction,
  electionConfig,
  isSignedIn,
  isSaving,
  language,
  onUpdateAllianceBands,
  onGoogleSignIn,
}) => {
  const t = TRANSLATIONS[language].alliances;

  const [selectedYear, setSelectedYear] = useState<ElectionYear>('2027');
  const [selectedAllianceCode, setSelectedAllianceCode] = useState<string>(UP_ALLIANCES[0].code);
  const [showAllBands, setShowAllBands] = useState(false);
  const [saveBanner, setSaveBanner] = useState<string | null>(null);

  const isHistorical = selectedYear !== '2027';
  const isLocked = electionConfig.isLocked;

  const selectedAlliance: AllianceConfig =
    UP_ALLIANCES.find((a) => a.code === selectedAllianceCode) || UP_ALLIANCES[0];

  const currentBands = prediction.allianceBands || DEFAULT_ALLIANCE_BANDS;

  const segments: ChartSegment[] = useMemo(() => {
    return UP_ALLIANCES.map((alliance) => {
      const displayName = language === 'hi' ? alliance.shortHi : alliance.shortEn;
      if (isHistorical) {
        const seats = getHistoricalAllianceSeats(alliance, selectedYear as HistoricalYear);
        return {
          code: alliance.code,
          name: displayName,
          color: alliance.color,
          seats,
          rangeLabel: `${seats}`,
        };
      }
      const bandStart = currentBands[alliance.code] ?? 0;
      const band = getBandByStart(bandStart);
      const seats = getBandDisplaySeats(bandStart);
      return {
        code: alliance.code,
        name: displayName,
        color: alliance.color,
        seats,
        rangeLabel: `${band.label} (${seats})`,
      };
    });
  }, [isHistorical, selectedYear, currentBands, language]);

  const totalAllocated = useMemo(
    () => segments.reduce((sum, s) => sum + s.seats, 0),
    [segments],
  );

  const currentBandStart = currentBands[selectedAlliance.code] ?? 0;
  const currentBand = getBandByStart(currentBandStart);

  const partyDerivedSums = useMemo(() => {
    const map: Record<string, number> = {};
    UP_ALLIANCES.forEach((alliance) => {
      map[alliance.code] = alliance.partyCodes.reduce(
        (sum, pCode) => sum + getBandDisplaySeats(prediction.partyBands[pCode] ?? 0),
        0,
      );
    });
    return map;
  }, [prediction.partyBands]);

  const handleSetBandIndex = (newIndex: number) => {
    if (isLocked) return;
    const clampedIdx = Math.max(0, Math.min(SEAT_BANDS.length - 1, newIndex));
    const nextStart = SEAT_BANDS[clampedIdx].start;
    const nextBands = {
      ...currentBands,
      [selectedAlliance.code]: nextStart,
    };
    setSaveBanner(null);
    void onUpdateAllianceBands(nextBands, false);
  };

  const handleSyncFromParties = () => {
    if (isLocked) return;
    const derived = deriveAllianceBandsFromPartyBands(prediction.partyBands);
    setSaveBanner(null);
    void onUpdateAllianceBands(derived, false);
  };

  const handleAutoBalance = () => {
    if (isLocked) return;
    const otherCode = 'OTH_IND';
    const sumWithoutOther = UP_ALLIANCES.reduce((sum, alliance) => {
      if (alliance.code === otherCode) return sum;
      return sum + getBandDisplaySeats(currentBands[alliance.code] ?? 0);
    }, 0);
    const remaining = Math.max(0, TOTAL_UP_SEATS - sumWithoutOther);
    const nextBands = {
      ...currentBands,
      [otherCode]: snapSeatsToBandStart(remaining),
    };
    setSaveBanner(null);
    void onUpdateAllianceBands(nextBands, false);
  };

  const handleResetBands = () => {
    if (isLocked) return;
    const zeroed: Record<string, number> = {};
    UP_ALLIANCES.forEach((a) => {
      zeroed[a.code] = 0;
    });
    setSaveBanner(null);
    void onUpdateAllianceBands(zeroed, false);
  };

  const handleSaveCloud = async () => {
    if (isLocked) return;
    await onUpdateAllianceBands(currentBands, true);
    setSaveBanner(
      isSignedIn
        ? language === 'hi'
          ? `${totalAllocated} / ${TOTAL_UP_SEATS} गठबंधन सीट बैंड Firebase क्लाउड में सहेजे गए।`
          : `Saved ${totalAllocated} / ${TOTAL_UP_SEATS} alliance seat bands to Firebase Cloud.`
        : language === 'hi'
        ? 'लोकल रूप से सहेजा गया। क्लाउड सिंक के लिए मोबाइल OTP या Google से साइन इन करें।'
        : 'Saved locally. Sign in with Mobile OTP or Google to sync to Firebase Cloud.',
    );
  };

  const remainingSeats = TOTAL_UP_SEATS - totalAllocated;

  return (
    <div className="space-y-5">
      {/* Year Toggle Bar (2007 | 2012 | 2017 | 2022 | 2027 Predict) */}
      <div className="rounded-2xl bg-white dark:bg-[#0F1B35] border border-slate-200/80 dark:border-slate-800 p-2 up-md3-elev-1">
        <div className="grid grid-cols-5 gap-1.5">
          {YEARS.map((yr) => {
            const active = selectedYear === yr;
            const isPredict = yr === '2027';
            return (
              <button
                key={yr}
                type="button"
                onClick={() => setSelectedYear(yr)}
                className={`py-2.5 px-2 rounded-xl text-center transition-all up-md3-ripple cursor-pointer ${
                  active
                    ? 'bg-[#0A1633] dark:bg-[#1D4ED8] text-white up-neon-rim'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/70'
                }`}
              >
                <div className="font-display font-bold text-sm font-mono-num">{yr}</div>
                {isPredict && (
                  <div
                    className={`text-[10px] font-semibold tracking-wide ${
                      active ? 'text-[#F59E0B]' : 'text-blue-600 dark:text-blue-400'
                    }`}
                  >
                    {t.predictLabel}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Layout: Chart Card + Alliance Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left: Doughnut Chart & Alliance Breakdown */}
        <div className="lg:col-span-5 rounded-3xl bg-white dark:bg-[#0F1B35] border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 up-md3-elev-1">
          <div className="flex items-start justify-between gap-3 mb-5">
            <div>
              <h2 className="font-display font-bold text-lg sm:text-xl text-slate-900 dark:text-white leading-tight">
                {isHistorical ? t.histTitle(selectedYear) : t.predictTitle}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {isHistorical ? t.histSub : t.predictSub}
              </p>
            </div>
            <span className="px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 text-xs font-semibold whitespace-nowrap shrink-0">
              {isHistorical ? t.historicalChip : t.bandChip}
            </span>
          </div>

          <div className="flex flex-col sm:flex-row lg:flex-col xl:flex-row items-center gap-6">
            <DoughnutChart3D
              segments={segments}
              selectedPartyCode={selectedAlliance.code}
              onSelectParty={(code) => {
                setSelectedAllianceCode(code);
                if (isHistorical) setSelectedYear('2027');
              }}
              centerLabel={String(totalAllocated)}
              centerSublabel={isHistorical ? t.totalSeatsLabel : t.allocatedLabel}
              size={196}
            />

            <div className="flex-1 w-full space-y-2">
              {UP_ALLIANCES.map((alliance) => {
                const isSelected = !isHistorical && selectedAlliance.code === alliance.code;
                const label = language === 'hi' ? alliance.shortHi : alliance.shortEn;
                const seats = isHistorical
                  ? getHistoricalAllianceSeats(alliance, selectedYear as HistoricalYear)
                  : getBandDisplaySeats(currentBands[alliance.code] ?? 0);
                const band = getBandByStart(currentBands[alliance.code] ?? 0);
                return (
                  <button
                    key={alliance.code}
                    type="button"
                    onClick={() => {
                      setSelectedAllianceCode(alliance.code);
                      if (isHistorical) setSelectedYear('2027');
                    }}
                    className={`w-full flex items-center justify-between gap-2 text-left px-3 py-2 rounded-xl transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-blue-50 dark:bg-blue-950/60 ring-1 ring-blue-300 dark:ring-blue-700'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-100">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: alliance.color }}
                        />
                        <span className="truncate">{label}</span>
                      </div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate pl-4.5">
                        {language === 'hi' ? alliance.formulaHi : alliance.formulaEn}
                      </div>
                    </div>
                    <span className="text-xs font-mono-num font-bold text-slate-800 dark:text-slate-200 shrink-0">
                      {isHistorical ? seats : `${band.label}`}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Majority Context Bar */}
          <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-500 dark:text-slate-400">
              {t.majorityLabel}{' '}
              <strong className="text-slate-800 dark:text-slate-200 font-mono-num">202 / 403</strong>
            </span>
            {!isHistorical && (
              <span
                className={`font-mono-num font-bold ${
                  remainingSeats === 0
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : remainingSeats < 0
                    ? 'text-rose-600 dark:text-rose-400'
                    : 'text-blue-600 dark:text-blue-400'
                }`}
              >
                {remainingSeats === 0
                  ? t.exactBalanced
                  : remainingSeats > 0
                  ? t.unallocatedCount(remainingSeats)
                  : t.overCount(Math.abs(remainingSeats))}
              </span>
            )}
          </div>
        </div>

        {/* Right: Interactive Alliance Selector + 5-Seat Band Controls */}
        <div className="lg:col-span-7 space-y-4">
          {isHistorical ? (
            <div className="rounded-3xl bg-white dark:bg-[#0F1B35] border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 up-md3-elev-1 space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <History className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  <h3 className="font-display font-bold text-base sm:text-lg text-slate-900 dark:text-white">
                    {t.perfTitle(selectedYear)}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedYear('2027')}
                  className="px-4 py-2 rounded-xl bg-[#1D4ED8] hover:bg-blue-700 text-white text-xs font-semibold transition-colors up-md3-ripple cursor-pointer"
                >
                  {t.predict2027Btn}
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {UP_ALLIANCES.map((alliance) => {
                  const seats = getHistoricalAllianceSeats(
                    alliance,
                    selectedYear as HistoricalYear,
                  );
                  const sharePct = Math.round((seats / TOTAL_UP_SEATS) * 100);
                  const title = language === 'hi' ? alliance.nameHi : alliance.nameEn;
                  const formula = language === 'hi' ? alliance.formulaHi : alliance.formulaEn;
                  return (
                    <div
                      key={alliance.code}
                      className="rounded-2xl border border-slate-200 dark:border-slate-800 p-4 bg-slate-50/70 dark:bg-slate-900/50 space-y-2.5"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span
                              className="w-3 h-3 rounded-full shrink-0"
                              style={{ backgroundColor: alliance.color }}
                            />
                            <span className="font-display font-bold text-sm text-slate-900 dark:text-white truncate">
                              {title}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                            {formula}
                          </div>
                        </div>
                        <span className="font-mono-num font-bold text-lg text-slate-900 dark:text-white shrink-0">
                          {seats}
                        </span>
                      </div>

                      <div className="flex -space-x-2 pt-0.5">
                        {alliance.partyCodes.map((pCode) => {
                          const meta = getPartyMeta(pCode);
                          if (!meta?.leaderPhotoUrl) return null;
                          return (
                            <img
                              key={pCode}
                              src={meta.leaderPhotoUrl}
                              alt={meta.leaderEn}
                              title={`${meta.shortEn} · ${meta.leaderEn}`}
                              className="w-8 h-8 rounded-full object-cover object-top ring-2 ring-white dark:ring-slate-900"
                            />
                          );
                        })}
                      </div>

                      <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${sharePct}%`, backgroundColor: alliance.color }}
                        />
                      </div>
                      <div className="flex justify-between text-[11px] text-slate-500 dark:text-slate-400 font-mono-num">
                        <span>{t.seatShare(sharePct)}</span>
                        <span>2022: {alliance.results2022}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="rounded-3xl bg-white dark:bg-[#0F1B35] border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 up-md3-elev-1 space-y-5">
              {isLocked && (
                <div className="rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 p-3 flex items-center gap-2.5 text-xs text-rose-700 dark:text-rose-300 font-medium">
                  <Lock className="w-4 h-4 shrink-0" />
                  Predictions are currently locked by the election deadline configuration.
                </div>
              )}

              {/* Step 1: Select Political Alliance / Front */}
              <div>
                <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                  <span className="text-xs font-bold tracking-wider uppercase text-slate-500 dark:text-slate-400">
                    {t.tapAllianceStep}
                  </span>
                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={handleSyncFromParties}
                      disabled={isLocked}
                      className="text-xs font-semibold text-amber-600 dark:text-amber-400 hover:underline disabled:opacity-40 flex items-center gap-1 cursor-pointer"
                    >
                      <GitMerge className="w-3.5 h-3.5" />
                      {t.syncFromParties}
                    </button>
                    <button
                      type="button"
                      onClick={handleAutoBalance}
                      disabled={isLocked}
                      className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline disabled:opacity-40 flex items-center gap-1 cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      {t.autoBalance}
                    </button>
                    <button
                      type="button"
                      onClick={handleResetBands}
                      disabled={isLocked}
                      className="text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 disabled:opacity-40 flex items-center gap-1 cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      {t.reset}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 up-stage-3d">
                  {UP_ALLIANCES.map((alliance) => {
                    const isSelected = selectedAlliance.code === alliance.code;
                    const band = getBandByStart(currentBands[alliance.code] ?? 0);
                    const seats = getBandDisplaySeats(band.start);
                    const title = language === 'hi' ? alliance.nameHi : alliance.nameEn;
                    const formula = language === 'hi' ? alliance.formulaHi : alliance.formulaEn;
                    const partySum = partyDerivedSums[alliance.code] ?? 0;

                    return (
                      <button
                        key={alliance.code}
                        type="button"
                        onClick={() => setSelectedAllianceCode(alliance.code)}
                        style={
                          isSelected
                            ? {
                                borderColor: alliance.color,
                                boxShadow: `0 0 0 2px ${alliance.color}, 0 12px 24px -10px ${alliance.color}88`,
                              }
                            : undefined
                        }
                        className={`rounded-2xl p-4 text-left transition-all border-2 up-card-3d up-md3-ripple cursor-pointer ${
                          isSelected
                            ? 'bg-gradient-to-br from-[#0A1633] via-[#10255A] to-[#0F1B35] text-white'
                            : 'bg-slate-50/85 dark:bg-slate-900/60 border-slate-200/80 dark:border-slate-700/80 hover:border-blue-400'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span
                                className="w-3 h-3 rounded-full shrink-0 ring-2 ring-white/70"
                                style={{ backgroundColor: alliance.color }}
                              />
                              <span
                                className={`font-display font-extrabold text-base truncate ${
                                  isSelected ? 'text-white' : 'text-slate-900 dark:text-white'
                                }`}
                              >
                                {title}
                              </span>
                            </div>
                            <p
                              className={`text-[11px] font-medium mt-1 leading-snug ${
                                isSelected
                                  ? 'text-blue-100/90'
                                  : 'text-slate-600 dark:text-slate-300'
                              }`}
                            >
                              {formula}
                            </p>
                          </div>

                          <span
                            className={`px-2.5 py-1 rounded-lg text-xs font-mono-num font-bold shrink-0 ${
                              isSelected
                                ? 'bg-[#F59E0B] text-slate-950'
                                : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700'
                            }`}
                          >
                            {band.label}
                          </span>
                        </div>

                        {/* Member Party Badges + Leader Avatars */}
                        <div className="mt-3.5 flex items-center justify-between gap-2">
                          <div className="flex -space-x-2">
                            {alliance.partyCodes.map((pCode) => {
                              const meta = getPartyMeta(pCode);
                              if (!meta?.leaderPhotoUrl) {
                                return (
                                  <span
                                    key={pCode}
                                    className="w-9 h-9 rounded-full bg-slate-700 text-white text-[9px] font-bold flex items-center justify-center ring-2 ring-white dark:ring-slate-900"
                                    title={meta?.shortEn || pCode}
                                  >
                                    {pCode}
                                  </span>
                                );
                              }
                              return (
                                <img
                                  key={pCode}
                                  src={meta.leaderPhotoUrl}
                                  alt={meta.leaderEn}
                                  title={`${meta.shortEn} · ${language === 'hi' ? meta.leaderHi : meta.leaderEn}`}
                                  className="w-9 h-9 rounded-full object-cover object-top ring-2 ring-white dark:ring-slate-900"
                                />
                              );
                            })}
                          </div>

                          <div className="text-right">
                            <div
                              className={`text-xs font-mono-num font-bold ${
                                isSelected ? 'text-amber-300' : 'text-slate-800 dark:text-slate-200'
                              }`}
                            >
                              ~{seats} {language === 'hi' ? 'सीटें' : 'seats'}
                            </div>
                            <div
                              className={`text-[10px] font-mono-num ${
                                isSelected ? 'text-blue-200/80' : 'text-slate-500 dark:text-slate-400'
                              }`}
                            >
                              {t.partySumHint(partySum)}
                            </div>
                          </div>
                        </div>

                        <div className="mt-2.5 flex flex-wrap gap-1">
                          {alliance.partyCodes.map((pCode) => {
                            const meta = getPartyMeta(pCode);
                            return (
                              <span
                                key={pCode}
                                className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-semibold ${
                                  isSelected
                                    ? 'bg-white/10 text-white border border-white/15'
                                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                                }`}
                              >
                                <span
                                  className="w-1.5 h-1.5 rounded-full"
                                  style={{ backgroundColor: getPartyColor(pCode) }}
                                />
                                {language === 'hi' ? meta?.shortHi || pCode : meta?.shortEn || pCode}
                              </span>
                            );
                          })}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Step 2: 5-Seat Band Selector for Selected Alliance */}
              <div className="rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 p-4 sm:p-5 space-y-4">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className="w-3.5 h-3.5 rounded-full shrink-0"
                      style={{ backgroundColor: selectedAlliance.color }}
                    />
                    <div className="min-w-0">
                      <h4 className="font-display font-bold text-sm sm:text-base text-slate-900 dark:text-white truncate">
                        {language === 'hi' ? selectedAlliance.nameHi : selectedAlliance.nameEn}
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                        {t.constituentsLabel}{' '}
                        {language === 'hi'
                          ? selectedAlliance.formulaHi
                          : selectedAlliance.formulaEn}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400 whitespace-nowrap">
                    {t.bandOf5}
                  </span>
                </div>

                {/* Stepper Controls */}
                <div className="flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => handleSetBandIndex(currentBand.index - 1)}
                    disabled={isLocked || currentBand.index <= 0}
                    aria-label="Decrease alliance 5-seat band"
                    className="w-12 h-12 rounded-2xl bg-white dark:bg-[#0F1B35] border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-800 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 transition-colors up-md3-elev-1 up-md3-ripple cursor-pointer shrink-0"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>

                  <motion.div
                    key={`${selectedAlliance.code}_${currentBand.label}`}
                    initial={{ opacity: 0.75, scale: 0.96, rotateX: -8 }}
                    animate={{ opacity: 1, scale: 1, rotateX: 0 }}
                    transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                    className="flex-1 rounded-2xl bg-white dark:bg-[#0F1B35] border border-slate-200 dark:border-slate-700 py-3 px-4 text-center up-md3-elev-1"
                  >
                    <div className="font-display font-extrabold text-2xl sm:text-3xl text-slate-900 dark:text-white font-mono-num">
                      {currentBand.label}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-mono-num">
                      {t.allocatedSeatsSub(
                        getBandDisplaySeats(currentBand.start),
                        selectedAlliance.results2022,
                      )}
                    </div>
                  </motion.div>

                  <button
                    type="button"
                    onClick={() => handleSetBandIndex(currentBand.index + 1)}
                    disabled={isLocked || currentBand.index >= SEAT_BANDS.length - 1}
                    aria-label="Increase alliance 5-seat band"
                    className="w-12 h-12 rounded-2xl bg-white dark:bg-[#0F1B35] border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-800 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 transition-colors up-md3-elev-1 up-md3-ripple cursor-pointer shrink-0"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>

                {/* Smooth 5-Seat Step Slider */}
                <div className="space-y-2 pt-1">
                  <input
                    type="range"
                    min={0}
                    max={SEAT_BANDS.length - 1}
                    step={1}
                    value={currentBand.index}
                    disabled={isLocked}
                    onChange={(e) => handleSetBandIndex(Number(e.target.value))}
                    aria-label={`Select 5-seat prediction band for ${selectedAlliance.nameEn}`}
                    className="w-full up-slider"
                  />
                  <div className="flex justify-between text-[11px] text-slate-500 dark:text-slate-400 font-mono-num">
                    <span>0–4</span>
                    <span>100–104</span>
                    <span>200–204 (202)</span>
                    <span>300–304</span>
                    <span>400–403</span>
                  </div>
                </div>

                {/* Toggle Quick 81-Band Grid */}
                <div>
                  <button
                    type="button"
                    onClick={() => setShowAllBands((prev) => !prev)}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5" />
                    {showAllBands ? t.hideAllBands : t.showAllBands}
                  </button>

                  {showAllBands && (
                    <div className="max-h-56 overflow-y-auto grid grid-cols-4 sm:grid-cols-6 gap-1.5 mt-3 pr-1">
                      {SEAT_BANDS.map((band) => {
                        const isCurrent = band.index === currentBand.index;
                        return (
                          <button
                            key={band.index}
                            type="button"
                            disabled={isLocked}
                            onClick={() => handleSetBandIndex(band.index)}
                            className={`py-2 px-1.5 rounded-lg text-[11px] font-mono-num font-semibold transition-colors cursor-pointer ${
                              isCurrent
                                ? 'bg-[#1D4ED8] text-white shadow-sm'
                                : 'bg-white dark:bg-[#0F1B35] border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-blue-400'
                            }`}
                          >
                            {band.label}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Validation & Save Action */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
                <div className="text-xs text-slate-600 dark:text-slate-300">
                  {totalAllocated > TOTAL_UP_SEATS ? (
                    <span className="text-rose-600 dark:text-rose-400 font-semibold">
                      {t.overWarning(totalAllocated)}
                    </span>
                  ) : (
                    <span>
                      {t.totalAllocatedPrefix}{' '}
                      <strong className="font-mono-num">{totalAllocated} / 403</strong>
                    </span>
                  )}
                </div>

                {isSignedIn ? (
                  <button
                    type="button"
                    disabled={isLocked || isSaving || totalAllocated > TOTAL_UP_SEATS}
                    onClick={handleSaveCloud}
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#1D4ED8] hover:bg-blue-700 disabled:opacity-50 text-white font-display font-bold text-sm transition-all up-neon-rim up-md3-ripple cursor-pointer"
                  >
                    <CloudUpload className="w-4 h-4" />
                    <span>{isSaving ? t.savingCloud : t.saveCloud}</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={onGoogleSignIn}
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#0A1633] hover:bg-[#10255A] text-white font-display font-bold text-sm transition-all up-neon-rim up-md3-ripple cursor-pointer"
                  >
                    <CloudUpload className="w-4 h-4 text-[#F59E0B]" />
                    <span>{t.signInSave}</span>
                  </button>
                )}
              </div>

              {saveBanner && (
                <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 p-3 flex items-center gap-2 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{saveBanner}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
