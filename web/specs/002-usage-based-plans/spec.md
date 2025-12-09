# Feature Specification: Usage-Based Plans and Licenses

**Feature Branch**: `002-usage-based-plans`  
**Created**: 2025-12-08  
**Status**: Draft  
**Input**: User description: "As a admin I want to create usage based plan and licenses. I want to create a plan and specify number of usages. It is default number of usages for a license. If license is added to the plan or generated using api, it should take default usage number. As a admin I want to topup license usages. There should be consumption endpoint which decreases assigned number of usages. So we need full management cycle. Also system should ensure that license is used in scope of specific plan and product. (using headers). Client should send product-id in header. Sccpe of this work is api and web folders."

## Clarifications

### Session 2025-12-08

- Q: Can a single plan have both defaultUsageCount AND durationDays/deviceLimit, or must plans be exclusively one type? → A: Plans are mutually exclusive: either usage-based (defaultUsageCount) OR time-based (durationDays/deviceLimit), not both
- Q: Should the consumption endpoint require authentication (like admin endpoints) or be public (like the validation endpoint)? → A: Public endpoint (no authentication required, like validation endpoint)
- Q: Should the consumption endpoint be a separate endpoint or integrated into the existing validation endpoint? → A: Separate endpoint: POST /api/consume (distinct from validation)
- Q: How do usage-based licenses expire - based on time, usage exhaustion, or both? → A: Usage-based licenses expire when currentUsageCount reaches 0, no time-based expiration
- Q: Should topup operations be allowed on expired or cancelled licenses, or should they be rejected? → A: Reject topup on expired/cancelled licenses (only ACTIVE licenses can be topped up)

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Admin Creates Usage-Based Plan (Priority: P1)

As an admin, I want to create a plan with a default usage count so that licenses generated from this plan automatically receive the specified number of usages.

**Why this priority**: This is the foundation of the usage-based system. Without the ability to set default usages on plans, licenses cannot be properly initialized with usage quotas.

**Independent Test**: Can be fully tested by creating a plan with a defaultUsageCount value and verifying the plan is stored correctly. This delivers the core capability to define usage quotas at the plan level.

**Acceptance Scenarios**:

1. **Given** I am an authenticated admin, **When** I create a new plan with a `defaultUsageCount` field set to 1000, **Then** the plan is created successfully and stores the defaultUsageCount value
2. **Given** I am an authenticated admin, **When** I create a plan without specifying `defaultUsageCount`, **Then** the system rejects the request with a validation error indicating defaultUsageCount is required for usage-based plans
3. **Given** I am an authenticated admin, **When** I create a plan with `defaultUsageCount` set to 0 or negative, **Then** the system rejects the request with a validation error
4. **Given** I am an authenticated admin, **When** I view an existing usage-based plan, **Then** I can see the defaultUsageCount value displayed in the plan details

---

### User Story 2 - License Inherits Default Usage from Plan (Priority: P1)

As an admin, I want licenses created from a usage-based plan to automatically receive the plan's default usage count so that I don't need to manually set usage for each license.

**Why this priority**: This ensures consistency and reduces manual work. Every license from a plan should start with the same usage quota, making the system predictable and easy to use.

**Independent Test**: Can be fully tested by creating a license for a plan with defaultUsageCount=500 and verifying the license is created with currentUsageCount=500 and totalUsageCount=500. This delivers automatic usage quota assignment.

**Acceptance Scenarios**:

1. **Given** a plan exists with `defaultUsageCount` of 500, **When** I create a license for that plan via the web interface, **Then** the license is created with `currentUsageCount` set to 500 and `totalUsageCount` set to 500
2. **Given** a plan exists with `defaultUsageCount` of 1000, **When** I create a license for that plan via the API, **Then** the license is created with `currentUsageCount` set to 1000 and `totalUsageCount` set to 1000
3. **Given** I view a license created from a usage-based plan, **When** I check the license details, **Then** I can see both currentUsageCount and totalUsageCount displayed

---

### User Story 3 - Admin Tops Up License Usages (Priority: P2)

As an admin, I want to add additional usages to an existing license so that I can extend the license's usage quota without creating a new license.

**Why this priority**: This enables license management flexibility. Admins need to be able to increase usage quotas for existing licenses when needed, supporting customer service scenarios and license upgrades.

**Independent Test**: Can be fully tested by topping up a license with 200 additional usages and verifying both currentUsageCount and totalUsageCount increase by 200. This delivers the ability to extend license quotas.

**Acceptance Scenarios**:

