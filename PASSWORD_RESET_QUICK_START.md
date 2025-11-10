# Password Reset - Quick Start & Troubleshooting

## 🚀 Quick Start (60 seconds)

### Test the Flow Right Now:

1. **Start your dev server** (if not already running):
   ```powershell
   cd frontend
   npm run dev
   ```

2. **Open browser** and navigate to:
   ```
   http://localhost:3000/forgot-password
   ```

3. **Enter your email** (must be registered in Firebase)

4. **Click "Send Reset Link"**

5. **Check your email** and click the link

6. **Enter new password** (at least 6 characters)

7. **Success!** You'll be redirected to sign in

8. **Login** with your new password

---

## ⚡ Prerequisites Checklist

Before testing, make sure:

- ✅ Firebase is configured in `.env.local`
- ✅ Dev server is running (`npm run dev`)
- ✅ You have a test account in Firebase Authentication
- ✅ Email is verified in Firebase (or verification is disabled)
- ✅ You have access to the email account

### Verify Firebase Configuration:

```powershell
# Check if .env.local exists
cat .env.local

# Should contain:
NEXT_PUBLIC_FIREBASE_API_KEY=AIza...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
```

---

## 🐛 Common Issues & Solutions

### Issue 1: "Firebase is not configured"

**Symptoms**: Error message when trying to send reset email

**Solutions**:
1. Check `.env.local` exists in `/frontend` folder
2. Verify all Firebase variables start with `NEXT_PUBLIC_`
3. Restart dev server after changing env vars:
   ```powershell
   # Press Ctrl+C to stop
   npm run dev  # Restart
   ```
4. Clear browser cache (Ctrl+Shift+Delete)

---

### Issue 2: Not Receiving Reset Email

**Symptoms**: No email in inbox after requesting reset

**Solutions**:

1. **Check spam/junk folder** (most common!)

2. **Verify email in Firebase Console**:
   - Go to Firebase Console
   - Authentication → Users
   - Check if email exists and is verified

3. **Check Firebase Email Settings**:
   - Authentication → Templates
   - Make sure "Password reset" template is enabled

4. **Wait a few minutes**:
   - Email delivery can take 1-5 minutes

5. **Check email format**:
   - Must be valid format: `user@domain.com`
   - No typos in email address

6. **Check Firebase quotas**:
   - Free tier has email limits
   - Check Firebase Console → Usage

---

### Issue 3: "Invalid or expired reset link"

**Symptoms**: Error when clicking email link

**Solutions**:

1. **Link expired**:
   - Links expire after 1 hour
   - Request a new reset link

2. **Link already used**:
   - Each link is one-time use
   - Request a new link if needed

3. **URL copied incorrectly**:
   - Click the link directly, don't copy/paste
   - Make sure full URL is included

4. **Browser issues**:
   - Try different browser
   - Clear browser cache
   - Disable browser extensions

---

### Issue 4: "Passwords do not match"

**Symptoms**: Error when submitting new password

**Solutions**:

1. **Type carefully**:
   - Make sure both passwords are identical
   - Use password visibility toggle (👁️ icon)

2. **Check for spaces**:
   - No leading/trailing spaces
   - Copy/paste can add spaces

3. **Case sensitive**:
   - Password is case-sensitive
   - Check Caps Lock

---

### Issue 5: Password Update Doesn't Work

**Symptoms**: Can't login with new password

**Solutions**:

1. **Wait a moment**:
   - Firebase update can take a few seconds
   - Wait 10 seconds then try again

2. **Clear browser data**:
   - Logout completely
   - Clear cookies and cache
   - Try again

3. **Verify in Firebase Console**:
   - Go to Firebase Console
   - Authentication → Users
   - Check "Last Sign In" timestamp

4. **Try password reset again**:
   - Sometimes the first attempt fails
   - Request new reset link

