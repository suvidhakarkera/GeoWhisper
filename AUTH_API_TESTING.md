# GeoWhisper Auth API - Postman/Testing Collection

This file contains ready-to-use API requests for testing the authentication endpoints.

## Environment Variables
Set these up in Postman or your testing tool:
```
BASE_URL = http://localhost:8080
FIREBASE_UID = <obtained from signup/signin response>
ID_TOKEN = <obtained from Firebase or signup/signin response>
```

---

## 1. Health Check

**Method:** GET  
**URL:** `{{BASE_URL}}/api/auth/health`  
**Headers:** None  
**Body:** None

---

## 2. Sign Up with Email & Password

**Method:** POST  
**URL:** `{{BASE_URL}}/api/auth/signup`  
**Headers:**
```
Content-Type: application/json
```

**Body (JSON):**
```json
{
  "email": "john.doe@example.com",
  "password": "securepass123",
  "username": "john_explorer"
}
```

**Expected Response (200 OK):**
```json
{
  "firebaseUid": "abc123xyz789",
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
    "firebaseUid": "abc123xyz789"
  },
  "message": "Sign up successful! Please verify your email."
}
```

---

## 3. Sign In with Email

**Method:** POST  
**URL:** `{{BASE_URL}}/api/auth/signin`  
**Headers:**
```
Content-Type: application/json
```

**Body (JSON):**
```json
{
  "email": "john.doe@example.com",
  "password": "securepass123"
}
```

**Expected Response (200 OK):**
```json
{
  "firebaseUid": "abc123xyz789",
  "email": "john.doe@example.com",
  "username": "john_explorer",
  "isNewUser": false,
  "userData": {
    "username": "john_explorer",
    "email": "john.doe@example.com",
    "totalPosts": 0,
    "totalReactions": 0,
    "zonesVisited": 0,
    "firebaseUid": "abc123xyz789"
  },
  "message": "Sign in successful!"
}
```

---

## 4. Google Sign-In

**Method:** POST  
**URL:** `{{BASE_URL}}/api/auth/google`  
**Headers:**
```
Content-Type: application/json
```

**Body (JSON):**
```json
{
  "idToken": "eyJhbGciOiJSUzI1NiIsImtpZCI6IjFlOWdkazcifQ...",
  "username": "john_explorer"
}
```

**Note:** The `idToken` must be obtained from Firebase Client SDK after Google authentication.

**Expected Response (200 OK):**
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

---

## 5. Verify Token

**Method:** POST  
**URL:** `{{BASE_URL}}/api/auth/verify`  
**Headers:**
```
Authorization: Bearer {{ID_TOKEN}}
Content-Type: application/json
```

**Body:** None

**Expected Response (200 OK):**
```json
{
  "firebaseUid": "abc123xyz789",
  "email": "john.doe@example.com",
  "username": "john_explorer",
  "isNewUser": false,
  "userData": {
    "username": "john_explorer",
    "email": "john.doe@example.com",
    "totalPosts": 0,
    "totalReactions": 0,
    "zonesVisited": 0,
    "firebaseUid": "abc123xyz789"
  },
  "message": "Token verified successfully"
}
```

---

## 6. Get User Profile

**Method:** GET  
**URL:** `{{BASE_URL}}/api/auth/profile/{{FIREBASE_UID}}`  
**Headers:** None  
**Body:** None

**Expected Response (200 OK):**
```json
{
  "success": true,
  "message": "Profile found",
  "data": {
    "username": "john_explorer",
    "email": "john.doe@example.com",
    "totalPosts": 0,
    "totalReactions": 0,
    "zonesVisited": 0,
    "createdAt": "2025-10-26T10:30:00Z",
    "firebaseUid": "abc123xyz789"
  }
}
```

---

## 7. Update User Profile

**Method:** PATCH  
**URL:** `{{BASE_URL}}/api/auth/profile/{{FIREBASE_UID}}`  
**Headers:**
```
Content-Type: application/json
```

**Body (JSON):**
```json
{
  "username": "new_username",
  "totalPosts": 5,
  "zonesVisited": 2
}
```

**Note:** Cannot update `email`, `firebaseUid`, or `createdAt` fields.

