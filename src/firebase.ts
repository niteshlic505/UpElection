import { initializeApp } from 'firebase/app';
import {
  browserPopupRedirectResolver,
  getAuth,
  getRedirectResult,
  GoogleAuthProvider,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  signInWithRedirect,
} from 'firebase/auth';
import {
  doc,
  getDocFromServer,
  getFirestore,
  initializeFirestore,
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);

function initDb() {
  try {
    return initializeFirestore(
      app,
      {
        ignoreUndefinedProperties: true,
        experimentalAutoDetectLongPolling: true,
      },
      firebaseConfig.firestoreDatabaseId,
    );
  } catch {
    return getFirestore(app, firebaseConfig.firestoreDatabaseId);
  }
}

export const db = initDb();
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });
export {
  RecaptchaVerifier,
  browserPopupRedirectResolver,
  getRedirectResult,
  signInWithPhoneNumber,
  signInWithRedirect,
};

export function isInsideIframe(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return window.self !== window.top;
  } catch {
    return true;
  }
}

export function getFirebaseErrorCode(err: unknown): string {
  if (typeof err === 'object' && err !== null && 'code' in err) {
    return String((err as { code?: unknown }).code || '');
  }
  const msg = err instanceof Error ? err.message : String(err);
  const match = msg.match(/\((auth\/[a-z0-9-]+)\)/i);
  return match ? match[1].toLowerCase() : '';
}

function isHostnameAuthorized(host: string, authorizedDomains: string[]): boolean {
  const cleanHost = host.toLowerCase().trim();
  if (!cleanHost) return false;
  return authorizedDomains.some((raw) => {
    const dom = raw.toLowerCase().trim();
    if (!dom) return false;
    return cleanHost === dom || cleanHost.endsWith(`.${dom}`);
  });
}

let cachedAuthorizedDomains: string[] | null = null;

export async function checkCurrentDomainAuthorized(
  forceRefresh = false,
): Promise<{ authorized: boolean | null; host: string; authorizedDomains: string[] }> {
  const host = typeof window !== 'undefined' ? window.location.hostname.toLowerCase() : '';
  if (typeof window === 'undefined' || !firebaseConfig.apiKey || !host) {
    return { authorized: null, host, authorizedDomains: [] };
  }
  if (!forceRefresh && cachedAuthorizedDomains) {
    return {
      authorized: isHostnameAuthorized(host, cachedAuthorizedDomains),
      host,
      authorizedDomains: cachedAuthorizedDomains,
    };
  }
  try {
    const res = await fetch(
      `https://www.googleapis.com/identitytoolkit/v3/relyingparty/getProjectConfig?key=${encodeURIComponent(firebaseConfig.apiKey)}`,
    );
    if (!res.ok) {
      return { authorized: null, host, authorizedDomains: [] };
    }
    const data = (await res.json()) as { authorizedDomains?: string[] };
    if (!Array.isArray(data.authorizedDomains)) {
      return { authorized: null, host, authorizedDomains: [] };
    }
    cachedAuthorizedDomains = data.authorizedDomains;
    return {
      authorized: isHostnameAuthorized(host, data.authorizedDomains),
      host,
      authorizedDomains: data.authorizedDomains,
    };
  } catch {
    return { authorized: null, host, authorizedDomains: [] };
  }
}

