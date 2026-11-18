import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Info,
  Lock,
  Search,
  Trophy,
  Users,
  X,
} from 'lucide-react';
import {
  AppLanguage,
  CandidateRecord,
  ConstituencyPick,
  ConstituencyRecord,
  ElectionConfigData,
  HistoricalYear,
  OfficialResultRecord,
  PartyConfig,
  UserPredictionData,
} from '../types/election';
import { UP_DISTRICTS } from '../data/upConstituencies403';
import { TOTAL_UP_SEATS, getPartyColor } from '../data/upParties';
import { TRANSLATIONS } from '../i18n/translations';
import { useLeaderPhoto } from '../utils/leaderPhotoLookup';

interface ConstituenciesTabProps {
  constituencies: ConstituencyRecord[];
  candidates: CandidateRecord[];
  parties: PartyConfig[];
  officialResults: Record<number, OfficialResultRecord>;
  prediction: UserPredictionData;
  electionConfig: ElectionConfigData;
  isSaving: boolean;
  language: AppLanguage;
  onSelectCandidate: (acNo: number, pick: ConstituencyPick) => Promise<void>;
}

const HIST_YEARS: HistoricalYear[] = ['2022', '2017', '2012', '2007'];
const PAGE_SIZE = 30;

interface SelectableCandidate {
  key: string;
  name: string;
  party: string;
  badge: string;
  source: string;
  photoUrl?: string;
  statusNote?: string;
}

interface CandidateAvatarProps {
  name: string;
  party: string;
  photoUrl?: string;
  size?: 'xs' | 'sm' | 'md';
}

const CandidateAvatar: React.FC<CandidateAvatarProps> = ({
  name,
  party,
  photoUrl,
  size = 'sm',
}) => {
  const resolvedPhotoUrl = useLeaderPhoto(name, photoUrl);
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    setImgError(false);
  }, [resolvedPhotoUrl]);

  const partyColor = getPartyColor(party);
  const initials = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() || '')
    .join('');

  const sizeClass =
    size === 'xs'
      ? 'w-7 h-7 text-[10px]'
      : size === 'sm'
      ? 'w-9 h-9 text-xs'
      : 'w-11 h-11 text-xs';

  return (
    <div className="relative shrink-0">
      <div
        className={`${sizeClass} rounded-full overflow-hidden flex items-center justify-center font-display font-bold text-white shadow-xs border-2`}
        style={{
          borderColor: partyColor,
          background: `linear-gradient(145deg, ${partyColor}, #0A1633)`,
        }}
      >
        {resolvedPhotoUrl && !imgError ? (
          <img
            src={resolvedPhotoUrl}
            alt={name}
            loading="lazy"
            referrerPolicy="no-referrer"
            onError={() => setImgError(true)}
            className="w-full h-full object-cover object-top"
          />
        ) : (
          <div className="relative w-full h-full flex items-center justify-center">
            <svg
              viewBox="0 0 40 40"
              aria-hidden="true"
              className="absolute inset-0 w-full h-full opacity-30"
            >
              <circle cx="20" cy="14" r="7" fill="#ffffff" />
              <path d="M7 38 C7 28 13 24 20 24 C27 24 33 28 33 38 Z" fill="#ffffff" />
            </svg>
            <span className="relative z-10 drop-shadow-xs tracking-tight">
              {initials || party.slice(0, 2)}
            </span>
          </div>
        )}
      </div>
      <span
        className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white dark:border-[#0F1B35] flex items-center justify-center text-[7px] font-extrabold text-white"
        style={{ backgroundColor: partyColor }}
        title={party}
      >
        {party.slice(0, 1)}
      </span>
    </div>
  );
};

