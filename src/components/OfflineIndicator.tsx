import React from 'react';
import { WifiOff } from 'lucide-react';
import { AppLanguage } from '../types/election';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

interface OfflineIndicatorProps {
  language: AppLanguage;
}

export const OfflineIndicator: React.FC<OfflineIndicatorProps> = ({ language }) => {
  const isOnline = useOnlineStatus();
  if (isOnline) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="bg-amber-600 text-slate-950 px-4 py-1.5 text-xs font-semibold flex items-center justify-center gap-2"
    >
      <WifiOff className="w-3.5 h-3.5 shrink-0" />
      <span>
        {language === 'hi'
          ? 'ऑफ़लाइन मोड — आपके बदलाव सुरक्षित हैं और इंटरनेट आने पर सिंक होंगे'
          : 'Offline mode — your draft forecasts stay saved and will sync once connected'}
      </span>
    </div>
  );
};
