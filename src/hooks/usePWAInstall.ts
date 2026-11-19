import { useCallback, useEffect, useState } from 'react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
  prompt: () => Promise<void>;
}

function detectStandaloneOrWebView(): boolean {
  if (typeof window === 'undefined') return false;
  const nav = window.navigator as Navigator & { standalone?: boolean };
  const isDisplayStandalone =
    window.matchMedia('(display-mode: standalone)').matches ||
    window.matchMedia('(display-mode: fullscreen)').matches ||
    nav.standalone === true ||
    document.referrer.includes('android-app://');

  const ua = nav.userAgent || '';
  const isEmbeddedWebView =
    /\bwv\b/i.test(ua) ||
    Boolean((window as unknown as Record<string, unknown>).ReactNativeWebView) ||
    Boolean((window as unknown as Record<string, unknown>).Android);

  return isDisplayStandalone || isEmbeddedWebView;
}

function detectIOS(): boolean {
  if (typeof window === 'undefined') return false;
  const ua = window.navigator.userAgent;
  return /iPad|iPhone|iPod/.test(ua) || (ua.includes('Mac') && 'ontouchend' in document);
}

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState<boolean>(() => detectStandaloneOrWebView());
  const [isIOS] = useState<boolean>(() => detectIOS());
  const [installing, setInstalling] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    const handleMediaChange = () => setIsStandalone(detectStandaloneOrWebView());
    mediaQuery.addEventListener('change', handleMediaChange);

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setDeferredPrompt(null);
      setIsStandalone(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      mediaQuery.removeEventListener('change', handleMediaChange);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const install = useCallback(async (): Promise<'accepted' | 'dismissed' | 'unavailable'> => {
    if (!deferredPrompt) return 'unavailable';
    setInstalling(true);
    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      setDeferredPrompt(null);
      if (outcome === 'accepted') {
        setIsStandalone(true);
      }
      return outcome;
    } finally {
      setInstalling(false);
    }
  }, [deferredPrompt]);

  return {
    canPromptNativeInstall: Boolean(deferredPrompt) && !isStandalone,
    isStandalone,
    isIOS,
    installing,
    install,
  };
}