1. **Given** a license exists with `currentUsageCount` of 300 and `totalUsageCount` of 500, **When** I top up the license with 200 additional usages, **Then** the license's `currentUsageCount` becomes 500 and `totalUsageCount` becomes 700
2. **Given** I am an authenticated admin, **When** I attempt to top up a license with 0 or negative usages, **Then** the system rejects the request with a validation error
3. **Given** I am an authenticated admin, **When** I top up a license, **Then** the action is logged in the system logs
4. **Given** I view a license after topping up, **When** I check the license details, **Then** I can see the updated currentUsageCount and totalUsageCount values

---

### User Story 4 - Client Consumes License Usage (Priority: P1)

As a client application, I want to consume usage from a license so that I can track feature usage and enforce usage limits.

**Why this priority**: This is the core consumption mechanism. Without the ability to consume usages, the usage-based system cannot function. This endpoint enables applications to decrement usage counts when features are used.

**Independent Test**: Can be fully tested by calling the consumption endpoint with a valid license key and product-id header, and verifying the license's currentUsageCount decreases by the specified amount. This delivers the core usage tracking functionality.

**Acceptance Scenarios**:

1. **Given** a license exists with `currentUsageCount` of 100, **When** a client sends a consumption request with `product-id` header matching the license's productId and consumes 5 usages, **Then** the license's `currentUsageCount` becomes 95 and the request succeeds
2. **Given** a license exists with `currentUsageCount` of 3, **When** a client attempts to consume 5 usages, **Then** the request fails with an error indicating insufficient usages and currentUsageCount remains 3
3. **Given** a client sends a consumption request without the `product-id` header, **When** the request is processed, **Then** the request is rejected with a 400 error indicating product-id header is required
4. **Given** a client sends a consumption request with a `product-id` header that doesn't match the license's productId, **When** the request is processed, **Then** the request is rejected with an error indicating product mismatch
5. **Given** a license has `currentUsageCount` of 0, **When** a client attempts to consume usages, **Then** the request fails with an error indicating no usages remaining
6. **Given** a client successfully consumes usages, **When** the consumption is processed, **Then** the action is logged in the system logs

---

### User Story 5 - System Validates Product and Plan Scope (Priority: P1)

As a system, I want to ensure that license consumption only occurs within the correct product and plan scope so that licenses cannot be misused across different products or plans.

**Why this priority**: This is a critical security and business logic requirement. Licenses must be scoped to specific products and plans to prevent unauthorized usage and ensure proper license management.

**Independent Test**: Can be fully tested by attempting to consume a license with mismatched product-id header and verifying the request is rejected. This delivers product/plan scoping enforcement.

**Acceptance Scenarios**:

1. **Given** a license exists for product "ProductA" and plan "PlanX", **When** a client sends a consumption request with `product-id` header set to "ProductA", **Then** the request is processed successfully
2. **Given** a license exists for product "ProductA" and plan "PlanX", **When** a client sends a consumption request with `product-id` header set to "ProductB", **Then** the request is rejected with an error indicating product mismatch
3. **Given** a license exists for a specific plan, **When** a consumption request is processed, **Then** the system verifies the license's planId matches the plan associated with the product
4. **Given** a client sends a consumption request, **When** the product-id header is missing, **Then** the request is rejected before any license lookup occurs

---

### Edge Cases

