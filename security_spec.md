# Security Specification - CloSolda Firestore Rules

## 1. Data Invariants
1. Only authenticated administrators can read, list, create, update, or delete CloSolda records.
2. The initial bootstapped administrator email is `manutencaolaminor@gmail.com`.
3. All write operations require email verification (`request.auth.token.email_verified == true`).
4. Document IDs must conform to `isValidId()` (`id is string && id.size() <= 128 && id.matches('^[a-zA-Z0-9_\\-]+$')`).
5. All string fields must adhere to strict `.size() <= MAX` bounds to eliminate denial-of-wallet resource inflation.
6. The `createdBy` and `createdAt` fields are strictly immutable on update (`incoming().createdBy == existing().createdBy && incoming().createdAt == existing().createdAt`).
7. Server timestamps must match `request.time` on mutations.
8. Status values are restricted to strictly typed enums.
9. Quoted financial calculations (subtotal, desconto, acrescimo, valorTotal) must be positive numerical amounts.
10. Quote items must link to an existing or valid quoteId and belong to the creator.
11. Project photos must specify valid stages: 'Antes', 'Durante', 'Depois'.
12. Catch-all default deny rule prevents any access outside the explicit authenticated models.

## 2. The "Dirty Dozen" Adversarial Payloads
1. **Unauthenticated Public Read**: Anonymous or unauthenticated request to `/clients` -> DENIED.
2. **Unverified Email Write**: User with `email_verified == false` attempting to create a quote -> DENIED.
3. **Spoofed Admin UID**: Non-admin user setting their user record to `role: 'admin'` -> DENIED.
4. **ID Poisoning / Denial-of-Wallet**: Document ID with 2KB payload or illegal characters -> DENIED.
5. **Ghost Field Injection (Shadow Update)**: Attempting to inject `__malicious_flag: true` into a client document -> DENIED.
6. **Immutability Bypass**: Attempting to alter `createdAt` or `createdBy` on an existing project -> DENIED.
7. **Negative or NaN Pricing**: Quote with `valorTotal: -5000` or `valorTotal: "free"` -> DENIED.
8. **Invalid Enum Injection**: Appointment with `status: "Hacked"` instead of allowed statuses -> DENIED.
9. **Oversized String Bomb**: Project description containing a 500KB string payload -> DENIED.
10. **Client-side Timestamp Forgery**: Attempting to set `createdAt` to a past or future date instead of `request.time` -> DENIED.
11. **Orphaned Photo Insertion**: Inserting a photo without valid `projectId` or missing required metadata -> DENIED.
12. **Cross-Tenant / Non-Owner Extraction**: Attempting blanket listing without meeting owner or admin criteria -> DENIED.

## 3. Test Runner Invariant Map
All 12 adversarial vectors are audited against the hardened security rules in `firestore.rules`.
