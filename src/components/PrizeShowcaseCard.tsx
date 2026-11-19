import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ArrowRight, Gift, Trophy } from 'lucide-react';

interface PrizeShowcaseCardProps {
  badgeFree: string;
  prizeSub: string;
  title: string;
  desc?: string;
  prizeAmount: string;
  headline?: string;
  ctaLabel?: string;
  onCtaClick?: () => void;
  variant?: 'hero' | 'compact';
}

export const PrizeShowcaseCard: React.FC<PrizeShowcaseCardProps> = ({
  badgeFree,
  prizeSub,
  title,
  desc,
  prizeAmount,
  headline,
  ctaLabel,
  onCtaClick,
  variant = 'hero',
}) => {
  const [tilt, setTilt] = useState({ rotateX: 0, rotateY: 0 });
  const [isPointerActive, setIsPointerActive] = useState(false);

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const nx = (e.clientX - rect.left) / rect.width - 0.5;
    const ny = (e.clientY - rect.top) / rect.height - 0.5;
    setIsPointerActive(true);
    setTilt({
      rotateX: Number((-ny * 7).toFixed(2)),
      rotateY: Number((nx * 8).toFixed(2)),
    });
  };

  const handlePointerLeave = () => {
    setIsPointerActive(false);
    setTilt({ rotateX: 0, rotateY: 0 });
  };

  const isHero = variant === 'hero';

  return (
    <div className="up-stage-3d">
      <motion.div
        animate={
          isPointerActive
            ? { rotateX: tilt.rotateX, rotateY: tilt.rotateY }
            : { rotateX: 0, rotateY: 0 }
        }
        transition={{ type: 'spring', stiffness: 200, damping: 20, mass: 0.6 }}
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
        style={{ transformStyle: 'preserve-3d' }}
        className={!isPointerActive ? 'up-prize-float' : ''}
      >
        {/* Outer 3D Neon Blue Traveling Line Square Frame */}
        <div className="up-blue-trace-shell">
          {/* Soft Outer Neon Blue Atmospheric Halo Tracking the Moving Line */}
          <div aria-hidden="true" className="up-blue-trace-halo">
            <div className="up-blue-trace-beam" />
          </div>

          {/* Razor-Sharp 3D Moving Neon Blue Line Around the Perimeter */}
          <div aria-hidden="true" className="up-blue-trace-track">
            <div className="up-blue-trace-beam" />
            <div className="up-blue-trace-beam-twin" />
          </div>

          {/* Inner Midnight Sapphire & Neon Ambient Card Surface */}
          <div
            className={`relative z-10 rounded-[21.5px] bg-gradient-to-br from-[#06112B] via-[#0C2154] to-[#081A44] text-white overflow-hidden up-neon-shimmer ${
              isHero ? 'p-5 sm:p-6 md:p-7' : 'p-4 sm:p-5'
            }`}
            style={{ transformStyle: 'preserve-3d' }}
          >
            {/* Internal Neon Blue & Saffron Volumetric Lighting Orbs */}
            <div
              aria-hidden="true"
              className="absolute -left-16 -top-16 w-56 h-56 rounded-full bg-cyan-400/20 blur-3xl pointer-events-none"
            />
            <div
              aria-hidden="true"
              className="absolute right-10 -bottom-20 w-64 h-64 rounded-full bg-blue-500/25 blur-3xl pointer-events-none"
            />
            <div
              aria-hidden="true"
              className="absolute left-1/3 top-0 w-48 h-24 rounded-full bg-amber-400/15 blur-2xl pointer-events-none"
            />

            {/* Subtle Ashoka Chakra Architectural Linework */}
            <svg
              aria-hidden="true"
              viewBox="0 0 140 140"
              className="absolute -right-8 -top-8 w-44 h-44 text-cyan-300/12 pointer-events-none select-none up-pie-orbit-ring-reverse"
              fill="none"
            >
              <circle cx="70" cy="70" r="54" stroke="currentColor" strokeWidth="1.4" />
              <circle
                cx="70"
                cy="70"
                r="40"
                stroke="currentColor"
                strokeWidth="1"
                strokeDasharray="4 5"
              />
              <circle cx="70" cy="70" r="10" stroke="currentColor" strokeWidth="1.4" />
              {Array.from({ length: 12 }).map((_, idx) => {
                const deg = idx * 30;
                return (
                  <line
                    key={deg}
                    x1="70"
                    y1="16"
                    x2="70"
                    y2="124"
                    stroke="currentColor"
                    strokeWidth="0.9"
                    transform={`rotate(${deg} 70 70)`}
                  />
                );
              })}
            </svg>

            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-5">
              {/* Left: Elevated 3D Emblem + Highlighted Copy */}
              <div
                className="flex items-start gap-3.5 sm:gap-4 min-w-0"
                style={{ transform: 'translateZ(18px)' }}
              >
                {/* 3D Floating Neon Gift / Trophy Cube */}
                <div className="relative shrink-0 up-float-3d">
                  <div
                    aria-hidden="true"
                    className="absolute -inset-1.5 rounded-2xl bg-gradient-to-br from-cyan-400 via-blue-500 to-amber-400 blur-md opacity-65"
                  />
                  <div
                    className={`relative rounded-2xl bg-gradient-to-br from-[#FF9933] via-[#FBBF24] to-[#F59E0B] text-slate-950 flex items-center justify-center shadow-[0_10px_25px_rgba(245,158,11,0.45)] ring-1 ring-white/50 ${
                      isHero ? 'w-13 h-13 sm:w-14 sm:h-14' : 'w-11 h-11 sm:w-12 sm:h-12'
                    }`}
                  >
                    {isHero ? (
                      <Gift className="w-6 h-6 sm:w-7 sm:h-7" />
                    ) : (
                      <Trophy className="w-5 h-5 sm:w-6 sm:h-6" />
                    )}
                  </div>
                </div>

                {/* Highlighted Typography Block */}
                <div className="space-y-1.5 min-w-0">
                  {/* Luminous Highlighted Kicker: 100% FREE TIER · Winner Prizes & Gifts Pool */}
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs sm:text-[13px] font-extrabold tracking-wide">
                    <span className="text-[#38BDF8] up-neon-text-blue">
                      {badgeFree}
                    </span>
                    <span aria-hidden="true" className="text-cyan-300/80">
                      ·
                    </span>
                    <span className="text-amber-300 up-neon-text-gold-strong">
                      {prizeSub}
                    </span>
                  </div>

                  {/* Luminous 3D Display Headline: Win Prizes & Gifts Worth ₹50 Lakhs */}
                  <h3
                    className={`font-display font-extrabold tracking-tight leading-tight text-balance bg-gradient-to-r from-white via-amber-100 to-amber-300 bg-clip-text text-transparent drop-shadow-[0_2px_16px_rgba(56,189,248,0.4)] ${
                      isHero
                        ? 'text-xl sm:text-2xl md:text-[26px]'
                        : 'text-base sm:text-lg md:text-xl'
                    }`}
                  >
                    {title}
                  </h3>

                  {isHero && desc && (
                    <p className="text-xs sm:text-sm text-blue-100/90 max-w-2xl leading-relaxed">
                      {desc}
                    </p>
                  )}
                </div>
              </div>

              {/* Right: Elevated 3D Neon Blue Traced ₹50 Lakhs Square Vault + Optional CTA */}
              <div
                className="flex flex-wrap sm:flex-nowrap items-center gap-3 shrink-0"
                style={{ transform: 'translateZ(26px)' }}
              >
                {/* Inner Square Prize Vault With Synchronized Moving 3D Blue Line */}
                <div className="up-blue-trace-shell-sm shrink-0">
                  <div aria-hidden="true" className="up-blue-trace-track">
                    <div className="up-blue-trace-beam" />
                  </div>
                  <div
                    className={`relative z-10 rounded-[14px] bg-gradient-to-b from-[#0B1E4D] via-[#081538] to-[#050E26] text-center ${
                      isHero ? 'px-4 py-2.5 min-w-[144px]' : 'px-4 py-2 min-w-[126px]'
                    }`}
                  >
                    <div
                      className={`font-display font-extrabold font-mono-num text-[#FBBF24] up-neon-text-gold-strong leading-tight ${
                        isHero ? 'text-xl sm:text-2xl' : 'text-lg sm:text-xl'
                      }`}
                    >
                      {prizeAmount}
                    </div>
                    {headline && isHero && (
                      <div className="text-[10px] sm:text-[11px] font-semibold text-cyan-200/95 mt-0.5 leading-snug">
                        {headline}
                      </div>
                    )}
                  </div>
                </div>

                {isHero && ctaLabel && onCtaClick && (
                  <button
                    type="button"
                    onClick={onCtaClick}
                    className="inline-flex items-center justify-center gap-1.5 px-4 sm:px-5 py-3 min-h-[44px] rounded-xl bg-gradient-to-r from-[#FF9933] via-[#FBBF24] to-[#F59E0B] hover:from-amber-400 hover:to-amber-500 text-slate-950 font-display font-extrabold text-xs sm:text-sm shadow-[0_0_24px_rgba(251,191,36,0.45)] up-md3-ripple cursor-pointer whitespace-nowrap"
                  >
                    <span>{ctaLabel}</span>
                    <ArrowRight className="w-4 h-4 shrink-0" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
