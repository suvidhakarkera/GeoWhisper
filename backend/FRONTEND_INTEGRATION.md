# Frontend Integration Guide for GeoWhisper Authentication

This guide explains how to integrate the GeoWhisper authentication APIs with your frontend application using Firebase Authentication.

## Prerequisites

1. Install Firebase in your frontend project:

```bash
npm install firebase
# or
yarn add firebase
```

2. Install Axios for making HTTP requests (optional but recommended):

```bash
npm install axios
# or
yarn add axios
```

## Firebase Configuration

1. Create a Firebase configuration file (e.g., `firebase.config.js`):

```javascript
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-auth-domain.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-storage-bucket.appspot.com",
  messagingSenderId: "your-messaging-sender-id",
  appId: "your-app-id",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
```

## Authentication Service Implementation

Create an authentication service (e.g., `authService.js`):

```javascript
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";
import axios from "axios";
import { auth } from "./firebase.config";

const API_BASE_URL = "your-backend-url/api/auth";

class AuthService {
  // Email/Password Sign Up
  async signUp(email, password, username) {
    try {
      // 1. Create user in Firebase
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const idToken = await userCredential.user.getIdToken();

      // 2. Register user in backend
      const response = await axios.post(
        `${API_BASE_URL}/signup`,
        {
          email,
          password,
          username,
        },
        {
          headers: {
            Authorization: `Bearer ${idToken}`,
          },
        }
      );

      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Email/Password Sign In
  async signIn(email, password) {
    try {
      // 1. Sign in with Firebase
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      const idToken = await userCredential.user.getIdToken();

      // 2. Authenticate with backend
      const response = await axios.post(
        `${API_BASE_URL}/signin`,
        {
          email,
          password,
        },
        {
          headers: {
            Authorization: `Bearer ${idToken}`,
          },
        }
      );

      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Google Sign In
  async signInWithGoogle() {
    try {
      // 1. Sign in with Google via Firebase
      const provider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(auth, provider);
      const idToken = await userCredential.user.getIdToken();

      // 2. Authenticate with backend
      const response = await axios.post(`${API_BASE_URL}/google`, {
        idToken,
      });

      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Handle Firebase and API errors
  handleError(error) {
    if (error.response) {
      // Backend API error
      return error.response.data;
    }
    // Firebase error
    return {
      success: false,
      message: error.message,
    };
  }
}

export const authService = new AuthService();
```

## React Integration Example

Here's how to use the authentication service in a React component:

```jsx
import React, { useState } from "react";
import { authService } from "./services/authService";

function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSignIn = async (e) => {
    e.preventDefault();
    try {
      const response = await authService.signIn(email, password);
      // Store user data in your app's state management (Redux, Context, etc.)
      console.log("Signed in successfully:", response);
    } catch (error) {
      setError(error.message);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      const response = await authService.signInWithGoogle();
      console.log("Signed in with Google:", response);
    } catch (error) {
      setError(error.message);
    }
  };

  return (
    <div>
      <form onSubmit={handleSignIn}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button type="submit">Sign In</button>
      </form>
      <button onClick={handleGoogleSignIn}>Sign in with Google</button>
      {error && <p style={{ color: "red" }}>{error}</p>}
    </div>
  );
}

export default LoginForm;
```

## Protected Routes Implementation

Create a higher-order component to protect routes that require authentication:

```javascript
import { Navigate } from "react-router-dom";
import { auth } from "./firebase.config";

export function ProtectedRoute({ children }) {
  const user = auth.currentUser;

  if (!user) {
    // Redirect to login if user is not authenticated
    return <Navigate to="/login" />;
  }

  return children;
}
```

Usage in your router:

```javascript
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ProtectedRoute } from "./components/ProtectedRoute";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginForm />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
```

## Making Authenticated Requests

Create an axios instance with an interceptor to automatically add the Firebase ID token:

```javascript
import axios from "axios";
import { auth } from "./firebase.config";

const api = axios.create({
  baseURL: "your-backend-url/api",
});

// Add auth token to requests
api.interceptors.request.use(async (config) => {
  if (auth.currentUser) {
    const token = await auth.currentUser.getIdToken();
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
```

## Error Handling and Token Refresh

Firebase automatically handles token refresh, but you might want to handle expired tokens in your API calls:

```javascript
// Add response interceptor to handle token expiration
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      // Force token refresh
      await auth.currentUser?.getIdToken(true);

      // Retry the original request
      return api(originalRequest);
    }

    return Promise.reject(error);
  }
);
```

## Security Best Practices

1. Store tokens securely (Firebase handles this automatically)
2. Implement proper error handling and validation
3. Use HTTPS for all API calls
4. Implement rate limiting on both frontend and backend
5. Clear sensitive data on logout
6. Implement proper CORS configuration on the backend

Remember to replace `'your-backend-url'` with your actual backend URL and update the Firebase configuration with your project's details.
