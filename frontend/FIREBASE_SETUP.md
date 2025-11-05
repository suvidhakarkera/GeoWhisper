# How to Get Firebase Web Config

## 🚨 Error: "auth/api-key-not-valid"

This means you're using placeholder values instead of real Firebase config.

---

## ✅ Solution: Get Real Firebase Config

### Step-by-Step:

1. **Open Firebase Console:**
   - Click this link or copy to browser:
   ```
   https://console.firebase.google.com/project/geowhisper-1/settings/general
   ```

2. **Scroll Down** to "Your apps" section

3. **Check if Web App Exists:**

   **If you see a web app icon (</> ):**
   - Click on the gear icon ⚙️ next to it
   - OR click "SDK setup and configuration"
   - Select "Config" radio button
   - You'll see the firebaseConfig object
   - Copy all the values

   **If NO web app exists:**
   - Click **"Add app"** button
   - Click **Web icon** `</>`
   - Enter nickname: `GeoWhisper Web`
   - **Don't check** "Also set up Firebase Hosting"
   - Click **"Register app"**
   - Copy the firebaseConfig values shown

4. **You'll Get Values Like This:**
   ```javascript
   const firebaseConfig = {
     apiKey: "AIzaSyXXXXXXXXXXXXXXXXXXXX",  // ← Real value starts with AIza
     authDomain: "geowhisper-1.firebaseapp.com",
     projectId: "geowhisper-1",
     storageBucket: "geowhisper-1.firebasestorage.app",
     messagingSenderId: "123456789012",  // ← Real number
     appId: "1:123456789012:web:abc123"  // ← Real app ID
   };
   ```

5. **Update `.env.local`:**
   - Open: `C:\Users\sanki\GeoWhisper\frontend\.env.local`
   - Replace with your actual values:

   ```env
   NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXX
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=geowhisper-1.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=geowhisper-1
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=geowhisper-1.firebasestorage.app
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789012
   NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789012:web:abc123
   ```

6. **Restart Frontend:**
   ```powershell
   # Stop current process
   # Press Ctrl+C in the terminal running npm run dev
   
   # Then restart
   npm run dev
   ```

---

## 🎯 Quick Verification

After updating `.env.local`, check if values are loaded:

```powershell
# In frontend folder, check environment variables
cd C:\Users\sanki\GeoWhisper\frontend
node -e "console.log(process.env.NEXT_PUBLIC_FIREBASE_API_KEY)"
```

Should print your actual API key, NOT "your-web-api-key-here"

---

## 🔍 What Each Value Means

| Variable | What It Is | Example |
|----------|-----------|---------|
| `FIREBASE_API_KEY` | Public API key for web | `AIzaSyXXX...` |
| `FIREBASE_AUTH_DOMAIN` | Auth domain | `project-id.firebaseapp.com` |
| `FIREBASE_PROJECT_ID` | Your project ID | `geowhisper-1` |
| `FIREBASE_STORAGE_BUCKET` | Storage bucket | `project.firebasestorage.app` |
| `FIREBASE_MESSAGING_SENDER_ID` | FCM sender ID | `123456789012` |
| `FIREBASE_APP_ID` | Unique app ID | `1:123:web:abc` |

---

## ⚠️ Important Notes

1. **API Key is PUBLIC** - It's safe to expose in frontend code
2. **Don't confuse** with backend `firebase-key.json` (that's private)
3. **Web config ≠ Service account** - They're different
4. **Must restart** frontend after changing `.env.local`

---

## 🧪 Test After Updating

1. Restart frontend: `npm run dev`
2. Open: http://localhost:3000/signin
3. Click "Sign in with Google"
4. Should open Google account picker
5. If still error, check browser console for exact error

---

## 🆘 Still Not Working?

Check these:

1. **Verify `.env.local` has real values:**
   ```powershell
   Get-Content C:\Users\sanki\GeoWhisper\frontend\.env.local
   ```
   Should NOT contain "your-web-api-key-here"

2. **Check if Next.js loaded the env:**
   - Open browser console
   - Type: `process.env.NEXT_PUBLIC_FIREBASE_API_KEY`
   - Should show real API key

3. **Clear Next.js cache:**
   ```powershell
   cd C:\Users\sanki\GeoWhisper\frontend
   Remove-Item -Recurse -Force .next
   npm run dev
   ```

---

## 📞 Need the Config Now?

Run this in PowerShell:
```powershell
cd C:\Users\sanki\GeoWhisper\frontend
.\get-firebase-config.bat
```

It will open Firebase Console directly!
