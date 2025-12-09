# Data Model: Usage-Based Plans and Licenses

**Feature**: 002-usage-based-plans  
**Date**: 2025-12-08

## Entities

### Plan

**Collection**: `plans`

**Description**: Represents a subscription plan. Plans are mutually exclusive types: either usage-based OR time-based.

**Fields**:

| Field | Type | Required | Description | Validation |
|-------|------|----------|-------------|------------|
| `id` | string | Yes | Unique plan identifier | Auto-generated |
| `productId` | string | Yes | Reference to product | Must exist in products collection |
| `name` | string | Yes | Plan display name | Non-empty, trimmed |
| `defaultUsageCount` | number | Conditional | Default usage count for licenses (usage-based plans only) | Positive integer, required if usage-based |
| `durationDays` | number | Conditional | License duration in days (time-based plans only) | Positive integer, required if time-based |
| `deviceLimit` | number | Conditional | Maximum devices allowed (time-based plans only) | Non-negative integer, required if time-based |
| `features` | string[] | No | Feature codes enabled by plan | Array of strings |
| `price` | number | No | Plan price | Non-negative number |

**Type Exclusivity Rules**:
- Usage-based plan: MUST have `defaultUsageCount`, MUST NOT have `durationDays` or `deviceLimit`
- Time-based plan: MUST have `durationDays` and `deviceLimit`, MUST NOT have `defaultUsageCount`
- Validation enforced at API layer during plan creation

**Relationships**:
- Belongs to: `Product` (via `productId`)
- Has many: `License` (via `planId`)

**State Transitions**: None (immutable after creation)

### License

**Collection**: `licenses`

**Description**: Represents a license issued to a user. Extended with usage tracking fields for usage-based licenses.

**Fields**:

| Field | Type | Required | Description | Validation |
|-------|------|----------|-------------|------------|
| `id` | string | Yes | Unique license identifier | Auto-generated |
| `key` | string | Yes | License key for validation | Unique, auto-generated |
| `productId` | string | Yes | Reference to product | Must exist in products collection |
| `planId` | string | Yes | Reference to plan | Must exist in plans collection |
| `userEmail` | string | Yes | License owner email | Valid email format |
| `status` | LicenseStatus | Yes | License status | Enum: ACTIVE, EXPIRED, CANCELLED |
| `issuedAt` | string | Yes | License issue timestamp | ISO 8601 date string |
| `expiresAt` | string | Yes | License expiration timestamp | ISO 8601 date string (not used for usage-based expiration) |
| `activations` | Activation[] | Yes | Device activations | Array of Activation objects |
| `currentUsageCount` | number | Conditional | Remaining usages available (usage-based licenses only) | Non-negative integer, auto-initialized from plan.defaultUsageCount |
| `totalUsageCount` | number | Conditional | Total usages ever allocated (usage-based licenses only) | Positive integer, auto-initialized from plan.defaultUsageCount |

**Usage Tracking Rules**:
- For usage-based licenses: `currentUsageCount` and `totalUsageCount` are required
- Initialized from plan's `defaultUsageCount` when license is created
- `currentUsageCount` decreases on consumption, increases on topup
- `totalUsageCount` increases on topup (tracks lifetime allocation)
- License expires when `currentUsageCount` reaches 0 (no time-based expiration)

**Expiration Logic**:
- Usage-based licenses: Expire when `currentUsageCount === 0`
- Time-based licenses: Expire when `expiresAt` date is in the past
- Status automatically updated to EXPIRED when expiration condition met

**Relationships**:
- Belongs to: `Product` (via `productId`)
- Belongs to: `Plan` (via `planId`)

**State Transitions**:
- ACTIVE → EXPIRED: When usage exhausted (usage-based) or expiresAt passed (time-based)
- ACTIVE → CANCELLED: Admin cancellation
- EXPIRED → (no transitions, terminal state)
- CANCELLED → (no transitions, terminal state)

### Consumption Request

**Type**: Request DTO (not stored)

**Description**: Client request to consume usages from a license.

**Fields**:

| Field | Type | Location | Required | Description | Validation |
|-------|------|----------|----------|-------------|------------|
| `key` | string | Body | Yes | License key | Non-empty string |
| `amount` | number | Body | Yes | Number of usages to consume | Positive integer |
| `product-id` | string | Header | Yes | Product ID for scope validation | Must match license.productId |

**Validation Rules**:
- `product-id` header must match license's `productId`
- `amount` must be positive integer
- License must be ACTIVE
- License must not be expired (usage-based: currentUsageCount > 0, time-based: expiresAt in future)
- `currentUsageCount` must be >= `amount`

### Topup Request

**Type**: Request DTO (not stored)

**Description**: Admin request to add usages to a license.

**Fields**:

| Field | Type | Location | Required | Description | Validation |
|-------|------|----------|----------|-------------|------------|
| `amount` | number | Body | Yes | Number of usages to add | Positive integer |

**Path Parameter**: `id` (license ID)

**Validation Rules**:
- License must exist
- License must be ACTIVE (cannot topup expired or cancelled licenses)
- `amount` must be positive integer
- License must be from a usage-based plan (have currentUsageCount/totalUsageCount fields)

### LogEvent

**Collection**: `logs`

**Description**: Audit log entry for system operations. Extended to log consumption and topup operations.

**Fields**: (existing fields, no changes)

**New Log Types**:
- `CONSUME`: Usage consumption event
- `TOPUP`: Usage topup event

## Validation Rules Summary

### Plan Creation
1. Plan must be either usage-based OR time-based (mutually exclusive)
2. Usage-based: `defaultUsageCount` required, positive integer; `durationDays` and `deviceLimit` must be absent
3. Time-based: `durationDays` and `deviceLimit` required, positive integers; `defaultUsageCount` must be absent
4. `productId` must reference existing product

### License Creation
1. `planId` must reference existing plan
2. If plan is usage-based:
   - `currentUsageCount` = plan.defaultUsageCount
   - `totalUsageCount` = plan.defaultUsageCount
3. If plan is time-based:
   - `currentUsageCount` and `totalUsageCount` are not set
   - `expiresAt` calculated from `durationDays`

### Consumption
1. License key must exist
2. `product-id` header must match license.productId
3. License status must be ACTIVE
4. License must not be expired:
   - Usage-based: `currentUsageCount > 0`
   - Time-based: `expiresAt > now`
5. `currentUsageCount >= amount`
6. `amount` must be positive integer
7. Operation must be atomic (transaction)

### Topup
1. License must exist
2. License status must be ACTIVE
3. License must be from usage-based plan (have usage tracking fields)
4. `amount` must be positive integer
5. Operation must be atomic (transaction)

## Data Migration Considerations

**Existing Plans**: Time-based plans remain unchanged. No migration needed.

**Existing Licenses**: Time-based licenses remain unchanged. Usage tracking fields only added to new licenses from usage-based plans.

**Backward Compatibility**: 
- Existing API endpoints continue to work
- Existing time-based plans/licenses unaffected
- New fields are optional in type definitions (conditional based on plan type)

