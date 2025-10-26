# GeoWhisper Authentication API

Complete authentication system with Email/Password and Google Sign-In using Firebase Authentication.

## 🔐 Authentication Methods

### 1. Email & Password Authentication
Traditional email/password sign-up and sign-in with Firebase Auth.

### 2. Google Sign-In
OAuth authentication using Google accounts through Firebase.

---

## 📋 API Endpoints

### Base URL
```
http://localhost:8080/api/auth
```

---

## 🔑 Authentication Endpoints

### 1. Sign Up with Email & Password

**POST** `/api/auth/signup`

Create a new user account using email and password.

#### Request Body
```json
{
  "email": "john.doe@example.com",
  "password": "SecurePass123",
  "username": "john_explorer"
}
```

#### Response (200 OK)
```json
{
  "firebaseUid": "abc123xyz789firebaseuid",
  "idToken": "custom-token-here",
  "email": "john.doe@example.com",
  "username": "john_explorer",
  "isNewUser": true,
  "userData": {
    "username": "john_explorer",
    "email": "john.doe@example.com",
    "totalPosts": 0,
    "totalReactions": 0,
    "zonesVisited": 0,
    "firebaseUid": "abc123xyz789firebaseuid"
  },
  "message": "Sign up successful! Please verify your email."
}
```

#### Error Response (400 Bad Request)
```json
{
  "success": false,
  "message": "Email address is already in use",
  "data": null
}
```

---

### 2. Sign In with Email

**POST** `/api/auth/signin`

Sign in existing user with email.

> **Note:** For production use, password validation should be done on the client side using Firebase Client SDK. This endpoint verifies user existence and returns user data.

#### Request Body
```json
{
  "email": "john.doe@example.com",
  "password": "SecurePass123"
}
```

#### Response (200 OK)
```json
{
  "firebaseUid": "abc123xyz789firebaseuid",
  "email": "john.doe@example.com",
  "username": "john_explorer",
  "isNewUser": false,
  "userData": {
    "username": "john_explorer",
    "email": "john.doe@example.com",
    "totalPosts": 5,
    "totalReactions": 12,
    "zonesVisited": 3,
    "firebaseUid": "abc123xyz789firebaseuid"
  },
  "message": "Sign in successful!"
}
```

#### Error Response (401 Unauthorized)
```json
{
  "success": false,
  "message": "Invalid credentials or user not found",
  "data": null
}
```

---

### 3. Google Sign-In

**POST** `/api/auth/google`

Authenticate user with Google Sign-In using Firebase ID token. Automatically creates user profile for first-time users.

#### Request Body
```json
{
  "idToken": "eyJhbGciOiJSUzI1NiIsImtpZCI6IjFlOWdkazcifQ...",
  "username": "john_explorer"  // Optional: only for first-time sign-up
}
```

#### Response (200 OK)
```json
{
  "firebaseUid": "google-user-uid",
  "idToken": "eyJhbGciOiJSUzI1NiIsImtpZCI6IjFlOWdkazcifQ...",
  "email": "john.doe@gmail.com",
  "username": "john_explorer",
  "isNewUser": true,
  "userData": {
    "username": "john_explorer",
    "email": "john.doe@gmail.com",
    "totalPosts": 0,
    "totalReactions": 0,
    "zonesVisited": 0,
    "firebaseUid": "google-user-uid"
  },
  "message": "Google sign up successful!"
}
```

#### Error Response (401 Unauthorized)
```json
{
  "success": false,
  "message": "Invalid Google ID token",
  "data": null
}
```

---

### 4. Verify Token

**POST** `/api/auth/verify`

Verify a Firebase ID token and return user information.

#### Headers
```
Authorization: Bearer <firebase-id-token>
```

#### Response (200 OK)
```json
{
  "firebaseUid": "abc123xyz789firebaseuid",
  "email": "john.doe@example.com",
  "username": "john_explorer",
  "isNewUser": false,
  "userData": {
    "username": "john_explorer",
    "email": "john.doe@example.com",
    "totalPosts": 5,
    "totalReactions": 12,
    "zonesVisited": 3,
    "firebaseUid": "abc123xyz789firebaseuid"
  },
  "message": "Token verified successfully"
}
```

---

### 5. Get User Profile

**GET** `/api/auth/profile/{firebaseUid}`

