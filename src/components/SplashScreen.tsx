import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { AppLanguage } from '../types/election';

interface SplashScreenProps {
  visible: boolean;
  language: AppLanguage;
  authReady: boolean;
  onFinish: () => void;
}

const STAGES_EN = [
  'Initializing UP Mandate App View',
  'Loading 403 Assembly Constituencies',
  'Calibrating Alliance & Party Neon Engine',
  'Ready — Launching Experience',
];

const STAGES_HI = [
  'UP मैंडेट ऐप प्रारंभ हो रहा है',
  '403 विधानसभा क्षेत्र लोड हो रहे हैं',
  'गठबंधन और पार्टी विश्लेषण तैयार हो रहा है',
  'प्रारंभ के लिए तैयार',
];

export const SplashScreen: React.FC<SplashScreenProps> = ({
  visible,
  language,
  authReady,
  onFinish,
}) => {
  const [progress, setProgress] = useState(8);

  useEffect(() => {
    if (!visible) return;

    const startTime = performance.now();
    const minDurationMs = 1550;
    let rafId = 0;
    let completed = false;

    const tick = (now: number) => {
      const elapsed = now - startTime;
      const timeFraction = Math.min(1, elapsed / minDurationMs);
      // Smooth cubic ease-out toward 94% until authReady confirms 100%
      const eased = 1 - Math.pow(1 - timeFraction, 2.4);
      const ceiling = authReady ? 100 : 92;
      const targetProgress = Math.max(8, Math.round(8 + eased * (ceiling - 8)));
      setProgress(targetProgress);

      if (timeFraction >= 1 && authReady && !completed) {
        completed = true;
        setProgress(100);
        window.setTimeout(() => {
          onFinish();
        }, 240);
        return;
      }

      if (elapsed >= 3200 && !completed) {
        completed = true;
        setProgress(100);
        onFinish();
        return;
      }

      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [visible, authReady, onFinish]);

  const stages = language === 'hi' ? STAGES_HI : STAGES_EN;
  const stageIdx =
    progress < 32 ? 0 : progress < 64 ? 1 : progress < 96 ? 2 : 3;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="up-splash-overlay"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.03, filter: 'blur(6px)' }}
          transition={{ duration: 0.42, ease: [0.16, 1, 0.3, 1] }}
          className="fixed inset-0 h-dvh z-50 flex flex-col items-center justify-center overflow-hidden bg-[#040917] text-white select-none px-5 pt-safe pb-safe"
          aria-label="UP Mandate Loading Screen"
        >
          {/* Ambient UP Artwork Atmospheric Backdrop */}
          <img
            src="/assets/aistudio/UP_Election_App_Icon_1024_d13a55bb.jpg"
            alt=""
            aria-hidden="true"
            referrerPolicy="no-referrer"
            className="absolute inset-0 w-full h-full object-cover object-center opacity-20 scale-110 blur-xl pointer-events-none"
          />
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-gradient-to-b from-[#040917]/90 via-[#081536]/82 to-[#040917]/96"
          />
          {/* Subtle UP Chikankari Lattice & Radial Saffron/Cyan Neon Aura */}
          <div aria-hidden="true" className="absolute inset-0 up-desi-jaali opacity-65 pointer-events-none" />
          <div
            aria-hidden="true"
            className="absolute -top-24 left-1/2 -translate-x-1/2 w-[480px] h-[280px] rounded-full bg-[#FF9933]/18 blur-[110px] pointer-events-none"
          />
          <div
            aria-hidden="true"
            className="absolute -bottom-24 left-1/2 -translate-x-1/2 w-[460px] h-[260px] rounded-full bg-cyan-400/18 blur-[110px] pointer-events-none"
          />

          {/* Top Tiranga Accent Ribbon */}
          <div className="up-tiranga-bar absolute top-0 inset-x-0" aria-hidden="true" />

          {/* Main 3D Showcase Centerpiece */}
          <div className="relative z-10 w-full max-w-sm sm:max-w-md flex flex-col items-center text-center up-stage-3d">
            {/* Rotating Ashoka Chakra / Rumi Darwaza Neon Halo */}
            <div className="relative mb-5 sm:mb-6 flex items-center justify-center">
              <motion.svg
                aria-hidden="true"
                viewBox="0 0 220 220"
                animate={{ rotate: 360 }}
                transition={{ duration: 24, repeat: Infinity, ease: 'linear' }}
                className="absolute w-44 h-44 sm:w-60 sm:h-60 text-cyan-300/25 pointer-events-none"
                fill="none"
              >
                <circle cx="110" cy="110" r="102" stroke="currentColor" strokeWidth="1.2" strokeDasharray="6 6" />
                <circle cx="110" cy="110" r="88" stroke="#F59E0B" strokeOpacity="0.35" strokeWidth="1" />
                {Array.from({ length: 12 }).map((_, idx) => (
                  <line
                    key={idx}
                    x1="110"
                    y1="8"
                    x2="110"
                    y2="24"
                    stroke="#FF9933"
                    strokeOpacity="0.55"
                    strokeWidth="1.5"
                    transform={`rotate(${idx * 30} 110 110)`}
                  />
                ))}
              </motion.svg>

              {/* Floating 3D App Emblem Card */}
              <motion.div
                initial={{ opacity: 0, scale: 0.86, rotateX: 16, y: 18 }}
                animate={{ opacity: 1, scale: 1, rotateX: 0, y: 0 }}
                transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
                style={{ transformStyle: 'preserve-3d' }}
                className="relative w-32 h-32 sm:w-44 sm:h-44 rounded-[26px] sm:rounded-[28px] overflow-hidden up-neon-pulse up-neon-edge bg-[#0B1736] shadow-2xl"
              >
                <img
                  src="/assets/aistudio/UP_Election_App_Icon_1024_d13a55bb.jpg"
                  alt="Uttar Pradesh Election 2027"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
                <div
                  aria-hidden="true"
                  className="absolute inset-0 bg-gradient-to-t from-[#050B1A]/45 via-transparent to-white/10 pointer-events-none"
                />
              </motion.div>
            </div>

            {/* Bilingual Display Titles */}
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.14, duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
              className="space-y-1.5 mb-7"
            >
              <p className="text-xs sm:text-sm font-semibold tracking-wide text-amber-300">
                {language === 'hi'
                  ? 'उत्तर प्रदेश विधानसभा चुनाव 2027'
                  : 'Uttar Pradesh Assembly Election 2027'}
              </p>
              <h1 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
                UP <span className="text-[#FF9933] up-neon-text-gold">Mandate</span>
              </h1>
              <p className="text-xs sm:text-sm text-blue-100/80 max-w-xs mx-auto">
                {language === 'hi'
                  ? '403 विधानसभा सीटें · 75 जिले · आपका मत'
                  : '403 Constituencies · 75 Districts · Citizen Pulse'}
              </p>
            </motion.div>

            {/* Aesthetic Neon Material 3 Progress Loading Bar */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.22, duration: 0.4 }}
              className="w-full max-w-xs sm:max-w-sm space-y-2.5"
            >
              <div className="flex items-center justify-between text-[11px] sm:text-xs font-medium text-blue-100/85 px-0.5">
                <span className="truncate">{stages[stageIdx]}</span>
                <span className="font-mono-num font-bold text-cyan-300 shrink-0 ml-2">
                  {progress}%
                </span>
              </div>

              {/* Track */}
              <div
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={progress}
                className="relative h-2.5 w-full rounded-full bg-white/10 border border-white/15 overflow-hidden shadow-inner"
              >
                {/* Neon Gradient Progress Fill */}
                <div
                  className="relative h-full rounded-full bg-gradient-to-r from-[#FF9933] via-[#F59E0B] to-cyan-400 transition-[width] duration-150 ease-out shadow-[0_0_16px_rgba(34,211,238,0.75)]"
                  style={{ width: `${progress}%` }}
                >
                  {/* Traveling Light Sweep */}
                  <span
                    aria-hidden="true"
                    className="absolute inset-y-0 right-0 w-10 bg-gradient-to-r from-transparent via-white/75 to-white rounded-full blur-[1px]"
                  />
                </div>
              </div>

              {/* Subtle Tiranga Accent Indicators */}
              <div className="flex items-center justify-center gap-1.5 pt-1 text-[10px] text-slate-400">
                <span>100% Free</span>
                <span aria-hidden="true">·</span>
                <span>403 ECI Seats</span>
                <span aria-hidden="true">·</span>
                <span>App Mode</span>
              </div>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
