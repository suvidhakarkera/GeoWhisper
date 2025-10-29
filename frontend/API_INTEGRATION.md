# API Integration Documentation

## Overview
This document describes the integration between the GeoWhisper frontend and backend APIs.

## Backend API Base URL
- **Development**: `http://localhost:8080`
- **Production**: Set via `NEXT_PUBLIC_API_BASE_URL` environment variable

## Configuration

### Environment Variables
Create a `.env.local` file in the frontend root directory:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080
```

If not set, the default base URL is `http://localhost:8080`.

## Authentication Endpoints

### 1. Sign Up
- **Endpoint**: `POST /api/auth/signup`
- **Request Body**:
  ```json
  {
    "email": "user@example.com",
    "password": "SecurePass123",
    "username": "john_doe"
  }
  ```
- **Response**:
  ```json
  {
    "firebaseUid": "abc123xyz789",
    "idToken": "eyJhbGciOiJSUzI1NiIs...",
    "email": "user@example.com",
    "username": "john_doe",
    "isNewUser": true,
    "message": "Sign up successful"
  }
  ```

### 2. Sign In
- **Endpoint**: `POST /api/auth/signin`
- **Request Body**:
  ```json
  {
    "email": "user@example.com",
    "password": "SecurePass123"
  }
  ```
- **Response**:
  ```json
  {
    "firebaseUid": "abc123xyz789",
    "idToken": "eyJhbGciOiJSUzI1NiIs...",
    "email": "user@example.com",
    "username": "john_doe",
    "isNewUser": false,
    "message": "Sign in successful"
  }
  ```

### 3. Google Authentication
- **Endpoint**: `POST /api/auth/google`
- **Request Body**:
  ```json
  {
    "idToken": "google-firebase-id-token"
  }
  ```

### 4. Verify Token
- **Endpoint**: `POST /api/auth/verify`
- **Headers**: `Authorization: Bearer <idToken>`

### 5. Get User Profile
- **Endpoint**: `GET /api/auth/profile/{firebaseUid}`

### 6. Update User Profile
- **Endpoint**: `PATCH /api/auth/profile/{firebaseUid}`
- **Request Body**: JSON object with fields to update

### 7. Delete User Account
- **Endpoint**: `DELETE /api/auth/profile/{firebaseUid}`

## Frontend Implementation

### File Structure
```
frontend/
├── src/
│   ├── config/
│   │   └── api.ts              # API configuration and base URL
│   ├── types/
│   │   └── auth.ts             # TypeScript types matching backend DTOs
│   └── services/
│       └── authService.ts      # Authentication service with API calls
├── app/
│   ├── signin/
│   │   └── page.tsx            # Sign-in page with API integration
│   └── signup/
│       └── page.tsx            # Sign-up page with API integration
```

### Usage Example

#### Sign In
```typescript
import { authService } from '@/services/authService';

const handleSignIn = async (email: string, password: string) => {
  try {
    const response = await authService.signIn({ email, password });
    // Store auth data
    localStorage.setItem('authToken', response.idToken);
    localStorage.setItem('firebaseUid', response.firebaseUid);
    // Redirect to dashboard
    router.push('/');
  } catch (error) {
    console.error('Sign in failed:', error.message);
  }
};
```

#### Sign Up
```typescript
import { authService } from '@/services/authService';

const handleSignUp = async (email: string, password: string, username: string) => {
  try {
    const response = await authService.signUp({ email, password, username });
    // Store auth data
    localStorage.setItem('authToken', response.idToken);
    localStorage.setItem('firebaseUid', response.firebaseUid);
    // Redirect to dashboard
    router.push('/');
  } catch (error) {
    console.error('Sign up failed:', error.message);
  }
};
```

## Authentication Flow

1. **User submits credentials** → Frontend validates input
2. **Frontend calls API** → POST to `/api/auth/signin` or `/api/auth/signup`
3. **Backend processes** → Validates with Firebase Auth and Firestore
4. **Backend returns response** → Includes `idToken`, `firebaseUid`, and user data
5. **Frontend stores auth data** → In localStorage (remember me) or sessionStorage
6. **Frontend redirects** → To home page or dashboard

## Error Handling

All API errors are caught and displayed to the user:
- Invalid credentials
- Email already exists
- Weak password
- Network errors
- Server errors

Error messages are shown in a red alert box above the form.

## Loading States

Both sign-in and sign-up pages show loading states:
- Disabled form inputs during submission
- Loading spinner in submit button
- "Signing In..." or "Creating Account..." text

## Security Considerations

1. **HTTPS in Production**: Always use HTTPS for API calls in production
2. **Token Storage**: Tokens are stored in localStorage (remember me) or sessionStorage
3. **CORS**: Backend must have proper CORS configuration for the frontend domain
4. **Password Requirements**: Minimum 6 characters (enforced by backend)

## Testing

### Prerequisites
1. Backend server running on `http://localhost:8080`
2. Firebase configured in backend
3. Frontend running on `http://localhost:3000`

### Test Sign Up
1. Navigate to `/signup`
2. Fill in first name, last name, email, and password
3. Click "Create Account"
4. Should redirect to home page on success

### Test Sign In
1. Navigate to `/signin`
2. Fill in email and password
3. Click "Sign In"
4. Should redirect to home page on success

## Troubleshooting

### CORS Errors
If you see CORS errors, ensure the backend has proper CORS configuration:
```java
@CrossOrigin(origins = "http://localhost:3000")
```

### Connection Refused
Ensure the backend server is running on port 8080:
```bash
# In backend directory
./mvnw spring-boot:run
```

### 404 Not Found
Verify the API endpoints match the backend controller mappings.

## Future Enhancements

- [ ] Implement Google Sign-In integration
- [ ] Add password reset functionality
- [ ] Implement token refresh mechanism
- [ ] Add email verification flow
- [ ] Create authentication context/provider
- [ ] Add protected route wrapper
