# 🎨 GeoWhisper Frontend

<div align="center">

![Next.js](https://img.shields.io/badge/Next.js-16.0-black?style=for-the-badge&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?style=for-the-badge&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.0-38B2AC?style=for-the-badge&logo=tailwind-css)

**Modern, responsive frontend for GeoWhisper location-based social platform**

</div>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Tech Stack](#-tech-stack)
- [Getting Started](#-getting-started)
- [Project Structure](#-project-structure)
- [Configuration](#-configuration)
- [Available Scripts](#-available-scripts)
- [Features](#-features)
- [Environment Variables](#-environment-variables)
- [Performance](#-performance)
- [Deployment](#-deployment)

---

## 🎯 Overview

The GeoWhisper frontend is a Next.js 16 application built with TypeScript and React 19. It provides an intuitive, map-based interface for location-based social interactions with real-time chat, post creation, and dynamic hot zone visualization.

---

## 🛠️ Tech Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| **Next.js** | 16.0 | React framework with App Router |
| **React** | 19.2 | UI library |
| **TypeScript** | 5.x | Type-safe JavaScript |
| **Tailwind CSS** | 4.0 | Utility-first CSS framework |
| **Mapbox GL** | 3.1 | Interactive map rendering |
| **Leaflet** | 1.9 | Alternative map library for post views |
| **Framer Motion** | 12.x | Animation library |
| **Firebase** | 12.5 | Authentication and storage |
| **Lucide React** | Latest | Icon library |

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** 20.x or higher
- **npm** 9.x or higher
- **Firebase Project** with Authentication and Storage enabled
- **Mapbox Account** with access token

### Installation

1. **Clone the repository**
   ```bash
   cd GeoWhisper/frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp env.example .env.local
   ```

4. **Configure `.env.local`** (see [Environment Variables](#-environment-variables))

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   
   Navigate to [http://localhost:3000](http://localhost:3000)

---

## 📁 Project Structure

```
frontend/
├── app/                        # Next.js App Router
│   ├── layout.tsx             # Root layout
│   ├── page.tsx               # Home page
│   ├── auth-debug/            # Auth debugging page
│   ├── create-post/           # Post creation page
│   ├── feed/                  # Main feed page
│   ├── forgot-password/       # Password recovery
│   ├── maps/                  # Interactive map page
│   ├── my-posts/              # User's posts
│   ├── nearby/                # Nearby posts
│   ├── profile/               # User profile
│   ├── reset-password/        # Password reset
│   ├── signin/                # Sign in page
│   ├── signup/                # Sign up page
│   └── globals.css            # Global styles
│
├── components/                 # React components
│   ├── FloatingCreateButton.tsx
│   ├── Footer.tsx
│   ├── MapView.tsx            # Main map component (Mapbox)
│   ├── MiniMap.tsx            # Small map preview
│   ├── Navbar.tsx
│   ├── PostCard.tsx
│   ├── PostCreationModal.tsx
│   ├── PostsMap.tsx           # Post map view (Leaflet)
│   ├── ThemeProvider.tsx
│   ├── ToastContext.tsx
│   ├── TowerChat.tsx          # Real-time chat component
│   ├── TowerIcon.tsx
│   └── TowerImagesModal.tsx
│
├── src/
│   ├── components/            # Additional components
│   │   ├── GoogleSignInButton.tsx
│   │   └── ThemeProvider.jsx
│   │
│   ├── config/                # Configuration files
│   │   ├── api.ts            # API base URL config
│   │   └── firebase.ts       # Firebase configuration
│   │
│   ├── contexts/              # React contexts
│   │   └── UserContext.tsx   # User authentication context
│   │
│   ├── hooks/                 # Custom React hooks
│   │   └── useAuth.ts        # Authentication hook
│   │
│   ├── services/              # API service layers
│   │   ├── authService.ts    # Authentication API
│   │   ├── chatService.ts    # Chat API
│   │   ├── locationService.ts # Location API
│   │   └── postService.ts    # Posts API
│   │
│   ├── types/                 # TypeScript type definitions
│   │   └── auth.ts
│   │
│   └── utils/                 # Utility functions
│       ├── towerLabel.ts     # Tower naming utilities
│       └── towerNumber.ts    # Tower ID utilities
│
├── types/                     # Global type declarations
│   ├── geojson-vt.d.ts
│   ├── leaflet.d.ts
│   ├── map.ts
│   └── third-party.d.ts
│
├── public/                    # Static assets
├── .env.local                 # Environment variables (create this)
├── env.example                # Environment template
├── next.config.ts             # Next.js configuration
├── tailwind.config.ts         # Tailwind configuration
├── tsconfig.json              # TypeScript configuration
└── package.json               # Dependencies and scripts
```

---

## ⚙️ Configuration

### Firebase Setup

1. **Create a Firebase Project**
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Create a new project or use existing
   - Enable Authentication (Email/Password and Google)
   - Enable Cloud Firestore
   - Enable Storage

2. **Get Configuration Values**
   - Navigate to Project Settings > General
   - Scroll to "Your apps" section
   - Click on Web app configuration
   - Copy the config values to `.env.local`

### Mapbox Setup

1. **Create Mapbox Account**
   - Go to [Mapbox](https://www.mapbox.com/)
   - Sign up for a free account

2. **Get Access Token**
   - Navigate to Account > Access Tokens
   - Copy your default public token
   - Add to `.env.local` as `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN`

---

## 📜 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server on http://localhost:3000 |
| `npm run build` | Create production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint for code quality |

---

## ✨ Features

### 🗺️ Interactive Maps
- **Dual Map Support**: Mapbox GL for main views, Leaflet for posts
- **Real-time Location**: Continuous user location tracking
- **Viewport Optimization**: Only renders visible towers
- **Custom Markers**: Animated tower icons with engagement indicators

### 📍 Location-Based Posts
- **500m Radius**: Posts visible only within proximity
- **Image Upload**: Firebase Storage integration
- **Clustering**: Automatic tower-based organization
- **Real-time Updates**: Live post feed

### 💬 Real-time Chat
- **Tower Chats**: Location-based chat rooms
- **Access Control**: Chat only when physically present
- **Live Messaging**: Real-time message delivery
- **User Presence**: See who's in the tower

### 🔥 Hot Zones
- **Top 5 Detection**: Most active areas within 5km
- **Visual Heatmaps**: Animated glow effects
- **Engagement Metrics**: Ranked by post count
- **Dynamic Updates**: Recalculates based on location

### 🔐 Authentication
- **Email/Password**: Standard authentication
- **Google Sign-In**: OAuth integration
- **Password Reset**: Email-based recovery
- **Session Management**: JWT tokens with refresh

### 🎨 UI/UX
- **Dark Theme**: Modern dark mode design
- **Responsive**: Mobile-first approach
- **Animations**: Smooth Framer Motion transitions
- **Toast Notifications**: User feedback system

---

## 🔐 Environment Variables

Create a `.env.local` file in the frontend directory:

```env
# Backend API
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080

# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXX
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789012
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789012:web:abcdef123456

# Mapbox
NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN=pk.eyJ1IjoieW91cnVzZXJuYW1lIiwiYSI6ImFiY2RlZjEyMzQ1Njc4OTAifQ.XXXXXXXXXXXXXXXXXXXX
```

### Getting Firebase Config

1. Firebase Console → Project Settings → General
2. Scroll to "Your apps" → Web app
3. Copy config values

### Getting Mapbox Token

1. Mapbox Dashboard → Account → Access Tokens
2. Copy your default public token

---

## ⚡ Performance

### Optimizations Implemented

1. **Reduced Data Load**
   - Fetches 200 posts instead of 1000 (80% reduction)
   - Session storage caching (10-minute TTL)

2. **Memoized Calculations**
   - Hot zone calculations use `useMemo`
   - Distance calculations cached
   - Prevents unnecessary re-renders

3. **Viewport Filtering**
   - Only renders visible towers
   - Hot zones always visible
   - Reduces DOM nodes significantly

4. **Code Splitting**
   - Dynamic imports for map components
   - Lazy loading for heavy libraries
   - Reduced initial bundle size

5. **Image Optimization**
   - Next.js Image component
   - Firebase Storage CDN
   - Responsive images

### Performance Metrics

- **Initial Load**: ~2-3s (optimized)
- **Time to Interactive**: ~3-4s
- **First Contentful Paint**: ~1-2s
- **Bundle Size**: ~500KB gzipped

---

## 🚢 Deployment

### Vercel (Recommended)

1. **Connect Repository**
   ```bash
   # Push to GitHub
   git push origin main
   ```

2. **Deploy to Vercel**
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Click "New Project"
   - Import your GitHub repository
   - Configure build settings:
     - **Framework**: Next.js
     - **Root Directory**: `frontend`
     - **Build Command**: `npm run build`
     - **Output Directory**: `.next`

3. **Set Environment Variables**
   - Add all variables from `.env.local`
   - Use Vercel dashboard: Settings → Environment Variables

4. **Deploy**
   - Vercel auto-deploys on push to main
   - Preview deployments for PRs

### Other Platforms

#### Netlify
```bash
npm run build
# Deploy .next directory
```

#### Railway
```bash
# Connect GitHub repo
# Set environment variables
# Deploy with auto-scaling
```

### Production Checklist

- [ ] Environment variables configured
- [ ] Firebase production project setup
- [ ] Mapbox production token
- [ ] CORS enabled on backend
- [ ] Analytics configured (optional)
- [ ] Error tracking setup (optional)

---

## 🐛 Troubleshooting

### Common Issues

**Maps not loading**
- ✅ Check `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN` is set
- ✅ Verify token is valid in Mapbox dashboard
- ✅ Check browser console for errors

**Authentication failing**
- ✅ Verify Firebase config in `.env.local`
- ✅ Check Firebase Console for enabled auth methods
- ✅ Ensure backend is running on correct port

**Location not working**
- ✅ Grant location permissions in browser
- ✅ Use HTTPS in production (required for geolocation)
- ✅ Check browser compatibility

**Build errors**
- ✅ Delete `.next` folder and `node_modules`
- ✅ Run `npm install` again
- ✅ Check Node.js version (20+)

---

## 📚 Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [React 19 Documentation](https://react.dev/)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Mapbox GL JS](https://docs.mapbox.com/mapbox-gl-js/)
- [Firebase Web SDK](https://firebase.google.com/docs/web/setup)

---

## 🤝 Contributing

See the main [Contributing Guide](../README.md#-contributing) in the root directory.

---

## 📝 License

MIT License - see [LICENSE](../LICENSE) for details

---

<div align="center">

**[⬆ Back to Top](#-geowhisper-frontend)**

Part of the [GeoWhisper](../README.md) project

</div>
