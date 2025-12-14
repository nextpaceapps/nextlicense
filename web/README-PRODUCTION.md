# Production Build Configuration

## Firebase Configuration in Google Cloud Secret Manager

For production builds, Firebase configuration is stored in **Google Cloud Secret Manager** and loaded during the build process. This ensures credentials are never committed to source code.

## Setup

### 1. Store Secrets in Secret Manager

Run the setup script to store all Firebase configuration values:

```bash
./scripts/setup-secrets.sh
```

This script will:
- Prompt you for each Firebase configuration value
- Create or update secrets in Google Cloud Secret Manager
- Grant necessary permissions to Cloud Build service account (for CI/CD)

### 2. Build for Production

Once secrets are stored, build using:

```bash
npm run build:production
```

This will:
- Load all secrets from Secret Manager
- Set them as environment variables
- Run the Vite build with production configuration

## Manual Secret Management

If you prefer to set secrets manually:

```bash
PROJECT_ID="your-project-id"

# Create each secret (replace with your actual values)
echo -n "your-api-key" | gcloud secrets create VITE_FIREBASE_API_KEY --data-file=- --project="${PROJECT_ID}"
echo -n "your-project-id.firebaseapp.com" | gcloud secrets create VITE_FIREBASE_AUTH_DOMAIN --data-file=- --project="${PROJECT_ID}"
echo -n "your-project-id" | gcloud secrets create VITE_FIREBASE_PROJECT_ID --data-file=- --project="${PROJECT_ID}"
echo -n "your-project-id.firebasestorage.app" | gcloud secrets create VITE_FIREBASE_STORAGE_BUCKET --data-file=- --project="${PROJECT_ID}"
echo -n "your-messaging-sender-id" | gcloud secrets create VITE_FIREBASE_MESSAGING_SENDER_ID --data-file=- --project="${PROJECT_ID}"
echo -n "your-app-id" | gcloud secrets create VITE_FIREBASE_APP_ID --data-file=- --project="${PROJECT_ID}"
echo -n "your-measurement-id" | gcloud secrets create VITE_FIREBASE_MEASUREMENT_ID --data-file=- --project="${PROJECT_ID}"
```

### Update Existing Secrets

To update a secret value:

```bash
echo -n "new-value" | gcloud secrets versions add SECRET_NAME --data-file=- --project=your-project-id
```

### List Secrets

To see all stored secrets:

```bash
gcloud secrets list --project=your-project-id --filter="name:VITE_FIREBASE*"
```

## Local Development

For local development, use `.env.local` (already git-ignored):

```bash
# web/.env.local
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project-id.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
VITE_FIREBASE_APP_ID=your-app-id
VITE_FIREBASE_MEASUREMENT_ID=your-measurement-id
```

## Important Notes

- ✅ `.env.local` is git-ignored - safe for local development
- ✅ Production secrets should NOT be committed to source code
- ✅ Use environment variables or Secret Manager for production builds
- ✅ Firebase client configs are public (embedded in JS bundle), but still use secrets for consistency