- What happens when a license's currentUsageCount reaches 0? (System should reject further consumption attempts)
- How does the system handle concurrent consumption requests for the same license? (System should handle race conditions and prevent over-consumption)
- What happens if a topup is attempted on a cancelled or expired license? (System MUST reject topup requests for licenses that are not ACTIVE - only ACTIVE licenses can be topped up)
- How does the system handle consumption requests for licenses that are expired or cancelled? (System should reject consumption for invalid license statuses. For usage-based licenses, expiration occurs when currentUsageCount reaches 0)
- What happens when attempting to create a license for a plan that doesn't exist? (System should return appropriate error)
- How does the system handle very large usage counts (e.g., millions)? (System should validate reasonable limits)
- What happens if a consumption request specifies 0 or negative usage amount? (System should reject invalid consumption amounts)

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST allow admins to create plans with a `defaultUsageCount` field that specifies the default number of usages for licenses created from that plan
- **FR-002**: System MUST require `defaultUsageCount` to be a positive integer when creating usage-based plans, and MUST enforce that plans are mutually exclusive (usage-based plans cannot have durationDays/deviceLimit, and time-based plans cannot have defaultUsageCount)
- **FR-003**: System MUST automatically assign `currentUsageCount` and `totalUsageCount` equal to the plan's `defaultUsageCount` when creating a license from a usage-based plan
- **FR-004**: System MUST allow admins to top up license usages by adding a specified number of usages to both `currentUsageCount` and `totalUsageCount`
- **FR-004a**: System MUST reject topup requests for licenses that are not ACTIVE (expired or cancelled licenses cannot be topped up)
- **FR-005**: System MUST validate that topup amounts are positive integers
- **FR-006**: System MUST provide a public consumption endpoint at `POST /api/consume` (no authentication required) that decreases a license's `currentUsageCount` by a specified amount
- **FR-007**: System MUST require the `product-id` header in all consumption requests
- **FR-008**: System MUST validate that the `product-id` header in consumption requests matches the license's `productId`
- **FR-009**: System MUST reject consumption requests when `currentUsageCount` is insufficient for the requested consumption amount
- **FR-010**: System MUST reject consumption requests when the license status is not ACTIVE
- **FR-011**: System MUST reject consumption requests when the license has expired. For usage-based licenses, expiration occurs when `currentUsageCount` reaches 0 (no time-based expiration). For time-based licenses, expiration occurs based on `expiresAt` date
- **FR-012**: System MUST validate that consumption amounts are positive integers
- **FR-013**: System MUST log all topup and consumption operations in the system logs
- **FR-014**: System MUST display `currentUsageCount` and `totalUsageCount` in license details in the web interface
- **FR-015**: System MUST display `defaultUsageCount` in plan details in the web interface
- **FR-016**: System MUST handle concurrent consumption requests to prevent race conditions and over-consumption

### Key Entities *(include if feature involves data)*

- **Plan**: Represents a subscription plan. Plans are mutually exclusive types: either usage-based (has `defaultUsageCount` field) OR time-based (has `durationDays` and `deviceLimit` fields), but not both. Usage-based plans have a `defaultUsageCount` field (positive integer) that specifies the default number of usages for licenses created from this plan.

- **License**: Represents a license issued to a user. Extended with:
  - `currentUsageCount` (non-negative integer): The remaining number of usages available for consumption. For usage-based licenses, when this reaches 0, the license is considered expired
  - `totalUsageCount` (positive integer): The total number of usages ever allocated to this license (including topups)
  - Both fields are automatically initialized from the plan's `defaultUsageCount` when the license is created from a usage-based plan
  - Usage-based licenses expire when `currentUsageCount` reaches 0 (no time-based expiration via `expiresAt`)

- **Consumption Request**: Represents a client request to consume usages via `POST /api/consume`. Must include:
  - License key (in request body)
  - Product ID (in `product-id` header)
  - Consumption amount (positive integer in request body)

- **Topup Request**: Represents an admin request to add usages to a license. Must include:
  - License ID (in path)
  - Topup amount (positive integer in request body)

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Admins can create a usage-based plan with defaultUsageCount in under 30 seconds through the web interface
- **SC-002**: Licenses created from usage-based plans automatically receive the correct defaultUsageCount with 100% accuracy
- **SC-003**: Consumption endpoint processes requests in under 500ms for 95% of requests under normal load
- **SC-004**: System correctly rejects consumption requests with mismatched product-id headers with 100% accuracy
- **SC-005**: System prevents over-consumption (consuming more than currentUsageCount) with 100% accuracy, including under concurrent request scenarios
- **SC-006**: Topup operations complete successfully and update license usage counts correctly in 100% of valid requests
- **SC-007**: All topup and consumption operations are logged and traceable for audit purposes
- **SC-008**: Web interface displays currentUsageCount and totalUsageCount for all licenses with usage tracking

## Assumptions

- Usage-based plans are a new plan type that can coexist with existing time-based plans (durationDays, deviceLimit)
- Plans are mutually exclusive: a plan is either usage-based (has defaultUsageCount) OR time-based (has durationDays/deviceLimit), but not both
- Consumption endpoint will be called by client applications (not end users directly)
- Product-id header validation is sufficient for scoping (no additional plan-id header required in consumption requests)
- Usage consumption is atomic - either the full requested amount is consumed or none is consumed (no partial consumption)
- Usage-based licenses expire when currentUsageCount reaches 0, and do not have time-based expiration (expiresAt is not used for expiration logic for usage-based licenses)
- Topup operations can only be performed by authenticated admins
- Consumption endpoint is public (no authentication required), matching the validation endpoint pattern. Security is maintained through license key validation and product-id header verification
- System will handle reasonable usage count values (e.g., up to millions) without performance issues
- Race conditions in concurrent consumption will be handled through appropriate locking or transaction mechanisms

