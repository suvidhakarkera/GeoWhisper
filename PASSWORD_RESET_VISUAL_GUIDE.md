# Password Reset - Visual User Journey

## 📧 Step 1: Request Password Reset

**URL**: `/forgot-password`

```
┌─────────────────────────────────────────┐
│          Forgot Password?               │
│                                         │
│  No worries! Enter your email and       │
│  we'll send you reset instructions      │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ 📧 Email Address                │   │
│  │ you@example.com                 │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ℹ️  We'll send you an email with a    │
│      link to reset your password.      │
│      The link will expire in 1 hour.   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │   Send Reset Link ➡️             │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ⬅️ Back to Sign In                    │
│  Don't have an account? Sign up        │
└─────────────────────────────────────────┘
```

### What Happens:
- User enters their email address
- Clicks "Send Reset Link"
- Firebase sends an email with a secure reset link
- User sees success confirmation

---

## ✅ Step 2: Success Confirmation

```
┌─────────────────────────────────────────┐
│                                         │
│           ✅ (Green Circle)             │
│                                         │
│        Check Your Email                 │
│                                         │
│  We've sent a password reset link to    │
│                                         │
│       user@example.com                  │
│                                         │
│  ℹ️  Didn't receive the email? Check   │
│      your spam folder or try again     │
│      in a few minutes.                 │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │  ⬅️ Back to Sign In              │   │
│  └─────────────────────────────────┘   │
│                                         │
│     Try a different email               │
└─────────────────────────────────────────┘
```

### What Happens:
- Confirmation message displayed
- User's email shown
- Options to go back or try different email

---

## 📬 Step 3: Email Received

**From**: `noreply@geowhisper-1.firebaseapp.com`  
**Subject**: Reset your password for GeoWhisper

```
┌────────────────────────────────────────────┐
│  Hello,                                    │
│                                            │
│  We received a request to reset your       │
│  password for your GeoWhisper account.     │
│                                            │
│  Click the link below to reset your        │
│  password:                                 │
│                                            │
│  [Reset My Password]  ← Click this!        │
│                                            │
│  This link will expire in 1 hour.          │
│                                            │
│  If you didn't request this, you can       │
│  safely ignore this email.                 │
│                                            │
│  Thanks,                                   │
│  The GeoWhisper Team                       │
└────────────────────────────────────────────┘
```

### What Happens:
- User receives email from Firebase
- Email contains secure reset link
- Link expires after 1 hour
- One-time use only

---

## 🔐 Step 4: Reset Password Form

**URL**: `/reset-password?oobCode=xxxxx&mode=resetPassword`

```
┌─────────────────────────────────────────┐
│        Reset Your Password              │
│                                         │
│       Enter your new password           │
│       For account: user@example.com     │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ 🔒 New Password                 │   │
│  │ ••••••••••                  👁️  │   │
│  └─────────────────────────────────┘   │
│  Must be at least 6 characters long    │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ 🔒 Confirm Password             │   │
│  │ ••••••••••                  👁️  │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ℹ️  Make sure your new password is    │
│      strong and unique.                │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │    Change Password              │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ⬅️ Back to Sign In                    │
└─────────────────────────────────────────┘
```

### What Happens:
- Form verifies reset code automatically
- Shows user's email for confirmation
- Two password fields with show/hide toggle
- Validates password strength
- Checks passwords match

---

## ✅ Step 5: Password Reset Success

```
┌─────────────────────────────────────────┐
│                                         │
│           ✅ (Green Circle)             │
│                                         │
│    Password Reset Successful!           │
│                                         │
│  Your password has been successfully    │
│  reset. You can now sign in with your   │
│  new password.                          │
│                                         │
│  ℹ️  Redirecting to sign in page in    │
│      a few seconds...                  │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │  ⬅️ Go to Sign In                │   │
│  └─────────────────────────────────┘   │
└─────────────────────────────────────────┘
```

### What Happens:
- Success message displayed
- Auto-redirect after 3 seconds
- User can click to go immediately
- Password is updated in Firebase

---

## 🔑 Step 6: Sign In with New Password

**URL**: `/signin`

```
┌─────────────────────────────────────────┐
│          Welcome Back!                  │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ 📧 Email                        │   │
│  │ user@example.com                │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ 🔒 Password (NEW!)              │   │
│  │ ••••••••••                  👁️  │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │         Sign In                 │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ✅ Successfully logged in!             │
└─────────────────────────────────────────┘
```

