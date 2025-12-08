# Migration Guide: Split Project Structure

This document describes the migration from the single `licensenext` repository to two separate repositories: `license-api` and `license-ui`.

## Overview

The original `licensenext` repository has been split into:
- **license-api**: Backend Fastify API (previously `licensenext/server/`)
- **license-ui**: Frontend React application (previously `licensenext/` root)

## File Mapping

### Backend Files → license-api

| Original Location | New Location |
|-------------------|--------------|
| `licensenext/server/*` | `license-api/*` (root level) |
| `licensenext/server/package.json` | `license-api/package.json` |
| `licensenext/server/firebase.json` | `license-api/firebase.json` |
| `licensenext/server/apphosting.yaml` | `license-api/apphosting.yaml` |
| `licensenext/server/Dockerfile` | `license-api/Dockerfile` |
| `licensenext/server/tsconfig.json` | `license-api/tsconfig.json` |
| `licensenext/types.ts` | `license-api/types.ts` |

### Frontend Files → license-ui

| Original Location | New Location |
|-------------------|--------------|
| `licensenext/package.json` | `license-ui/package.json` |
| `licensenext/vite.config.ts` | `license-ui/vite.config.ts` |
| `licensenext/tsconfig.json` | `license-ui/tsconfig.json` |
| `licensenext/index.html` | `license-ui/index.html` |
| `licensenext/index.tsx` | `license-ui/index.tsx` |
| `licensenext/App.tsx` | `license-ui/App.tsx` |
| `licensenext/components/` | `license-ui/components/` |
| `licensenext/contexts/` | `license-ui/contexts/` |
| `licensenext/pages/` | `license-ui/pages/` |
| `licensenext/services/` | `license-ui/services/` |
| `licensenext/public/` | `license-ui/public/` |
| `licensenext/types.ts` | `license-ui/types.ts` |
| `licensenext/firebase.json` | `license-ui/firebase.json` (updated) |
| `licensenext/.env.local` | `license-ui/.env.local` |

## Configuration Changes

### license-api/firebase.json

**Before:** Included both `hosting` and `apphosting` sections  
**After:** Contains only `apphosting` section:

```json
{
  "apphosting": {
    "backendId": "licenses-web",
    "rootDir": ".",
    "ignore": ["node_modules", ".git", "firebase-debug.log", "*.md", ".env", ".env.local"]
  }
}
```

### license-ui/firebase.json

**Before:** Included both `hosting` and `apphosting` sections  
**After:** Contains only `hosting` section with API rewrite:

```json
{
  "hosting": {
    "public": "dist",
    "rewrites": [
      {
        "source": "/api/**",
        "run": {
          "serviceId": "licenses-web",
          "region": "europe-west4"
        }
      },
      {
        "source": "**",
        "destination": "/index.html"
      }
    ]
  }
}
```

### license-ui/package.json

**Removed scripts:**
- `dev:server`
- `dev:all`
- `build:server`
- `start:server`

**Removed dependencies:**
- `@fastify/cors`
- `dotenv`
- `fastify`
- `firebase-admin`
- `pino`
- `pino-pretty`
- `concurrently`
- `tsx`

**Kept:**
- Frontend dependencies only (react, firebase, vite, etc.)

## Deployment Process

### Backend Deployment (license-api)

1. Navigate to backend directory:
   ```bash
   cd c:/git/license-api
   ```

2. Initialize Firebase (if not already done):
   ```bash
   firebase init apphosting
   # Select existing backend: licenses-web
   ```

3. Deploy:
   ```bash
   firebase deploy
   ```

   The backend will be deployed to Cloud Run as `licenses-web`.

### Frontend Deployment (license-ui)

1. Navigate to frontend directory:
   ```bash
   cd c:/git/license-ui
   ```

2. Build the frontend:
   ```bash
   npm run build
   ```

3. Initialize Firebase (if not already done):
   ```bash
   firebase init hosting
   # Select existing project: license-513ef
   # Public directory: dist
   # Configure as single-page app: Yes
   ```

4. Deploy:
   ```bash
   firebase deploy
   ```

   The frontend will be deployed to Firebase Hosting at `https://license-513ef.web.app`.

## Environment Variables

### license-ui

Required for local development (`.env.local`):
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`

Copy `.env.example` to `.env.local` and fill in values from Firebase Console.

### license-api

Configured in `apphosting.yaml`:
- `NODE_ENV=production`
- `FIREBASE_PROJECT_ID=license-513ef`

For local development, create `.env.local` with:
- `FIREBASE_PROJECT_ID=license-513ef`
- `PORT=3001` (optional, defaults to 3001)
- `CORS_ORIGIN=http://localhost:3000,http://localhost:5173` (optional)

## Type Synchronization

The `types.ts` file is duplicated in both repositories. When making changes:

1. Update types in one repository (usually `license-api` first)
2. Copy to the other repository:
   ```bash
   cp c:/git/license-api/types.ts c:/git/license-ui/types.ts
   ```
3. Verify both repositories build successfully
4. See `TYPES_SYNC.md` in each repository for detailed instructions

## Troubleshooting

### Backend Issues

**Problem:** `Cannot find module` errors  
**Solution:** Verify all files were copied, check `tsconfig.json` paths, run `npm install`

**Problem:** Firebase deployment fails  
**Solution:** Verify `firebase.json` is correctly configured, check Firebase project access, ensure `.firebaserc` exists

**Problem:** Health endpoint returns 404  
**Solution:** Verify server is running, check PORT environment variable, verify routes are registered

### Frontend Issues

**Problem:** API calls return 403 or 401  
**Solution:** Verify backend is deployed and public, check CORS configuration, verify authentication token is sent

**Problem:** Build fails with import errors  
**Solution:** Verify all files were copied, check import paths in components/services, run `npm install`

**Problem:** Environment variables not loading  
**Solution:** Verify `.env.local` exists and contains all required `VITE_*` variables, restart dev server

**Problem:** API calls go to wrong URL  
**Solution:** Verify `services/api.ts` uses relative path in production, check `firebase.json` rewrite rules

### Deployment Issues

**Problem:** Frontend can't reach backend API  
**Solution:** 
- Verify backend is deployed and accessible
- Check `firebase.json` rewrite rule points to correct `serviceId` and `region`
- Verify Cloud Run service is public (allUsers has Cloud Run Invoker role)

**Problem:** Authentication fails  
**Solution:**
- Verify Firebase Auth is configured in both projects
- Check environment variables are set correctly
- Verify CORS allows the frontend origin

## Post-Migration Checklist

- [ ] Both repositories build successfully
- [ ] Backend runs locally and responds to health check
- [ ] Frontend runs locally and loads without errors
- [ ] Backend deploys to Firebase App Hosting
- [ ] Frontend deploys to Firebase Hosting
- [ ] Frontend can authenticate with Google
- [ ] API calls from frontend to backend work
- [ ] No CORS errors in browser console
- [ ] Original `licensenext` repository is archived/tagged

## Archive Information

Original repository: `c:/git/licensenext`  
Archive tag: `pre-split-v1.0.0` (to be created)

The original repository should be preserved as a reference but is no longer used for active development.

