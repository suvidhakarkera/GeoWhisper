# Google Authentication Setup Guide

Google Sign-In/Sign-Up has been successfully integrated with your GeoWhisper application.

## What Was Done

1. **Installed Firebase SDK** - Added `firebase` package to handle Google authentication
2. **Created Firebase Configuration** - Set up Firebase config at `src/config/firebase.ts`
3. **Updated Environment Variables** - Added Firebase credentials to `env.example`
4. **Integrated Google Sign-In** - Both sign-in and sign-up pages now support Google authentication
5. **Backend Integration** - Google auth flows connect to your existing `/api/auth/google` endpoint

## Setup Instructions

### 1. Create a `.env.local` file

Copy the `env.example` file and rename it to `.env.local`:

```bash
cp env.example .env.local
```

### 2. Get Firebase Credentials

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project (or create a new one)
3. Go to **Project Settings** (gear icon) → **General**
4. Scroll down to **Your apps** section
5. If you don't have a web app, click **Add app** and select **Web**
6. Copy the Firebase configuration values

### 3. Configure Environment Variables

Update your `.env.local` file with your Firebase credentials:

```env
# API Configuration
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080

# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your-actual-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
```

### 4. Enable Google Sign-In in Firebase

1. In Firebase Console, go to **Authentication** → **Sign-in method**
2. Click on **Google** provider
3. Toggle **Enable**
4. Add your support email
5. Click **Save**

### 5. Configure Authorized Domains

In Firebase Console under **Authentication** → **Settings** → **Authorized domains**, add:
- `localhost` (for development)
- Your production domain (when deploying)

### 6. Restart Development Server

After setting up the environment variables:

```bash
npm run dev
```

## How It Works

### Sign-In Flow

1. User clicks "Sign in with Google" button
2. Firebase popup opens for Google account selection
3. User selects Google account and grants permissions
4. Firebase returns ID token
5. Frontend sends ID token to backend `/api/auth/google` endpoint
6. Backend verifies token and returns user data
7. User is redirected to home page

### Sign-Up Flow

Same as sign-in flow - the backend automatically creates a new user profile if it's the first time signing in with that Google account.

## Features

- ✅ Google Sign-In with popup
- ✅ Google Sign-Up with popup
- ✅ Loading states on buttons
- ✅ Error handling for common scenarios:
  - Popup closed by user
  - Popup blocked
  - Network errors
  - Invalid tokens
- ✅ Remember me option (Sign-In only)
- ✅ Automatic user creation on first Google sign-in
- ✅ Session management with localStorage/sessionStorage

## Troubleshooting

### "Popup blocked" error
- Allow popups for your site in browser settings
- The error message will guide users to enable popups

### "auth/popup-closed-by-user" error
- User closed the popup before completing sign-in
- User can try again

### Firebase configuration errors
- Double-check all environment variables are set correctly
- Ensure `.env.local` file exists and is in the correct location
- Restart the development server after changing environment variables

### Backend integration errors
- Ensure backend is running on the correct port
- Verify `NEXT_PUBLIC_API_BASE_URL` matches your backend URL
- Check backend logs for authentication errors

## API Integration

The frontend uses the existing `authService.googleAuth()` method which calls:

**Endpoint:** `POST /api/auth/google`

**Request Body:**
```json
{
  "idToken": "firebase-id-token-from-google-signin"
}
```

**Response:**
```json
{
  "firebaseUid": "user-firebase-uid",
  "idToken": "new-firebase-id-token",
  "email": "user@example.com",
  "username": "username"
}
```

## Security Notes

- Never commit `.env.local` to version control
- Firebase API keys are safe to expose in client-side code (they're restricted by domain)
- ID tokens are verified on the backend for security
- Tokens expire after 1 hour and need to be refreshed
