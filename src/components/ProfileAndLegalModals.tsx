import React, { useEffect, useState } from 'react';
import {
  Download,
  Gift,
  LogOut,
  Moon,
  Phone,
  Shield,
  ShieldCheck,
  Smartphone,
  Sun,
  Trash2,
  X,
} from 'lucide-react';
import { AppLanguage, UserPredictionData, UserProfileData } from '../types/election';

interface ProfileModalProps {
  open: boolean;
  onClose: () => void;
  userProfile: UserProfileData | null;
  prediction: UserPredictionData;
  isSignedIn: boolean;
  isAdmin: boolean;
  darkMode: boolean;
  language?: AppLanguage;
  onToggleDarkMode: () => void;
  onOpenAuthModal: () => void;
  onGoogleSignIn: () => void;
  onUpdateProfile: (alias: string, leaderboardOptIn: boolean) => Promise<void>;
  onDeleteAccountData: () => Promise<void>;
  onSignOut: () => Promise<void>;
  onOpenAdmin: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  open,
  onClose,
  userProfile,
  prediction,
  isSignedIn,
  isAdmin,
  darkMode,
  language = 'en',
  onToggleDarkMode,
  onOpenAuthModal,
  onGoogleSignIn,
  onUpdateProfile,
  onDeleteAccountData,
  onSignOut,
  onOpenAdmin,
}) => {
  const [alias, setAlias] = useState(userProfile?.publicAlias || 'UP Forecaster');
  const [optIn, setOptIn] = useState(userProfile?.leaderboardOptIn ?? true);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [savedMsg, setSavedMsg] = useState<string | null>(null);

  useEffect(() => {
    if (userProfile) {
      setAlias(userProfile.publicAlias || userProfile.displayName || 'UP Forecaster');
      setOptIn(userProfile.leaderboardOptIn);
    }
    setConfirmDelete(false);
  }, [userProfile, open]);

  if (!open) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!alias.trim()) return;
    await onUpdateProfile(alias.trim(), optIn);
    setSavedMsg('Profile & privacy preferences updated.');
    setTimeout(() => setSavedMsg(null), 3000);
  };

  const handleExport = () => {
    const payload = {
      exportedAt: new Date().toISOString(),
      platform: 'UP Mandate (Free Civic Election Forecasting Platform · ₹50 Lakh Prizes & Gifts)',
      profile: userProfile
        ? {
            publicAlias: userProfile.publicAlias,
            leaderboardOptIn: userProfile.leaderboardOptIn,
          }
        : null,
      prediction,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'up-mandate-predictions.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-3xl bg-white dark:bg-[#0E1A36] border border-amber-500/25 dark:border-cyan-400/25 p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto up-neon-rim">
        <div className="flex items-center justify-between">
          <h3 className="font-display font-bold text-lg text-slate-900 dark:text-white">
            Profile &amp; Privacy Settings
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close settings"
            className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Theme Switch */}
        <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
          <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
            {language === 'hi' ? 'थीम मोड' : 'Appearance Theme'}
          </span>
          <button
            type="button"
            onClick={onToggleDarkMode}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white dark:bg-[#0F1B35] border border-slate-200 dark:border-slate-700 text-xs font-bold cursor-pointer"
          >
            {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-blue-600" />}
            <span>{darkMode ? 'Light Mode' : 'Dark Mode'}</span>
          </button>
        </div>

        {isSignedIn && (
          <div className="flex items-center justify-between gap-3 p-3.5 rounded-2xl bg-gradient-to-r from-[#091534] to-[#1D4ED8] text-white border border-amber-400/40 up-gold-rim">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="w-9 h-9 rounded-xl bg-[#F59E0B] text-slate-950 flex items-center justify-center shrink-0">
                <Gift className="w-4 h-4" />
              </span>
              <div className="min-w-0">
                <div className="text-xs font-bold text-amber-300">
                  {language === 'hi' ? 'निःशुल्क सदस्य · ₹50 लाख पूल' : 'Free Civic Tier · ₹50L Prizes Pool'}
                </div>
                <div className="text-[11px] text-blue-100 truncate font-mono-num">
                  {userProfile?.phoneNumber || userProfile?.email || 'Verified Firebase Account'}
                </div>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded-lg bg-emerald-400/20 border border-emerald-300/40 text-[10px] font-bold text-emerald-200 shrink-0">
              FREE
            </span>
          </div>
        )}

        {!isSignedIn ? (
          <div className="space-y-3 text-center py-3">
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Sign in with Mobile Number + OTP or Google to sync your predictions across web and mobile and compete for ₹50 Lakh prizes &amp; gifts.
            </p>
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenAuthModal();
              }}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-[#FF9933] to-[#F59E0B] text-slate-950 text-sm font-display font-extrabold flex items-center justify-center gap-2 up-gold-rim up-md3-ripple cursor-pointer"
            >
              <Smartphone className="w-4 h-4" />
              <span>Sign In with Mobile + OTP</span>
            </button>
            <button
              type="button"
              onClick={() => {
                onClose();
                onGoogleSignIn();
              }}
              className="w-full py-2.5 rounded-xl bg-[#1D4ED8] text-white text-xs font-bold up-md3-ripple cursor-pointer"
            >
              Continue with Google
            </button>
          </div>
        ) : (
          <form onSubmit={(e) => void handleSave(e)} className="space-y-4">
            {userProfile?.phoneNumber && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300 font-mono-num">
                <Phone className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span>Verified Mobile: {userProfile.phoneNumber}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                Public Leaderboard Alias (Phone &amp; Email stay private)
              </label>
              <input
                type="text"
                maxLength={40}
                value={alias}
                onChange={(e) => setAlias(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm text-slate-900 dark:text-white"
              />
            </div>

            <label className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 cursor-pointer">
              <div>
                <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Show on Public Leaderboard
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">
                  Only your public alias and score are visible
                </div>
              </div>
              <input
                type="checkbox"
                checked={optIn}
                onChange={(e) => setOptIn(e.target.checked)}
                className="w-4 h-4"
              />
            </label>

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-[#1D4ED8] text-white text-xs font-bold cursor-pointer up-md3-ripple"
            >
              Save Profile Preferences
            </button>

            {savedMsg && (
              <div className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 text-center">
                {savedMsg}
              </div>
            )}
          </form>
        )}

        {isAdmin && (
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenAdmin();
            }}
            className="w-full py-2.5 rounded-xl bg-[#0A1633] text-[#F59E0B] text-xs font-bold flex items-center justify-center gap-2 cursor-pointer up-gold-rim"
          >
            <Shield className="w-4 h-4" />
            Open Admin Dashboard
          </button>
        )}

        <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-2.5">
          <button
            type="button"
            onClick={handleExport}
            className="w-full py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold flex items-center justify-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            Export My Predictions (DPDP Data Right)
          </button>

          {isSignedIn && (
            <>
              {!confirmDelete ? (
                <button
                  type="button"
                  onClick={() => setConfirmDelete(true)}
                  className="w-full py-2.5 rounded-xl border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete Account &amp; Personal Data
                </button>
              ) : (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 space-y-2 text-center">
                  <p className="text-xs text-rose-700 dark:text-rose-300 font-semibold">
                    Permanently erase your cloud profile, predictions, and leaderboard entry?
                  </p>
                  <div className="flex gap-2 justify-center">
                    <button
                      type="button"
                      onClick={() => setConfirmDelete(false)}
                      className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 text-xs font-semibold cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => void onDeleteAccountData()}
                      className="px-3 py-1.5 rounded-lg bg-rose-600 text-white text-xs font-bold cursor-pointer"
                    >
                      Confirm Delete
                    </button>
                  </div>
                </div>
              )}

              <button
                type="button"
                onClick={() => void onSignOut()}
                className="w-full py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-bold flex items-center justify-center gap-2 cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </>
          )}

          <div className="pt-2 text-center text-[11px] font-mono-num text-slate-400 dark:text-slate-500">
            UP Mandate · 403 Vidhan Sabha Seats
          </div>
        </div>
      </div>
    </div>
  );
};

interface LegalModalProps {
  open: boolean;
  onClose: () => void;
}

export const LegalComplianceModal: React.FC<LegalModalProps> = ({ open, onClose }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="w-full max-w-2xl rounded-3xl bg-white dark:bg-[#0E1A36] border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-4 max-h-[88vh] overflow-y-auto up-neon-rim">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-5 h-5 text-blue-600 dark:text-cyan-400" />
            <h3 className="font-display font-bold text-lg text-slate-900 dark:text-white">
              Legal Compliance, Privacy Policy &amp; Terms
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close legal modal"
            className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-4 text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
          <section className="space-y-1">
            <h4 className="font-display font-bold text-slate-900 dark:text-white">
              1. 100% Free Civic Opinion Platform &amp; ₹50 Lakh Prizes Pool
            </h4>
            <p>
              UP Mandate (&ldquo;Your View. Every Constituency.&rdquo;) is a completely free, zero-entry-fee civic
              opinion and skill-based election forecasting platform. Every registered participant competes on equal
              footing without any paid tier or fee, and top forecasters win prizes and gifts worth ₹50 Lakhs.
              Community forecasts reflect user opinions and must not be construed as official Election Commission of
              India (ECI) results or statutory exit polls.
            </p>
          </section>

          <section className="space-y-1">
            <h4 className="font-display font-bold text-slate-900 dark:text-white">
              2. Indian Election Law Safeguards (RP Act, 1951)
            </h4>
            <p>
              In accordance with Sections 126 and 126A of the Representation of the People Act, 1951 and Election Commission
              directions, statutory blackout controls override submission/display windows during prohibited 48-hour silence
              and exit-poll restriction periods. UP Mandate is not affiliated with or endorsed by the Election Commission of
              India or the Government of Uttar Pradesh.
            </p>
          </section>

          <section className="space-y-1">
            <h4 className="font-display font-bold text-slate-900 dark:text-white">
              3. Privacy &amp; Digital Personal Data Protection Act, 2023
            </h4>
            <p>
              We collect only minimal authentication details (UID, verified mobile number or Google Sign-In display name,
              and optional profile image) to sync your predictions across web and mobile. Phone numbers and email
              addresses are isolated in private storage and are never displayed on public leaderboards. You may export or
              permanently delete your account and associated data at any time via Profile Settings. We do not collect
              Voter ID or Aadhaar numbers.
            </p>
          </section>

          <section className="space-y-1">
            <h4 className="font-display font-bold text-slate-900 dark:text-white">
              4. Leaderboard Scoring &amp; Winner Prizes Worth ₹50 Lakhs
            </h4>
            <p>
              After verified ECI results are published: 10 points per correct constituency winner, 100 points per exact
              party 5-seat range match, and 50 points completion bonus. Top-ranked participants on the free open
              leaderboard qualify for prizes and gifts worth ₹50 Lakhs, subject to applicable Indian law and winner
              verification.
            </p>
          </section>

          <section className="space-y-1">
            <h4 className="font-display font-bold text-slate-900 dark:text-white">
              5. Grievance Officer &amp; Contact
            </h4>
            <p>
              For data correction, deletion requests, or compliance inquiries under IT Rules 2021 and DPDP Act 2023,
              contact the UP Mandate Compliance Desk via the Privacy Request workflow in Profile Settings.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};
