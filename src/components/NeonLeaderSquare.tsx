import React from 'react';

interface NeonLeaderSquareProps {
  src?: string;
  alt: string;
  title?: string;
  fallbackCode?: string;
  accentColor?: string;
  size?: 'sm' | 'md' | 'lg';
  phaseIndex?: number;
  float3d?: boolean;
}

const SIZE_CLASSES: Record<'sm' | 'md' | 'lg', string> = {
  sm: 'w-10 h-10',
  md: 'w-11 h-11 sm:w-12 sm:h-12',
  lg: 'w-13 h-13',
};

export const NeonLeaderSquare: React.FC<NeonLeaderSquareProps> = ({
  src,
  alt,
  title,
  fallbackCode,
  accentColor = '#38BDF8',
  size = 'md',
  phaseIndex = 0,
  float3d = true,
}) => {
  const beamDelay = `${-((phaseIndex % 8) * 0.35).toFixed(2)}s`;
  const floatDelay = `${-((phaseIndex % 6) * 0.7).toFixed(2)}s`;

  return (
    <div
      title={title || alt}
      className={`up-leader-sq-avatar shrink-0 ${SIZE_CLASSES[size]} ${
        float3d ? 'up-leader-float-3d' : ''
      }`}
      style={{
        animationDelay: float3d ? floatDelay : undefined,
      }}
    >
      {/* Rotating 3D Blue Neon Light Around the Square Perimeter */}
      <div aria-hidden="true" className="up-blue-trace-track">
        <div className="up-leader-blue-beam" style={{ animationDelay: beamDelay }} />
        <div className="up-leader-blue-beam-twin" style={{ animationDelay: beamDelay }} />
      </div>

      {/* Inner Crisp Square Leader Portrait */}
      <div className="relative z-10 w-full h-full rounded-[10px] overflow-hidden bg-[#071432] ring-1 ring-inset ring-cyan-200/35">
        {src ? (
          <img
            src={src}
            alt={alt}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover object-top"
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center text-[10px] font-display font-extrabold text-white"
            style={{
              background: `linear-gradient(135deg, ${accentColor}cc, #071432)`,
            }}
          >
            {fallbackCode || alt.slice(0, 3)}
          </div>
        )}
        {/* Subtle 3D Specular Gloss Reflection */}
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-tr from-transparent via-transparent to-cyan-200/20 pointer-events-none"
        />
      </div>
    </div>
  );
};
