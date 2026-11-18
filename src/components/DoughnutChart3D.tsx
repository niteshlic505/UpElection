import React, { useState } from 'react';
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
  const [tilt, setTilt] = useState({ rotateX: 8, rotateY: -6 });
  const strokeWidth = 28;
  const center = size / 2;
  const radius = center - strokeWidth / 2 - 10;
  const circumference = 2 * Math.PI * radius;

  const totalSeats = segments.reduce((acc, s) => acc + Math.max(0, s.seats), 0);
  const denominator = Math.max(TOTAL_UP_SEATS, totalSeats);

  let cumulativePercent = 0;

  const arcs = segments
    .filter((s) => s.seats > 0)
    .map((segment) => {
      const fraction = segment.seats / denominator;
      const dashLength = fraction * circumference;
      const gap = circumference - dashLength;
      const offset = -cumulativePercent * circumference;
      cumulativePercent += fraction;
      return {
        ...segment,
        dashLength,
        gap,
        offset,
      };
    });

  const selectedSeg = segments.find((s) => s.code === selectedPartyCode);

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const nx = (e.clientX - rect.left) / rect.width - 0.5;
    const ny = (e.clientY - rect.top) / rect.height - 0.5;
    setTilt({
      rotateX: Number((-ny * 16).toFixed(2)),
      rotateY: Number((nx * 16).toFixed(2)),
    });
  };

  const handlePointerLeave = () => {
    setTilt({ rotateX: 8, rotateY: -6 });
  };

  return (
    <div
      className="relative flex items-center justify-center select-none up-stage-3d"
      style={{ width: size, height: size }}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
    >
      {/* Subtle ambient neon halo behind 3D ring */}
      <div
        aria-hidden="true"
        className="absolute inset-4 rounded-full blur-xl opacity-35 dark:opacity-55 pointer-events-none transition-colors duration-300"
        style={{
          background: selectedSeg
            ? `radial-gradient(circle, ${selectedSeg.color}55 0%, rgba(29,78,216,0.22) 60%, transparent 75%)`
            : 'radial-gradient(circle, rgba(56,189,248,0.35) 0%, rgba(29,78,216,0.2) 60%, transparent 75%)',
        }}
      />

      {/* Interactive 3D tilted chart container */}
      <motion.div
        animate={{ rotateX: tilt.rotateX, rotateY: tilt.rotateY }}
        transition={{ type: 'spring', stiffness: 220, damping: 20, mass: 0.6 }}
        style={{ transformStyle: 'preserve-3d', width: size, height: size }}
        className="relative flex items-center justify-center"
      >
        {/* Lower 3D extrusion bevel layer */}
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          aria-hidden="true"
          style={{ transform: 'translateZ(-8px) translateY(5px)' }}
          className="absolute inset-0 -rotate-90 opacity-40 dark:opacity-60 pointer-events-none"
        >
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className="text-slate-300 dark:text-slate-950"
          />
          {arcs.map((arc) => (
            <circle
              key={`bevel_${arc.code}`}
              cx={center}
              cy={center}
              r={radius}
              fill="none"
              stroke={arc.color}
              strokeWidth={strokeWidth}
              strokeDasharray={`${Math.max(0, arc.dashLength - 1.5)} ${circumference}`}
              strokeDashoffset={arc.offset}
              strokeLinecap="butt"
              opacity={0.45}
            />
          ))}
        </svg>

        {/* Primary interactive chart surface */}
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          style={{ transform: 'translateZ(6px)' }}
          className="-rotate-90 drop-shadow-[0_10px_22px_rgba(15,23,42,0.16)] dark:drop-shadow-[0_10px_26px_rgba(37,99,235,0.28)]"
          role="img"
          aria-label={`Uttar Pradesh 403-seat distribution chart showing ${centerLabel} ${centerSublabel}`}
        >
          <defs>
            <filter id="arc-neon-glow" x="-30%" y="-30%" width="160%" height="160%">
              <feDropShadow
                dx="0"
                dy="0"
                stdDeviation="4"
                floodColor={selectedSeg?.color || '#38BDF8'}
                floodOpacity="0.85"
              />
            </filter>
          </defs>

          {/* Base unallocated track */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className="text-slate-100 dark:text-slate-800/85"
          />

          {/* Party segments */}
          {arcs.map((arc) => {
            const isSelected = selectedPartyCode === arc.code;
            return (
              <circle
                key={arc.code}
                cx={center}
                cy={center}
                r={radius}
                fill="none"
                stroke={arc.color}
                strokeWidth={isSelected ? strokeWidth + 5 : strokeWidth}
                strokeDasharray={`${Math.max(0, arc.dashLength - 1.5)} ${circumference}`}
                strokeDashoffset={arc.offset}
                strokeLinecap="butt"
                filter={isSelected ? 'url(#arc-neon-glow)' : undefined}
                onClick={() => onSelectParty?.(arc.code)}
                className="transition-all duration-300 ease-out cursor-pointer hover:opacity-90"
              />
            );
          })}
        </svg>

        {/* Elevated floating 3D center KPI */}
        <motion.div
          key={centerLabel}
          initial={{ scale: 0.92, opacity: 0.7 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
          style={{ transform: 'translateZ(24px)' }}
          className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none"
        >
          <span className="font-display font-extrabold text-3xl tracking-tight text-slate-900 dark:text-white font-mono-num">
            {centerLabel}
          </span>
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">
            {centerSublabel}
          </span>
        </motion.div>
      </motion.div>
    </div>
  );
};
