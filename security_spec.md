# Security Specification: Fortress NGO platform

## 1. Data Invariants
- **Multi-Tenant Isolation**: No user can read or write data belonging to another `organizationId`.
- **Identity Integrity**: The `recordedBy`, `userId`, or `authorId` fields must strictly match the `request.auth.uid`.
- **Terminal State Guard**: Once a status is set to 'CHECKED_OUT' or 'DONE', only Admins can modify specific metadata; core transaction data remains immutable.
- **Verification Requirement**: Only users with verified emails can perform write operations to production collections.
- **System Field Protection**: Fields like `role`, `organizationId` (on creation), and `createdAt` are immutable or system-assigned.

## 2. The "Dirty Dozen" (Logic Leak Payloads)
The following payloads **MUST** be rejected by Firestore Security Rules:
1. **The Cross-Org Peek**: Attempting `list` on `/organizations/org-A/visitors` while authenticated in `org-B`.
2. **The Identity Spoof**: Creating a visit with `visitorId: 'target-user'` but `request.auth.uid` is 'attacker'.
3. **The Role Escalation**: A 'STAFF' user attempting to update their own `role` to 'ADMIN'.
4. **The Shadow Update**: Adding a field `isVerified: true` to a user profile during a name update.
5. **The Orphaned Record**: Creating a visit for a non-existent `visitorId`.
6. **The Negative Donation**: Recording a donation with `amount: -500`.
7. **The Retroactive Timestamp**: Setting `createdAt: '2000-01-01'` to bypass tenure checks.
8. **The PII Blanket Read**: A logged-in user attempting to read the `/users` registry directly without a specific UID match.
9. **The Notification Injection**: A visitor attempting to create a 'SYSTEM' notification for the entire organization.
10. **The ID Poisoning**: Using a 1MB string as a document ID to crash queries.
11. **The Ghost Organization**: Attempting to create an organization profile while already belonging to one.
12. **The Sensitive Leak**: Reading the `activityLogs` of a different user within the same organization.

## 3. Test Runner Strategy
I will use the `firestore.rules` to enforce these gates at the database level.
