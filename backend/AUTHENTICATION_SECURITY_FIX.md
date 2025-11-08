# Authentication Security Fix

## Issue
The previous implementation had a **critical security vulnerability** where password validation was not being performed during sign-in. The backend's `signInWithEmail` method only checked if a user existed by email without validating the password, allowing anyone to sign in with any password as long as they knew a valid email address.

## Root Cause
- The backend `AuthService.signInWithEmail()` method only called `firebaseAuth.getUserByEmail()` which does not validate passwords
- The Firebase Admin SDK cannot directly validate passwords - that must be done via the Firebase Client SDK
- The frontend was directly calling the backend API without first authenticating with Firebase

## Solution
The authentication flow has been completely redesigned to use proper Firebase Authentication:

### Frontend Changes

#### Sign In (`frontend/app/signin/page.tsx`)
1. **Firebase Client Authentication First**: Now uses `signInWithEmailAndPassword()` from Firebase Client SDK to authenticate the user
2. **Password Validation**: Firebase validates the password on the client side before any backend API call
3. **Token-Based Backend Call**: After successful Firebase authentication, gets an ID token and calls `authService.verifyToken()` to retrieve user profile data
4. **Enhanced Error Handling**: Provides specific error messages for various authentication failures:
   - Invalid credentials
   - User not found
   - Account disabled
   - Too many login attempts

#### Sign Up (`frontend/app/signup/page.tsx`)
1. **Firebase User Creation**: Now uses `createUserWithEmailAndPassword()` to create the user in Firebase first
2. **Display Name Update**: Sets the user's display name in Firebase using `updateProfile()`
3. **Token-Based Profile Creation**: Sends the Firebase ID token to backend to create the Firestore profile
4. **Error Handling**: Handles Firebase errors like email-already-in-use, weak-password, etc.

### Backend Changes

#### AuthService (`backend/src/main/java/.../service/AuthService.java`)
1. **Updated signUpWithEmail()**: Now handles the case where Firebase user might already exist (created by client)
2. **Idempotent Operation**: Checks if user exists first before creating, preventing duplicate creation errors
3. **Consistent Profile Creation**: Ensures Firestore profile exists even if Firebase Auth user was created client-side

### Authentication Flow

#### New Sign In Flow:
```
1. User enters email/password in frontend
2. Frontend validates credentials with Firebase Client SDK (signInWithEmailAndPassword)
3. Firebase validates password and returns authenticated user
4. Frontend gets Firebase ID token
5. Frontend calls backend /api/auth/verify with ID token
6. Backend verifies token and returns user profile data
7. User is logged in with secure, validated credentials
```

#### New Sign Up Flow:
```
1. User enters details in frontend
2. Frontend creates user in Firebase Auth (createUserWithEmailAndPassword)
3. Frontend updates user display name
4. Frontend gets Firebase ID token
5. Frontend calls backend /api/auth/signup to create Firestore profile
6. Backend creates/updates user profile in Firestore
7. User is logged in
```

## Security Improvements
✅ **Password Validation**: Passwords are now properly validated by Firebase before any authentication occurs
✅ **No Password Transmission to Backend**: Passwords are validated by Firebase, backend only receives secure ID tokens
✅ **Token-Based Authentication**: All backend communication uses verified Firebase ID tokens
✅ **Proper Error Messages**: Clear, secure error messages without exposing sensitive information
✅ **Account Protection**: Multiple failed attempts are rate-limited by Firebase

## Testing
To verify the fix:

1. **Test Invalid Password**:
   - Try signing in with a valid email but wrong password
   - Should show: "Invalid email or password. Please try again."
   - Should NOT allow sign in

2. **Test Non-existent User**:
   - Try signing in with an email that doesn't exist
   - Should show: "No account found with this email. Please sign up."

3. **Test Valid Credentials**:
   - Sign in with correct email and password
   - Should successfully authenticate and redirect to home page

4. **Test Sign Up**:
   - Create a new account
   - Should create Firebase Auth user and Firestore profile
   - Should auto-login after successful creation

## Important Notes
- The `/api/auth/signin` endpoint with email/password is now **deprecated** and should not be used directly
- All authentication should go through Firebase Client SDK first
- Firebase configuration must be properly set up in frontend (check `.env.local`)
- Ensure Firebase Authentication is enabled in Firebase Console

## Migration for Existing Integrations
If you have any direct API calls to `/api/auth/signin`:
1. Update to use Firebase Client SDK for authentication
2. Get Firebase ID token after authentication
3. Call `/api/auth/verify` with the token instead

## Date Fixed
November 8, 2025
