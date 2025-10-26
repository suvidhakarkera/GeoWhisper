# 🚀 GeoWhisper Authentication - Complete Setup Guide

This guide will walk you through setting up and using the authentication system.

---

## 📋 Table of Contents
1. [Prerequisites](#prerequisites)
2. [Backend Setup](#backend-setup)
3. [Frontend Setup](#frontend-setup)
4. [Testing the API](#testing-the-api)
5. [Integration Guide](#integration-guide)
6. [Troubleshooting](#troubleshooting)

---

## ✅ Prerequisites

### Required Software
- ✅ Java 21 or higher
- ✅ Maven 3.6+
- ✅ Node.js 18+ (for frontend)
- ✅ Firebase account
- ✅ Git

### Firebase Setup Required
1. Create Firebase project at https://console.firebase.google.com/
2. Enable Authentication methods:
   - Email/Password
   - Google Sign-In
3. Download service account key (JSON file)
4. Note your Firebase project credentials

---

## 🔧 Backend Setup

### Step 1: Firebase Configuration

1. **Download Firebase Admin SDK Key**
   ```
   Firebase Console → Project Settings → Service Accounts
   → Generate New Private Key
   ```

2. **Place the JSON file**
   ```
   backend/src/main/resources/firebase-key.json
   ```

3. **Verify the file exists**
   ```powershell
   Test-Path "backend\src\main\resources\firebase-key.json"
   ```

### Step 2: Application Properties

Your `application.properties` should already be configured. Verify it contains:

```properties
# Server Configuration
server.port=8080

# Firebase Configuration (loaded automatically)
# Make sure firebase-key.json is in src/main/resources/

# CORS is configured in CorsConfig.java
```

### Step 3: Build and Run

```powershell
# Navigate to backend directory
cd backend

# Clean and install dependencies
mvn clean install

# Run the application
mvn spring-boot:run
```

### Step 4: Verify Backend is Running

Open browser and check:
- Health check: http://localhost:8080/api/auth/health
- Swagger UI: http://localhost:8080/swagger-ui.html

You should see:
- ✅ "GeoWhisper Auth Service is running!" for health check
- ✅ Interactive API documentation in Swagger

---

## 🎨 Frontend Setup

### Step 1: Install Firebase SDK

```bash
cd frontend
npm install firebase
```

### Step 2: Create Firebase Config

Create `frontend/src/config/firebase.js`:

```javascript
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication
export const auth = getAuth(app);
export default app;
```

### Step 3: Get Firebase Config Values

1. Go to Firebase Console
2. Project Settings → General
3. Scroll to "Your apps" section
4. Click on Web app (</>) icon
5. Copy the configuration values

### Step 4: Install Additional Dependencies

```bash
npm install react-router-dom
```

### Step 5: Copy Authentication Components

The example components are in:
```
frontend/src/components/AuthComponents.example.jsx
```

You can use these as reference for your implementation.

---

## 🧪 Testing the API

### Method 1: Swagger UI (Recommended)

1. Open http://localhost:8080/swagger-ui.html
2. Navigate to "Authentication" section
3. Test endpoints interactively

**Example: Testing Sign Up**
- Click on `/api/auth/signup` → Try it out
- Fill in the request body:
  ```json
  {
    "email": "test@example.com",
    "password": "test123",
    "username": "testuser"
  }
  ```
- Click Execute
- Check the response

### Method 2: PowerShell

```powershell
# Test Sign Up
$signupBody = @{
    email = "test@example.com"
    password = "test123456"
    username = "testuser"
} | ConvertTo-Json

$signupResponse = Invoke-RestMethod `
    -Uri "http://localhost:8080/api/auth/signup" `
    -Method Post `
    -ContentType "application/json" `
    -Body $signupBody

Write-Host "Sign Up Response:"
$signupResponse | ConvertTo-Json -Depth 10

# Save Firebase UID for next requests
$firebaseUid = $signupResponse.firebaseUid

# Test Get Profile
$profileResponse = Invoke-RestMethod `
    -Uri "http://localhost:8080/api/auth/profile/$firebaseUid" `
    -Method Get

Write-Host "Profile Response:"
$profileResponse | ConvertTo-Json -Depth 10
```

### Method 3: cURL (Git Bash or WSL)

```bash
# Test Sign Up
curl -X POST http://localhost:8080/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "test123",
    "username": "testuser"
  }'

# Test Sign In
curl -X POST http://localhost:8080/api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "test123"
  }'
```

### Method 4: Postman

Import the collection from `AUTH_API_TESTING.md` or manually create requests.

---

## 🔗 Integration Guide

### React Integration (Recommended Flow)

#### 1. Create Auth Service File

`frontend/src/services/authService.js`:

```javascript
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';

const API_URL = 'http://localhost:8080/api/auth';

export const authService = {
  // Sign up with email and password
  async signUp(email, password, username) {
    const auth = getAuth();
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    
    const response = await fetch(`${API_URL}/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, username })
    });
    
    const data = await response.json();
    const idToken = await userCredential.user.getIdToken();
    
    // Store auth data
    localStorage.setItem('authToken', idToken);
    localStorage.setItem('firebaseUid', data.firebaseUid);
    
    return data;
  },

  // Sign in with email and password
  async signIn(email, password) {
    const auth = getAuth();
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    
    const response = await fetch(`${API_URL}/signin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    
    const data = await response.json();
    const idToken = await userCredential.user.getIdToken();
    
    localStorage.setItem('authToken', idToken);
    localStorage.setItem('firebaseUid', data.firebaseUid);
    
    return data;
  },

  // Sign out
  async signOut() {
    const auth = getAuth();
    await auth.signOut();
    localStorage.clear();
  },

  // Get current user
  getCurrentUser() {
    return localStorage.getItem('firebaseUid');
  },

  // Check if authenticated
  isAuthenticated() {
    return !!localStorage.getItem('authToken');
  }
};
```

#### 2. Create Sign Up Page

`frontend/src/pages/SignUp.jsx`:

```javascript
import { useState } from 'react';
import { authService } from '../services/authService';
import { useNavigate } from 'react-router-dom';

export function SignUpPage() {
  const [formData, setFormData] = useState({ email: '', password: '', username: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await authService.signUp(formData.email, formData.password, formData.username);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="signup-page">
      <h1>Sign Up</h1>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Username"
          value={formData.username}
          onChange={(e) => setFormData({ ...formData, username: e.target.value })}
          required
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
          placeholder="Password"
          value={formData.password}
          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          required
          minLength={6}
        />
        <button type="submit" disabled={loading}>
          {loading ? 'Loading...' : 'Sign Up'}
        </button>
      </form>
      {error && <p className="error">{error}</p>}
    </div>
  );
}
```

#### 3. Create Protected Route

`frontend/src/components/ProtectedRoute.jsx`:

```javascript
import { Navigate } from 'react-router-dom';
import { authService } from '../services/authService';

export function ProtectedRoute({ children }) {
  if (!authService.isAuthenticated()) {
    return <Navigate to="/signin" />;
  }
  return children;
}
```

#### 4. Setup Routes

`frontend/src/App.jsx`:

```javascript
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { SignUpPage } from './pages/SignUp';
import { SignInPage } from './pages/SignIn';
import { Dashboard } from './pages/Dashboard';
import { ProtectedRoute } from './components/ProtectedRoute';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/signup" element={<SignUpPage />} />
        <Route path="/signin" element={<SignInPage />} />
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

export default App;
```

---

## 🐛 Troubleshooting

### Backend Issues

#### Issue: Firebase initialization failed
**Solution:**
```powershell
# Check if firebase-key.json exists
Test-Path "backend\src\main\resources\firebase-key.json"

# If not, download from Firebase Console:
# Project Settings → Service Accounts → Generate New Private Key
```

#### Issue: Port 8080 already in use
**Solution:**
```powershell
# Find process using port 8080
netstat -ano | findstr :8080

# Kill the process (replace PID)
taskkill /PID <PID> /F
```

#### Issue: Maven build fails
**Solution:**
```powershell
# Clean Maven cache
mvn clean

# Rebuild
mvn clean install -DskipTests
```

### Frontend Issues

#### Issue: Firebase not configured
**Solution:**
- Check `firebase.js` has correct API keys
- Verify Firebase project is active
- Check browser console for errors

#### Issue: CORS errors
**Solution:**
- Backend CORS is already configured for `localhost:3000` and `localhost:5173`
- If using different port, update `CorsConfig.java`

#### Issue: Token expired
**Solution:**
- Firebase tokens expire after 1 hour
- Implement token refresh in frontend
- Or prompt user to sign in again

---

## 📚 Additional Resources

### Documentation Files
- `AUTH_API_DOCUMENTATION.md` - Complete API reference
- `AUTH_IMPLEMENTATION_SUMMARY.md` - Implementation details
- `AUTH_API_TESTING.md` - Testing guide with examples

### Swagger Documentation
- http://localhost:8080/swagger-ui.html

### Firebase Documentation
- https://firebase.google.com/docs/auth
- https://firebase.google.com/docs/admin/setup

### Spring Boot Security
- https://spring.io/guides/gs/securing-web/

---

## ✅ Verification Checklist

### Backend
- [ ] Firebase key file is in place
- [ ] Application starts without errors
- [ ] Health check returns 200 OK
- [ ] Swagger UI is accessible
- [ ] Can create user via Swagger

### Frontend
- [ ] Firebase config is set up
- [ ] Dependencies installed
- [ ] Can navigate to sign-up page
- [ ] Form validation works
- [ ] Can create account
- [ ] Token is stored

### Integration
- [ ] Sign up creates user in Firebase
- [ ] Profile is created in Firestore
- [ ] Sign in retrieves user data
- [ ] Google sign-in works
- [ ] Protected routes work
- [ ] Sign out clears data

---

## 🎯 Quick Start Commands

### Backend
```powershell
cd backend
mvn spring-boot:run
```

### Frontend
```powershell
cd frontend
npm install
npm run dev
```

### Test API
```powershell
# Open Swagger UI
start http://localhost:8080/swagger-ui.html
```

---

## 🚀 Next Steps

1. ✅ **Setup Complete** - Follow this guide
2. 🧪 **Test API** - Use Swagger or PowerShell
3. 🎨 **Integrate Frontend** - Use example components
4. 🔒 **Add Security** - Implement email verification
5. 📱 **Deploy** - Move to production

---

## 💡 Pro Tips

1. **Use Swagger UI** for quick API testing
2. **Store tokens securely** - Consider using httpOnly cookies
3. **Implement token refresh** for better UX
4. **Add loading states** in frontend for better feedback
5. **Handle errors gracefully** with user-friendly messages
6. **Test on multiple browsers** before deployment

---

## 📞 Support

If you encounter issues:
1. Check troubleshooting section above
2. Review error messages in console
3. Check Firebase Console for auth errors
4. Verify all configuration files are correct
5. Check that all dependencies are installed

---

## 🎉 Success!

Once everything is set up:
- ✅ Backend running on port 8080
- ✅ Frontend running on port 3000 or 5173
- ✅ Can sign up new users
- ✅ Can sign in existing users
- ✅ Google authentication works
- ✅ Protected routes secured

**You're ready to build GeoWhisper! 🗺️✨**
