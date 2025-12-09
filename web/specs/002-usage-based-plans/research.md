# Research: Usage-Based Plans and Licenses

**Feature**: 002-usage-based-plans  
**Date**: 2025-12-08

## Technical Decisions

### Firestore Transactions for Atomic Consumption

**Decision**: Use Firestore transactions to ensure atomic consumption operations and prevent race conditions when multiple concurrent requests attempt to consume from the same license.

**Rationale**: 
- Firestore transactions provide ACID guarantees for read-modify-write operations
- Existing codebase already uses transactions (see `renewLicense` in `firestore.ts`)
- Prevents over-consumption when concurrent requests occur
- Automatic retry on conflicts ensures eventual consistency

**Alternatives considered**:
- Optimistic locking with version numbers: More complex, requires additional field management
- Distributed locks: Overkill for single-database operations, adds latency
- Queue-based processing: Adds complexity and latency, not needed for this use case

**Implementation**: Use `db.runTransaction()` to:
1. Read current license with currentUsageCount
2. Validate sufficient usage available
3. Decrement currentUsageCount atomically
4. Update license document
5. Log consumption event

### Plan Type Exclusivity Validation

**Decision**: Enforce mutual exclusivity at the API layer - plans must be either usage-based (has defaultUsageCount) OR time-based (has durationDays/deviceLimit), but not both.

**Rationale**:
- Simplifies business logic and validation
- Prevents ambiguous license behavior
- Clear separation of concerns
- Easier to reason about and test

**Alternatives considered**:
- Allow hybrid plans: Would require complex validation logic for which limits apply
- Runtime type detection: Less explicit, harder to validate

**Implementation**: Add validation in plan creation endpoint to reject plans that have both defaultUsageCount and durationDays/deviceLimit.

### Public Consumption Endpoint

**Decision**: Make consumption endpoint public (no authentication required), matching the existing validation endpoint pattern.

**Rationale**:
- Client applications need to consume usages without managing auth tokens
- Security maintained through license key validation and product-id header verification
- Consistent with existing `/api/validate` endpoint design
- Reduces integration complexity for client applications

**Alternatives considered**:
- Require authentication: Adds complexity for client apps, not necessary since license key is secret
- Optional authentication: Unclear security model, harder to reason about

**Implementation**: Register consumption routes as public endpoint (outside authenticated route group) in `api/index.ts`.

### Usage-Based License Expiration

**Decision**: Usage-based licenses expire when currentUsageCount reaches 0, with no time-based expiration.

**Rationale**:
- Aligns with usage-based pricing model
- Simplifies expiration logic (no date comparisons needed)
- Clear user expectation: license valid until usage exhausted
- Avoids confusion with time-based expiration

**Alternatives considered**:
- Time-based expiration for usage licenses: Conflicts with usage model, adds complexity
- Hybrid expiration: Unclear which takes precedence, complex edge cases

**Implementation**: Check `currentUsageCount === 0` for expiration in consumption endpoint, skip expiresAt checks for usage-based licenses.

### Topup Restrictions

**Decision**: Only allow topup operations on ACTIVE licenses. Reject topups for expired or cancelled licenses.

**Rationale**:
- Maintains data integrity
- Prevents reactivation of invalid licenses through topup
- Clear business rule: expired/cancelled licenses require renewal or new license
- Prevents confusion about license state

**Alternatives considered**:
- Allow topup on expired licenses: Could reactivate invalid licenses, unclear business intent
- Allow topup on cancelled but not expired: Inconsistent rules, harder to reason about

**Implementation**: Validate license status is ACTIVE before processing topup request.

