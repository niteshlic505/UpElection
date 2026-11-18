import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ConfirmationResult, updateProfile } from 'firebase/auth';
import { motion } from 'motion/react';
import {
  AlertTriangle,
  ArrowLeft,
  Check,
  CheckCircle2,
  Copy,
  ExternalLink,
  Gift,
  KeyRound,
  Phone,
  RefreshCw,
  ShieldCheck,
  Smartphone,
  User as UserIcon,
  X,
} from 'lucide-react';
import {
  RecaptchaVerifier,
  auth,
  checkCurrentDomainAuthorized,
  getFirebaseErrorCode,
  mapFirebaseAuthError,
  signInWithPhoneNumber,
} from '../firebase';
import firebaseConfig from '../../firebase-applet-config.json';
import { AppLanguage } from '../types/election';
import { TRANSLATIONS } from '../i18n/translations';

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
  language: AppLanguage;
  onGoogleSignIn: () => Promise<void>;
  onPhoneVerified?: (uid: string, displayNameInput?: string) => Promise<void>;
}

const COUNTRY_CODES = [
  { code: '+91', label: '+91 (IN)' },
  { code: '+1', label: '+1 (US/CA)' },
  { code: '+44', label: '+44 (UK)' },
  { code: '+971', label: '+971 (UAE)' },
];

