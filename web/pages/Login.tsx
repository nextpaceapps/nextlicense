import React, { useEffect, useState } from 'react';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth } from '../services/firebase';
import { Key, ShieldCheck, AlertTriangle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export const Login: React.FC = () => {
  const [error, setError] = useState<string | null>(null);
  const { loginDev } = useAuth();

  const handleGoogleSignIn = async () => {
    if (!auth) {
        setError("Firebase is not properly configured.");
        return;
    }
    
    // Debug: Log current origin and auth domain
    const currentOrigin = window.location.origin;
    const currentHostname = window.location.hostname;
    console.log("Current origin:", currentOrigin);
    console.log("Current hostname:", currentHostname);
    console.log("Auth domain:", auth.app.options.authDomain);
    
    // Check if accessing via 127.0.0.1 instead of localhost
    if (currentHostname === '127.0.0.1') {
        setError("Please access the app via 'localhost:3000' instead of '127.0.0.1:3000'. Firebase treats these as different domains.");
        return;
    }
    
    const provider = new GoogleAuthProvider();
    try {
        await signInWithPopup(auth, provider);
    } catch (e: any) {
        console.error("Firebase Sign In Failed", e);
        console.error("Error code:", e.code);
        console.error("Error message:", e.message);
        
        // Provide more helpful error messages
        if (e.code === 'auth/unauthorized-domain') {
            setError(
                `Domain authorization error. ` +
                `Current origin: ${currentOrigin}. ` +
                `Please ensure 'localhost' (without http:// or port) is added to ` +
                `Firebase Console → Authentication → Settings → Authorized domains. ` +
                `Also verify you're accessing via 'localhost' not '127.0.0.1'.`
            );
        } else if (e.message?.includes('redirect_uri_mismatch') || e.code === 'auth/redirect-uri-mismatch') {
            const authDomain = auth?.app.options.authDomain || 'your-project.firebaseapp.com';
            const webAppDomain = authDomain.replace('.firebaseapp.com', '.web.app');
            setError(
                `OAuth redirect URI mismatch. In Google Cloud Console → APIs & Services → Credentials → Your OAuth Client, configure TWO separate fields: ` +
                `1) Authorized JavaScript origins (add: https://${authDomain}, https://${webAppDomain}, http://localhost:3000 - NO paths). ` +
                `2) Authorized redirect URIs (add: https://${authDomain}/__/auth/handler, https://${webAppDomain}/__/auth/handler, http://localhost:3000/__/auth/handler - WITH paths).`
            );
        } else {
            setError("Sign in failed: " + e.message);
        }
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col justify-center items-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="bg-primary/5 p-8 text-center border-b border-gray-100">
          <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-primary/30">
            <Key className="text-white w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Licensing Manager</h1>
          <p className="text-gray-500 mt-2 text-sm">Enterprise License & Product Management</p>
        </div>

        <div className="p-8 space-y-6">
          <div className="space-y-4">
            {error && (
                <div className="bg-red-50 text-red-600 p-3 rounded text-sm flex items-start">
                    <AlertTriangle className="w-4 h-4 mr-2 mt-0.5 shrink-0"/>
                    {error}
                </div>
            )}
            
            <div className="text-center text-sm text-gray-600 mb-2">Sign in to access dashboard</div>
            <button 
                onClick={handleGoogleSignIn}
                className="w-full flex items-center justify-center py-2 px-4 border border-gray-300 rounded-lg shadow-sm bg-white text-sm font-medium text-gray-800 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
                <img src="/google-logo.svg" alt="Google" className="w-5 h-5 mr-3" />
                Sign in with Google
            </button>

            <button 
                onClick={loginDev}
                className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                <ShieldCheck className="w-4 h-4 mr-2" />
                Dev Login
            </button>
          </div>
        </div>
        
        <div className="bg-gray-50 px-8 py-4 text-center text-xs text-gray-500 border-t border-gray-100">
           Protected by Google Cloud IAM & Firestore Rules
        </div>
      </div>
    </div>
  );
};
