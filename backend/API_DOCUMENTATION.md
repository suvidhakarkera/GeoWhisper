# GeoWhisper Authentication API Documentation

This document provides detailed information about the authentication endpoints available in the GeoWhisper backend service.

## Base URL

```
/api/auth
```

## Authentication Endpoints

### 1. Health Check

Check if the authentication service is running.

- **URL:** `/api/auth/health`
- **Method:** `GET`
- **Success Response:**
  - **Code:** 200
  - **Content:** `"✅ GeoWhisper Auth Service is running!"`

### 2. Sign Up with Email and Password

Create a new user account using email and password.

- **URL:** `/api/auth/signup`
- **Method:** `POST`
- **Content-Type:** `application/json`

- **Request Body:**

  ```json
  {
    "email": "john.doe@example.com",
    "password": "SecurePass123",
    "username": "johndoe"
  }
  ```

- **Request Parameters:**
  | Parameter | Type | Required | Description |
  |-----------|------|----------|-------------|
  | email | string | Yes | Valid email address |
  | password | string | Yes | Password (minimum 6 characters) |
  | username | string | Yes | Username (3-30 characters) |

- **Success Response:**

  - **Code:** 200
  - **Content:**
    ```json
    {
      "firebaseUid": "abc123xyz789firebaseuid",
      "idToken": "eyJhbGciOiJSUzI1NiIsImtpZCI6IjFlOWdkazcifQ...",
      "email": "john.doe@example.com",
      "username": "johndoe"
    }
    ```

- **Error Response:**
  - **Code:** 400
  - **Content:**
    ```json
    {
      "success": false,
      "message": "User already exists"
    }
    ```

### 3. Sign In with Email

Sign in an existing user with email.

- **URL:** `/api/auth/signin`
- **Method:** `POST`
- **Content-Type:** `application/json`

- **Request Body:**

  ```json
  {
    "email": "john.doe@example.com",
    "password": "SecurePass123"
  }
  ```

- **Request Parameters:**
  | Parameter | Type | Required | Description |
  |-----------|------|----------|-------------|
  | email | string | Yes | Registered email address |
  | password | string | Yes | Account password |

- **Success Response:**

  - **Code:** 200
  - **Content:**
    ```json
    {
      "firebaseUid": "abc123xyz789firebaseuid",
      "idToken": "eyJhbGciOiJSUzI1NiIsImtpZCI6IjFlOWdkazcifQ...",
      "email": "john.doe@example.com",
      "username": "johndoe"
    }
    ```

- **Error Response:**
  - **Code:** 401
  - **Content:**
    ```json
    {
      "success": false,
      "message": "Invalid credentials or user not found"
    }
    ```

### 4. Google Sign In/Sign Up

Authenticate user with Google Sign-In using Firebase ID token.

- **URL:** `/api/auth/google`
- **Method:** `POST`
- **Content-Type:** `application/json`

- **Request Body:**

  ```json
  {
    "idToken": "google-firebase-id-token"
  }
  ```

- **Request Parameters:**
  | Parameter | Type | Required | Description |
  |-----------|------|----------|-------------|
  | idToken | string | Yes | Firebase ID token from Google Sign-In |

- **Success Response:**

  - **Code:** 200
  - **Content:**
    ```json
    {
      "firebaseUid": "abc123xyz789firebaseuid",
      "idToken": "eyJhbGciOiJSUzI1NiIsImtpZCI6IjFlOWdkazcifQ...",
      "email": "john.doe@example.com",
      "username": "johndoe"
    }
    ```

- **Error Response:**
  - **Code:** 401
  - **Content:**
    ```json
    {
      "success": false,
      "message": "Invalid Google token"
    }
    ```

## Important Notes

1. Password validation is performed on the client side using the Firebase Client SDK.
2. All successful authentication responses include a Firebase ID token that should be included in subsequent API requests.
3. The Firebase ID token should be included in the Authorization header as a Bearer token for authenticated requests.
4. Tokens expire after 1 hour and need to be refreshed using the Firebase Client SDK.

## Error Codes

| Status Code | Description                            |
| ----------- | -------------------------------------- |
| 200         | Success                                |
| 400         | Bad Request - Invalid input parameters |
| 401         | Unauthorized - Invalid credentials     |
| 500         | Internal Server Error                  |
