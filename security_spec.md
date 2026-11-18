# UP Mandate — Firestore Security Specification (Phase 0 TDD)

## 1. Data Invariants
1. **PII Isolation**: User email addresses stored in `/users/{userId}` are strictly readable only by the document owner (`request.auth.uid == userId`) or a verified administrator. Public views (`/leaderboard/{userId}`) contain zero email addresses or personal identifiers.
2. **Prediction Ownership & Cutoff Lock**: Only the authenticated, email-verified owner can create or update `/user_predictions/{userId}`, and updates are denied whenever `/election_config/global.isLocked == true` (unless performed by an admin).
3. **Leaderboard Integrity**: Users may update only their own `publicAlias`, `optIn`, `completionPercent`, `completedSeats`, `partyAllocated`, `civicScore` (strictly capped `<= 800`), and `updatedAt`. Outcome fields (`officialPoints`, `correctConstituencies`, `correctPartyBands`) are immutable to non-admins so users cannot forge official accuracy scores.
4. **Admin RBAC**: Only verified admins (`request.auth.token.email_verified == true` and either bootstrapped owner email or `/admins/{uid}` document) may write to `/parties`, `/constituencies`, `/candidates`, `/official_results`, `/election_config`, `/admins`, or read/create `/audit_logs`.
5. **Audit Immutability**: `/audit_logs/{logId}` documents are append-only (`allow update, delete: if false`).
6. **Temporal Integrity**: All `createdAt` and `updatedAt` timestamps on client writes must equal `request.time` (server timestamp).

## 2. The "Dirty Dozen" Adversarial Payloads (Expected: PERMISSION_DENIED)
1. **Unauthenticated read of `/users/uid123`**: `auth: null` -> `PERMISSION_DENIED`.
2. **Cross-user PII read of `/users/victimUid`**: `auth: { uid: 'attackerUid', email_verified: true }` -> `PERMISSION_DENIED`.
3. **Shadow field on `/users/uid123` create**: `{ uid: 'uid123', ..., role: 'admin' }` -> `PERMISSION_DENIED` (`hasOnly` rejects unknown keys).
4. **Unverified email write to `/user_predictions/uid123`**: `auth: { uid: 'uid123', token: { email_verified: false } }` -> `PERMISSION_DENIED`.
5. **Cross-user prediction overwrite on `/user_predictions/victimUid`**: `auth: { uid: 'attackerUid' }` -> `PERMISSION_DENIED`.
6. **Over-limit totalAllocated (500 > 403) on `/user_predictions/uid123`**: `totalAllocated: 500` -> `PERMISSION_DENIED`.
7. **Leaderboard score tampering on `/leaderboard/uid123`**: non-admin attempts to update `officialPoints: 9999` -> `PERMISSION_DENIED`.
8. **Client-forged timestamp on `/user_predictions/uid123`**: `updatedAt: '2026-01-01T00:00:00Z'` instead of `request.time` -> `PERMISSION_DENIED`.
9. **Non-admin write to `/candidates/cand1`**: non-admin creates/updates official candidate -> `PERMISSION_DENIED`.
10. **Non-admin write to `/election_config/global`**: non-admin toggles `isLocked: false` -> `PERMISSION_DENIED`.
11. **Admin audit log deletion `/audit_logs/log1`**: even admin attempts `delete` -> `PERMISSION_DENIED`.
12. **ID poisoning with 200-char invalid doc ID `/user_predictions/aaa...`**: `isValidId` fails -> `PERMISSION_DENIED`.
