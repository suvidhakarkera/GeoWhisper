# 🔥 "Failed to Fetch" Error - Solution

## 🚨 Problem: Your Backend Wasn't Running!

The "Failed to fetch" error happens when:
- ✅ Frontend is running on http://localhost:3000
- ❌ Backend is NOT running on http://localhost:8080

The frontend tries to call:
- `POST http://localhost:8080/api/auth/signin`
- `POST http://localhost:8080/api/auth/signup`
- `POST http://localhost:8080/api/auth/google`

But if the backend is not running, it gets "Failed to fetch" (network error).

---

## ✅ Solution: I Just Started Your Backend

A new PowerShell window should have opened running your Spring Boot backend.

### Verify It's Running:

**Method 1: Check the PowerShell window**
Look for this message:
```
Started GeowhisperbackendnewApplication in X seconds
Tomcat started on port 8080 (http)
```

**Method 2: Check in browser**
Open: http://localhost:8080/api/auth/health

Should show: `✅ GeoWhisper Auth Service is running!`

**Method 3: Check port 8080**
Run in PowerShell:
```powershell
netstat -ano | Select-String "8080"
```

Should show:
```
TCP    0.0.0.0:8080    0.0.0.0:0    LISTENING    1234
```

---

## 🎯 Now Test Your Sign-In:

### Test Email/Password Sign-In:
1. Go to: http://localhost:3000/signin
2. Enter email and password
3. Click "Sign In"
4. Should work now! ✅

### Test Google Sign-In:
1. Go to: http://localhost:3000/signin
2. Click "Sign in with Google"
3. Select Google account
4. Should work now! ✅

---

## 📊 How To Keep Both Running

You need **TWO terminals** running:

### Terminal 1: Backend (Spring Boot)
```powershell
cd C:\Users\sanki\GeoWhisper\backend
mvn spring-boot:run
```
**Leave this running!** ← Don't press Ctrl+C

### Terminal 2: Frontend (Next.js)
```powershell
cd C:\Users\sanki\GeoWhisper\frontend
npm run dev
```
**Leave this running too!** ← Don't press Ctrl+C

---

## 🔧 Quick Start Commands

If you close the terminals, here's how to restart both:

### Start Backend:
```powershell
cd C:\Users\sanki\GeoWhisper\backend
mvn spring-boot:run
```

Wait for:
```
Started GeowhisperbackendnewApplication in X seconds
```

### Start Frontend (in a NEW terminal):
```powershell
cd C:\Users\sanki\GeoWhisper\frontend
npm run dev
```

Wait for:
```
✓ Ready in X seconds
```

---

## 🐛 Common Mistakes

### ❌ Stopping the Backend
**DON'T** press Ctrl+C in the backend terminal!

If you do, frontend will show "Failed to fetch" again.

### ❌ Closing the Terminal
**DON'T** close the PowerShell window running the backend!

If you do, backend stops and frontend can't connect.

### ❌ Only Running Frontend
**BOTH** frontend AND backend must be running!

---

## 🧪 Test Backend Connection

Run this in PowerShell to test if backend is alive:

```powershell
# Simple health check
curl http://localhost:8080/api/auth/health

# Or in browser
start http://localhost:8080/api/auth/health
```

Should return:
```
✅ GeoWhisper Auth Service is running!
```

If you get an error, backend is not running.

---

## 📝 Checklist Before Testing Sign-In:

- [ ] Backend terminal is open and showing "Tomcat started on port 8080"
- [ ] Frontend terminal is open and showing "Ready"
- [ ] http://localhost:8080/api/auth/health returns success
- [ ] http://localhost:3000 loads in browser
- [ ] No "Failed to fetch" errors in browser console

If all checkboxes are ticked, sign-in should work! ✅

---

## 💡 Pro Tip: Use VS Code Terminals

In VS Code, you can have multiple terminals:

1. Open Terminal (Ctrl+`)
2. Click "+" to create new terminal
3. Run backend in Terminal 1
4. Run frontend in Terminal 2
5. Keep both open!

---

## 🎉 Summary

**Problem:** Backend wasn't running → Frontend couldn't connect → "Failed to fetch"

**Solution:** I started the backend → Now both are running → Sign-in should work!

**Remember:** Always keep BOTH terminals running:
- Backend on port 8080
- Frontend on port 3000

**Test now:**
1. Check http://localhost:8080/api/auth/health
2. Try sign-in at http://localhost:3000/signin
3. Should work! 🚀
