/**
 * UP Mandate — Firestore Rules Security Verification Suite (Phase 0 TDD)
 * Documents the 12 adversarial payloads ("Dirty Dozen") and verifies rule invariants.
 */

export interface AdversarialTestCase {
  id: number;
  name: string;
  collectionPath: string;
  operation: 'get' | 'list' | 'create' | 'update' | 'delete';
  auth: { uid: string; email?: string; email_verified?: boolean } | null;
  payload?: Record<string, unknown>;
  expectedOutcome: 'PERMISSION_DENIED';
  enforcedByRule: string;
}

export const DIRTY_DOZEN_TESTS: AdversarialTestCase[] = [
  {
    id: 1,
    name: 'Unauthenticated read of user profile',
    collectionPath: '/users/uid123',
    operation: 'get',
    auth: null,
    expectedOutcome: 'PERMISSION_DENIED',
    enforcedByRule: 'isOwner(userId) requires isVerifiedUser()',
  },
  {
    id: 2,
    name: 'Cross-user PII read',
    collectionPath: '/users/victimUid',
    operation: 'get',
    auth: { uid: 'attackerUid', email_verified: true },
    expectedOutcome: 'PERMISSION_DENIED',
    enforcedByRule: 'request.auth.uid == userId',
  },
  {
    id: 3,
    name: 'Shadow field role injection on user profile create',
    collectionPath: '/users/uid123',
    operation: 'create',
    auth: { uid: 'uid123', email_verified: true },
    payload: { uid: 'uid123', displayName: 'Test', publicAlias: 'Tester', leaderboardOptIn: true, consentAccepted: true, role: 'admin' },
    expectedOutcome: 'PERMISSION_DENIED',
    enforcedByRule: 'isValidUserProfile -> data.keys().hasOnly(...)',
  },
  {
    id: 4,
    name: 'Unverified email prediction write',
    collectionPath: '/user_predictions/uid123',
    operation: 'create',
    auth: { uid: 'uid123', email_verified: false },
    expectedOutcome: 'PERMISSION_DENIED',
    enforcedByRule: 'isVerifiedUser() checks email_verified == true',
  },
  {
    id: 5,
    name: 'Cross-user prediction overwrite',
    collectionPath: '/user_predictions/victimUid',
    operation: 'update',
    auth: { uid: 'attackerUid', email_verified: true },
    expectedOutcome: 'PERMISSION_DENIED',
    enforcedByRule: 'isOwner(userId)',
  },
  {
    id: 6,
    name: 'Out-of-bounds totalAllocated (> 403)',
    collectionPath: '/user_predictions/uid123',
    operation: 'update',
    auth: { uid: 'uid123', email_verified: true },
    payload: { totalAllocated: 500 },
    expectedOutcome: 'PERMISSION_DENIED',
    enforcedByRule: 'isValidUserPrediction -> data.totalAllocated <= 403',
  },
  {
    id: 7,
    name: 'Leaderboard officialPoints tampering by non-admin',
    collectionPath: '/leaderboard/uid123',
    operation: 'update',
    auth: { uid: 'uid123', email_verified: true },
    payload: { officialPoints: 9999 },
    expectedOutcome: 'PERMISSION_DENIED',
    enforcedByRule: 'incoming().officialPoints == existing().officialPoints && affectedKeys().hasOnly(...)',
  },
  {
    id: 8,
    name: 'Client-forged timestamp on prediction write',
    collectionPath: '/user_predictions/uid123',
    operation: 'update',
    auth: { uid: 'uid123', email_verified: true },
    payload: { updatedAt: '2026-01-01T00:00:00Z' },
    expectedOutcome: 'PERMISSION_DENIED',
    enforcedByRule: 'incoming().updatedAt == request.time',
  },
  {
    id: 9,
    name: 'Non-admin candidate injection',
    collectionPath: '/candidates/cand1',
    operation: 'create',
    auth: { uid: 'uid123', email_verified: true },
    expectedOutcome: 'PERMISSION_DENIED',
    enforcedByRule: 'isAdmin()',
  },
  {
    id: 10,
    name: 'Non-admin election config unlock',
    collectionPath: '/election_config/global',
    operation: 'update',
    auth: { uid: 'uid123', email_verified: true },
    payload: { isLocked: false },
    expectedOutcome: 'PERMISSION_DENIED',
    enforcedByRule: 'isAdmin()',
  },
  {
    id: 11,
    name: 'Audit log deletion attempt even by admin',
    collectionPath: '/audit_logs/log1',
    operation: 'delete',
    auth: { uid: 'adminUid', email: 'niteshm505@gmail.com', email_verified: true },
    expectedOutcome: 'PERMISSION_DENIED',
    enforcedByRule: 'allow update, delete: if false',
  },
  {
    id: 12,
    name: 'Document ID poisoning (> 128 chars)',
    collectionPath: `/user_predictions/${'a'.repeat(200)}`,
    operation: 'get',
    auth: { uid: 'uid123', email_verified: true },
    expectedOutcome: 'PERMISSION_DENIED',
    enforcedByRule: 'isValidId(userId)',
  },
];
