# Map Feature Setup Guide

## Overview

This implementation includes:

- Interactive Mapbox map with user location
- 500-meter radius visualization
- Geolocation permission handling
- Post creation modal with location capture
- Floating "+" button for creating posts
- Full responsive design (mobile & desktop)

## Prerequisites

✅ Packages installed:

- `mapbox-gl`
- `react-map-gl`
- `@turf/turf`

## Setup Instructions

### 1. Get Mapbox Access Token

1. Go to https://account.mapbox.com/
2. Sign up for a free account (or log in)
3. Navigate to "Access tokens" section
4. Create a new token or copy your default token
5. Add it to your `.env.local` file:

```bash
NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN=pk.your_actual_token_here
```

### 2. Restart Development Server

After adding the Mapbox token, restart your dev server:

```bash
npm run dev
```

### 3. Enable Location Permissions

When you visit the `/maps` page:

1. Browser will ask for location permission
2. Click "Allow" to enable location access
3. The map will center on your location with a 500m radius

## Features Implemented

### MapView Component (`components/MapView.tsx`)

- ✅ Real-time user location tracking
- ✅ Geolocation permission handling
- ✅ 500-meter radius circle visualization
- ✅ User location marker with animation
- ✅ Location info card
- ✅ Error handling for all edge cases:
  - Permission denied
  - Location unavailable
  - Timeout
  - Browser not supporting geolocation
  - Missing Mapbox token

### PostCreationModal Component (`components/PostCreationModal.tsx`)

- ✅ Content textarea with character limit (500 chars)
- ✅ Image upload with preview
- ✅ Image validation (type & size)
- ✅ Location capture from user's current position
- ✅ Form validation
- ✅ Loading states
- ✅ Error handling
- ✅ ESC key to close
- ✅ Click outside to close

### FloatingCreateButton Component (`components/FloatingCreateButton.tsx`)

- ✅ Animated floating "+" button
- ✅ Positioned bottom-right
- ✅ Pulsing ring animation
- ✅ Hover and tap animations
- ✅ Disabled state when location unavailable
- ✅ Smooth entrance animation

### Maps Page (`app/maps/page.tsx`)

- ✅ Full-screen map layout
- ✅ Integrates all components
- ✅ Authentication check (redirects to sign-in if not logged in)
- ✅ Dynamic import to avoid SSR issues
- ✅ Loading state
- ✅ Post submission handler (ready for backend integration)

## Edge Cases Handled

### Geolocation

- ✅ Browser doesn't support geolocation
- ✅ User denies permission
- ✅ Location unavailable
- ✅ Timeout errors
- ✅ Low accuracy warnings
- ✅ Permission revoked after initial grant

### Modal

- ✅ Empty content validation
- ✅ Character limit enforcement
- ✅ Image file type validation
- ✅ Image size limit (5MB max)
- ✅ Form reset on close
- ✅ Disabled during submission
- ✅ Location unavailable handling

### Map

- ✅ Missing Mapbox token
- ✅ Map loading errors
- ✅ SSR compatibility
- ✅ Responsive layout

### Authentication

- ✅ Redirect to sign-in if not authenticated
- ✅ Disable create button if no location
- ✅ Proper state management

## Usage

### Creating a Post

1. Navigate to `/maps` page
2. Allow location access when prompted
3. Click the floating "+" button (bottom-right)
4. Enter your content (max 500 characters)
5. Optionally add an image
6. Click "Post" to submit

### Navigation

- Click "Maps" in navbar to access map page
- Click "Get Started Now" on homepage (redirects based on auth status)

## Mobile Responsiveness

- ✅ Touch-friendly controls
- ✅ Responsive text sizes
- ✅ Adaptive padding and margins
- ✅ Mobile-optimized modal
- ✅ Floating button positioned for thumb access

## Backend Integration (TODO)

The `handlePostSubmit` function in `maps/page.tsx` is ready for backend integration:

```typescript
const handlePostSubmit = async (postData: PostData) => {
  const response = await fetch("/api/posts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(postData),
  });

  if (!response.ok) throw new Error("Failed to create post");
  return response.json();
};
```

## Troubleshooting

### Map not showing

- Check if `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN` is set in `.env.local`
- Restart dev server after adding token
- Check browser console for errors

### Location not working

- Check browser location permissions
- Try in HTTPS (required for geolocation in some browsers)
- Check if location services are enabled on device

### Modal not opening

- Check if user is authenticated
- Check if location is available
- Check browser console for errors

## File Structure

```
frontend/
├── app/
│   └── maps/
│       └── page.tsx           # Main maps page
├── components/
│   ├── MapView.tsx            # Map component with location
│   ├── PostCreationModal.tsx  # Post creation modal
│   └── FloatingCreateButton.tsx # Floating + button
├── types/
│   └── map.ts                 # TypeScript type definitions
└── .env.local                 # Environment variables
```

## Notes

- The map uses Mapbox dark theme for consistency with the app design
- All animations use Framer Motion for smooth UX
- Location accuracy is displayed to user
- 500-meter radius is calculated using Turf.js
