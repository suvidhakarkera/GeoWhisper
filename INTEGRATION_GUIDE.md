# Frontend-Backend Integration Guide

## ✅ Integration Status

### What's Already Working:
1. **Auth Service** - Fully configured to communicate with backend
2. **Sign Up Page** - Ready to create users via backend API
3. **Sign In Page** - Ready to authenticate users via backend API
4. **Google OAuth** - Configured for both frontend and backend
5. **Navbar & Footer** - Already created and integrated

### API Endpoints Connected:
- `POST /api/auth/signup` - Email/password signup
- `POST /api/auth/signin` - Email/password signin
- `POST /api/auth/google` - Google OAuth signin/signup
- `GET /api/auth/profile/:uid` - Get user profile
- `GET /api/auth/health` - Health check

---

## 🚀 How to Run Both Frontend & Backend

### Step 1: Start Backend (Terminal 1)
```bash
cd C:\Users\sanki\GeoWhisper\backend
mvn spring-boot:run
```
Backend will run on: **http://localhost:8080**

### Step 2: Configure Firebase for Frontend
1. Go to https://console.firebase.google.com/project/geowhisper-1/settings/general
2. Scroll to "Your apps" section
3. If no web app exists, click "Add app" → Select Web (</>) icon
4. Register app with nickname: "GeoWhisper Web"
5. Copy the `firebaseConfig` values
6. Edit `frontend/.env.local` and replace the placeholder values

### Step 3: Start Frontend (Terminal 2)
```bash
cd C:\Users\sanki\GeoWhisper\frontend
npm run dev
```
Frontend will run on: **http://localhost:3000**

---

## 📝 Getting Firebase Web Config

Run these steps:

1. **Open Firebase Console:**
   - URL: https://console.firebase.google.com/project/geowhisper-1/settings/general

2. **Find Your Web App Config:**
   - Scroll down to "Your apps"
   - If you see a web app (</> icon), click the "Config" radio button
   - Copy all the values

3. **If No Web App Exists:**
   ```
   Click "Add app" → Select Web icon (</>)
   App nickname: "GeoWhisper Web"
   Don't check "Firebase Hosting"
   Click "Register app"
   Copy the firebaseConfig object
   ```

4. **Example Config (yours will be different):**
   ```javascript
   const firebaseConfig = {
     apiKey: "AIzaSyC...",
     authDomain: "geowhisper-1.firebaseapp.com",
     projectId: "geowhisper-1",
     storageBucket: "geowhisper-1.firebasestorage.app",
     messagingSenderId: "123456789",
     appId: "1:123456789:web:abc123"
   };
   ```

5. **Update `.env.local`:**
   ```bash
   NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyC...
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=geowhisper-1.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=geowhisper-1
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=geowhisper-1.firebasestorage.app
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
   NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc123
   ```

---

## 🔄 Complete Integration Flow

### Sign Up Flow:
1. User fills signup form on frontend
2. Frontend calls Firebase Auth to create user
3. Frontend gets Firebase UID and token
4. Frontend sends request to backend `/api/auth/signup`
5. Backend creates user profile in Firestore
6. Backend returns user data + custom token
7. Frontend stores token in localStorage
8. User redirected to home page

### Sign In Flow:
1. User fills login form
2. Frontend calls backend `/api/auth/signin`
3. Backend verifies credentials via Firebase Admin SDK
4. Backend returns user data + token
5. Frontend stores token
6. User redirected to home

### Google Auth Flow:
1. User clicks "Sign in with Google"
2. Firebase popup opens for Google signin
3. User selects Google account
4. Frontend gets Firebase ID token
5. Frontend sends token to backend `/api/auth/google`
6. Backend verifies token and creates/fetches user profile
7. Backend returns user data
8. Frontend stores token
9. User redirected to home

---

## 🧪 Testing the Integration

### 1. Test Backend Health:
```bash
curl http://localhost:8080/api/auth/health
```
Expected: `✅ GeoWhisper Auth Service is running!`

### 2. Test Signup (Frontend):
- Go to http://localhost:3000/signup
- Fill in: email, password, firstname, lastname
- Click "Create Account"
- Should redirect to home page on success