### What Happens:
- User enters email and NEW password
- Successful login
- User is authenticated
- Old password no longer works

---

## ❌ Error Scenarios

### Invalid Email
```
┌─────────────────────────────────────────┐
│  ❌ No account found with this email   │
│      address.                          │
└─────────────────────────────────────────┘
```

### Expired Link
```
┌─────────────────────────────────────────┐
│              ⚠️                         │
│        Invalid Reset Link               │
│                                         │
│  This password reset link has expired.  │
│  Please request a new one.              │
│                                         │
│  [Request New Reset Link]               │
└─────────────────────────────────────────┘
```

### Password Mismatch
```
┌─────────────────────────────────────────┐
│  🔒 Confirm Password                    │
│  ••••••••••                             │
│  ❌ Passwords do not match             │
└─────────────────────────────────────────┘
```

### Weak Password
```
┌─────────────────────────────────────────┐
│  🔒 New Password                        │
│  •••                                    │
│  ❌ Password must be at least 6        │
│      characters                         │
└─────────────────────────────────────────┘
```

### Rate Limited
```
┌─────────────────────────────────────────┐
│  ❌ Too many attempts. Please try      │
│      again later.                      │
└─────────────────────────────────────────┘
```

---

## 🔒 Security Features Visualization

```
Email Sent ──┬──> Only to registered email
             │
Reset Link ──┼──> Cryptographically secure
             │
             ├──> One-time use only
             │
             ├──> Expires in 1 hour
             │
             └──> HTTPS only in production

Password ────┬──> Minimum 6 characters
             │
             ├──> Firebase validation
             │
             └──> Stored securely (hashed)
```

---

## 📱 Responsive Design

The pages work beautifully on all devices:

```
Desktop (1920px)        Tablet (768px)       Mobile (375px)
┌──────────────┐       ┌─────────┐          ┌────┐
│              │       │         │          │    │
│   Form       │       │  Form   │          │Form│
│   Wide       │       │ Medium  │          │Slim│
│              │       │         │          │    │
└──────────────┘       └─────────┘          └────┘
```

---

## 🎨 Color Scheme

```
Background:      Black (#000000)
Cards:           Gray-900 to Gray-800 gradient
Borders:         Gray-700
Text:            F2F3F5 (headings), Gray-400 (body)
Accent:          Cyan-400 (links, focus)
Success:         Green-400
Error:           Red-400
Info:            Cyan-500/10 (background)
```

---

## ⌨️ Keyboard Navigation

All forms are fully keyboard accessible:

```
Tab        → Move to next field
Shift+Tab  → Move to previous field
Enter      → Submit form
Space      → Toggle password visibility
Esc        → (Future: Close modals)
```

---

## 🔄 Loading States

### Sending Email
```
┌─────────────────────────────────────┐
│  [⟳]  Sending...                   │
└─────────────────────────────────────┘
```

### Verifying Code
```
┌─────────────────────────────────────┐
│  [⟳]  Verifying reset link...      │
└─────────────────────────────────────┘
```

### Resetting Password
```
┌─────────────────────────────────────┐
│  [⟳]  Resetting Password...        │
└─────────────────────────────────────┘
```

---

## 📊 User Flow Summary

```
START
  │
  ├─> Forgot Password Page
  │     │
  │     ├─> Enter Email
  │     │
  │     ├─> Click "Send Reset Link"
  │     │
  │     └─> Success Screen
  │
  ├─> Check Email
  │     │
  │     └─> Click Reset Link in Email
  │
  ├─> Reset Password Page
  │     │
  │     ├─> Verify Code (automatic)
  │     │
  │     ├─> Enter New Password
  │     │
  │     ├─> Confirm Password
  │     │
  │     ├─> Click "Change Password"
  │     │
  │     └─> Success Screen
  │
  ├─> Auto-Redirect (3 seconds)
  │
  └─> Sign In Page
        │
        ├─> Enter Email & NEW Password
        │
        └─> SUCCESS! 🎉
```

---

## 🎯 Quick Test Checklist

1. ✅ Visit `/forgot-password`
2. ✅ Enter valid email
3. ✅ See success message
4. ✅ Check email inbox
5. ✅ Click reset link
6. ✅ See reset form
7. ✅ Enter new password (twice)
8. ✅ See success message
9. ✅ Auto-redirect to signin
10. ✅ Login with new password

**Expected Time**: 2-3 minutes per test

---

This visual guide should help you understand exactly what users will experience at each step of the password reset flow!
