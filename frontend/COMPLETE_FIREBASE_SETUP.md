# 🔥 Complete Firebase Setup Guide for Google Sign-In

## 📋 Table of Contents
1. [Finding Your Firebase Config](#1-finding-your-firebase-config)
2. [Enabling Google Sign-In](#2-enabling-google-sign-in)
3. [Setting Up Environment Variables](#3-setting-up-environment-variables)
4. [Testing Your Setup](#4-testing-your-setup)
5. [Troubleshooting](#5-troubleshooting)

---

## 1. Finding Your Firebase Config

### Step-by-Step Instructions:

#### Step 1: Open Firebase Console
1. Go to: **https://console.firebase.google.com/**
2. Log in with your Google account
3. You should see your project: **geowhisper-1**
4. Click on the project to open it

#### Step 2: Navigate to Project Settings
1. Click the **⚙️ gear icon** (Settings) in the left sidebar
2. Click **"Project settings"** in the dropdown menu
3. You'll be on the **"General"** tab by default

#### Step 3: Find Your Web App
Scroll down to the **"Your apps"** section. You'll see one of two scenarios:

**Scenario A: Web App Already Exists (</> icon)**
- You'll see a web app card with the `</>` icon
- Click on it to expand
- Look for **"SDK setup and configuration"** section
- Select the **"Config"** radio button (not npm)
- You'll see a JavaScript object like this:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyC-xxxxxxxxxxxxxxxxxxxxxxxxxxx",
  authDomain: "geowhisper-1.firebaseapp.com",
  projectId: "geowhisper-1",
  storageBucket: "geowhisper-1.firebasestorage.app",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abc123def456ghi789"
};
```

**Copy all these values!** You'll need them for the next step.

**Scenario B: No Web App Exists**
If you don't see any app with a `</>` icon:

1. Click the **"Add app"** button (or **"</>" icon** if visible)
2. Select **Web** (the `</>` icon)
3. Enter app nickname: **"GeoWhisper Web"**
4. **DO NOT** check "Also set up Firebase Hosting" (leave it unchecked)
5. Click **"Register app"**
6. You'll see the `firebaseConfig` object appear
7. **Copy all the values** from the config object
8. Click **"Continue to console"**

#### What Each Value Means:

| Field | Description | Example |
|-------|-------------|---------|
| `apiKey` | Public API key for web (safe to expose) | `AIzaSyC-xxx...` |
| `authDomain` | Domain for Firebase Auth | `geowhisper-1.firebaseapp.com` |
| `projectId` | Your Firebase project ID | `geowhisper-1` |
| `storageBucket` | Cloud Storage bucket | `geowhisper-1.firebasestorage.app` |
| `messagingSenderId` | Firebase Cloud Messaging ID | `123456789012` |
| `appId` | Unique identifier for your web app | `1:123456789012:web:abc123` |

---

## 2. Enabling Google Sign-In

### Step-by-Step Instructions:

#### Step 1: Go to Authentication
1. In Firebase Console, click **"Authentication"** in the left sidebar
2. If you see a "Get started" button, click it
3. You'll see the Authentication dashboard

#### Step 2: Enable Google Provider
1. Click the **"Sign-in method"** tab at the top
2. You'll see a list of sign-in providers
3. Find **"Google"** in the list
4. Click on **"Google"** to open the configuration panel

#### Step 3: Configure Google Sign-In
1. Toggle the **"Enable"** switch to ON (it should turn blue)
2. **Project support email**: Select your email from the dropdown
   - This is the email shown to users in the OAuth consent screen
   - Choose your Google account email
3. Click **"Save"** button

#### Step 4: Verify It's Enabled
- You should now see **"Google"** with a green "Enabled" badge
- Status should show: ✅ **Enabled**

---

## 3. Setting Up Environment Variables

### Step 1: Locate Your `.env.local` File

Your file is at: `C:\Users\sanki\GeoWhisper\frontend\.env.local`

### Step 2: Update the File

Open `.env.local` and replace the placeholder values with your actual Firebase config:

```env
# API Configuration
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080

# Firebase Configuration (REPLACE WITH YOUR ACTUAL VALUES)
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyC-xxxxxxxxxxxxxxxxxxxxxxxxxxx
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=geowhisper-1.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=geowhisper-1
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=geowhisper-1.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789012
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789012:web:abc123def456ghi789
```

### Step 3: Example Values

Here's what real values look like (yours will be different):

```env
# ✅ CORRECT - Real values
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyDKx8r2kJ3mN9pQ7vR5sT6uW8xY0zA1bC2
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=geowhisper-1.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=geowhisper-1
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=geowhisper-1.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=987654321098
NEXT_PUBLIC_FIREBASE_APP_ID=1:987654321098:web:def456ghi789jkl012

# ❌ WRONG - Placeholder values (these won't work!)
NEXT_PUBLIC_FIREBASE_API_KEY=your-web-api-key-here
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id-here
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id-here
```

### Step 4: Save and Restart

1. **Save** the `.env.local` file
2. **Stop** your development server (Ctrl+C)
3. **Restart** it:
   ```powershell
   npm run dev
   ```

---

## 4. Testing Your Setup

### Step 1: Verify Configuration Loaded

1. Open your browser to: **http://localhost:3000**
2. Open **Developer Console** (F12 or Right-click > Inspect)
3. Go to the **Console** tab
4. You should see these messages:
   ```
   ✅ Firebase is properly configured
   📝 Project ID: geowhisper-1
   📝 Auth Domain: geowhisper-1.firebaseapp.com
   ✅ Firebase App initialized successfully
   ✅ Firebase Auth initialized
   ✅ Google Auth Provider configured
   ```

### Step 2: Test Google Sign-In

1. Navigate to: **http://localhost:3000/signin**
2. Click the **"Sign in with Google"** button
3. A popup should appear showing:
   - Google account selection screen
   - List of your Google accounts
4. Select an account
5. You should be signed in successfully!

### Step 3: Check for Errors

If you see errors in the console, check the [Troubleshooting](#5-troubleshooting) section below.

---

## 5. Troubleshooting

### Error: "auth/api-key-not-valid"

**Problem**: Your API key is invalid or still using placeholder values.

**Solution**:
1. Check `.env.local` - make sure `NEXT_PUBLIC_FIREBASE_API_KEY` is a real value
2. Real API keys start with `AIza` (e.g., `AIzaSyC-xxx...`)
3. If you have `your-web-api-key-here`, that's a placeholder - replace it!
4. Get the real value from Firebase Console (see [Step 1](#1-finding-your-firebase-config))
5. Restart your dev server after updating

### Error: "auth/operation-not-allowed"

**Problem**: Google Sign-In provider is not enabled in Firebase.

**Solution**:
1. Go to Firebase Console > Authentication > Sign-in method
2. Find "Google" in the list
3. Click on it and toggle "Enable" to ON
4. Select a support email
5. Click "Save"

### Error: "auth/unauthorized-domain"

**Problem**: Your domain is not authorized in Firebase.

**Solution**:
1. Go to Firebase Console > Authentication > Settings > Authorized domains
2. Make sure `localhost` is in the list
3. If not, click "Add domain" and add `localhost`
4. For production, you'll need to add your production domain

### Error: "auth/popup-blocked"

**Problem**: Browser is blocking the popup.

**Solution**:
1. Allow popups for `localhost:3000` in your browser
2. Look for a popup blocker icon in the address bar
3. Click it and select "Always allow popups from localhost:3000"
4. Try again

### Error: "Firebase is not configured"

**Problem**: Environment variables are not loaded.

**Solution**:
1. Make sure `.env.local` file exists in the `frontend` folder
2. Make sure all variables start with `NEXT_PUBLIC_`
3. Make sure there are no spaces around the `=` sign
4. Make sure no values are empty or use placeholders
5. Restart the dev server: Stop (Ctrl+C) and run `npm run dev`

### Popup Closes Immediately

**Problem**: User closes the popup or clicks outside.

**Solution**:
- This is normal user behavior
- Error message will say "Sign-in cancelled"
- User can try again

### Console Shows "Firebase already initialized"

**Status**: This is **NORMAL** - not an error!

**Meaning**: Firebase initialized successfully on page load.

---

## 6. Additional Firebase Console Settings

### Optional: Customize OAuth Consent Screen

1. Go to Firebase Console > Authentication > Settings
2. Scroll to "Authorized domains"
3. Add your production domain here when you deploy

### Optional: Add More Sign-In Methods

In addition to Google, you can enable:
- Email/Password (already working)
- Facebook
- Twitter/X
- GitHub
- Apple
- Microsoft
- Anonymous

---

## 7. Quick Reference Commands

### Check if Config is Loaded
```powershell
# In frontend folder
cd C:\Users\sanki\GeoWhisper\frontend

# Check environment variables
$env:NEXT_PUBLIC_FIREBASE_API_KEY
```

Should print your actual API key, not `your-web-api-key-here`.

### Restart Dev Server
```powershell
# Stop current server (Ctrl+C)
# Then run:
npm run dev
```

### Clear Next.js Cache
```powershell
# If config isn't loading, try clearing cache
Remove-Item -Recurse -Force .next
npm run dev
```

---

## 8. Summary Checklist

Before testing Google Sign-In, verify:

- [ ] Created/found web app in Firebase Console
- [ ] Copied all 6 config values (apiKey, authDomain, etc.)
- [ ] Updated `.env.local` with real values (no placeholders!)
- [ ] Enabled Google sign-in provider in Firebase Console
- [ ] Selected support email for OAuth
- [ ] Saved all changes
- [ ] Restarted dev server
- [ ] Opened http://localhost:3000 in browser
- [ ] Checked console for "Firebase is properly configured" message
- [ ] No errors in browser console
- [ ] `localhost` is in authorized domains

If all checkboxes are checked, Google Sign-In should work! ✅

---

## 9. Getting Help

### Console Logs to Check

Look for these in your browser console (F12):

**✅ Good Signs:**
```
✅ Firebase is properly configured
✅ Firebase App initialized successfully
✅ Firebase Auth initialized
✅ Google Auth Provider configured
🔄 Initiating Google Sign-In...
📱 Opening Google Sign-In popup...
✅ Google Sign-In successful!
```

**❌ Bad Signs:**
```
❌ Firebase is NOT configured!
❌ Firebase not configured
⚠️ Firebase API key is invalid
```

### Still Having Issues?

1. Check the browser console for error messages
2. Copy the exact error message
3. Search for the error code (e.g., `auth/api-key-not-valid`)
4. Make sure backend is running on port 8080
5. Try in an incognito window to rule out browser extensions

---

## 10. What's Next?

After Google Sign-In works:

1. ✅ User signs in with Google
2. ✅ Frontend gets Firebase ID token
3. ✅ Frontend sends token to backend: `POST /api/auth/google`
4. ✅ Backend verifies token with Firebase Admin SDK
5. ✅ Backend creates/fetches user profile in Firestore
6. ✅ Backend returns user data
7. ✅ Frontend stores token in localStorage
8. ✅ User is redirected to home page

Your integration is already complete! Just need the correct Firebase config! 🎉

---

**Need Help?** Read the error message carefully - it usually tells you exactly what's wrong!
