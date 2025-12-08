import React from 'react';
import { AlertCircle, Database, RefreshCw } from 'lucide-react';

interface DatabaseErrorProps {
  error: string;
  onRetry?: () => void;
}

export const DatabaseError: React.FC<DatabaseErrorProps> = ({ error, onRetry }) => {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white rounded-xl shadow-lg border border-red-200 p-8">
        <div className="flex items-start space-x-4">
          <div className="flex-shrink-0">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
              <Database className="w-6 h-6 text-red-600" />
            </div>
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900 mb-2 flex items-center gap-2">
              <AlertCircle className="w-6 h-6 text-red-600" />
              Database Connection Error
            </h1>
            <p className="text-gray-700 mb-4">
              The application cannot start because it cannot connect to the Firestore database.
            </p>
            
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-sm font-medium text-red-800 mb-2">Error Details:</p>
              <p className="text-sm text-red-700 font-mono">{error}</p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p className="text-sm font-medium text-blue-800 mb-2">To fix this issue:</p>
              <ol className="text-sm text-blue-700 list-decimal list-inside space-y-1">
                <li><strong>Configure Firestore Security Rules</strong> - This is the most common issue! Go to Firebase Console → Firestore Database → Rules and set rules that allow reads/writes. See <code className="bg-blue-100 px-1 rounded">FIRESTORE_RULES.md</code> for examples.</li>
                <li>Ensure you have created a Firestore database in your Firebase project (it's created automatically, but verify it exists)</li>
                <li>Check that your <code className="bg-blue-100 px-1 rounded">.env.local</code> file contains all required Firebase configuration variables:
                  <ul className="list-disc list-inside ml-4 mt-1 space-y-1">
                    <li><code className="bg-blue-100 px-1 rounded">VITE_FIREBASE_API_KEY</code></li>
                    <li><code className="bg-blue-100 px-1 rounded">VITE_FIREBASE_AUTH_DOMAIN</code></li>
                    <li><code className="bg-blue-100 px-1 rounded">VITE_FIREBASE_PROJECT_ID</code></li>
                    <li><code className="bg-blue-100 px-1 rounded">VITE_FIREBASE_STORAGE_BUCKET</code></li>
                    <li><code className="bg-blue-100 px-1 rounded">VITE_FIREBASE_MESSAGING_SENDER_ID</code></li>
                    <li><code className="bg-blue-100 px-1 rounded">VITE_FIREBASE_APP_ID</code></li>
                  </ul>
                </li>
                <li>Verify your Firebase project has Firestore enabled in the Firebase Console</li>
                <li>Ensure you're signed in (authentication is required for most security rules)</li>
                <li>Check your network connection and Firebase project permissions</li>
              </ol>
            </div>

            {onRetry && (
              <button
                onClick={onRetry}
                className="inline-flex items-center px-4 py-2 bg-primary text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Retry Connection
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

