const SAFE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // 32 unambiguous uppercase alphanumeric chars
const UNIQUE_ID_REGEX = /^UPM-[A-Z0-9]{8}$/;

function fnv1a32(input: string, seed: number): number {
  let hash = seed >>> 0;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619) >>> 0;
  }
  return hash >>> 0;
}

/**
 * Deterministically derives a permanent, collision-resistant alphanumeric Unique Identification Number
 * (format: UPM-XXXXXXXX) from a user's immutable UID.
 * Guarantees every user (newly registered or existing) gets a consistent anonymous ID.
 */
export function generateUniqueUserId(uid: string): string {
  const cleanUid = (uid || 'guest').trim();
  const h1 = fnv1a32(`upm-v1:${cleanUid}`, 2166136261);
  const h2 = fnv1a32(`${cleanUid}:up-mandate-2027`, 374761393);

  // Extract 8 five-bit indices (40 bits total -> 32^8 ≈ 1.1 trillion unique IDs)
  const chars: string[] = [];
  for (let i = 0; i < 4; i += 1) {
    chars.push(SAFE_ALPHABET[(h1 >>> (i * 5)) & 31]);
  }
  const bridge = ((h1 >>> 20) ^ (h2 >>> 20)) & 31;
  chars.push(SAFE_ALPHABET[bridge]);
  for (let i = 0; i < 3; i += 1) {
    chars.push(SAFE_ALPHABET[(h2 >>> (i * 5)) & 31]);
  }

  return `UPM-${chars.join('')}`;
}

export function isValidUniqueUserId(value?: string | null): value is string {
  return typeof value === 'string' && UNIQUE_ID_REGEX.test(value);
}

/**
 * Returns ONLY the anonymous alphanumeric Unique Identification Number for public display.
 * Never returns displayName, publicAlias, email, or phoneNumber.
 */
export function getPublicContestantId(entity: { uid: string; uniqueUserId?: string }): string {
  if (isValidUniqueUserId(entity.uniqueUserId)) {
    return entity.uniqueUserId;
  }
  return generateUniqueUserId(entity.uid);
}

/**
 * Returns a short 2-character alphanumeric badge code from the Unique ID (e.g., "8K") for avatars.
 */
export function getUniqueIdBadgeCode(uniqueId: string): string {
  const suffix = uniqueId.replace(/^UPM-/, '');
  return suffix.slice(0, 2) || 'UP';
}
