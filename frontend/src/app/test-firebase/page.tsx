/**
 * Firebase Configuration Test Page
 * 
 * Use this page to verify your Firebase setup is working correctly.
 * Visit: http://localhost:3000/test-firebase
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { auth, googleProvider, isFirebaseConfigured } from '@/config/firebase';
import GoogleSignInButton from '@/components/GoogleSignInButton';
import { User } from 'firebase/auth';

export default function TestFirebasePage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [configStatus, setConfigStatus] = useState<{
    isConfigured: boolean;
    apiKey: string;
    authDomain: string;
    projectId: string;
    appId: string;
  } | null>(null);

  const [signInResult, setSignInResult] = useState<{
    success: boolean;
    user?: any;
    error?: string;
  } | null>(null);

  useEffect(() => {
    // Check authentication first
    const authToken = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
    
    if (!authToken) {
      router.push('/signup');
      return;
    }

    setIsAuthenticated(true);

    // Check configuration on mount
    const configured = isFirebaseConfigured();
    
    setConfigStatus({
      isConfigured: configured,
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'NOT SET',
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'NOT SET',
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'NOT SET',
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || 'NOT SET',
    });
  }, [router]);

  const handleSuccess = async (user: any, idToken: string) => {
    console.log('✅ Sign-in successful!');
    console.log('User:', user);
    console.log('ID Token:', idToken.substring(0, 20) + '...');
    
    setSignInResult({
      success: true,
      user: {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
      },
    });
  };

  const handleError = (error: Error) => {
    console.error('❌ Sign-in failed:', error);
    
    setSignInResult({
      success: false,
      error: error.message,
    });
  };

  // Show loading while checking auth
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            🔥 Firebase Configuration Test
          </h1>
          <p className="text-gray-600">
            Verify your Firebase and Google Sign-In setup
          </p>
        </div>

        {/* Configuration Status */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <span>📋</span>
            Configuration Status
          </h2>
          
          {configStatus && (
            <div className="space-y-3">
              {/* Overall Status */}
              <div className="flex items-center gap-3 p-3 rounded-lg border-2 {configStatus.isConfigured ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}">
                <span className="text-2xl">
                  {configStatus.isConfigured ? '✅' : '❌'}
                </span>
                <div>
                  <p className="font-semibold {configStatus.isConfigured ? 'text-green-700' : 'text-red-700'}">
                    {configStatus.isConfigured 
                      ? 'Firebase is properly configured!' 
                      : 'Firebase is NOT configured!'}
                  </p>
                  {!configStatus.isConfigured && (
                    <p className="text-sm text-red-600 mt-1">
                      Please update .env.local with real Firebase values
                    </p>
                  )}
                </div>
              </div>

              {/* Individual Values */}
              <div className="grid gap-2">
                <ConfigItem 
                  label="API Key" 
                  value={configStatus.apiKey}
                  isValid={configStatus.apiKey.startsWith('AIza')}
                />
                <ConfigItem 
                  label="Auth Domain" 
                  value={configStatus.authDomain}
                  isValid={configStatus.authDomain.includes('firebaseapp.com')}
                />
                <ConfigItem 
                  label="Project ID" 
                  value={configStatus.projectId}
                  isValid={configStatus.projectId === 'geowhisper-1'}
                />
                <ConfigItem 
                  label="App ID" 
                  value={configStatus.appId}
                  isValid={configStatus.appId.includes(':web:')}
                />
              </div>
            </div>
          )}
        </div>

        {/* Google Sign-In Test */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <span>🧪</span>
            Test Google Sign-In
          </h2>
          
          <div className="max-w-md mx-auto">
            <GoogleSignInButton
              onSuccess={handleSuccess}
              onError={handleError}
              text="Test Sign in with Google"
            />
          </div>

          {/* Sign-In Result */}
          {signInResult && (
            <div className="mt-6 p-4 rounded-lg border-2 {signInResult.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}">
              {signInResult.success ? (
                <div>
                  <p className="font-semibold text-green-700 mb-3 flex items-center gap-2">
                    <span>✅</span>
                    Sign-In Successful!
                  </p>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="font-medium">UID:</span> {signInResult.user?.uid}
                    </div>
                    <div>
                      <span className="font-medium">Email:</span> {signInResult.user?.email}
                    </div>
                    <div>
                      <span className="font-medium">Name:</span> {signInResult.user?.displayName}
                    </div>
                    {signInResult.user?.photoURL && (
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Photo:</span>
                        <img 
                          src={signInResult.user.photoURL} 
                          alt="Profile" 
                          className="w-10 h-10 rounded-full"
                        />
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div>
                  <p className="font-semibold text-red-700 mb-2 flex items-center gap-2">
                    <span>❌</span>
                    Sign-In Failed
                  </p>
                  <p className="text-sm text-red-600">
                    {signInResult.error}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4 text-blue-900 flex items-center gap-2">
            <span>📚</span>
            Setup Instructions
          </h2>
          
          <ol className="space-y-3 text-sm text-blue-800">
            <li className="flex gap-3">
              <span className="font-bold">1.</span>
              <div>
                <span className="font-medium">Get Firebase Config:</span> Go to{' '}
                <a 
                  href="https://console.firebase.google.com/project/geowhisper-1/settings/general"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:text-blue-600"
                >
                  Firebase Console
                </a>
                {' '}→ Project Settings → Your apps → Web app
              </div>
            </li>
            <li className="flex gap-3">
              <span className="font-bold">2.</span>
              <div>
                <span className="font-medium">Update .env.local:</span> Replace placeholder values with real Firebase config
              </div>
            </li>
            <li className="flex gap-3">
              <span className="font-bold">3.</span>
              <div>
                <span className="font-medium">Enable Google Sign-In:</span> Go to Authentication → Sign-in method → Enable Google
              </div>
            </li>
            <li className="flex gap-3">
              <span className="font-bold">4.</span>
              <div>
                <span className="font-medium">Restart Server:</span> Stop (Ctrl+C) and run <code className="bg-blue-100 px-2 py-1 rounded">npm run dev</code>
              </div>
            </li>
            <li className="flex gap-3">
              <span className="font-bold">5.</span>
              <div>
                <span className="font-medium">Test:</span> Click "Test Sign in with Google" button above
              </div>
            </li>
          </ol>

          <div className="mt-4 pt-4 border-t border-blue-300">
            <p className="text-sm font-medium text-blue-900 mb-2">
              📖 Detailed Guide:
            </p>
            <p className="text-sm text-blue-700">
              See <code className="bg-blue-100 px-2 py-1 rounded">COMPLETE_FIREBASE_SETUP.md</code> for step-by-step instructions with screenshots.
            </p>
          </div>
        </div>

        {/* Console Output */}
        <div className="mt-6 bg-gray-900 text-green-400 rounded-lg p-4 font-mono text-sm">
          <p className="mb-2 text-gray-400">💻 Check Browser Console (F12) for detailed logs:</p>
          <p>- Firebase initialization status</p>
          <p>- Configuration validation</p>
          <p>- Sign-in flow progress</p>
          <p>- Error details (if any)</p>
        </div>
      </div>
    </div>
  );
}

// Helper component for config items
function ConfigItem({ label, value, isValid }: { label: string; value: string; isValid: boolean }) {
  const isPlaceholder = value.includes('your-') || value.includes('-here') || value === 'NOT SET';
  
  return (
    <div className="flex items-start gap-3 p-3 bg-gray-50 rounded border border-gray-200">
      <span className="text-lg">
        {isValid && !isPlaceholder ? '✅' : '❌'}
      </span>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-gray-700 text-sm">{label}</p>
        <p className="text-xs text-gray-600 truncate mt-1" title={value}>
          {value}
        </p>
        {isPlaceholder && (
          <p className="text-xs text-red-600 mt-1">
            ⚠️ Still using placeholder value
          </p>
        )}
      </div>
    </div>
  );
}