export const AuthModal: React.FC<AuthModalProps> = ({
  open,
  onClose,
  language,
  onGoogleSignIn,
  onPhoneVerified,
}) => {
  const t = TRANSLATIONS[language].auth;
  const [countryCode, setCountryCode] = useState('+91');
  const [phoneDigits, setPhoneDigits] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [otpDigits, setOtpDigits] = useState('');
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [recaptchaMode, setRecaptchaMode] = useState<'invisible' | 'normal'>('invisible');
  const [recaptchaLoading, setRecaptchaLoading] = useState(false);
  const [recaptchaReady, setRecaptchaReady] = useState(false);
  const [recaptchaSolved, setRecaptchaSolved] = useState(false);
  const [recaptchaMountNonce, setRecaptchaMountNonce] = useState(0);
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [googleBusy, setGoogleBusy] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [infoMsg, setInfoMsg] = useState<string | null>(null);
  const [domainStatus, setDomainStatus] = useState<{
    authorized: boolean | null;
    host: string;
  }>({ authorized: null, host: '' });
  const [copiedHost, setCopiedHost] = useState(false);

  const recaptchaMountRef = useRef<HTMLDivElement | null>(null);
  const verifierRef = useRef<RecaptchaVerifier | null>(null);

  const clearVerifier = useCallback(() => {
    if (verifierRef.current) {
      try {
        verifierRef.current.clear();
      } catch {
        // ignore cleanup failure
      }
      verifierRef.current = null;
    }
    if (recaptchaMountRef.current) {
      recaptchaMountRef.current.innerHTML = '';
    }
    setRecaptchaReady(false);
    setRecaptchaSolved(false);
    setRecaptchaLoading(false);
  }, []);

  useEffect(() => {
    if (!open) {
      clearVerifier();
      setErrorMsg(null);
      setInfoMsg(null);
      setCopiedHost(false);
      return;
    }

    let cancelled = false;
    void checkCurrentDomainAuthorized(true).then((res) => {
      if (!cancelled) {
        setDomainStatus({ authorized: res.authorized, host: res.host });
      }
    });
    return () => {
      cancelled = true;
    };
  }, [open, clearVerifier]);

  // If user switches to visible reCAPTCHA mode on the phone step, pre-render the interactive widget immediately
  useEffect(() => {
    if (!open || step !== 'phone' || recaptchaMode !== 'normal') return;
    let cancelled = false;
    setRecaptchaLoading(true);
    setRecaptchaReady(false);
    setRecaptchaSolved(false);

    const mountTimer = setTimeout(async () => {
      if (cancelled || !recaptchaMountRef.current) return;
      clearVerifier();
      if (cancelled || !recaptchaMountRef.current) return;
      setRecaptchaLoading(true);

      try {
        auth.languageCode = language === 'hi' ? 'hi' : 'en';
        const widgetNode = document.createElement('div');
        recaptchaMountRef.current.appendChild(widgetNode);
        const verifier = new RecaptchaVerifier(auth, widgetNode, {
          size: 'normal',
          callback: () => {
            if (!cancelled) {
              setRecaptchaSolved(true);
              setErrorMsg(null);
            }
          },
          'expired-callback': () => {
            if (!cancelled) {
              setRecaptchaSolved(false);
              setErrorMsg(
                language === 'hi'
                  ? 'सुरक्षा सत्यापन समय समाप्त हो गया। कृपया बॉक्स पर पुनः टिक करें।'
                  : 'Security check expired. Please tick the "I\'m not a robot" box again.',
              );
            }
          },
          'error-callback': () => {
            if (!cancelled) {
              setRecaptchaSolved(false);
              setErrorMsg(
                language === 'hi'
                  ? 'reCAPTCHA लोड नहीं हो सका। कृपया Ad-blocker बंद करके पुनः प्रयास करें।'
                  : 'Could not load reCAPTCHA widget. Disable ad/tracker blockers or check Authorized Domains in Firebase Console.',
              );
            }
          },
        });
        verifierRef.current = verifier;
        await verifier.render();
        if (!cancelled) {
          setRecaptchaReady(true);
          setRecaptchaLoading(false);
        }
      } catch (renderErr) {
        if (!cancelled) {
          setRecaptchaLoading(false);
          setRecaptchaReady(false);
          const renderCode = getFirebaseErrorCode(renderErr);
          const renderText = renderErr instanceof Error ? renderErr.message : String(renderErr);
          setErrorMsg(
            language === 'hi'
              ? `सुरक्षा जांच बॉक्स लोड नहीं हो सका (${renderCode || renderText})। कृपया Ad-blocker बंद करें या Reload दबाएं।`
              : `Could not render security check box (${renderCode || renderText}). Disable ad blockers or click Reload Check below.`,
          );
        }
      }
    }, 60);

    return () => {
      cancelled = true;
      clearTimeout(mountTimer);
      clearVerifier();
    };
  }, [open, step, recaptchaMode, language, recaptchaMountNonce, clearVerifier]);

  useEffect(() => {
    if (resendTimer <= 0) return;
    const id = setTimeout(() => setResendTimer((v) => Math.max(0, v - 1)), 1000);
    return () => clearTimeout(id);
  }, [resendTimer]);

  const normalizePhoneDigits = (raw: string, code: string): string => {
    let digits = raw.replace(/\D/g, '');
    if (code === '+91') {
      if (digits.length === 12 && digits.startsWith('91')) {
        digits = digits.slice(2);
      } else if (digits.length === 11 && digits.startsWith('0')) {
        digits = digits.slice(1);
      }
    }
    return digits;
  };

  const handleCopyDomain = async () => {
    if (!domainStatus.host || typeof navigator === 'undefined' || !navigator.clipboard) return;
    try {
      await navigator.clipboard.writeText(domainStatus.host);
      setCopiedHost(true);
      setTimeout(() => setCopiedHost(false), 2000);
    } catch {
      // ignore clipboard errors
    }
  };

  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMsg(null);
    setInfoMsg(null);

    if (domainStatus.authorized === false) {
      setErrorMsg(mapFirebaseAuthError(new Error('auth/unauthorized-domain'), language, false));
      return;
    }

    const cleanDigits = normalizePhoneDigits(phoneDigits, countryCode);
    if (countryCode === '+91' && cleanDigits.length !== 10) {
      setErrorMsg(
        language === 'hi'
          ? 'कृपया 10-अंकीय भारतीय मोबाइल नंबर दर्ज करें।'
          : 'Please enter a valid 10-digit Indian mobile number.',
      );
      return;
    }
    if (cleanDigits.length < 7 || cleanDigits.length > 15) {
      setErrorMsg(
        language === 'hi'
          ? 'कृपया मान्य मोबाइल नंबर दर्ज करें।'
          : 'Please enter a valid mobile number.',
      );
      return;
    }

    // If user triggers Resend OTP from the OTP screen while in visible checkbox mode, return to phone step cleanly
    if (step === 'otp' && recaptchaMode === 'normal') {
      clearVerifier();
      setStep('phone');
      setRecaptchaMountNonce((n) => n + 1);
      setErrorMsg(
        language === 'hi'
          ? 'नया OTP भेजने के लिए कृपया नीचे "I\'m not a robot" बॉक्स पर पुनः टिक करें।'
          : 'Please tick the "I\'m not a robot" checkbox below to send a fresh OTP.',
      );
      return;
    }

    if (recaptchaMode === 'normal') {
      if (!verifierRef.current || !recaptchaReady) {
        setRecaptchaMountNonce((n) => n + 1);
        setErrorMsg(
          language === 'hi'
            ? 'सुरक्षा जांच बॉक्स लोड हो रहा है। कृपया लोड होने के बाद बॉक्स पर टिक करें।'
            : 'Security check box is loading. Please wait for it to appear, tick "I\'m not a robot", and tap Send Verification OTP.',
        );
        return;
      }
      if (!recaptchaSolved) {
        setErrorMsg(
          language === 'hi'
            ? 'कृपया पहले नीचे दिए गए "I\'m not a robot" बॉक्स पर टिक करें, फिर OTP भेजें।'
            : 'Please tick the "I\'m not a robot" checkbox below before tapping Send Verification OTP.',
        );
        return;
      }
    }

    const e164Phone = `${countryCode}${cleanDigits}`;
    setSendingOtp(true);
    try {
      auth.languageCode = language === 'hi' ? 'hi' : 'en';

      let verifier = verifierRef.current;
      if (recaptchaMode === 'invisible' || !verifier) {
        clearVerifier();
        if (!recaptchaMountRef.current) {
          throw new Error('Verification container unavailable.');
        }
        const widgetNode = document.createElement('div');
        recaptchaMountRef.current.appendChild(widgetNode);
        verifier = new RecaptchaVerifier(auth, widgetNode, {
          size: 'invisible',
          'expired-callback': () => {
            clearVerifier();
          },
          'error-callback': () => {
            clearVerifier();
          },
        });
        verifierRef.current = verifier;
        await verifier.render();
      }

      const result = await signInWithPhoneNumber(auth, e164Phone, verifier);
      setConfirmationResult(result);
      setStep('otp');
      setOtpDigits('');
      setResendTimer(30);
      setInfoMsg(t.otpSentTo(e164Phone));
      if (recaptchaMode === 'invisible') {
        clearVerifier();
      }
    } catch (err) {
      const code = getFirebaseErrorCode(err);
      const isCaptchaIssue =
        code === 'auth/captcha-check-failed' ||
        code === 'auth/invalid-app-credential' ||
        code === 'auth/missing-app-credential' ||
        code === 'auth/missing-client-identifier' ||
        (err instanceof Error && err.message.toLowerCase().includes('recaptcha'));

      const domainCheck =
        isCaptchaIssue || code === 'auth/unauthorized-domain' || code === 'auth/app-not-authorized'
          ? await checkCurrentDomainAuthorized(true)
          : { authorized: domainStatus.authorized, host: domainStatus.host };

      if (domainCheck.authorized !== null) {
        setDomainStatus({
          authorized: domainCheck.authorized,
          host: domainCheck.host || domainStatus.host,
        });
      }

      clearVerifier();
      if (domainCheck.authorized !== false && isCaptchaIssue && recaptchaMode === 'invisible') {
        setRecaptchaMode('normal');
        if (step === 'otp') setStep('phone');
      } else if (recaptchaMode === 'normal') {
        setRecaptchaMountNonce((n) => n + 1);
      }
      setErrorMsg(mapFirebaseAuthError(err, language, domainCheck.authorized));
    } finally {
      setSendingOtp(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirmationResult) return;
    setErrorMsg(null);

    const cleanOtp = otpDigits.replace(/\D/g, '');
    if (cleanOtp.length !== 6) {
      setErrorMsg(
        language === 'hi'
          ? 'कृपया 6-अंकीय OTP दर्ज करें।'
          : 'Please enter the 6-digit OTP code.',
      );
      return;
    }

    setVerifyingOtp(true);
    try {
      const cred = await confirmationResult.confirm(cleanOtp);
      const trimmedName = displayName.trim().slice(0, 40);
      if (cred.user && trimmedName) {
        try {
          await updateProfile(cred.user, { displayName: trimmedName });
        } catch {
          // ignore profile displayName update failure
        }
      }
      if (cred.user && onPhoneVerified) {
        await onPhoneVerified(cred.user.uid, trimmedName || undefined);
      }
      clearVerifier();
      setStep('phone');
      setOtpDigits('');
      onClose();
    } catch (err) {
      setErrorMsg(mapFirebaseAuthError(err, language, domainStatus.authorized));
    } finally {
      setVerifyingOtp(false);
    }
  };

  const handleGoogleClick = async () => {
    setErrorMsg(null);
    setGoogleBusy(true);
    try {
      await onGoogleSignIn();
      onClose();
    } catch (err) {
      const code = getFirebaseErrorCode(err);
      let authorized = domainStatus.authorized;
      if (code === 'auth/unauthorized-domain' || code === 'auth/app-not-authorized') {
        const res = await checkCurrentDomainAuthorized(true);
        authorized = res.authorized;
        setDomainStatus({ authorized: res.authorized, host: res.host || domainStatus.host });
      }
      setErrorMsg(
        code || authorized === false
          ? mapFirebaseAuthError(err, language, authorized)
          : err instanceof Error
          ? err.message
          : 'Google Sign-In failed.',
      );
    } finally {
      setGoogleBusy(false);
    }
  };

  if (!open || typeof document === 'undefined') return null;

  const isBusy = sendingOtp || verifyingOtp || googleBusy;
  const firebaseAuthSettingsUrl = `https://console.firebase.google.com/project/${firebaseConfig.projectId}/authentication/settings`;

  return createPortal(
    <div
      onClick={() => {
        if (!isBusy) onClose();
      }}
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto"
    >
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-t-3xl sm:rounded-3xl bg-white dark:bg-[#0E1A36] border border-amber-500/35 dark:border-cyan-400/30 shadow-2xl overflow-hidden up-neon-rim up-neon-edge max-h-[92dvh] overflow-y-auto pb-safe"
      >
        <div className="up-tiranga-bar w-full" aria-hidden="true" />

        <div className="p-5 sm:p-6 space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#FF9933] via-[#F59E0B] to-[#D97706] text-slate-950 flex items-center justify-center shadow-md shrink-0 up-gold-rim">
                <Smartphone className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h3 className="font-display font-bold text-lg text-slate-900 dark:text-white leading-tight">
                  {t.authModalTitle}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {t.authModalSub}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close sign in dialog"
              className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center cursor-pointer transition-colors shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* 100% Free + 50 Lakh Prizes Highlight */}
          <div className="rounded-2xl bg-gradient-to-r from-[#091534] via-[#112456] to-[#1D4ED8] text-white p-3.5 flex items-center gap-3 up-gold-rim">
            <span className="w-9 h-9 rounded-xl bg-[#F59E0B] text-slate-950 flex items-center justify-center shrink-0">
              <Gift className="w-4 h-4" />
            </span>
            <div className="text-xs leading-snug min-w-0">
              <div className="font-display font-bold text-[#F59E0B]">
                {language === 'hi'
                  ? '100% निःशुल्क भागीदारी · ₹50 लाख के पुरस्कार'
                  : '100% Free Entry · ₹50 Lakh Prizes & Gifts'}
              </div>
              <div className="text-blue-100/90 text-[11px]">
                {language === 'hi'
                  ? 'मोबाइल OTP या Google से साइन अप / लॉगिन करें'
                  : 'Sign up or log in securely with Mobile OTP or Google'}
              </div>
            </div>
          </div>

          {/* Upfront Firebase Authorized Domain Alert (blocks both Google Sign-In & Phone OTP if host is not registered) */}
          {domainStatus.authorized === false && domainStatus.host && (
            <div className="rounded-2xl bg-amber-50 dark:bg-amber-950/50 border border-amber-300 dark:border-amber-700 p-3.5 text-xs text-amber-950 dark:text-amber-100 space-y-2">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div className="min-w-0 leading-relaxed">
                  <div className="font-bold">
                    {language === 'hi'
                      ? `डोमेन "${domainStatus.host}" अभी Firebase में अधिकृत नहीं है`
                      : `Domain "${domainStatus.host}" is not authorized in Firebase yet`}
                  </div>
                  <p className="text-[11px] opacity-90 mt-0.5">
                    {language === 'hi'
                      ? `Google लॉगिन और मोबाइल OTP चालू करने के लिए Firebase Console (${firebaseConfig.projectId}) → Authentication → Settings → Authorized domains में इसे जोड़ें:`
                      : `Both Google Sign-In & Mobile OTP require adding this domain under Firebase Console (${firebaseConfig.projectId}) → Authentication → Settings → Authorized domains:`}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2 pt-0.5">
                <button
                  type="button"
                  onClick={() => void handleCopyDomain()}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-amber-200/80 dark:bg-amber-800/70 hover:bg-amber-300 dark:hover:bg-amber-700 font-mono-num font-bold text-[11px] cursor-pointer"
                >
                  {copiedHost ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedHost ? 'Copied!' : domainStatus.host}</span>
                </button>
                <a
                  href={firebaseAuthSettingsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-900 dark:bg-amber-500 text-white dark:text-slate-950 font-bold text-[11px] hover:opacity-90"
                >
                  <span>
                    {language === 'hi' ? 'Firebase Console खोलें' : 'Open Firebase Settings'}
                  </span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          )}

          {/* Phone + OTP Section */}
          {step === 'phone' ? (
            <form onSubmit={(e) => void handleSendOtp(e)} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
                  {t.mobileLabel}
                </label>
                <div className="flex gap-2">
                  <select
                    value={countryCode}
                    onChange={(e) => setCountryCode(e.target.value)}
                    aria-label="Country dial code"
                    className="px-2.5 py-2.5 min-h-[44px] rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/80 text-sm sm:text-xs font-mono-num font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-400"
                  >
                    {COUNTRY_CODES.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                  <div className="relative flex-1 min-w-0">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="tel"
                      inputMode="numeric"
                      autoComplete="tel-national"
                      maxLength={15}
                      value={phoneDigits}
                      onChange={(e) => setPhoneDigits(e.target.value.replace(/[^\d+\s-]/g, ''))}
                      placeholder={t.mobilePlaceholder}
                      className="w-full min-h-[44px] pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/80 text-base sm:text-sm font-mono-num font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
                  {t.nameOptionalLabel}
                </label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    maxLength={40}
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder={t.nameOptionalPlaceholder}
                    className="w-full min-h-[44px] pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/80 text-base sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                  />
                </div>
              </div>

              {errorMsg && (
                <div className="rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 p-3 text-xs font-semibold text-rose-700 dark:text-rose-300 leading-relaxed break-words">
                  {errorMsg}
                </div>
              )}

              <button
                type="submit"
                disabled={sendingOtp}
                className="w-full min-h-[46px] py-3 rounded-xl bg-gradient-to-r from-[#FF9933] via-[#F59E0B] to-amber-500 hover:from-amber-400 hover:to-amber-500 disabled:opacity-60 text-slate-950 font-display font-extrabold text-sm flex items-center justify-center gap-2 up-gold-rim up-md3-ripple cursor-pointer"
              >
                <Smartphone className="w-4 h-4" />
                <span>{sendingOtp ? t.sendingOtp : t.sendOtp}</span>
              </button>

              <div className="flex justify-center">
                <button
                  type="button"
                  onClick={() => {
                    setErrorMsg(null);
                    clearVerifier();
                    setRecaptchaMode((m) => (m === 'invisible' ? 'normal' : 'invisible'));
                  }}
                  className="text-[11px] font-semibold text-blue-600 dark:text-cyan-400 hover:underline cursor-pointer"
                >
                  {recaptchaMode === 'invisible'
                    ? language === 'hi'
                      ? 'OTP में समस्या? दृश्य कैप्चा बॉक्स आज़माएं'
                      : 'Trouble sending OTP? Switch to visible security check'
                    : language === 'hi'
                    ? 'अदृश्य सुरक्षा जांच पर वापस जाएं'
                    : 'Use automatic invisible security check'}
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={(e) => void handleVerifyOtp(e)} className="space-y-3.5">
              {infoMsg && (
                <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 p-3 text-xs font-semibold text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{infoMsg}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
                  {t.enterOtpLabel}
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    value={otpDigits}
                    onChange={(e) => setOtpDigits(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="• • • • • •"
                    className="w-full min-h-[48px] pl-9 pr-3 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/80 text-center text-lg tracking-[0.45em] font-mono-num font-bold text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                  />
                </div>
              </div>

              {errorMsg && (
                <div className="rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 p-3 text-xs font-semibold text-rose-700 dark:text-rose-300 leading-relaxed break-words">
                  {errorMsg}
                </div>
              )}

              <button
                type="submit"
                disabled={verifyingOtp}
                className="w-full min-h-[46px] py-3 rounded-xl bg-gradient-to-r from-[#1D4ED8] to-[#0891B2] hover:opacity-95 disabled:opacity-60 text-white font-display font-bold text-sm flex items-center justify-center gap-2 up-neon-cyan up-md3-ripple cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>{verifyingOtp ? t.verifyingOtp : t.verifyOtp}</span>
              </button>

              <div className="flex items-center justify-between gap-2 text-xs pt-0.5">
                <button
                  type="button"
                  onClick={() => {
                    clearVerifier();
                    setStep('phone');
                    setErrorMsg(null);
                    setInfoMsg(null);
                  }}
                  className="inline-flex items-center gap-1 min-h-[36px] text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white font-semibold cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>{t.changeNumber}</span>
                </button>

                <button
                  type="button"
                  disabled={resendTimer > 0 || sendingOtp}
                  onClick={() => void handleSendOtp()}
                  className="inline-flex items-center gap-1 min-h-[36px] text-blue-600 dark:text-cyan-400 disabled:text-slate-400 font-semibold cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>
                    {resendTimer > 0 ? t.resendIn(resendTimer) : t.resendOtp}
                  </span>
                </button>
              </div>
            </form>
          )}

          {/* Persistent reCAPTCHA mount container (stays mounted across BOTH phone & otp steps so Resend OTP never loses the node) */}
          <div
            className={
              step === 'phone' && recaptchaMode === 'normal'
                ? 'rounded-2xl border border-slate-200 dark:border-slate-700/80 bg-slate-50/90 dark:bg-slate-900/60 p-3 flex flex-col items-center justify-center gap-2 min-h-[92px]'
                : 'flex justify-center overflow-x-auto min-h-[1px]'
            }
          >
            {step === 'phone' && recaptchaMode === 'normal' && recaptchaLoading && (
              <div className="text-xs font-semibold text-slate-500 dark:text-slate-300 flex items-center gap-2">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>
                  {language === 'hi'
                    ? 'सुरक्षा जांच ("I\'m not a robot") लोड हो रहा है...'
                    : 'Loading "I\'m not a robot" security check...'}
                </span>
              </div>
            )}
            <div
              ref={recaptchaMountRef}
              className="flex justify-center overflow-x-auto max-w-full"
            />
            {step === 'phone' && recaptchaMode === 'normal' && !recaptchaLoading && (
              <button
                type="button"
                onClick={() => {
                  setErrorMsg(null);
                  setRecaptchaMountNonce((n) => n + 1);
                }}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-cyan-400 cursor-pointer"
              >
                <RefreshCw className="w-3 h-3" />
                <span>
                  {language === 'hi'
                    ? 'सुरक्षा बॉक्स पुनः लोड करें'
                    : 'Reload security check'}
                </span>
              </button>
            )}
          </div>

          {/* Divider */}
          <div className="relative flex items-center py-0.5">
            <div className="flex-grow border-t border-slate-200 dark:border-slate-700/80" />
            <span className="shrink mx-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              {t.orDivider}
            </span>
            <div className="flex-grow border-t border-slate-200 dark:border-slate-700/80" />
          </div>

          {/* Google Sign-In Option */}
          <button
            type="button"
            disabled={googleBusy}
            onClick={() => void handleGoogleClick()}
            className="w-full min-h-[46px] py-3 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/70 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-900 dark:text-white font-semibold text-sm flex items-center justify-center gap-3 shadow-xs transition-colors up-md3-ripple cursor-pointer disabled:opacity-60"
          >
            <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
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
            <span>{googleBusy ? t.signingInGoogle : t.continueGoogle}</span>
          </button>
        </div>
      </motion.div>
    </div>,
    document.body,
  );
};