5. **Check Firebase status**:
   - Visit [Firebase Status Page](https://status.firebase.google.com/)
   - Ensure no ongoing incidents

---

### Issue 6: "Too many attempts"

**Symptoms**: Rate limit error

**Solutions**:

1. **Wait 15-30 minutes**:
   - Firebase rate limits reset automatically

2. **Try different email**:
   - If testing, use another test account

3. **Check IP-based limits**:
   - Might be blocked at IP level
   - Try different network/VPN

---

### Issue 7: Page Shows Loading Forever

**Symptoms**: Stuck on "Verifying reset link..."

**Solutions**:

1. **Check console for errors**:
   ```
   Press F12 → Console tab
   Look for red errors
   ```

2. **Verify URL parameters**:
   - URL should have `?oobCode=xxxxx`
   - If missing, link is invalid

3. **Check network tab**:
   ```
   Press F12 → Network tab
   Look for failed requests
   ```

4. **Refresh page**:
   - Sometimes helps with loading issues

---

### Issue 8: Styling Looks Broken

**Symptoms**: Page layout is messed up

**Solutions**:

1. **Check Tailwind CSS**:
   ```powershell
   npm install  # Reinstall dependencies
   ```

2. **Clear Next.js cache**:
   ```powershell
   rm -r .next
   npm run dev
   ```

3. **Hard refresh browser**:
   ```
   Ctrl+Shift+R (Windows/Linux)
   Cmd+Shift+R (Mac)
   ```

---

## 🔍 Debugging Tips

### Check Browser Console

```javascript
// Press F12, then Console tab
// You should see:
✅ Firebase is properly configured
✅ Firebase App initialized successfully
✅ Firebase Auth initialized
✅ Google Auth Provider configured

// If you see errors, note them and fix Firebase config
```

### Check Network Tab

```
1. Press F12 → Network tab
2. Try to send reset email
3. Look for requests to:
   - identitytoolkit.googleapis.com
   - Firebase domains
4. Check response codes:
   - 200 = Success
   - 400 = Bad request (check email)
   - 429 = Too many requests (rate limited)
   - 500 = Server error (Firebase issue)
```

### Test Firebase Connection

```javascript
// Add this to any page to test Firebase:
console.log('Firebase Auth:', auth);
console.log('Is configured:', !!auth);
```

---

## 📧 Email Troubleshooting

### Gmail Users
- Check "Promotions" or "Updates" tabs
- Add Firebase sender to contacts
- Check filters (Settings → Filters)

### Outlook/Hotmail Users
- Check "Other" or "Junk" folder
- Add to safe senders list
- Check blocked senders

### Corporate Email
- IT may block Firebase emails
- Ask IT to whitelist Firebase domains
- Use personal email for testing

---

## 🧪 Testing Tips

### Create Test Accounts

```
Good practice:
- test1@yourdomain.com
- test2@yourdomain.com
- etc.

Avoid:
- Your real personal email
- Shared team emails
- Production user emails
```

### Quick Test Script

```powershell
# Run complete test flow:

# 1. Open forgot password page
Start-Process "http://localhost:3000/forgot-password"

# 2. After requesting reset, open email client
Start-Process "https://mail.google.com"  # Or your email

# 3. Check logs in terminal for errors
```

---

## 🔧 Environment Setup Verification

### Verify Firebase Config

```powershell
# In PowerShell, check your env vars:
cd frontend
Get-Content .env.local | Select-String "FIREBASE"

# Should output all Firebase variables
# If empty, you need to set them up
```

### Test Firebase Connection

Create a test file: `frontend/test-firebase.js`

```javascript
const admin = require('firebase-admin');

// Test if Firebase works
console.log('Testing Firebase connection...');

// Add test code here
```

---

## 📱 Device-Specific Issues

### Mobile Testing
- Use Chrome DevTools mobile emulation
- Test with actual device
- Check responsive breakpoints

### Safari Issues
- May cache aggressively
- Clear Safari cache specifically
- Test in private browsing mode

### Edge/IE Issues
- Ensure modern browser
- Some features need ES6+
- Test in Chrome instead

---

## 🚨 Emergency Fixes

### Complete Reset

If nothing works:

```powershell
# 1. Stop dev server (Ctrl+C)

# 2. Clear everything
cd frontend
rm -r .next
rm -r node_modules

# 3. Reinstall
npm install

# 4. Restart
npm run dev

# 5. Hard refresh browser (Ctrl+Shift+R)
```

### Firebase Console Manual Reset

1. Go to Firebase Console
2. Authentication → Users
3. Find the user
4. Click "..." menu → "Reset Password"
5. Firebase sends email directly

---

## 📞 Getting Help

### Check Documentation
- `PASSWORD_RESET_IMPLEMENTATION.md` - Technical details
- `PASSWORD_RESET_TESTING.md` - Full testing guide
- `PASSWORD_RESET_VISUAL_GUIDE.md` - Visual walkthrough

### Firebase Documentation
- [Firebase Auth Docs](https://firebase.google.com/docs/auth)
- [Password Reset Guide](https://firebase.google.com/docs/auth/web/manage-users#send_a_password_reset_email)

### Debug Info to Collect

When asking for help, provide:

1. **Browser & Version**: Chrome 120, Safari 17, etc.
2. **Error Messages**: Full error text from console
3. **Network Logs**: Failed requests from Network tab
4. **Firebase Config Status**: Check console logs
5. **Steps to Reproduce**: Exact steps you took

---

## ✅ Success Indicators

You know it's working when you see:

1. ✅ "Check Your Email" success screen
2. ✅ Email received within 5 minutes
3. ✅ Reset link opens correctly
4. ✅ User email shown on reset form
5. ✅ "Password Reset Successful!" message
6. ✅ Can login with new password

---

## 🎯 Performance Benchmarks

Normal timings:

- **Send Email Request**: < 1 second
- **Email Delivery**: 10 seconds - 5 minutes
- **Page Load**: < 2 seconds
- **Code Verification**: < 500ms
- **Password Update**: < 1 second
- **Redirect**: 3 seconds (by design)

If things are slower, check network connection and Firebase status.

---

## 🔐 Security Reminders

- Never share reset links
- Links expire after 1 hour
- One-time use only
- Always use HTTPS in production
- Don't log passwords
- Clear browser after testing

---

## 🎉 Ready to Test!

You're all set! Follow the Quick Start at the top of this document to test your password reset flow.

**Estimated test time**: 2-3 minutes  
**Success rate**: ~95% when Firebase is configured  
**Most common issue**: Checking spam folder (solved in 30 seconds!)

Happy testing! 🚀
