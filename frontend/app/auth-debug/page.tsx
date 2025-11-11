'use client';

import { useEffect, useState } from 'react';
import { CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

export default function AuthDebugPage() {
  const [authInfo, setAuthInfo] = useState<any>({});

  useEffect(() => {
    const checkAuth = () => {
      const info = {
        localStorage: {
          authToken: localStorage.getItem('authToken'),
          firebaseUid: localStorage.getItem('firebaseUid'),
          userId: localStorage.getItem('userId'),
          username: localStorage.getItem('username'),
          userEmail: localStorage.getItem('userEmail'),
          userData: localStorage.getItem('userData'),
        },
        sessionStorage: {
          authToken: sessionStorage.getItem('authToken'),
          firebaseUid: sessionStorage.getItem('firebaseUid'),
          userId: sessionStorage.getItem('userId'),
          username: sessionStorage.getItem('username'),
          userEmail: sessionStorage.getItem('userEmail'),
          userData: sessionStorage.getItem('userData'),
        }
      };
      setAuthInfo(info);
    };

    checkAuth();
  }, []);

  const isAuthenticated = !!(
    authInfo.localStorage?.firebaseUid || 
    authInfo.sessionStorage?.firebaseUid ||
    authInfo.localStorage?.userId ||
    authInfo.sessionStorage?.userId
  );

  return (
    <div className="min-h-screen bg-gray-950 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Authentication Debug</h1>

        {/* Status */}
        <div className={`mb-8 p-6 rounded-lg border-2 ${
          isAuthenticated 
            ? 'bg-green-900/20 border-green-500' 
            : 'bg-red-900/20 border-red-500'
        }`}>
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <>
                <CheckCircle className="w-8 h-8 text-green-400" />
                <div>
                  <h2 className="text-xl font-bold text-green-400">Authenticated</h2>
                  <p className="text-gray-300">User credentials found in storage</p>
                </div>
              </>
            ) : (
              <>
                <XCircle className="w-8 h-8 text-red-400" />
                <div>
                  <h2 className="text-xl font-bold text-red-400">Not Authenticated</h2>
                  <p className="text-gray-300">Please sign in to use the app</p>
                </div>
              </>
            )}
          </div>
        </div>

        {/* localStorage */}
        <div className="mb-6">
          <h2 className="text-xl font-bold mb-4">localStorage</h2>
          <div className="bg-gray-900 rounded-lg p-4 space-y-2">
            {Object.entries(authInfo.localStorage || {}).map(([key, value]) => (
              <div key={key} className="flex items-start gap-2">
                {value ? (
                  <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="w-5 h-5 text-gray-600 flex-shrink-0 mt-0.5" />
                )}
                <div className="flex-1 min-w-0">
                  <span className="font-mono text-sm text-gray-400">{key}:</span>
                  <pre className="mt-1 text-xs text-gray-300 overflow-x-auto">
                    {value ? (
                      typeof value === 'string' && value.length > 100 
                        ? value.substring(0, 100) + '...' 
                        : value
                    ) : (
                      <span className="text-gray-600">null</span>
                    )}
                  </pre>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* sessionStorage */}
        <div className="mb-6">
          <h2 className="text-xl font-bold mb-4">sessionStorage</h2>
          <div className="bg-gray-900 rounded-lg p-4 space-y-2">
            {Object.entries(authInfo.sessionStorage || {}).map(([key, value]) => (
              <div key={key} className="flex items-start gap-2">
                {value ? (
                  <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="w-5 h-5 text-gray-600 flex-shrink-0 mt-0.5" />
                )}
                <div className="flex-1 min-w-0">
                  <span className="font-mono text-sm text-gray-400">{key}:</span>
                  <pre className="mt-1 text-xs text-gray-300 overflow-x-auto">
                    {value ? (
                      typeof value === 'string' && value.length > 100 
                        ? value.substring(0, 100) + '...' 
                        : value
                    ) : (
                      <span className="text-gray-600">null</span>
                    )}
                  </pre>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recommendations */}
        <div className="bg-blue-900/20 border-2 border-blue-500 rounded-lg p-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-6 h-6 text-blue-400 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-blue-400 mb-2">Required for Post Creation:</h3>
              <ul className="space-y-1 text-sm text-gray-300">
                <li>✓ <code className="bg-gray-800 px-2 py-0.5 rounded">firebaseUid</code> or <code className="bg-gray-800 px-2 py-0.5 rounded">userId</code></li>
                <li>✓ <code className="bg-gray-800 px-2 py-0.5 rounded">username</code></li>
              </ul>
              {!isAuthenticated && (
                <p className="mt-4 text-yellow-400">
                  ⚠️ You need to sign in before creating posts. Go to <a href="/signin" className="underline">/signin</a>
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