Retrieve user profile by Firebase UID.

#### Response (200 OK)
```json
{
  "success": true,
  "message": "Profile found",
  "data": {
    "username": "john_explorer",
    "email": "john.doe@example.com",
    "totalPosts": 5,
    "totalReactions": 12,
    "zonesVisited": 3,
    "createdAt": "2025-10-20T10:30:00Z",
    "firebaseUid": "abc123xyz789firebaseuid"
  }
}
```

---

### 6. Update User Profile

**PATCH** `/api/auth/profile/{firebaseUid}`

Update user profile information. Cannot update `email`, `firebaseUid`, or `createdAt` fields.

#### Request Body
```json
{
  "username": "new_username",
  "totalPosts": 10
}
```

#### Response (200 OK)
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": {
    "username": "new_username",
    "email": "john.doe@example.com",
    "totalPosts": 10,
    "totalReactions": 12,
    "zonesVisited": 3,
    "firebaseUid": "abc123xyz789firebaseuid"
  }
}
```

---

### 7. Delete User Account

**DELETE** `/api/auth/profile/{firebaseUid}`

Permanently delete user account from both Firebase Auth and Firestore.

#### Response (200 OK)
```json
{
  "success": true,
  "message": "Account deleted successfully",
  "data": null
}
```

---

## 🔄 Authentication Flow

### Email/Password Flow

#### Sign Up Flow:
1. Client sends email, password, and username to `/api/auth/signup`
2. Backend creates user in Firebase Auth
3. Backend creates user profile in Firestore
4. Backend returns custom token and user data
5. Client uses token for subsequent authenticated requests

#### Sign In Flow:
1. Client sends email and password to `/api/auth/signin`
2. Backend verifies user exists in Firebase Auth
3. Backend retrieves user profile from Firestore
4. Backend returns user data
5. For password validation, use Firebase Client SDK on frontend

### Google Sign-In Flow

1. Client initiates Google Sign-In using Firebase Client SDK
2. Firebase returns ID token after successful Google authentication
3. Client sends ID token to `/api/auth/google`
4. Backend verifies token with Firebase
5. Backend creates/retrieves user profile
6. Backend returns user data
7. Client stores token for subsequent requests

---

## 🛡️ Security Features

- ✅ Password validation (minimum 6 characters)
- ✅ Email validation
- ✅ Firebase token verification
- ✅ Protected user data fields
- ✅ Automatic user profile creation
- ✅ Secure token-based authentication
- ✅ CORS configuration
- ✅ Stateless session management

---

## 📦 Data Models

### User Profile (Firestore)
```json
{
  "username": "string",
  "email": "string",
  "createdAt": "timestamp",
  "totalPosts": "number",
  "totalReactions": "number",
  "zonesVisited": "number"
}
```

---

## 🧪 Testing with cURL

### Sign Up
```bash
curl -X POST http://localhost:8080/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "test123",
    "username": "testuser"
  }'
```

### Sign In
```bash
curl -X POST http://localhost:8080/api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "test123"
  }'
```

### Google Sign-In
```bash
curl -X POST http://localhost:8080/api/auth/google \
  -H "Content-Type: application/json" \
  -d '{
    "idToken": "your-firebase-id-token-here",
    "username": "testuser"
  }'
```

### Verify Token
```bash
curl -X POST http://localhost:8080/api/auth/verify \
  -H "Authorization: Bearer your-firebase-id-token-here"
```

### Get Profile
```bash
curl -X GET http://localhost:8080/api/auth/profile/{firebaseUid}
```

### Update Profile
```bash
curl -X PATCH http://localhost:8080/api/auth/profile/{firebaseUid} \
  -H "Content-Type: application/json" \
  -d '{
    "username": "new_username"
  }'
```

### Delete Account
```bash
curl -X DELETE http://localhost:8080/api/auth/profile/{firebaseUid}
```

---

## 🎨 Frontend Integration

### Email/Password Sign Up (JavaScript)
```javascript
// Using Firebase Client SDK for password authentication
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";

const auth = getAuth();

