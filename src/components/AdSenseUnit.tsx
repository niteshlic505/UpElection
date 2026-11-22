import React, { useEffect, useRef } from 'react';

declare global {
  interface Window {
    adsbygoogle?: Array<Record<string, unknown>>;
  }
}

interface AdSenseUnitProps {
  adClient?: string;
  adSlot?: string;
  className?: string;
}

/**
 * Responsive Google AdSense display unit ("Nkm").
 * Safely triggers `adsbygoogle.push({})` once per mounted `<ins>` element
 * after the container has measurable width so SPA page transitions work reliably.
 */
export const AdSenseUnit: React.FC<AdSenseUnitProps> = ({
  adClient = 'ca-pub-1820309084512776',
  adSlot = '7029020659',
  className = '',
}) => {
  const insRef = useRef<HTMLModElement | null>(null);
  const pushedRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    let timerId: number | null = null;
    let attempts = 0;

    const pushAd = () => {
      if (cancelled || pushedRef.current) return;
      const el = insRef.current;
      if (!el) return;

      // Avoid duplicate pushes on the same DOM node (e.g. React StrictMode)
      if (el.getAttribute('data-adsbygoogle-status')) {
        pushedRef.current = true;
        return;
      }

      // Wait briefly until the animated page container has non-zero width
      if (el.offsetWidth === 0 && attempts < 10) {
        attempts += 1;
        timerId = window.setTimeout(pushAd, 120);
        return;
      }

      try {
        pushedRef.current = true;
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      } catch {
        // Ignore ad-blocker or transient script load errors cleanly
      }
    };

    timerId = window.setTimeout(pushAd, 150);

    return () => {
      cancelled = true;
      if (timerId !== null) {
        window.clearTimeout(timerId);
      }
    };
  }, [adClient, adSlot]);

  return (
    <aside
      aria-label="Advertisement"
      className={`mt-6 w-full overflow-hidden rounded-2xl border border-slate-200/70 dark:border-slate-800/70 bg-white/60 dark:bg-[#0B152E]/60 px-3 py-2.5 ${className}`}
    >
      <div className="mb-1.5 text-center text-[10px] font-medium uppercase tracking-widest text-slate-400 dark:text-slate-500">
        Advertisement
      </div>
      {/* Nkm */}
      <ins
        ref={insRef}
        className="adsbygoogle block w-full min-h-[90px]"
        data-ad-client={adClient}
        data-ad-slot={adSlot}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </aside>
  );
};