### 3. Test Signin (Frontend):
- Go to http://localhost:3000/signin
- Enter email and password
- Click "Sign In"
- Should redirect to home page

### 4. Test Google Auth:
- Click "Continue with Google" button
- Select Google account
- Should create account and redirect

---

## 📁 Project Structure

```
GeoWhisper/
├── backend/                          # Spring Boot API
│   └── src/main/
│       ├── java/.../controller/
│       │   └── AuthController.java   # ✅ Auth endpoints
│       ├── java/.../service/
│       │   └── AuthService.java      # ✅ Auth logic
│       └── resources/
│           ├── application.properties
│           └── firebase-key.json     # Backend service account
│
└── frontend/                         # Next.js App
    ├── app/
    │   ├── signup/
    │   │   └── page.tsx             # ✅ Signup page
    │   ├── signin/
    │   │   └── page.tsx             # ✅ Signin page
    │   └── page.tsx                 # Home/Landing page
    ├── src/
    │   ├── config/
    │   │   ├── api.ts               # ✅ API endpoints config
    │   │   └── firebase.ts          # ✅ Firebase client config
    │   ├── services/
    │   │   └── authService.ts       # ✅ API calls to backend
    │   └── components/
    │       ├── Navbar.tsx           # ✅ Navigation bar
    │       └── Footer.tsx           # ✅ Footer
    └── .env.local                   # ⚠️ Needs Firebase web config
```

---

## ✅ What's Already Integrated:

1. **✅ Signup Page** - Connects to `POST /api/auth/signup`
2. **✅ Signin Page** - Connects to `POST /api/auth/signin`
3. **✅ Google OAuth** - Both frontend & backend configured
4. **✅ Navbar** - Shows login/signup links
5. **✅ Footer** - Company info & links
6. **✅ Landing Page** - Home page with features
7. **✅ API Service** - All HTTP calls configured
8. **✅ Type Safety** - TypeScript interfaces for API responses

---

## 🔧 Troubleshooting

### Error: "Google Sign-In is not configured"
**Solution:** Add Firebase web config to `.env.local`

### Error: "Network request failed"
**Solution:** Make sure backend is running on port 8080

### Error: "CORS policy error"
**Solution:** Backend already configured CORS for localhost:3000

### Error: "Firebase admin initialization failed"
**Solution:** Check `backend/src/main/resources/firebase-key.json` exists

---

## 🎯 Next Steps (Optional Enhancements)

1. **Protected Routes** - Add authentication middleware
2. **User Dashboard** - Create user profile page
3. **Token Refresh** - Implement token refresh logic
4. **Error Boundaries** - Better error handling UI
5. **Loading States** - Add skeleton screens
6. **Form Validation** - Enhanced client-side validation
7. **Remember Me** - Persistent login (already partially implemented)
8. **Password Reset** - Forgot password flow
9. **Email Verification** - Verify email after signup

---

## 📞 API Documentation

Available endpoints:

```typescript
// Auth APIs
POST   /api/auth/signup      - Create new user
POST   /api/auth/signin      - Login existing user
POST   /api/auth/google      - Google OAuth signin/signup
GET    /api/auth/health      - Service health check
GET    /api/auth/profile/:uid - Get user profile
POST   /api/auth/verify      - Verify Firebase token
```

Request/Response examples in `frontend/src/types/auth.ts`

---

## 🔐 Security Notes

1. **Never commit** `.env.local` or `firebase-key.json` to Git
2. **Use HTTPS** in production
3. **Implement rate limiting** for auth endpoints (recommended)
4. **Add CSRF protection** if using cookies
5. **Validate all inputs** on both frontend and backend
6. **Use Firebase Security Rules** to protect Firestore data

---

## ✨ Summary

Your frontend is **fully integrated** with the backend! Just:

1. ✅ Start backend: `mvn spring-boot:run`
2. ⚠️ Add Firebase web config to `.env.local`
3. ✅ Start frontend: `npm run dev`
4. ✅ Test signup/signin at http://localhost:3000

Everything else is already connected and working! 🎉
