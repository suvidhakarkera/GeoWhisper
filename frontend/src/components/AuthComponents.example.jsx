// Example React Authentication Components for GeoWhisper
// This file demonstrates how to integrate the backend authentication API

import { useState } from 'react';
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider 
} from 'firebase/auth';

const API_BASE_URL = 'http://localhost:8080/api/auth';

// ============================================
// 1. SIGN UP COMPONENT
// ============================================
export function SignUpForm() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    username: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSignUp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Create user with Firebase Client SDK
      const auth = getAuth();
      const userCredential = await createUserWithEmailAndPassword(
        auth, 
        formData.email, 
        formData.password
      );

      // Send to backend to create profile
      const response = await fetch(`${API_BASE_URL}/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Sign up failed');
      }

      // Store auth data
      const idToken = await userCredential.user.getIdToken();
      localStorage.setItem('authToken', idToken);
      localStorage.setItem('firebaseUid', data.firebaseUid);
      localStorage.setItem('userData', JSON.stringify(data.userData));

      setSuccess('Sign up successful! Welcome to GeoWhisper!');
      console.log('User created:', data);

      // Redirect to dashboard or home
      // window.location.href = '/dashboard';

    } catch (err) {
      setError(err.message || 'Sign up failed');
      console.error('Sign up error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="signup-form">
      <h2>Sign Up</h2>
      <form onSubmit={handleSignUp}>
        <input
          type="text"
          placeholder="Username"
          value={formData.username}
          onChange={(e) => setFormData({ ...formData, username: e.target.value })}
          required
          minLength={3}
        />
        <input
          type="email"
          placeholder="Email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          required
        />
        <input
          type="password"
          placeholder="Password (min 6 characters)"
          value={formData.password}
          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          required
          minLength={6}
        />
        <button type="submit" disabled={loading}>
          {loading ? 'Signing up...' : 'Sign Up'}
        </button>
      </form>
      {error && <p className="error">{error}</p>}
      {success && <p className="success">{success}</p>}
    </div>
  );
}

// ============================================
// 2. SIGN IN COMPONENT
// ============================================
export function SignInForm() {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSignIn = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Sign in with Firebase Client SDK
      const auth = getAuth();
      const userCredential = await signInWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );

      // Get user data from backend
      const response = await fetch(`${API_BASE_URL}/signin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Sign in failed');
      }

      // Store auth data
      const idToken = await userCredential.user.getIdToken();
      localStorage.setItem('authToken', idToken);
      localStorage.setItem('firebaseUid', data.firebaseUid);
      localStorage.setItem('userData', JSON.stringify(data.userData));

      console.log('User signed in:', data);

      // Redirect to dashboard
      // window.location.href = '/dashboard';

    } catch (err) {
      setError(err.message || 'Sign in failed');
      console.error('Sign in error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="signin-form">
      <h2>Sign In</h2>
      <form onSubmit={handleSignIn}>
        <input
          type="email"
          placeholder="Email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={formData.password}
          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          required
        />
        <button type="submit" disabled={loading}>
          {loading ? 'Signing in...' : 'Sign In'}
        </button>
      </form>
      {error && <p className="error">{error}</p>}
    </div>
  );
}

