# License API

Backend API for the License Management System built with Fastify and TypeScript.

## Setup

### Prerequisites

- Node.js 20+ and npm
- Firebase project access
- Firebase CLI (`npm install -g firebase-tools`)

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd license-api
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up Firebase credentials for local development:
   
   **Option A: Use service account file (recommended for local development)**
   
   A service account file (`*-firebase-adminsdk-*.json`) should be present in the repository root (git-ignored). Create `.env.local`:
   ```bash
   FIREBASE_PROJECT_ID=license-513ef
   GOOGLE_APPLICATION_CREDENTIALS=license-513ef-firebase-adminsdk-fbsvc-fc076bdf66.json
   PORT=3001
   CORS_ORIGIN=http://localhost:3000,http://localhost:5173
   ```
   
   **Option B: Use Application Default Credentials**
   
   If you have `gcloud` CLI configured with application default credentials:
   ```bash
   FIREBASE_PROJECT_ID=license-513ef
   PORT=3001
   CORS_ORIGIN=http://localhost:3000,http://localhost:5173
   ```
   
   **Note:** In production (Firebase App Hosting), the service uses Application Default Credentials automatically. No `GOOGLE_APPLICATION_CREDENTIALS` is needed in Cloud Run.

### Development

Start the development server:
```bash
npm run dev
```

The server will be available at `http://localhost:3001` (or configured port).

### Building

Build TypeScript:
```bash
npm run build
```

Output will be in the `dist/` directory.

### Running Production Build

```bash
npm start
```

The server will start on port 8080 (or the `PORT` environment variable).

### Deployment

Deploy to Firebase App Hosting:
```bash
firebase deploy
```

**Note:** The backend is deployed as a Cloud Run service. Ensure `firebase.json` and `apphosting.yaml` are correctly configured.

## Environment Variables

Configured in `apphosting.yaml`:
- `NODE_ENV=production`
- `FIREBASE_PROJECT_ID=license-513ef`

For local development (`.env.local`):
- `FIREBASE_PROJECT_ID` - Firebase project ID (required)
- `GOOGLE_APPLICATION_CREDENTIALS` - Path to service account JSON file (required for local dev, not needed in Cloud Run)
- `CORS_ALLOW_ALL` - Allow all origins for CORS (default: true, set to 'false' to restrict)
- `CORS_ORIGIN` - Allowed CORS origins (comma-separated, used when CORS_ALLOW_ALL=false)
- `PORT` - Server port (default: 3001, optional)
- `RATE_LIMIT_MAX_REQUESTS` - Maximum requests per time window (default: 100)
- `RATE_LIMIT_WINDOW_MS` - Time window duration in milliseconds (default: 60000 = 1 minute)
- `RATE_LIMIT_CLEANUP_INTERVAL_MS` - Cleanup interval for expired entries in milliseconds (default: 300000 = 5 minutes)

**Important:** The service account file (`*-firebase-adminsdk-*.json`) must exist in the repository root. It is git-ignored for security. Copy it from your Firebase project or download it from Firebase Console → Project Settings → Service Accounts.

## Type Synchronization

This repository shares type definitions with `license-ui`. See `TYPES_SYNC.md` for synchronization instructions.

## Project Structure

```
license-api/
├── routes/         # API route handlers
├── services/       # Business logic (Firestore, etc.)
├── middleware/     # Middleware (authentication, etc.)
├── dist/           # Build output (generated)
└── types.ts        # TypeScript type definitions (sync with license-ui)
```

## API Documentation

Interactive API documentation is available at `/docs` when the server is running. The documentation includes:

- Complete endpoint listings with descriptions
- Request/response schemas with examples
- Interactive testing capabilities
- Authentication requirements
- Export options (OpenAPI JSON and YAML)

**Access Documentation**:
- Local development: `http://localhost:3001/docs`
- Production: `https://your-api-url/docs`

**Export Documentation**:
- OpenAPI JSON: `/docs/openapi.json`
- OpenAPI YAML: `/docs/openapi.yaml`

The documentation is automatically generated from route schemas and stays synchronized with code changes.

## API Endpoints

- `GET /health` - Health check (public)
- `POST /api/validate` - License validation (public)
- `GET /api/products` - List products (authenticated)
- `POST /api/products` - Create product (authenticated)
- `DELETE /api/products/:id` - Delete product (authenticated)
- `GET /api/plans` - List plans (authenticated)
- `POST /api/plans` - Create plan (authenticated)
- `DELETE /api/plans/:id` - Delete plan (authenticated)
- `GET /api/licenses` - List licenses (authenticated)
- `GET /api/licenses/key/:key` - Get license by key (authenticated)
- `POST /api/licenses` - Create license (authenticated)
- `POST /api/licenses/:id/renew` - Renew license (authenticated)
- `POST /api/licenses/:id/cancel` - Cancel license (authenticated)
- `POST /api/licenses/:id/topup` - Topup usage-based license (authenticated)
- `POST /api/consume` - Consume usage from license (public, requires product-id header)
- `GET /api/logs` - List logs (authenticated)

All authenticated endpoints require a Firebase Auth token in the `Authorization: Bearer <token>` header.

## CORS Configuration

Public endpoints (`/api/validate`, `/api/consume`, `/health`) allow requests from any origin by default to enable external access. This is required for browser extensions and third-party integrations.

**Configuration**:
- `CORS_ALLOW_ALL` (default: true): Allow all origins for public endpoints
- `CORS_ORIGIN`: Comma-separated list of allowed origins (used when `CORS_ALLOW_ALL=false`)

**Security Note**: Protected endpoints require authentication, so CORS restrictions are less critical. The API relies on authentication tokens rather than origin restrictions for security.

## Rate Limiting

Public endpoints (`/api/validate` and `/api/consume`) are protected by rate limiting to prevent abuse:

- **Limit**: 100 requests per minute per client
- **Client Identification**: Combination of IP address and license key
- **Algorithm**: Fixed window (1-minute windows)
- **Response**: HTTP 429 (Too Many Requests) with `Retry-After` header when limit exceeded
- **Storage**: In-memory (per server instance, not shared across instances)

### Rate Limit Configuration

Rate limiting is configurable via environment variables:

- `RATE_LIMIT_MAX_REQUESTS` (default: 100): Maximum requests allowed per time window
- `RATE_LIMIT_WINDOW_MS` (default: 60000): Time window duration in milliseconds
- `RATE_LIMIT_CLEANUP_INTERVAL_MS` (default: 300000): Interval for cleaning up expired entries

If configuration is missing or invalid, safe defaults are used and a warning is logged.

### Rate Limit Response

When rate limit is exceeded, the API returns:

```json
{
  "error": "Rate limit exceeded",
  "code": "RATE_LIMIT_EXCEEDED",
  "retryAfter": 30
}
```

With HTTP status `429` and `Retry-After` header indicating seconds until the rate limit resets.

### Notes

- Rate limits are applied per client (IP + License Key combination)
- Different clients have independent rate limits
- Rate limits reset on server restart
- Rate limit violations are logged for monitoring

