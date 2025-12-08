# Firebase Deployment Guide

## Backend Deployment (license-api)

### Prerequisites

1. Firebase CLI installed: `npm install -g firebase-tools`
2. Logged in to Firebase: `firebase login`
3. `.firebaserc` file exists with project: `license-513ef`

### Deployment Steps

1. Navigate to backend directory:
   ```bash
   cd c:/git/license-api
   ```

2. Verify configuration:
   - `firebase.json` contains `apphosting` section
   - `apphosting.yaml` is present and configured
   - `Dockerfile` exists and CMD points to `dist/index.js`

3. Initialize Firebase App Hosting (if not already done):
   ```bash
   firebase init apphosting
   ```
   - Select: "Link to an existing backend"
   - Choose: `licenses-web`
   - Root directory: `.` (current directory)

4. Deploy:
   ```bash
   firebase deploy
   ```

5. Verify deployment:
   - Check Firebase Console: https://console.firebase.google.com/project/license-513ef/apphosting
   - Test health endpoint: `curl https://licenses-web-62778731600.europe-west4.run.app/health`

### Configuration Files

- **firebase.json**: App Hosting configuration
- **apphosting.yaml**: Cloud Run settings (CPU, memory, environment variables)
- **Dockerfile**: Container build instructions

## Frontend Deployment (license-ui)

### Prerequisites

1. Firebase CLI installed: `npm install -g firebase-tools`
2. Logged in to Firebase: `firebase login`
3. `.firebaserc` file exists with project: `license-513ef`
4. Environment variables set in `.env.local` (for build-time)

### Deployment Steps

1. Navigate to frontend directory:
   ```bash
   cd c:/git/license-ui
   ```

2. Build the frontend:
   ```bash
   npm run build
   ```
   This creates the `dist/` directory with production assets.

3. Verify configuration:
   - `firebase.json` contains `hosting` section with API rewrite
   - `dist/` directory exists and contains built files

4. Initialize Firebase Hosting (if not already done):
   ```bash
   firebase init hosting
   ```
   - Select existing project: `license-513ef`
   - Public directory: `dist`
   - Configure as single-page app: Yes
   - Set up automatic builds: No (or Yes if using CI/CD)

5. Deploy:
   ```bash
   firebase deploy
   ```

6. Verify deployment:
   - Frontend URL: `https://license-513ef.web.app`
   - Test authentication flow
   - Verify API calls work (check browser network tab)

### Configuration Files

- **firebase.json**: Hosting configuration with API rewrite to backend
- **.env.local**: Environment variables (not deployed, used for build)

### API Rewrite Configuration

The `firebase.json` includes a rewrite rule that routes `/api/**` requests to the backend:

```json
{
  "source": "/api/**",
  "run": {
    "serviceId": "licenses-web",
    "region": "europe-west4"
  }
}
```

This allows the frontend to make API calls using relative paths (`/api/products`, `/api/licenses`, etc.) which are automatically routed to the Cloud Run backend.

## Troubleshooting Deployment

### Backend Deployment Issues

**Problem:** `firebase deploy` fails with "Backend not found"  
**Solution:** Run `firebase init apphosting` and link to existing backend `licenses-web`

**Problem:** Container fails to start  
**Solution:** 
- Check build logs in Firebase Console
- Verify `Dockerfile` CMD is correct: `["node", "dist/index.js"]`
- Verify `package.json` start script: `"start": "node dist/index.js"`

**Problem:** Health check fails  
**Solution:**
- Verify server listens on `process.env.PORT || 8080`
- Check `/health` route is registered
- Review Cloud Run logs

### Frontend Deployment Issues

**Problem:** Build fails due to missing environment variables  
**Solution:** 
- Create `.env.local` with all required `VITE_*` variables
- Copy from `.env.example` and fill in values
- Restart build process

**Problem:** API calls fail after deployment  
**Solution:**
- Verify backend is deployed and accessible
- Check `firebase.json` rewrite rule has correct `serviceId` and `region`
- Verify Cloud Run service is public (allUsers has Cloud Run Invoker role)
- Check browser console for CORS errors

**Problem:** Authentication doesn't work  
**Solution:**
- Verify Firebase Auth is enabled in Firebase Console
- Check environment variables are correct
- Verify `services/firebase.ts` uses correct config values

## Post-Deployment Verification

1. **Backend Health Check:**
   ```bash
   curl https://licenses-web-62778731600.europe-west4.run.app/health
   ```
   Should return: `{"status":"ok","timestamp":"..."}`

2. **Frontend Access:**
   - Open: `https://license-513ef.web.app`
   - Should load without errors
   - Login with Google should work

3. **API Integration:**
   - After logging in, dashboard should load data
   - Check browser Network tab for API calls
   - Verify no CORS errors
   - Verify API responses are successful

4. **End-to-End Test:**
   - Create a product
   - Create a plan
   - Issue a license
   - Verify all operations work correctly