**Expected Response (200 OK):**
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": {
    "username": "new_username",
    "email": "john.doe@example.com",
    "totalPosts": 5,
    "totalReactions": 0,
    "zonesVisited": 2,
    "firebaseUid": "abc123xyz789"
  }
}
```

---

## 8. Delete User Account

**Method:** DELETE  
**URL:** `{{BASE_URL}}/api/auth/profile/{{FIREBASE_UID}}`  
**Headers:** None  
**Body:** None

**Expected Response (200 OK):**
```json
{
  "success": true,
  "message": "Account deleted successfully",
  "data": null
}
```

---

## Error Response Examples

### 400 Bad Request
```json
{
  "success": false,
  "message": "Email address is already in use",
  "data": null
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "message": "Invalid credentials or user not found",
  "data": null
}
```

### 404 Not Found
```json
{
  "success": false,
  "message": "User profile not found",
  "data": null
}
```

---

## Testing Workflow

### 1. Test Email Authentication
```
1. Sign Up with Email → Save firebaseUid
2. Sign In with Email → Verify returns same user data
3. Get Profile → Verify profile exists
4. Update Profile → Change username
5. Get Profile → Verify update applied
```

### 2. Test Google Authentication
```
1. Get Google ID Token from Firebase SDK
2. Google Sign-In → Save firebaseUid
3. Google Sign-In Again → Verify returns same user
4. Get Profile → Verify profile exists
```

### 3. Test Token Verification
```
1. Sign In → Get idToken
2. Verify Token → Should succeed
3. Wait 1 hour → Token should expire
4. Verify Token → Should fail
```

### 4. Test Profile Management
```
1. Get Profile → 200 OK
2. Update Profile → 200 OK
3. Get Profile → Verify changes
4. Delete Account → 200 OK
5. Get Profile → 404 Not Found
```

---

## PowerShell Testing Scripts

### Test Sign Up
```powershell
$body = @{
    email = "test@example.com"
    password = "test123456"
    username = "testuser"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:8080/api/auth/signup" `
    -Method Post `
    -ContentType "application/json" `
    -Body $body
```

### Test Sign In
```powershell
$body = @{
    email = "test@example.com"
    password = "test123456"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:8080/api/auth/signin" `
    -Method Post `
    -ContentType "application/json" `
    -Body $body
```

### Test Get Profile
```powershell
$uid = "your-firebase-uid"

Invoke-RestMethod -Uri "http://localhost:8080/api/auth/profile/$uid" `
    -Method Get
```

### Test Update Profile
```powershell
$uid = "your-firebase-uid"
$body = @{
    username = "new_username"
    totalPosts = 10
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:8080/api/auth/profile/$uid" `
    -Method Patch `
    -ContentType "application/json" `
    -Body $body
```

---

## Postman Collection Import

You can import this as a Postman collection by converting it to JSON format.

### Quick Postman Setup
1. Open Postman
2. Create new Collection: "GeoWhisper Auth API"
3. Add environment variables: BASE_URL, FIREBASE_UID, ID_TOKEN
4. Import each request from this document
5. Run collection tests

---

## VS Code REST Client

If you use VS Code with REST Client extension:

### Create `auth-test.http` file:

```http
### Health Check
GET http://localhost:8080/api/auth/health

### Sign Up
POST http://localhost:8080/api/auth/signup
Content-Type: application/json

{
  "email": "test@example.com",
  "password": "test123456",
  "username": "testuser"
}

### Sign In
POST http://localhost:8080/api/auth/signin
Content-Type: application/json

{
  "email": "test@example.com",
  "password": "test123456"
}

### Get Profile
GET http://localhost:8080/api/auth/profile/your-firebase-uid

### Update Profile
PATCH http://localhost:8080/api/auth/profile/your-firebase-uid
Content-Type: application/json

{
  "username": "new_username"
}
```

---

## Notes

- Replace `{{BASE_URL}}`, `{{FIREBASE_UID}}`, and `{{ID_TOKEN}}` with actual values
- Save firebaseUid from signup/signin responses for subsequent requests
- For Google Sign-In, obtain idToken using Firebase Client SDK
- Tokens expire after 1 hour - get fresh token if expired
- Test in order: signup → signin → profile operations → delete