async function signUp(email, password, username) {
  try {
    // Create user with Firebase Client SDK
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Get ID token
    const idToken = await user.getIdToken();
    
    // Create profile in backend
    const response = await fetch('http://localhost:8080/api/auth/signup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: email,
        password: password,
        username: username
      })
    });
    
    const data = await response.json();
    console.log('Sign up successful:', data);
    
    // Store token for future requests
    localStorage.setItem('authToken', idToken);
    localStorage.setItem('firebaseUid', data.firebaseUid);
    
    return data;
  } catch (error) {
    console.error('Sign up error:', error);
    throw error;
  }
}
```

### Email/Password Sign In (JavaScript)
```javascript
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";

const auth = getAuth();

async function signIn(email, password) {
  try {
    // Sign in with Firebase Client SDK
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Get ID token
    const idToken = await user.getIdToken();
    
    // Get user profile from backend
    const response = await fetch('http://localhost:8080/api/auth/signin', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: email,
        password: password
      })
    });
    
    const data = await response.json();
    console.log('Sign in successful:', data);
    
    // Store token
    localStorage.setItem('authToken', idToken);
    localStorage.setItem('firebaseUid', data.firebaseUid);
    
    return data;
  } catch (error) {
    console.error('Sign in error:', error);
    throw error;
  }
}
```

### Google Sign-In (JavaScript)
```javascript
import { getAuth, signInWithPopup, GoogleAuthProvider } from "firebase/auth";

const auth = getAuth();
const provider = new GoogleAuthProvider();

async function signInWithGoogle() {
  try {
    // Sign in with Google popup
    const result = await signInWithPopup(auth, provider);
    const user = result.user;
    
    // Get ID token
    const idToken = await user.getIdToken();
    
    // Send to backend
    const response = await fetch('http://localhost:8080/api/auth/google', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        idToken: idToken,
        username: user.displayName.replace(/\s+/g, '_').toLowerCase()
      })
    });
    
    const data = await response.json();
    console.log('Google sign in successful:', data);
    
    // Store token
    localStorage.setItem('authToken', idToken);
    localStorage.setItem('firebaseUid', data.firebaseUid);
    
    return data;
  } catch (error) {
    console.error('Google sign in error:', error);
    throw error;
  }
}
```

### Making Authenticated Requests
```javascript
async function makeAuthenticatedRequest(endpoint) {
  const token = localStorage.getItem('authToken');
  
  const response = await fetch(`http://localhost:8080/api${endpoint}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  
  return response.json();
}
```

---

## 📚 Swagger Documentation

Access interactive API documentation at:
```
http://localhost:8080/swagger-ui.html
```

---

## ⚙️ Configuration

### Firebase Setup
1. Create a Firebase project at [Firebase Console](https://console.firebase.google.com/)
2. Enable Email/Password and Google authentication in Firebase Console
3. Download service account key JSON file
4. Place the JSON file at: `src/main/resources/firebase-key.json`

### Enable Google Sign-In
1. Go to Firebase Console → Authentication → Sign-in method
2. Enable Google provider
3. Configure OAuth consent screen
4. Add authorized domains

---

## 🚨 Error Codes

| Status Code | Description |
|-------------|-------------|
| 200 | Success |
| 400 | Bad Request - Invalid input data |
| 401 | Unauthorized - Invalid credentials or token |
| 404 | Not Found - User profile not found |
| 500 | Internal Server Error |

---

## 💡 Best Practices

1. **Always use HTTPS in production** to protect user credentials
2. **Store tokens securely** on the client side (avoid localStorage for sensitive apps)
3. **Implement token refresh** mechanism for long sessions
4. **Validate tokens on every protected endpoint** using the verify endpoint
5. **Use Firebase Client SDK** for password operations on frontend
6. **Implement rate limiting** to prevent brute force attacks
7. **Send email verification** after sign up

---

## 🔧 Troubleshooting

### Common Issues

**Issue:** "Email already exists"
- **Solution:** Email is already registered. Use sign in instead or reset password.

**Issue:** "Invalid Google ID token"
- **Solution:** Ensure ID token is fresh and obtained from Firebase Client SDK.

**Issue:** "User profile not found"
- **Solution:** Profile may not have been created. Use the create profile endpoint.

**Issue:** Firebase initialization failed
- **Solution:** Check that `firebase-key.json` exists in `src/main/resources/`

---

## 📝 License

This project is part of GeoWhisper hackathon submission.

---

## 🤝 Support

For issues or questions, please create an issue in the repository.
