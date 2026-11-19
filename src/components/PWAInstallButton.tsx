import React, { useState } from 'react';
import { Download, MonitorSmartphone, PlusSquare, Share, X } from 'lucide-react';
import { AppLanguage } from '../types/election';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface PWAInstallButtonProps {
  language: AppLanguage;
  compact?: boolean;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({ language, compact = false }) => {
  const { canPromptNativeInstall, isStandalone, isIOS, installing, install } = usePWAInstall();
  const [showInstructions, setShowInstructions] = useState(false);

  // Never show when already running in standalone app / WebView mode (address bar already hidden)
  if (isStandalone) return null;

  const handleClick = async () => {
    if (canPromptNativeInstall) {
      const outcome = await install();
      if (outcome === 'unavailable') {
        setShowInstructions(true);
      }
      return;
    }
    setShowInstructions(true);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => void handleClick()}
        disabled={installing}
        className={
          compact
            ? 'inline-flex items-center justify-center gap-1.5 px-3.5 py-2 min-h-[40px] rounded-xl bg-gradient-to-r from-[#0F2766] via-[#1D4ED8] to-[#0E7490] hover:brightness-110 text-white font-display font-bold text-xs shadow-md border border-cyan-300/35 up-neon-cyan up-md3-ripple cursor-pointer whitespace-nowrap'
            : 'inline-flex items-center justify-center gap-2 px-4 py-3 min-h-[44px] rounded-xl bg-gradient-to-r from-[#0F2766] via-[#1D4ED8] to-[#0E7490] hover:brightness-110 text-white font-display font-bold text-xs sm:text-sm shadow-lg border border-cyan-300/40 up-neon-cyan up-md3-ripple cursor-pointer whitespace-nowrap'
        }
      >
        <Download className="w-4 h-4 shrink-0 text-amber-300" />
        <span>
          {installing
            ? language === 'hi'
              ? 'इंस्टॉल हो रहा है...'
              : 'Installing App...'
            : language === 'hi'
            ? 'ऐप मोड में खोलें (फुल स्क्रीन)'
            : 'Launch Fullscreen App'}
        </span>
      </button>

      {showInstructions && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={language === 'hi' ? 'ऐप इंस्टॉल निर्देश' : 'Fullscreen App Guide'}
          className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div className="w-full max-w-md rounded-3xl bg-white dark:bg-[#0C1732] border border-amber-500/30 dark:border-cyan-400/25 p-5 sm:p-6 shadow-2xl up-neon-rim space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <img
                  src="/assets/aistudio/UP_Election_App_Icon_1024_d13a55bb.jpg"
                  alt="UP Mandate App Icon"
                  referrerPolicy="no-referrer"
                  className="w-12 h-12 rounded-2xl object-cover border border-amber-400/40 shadow-md shrink-0"
                />
                <div>
                  <h3 className="font-display font-bold text-base text-slate-900 dark:text-white">
                    {language === 'hi' ? 'UP Mandate ऐप इंस्टॉल करें' : 'Install UP Mandate App'}
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                    {language === 'hi'
                      ? 'बिना ब्राउज़र बार के फुल-स्क्रीन ऐप की तरह चलाएँ'
                      : 'Open fullscreen without browser address bar'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowInstructions(false)}
                aria-label="Close"
                className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 cursor-pointer shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {isIOS ? (
              <ol className="space-y-3 text-xs sm:text-sm text-slate-700 dark:text-slate-200">
                <li className="flex items-start gap-2.5">
                  <Share className="w-4 h-4 text-blue-600 dark:text-cyan-400 shrink-0 mt-0.5" />
                  <span>
                    {language === 'hi'
                      ? 'नीचे Safari टूलबार में Share बटन पर टैप करें।'
                      : 'Tap the Share button in the bottom Safari toolbar.'}
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <PlusSquare className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  <span>
                    {language === 'hi'
                      ? '"Add to Home Screen" चुनें और ऊपर Add दबाएँ।'
                      : 'Select "Add to Home Screen" and tap Add at the top right.'}
                  </span>
                </li>
              </ol>
            ) : (
              <ol className="space-y-3 text-xs sm:text-sm text-slate-700 dark:text-slate-200">
                <li className="flex items-start gap-2.5">
                  <MonitorSmartphone className="w-4 h-4 text-blue-600 dark:text-cyan-400 shrink-0 mt-0.5" />
                  <span>
                    {language === 'hi'
                      ? 'ब्राउज़र मेन्यू (⋮) खोलें और "Install App" या "Add to Home Screen" चुनें।'
                      : 'Open your browser menu (⋮) and choose "Install App" or "Add to Home Screen".'}
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Download className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  <span>
                    {language === 'hi'
                      ? 'होम स्क्रीन आइकन से खोलने पर यह बिना वेब लिंक के स्टैंडअलोन ऐप में खुलेगा।'
                      : 'Launching from your Home Screen opens it in pure standalone app mode with zero URL bar.'}
                  </span>
                </li>
              </ol>
            )}

            <button
              type="button"
              onClick={() => setShowInstructions(false)}
              className="w-full py-2.5 min-h-[44px] rounded-xl bg-gradient-to-r from-[#FF9933] to-[#F59E0B] text-slate-950 font-display font-bold text-xs sm:text-sm cursor-pointer up-md3-ripple"
            >
              {language === 'hi' ? 'समझ गया' : 'Got It'}
            </button>
          </div>
        </div>
      )}
    </>
  );
};
