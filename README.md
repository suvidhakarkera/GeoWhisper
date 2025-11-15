# 🌍 GeoWhisper

<div align="center">

![GeoWhisper Banner](https://img.shields.io/badge/GeoWhisper-Location%20Based%20Social-00D9FF?style=for-the-badge)

**A location-based social platform where proximity creates community**

[![Next.js](https://img.shields.io/badge/Next.js-16.0-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.5.7-green?style=flat-square&logo=spring)](https://spring.io/projects/spring-boot)
[![Firebase](https://img.shields.io/badge/Firebase-Latest-orange?style=flat-square&logo=firebase)](https://firebase.google.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)

[Features](#-features) • [Quick Start](#-quick-start) • [Architecture](#-architecture) • [Documentation](#-documentation)

</div>

---

## 📖 Overview

GeoWhisper is a next-generation location-based social platform that connects people through geographic proximity. Share posts, join real-time chats, and discover what's happening around you - all within 500 meters of your location.

### ✨ Key Features

- 🗺️ **Interactive Maps** - Real-time visualization with Mapbox GL and Leaflet
- 📍 **Location-Based Posts** - Create and view posts within 500m radius
- 💬 **Tower Chats** - Real-time messaging in geographic zones
- 🔥 **Hot Zones** - Discover the most active areas with visual heatmaps
- 🔐 **Secure Authentication** - Firebase-powered user management
- 📸 **Media Sharing** - Image upload with Firebase Storage
- 🎨 **Modern UI** - Dark theme with Tailwind CSS and Framer Motion
- 🚀 **Real-time Updates** - Live chat and post updates

---

## 🏗️ Architecture

```
GeoWhisper/
├── frontend/          # Next.js 16 + TypeScript + Tailwind CSS
│   ├── app/          # Next.js App Router pages
│   ├── components/   # React components
│   ├── src/
│   │   ├── config/   # Firebase & API configuration
│   │   ├── services/ # API service layers
│   │   ├── contexts/ # React contexts
│   │   └── utils/    # Utility functions
│   └── public/       # Static assets
│
└── backend/          # Spring Boot 3.5.7 + Java 21
    ├── src/main/
    │   ├── java/     # Java source code
    │   └── resources/
    │       ├── application.properties
    │       └── firebase-key.json
    └── pom.xml       # Maven dependencies
```

### 🔧 Tech Stack

#### Frontend
- **Framework:** Next.js 16 (React 19)
- **Language:** TypeScript
- **Styling:** Tailwind CSS 4
- **Maps:** Mapbox GL, React Leaflet
- **Animation:** Framer Motion
- **State:** React Context API
- **Auth:** Firebase Authentication

#### Backend
- **Framework:** Spring Boot 3.5.7
- **Language:** Java 21
- **Database:** Firebase Firestore
- **Storage:** Firebase Storage
- **AI:** Spring AI with OpenAI GPT-3.5
- **Security:** Spring Security + JWT

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** 20+ and npm
- **Java** 21+
- **Maven** 3.8+
- **Firebase Project** (with Firestore & Storage enabled)
- **Mapbox Account** (for maps API)
- **OpenAI API Key** (optional, for AI features)

### 1️⃣ Clone the Repository

```bash
git clone https://github.com/Sankirthan-R/GeoWhisper.git
cd GeoWhisper
```

### 2️⃣ Setup Backend

```bash
cd backend

# Copy environment template
cp .env.example .env

# Add your Firebase Storage Bucket to .env
# FIREBASE_STORAGE_BUCKET=your-project-id.firebasestorage.app

# Download your Firebase Admin SDK key from Firebase Console
# Place it at: src/main/resources/firebase-key.json

# Update application.properties with your OpenAI key

# Run the application
./mvnw spring-boot:run
```

Backend will start at `http://localhost:8080`

### 3️⃣ Setup Frontend

```bash
cd frontend

# Install dependencies
npm install

# Copy environment template
cp env.example .env.local

# Configure your environment variables in .env.local:
# - NEXT_PUBLIC_API_BASE_URL=http://localhost:8080
# - NEXT_PUBLIC_FIREBASE_* (from Firebase Console)
# - NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN (from Mapbox)

# Run development server
npm run dev
```

Frontend will start at `http://localhost:3000`

### 4️⃣ Access the Application

Open [http://localhost:3000](http://localhost:3000) in your browser and allow location access when prompted.

---

## 📚 Documentation

- [Frontend Setup Guide](./frontend/README.md) - Detailed frontend configuration
- [Backend Setup Guide](./backend/README.md) - Detailed backend configuration
- [Performance Optimizations](./PERFORMANCE_OPTIMIZATIONS.md) - Map performance improvements

---

## 🎯 Features in Detail

### 📍 Location-Based Posts
Create posts that are visible only to users within 500 meters. Posts automatically cluster into "towers" for efficient loading and organization.

### 💬 Tower Chats
Real-time messaging within geographic zones (towers). Chat access is granted when you're physically present in the tower's radius.

### 🔥 Hot Zones
Visual heatmap showing the top 5 most active areas within 5km. Zones are ranked by engagement (post count) and displayed with animated markers.

### 🗺️ Interactive Maps
- Dual map support: Mapbox GL for main map, Leaflet for post previews
- Real-time user location tracking
- Viewport-based rendering for performance
- Custom tower icons with engagement indicators

### 🔐 Authentication
- Email/password authentication
- Google Sign-In integration
- JWT-based session management
- Password reset functionality

---

## 🛠️ Development

### Frontend Development

```bash
cd frontend
npm run dev      # Start dev server
npm run build    # Production build
npm run start    # Start production server
npm run lint     # Run ESLint
```

### Backend Development

```bash
cd backend
./mvnw spring-boot:run           # Run application
./mvnw test                      # Run tests
./mvnw clean package            # Build JAR
```

### Environment Variables

#### Frontend (.env.local)
```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN=your-mapbox-token
```

#### Backend (.env)
```env
FIREBASE_STORAGE_BUCKET=your-project-id.firebasestorage.app
```

---

## 🚢 Deployment

### Frontend (Vercel)
1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Backend (Render/Railway)
1. Create a new Web Service
2. Connect your GitHub repository
3. Set environment variables:
   - `FIREBASE_STORAGE_BUCKET`
   - `FIREBASE_CONFIG` (base64-encoded firebase-key.json)
4. Deploy with auto-scaling enabled

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📝 License

This project is licensed under the MIT License.

---

## 👥 Team

Built with ❤️ by the GeoWhisper Team

---

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) - React framework
- [Spring Boot](https://spring.io/projects/spring-boot) - Java framework
- [Firebase](https://firebase.google.com/) - Backend services
- [Mapbox](https://www.mapbox.com/) - Map services
- [Leaflet](https://leafletjs.com/) - Interactive maps
- [Tailwind CSS](https://tailwindcss.com/) - CSS framework

---

<div align="center">

**[⬆ Back to Top](#-geowhisper)**

Made with 💙 by GeoWhisper Team

</div>
