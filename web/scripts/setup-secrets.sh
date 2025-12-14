#!/bin/bash
# Script to store Firebase configuration in Google Cloud Secret Manager
# 
# Usage:
#   ./scripts/setup-secrets.sh
# 
# This will prompt for each Firebase configuration value and store it in Secret Manager

set -e

# Project ID can be set via environment variable or defaults to license-513ef
PROJECT_ID="${GOOGLE_CLOUD_PROJECT:-license-513ef}"

echo "🔐 Setting up Firebase configuration in Google Cloud Secret Manager"
echo "Project: ${PROJECT_ID}"
echo ""

# Function to create or update a secret
create_or_update_secret() {
  local secret_name=$1
  local secret_value=$2
  local description=$3
  
  # Check if secret exists
  if gcloud secrets describe "${secret_name}" --project="${PROJECT_ID}" &>/dev/null; then
    echo "📝 Updating existing secret: ${secret_name}"
    echo -n "${secret_value}" | gcloud secrets versions add "${secret_name}" --data-file=- --project="${PROJECT_ID}"
  else
    echo "✨ Creating new secret: ${secret_name}"
    echo -n "${secret_value}" | gcloud secrets create "${secret_name}" --data-file=- --project="${PROJECT_ID}" --replication-policy="automatic"
  fi
  
  # Grant access to Cloud Build service account (for CI/CD)
  PROJECT_NUMBER=$(gcloud projects describe "${PROJECT_ID}" --format="value(projectNumber)")
  CLOUD_BUILD_SA="${PROJECT_NUMBER}@cloudbuild.gserviceaccount.com"
  
  if gcloud projects get-iam-policy "${PROJECT_ID}" --flatten="bindings[].members" --filter="bindings.members:${CLOUD_BUILD_SA}" &>/dev/null; then
    echo "   Granting access to Cloud Build service account..."
    gcloud secrets add-iam-policy-binding "${secret_name}" \
      --member="serviceAccount:${CLOUD_BUILD_SA}" \
      --role="roles/secretmanager.secretAccessor" \
      --project="${PROJECT_ID}" 2>/dev/null || true
  fi
}

# Get Firebase config values
echo "Enter Firebase configuration values:"
echo ""

read -p "VITE_FIREBASE_API_KEY: " API_KEY
read -p "VITE_FIREBASE_AUTH_DOMAIN: " AUTH_DOMAIN
if [ -z "$AUTH_DOMAIN" ]; then
  echo "❌ VITE_FIREBASE_AUTH_DOMAIN is required"
  exit 1
fi

read -p "VITE_FIREBASE_PROJECT_ID: " PROJECT_ID_VALUE
if [ -z "$PROJECT_ID_VALUE" ]; then
  echo "❌ VITE_FIREBASE_PROJECT_ID is required"
  exit 1
fi

read -p "VITE_FIREBASE_STORAGE_BUCKET: " STORAGE_BUCKET
if [ -z "$STORAGE_BUCKET" ]; then
  echo "❌ VITE_FIREBASE_STORAGE_BUCKET is required"
  exit 1
fi

read -p "VITE_FIREBASE_MESSAGING_SENDER_ID: " MESSAGING_SENDER_ID
if [ -z "$MESSAGING_SENDER_ID" ]; then
  echo "❌ VITE_FIREBASE_MESSAGING_SENDER_ID is required"
  exit 1
fi

read -p "VITE_FIREBASE_APP_ID: " APP_ID
if [ -z "$APP_ID" ]; then
  echo "❌ VITE_FIREBASE_APP_ID is required"
  exit 1
fi

read -p "VITE_FIREBASE_MEASUREMENT_ID (optional): " MEASUREMENT_ID

echo ""
echo "Storing secrets in Secret Manager..."

create_or_update_secret "VITE_FIREBASE_API_KEY" "${API_KEY}" "Firebase API Key"
create_or_update_secret "VITE_FIREBASE_AUTH_DOMAIN" "${AUTH_DOMAIN}" "Firebase Auth Domain"
create_or_update_secret "VITE_FIREBASE_PROJECT_ID" "${PROJECT_ID_VALUE}" "Firebase Project ID"
create_or_update_secret "VITE_FIREBASE_STORAGE_BUCKET" "${STORAGE_BUCKET}" "Firebase Storage Bucket"
create_or_update_secret "VITE_FIREBASE_MESSAGING_SENDER_ID" "${MESSAGING_SENDER_ID}" "Firebase Messaging Sender ID"
create_or_update_secret "VITE_FIREBASE_APP_ID" "${APP_ID}" "Firebase App ID"

if [ -n "${MEASUREMENT_ID}" ]; then
  create_or_update_secret "VITE_FIREBASE_MEASUREMENT_ID" "${MEASUREMENT_ID}" "Firebase Measurement ID"
fi

echo ""
echo "✅ All secrets stored successfully in Google Cloud Secret Manager!"
echo ""
echo "You can now build using:"
echo "  npm run build:production"
echo ""
echo "Or set environment variables in your CI/CD pipeline to read from Secret Manager."

