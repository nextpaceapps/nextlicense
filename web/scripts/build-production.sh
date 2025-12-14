#!/bin/bash
# Production build script that reads Firebase configuration from Google Cloud Secret Manager
# 
# Usage:
#   ./scripts/build-production.sh
# 
# Requirements:
#   - Google Cloud SDK installed and authenticated
#   - Secrets stored in Secret Manager (run ./scripts/setup-secrets.sh first)
#   - gcloud CLI access to the project

set -e  # Exit on error

# Project ID can be set via environment variable or defaults to license-513ef
PROJECT_ID="${GOOGLE_CLOUD_PROJECT:-license-513ef}"

echo "🔐 Loading Firebase configuration from Google Cloud Secret Manager..."

# Function to get secret value
get_secret() {
  local secret_name=$1
  gcloud secrets versions access latest --secret="${secret_name}" --project="${PROJECT_ID}" 2>/dev/null || echo ""
}

# Load secrets from Secret Manager and export as environment variables
export VITE_FIREBASE_API_KEY=$(get_secret "VITE_FIREBASE_API_KEY")
export VITE_FIREBASE_AUTH_DOMAIN=$(get_secret "VITE_FIREBASE_AUTH_DOMAIN")
export VITE_FIREBASE_PROJECT_ID=$(get_secret "VITE_FIREBASE_PROJECT_ID")
export VITE_FIREBASE_STORAGE_BUCKET=$(get_secret "VITE_FIREBASE_STORAGE_BUCKET")
export VITE_FIREBASE_MESSAGING_SENDER_ID=$(get_secret "VITE_FIREBASE_MESSAGING_SENDER_ID")
export VITE_FIREBASE_APP_ID=$(get_secret "VITE_FIREBASE_APP_ID")
export VITE_FIREBASE_MEASUREMENT_ID=$(get_secret "VITE_FIREBASE_MEASUREMENT_ID")

# Check if required secrets are loaded
MISSING_SECRETS=()

if [ -z "$VITE_FIREBASE_API_KEY" ]; then MISSING_SECRETS+=("VITE_FIREBASE_API_KEY"); fi
if [ -z "$VITE_FIREBASE_AUTH_DOMAIN" ]; then MISSING_SECRETS+=("VITE_FIREBASE_AUTH_DOMAIN"); fi
if [ -z "$VITE_FIREBASE_PROJECT_ID" ]; then MISSING_SECRETS+=("VITE_FIREBASE_PROJECT_ID"); fi
if [ -z "$VITE_FIREBASE_STORAGE_BUCKET" ]; then MISSING_SECRETS+=("VITE_FIREBASE_STORAGE_BUCKET"); fi
if [ -z "$VITE_FIREBASE_MESSAGING_SENDER_ID" ]; then MISSING_SECRETS+=("VITE_FIREBASE_MESSAGING_SENDER_ID"); fi
if [ -z "$VITE_FIREBASE_APP_ID" ]; then MISSING_SECRETS+=("VITE_FIREBASE_APP_ID"); fi

if [ ${#MISSING_SECRETS[@]} -gt 0 ]; then
  echo "❌ Error: Required Firebase secrets not found in Secret Manager:"
  for secret in "${MISSING_SECRETS[@]}"; do
    echo "   - ${secret}"
  done
  echo ""
  echo "💡 To set up secrets, run:"
  echo "   ./scripts/setup-secrets.sh"
  echo ""
  echo "Or manually create secrets:"
  echo "   echo -n 'your-value' | gcloud secrets create SECRET_NAME --data-file=- --project=${PROJECT_ID}"
  exit 1
fi

echo "✅ All secrets loaded successfully from Secret Manager"
echo "🚀 Starting production build..."

# Run the build with the environment variables
NODE_ENV=production npm run build

echo "✅ Production build completed successfully!"

