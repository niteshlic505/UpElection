import React, { useId, useState } from 'react';
import { motion } from 'motion/react';
import { TOTAL_UP_SEATS } from '../data/upParties';

export interface ChartSegment {
  code: string;
  name: string;
  color: string;
  seats: number;
  rangeLabel: string;
}

interface DoughnutChart3DProps {
  segments: ChartSegment[];
  selectedPartyCode?: string;
  onSelectParty?: (code: string) => void;
  centerLabel: string;
  centerSublabel: string;
  size?: number;
}

export const DoughnutChart3D: React.FC<DoughnutChart3DProps> = ({
  segments,
  selectedPartyCode,
  onSelectParty,
  centerLabel,
  centerSublabel,
  size = 200,
}) => {
  const uid = useId().replace(/:/g, '');
  const [hoveredCode, setHoveredCode] = useState<string | null>(null);
  const [isPointerActive, setIsPointerActive] = useState(false);
  const [tilt, setTilt] = useState({ rotateX: 12, rotateY: -7 });

  const strokeWidth = Math.max(22, Math.round(size * 0.145));
  const center = size / 2;
  const radius = center - strokeWidth / 2 - 14;
  const outerRingRadius = center - 4;
  const innerRingRadius = radius - strokeWidth / 2 - 4;
  const circumference = 2 * Math.PI * radius;

  const totalSeats = segments.reduce((acc, s) => acc + Math.max(0, s.seats), 0);
  const denominator = Math.max(TOTAL_UP_SEATS, totalSeats);

  let cumulativePercent = 0;

  const arcs = segments
    .filter((s) => s.seats > 0)
    .map((segment) => {
      const fraction = segment.seats / denominator;
      const dashLength = fraction * circumference;
      const offset = -cumulativePercent * circumference;
      cumulativePercent += fraction;
      return {
        ...segment,
        dashLength,
        offset,
      };
    });

  const activeCode = hoveredCode || selectedPartyCode;
  const activeSeg = segments.find((s) => s.code === activeCode);
  const accentColor = activeSeg?.color || '#38BDF8';

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const nx = (e.clientX - rect.left) / rect.width - 0.5;
    const ny = (e.clientY - rect.top) / rect.height - 0.5;
    setIsPointerActive(true);
    setTilt({
      rotateX: Number((-ny * 22 + 8).toFixed(2)),
      rotateY: Number((nx * 22).toFixed(2)),
    });
  };

  const handlePointerLeave = () => {
    setIsPointerActive(false);
    setHoveredCode(null);
    setTilt({ rotateX: 12, rotateY: -7 });
  };

  const extrusionLayers = [
    { z: -15, y: 9, opacity: 0.28 },
    { z: -10, y: 6, opacity: 0.42 },
    { z: -5, y: 3, opacity: 0.62 },
  ];

  return (
    <div
      className="relative flex items-center justify-center select-none up-stage-3d max-w-full aspect-square shrink-0"
      style={{ width: `min(${size + 18}px, 100%)`, height: `min(${size + 18}px, 100%)` }}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
    >
      {/* Multi-layered Ambient Neon Floor Projection & Halo */}
      <div
        aria-hidden="true"
        className="absolute inset-2 rounded-full blur-2xl opacity-55 dark:opacity-80 pointer-events-none transition-all duration-500 up-neon-core-pulse"
        style={{
          background: `radial-gradient(circle, ${accentColor}66 0%, rgba(56,189,248,0.34) 44%, rgba(37,99,235,0.18) 68%, transparent 80%)`,
        }}
      />

      {/* Ground 3D Shadow Disc */}
      <div
        aria-hidden="true"
        className="absolute bottom-1 w-[74%] h-4 rounded-full blur-md pointer-events-none opacity-45 dark:opacity-75"
        style={{
          background: `radial-gradient(ellipse at center, ${accentColor}75 0%, rgba(15,23,42,0.45) 55%, transparent 80%)`,
        }}
      />

      {/* 3D Tilted & Floating Perspective Stage */}
      <motion.div
        animate={
          isPointerActive
            ? { rotateX: tilt.rotateX, rotateY: tilt.rotateY, scale: 1.03 }
            : { rotateX: 0, rotateY: 0, scale: 1 }
        }
        transition={{ type: 'spring', stiffness: 210, damping: 18, mass: 0.55 }}
        style={{ transformStyle: 'preserve-3d' }}
        className="relative w-full h-full flex items-center justify-center"
      >
        <div
          className={`relative w-full h-full flex items-center justify-center ${
            isPointerActive ? '' : 'up-pie-ambient-3d'
          }`}
          style={{ transformStyle: 'preserve-3d' }}
        >
          {/* Circular 3D Midnight Sapphire Neon Stage Disc (makes neon arcs glow vividly in both light & dark themes) */}
          <div
            aria-hidden="true"
            style={{
              transform: 'translateZ(-19px)',
              boxShadow: `0 0 26px -4px ${accentColor}80, 0 0 38px -8px rgba(56,189,248,0.55), inset 0 0 22px rgba(56,189,248,0.22)`,
            }}
            className="absolute inset-1.5 rounded-full bg-gradient-to-br from-[#071432] via-[#0B1D48] to-[#050C20] border border-cyan-400/45 pointer-events-none"
          />

          {/* Orbiting Outer Neon Cyan/Blue Scanner Ring */}
          <svg
            viewBox={`0 0 ${size} ${size}`}
            aria-hidden="true"
            style={{ transform: 'translateZ(-2px)' }}
            className="absolute inset-0 w-full h-full pointer-events-none up-pie-orbit-ring"
          >
            <defs>
              <linearGradient id={`orbit-grad-${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#00F0FF" stopOpacity="1" />
                <stop offset="35%" stopColor="#38BDF8" stopOpacity="0.7" />
                <stop offset="65%" stopColor={accentColor} stopOpacity="0.35" />
                <stop offset="100%" stopColor="#38BDF8" stopOpacity="0" />
              </linearGradient>
              <filter id={`orbit-glow-${uid}`} x="-30%" y="-30%" width="160%" height="160%">
                <feGaussianBlur stdDeviation="2.4" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
            <circle
              cx={center}
              cy={center}
              r={outerRingRadius}
              fill="none"
              stroke={`url(#orbit-grad-${uid})`}
              strokeWidth="2.6"
              strokeDasharray={`${outerRingRadius * 1.55} ${outerRingRadius * 1.6} ${outerRingRadius * 0.6} ${outerRingRadius * 2.55}`}
              strokeLinecap="round"
              filter={`url(#orbit-glow-${uid})`}
            />
          </svg>

          {/* True Multi-Layer 3D Extruded Cylinder Stack */}
          {extrusionLayers.map((layer, layerIdx) => (
            <svg
              key={layer.z}
              viewBox={`0 0 ${size} ${size}`}
              aria-hidden="true"
              style={{
                transform: `translateZ(${layer.z}px) translateY(${layer.y}px)`,
              }}
              className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none"
            >
              <circle
                cx={center}
                cy={center}
                r={radius}
                fill="none"
                stroke="#0F172A"
                strokeWidth={strokeWidth}
                opacity={layer.opacity}
              />
              {arcs.map((arc) => {
                const isActive = activeCode === arc.code;
                return (
                  <circle
                    key={`ext_${layerIdx}_${arc.code}`}
                    cx={center}
                    cy={center}
                    r={radius}
                    fill="none"
                    stroke={arc.color}
                    strokeWidth={isActive ? strokeWidth + 4 : strokeWidth}
                    strokeDasharray={`${Math.max(0, arc.dashLength - 1.4)} ${circumference}`}
                    strokeDashoffset={arc.offset}
                    strokeLinecap="butt"
                    opacity={isActive ? Math.min(0.9, layer.opacity + 0.22) : layer.opacity}
                    className="transition-all duration-300 ease-out"
                  />
                );
              })}
            </svg>
          ))}

          {/* Under-Ring Neon Emission Layer (Per-Segment Color Glow) */}
          <svg
            viewBox={`0 0 ${size} ${size}`}
            aria-hidden="true"
            style={{ transform: 'translateZ(2px)' }}
            className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none opacity-70 dark:opacity-95"
          >
            <defs>
              <filter id={`neon-bloom-${uid}`} x="-40%" y="-40%" width="180%" height="180%">
                <feGaussianBlur stdDeviation="5.5" />
              </filter>
            </defs>
            {arcs.map((arc) => {
              const isActive = activeCode === arc.code;
              return (
                <circle
                  key={`glow_${arc.code}`}
                  cx={center}
                  cy={center}
                  r={radius}
                  fill="none"
                  stroke={arc.color}
                  strokeWidth={isActive ? strokeWidth + 8 : strokeWidth + 2}
                  strokeDasharray={`${Math.max(0, arc.dashLength - 1)} ${circumference}`}
                  strokeDashoffset={arc.offset}
                  strokeLinecap="butt"
                  filter={`url(#neon-bloom-${uid})`}
                  opacity={isActive ? 0.95 : 0.48}
                  className="transition-all duration-300 ease-out"
                />
              );
            })}
          </svg>

          {/* Primary Interactive Lit 3D Top Surface */}
          <svg
            viewBox={`0 0 ${size} ${size}`}
            style={{ transform: 'translateZ(10px)' }}
            className="w-full h-full -rotate-90 drop-shadow-[0_10px_22px_rgba(15,23,42,0.22)] dark:drop-shadow-[0_12px_28px_rgba(37,99,235,0.45)]"
            role="img"
            aria-label={`Uttar Pradesh 403-seat distribution chart showing ${centerLabel} ${centerSublabel}`}
          >
            <defs>
              <filter id={`arc-neon-glow-${uid}`} x="-35%" y="-35%" width="170%" height="170%">
                <feDropShadow
                  dx="0"
                  dy="0"
                  stdDeviation="4.5"
                  floodColor={accentColor}
                  floodOpacity="0.95"
                />
              </filter>
              <linearGradient id={`specular-sheen-${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.6" />
                <stop offset="38%" stopColor="#FFFFFF" stopOpacity="0.06" />
                <stop offset="72%" stopColor="#38BDF8" stopOpacity="0.14" />
                <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.45" />
              </linearGradient>
            </defs>

            {/* Base unallocated track */}
            <circle
              cx={center}
              cy={center}
              r={radius}
              fill="none"
              stroke="rgba(30, 58, 138, 0.52)"
              strokeWidth={strokeWidth}
            />

            {/* Party / Alliance interactive slices */}
            {arcs.map((arc) => {
              const isSelected = selectedPartyCode === arc.code;
              const isHovered = hoveredCode === arc.code;
              const isHighlighted = isSelected || isHovered;
              return (
                <circle
                  key={arc.code}
                  cx={center}
                  cy={center}
                  r={radius}
                  fill="none"
                  stroke={arc.color}
                  strokeWidth={isHighlighted ? strokeWidth + 6 : strokeWidth}
                  strokeDasharray={`${Math.max(0, arc.dashLength - 1.6)} ${circumference}`}
                  strokeDashoffset={arc.offset}
                  strokeLinecap="butt"
                  filter={isHighlighted ? `url(#arc-neon-glow-${uid})` : undefined}
                  onClick={() => onSelectParty?.(arc.code)}
                  onPointerEnter={() => setHoveredCode(arc.code)}
                  onPointerLeave={() => setHoveredCode(null)}
                  className="transition-all duration-300 ease-out cursor-pointer"
                />
              );
            })}

            {/* Specular 3D Glass Bevel Rim Over Segments */}
            <circle
              cx={center}
              cy={center}
              r={radius + strokeWidth * 0.24}
              fill="none"
              stroke={`url(#specular-sheen-${uid})`}
              strokeWidth="2.5"
              className="pointer-events-none"
            />

            {/* Inner Neon Cyan Accent Ring */}
            <circle
              cx={center}
              cy={center}
              r={Math.max(12, innerRingRadius)}
              fill="none"
              stroke="#38BDF8"
              strokeWidth="1.25"
              strokeDasharray="6 6"
              opacity={0.55}
              className="pointer-events-none"
            />
          </svg>

          {/* Elevated Floating 3D Center Medallion KPI */}
          <motion.div
            key={`${centerLabel}-${activeSeg?.code ?? 'none'}`}
            initial={{ scale: 0.9, opacity: 0.72 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
            style={{ transform: 'translateZ(26px)' }}
            className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none"
          >
            <div
              className="rounded-full flex flex-col items-center justify-center bg-gradient-to-b from-[#0C1E4A]/95 to-[#050E26]/95 backdrop-blur-md border border-cyan-400/60 shadow-[0_0_24px_rgba(56,189,248,0.48),inset_0_1px_0_rgba(255,255,255,0.22)]"
              style={{
                width: `${Math.max(76, Math.round(innerRingRadius * 1.68))}px`,
                height: `${Math.max(76, Math.round(innerRingRadius * 1.68))}px`,
              }}
            >
              <span className="font-display font-extrabold text-2xl sm:text-3xl tracking-tight text-white font-mono-num leading-none up-neon-text-blue">
                {centerLabel}
              </span>
              <span className="text-[10px] sm:text-[11px] font-semibold text-cyan-200 mt-1 text-center px-1 truncate max-w-[92%]">
                {centerSublabel}
              </span>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
};
