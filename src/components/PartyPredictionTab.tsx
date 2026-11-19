import React, { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CloudUpload,
  History,
  Lock,
  RotateCcw,
  SlidersHorizontal,
  Sparkles,
} from 'lucide-react';
import {
  AppLanguage,
  ElectionConfigData,
  ElectionYear,
  HistoricalYear,
  PartyConfig,
  UserPredictionData,
} from '../types/election';
import {
  SEAT_BANDS,
  TOTAL_UP_SEATS,
  getBandByStart,
  getBandDisplaySeats,
  getHistoricalPartySeats,
  getPartyMeta,
} from '../data/upParties';
import { TRANSLATIONS } from '../i18n/translations';
import { ChartSegment, DoughnutChart3D } from './DoughnutChart3D';

interface PartyPredictionTabProps {
  parties: PartyConfig[];
  prediction: UserPredictionData;
  electionConfig: ElectionConfigData;
  isSignedIn: boolean;
  isSaving: boolean;
  language: AppLanguage;
  onUpdatePartyBands: (nextBands: Record<string, number>, saveToCloud?: boolean) => Promise<void>;
  onGoogleSignIn: () => void;
}

const YEARS: ElectionYear[] = ['2007', '2012', '2017', '2022', '2027'];

export const PartyPredictionTab: React.FC<PartyPredictionTabProps> = ({
  parties,
  prediction,
  electionConfig,
  isSignedIn,
  isSaving,
  language,
  onUpdatePartyBands,
  onGoogleSignIn,
}) => {
  const t = TRANSLATIONS[language].parties;
  const activeParties = useMemo(
    () => [...parties].filter((p) => p.active).sort((a, b) => a.order - b.order),
    [parties],
  );

  const [selectedYear, setSelectedYear] = useState<ElectionYear>('2027');
  const [selectedPartyCode, setSelectedPartyCode] = useState<string>(activeParties[0]?.code || 'BJP');
  const [showAllBands, setShowAllBands] = useState(false);
  const [saveBanner, setSaveBanner] = useState<string | null>(null);

  const isHistorical = selectedYear !== '2027';
  const isLocked = electionConfig.isLocked;

  const selectedParty =
    activeParties.find((p) => p.code === selectedPartyCode) || activeParties[0];

  const currentBands = prediction.partyBands;

  const segments: ChartSegment[] = useMemo(() => {
    return activeParties.map((p) => {
      if (isHistorical) {
        const seats = getHistoricalPartySeats(p, selectedYear as HistoricalYear);
        return {
          code: p.code,
          name: p.shortName,
          color: p.color,
          seats,
          rangeLabel: `${seats}`,
        };
      }
      const bandStart = currentBands[p.code] ?? 0;
      const band = getBandByStart(bandStart);
      const seats = getBandDisplaySeats(bandStart);
      return {
        code: p.code,
        name: p.shortName,
        color: p.color,
        seats,
        rangeLabel: `${band.label} (${seats})`,
      };
    });
  }, [activeParties, isHistorical, selectedYear, currentBands]);

  const totalAllocated = useMemo(
    () => segments.reduce((sum, s) => sum + s.seats, 0),
    [segments],
  );

  const currentBandStart = currentBands[selectedParty?.code || 'BJP'] ?? 0;
  const currentBand = getBandByStart(currentBandStart);

  const handleSetBandIndex = (newIndex: number) => {
    if (isLocked || !selectedParty) return;
    const clampedIdx = Math.max(0, Math.min(SEAT_BANDS.length - 1, newIndex));
    const nextStart = SEAT_BANDS[clampedIdx].start;
    const nextBands = {
      ...currentBands,
      [selectedParty.code]: nextStart,
    };
    setSaveBanner(null);
    void onUpdatePartyBands(nextBands, false);
  };

  const handleAutoBalance = () => {
    if (isLocked) return;
    const otherPartyCode =
      activeParties.find((p) => p.code === 'OTH')?.code || activeParties[activeParties.length - 1]?.code;
    if (!otherPartyCode) return;

    const sumWithoutOther = activeParties.reduce((sum, p) => {
      if (p.code === otherPartyCode) return sum;
      return sum + getBandDisplaySeats(currentBands[p.code] ?? 0);
    }, 0);

    const remaining = Math.max(0, TOTAL_UP_SEATS - sumWithoutOther);
    const closestBand = SEAT_BANDS.reduce((best, b) =>
      Math.abs(b.representative - remaining) < Math.abs(best.representative - remaining) ? b : best,
    );
    const nextBands = {
      ...currentBands,
      [otherPartyCode]: closestBand.start,
    };
    setSaveBanner(null);
    void onUpdatePartyBands(nextBands, false);
  };

  const handleResetBands = () => {
    if (isLocked) return;
    const zeroed: Record<string, number> = {};
    activeParties.forEach((p) => {
      zeroed[p.code] = 0;
    });
    setSaveBanner(null);
    void onUpdatePartyBands(zeroed, false);
  };

  const handleSaveCloud = async () => {
    if (isLocked) return;
    await onUpdatePartyBands(currentBands, true);
    setSaveBanner(
      isSignedIn
        ? language === 'hi'
          ? `${totalAllocated} / ${TOTAL_UP_SEATS} सीट बैंड Firebase क्लाउड में सहेजे गए।`
          : `Saved ${totalAllocated} / ${TOTAL_UP_SEATS} seat bands to Firebase Cloud.`
        : language === 'hi'
        ? 'लोकल रूप से सहेजा गया। क्लाउड सिंक के लिए मोबाइल OTP या Google से साइन इन करें।'
        : 'Saved locally. Sign in with Mobile OTP or Google to sync to Firebase Cloud.',
    );
  };

  const remainingSeats = TOTAL_UP_SEATS - totalAllocated;

  return (
    <div className="space-y-5">
      {/* Year Toggle Bar (2007 | 2012 | 2017 | 2022 | 2027 Predict) */}
      <div className="rounded-2xl up-glass-surface border border-amber-500/20 dark:border-cyan-400/20 ring-1 ring-inset ring-white/55 dark:ring-white/6 p-1.5 sm:p-2 up-md3-elev-1">
        <div className="grid grid-cols-5 gap-1 sm:gap-1.5">
          {YEARS.map((yr) => {
            const active = selectedYear === yr;
            const isPredict = yr === '2027';
            return (
              <button
                key={yr}
                type="button"
                onClick={() => setSelectedYear(yr)}
                className={`py-2 px-1 sm:px-2 min-h-[44px] flex flex-col items-center justify-center rounded-xl text-center transition-all up-md3-ripple cursor-pointer ${
                  active
                    ? 'bg-[#0A1633] dark:bg-[#1D4ED8] text-white up-neon-rim'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/70'
                }`}
              >
                <div className="font-display font-bold text-xs sm:text-sm font-mono-num">{yr}</div>
                {isPredict && (
                  <div
                    className={`text-[9px] sm:text-[10px] font-semibold tracking-wide leading-tight ${
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

      {/* Main Layout: Chart Card + Party Allocation Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left: Doughnut Chart & Breakdown */}
        <div className="lg:col-span-5 rounded-3xl bg-white/95 dark:bg-[#0C1732]/95 backdrop-blur-md border border-amber-500/20 dark:border-cyan-400/20 p-4 sm:p-6 up-md3-elev-1">
          <div className="flex flex-wrap items-start justify-between gap-2 sm:gap-3 mb-5">
            <div>
              <h2 className="font-display font-bold text-lg sm:text-xl text-slate-900 dark:text-white leading-tight">
                {isHistorical ? t.histTitle(selectedYear) : t.predictTitle}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {isHistorical ? t.histSub : t.predictSub}
              </p>
            </div>
            <span className="px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 text-xs font-semibold whitespace-nowrap shrink-0">
              {isHistorical ? t.historicalChip : t.bandChip}
            </span>
          </div>

          <div className="flex flex-col sm:flex-row lg:flex-col xl:flex-row items-center gap-6">
            <DoughnutChart3D
              segments={segments}
              selectedPartyCode={selectedParty?.code}
              onSelectParty={(code) => {
                setSelectedPartyCode(code);
                if (isHistorical) setSelectedYear('2027');
              }}
              centerLabel={String(totalAllocated)}
              centerSublabel={isHistorical ? t.totalSeatsLabel : t.allocatedLabel}
              size={196}
            />

            <div className="flex-1 w-full grid grid-cols-2 sm:grid-cols-2 gap-1.5">
              {segments.map((seg) => {
                const isSelected = !isHistorical && selectedParty?.code === seg.code;
                const meta = getPartyMeta(seg.code);
                const label = language === 'hi' ? meta?.shortHi || seg.code : seg.code;
                return (
                  <button
                    key={seg.code}
                    type="button"
                    onClick={() => setSelectedPartyCode(seg.code)}
                    className={`w-full flex items-center justify-between gap-1 text-left px-2 py-1.5 rounded-lg transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-blue-50 dark:bg-blue-950/60 ring-1 ring-blue-300 dark:ring-blue-700'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                    }`}
                  >
                    <span className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-800 dark:text-slate-200 min-w-0">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: seg.color }}
                      />
                      <span className="truncate">{label}</span>
                    </span>
                    <span className="text-[11px] font-mono-num font-semibold text-slate-700 dark:text-slate-300 shrink-0">
                      {isHistorical ? seg.rangeLabel : getBandDisplaySeats(currentBands[seg.code] ?? 0)}
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

        {/* Right: Interactive Party & 5-Seat Band Selector (or Historical Comparison) */}
        <div className="lg:col-span-7 space-y-4">
          {isHistorical ? (
            <div className="rounded-3xl bg-white/95 dark:bg-[#0C1732]/95 backdrop-blur-md border border-amber-500/20 dark:border-cyan-400/20 p-5 sm:p-6 up-md3-elev-1 space-y-4">
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
                {activeParties.map((party) => {
                  const seats = getHistoricalPartySeats(party, selectedYear as HistoricalYear);
                  const sharePct = Math.round((seats / TOTAL_UP_SEATS) * 100);
                  const meta = getPartyMeta(party.code);
                  const displayName = language === 'hi' ? meta?.nameHi || party.name : party.name;
                  const leader = language === 'hi' ? meta?.leaderHi : meta?.leaderEn;
                  return (
                    <div
                      key={party.code}
                      className="rounded-2xl border border-slate-200 dark:border-slate-800 p-4 bg-slate-50/70 dark:bg-slate-900/50 space-y-2"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          {meta?.leaderPhotoUrl ? (
                            <img
                              src={meta.leaderPhotoUrl}
                              alt={leader || party.code}
                              referrerPolicy="no-referrer"
                              className="w-9 h-9 rounded-lg object-cover object-top border-2 shrink-0"
                              style={{ borderColor: party.color }}
                            />
                          ) : (
                            <span
                              className="w-9 h-9 rounded-lg border-2 flex items-center justify-center text-[10px] font-bold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 shrink-0"
                              style={{ borderColor: party.color }}
                            >
                              {party.code}
                            </span>
                          )}
                          <div className="min-w-0">
                            <span className="font-display font-bold text-sm text-slate-900 dark:text-white truncate block">
                              {language === 'hi' ? meta?.shortHi || party.code : party.code}
                            </span>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                              {displayName}{leader ? ` · ${leader}` : ''}
                            </div>
                          </div>
                        </div>
                        <span className="font-mono-num font-bold text-base text-slate-900 dark:text-white shrink-0">
                          {seats}
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${sharePct}%`, backgroundColor: party.color }}
                        />
                      </div>
                      <div className="flex justify-between text-[11px] text-slate-500 dark:text-slate-400 font-mono-num">
                        <span>{t.seatShare(sharePct)}</span>
                        <span>2022: {party.results2022}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="rounded-3xl bg-white/95 dark:bg-[#0C1732]/95 backdrop-blur-md border border-amber-500/20 dark:border-cyan-400/20 p-5 sm:p-6 up-md3-elev-1 space-y-5">
              {isLocked && (
                <div className="rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 p-3 flex items-center gap-2.5 text-xs text-rose-700 dark:text-rose-300 font-medium">
                  <Lock className="w-4 h-4 shrink-0" />
                  Predictions are currently locked by the election deadline configuration.
                </div>
              )}

              {/* Step 1: Tap a Political Party */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold tracking-wider uppercase text-slate-500 dark:text-slate-400">
                    {t.tapPartyStep}
                  </span>
                  <div className="flex items-center gap-3">
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

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 up-stage-3d">
                      {activeParties.map((party) => {
                    const isSelected = selectedParty?.code === party.code;
                    const band = getBandByStart(currentBands[party.code] ?? 0);
                    const meta = getPartyMeta(party.code);
                    const cardTitle =
                      language === 'hi'
                        ? meta?.shortHi || party.shortName || party.code
                        : meta?.shortEn || party.shortName || party.code;
                    const leaderName = language === 'hi' ? meta?.leaderHi : meta?.leaderEn;
                    const leaderPhoto = meta?.leaderPhotoUrl;
                    return (
                      <button
                        key={party.code}
                        type="button"
                        onClick={() => setSelectedPartyCode(party.code)}
                        style={
                          isSelected
                            ? {
                                borderColor: party.color,
                                boxShadow: `0 0 0 2px ${party.color}, 0 0 22px -4px ${party.color}cc, 0 12px 26px -8px rgba(10,22,51,0.55)`,
                              }
                            : undefined
                        }
                        className={`relative aspect-square w-full overflow-hidden rounded-2xl text-left transition-all border-2 up-card-3d up-md3-ripple cursor-pointer group ${
                          isSelected
                            ? 'bg-[#0A1633]'
                            : 'bg-slate-900 border-slate-300/80 dark:border-slate-700 hover:border-blue-400'
                        }`}
                      >
                        {/* Full-Square Leader Portrait Background */}
                        {leaderPhoto ? (
                          <img
                            src={leaderPhoto}
                            alt={leaderName || cardTitle}
                            referrerPolicy="no-referrer"
                            className="absolute inset-0 w-full h-full object-cover object-top transition-transform duration-300 group-hover:scale-105"
                          />
                        ) : (
                          <div
                            className="absolute inset-0 w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-800 via-slate-900 to-[#0A1633]"
                          >
                            <span
                              className="font-display font-extrabold text-2xl tracking-tight text-white/30"
                            >
                              {party.code}
                            </span>
                          </div>
                        )}

                        {/* Top & Bottom Scrims for Clear Text Readability */}
                        <div
                          aria-hidden="true"
                          className="absolute inset-0 bg-gradient-to-b from-slate-950/65 via-transparent to-slate-950/95 pointer-events-none"
                        />

                        {/* Foreground Content: Top Seat Band Pill + Bottom Party & Leader Name */}
                        <div className="relative z-10 h-full flex flex-col justify-between p-2 sm:p-2.5">
                          <div className="flex items-center justify-between gap-1">
                            <span
                              className="w-3 h-3 rounded-full shrink-0 ring-2 ring-white/80 shadow-xs"
                              style={{ backgroundColor: party.color }}
                            />
                            <span
                              className={`px-1.5 py-0.5 rounded-md text-[10px] sm:text-[11px] font-mono-num font-bold backdrop-blur-xs shadow-xs ${
                                isSelected
                                  ? 'bg-[#F59E0B] text-slate-950'
                                  : 'bg-slate-950/75 text-white border border-white/15'
                              }`}
                            >
                              {band.label}
                            </span>
                          </div>

                          <div className="w-full min-w-0 pt-3">
                            <div className="font-display font-extrabold text-xs sm:text-sm text-white truncate drop-shadow-[0_1px_3px_rgba(0,0,0,0.95)]">
                              {cardTitle}
                            </div>
                            {leaderName && (
                              <div className="text-[10px] sm:text-[11px] font-semibold text-amber-200 truncate mt-0.5 drop-shadow-[0_1px_2px_rgba(0,0,0,0.95)]">
                                {leaderName}
                              </div>
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Step 2: 5-Seat Band Selector (Slider + Steppers + Direct 81-Band Grid) */}
              {selectedParty && (
                <div className="rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 p-4 sm:p-5 space-y-4">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      {getPartyMeta(selectedParty.code)?.leaderPhotoUrl ? (
                        <img
                          src={getPartyMeta(selectedParty.code)?.leaderPhotoUrl}
                          alt={getPartyMeta(selectedParty.code)?.leaderEn || selectedParty.code}
                          referrerPolicy="no-referrer"
                          className="w-10 h-10 rounded-xl object-cover object-top border-2 shrink-0"
                          style={{ borderColor: selectedParty.color }}
                        />
                      ) : (
                        <span
                          className="w-3.5 h-3.5 rounded-full shrink-0"
                          style={{ backgroundColor: selectedParty.color }}
                        />
                      )}
                      <div className="min-w-0">
                        <h4 className="font-display font-bold text-sm sm:text-base text-slate-900 dark:text-white truncate">
                          {selectedParty.code} ({language === 'hi' ? getPartyMeta(selectedParty.code)?.nameHi || selectedParty.name : selectedParty.name})
                        </h4>
                        {getPartyMeta(selectedParty.code) && (
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                            {language === 'hi'
                              ? getPartyMeta(selectedParty.code)?.leaderHi
                              : getPartyMeta(selectedParty.code)?.leaderEn}
                          </p>
                        )}
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
                      aria-label="Decrease 5-seat band"
                      className="w-12 h-12 rounded-2xl bg-white dark:bg-[#0F1B35] border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-800 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 transition-colors up-md3-elev-1 up-md3-ripple cursor-pointer shrink-0"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>

                    <motion.div
                      key={`${selectedParty.code}_${currentBand.label}`}
                      initial={{ opacity: 0.75, scale: 0.96, rotateX: -8 }}
                      animate={{ opacity: 1, scale: 1, rotateX: 0 }}
                      transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                      style={{
                        boxShadow: `0 0 0 1px ${selectedParty.color}66, 0 0 22px -6px ${selectedParty.color}70`,
                      }}
                      className="flex-1 rounded-2xl bg-white dark:bg-[#0C1732] border border-slate-200 dark:border-slate-700 py-3 px-4 text-center up-md3-elev-1"
                    >
                      <div className="font-display font-extrabold text-2xl sm:text-3xl text-slate-900 dark:text-white font-mono-num">
                        {currentBand.label}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-mono-num">
                        {t.allocatedSeatsSub(getBandDisplaySeats(currentBand.start), selectedParty.results2022)}
                      </div>
                    </motion.div>

                    <button
                      type="button"
                      onClick={() => handleSetBandIndex(currentBand.index + 1)}
                      disabled={isLocked || currentBand.index >= SEAT_BANDS.length - 1}
                      aria-label="Increase 5-seat band"
                      className="w-12 h-12 rounded-2xl bg-white dark:bg-[#0F1B35] border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-800 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 transition-colors up-md3-elev-1 up-md3-ripple cursor-pointer shrink-0"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Smooth Unrestricted 5-Seat Step Range Slider */}
                  <div className="space-y-2 pt-1">
                    <input
                      type="range"
                      min={0}
                      max={SEAT_BANDS.length - 1}
                      step={1}
                      value={currentBand.index}
                      disabled={isLocked}
                      onChange={(e) => handleSetBandIndex(Number(e.target.value))}
                      aria-label={`Select 5-seat prediction band for ${selectedParty.name}`}
                      className="w-full up-slider"
                    />
                    <div className="flex justify-between text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 font-mono-num">
                      <span>0–4</span>
                      <span className="hidden sm:inline">100–104</span>
                      <span>200–204 (202)</span>
                      <span className="hidden sm:inline">300–304</span>
                      <span>400–403</span>
                    </div>
                  </div>

                  {/* Toggle Quick Band Chips Grid (81 5-seat bands) */}
                  <div>
                    <button
                      type="button"
                      onClick={() => setShowAllBands((prev) => !prev)}
                      className="inline-flex items-center gap-1.5 min-h-[36px] text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                    >
                      <SlidersHorizontal className="w-3.5 h-3.5" />
                      {showAllBands ? t.hideAllBands : t.showAllBands}
                    </button>

                    {showAllBands && (
                      <div className="max-h-56 overflow-y-auto grid grid-cols-3 sm:grid-cols-6 gap-1.5 mt-3 pr-1">
                        {SEAT_BANDS.map((band) => {
                          const isCurrent = band.index === currentBand.index;
                          return (
                            <button
                              key={band.index}
                              type="button"
                              disabled={isLocked}
                              onClick={() => handleSetBandIndex(band.index)}
                              className={`py-2.5 px-1.5 min-h-[40px] rounded-xl text-[11px] font-mono-num font-semibold transition-colors cursor-pointer ${
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
              )}

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
