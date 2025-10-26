# 🎯 GeoWhisper Auth API - Quick Reference Card

## 🔌 Base URL
```
http://localhost:8080/api/auth
```

## 📍 Endpoints Quick Reference

### Sign Up
```http
POST /signup
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "username": "username"
}
```

### Sign In
```http
POST /signin
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

### Google Auth
```http
POST /google
Content-Type: application/json

{
  "idToken": "firebase-id-token",
  "username": "username"  // optional
}
```

### Verify Token
```http
POST /verify
Authorization: Bearer {firebase-id-token}
```

### Get Profile
```http
GET /profile/{firebaseUid}
```

### Update Profile
```http
PATCH /profile/{firebaseUid}
Content-Type: application/json

{
  "username": "new_username"
}
```

### Delete Account
```http
DELETE /profile/{firebaseUid}
```

---

## 🔐 Authentication Headers

```javascript
headers: {
  'Content-Type': 'application/json',
  'Authorization': 'Bearer ' + idToken
}
```

---

## 📦 Response Structure

### Success Response
```json
{
  "firebaseUid": "user-uid",
  "idToken": "token",
  "email": "user@example.com",
  "username": "username",
  "isNewUser": true,
  "userData": { },
  "message": "Success message"
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error message",
  "data": null
}
```

---

## 🎨 Frontend Integration

### Firebase Setup
```javascript
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
```

### Email Sign Up
```javascript
import { createUserWithEmailAndPassword } from "firebase/auth";

const signUp = async (email, password, username) => {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const token = await userCredential.user.getIdToken();
  
  const response = await fetch('http://localhost:8080/api/auth/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, username })
  });
  
  return response.json();
};
```

### Email Sign In
```javascript
import { signInWithEmailAndPassword } from "firebase/auth";

const signIn = async (email, password) => {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  const token = await userCredential.user.getIdToken();
  
  const response = await fetch('http://localhost:8080/api/auth/signin', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  
  return response.json();
};
```

### Google Sign In
```javascript
import { signInWithPopup, GoogleAuthProvider } from "firebase/auth";

const googleSignIn = async () => {
  const provider = new GoogleAuthProvider();
  const result = await signInWithPopup(auth, provider);
  const token = await result.user.getIdToken();
  
  const response = await fetch('http://localhost:8080/api/auth/google', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken: token })
  });
  
  return response.json();
};
```

---

## 💾 Local Storage

```javascript
// Store auth data
localStorage.setItem('authToken', idToken);
localStorage.setItem('firebaseUid', firebaseUid);
localStorage.setItem('userData', JSON.stringify(userData));

// Retrieve auth data
const token = localStorage.getItem('authToken');
const uid = localStorage.getItem('firebaseUid');
const userData = JSON.parse(localStorage.getItem('userData'));

// Clear auth data
localStorage.clear();
```

---

## ✅ Validation Rules

| Field | Rule |
|-------|------|
| Email | Valid email format |
| Password | Minimum 6 characters |
| Username | 3-30 characters |

---

## ⚠️ Error Codes

| Status | Meaning |
|--------|---------|
| 200 | Success |
| 400 | Bad Request |
| 401 | Unauthorized |
| 404 | Not Found |
| 500 | Server Error |

---

## 🧪 Quick Test (PowerShell)

```powershell
# Sign Up
$body = @{
    email = "test@example.com"
    password = "test123"
    username = "testuser"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:8080/api/auth/signup" `
    -Method Post -ContentType "application/json" -Body $body
```

---

## 🔧 Common Issues

**Firebase not initialized**
→ Check `firebase-key.json` in `src/main/resources/`

**CORS error**
→ Already configured for localhost:3000 and localhost:5173

**Token expired**
→ Tokens expire after 1 hour, get fresh token

**Email already exists**
→ Use sign in instead or different email

---

## 📚 Documentation Files

- **AUTH_API_DOCUMENTATION.md** - Complete API reference
- **AUTH_SETUP_GUIDE.md** - Setup instructions
- **AUTH_API_TESTING.md** - Testing guide
- **AUTH_FLOW_DIAGRAMS.md** - Visual flow diagrams

---

## 🚀 Quick Start

1. **Start Backend**
   ```powershell
   cd backend
   mvn spring-boot:run
   ```

2. **Test API**
   ```
   http://localhost:8080/swagger-ui.html
   ```

3. **Integrate Frontend**
   - Install Firebase: `npm install firebase`
   - Configure Firebase
   - Implement auth forms

---

## 📞 Need Help?

- Check Swagger UI for interactive testing
- Review documentation files
- Check Firebase Console for auth errors
- Verify configuration files

---

**Print this for quick reference while developing! 📋**
