# License UI

Frontend application for the License Management System.

## Setup

### Prerequisites

- Node.js 20+ and npm
- Firebase project access

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd license-ui
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env.local
   ```
   
   Then edit `.env.local` and fill in your Firebase configuration values:
   - `VITE_FIREBASE_API_KEY`: Get from Firebase Console → Project Settings → General
   - `VITE_FIREBASE_AUTH_DOMAIN`: `your-project-id.firebaseapp.com`
   - `VITE_FIREBASE_PROJECT_ID`: Your Firebase project ID
   - `VITE_FIREBASE_STORAGE_BUCKET`: `your-project-id.firebasestorage.app`
   - `VITE_FIREBASE_MESSAGING_SENDER_ID`: Get from Firebase Console
   - `VITE_FIREBASE_APP_ID`: Get from Firebase Console
   - `VITE_FIREBASE_MEASUREMENT_ID`: Optional, for Analytics

   **Note:** `.env.local` is git-ignored and contains sensitive information. Do not commit it.

### Development

Start the development server:
```bash
npm run dev
```

The app will be available at `http://localhost:3000` (or the configured port).

### Building

Build for production:
```bash
npm run build
```

Output will be in the `dist/` directory.

### Deployment

Deploy to Firebase Hosting:
```bash
npm run build
firebase deploy
```

**Note:** The frontend is configured to proxy API requests to `/api/**` which routes to the backend service (`licenses-web`) via Firebase Hosting rewrites.

## Environment Variables

Required environment variables (set in `.env.local`):

- `VITE_FIREBASE_API_KEY` - Firebase API key
- `VITE_FIREBASE_AUTH_DOMAIN` - Firebase auth domain
- `VITE_FIREBASE_PROJECT_ID` - Firebase project ID
- `VITE_FIREBASE_STORAGE_BUCKET` - Firebase storage bucket
- `VITE_FIREBASE_MESSAGING_SENDER_ID` - Firebase messaging sender ID
- `VITE_FIREBASE_APP_ID` - Firebase app ID

Optional:
- `VITE_API_URL` - Custom API URL (defaults to relative path `/api/**` in production)
- `VITE_FIREBASE_MEASUREMENT_ID` - Google Analytics measurement ID

## Type Synchronization

This repository shares type definitions with `license-api`. See `TYPES_SYNC.md` for synchronization instructions.

## Project Structure

```
license-ui/
├── components/      # React components
├── contexts/       # React contexts (Auth, etc.)
├── pages/          # Page components
├── services/       # API and Firebase services
├── public/         # Static assets
├── dist/           # Build output (generated)
└── types.ts        # TypeScript type definitions (sync with license-api)
```