export const ConstituenciesTab: React.FC<ConstituenciesTabProps> = ({
  constituencies,
  candidates,
  parties,
  officialResults,
  prediction,
  electionConfig,
  isSaving,
  language,
  onSelectCandidate,
}) => {
  const t = TRANSLATIONS[language].constituencies;
  const [searchQuery, setSearchQuery] = useState('');
  const [districtFilter, setDistrictFilter] = useState('ALL');
  const [partyFilter, setPartyFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const [activeAcNo, setActiveAcNo] = useState<number | null>(1);
  const [mobileModalOpen, setMobileModalOpen] = useState(false);
  const [histYear, setHistYear] = useState<HistoricalYear>('2022');
  const [customParty, setCustomParty] = useState('BJP');
  const [customName, setCustomName] = useState('');
  const [pendingSelection, setPendingSelection] = useState<{
    name: string;
    party: string;
    source: string;
  } | null>(null);
  const [feedbackToast, setFeedbackToast] = useState<string | null>(null);
  const desktopPanelRef = useRef<HTMLDivElement | null>(null);
  const mobileModalPanelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (desktopPanelRef.current) desktopPanelRef.current.scrollTop = 0;
    if (mobileModalPanelRef.current) mobileModalPanelRef.current.scrollTop = 0;
  }, [activeAcNo, mobileModalOpen]);

  useEffect(() => {
    if (activeAcNo === null) {
      setPendingSelection(null);
      return;
    }
    const existing = prediction.constituencyPicks[String(activeAcNo)];
    setPendingSelection(
      existing
        ? { name: existing.candidateName, party: existing.party, source: existing.source }
        : null,
    );
  }, [activeAcNo, mobileModalOpen, prediction.constituencyPicks]);

  const predictedCount = Object.keys(prediction.constituencyPicks).length;
  const isLocked = electionConfig.isLocked;

  const filteredSeats = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return constituencies.filter((seat) => {
      if (districtFilter !== 'ALL' && seat.district !== districtFilter) return false;

      const userPick = prediction.constituencyPicks[String(seat.acNo)];
      if (partyFilter === 'MY_PICKS' && !userPick) return false;
      if (partyFilter === 'PENDING' && userPick) return false;
      if (
        !['ALL', 'MY_PICKS', 'PENDING'].includes(partyFilter) &&
        seat.hist2022.winnerParty.toUpperCase() !== partyFilter
      ) {
        return false;
      }

      if (!q) return true;
      return (
        String(seat.acNo) === q ||
        `#${seat.acNo}` === q ||
        seat.name.toLowerCase().includes(q) ||
        seat.district.toLowerCase().includes(q) ||
        seat.hist2022.winnerName.toLowerCase().includes(q) ||
        seat.hist2017.winnerName.toLowerCase().includes(q)
      );
    });
  }, [constituencies, searchQuery, districtFilter, partyFilter, prediction.constituencyPicks]);

  const totalPages = Math.max(1, Math.ceil(filteredSeats.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pagedSeats = filteredSeats.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const selectedSeat = useMemo(
    () => constituencies.find((c) => c.acNo === activeAcNo) || constituencies[0],
    [constituencies, activeAcNo],
  );

  // Build ordered selectable options for 2027 prediction:
  // User explicitly requested: 2017 Winner & 2017 Runner-up as the FIRST two options,
  // followed by 2022 Winner & Runner-up (if distinct), plus any Admin-announced/official 2027 candidates!
  const candidateOptions: SelectableCandidate[] = useMemo(() => {
    if (!selectedSeat) return [];
    const list: SelectableCandidate[] = [];
    const seen = new Set<string>();

    const addOpt = (opt: SelectableCandidate) => {
      const k = `${opt.name.toLowerCase()}__${opt.party.toUpperCase()}`;
      if (!opt.name || seen.has(k)) return;
      seen.add(k);
      list.push(opt);
    };

    // 1. Official / Announced 2027 candidates uploaded by Admin (if any, shown prominently or right after 2017 pair)
    const adminSeatCandidates = candidates.filter(
      (c) => c.acNo === selectedSeat.acNo && c.status !== 'WITHDRAWN',
    );

    // First two options: 2017 election Winner and Runner-up (as requested)
    if (selectedSeat.hist2017.winnerName) {
      addOpt({
        key: `2017_w_${selectedSeat.acNo}`,
        name: selectedSeat.hist2017.winnerName,
        party: selectedSeat.hist2017.winnerParty,
        badge: '2017 Winner',
        source: '2017 Historical Reference',
      });
    }
    if (selectedSeat.hist2017.runnerUpName) {
      addOpt({
        key: `2017_r_${selectedSeat.acNo}`,
        name: selectedSeat.hist2017.runnerUpName,
        party: selectedSeat.hist2017.runnerUpParty,
        badge: '2017 Runner-up',
        source: '2017 Historical Reference',
      });
    }

    // 2022 Winner and Runner-up
    if (selectedSeat.hist2022.winnerName) {
      addOpt({
        key: `2022_w_${selectedSeat.acNo}`,
        name: selectedSeat.hist2022.winnerName,
        party: selectedSeat.hist2022.winnerParty,
        badge: '2022 Winner',
        source: '2022 Historical Reference',
      });
    }
    if (selectedSeat.hist2022.runnerUpName) {
      addOpt({
        key: `2022_r_${selectedSeat.acNo}`,
        name: selectedSeat.hist2022.runnerUpName,
        party: selectedSeat.hist2022.runnerUpParty,
        badge: '2022 Runner-up',
        source: '2022 Historical Reference',
      });
    }

    // Admin-managed 2027 candidates
    adminSeatCandidates.forEach((cand) => {
      addOpt({
        key: `admin_${cand.id}`,
        name: cand.name,
        party: cand.party,
        badge: cand.status === 'OFFICIAL' ? '2027 Official' : '2027 Announced',
        source: cand.source,
        photoUrl: cand.photoUrl,
        statusNote: cand.status,
      });
    });

    return list;
  }, [selectedSeat, candidates]);

  const currentPick = selectedSeat
    ? prediction.constituencyPicks[String(selectedSeat.acNo)]
    : undefined;

  const commitPickAndClose = async (opt: { name: string; party: string; source: string }) => {
    if (!selectedSeat || isLocked) return;
    await onSelectCandidate(selectedSeat.acNo, {
      candidateName: opt.name,
      party: opt.party,
      source: opt.source,
      updatedAtMs: Date.now(),
    });
    setFeedbackToast(`Saved #${selectedSeat.acNo} ${selectedSeat.name}: ${opt.name} (${opt.party})`);
    setMobileModalOpen(false);
    setTimeout(() => setFeedbackToast(null), 3000);
  };

  const handleSelectOption = (opt: { name: string; party: string; source: string }) => {
    if (!selectedSeat || isLocked) return;
    setPendingSelection({
      name: opt.name,
      party: opt.party,
      source: opt.source,
    });
  };

  const handleSaveSelectedPick = async () => {
    if (!pendingSelection || isLocked) return;
    await commitPickAndClose(pendingSelection);
  };

  const handleProvisionalPartyPick = async () => {
    if (!selectedSeat || isLocked) return;
    const label = customName.trim() || `${customParty} Nominee (Provisional)`;
    await commitPickAndClose({
      name: label,
      party: customParty,
      source: 'User Party Forecast',
    });
    setCustomName('');
  };

  const handleNextSeat = () => {
    if (!selectedSeat) return;
    const idx = filteredSeats.findIndex((s) => s.acNo === selectedSeat.acNo);
    const nextSeat = filteredSeats[idx + 1] || filteredSeats[0];
    if (nextSeat) setActiveAcNo(nextSeat.acNo);
  };

  const renderDetailPanel = (isModal: boolean) => {
    if (!selectedSeat) return null;
    const histData =
      histYear === '2022'
        ? selectedSeat.hist2022
        : histYear === '2017'
        ? selectedSeat.hist2017
        : histYear === '2012'
        ? selectedSeat.hist2012
        : selectedSeat.hist2007;

    const official = officialResults[selectedSeat.acNo];

    return (
      <div className="space-y-5">
        {/* Seat Header */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-blue-600 dark:text-blue-400 font-mono-num">
              <span>AC No. {selectedSeat.acNo}</span>
              <span aria-hidden="true">·</span>
              <span>{selectedSeat.district}</span>
              {selectedSeat.category && selectedSeat.category !== 'GEN' && (
                <>
                  <span aria-hidden="true">·</span>
                  <span>{selectedSeat.category}</span>
                </>
              )}
            </div>
            <h3 className="font-display font-extrabold text-xl sm:text-2xl text-slate-900 dark:text-white mt-0.5">
              {selectedSeat.name}
            </h3>
            {selectedSeat.totalElectors && (
              <p className="text-xs text-slate-500 dark:text-slate-400 font-mono-num mt-0.5">
                Total Electors: {selectedSeat.totalElectors.toLocaleString('en-IN')}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleNextSeat}
              className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              {t.nextSeat}
            </button>
            {isModal && (
              <button
                type="button"
                onClick={() => setMobileModalOpen(false)}
                aria-label="Close constituency panel"
                className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Official Verified 2027 Result (if declared by Admin from ECI) */}
        {official && official.declared && (
          <div className="rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-700 p-4 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 dark:text-emerald-300">
              <Trophy className="w-4 h-4" />
              <span>OFFICIAL VERIFIED ECI RESULT</span>
            </div>
            <div className="flex items-center gap-3">
              <CandidateAvatar
                name={official.winnerName}
                party={official.winnerParty}
                size="sm"
              />
              <div>
                <div className="font-display font-bold text-base text-slate-900 dark:text-white">
                  {official.winnerName} ({official.winnerParty})
                </div>
                <div className="text-xs font-mono-num text-slate-600 dark:text-slate-300">
                  {official.winnerVotes.toLocaleString('en-IN')} votes
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Historical Results Section (2007 | 2012 | 2017 | 2022 toggle) */}
        <div className="rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 p-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
              {t.histSection}
            </span>
            <div className="flex items-center gap-1 p-1 rounded-xl bg-white dark:bg-[#0F1B35] border border-slate-200 dark:border-slate-700">
              {HIST_YEARS.map((yr) => (
                <button
                  key={yr}
                  type="button"
                  onClick={() => setHistYear(yr)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-mono-num font-bold transition-colors cursor-pointer ${
                    histYear === yr
                      ? 'bg-[#0A1633] dark:bg-[#1D4ED8] text-white'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {yr}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Historical Winner */}
            <div className="rounded-xl bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 p-3.5">
              <div className="text-[11px] font-bold uppercase tracking-wide text-emerald-700 dark:text-emerald-400">
                {t.winnerLabel(histYear)}
              </div>
              <div className="flex items-center gap-2.5 mt-2">
                <CandidateAvatar
                  name={histData.winnerName || histData.winnerParty}
                  party={histData.winnerParty}
                  size="sm"
                />
                <div className="min-w-0 flex-1">
                  <div className="font-display font-bold text-sm text-slate-900 dark:text-white truncate">
                    {histData.winnerName || 'Not recorded'}
                  </div>
                  <div className="flex items-center justify-between text-xs mt-0.5 gap-2">
                    <span
                      className="font-bold"
                      style={{ color: getPartyColor(histData.winnerParty) }}
                    >
                      {histData.winnerParty}
                    </span>
                    <span className="font-mono-num text-slate-600 dark:text-slate-300 truncate">
                      {histData.winnerVotes !== null
                        ? `${histData.winnerVotes.toLocaleString('en-IN')} ${t.votesSuffix}`
                        : t.refTally}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Historical Runner-up */}
            <div className="rounded-xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 p-3.5">
              <div className="text-[11px] font-bold uppercase tracking-wide text-amber-700 dark:text-amber-400">
                {t.runnerUpLabel(histYear)}
              </div>
              <div className="flex items-center gap-2.5 mt-2">
                <CandidateAvatar
                  name={histData.runnerUpName || histData.runnerUpParty}
                  party={histData.runnerUpParty}
                  size="sm"
                />
                <div className="min-w-0 flex-1">
                  <div className="font-display font-bold text-sm text-slate-900 dark:text-white truncate">
                    {histData.runnerUpName || 'Not recorded'}
                  </div>
                  <div className="flex items-center justify-between text-xs mt-0.5 gap-2">
                    <span
                      className="font-bold"
                      style={{ color: getPartyColor(histData.runnerUpParty) }}
                    >
                      {histData.runnerUpParty}
                    </span>
                    <span className="font-mono-num text-slate-600 dark:text-slate-300 truncate">
                      {histData.runnerUpVotes !== null
                        ? `${histData.runnerUpVotes.toLocaleString('en-IN')} ${t.votesSuffix}`
                        : t.refTally}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 2027 Candidate Prediction Selector */}
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h4 className="font-display font-bold text-base text-slate-900 dark:text-white">
              {t.whoWillWin}
            </h4>
            {currentPick && (
              <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {t.pickedLabel} {currentPick.party}
              </span>
            )}
          </div>

          {isLocked && (
            <div className="rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 p-3 flex items-center gap-2 text-xs text-rose-700 dark:text-rose-300">
              <Lock className="w-4 h-4 shrink-0" />
              Selections are locked after the 7:00 AM cutoff.
            </div>
          )}

          {/* Candidate Cards */}
          <div className="space-y-2.5">
            {candidateOptions.map((opt) => {
              const isSelected = Boolean(
                pendingSelection &&
                  pendingSelection.name.toLowerCase() === opt.name.toLowerCase() &&
                  pendingSelection.party.toUpperCase() === opt.party.toUpperCase(),
              );
              const partyColor = getPartyColor(opt.party);

              return (
                <button
                  key={opt.key}
                  type="button"
                  disabled={isLocked || isSaving}
                  onClick={() => handleSelectOption(opt)}
                  className={`w-full rounded-2xl p-3 text-left border transition-all flex items-center justify-between gap-3 up-md3-ripple cursor-pointer ${
                    isSelected
                      ? 'bg-blue-50 dark:bg-blue-950/60 border-[#1D4ED8] up-neon-cyan shadow-sm'
                      : 'bg-white dark:bg-[#0F1B35] border-slate-200 dark:border-slate-700 hover:border-blue-400'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                        isSelected
                          ? 'bg-[#1D4ED8] border-[#1D4ED8] text-white'
                          : 'border-slate-300 dark:border-slate-600'
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>

                    <CandidateAvatar
                      name={opt.name}
                      party={opt.party}
                      photoUrl={opt.photoUrl}
                      size="md"
                    />

                    <div className="min-w-0">
                      <div className="font-display font-bold text-sm text-slate-900 dark:text-white truncate">
                        {opt.name}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        <span className="font-bold" style={{ color: partyColor }}>
                          {opt.party}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span>{opt.badge}</span>
                      </div>
                    </div>
                  </div>

                  <span
                    className={`text-xs font-semibold shrink-0 ${
                      isSelected
                        ? 'text-[#1D4ED8] dark:text-blue-400'
                        : 'text-slate-400 dark:text-slate-500'
                    }`}
                  >
                    {isSelected ? t.selectedLabel : t.selectLabel}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Primary Save Pick Button (only clicking Save Pick persists & closes dialog) */}
          <button
            type="button"
            disabled={isLocked || isSaving || !pendingSelection}
            onClick={() => void handleSaveSelectedPick()}
            className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-[#0A1633] to-[#1D4ED8] hover:from-[#10255A] hover:to-blue-600 text-white font-display font-bold text-sm flex items-center justify-center gap-2 shadow-md up-neon-rim up-md3-ripple cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed"
          >
            <CheckCircle2 className="w-4 h-4 text-[#F59E0B] shrink-0" />
            <span className="truncate">
              {pendingSelection
                ? `${t.savePickBtn} · ${pendingSelection.name} (${pendingSelection.party})`
                : t.savePickBtn}
            </span>
          </button>

          {/* Provisional Party / Other Candidate Box */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50 p-4 space-y-3">
            <div className="flex items-start gap-2.5 text-xs text-blue-800 dark:text-blue-300">
              <Info className="w-4 h-4 shrink-0 mt-0.5 text-blue-600 dark:text-blue-400" />
              <span>
                <strong>{t.officialListAwaited}</strong> {t.officialListDesc}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
              <select
                value={customParty}
                disabled={isLocked}
                onChange={(e) => setCustomParty(e.target.value)}
                aria-label="Select provisional party"
                className="sm:col-span-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0F1B35] px-3 py-2.5 text-xs font-semibold text-slate-800 dark:text-slate-200"
              >
                {parties.map((p) => (
                  <option key={p.code} value={p.code}>
                    {p.code} — {p.shortName}
                  </option>
                ))}
                <option value="IND">IND — Independent</option>
              </select>

              <input
                type="text"
                value={customName}
                disabled={isLocked}
                onChange={(e) => setCustomName(e.target.value)}
                placeholder={t.customNamePlaceholder}
                className="sm:col-span-5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0F1B35] px-3 py-2.5 text-xs text-slate-900 dark:text-white placeholder:text-slate-400"
              />

              <button
                type="button"
                disabled={isLocked || isSaving}
                onClick={() => void handleProvisionalPartyPick()}
                className="sm:col-span-3 rounded-xl bg-[#0A1633] dark:bg-[#1D4ED8] hover:bg-blue-700 text-white text-xs font-bold px-3 py-2.5 transition-colors cursor-pointer disabled:opacity-40"
              >
                {t.savePickBtn}
              </button>
            </div>
          </div>

          {feedbackToast && (
            <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 p-3 flex items-center gap-2 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{feedbackToast}</span>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Header & Search Card */}
      <div className="rounded-3xl bg-white dark:bg-[#0F1B35] border border-slate-200/80 dark:border-slate-800 p-4 sm:p-5 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-display font-bold text-lg sm:text-xl text-slate-900 dark:text-white">
              {t.title}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{t.subtitle}</p>
          </div>
          <span className="px-3.5 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 text-xs font-bold font-mono-num">
            {t.predictedChip(predictedCount)}
          </span>
        </div>

        {/* Search + District Select */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          <div className="sm:col-span-8 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              placeholder={t.searchPlaceholder}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="sm:col-span-4">
            <select
              value={districtFilter}
              onChange={(e) => {
                setDistrictFilter(e.target.value);
                setPage(1);
              }}
              aria-label="Filter by district"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 text-sm text-slate-800 dark:text-slate-200 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">{t.allDistricts}</option>
              {UP_DISTRICTS.map((dist) => (
                <option key={dist} value={dist}>
                  {dist}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Filter Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {[
            { id: 'ALL', label: t.allLabel(constituencies.length) },
            { id: 'MY_PICKS', label: t.myPicksLabel(predictedCount) },
            { id: 'PENDING', label: t.pendingLabel(TOTAL_UP_SEATS - predictedCount) },
            { id: 'BJP', label: '2022 BJP' },
            { id: 'SP', label: '2022 SP' },
            { id: 'AD', label: '2022 AD' },
            { id: 'RLD', label: '2022 RLD' },
            { id: 'INC', label: '2022 INC' },
            { id: 'BSP', label: '2022 BSP' },
          ].map((chip) => {
            const active = partyFilter === chip.id;
            return (
              <button
                key={chip.id}
                type="button"
                onClick={() => {
                  setPartyFilter(chip.id);
                  setPage(1);
                }}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                  active
                    ? 'bg-[#0A1633] dark:bg-[#1D4ED8] text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {chip.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Save Confirmation Toast (visible immediately after dialog auto-closes) */}
      {feedbackToast && (
        <div className="rounded-2xl bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-300 dark:border-emerald-700 p-3.5 flex items-center gap-2.5 text-xs font-semibold text-emerald-800 dark:text-emerald-200 shadow-sm">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>{feedbackToast}</span>
        </div>
      )}

      {/* Desktop 2-Column Split: Left List, Right Live Detail Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Constituency List */}
        <div className="lg:col-span-6 space-y-2.5">
          {pagedSeats.length === 0 ? (
            <div className="rounded-2xl bg-white dark:bg-[#0F1B35] border border-slate-200 dark:border-slate-800 p-8 text-center">
              <Users className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <div className="font-display font-bold text-sm text-slate-800 dark:text-white">
                {t.noMatches}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{t.noMatchesSub}</p>
            </div>
          ) : (
            pagedSeats.map((seat) => {
              const userPick = prediction.constituencyPicks[String(seat.acNo)];
              const isSelectedRow = activeAcNo === seat.acNo;
              return (
                <button
                  key={seat.acNo}
                  type="button"
                  onClick={() => {
                    setActiveAcNo(seat.acNo);
                    setMobileModalOpen(true);
                  }}
                  className={`w-full rounded-2xl p-3.5 text-left transition-all flex items-center justify-between gap-3 border up-md3-ripple up-card-3d cursor-pointer ${
                    isSelectedRow
                      ? 'bg-white dark:bg-[#0F1B35] border-[#1D4ED8] up-neon-cyan'
                      : userPick
                      ? 'bg-white dark:bg-[#0F1B35] border-emerald-300 dark:border-emerald-800/80 hover:border-emerald-400 up-md3-elev-1'
                      : 'bg-white dark:bg-[#0F1B35] border-slate-200/80 dark:border-slate-800 hover:border-blue-300 up-md3-elev-1'
                  }`}
                >
                  <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                    <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-[#0A1633] text-[#F59E0B] font-mono-num font-bold text-xs flex items-center justify-center shrink-0">
                      #{seat.acNo}
                    </div>
                    <CandidateAvatar
                      name={userPick?.candidateName || seat.hist2022.winnerName || seat.hist2022.winnerParty}
                      party={userPick?.party || seat.hist2022.winnerParty}
                      size="xs"
                    />
                    <div className="min-w-0">
                      <div className="font-display font-bold text-sm sm:text-base text-slate-900 dark:text-white truncate">
                        {seat.name}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                        {seat.district} · 2022: {seat.hist2022.winnerName} ({seat.hist2022.winnerParty})
                      </div>
                    </div>
                  </div>

                  {userPick ? (
                    <span className="px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 text-xs font-bold whitespace-nowrap shrink-0 flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" />
                      {userPick.party}
                    </span>
                  ) : (
                    <span className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold whitespace-nowrap shrink-0 flex items-center gap-1">
                      {t.predictBtn} <ArrowRight className="w-3 h-3" />
                    </span>
                  )}
                </button>
              );
            })
          )}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="rounded-2xl bg-white dark:bg-[#0F1B35] border border-slate-200/80 dark:border-slate-800 p-3 flex items-center justify-between text-xs">
              <button
                type="button"
                disabled={safePage <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 font-semibold disabled:opacity-40 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
                Prev
              </button>

              <span className="font-mono-num text-slate-600 dark:text-slate-300">
                Page {safePage} of {totalPages} ({filteredSeats.length} seats)
              </span>

              <button
                type="button"
                disabled={safePage >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 font-semibold disabled:opacity-40 cursor-pointer"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Right Sticky Detail Inspector (Desktop lg+) */}
        <div
          ref={desktopPanelRef}
          className="hidden lg:block lg:col-span-6 lg:sticky lg:top-20 lg:max-h-[calc(100dvh-6rem)] lg:overflow-y-auto rounded-3xl bg-white dark:bg-[#0F1B35] border border-slate-200/80 dark:border-slate-800 p-6 up-md3-elev-2"
        >
          {renderDetailPanel(false)}
        </div>
      </div>

      {/* Top-Anchored Viewport Dialog Portal (Mobile / Tablet < lg) */}
      {mobileModalOpen &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            role="dialog"
            aria-modal="true"
            aria-label={selectedSeat ? `AC ${selectedSeat.acNo} ${selectedSeat.name}` : 'Constituency prediction'}
            onClick={() => setMobileModalOpen(false)}
            className="lg:hidden fixed inset-0 z-50 bg-slate-950/65 backdrop-blur-xs flex items-start justify-center pt-4 sm:pt-8 px-3 sm:px-4 pb-4 overflow-y-auto"
          >
            <div
              ref={mobileModalPanelRef}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-xl max-h-[calc(100dvh-2rem)] overflow-y-auto rounded-3xl bg-white dark:bg-[#0F1B35] border border-blue-200/70 dark:border-blue-500/30 p-5 pb-6 shadow-2xl up-md3-elev-2"
            >
              {renderDetailPanel(true)}
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
};
