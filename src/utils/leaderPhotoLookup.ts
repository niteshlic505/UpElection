import { useEffect, useState } from 'react';
import { KNOWN_LEADER_PHOTOS, normalizeLeaderKey } from '../data/leaderPhotos';

const STORAGE_KEY = 'up_mandate_leader_photos_v2';
const memoryCache = new Map<string, string>();
const inFlight = new Map<string, Promise<string>>();

let storageHydrated = false;
function hydrateStorage() {
  if (storageHydrated || typeof window === 'undefined') return;
  storageHydrated = true;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Record<string, string>;
      Object.entries(parsed).forEach(([k, v]) => {
        if (typeof v === 'string') memoryCache.set(k, v);
      });
    }
  } catch {
    // ignore invalid cache
  }
}

function saveToStorage() {
  if (typeof window === 'undefined') return;
  try {
    const obj: Record<string, string> = {};
    memoryCache.forEach((v, k) => {
      obj[k] = v;
    });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(obj));
  } catch {
    // ignore quota errors
  }
}

export function isPlaceholderCandidateName(name: string): boolean {
  const trimmed = name.trim();
  if (!trimmed || trimmed.length < 3) return true;
  return /^(not recorded|20\d{2}\s+.*\s+(winner|runner-up)\b|.*nominee\s*\(provisional\))/i.test(
    trimmed,
  );
}

export function getSyncLeaderPhoto(name: string, explicitPhotoUrl?: string): string | undefined {
  if (explicitPhotoUrl) return explicitPhotoUrl;
  if (isPlaceholderCandidateName(name)) return undefined;
  const key = normalizeLeaderKey(name);
  if (!key) return undefined;
  if (KNOWN_LEADER_PHOTOS[key]) return KNOWN_LEADER_PHOTOS[key];
  hydrateStorage();
  const cached = memoryCache.get(key);
  return cached ? cached : undefined;
}

function isValidUpOrIndianPoliticianText(text: string): boolean {
  const lower = text.toLowerCase();
  if (!lower) return false;
  // Exclude unrelated foreign politicians or entertainment figures unless clearly UP Indian politician
  if (/\b(indonesian|pakistani|bangladeshi|malaysian|british|american|actor|actress|singer|cricketer|rajasthan|karnataka|kerala|tamil nadu|bihar)\b/.test(lower)) {
    if (!/\b(uttar pradesh|lucknow|samajwadi|bahujan|lok sabha|vidhan sabha|uttar pradesh legislative assembly)\b/.test(lower)) {
      return false;
    }
  }
  return /\b(uttar pradesh|lucknow|vidhan sabha|lok sabha|indian politician|chief minister|member of parliament|bharatiya janata party|samajwadi party|bahujan samaj party|indian national congress|rashtriya lok dal|apna dal)\b/.test(
    lower,
  );
}

async function queryWikipediaPortrait(rawName: string): Promise<string> {
  const cleanName = rawName.trim();
  const titles = [cleanName, `${cleanName} (politician)`, `${cleanName} (Indian politician)`];
  try {
    const url =
      'https://en.wikipedia.org/w/api.php?action=query&titles=' +
      encodeURIComponent(titles.join('|')) +
      '&redirects=1&prop=pageimages|extracts&exintro=1&explaintext=1&exsentences=2&piprop=thumbnail&pithumbsize=240&format=json&origin=*';
    const res = await fetch(url);
    if (res.ok) {
      const data = (await res.json()) as {
        query?: {
          pages?: Record<
            string,
            { thumbnail?: { source?: string }; extract?: string; title?: string }
          >;
        };
      };
      const pages = Object.values(data.query?.pages || {});
      for (const page of pages) {
        if (
          page.thumbnail?.source &&
          page.extract &&
          isValidUpOrIndianPoliticianText(page.extract)
        ) {
          return page.thumbnail.source;
        }
      }
    }
  } catch {
    // ignore network failure
  }
  return '';
}

export async function resolveLeaderPhotoFromWeb(name: string): Promise<string> {
  if (isPlaceholderCandidateName(name)) return '';
  const key = normalizeLeaderKey(name);
  if (!key) return '';
  if (KNOWN_LEADER_PHOTOS[key]) return KNOWN_LEADER_PHOTOS[key];

  hydrateStorage();
  if (memoryCache.has(key)) return memoryCache.get(key) || '';

  const pending = inFlight.get(key);
  if (pending) return pending;

  const task = queryWikipediaPortrait(name)
    .then((foundUrl) => {
      memoryCache.set(key, foundUrl);
      saveToStorage();
      inFlight.delete(key);
      return foundUrl;
    })
    .catch(() => {
      inFlight.delete(key);
      return '';
    });

  inFlight.set(key, task);
  return task;
}

export function useLeaderPhoto(name: string, explicitPhotoUrl?: string): string | undefined {
  const syncUrl = getSyncLeaderPhoto(name, explicitPhotoUrl);
  const [resolvedUrl, setResolvedUrl] = useState<string | undefined>(syncUrl);

  useEffect(() => {
    setResolvedUrl(syncUrl);
    if (syncUrl || isPlaceholderCandidateName(name)) return;

    const key = normalizeLeaderKey(name);
    hydrateStorage();
    if (memoryCache.has(key)) {
      const val = memoryCache.get(key);
      setResolvedUrl(val || undefined);
      return;
    }

    let cancelled = false;
    void resolveLeaderPhotoFromWeb(name).then((url) => {
      if (!cancelled && url) {
        setResolvedUrl(url);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [name, explicitPhotoUrl, syncUrl]);

  return resolvedUrl;
}
