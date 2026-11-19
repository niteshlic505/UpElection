import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { AppLanguage } from '../types/election';

interface LoadingScreenProps {
  visible: boolean;
  language: AppLanguage;
  authReady: boolean;
  onFinish: () => void;
}

const LOADING_MONTAGE_SRC =
  '/assets/aistudio/file_00000000237c82118a0413328d5b5651_3f0a24ea.png';

export const LoadingScreen: React.FC<LoadingScreenProps> = ({
  visible,
  language,
  authReady,
  onFinish,
}) => {
  const [progress, setProgress] = useState(14);
  const [imgLoaded, setImgLoaded] = useState(false);

  useEffect(() => {
    if (!visible) return;
    let rafId = 0;
    const startTime = performance.now();
    const minDurationMs = 2100;
    const maxDurationMs = 3400;
    let finished = false;

    const tick = (now: number) => {
      const elapsed = now - startTime;
      const ratio = Math.min(1, elapsed / minDurationMs);
      const eased = 1 - Math.pow(1 - ratio, 2.4);
      const computed = Math.round(12 + eased * (authReady ? 88 : 80));
      setProgress((prev) => Math.max(prev, Math.min(100, computed)));

      const readyToExit =
        (elapsed >= minDurationMs && authReady) || elapsed >= maxDurationMs;

      if (readyToExit && !finished) {
        finished = true;
        setProgress(100);
        window.setTimeout(() => onFinish(), 260);
        return;
      }
      rafId = window.requestAnimationFrame(tick);
    };

    rafId = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(rafId);
  }, [visible, authReady, onFinish]);

  const statusText =
    language === 'hi'
      ? progress < 45
        ? '403 विधानसभा क्षेत्र लोड हो रहे हैं...'
        : progress < 82
        ? '75 जिलों व दलों का डेटा तैयार हो रहा है...'
        : 'यूपी 2027 पूर्वानुमान तैयार है'
      : progress < 45
      ? 'Loading 403 UP Assembly Constituencies...'
      : progress < 82
      ? 'Preparing 75 Districts & Alliance Data...'
      : 'Ready for UP Mandate 2027';

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="up-loading-screen"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.03 }}
          transition={{ duration: 0.42, ease: [0.16, 1, 0.3, 1] }}
          className="fixed inset-0 z-[100] flex flex-col items-center justify-between bg-[#040A18] text-white overflow-hidden select-none pt-safe pb-safe px-3 sm:px-6 py-4 sm:py-6"
          role="status"
          aria-live="polite"
          aria-label="Loading UP Mandate 2027"
        >
          {/* Full-Bleed Blurred Atmospheric Backdrop of the Montage */}
          <div aria-hidden="true" className="absolute inset-0 pointer-events-none overflow-hidden">
            <img
              src={LOADING_MONTAGE_SRC}
              alt=""
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover object-center scale-115 blur-2xl opacity-45 saturate-150"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-[#040A18]/80 via-[#071535]/55 to-[#040A18]/92" />
            {/* Volumetric Neon Blue & Saffron Ambient Glows */}
            <div className="absolute -top-20 -left-16 w-72 h-72 rounded-full bg-cyan-400/20 blur-3xl up-neon-core-pulse" />
            <div className="absolute -bottom-24 -right-16 w-80 h-80 rounded-full bg-blue-600/25 blur-3xl up-neon-core-pulse" />
            <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-64 h-64 rounded-full bg-amber-400/12 blur-3xl" />
          </div>

          {/* Top Tiranga Accent Ribbon + Subtle Skip Action */}
          <div className="relative z-10 w-full max-w-md flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs sm:text-sm font-display font-extrabold tracking-tight">
              <span className="text-white">
                UP <span className="text-[#FF9933] up-neon-text-gold-strong">Mandate</span>
              </span>
              <span aria-hidden="true" className="text-cyan-300/70">
                ·
              </span>
              <span className="text-cyan-200 font-semibold text-[11px] sm:text-xs">
                {language === 'hi' ? 'विधानसभा 2027' : 'Assembly 2027'}
              </span>
            </div>

            <button
              type="button"
              onClick={onFinish}
              className="px-3 py-1.5 min-h-[36px] rounded-xl bg-white/10 hover:bg-white/20 border border-cyan-300/30 text-[11px] sm:text-xs font-semibold text-cyan-100 backdrop-blur-md transition-colors cursor-pointer whitespace-nowrap"
            >
              {language === 'hi' ? 'प्रवेश करें →' : 'Enter →'}
            </button>
          </div>

          {/* Centerpiece: 3D Framed Montage Poster with Rotating Blue Neon Perimeter Line */}
          <div className="relative z-10 flex-1 w-full flex items-center justify-center min-h-0 py-3 sm:py-4 up-stage-3d">
            <motion.div
              initial={{ opacity: 0, y: 14, scale: 0.94, rotateX: 8 }}
              animate={{ opacity: 1, y: 0, scale: 1, rotateX: 0 }}
              transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
              className="relative h-full max-h-[70dvh] sm:max-h-[72dvh] max-w-[92vw] aspect-[9/16] flex items-center justify-center up-prize-float"
            >
              <div className="up-blue-trace-shell w-full h-full">
                {/* Soft Outer Blue Halo Following the Moving Line */}
                <div aria-hidden="true" className="up-blue-trace-halo">
                  <div className="up-blue-trace-beam" />
                </div>

                {/* Razor-Sharp Rotating 3D Blue Neon Line Around Poster */}
                <div aria-hidden="true" className="up-blue-trace-track">
                  <div className="up-blue-trace-beam" />
                  <div className="up-blue-trace-beam-twin" />
                </div>

                {/* Inner Poster Canvas */}
                <div className="relative z-10 w-full h-full rounded-[21.5px] overflow-hidden bg-[#06112B] ring-1 ring-inset ring-cyan-200/35">
                  <img
                    src={LOADING_MONTAGE_SRC}
                    alt="Uttar Pradesh Assembly Election 2027 — All Party Leaders Montage"
                    referrerPolicy="no-referrer"
                    onLoad={() => setImgLoaded(true)}
                    className={`w-full h-full object-cover object-center transition-opacity duration-300 ${
                      imgLoaded ? 'opacity-100' : 'opacity-0'
                    }`}
                  />
                  {/* Subtle Specular Glass Sheen Sweep */}
                  <div
                    aria-hidden="true"
                    className="absolute inset-0 up-neon-shimmer pointer-events-none"
                  />
                </div>
              </div>
            </motion.div>
          </div>

          {/* Bottom Aesthetic Neon Glass Loading Bar Dock */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="relative z-10 w-full max-w-md rounded-2xl bg-[#06112B]/85 backdrop-blur-xl border border-cyan-400/35 px-4 py-3.5 shadow-[0_0_28px_-6px_rgba(56,189,248,0.45)] space-y-2.5"
          >
            <div className="flex items-center justify-between gap-2 text-xs">
              <span className="font-semibold text-blue-100 truncate">{statusText}</span>
              <span className="font-mono-num font-extrabold text-cyan-300 up-neon-text-blue shrink-0">
                {progress}%
              </span>
            </div>

            {/* Neon Animated Progress Track */}
            <div className="relative h-2.5 w-full rounded-full bg-slate-900/90 border border-cyan-400/25 overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-[#2563EB] via-[#00F0FF] to-[#FF9933] shadow-[0_0_16px_rgba(0,240,255,0.85)]"
                initial={{ width: '12%' }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
              />
            </div>

            <div className="flex items-center justify-between text-[11px] text-blue-200/80 font-medium">
              <span>{language === 'hi' ? '403 सीटें · 75 जिले' : '403 Seats · 75 Districts'}</span>
              <span className="text-amber-300 font-semibold">
                {language === 'hi' ? '100% निःशुल्क · ₹50 लाख पुरस्कार' : '100% Free · ₹50 Lakh Prizes'}
              </span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
