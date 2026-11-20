import React from 'react';

interface GreenRotatingInnerOutlineProps {
  insetClass?: string;
  radiusClass?: string;
  strokeWidth?: string;
}

export const GreenRotatingInnerOutline: React.FC<GreenRotatingInnerOutlineProps> = ({
  insetClass = 'inset-[3px]',
  radiusClass = 'rounded-[12px]',
  strokeWidth = '2.5px',
}) => {
  return (
    <>
      <span
        aria-hidden="true"
        className={`up-green-inner-glow ${insetClass} ${radiusClass}`}
      />
      <span
        aria-hidden="true"
        style={{ '--up-green-stroke': strokeWidth } as React.CSSProperties}
        className={`up-green-inner-outline ${insetClass} ${radiusClass}`}
      >
        <span className="up-green-inner-beam" />
        <span className="up-green-inner-beam-twin" />
      </span>
    </>
  );
};