// ============================================
// 3. GOOGLE SIGN-IN COMPONENT
// ============================================
export function GoogleSignInButton() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError('');

    try {
      const auth = getAuth();
      const provider = new GoogleAuthProvider();

      // Sign in with Google popup
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Get ID token
      const idToken = await user.getIdToken();

      // Send to backend
      const response = await fetch(`${API_BASE_URL}/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          idToken: idToken,
          username: user.displayName?.replace(/\s+/g, '_').toLowerCase()
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Google sign in failed');
      }

      // Store auth data
      localStorage.setItem('authToken', idToken);
      localStorage.setItem('firebaseUid', data.firebaseUid);
      localStorage.setItem('userData', JSON.stringify(data.userData));

      console.log('Google sign in successful:', data);

      // Redirect to dashboard
      // window.location.href = '/dashboard';

    } catch (err) {
      setError(err.message || 'Google sign in failed');
      console.error('Google sign in error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="google-signin">
      <button onClick={handleGoogleSignIn} disabled={loading}>
        {loading ? 'Signing in...' : '🔐 Sign in with Google'}
      </button>
      {error && <p className="error">{error}</p>}
    </div>
  );
}

// ============================================
// 4. AUTH CONTEXT (React Context API)
// ============================================
import { createContext, useContext, useEffect } from 'react';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const auth = getAuth();
    
    // Listen for auth state changes
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        try {
          // Get user data from backend
          const firebaseUid = user.uid;
          const response = await fetch(`${API_BASE_URL}/profile/${firebaseUid}`);
          const data = await response.json();
          
          if (data.success) {
            setCurrentUser({
              ...user,
              profile: data.data
            });
          }
        } catch (error) {
          console.error('Error fetching user profile:', error);
        }
      } else {
        setCurrentUser(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

// ============================================
// 5. PROTECTED ROUTE COMPONENT
// ============================================
export function ProtectedRoute({ children }) {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!currentUser) {
    // Redirect to login
    window.location.href = '/login';
    return null;
  }

  return children;
}

// ============================================
// 6. USER PROFILE COMPONENT
// ============================================
export function UserProfile() {
  const { currentUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [editing, setEditing] = useState(false);
  const [newUsername, setNewUsername] = useState('');

  useEffect(() => {
    if (currentUser?.profile) {
      setProfile(currentUser.profile);
      setNewUsername(currentUser.profile.username);
    }
  }, [currentUser]);

  const handleUpdateProfile = async () => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/profile/${currentUser.uid}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: newUsername })
        }
      );

      const data = await response.json();

      if (data.success) {
        setProfile(data.data);
        setEditing(false);
        alert('Profile updated successfully!');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to update profile');
    }
  };

  if (!profile) return <div>Loading profile...</div>;

  return (
    <div className="user-profile">
      <h2>User Profile</h2>
      {!editing ? (
        <>
          <p><strong>Username:</strong> {profile.username}</p>
          <p><strong>Email:</strong> {profile.email}</p>
          <p><strong>Total Posts:</strong> {profile.totalPosts}</p>
          <p><strong>Total Reactions:</strong> {profile.totalReactions}</p>
          <p><strong>Zones Visited:</strong> {profile.zonesVisited}</p>
          <button onClick={() => setEditing(true)}>Edit Profile</button>
        </>
      ) : (
        <>
          <input
            type="text"
            value={newUsername}
            onChange={(e) => setNewUsername(e.target.value)}
          />
          <button onClick={handleUpdateProfile}>Save</button>
          <button onClick={() => setEditing(false)}>Cancel</button>
        </>
      )}
    </div>
  );
}

// ============================================
// 7. SIGN OUT FUNCTION
// ============================================
export async function signOut() {
  try {
    const auth = getAuth();
    await auth.signOut();
    
    // Clear local storage
    localStorage.removeItem('authToken');
    localStorage.removeItem('firebaseUid');
    localStorage.removeItem('userData');
    
    // Redirect to login
    window.location.href = '/login';
  } catch (error) {
    console.error('Error signing out:', error);
  }
}

// ============================================
// 8. USAGE EXAMPLE IN APP
// ============================================
export function App() {
  return (
    <AuthProvider>
      <div className="app">
        <Routes>
          <Route path="/signup" element={<SignUpForm />} />
          <Route path="/signin" element={<SignInForm />} />
          <Route path="/google-signin" element={<GoogleSignInButton />} />
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/profile" 
            element={
              <ProtectedRoute>
                <UserProfile />
              </ProtectedRoute>
            } 
          />
        </Routes>
      </div>
    </AuthProvider>
  );
}

// ============================================
// 9. UTILITY FUNCTIONS
// ============================================

// Check if user is authenticated
export function isAuthenticated() {
  return !!localStorage.getItem('authToken');
}

// Get current user data
export function getCurrentUser() {
  const userData = localStorage.getItem('userData');
  return userData ? JSON.parse(userData) : null;
}

// Make authenticated API request
export async function authenticatedFetch(endpoint, options = {}) {
  const token = localStorage.getItem('authToken');
  
  if (!token) {
    throw new Error('Not authenticated');
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });

  return response.json();
}