export function mapFirebaseAuthError(
  err: unknown,
  language: 'en' | 'hi' = 'en',
  domainAuthorized: boolean | null = null,
): string {
  const code = getFirebaseErrorCode(err);
  const msg = err instanceof Error ? err.message : String(err);
  const currentHost =
    typeof window !== 'undefined' ? window.location.hostname : 'this domain';

  if (
    domainAuthorized === false ||
    code === 'auth/unauthorized-domain' ||
    code === 'auth/app-not-authorized'
  ) {
    return language === 'hi'
      ? `डोमेन "${currentHost}" Firebase Authorized Domains में जोड़ा नहीं गया है। Firebase Console (${firebaseConfig.projectId}) → Authentication → Settings → Authorized domains में "${currentHost}" जोड़ें, फिर Google और मोबाइल OTP दोनों तुरंत काम करेंगे। [${code || 'auth/unauthorized-domain'}]`
      : `Domain "${currentHost}" is NOT added to Firebase Authorized Domains yet. Open Firebase Console (${firebaseConfig.projectId}) → Authentication → Settings → Authorized domains → Add domain "${currentHost}", then both Google Sign-In and Mobile OTP will work immediately. [${code || 'auth/unauthorized-domain'}]`;
  }

  if (code === 'auth/popup-blocked') {
    return language === 'hi'
      ? 'ब्राउज़र ने Google साइन-इन पॉपअप ब्लॉक कर दिया है। कृपया ब्राउज़र में Pop-ups अनुमति दें या नया टैब खोलकर पुनः प्रयास करें।'
      : 'Browser blocked the Google sign-in popup window. Please allow pop-ups for this site or open the app in a standalone tab and try again.';
  }
  if (code === 'auth/popup-closed-by-user') {
    return language === 'hi'
      ? 'Google साइन-इन विंडो लॉगिन पूरा होने से पहले बंद हो गई। कृपया पुनः प्रयास करें (मोबाइल पर पॉपअप या थर्ड-पार्टी कुकीज़ ब्लॉक न हों)।'
      : 'Google sign-in window closed before completing login. Please try again and ensure popups/cookies are allowed for accounts.google.com.';
  }
  if (code === 'auth/cancelled-popup-request') {
    return language === 'hi'
      ? 'एक साथ दो Google लॉगिन अनुरोध खुले थे। कृपया एक बार पुनः "Continue with Google" दबाएं।'
      : 'Previous Google sign-in window was superseded. Please tap "Continue with Google" once more.';
  }
  if (code === 'auth/operation-not-supported-in-this-environment') {
    return language === 'hi'
      ? 'इस ब्राउज़र/मोड में पॉपअप लॉगिन समर्थित नहीं है (जैसे Private mode या in-app browser)। कृपया Chrome/Safari में खोलें।'
      : 'Sign-in popup is not supported in this browser mode (such as strict Private mode or an in-app WebView). Please open in Chrome or Safari.';
  }
  if (code === 'auth/account-exists-with-different-credential') {
    return language === 'hi'
      ? 'यह ईमेल पहले से किसी अन्य साइन-इन तरीके से जुड़ा है। कृपया उसी तरीके से लॉगिन करें।'
      : 'An account already exists with this email using a different sign-in method.';
  }
  if (code === 'auth/invalid-phone-number') {
    return language === 'hi'
      ? 'कृपया मान्य 10-अंकीय मोबाइल नंबर दर्ज करें।'
      : 'Please enter a valid 10-digit mobile number.';
  }
  if (code === 'auth/invalid-verification-code') {
    return language === 'hi'
      ? 'गलत OTP कोड। कृपया SMS में प्राप्त 6-अंकीय कोड जाँचें।'
      : 'Invalid OTP code. Please check the 6-digit code from your SMS.';
  }
  if (code === 'auth/code-expired') {
    return language === 'hi'
      ? 'OTP समय समाप्त हो गया। कृपया नया OTP मंगाएं।'
      : 'OTP expired. Please request a fresh OTP.';
  }
  if (code === 'auth/too-many-requests') {
    return language === 'hi'
      ? 'बहुत अधिक प्रयास किए गए। कृपया कुछ मिनट बाद पुनः प्रयास करें।'
      : 'Too many OTP attempts from this device/number. Please wait a few minutes and try again.';
  }
  if (code === 'auth/operation-not-allowed') {
    return language === 'hi'
      ? 'Firebase Console → Authentication → Sign-in method में यह लॉगिन प्रदाता सक्रिय करें।'
      : 'This sign-in provider is disabled in Firebase Console. Enable Google and Phone under Authentication → Sign-in method.';
  }
  if (code === 'auth/billing-not-enabled') {
    return language === 'hi'
      ? 'लाइव SMS OTP के लिए Firebase प्रोजेक्ट पर Blaze प्लान या "Phone numbers for testing" जोड़ना आवश्यक है।'
      : 'Firebase requires Blaze billing enabled for live SMS OTPs (or add test phone numbers under Authentication → Sign-in method → Phone → Phone numbers for testing).';
  }
  if (code === 'auth/quota-exceeded') {
    return language === 'hi'
      ? 'आज की SMS OTP सीमा पूरी हो गई है। कृपया बाद में प्रयास करें।'
      : 'Daily SMS OTP quota exceeded on the Firebase project. Please try again later or use a Firebase test phone number.';
  }
  if (code === 'auth/invalid-app-credential' || code === 'auth/missing-app-credential') {
    return language === 'hi'
      ? `ऐप/डोमेन सत्यापन विफल रहा (${code})। सुनिश्चित करें कि "${currentHost}" Firebase Authorized Domains में जुड़ा है और नीचे सुरक्षा बॉक्स पूरा करें।`
      : `App verification failed (${code}). Ensure "${currentHost}" is listed under Firebase Console → Authentication → Settings → Authorized domains, then complete the "I'm not a robot" check below.`;
  }
  if (
    code === 'auth/captcha-check-failed' ||
    code === 'auth/missing-client-identifier' ||
    msg.toLowerCase().includes('recaptcha')
  ) {
    return language === 'hi'
      ? `सुरक्षा जांच (reCAPTCHA) स्वतः सत्यापित नहीं हो सकी (${code || 'reCAPTCHA'})। कृपया नीचे "I'm not a robot" बॉक्स टिक करें और पुनः OTP भेजें।`
      : `Security verification (reCAPTCHA) could not verify automatically (${code || 'reCAPTCHA'}). Please complete the "I'm not a robot" checkbox below and tap Send Verification OTP again.`;
  }
  if (code === 'auth/network-request-failed') {
    return language === 'hi'
      ? 'नेटवर्क कनेक्शन या Ad-blocker ने Google Firebase सत्यापन को रोक दिया। कृपया इंटरनेट जाँचें या Ad-blocker बंद करें।'
      : 'Network error or browser extension blocked Google Firebase verification. Disable ad blockers and check your connection.';
  }
  return code ? `${msg} [${code}]` : msg || 'Authentication failed. Please try again.';
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function isOfflineFirestoreError(error: unknown): boolean {
  const code =
    typeof error === 'object' && error !== null && 'code' in error
      ? String((error as { code?: unknown }).code).toLowerCase()
      : '';
  const msg = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
  return (
    code === 'unavailable' ||
    msg.includes('client is offline') ||
    msg.includes('could not reach cloud firestore backend') ||
    msg.includes('unavailable')
  );
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null,
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error:', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export function handleRealtimeListenerError(
  error: unknown,
  operationType: OperationType,
  path: string | null,
): void {
  if (isOfflineFirestoreError(error)) {
    console.warn(`Firestore listener temporarily unavailable for ${path || 'query'}; waiting for reconnect.`);
    return;
  }
  handleFirestoreError(error, operationType, path);
}

let connectionProbePromise: Promise<boolean> | null = null;

export async function testConnection(): Promise<boolean> {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    return false;
  }
  if (!connectionProbePromise) {
    connectionProbePromise = (async () => {
      try {
        await getDocFromServer(doc(db, 'test', 'connection'));
        return true;
      } catch (error) {
        if (isOfflineFirestoreError(error)) {
          console.warn('Firestore backend temporarily unreachable; operating in offline mode until connected.');
          return false;
        }
        // A permission-denied or not-found response confirms the backend is reachable
        return true;
      }
    })();
  }
  return connectionProbePromise;
}

export const BOOTSTRAPPED_ADMIN_EMAIL = 'niteshm505@gmail.com';
