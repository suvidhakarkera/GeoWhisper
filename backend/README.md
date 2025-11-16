# ⚙️ GeoWhisper Backend

<div align="center">

![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.5.7-green?style=for-the-badge&logo=spring)
![Java](https://img.shields.io/badge/Java-21-orange?style=for-the-badge&logo=openjdk)
![Firebase](https://img.shields.io/badge/Firebase-Latest-orange?style=for-the-badge&logo=firebase)

**Robust Spring Boot backend for GeoWhisper location-based social platform**

</div>

---

## 📋 Table of Content

- [Overview](#-overview)
- [Tech Stack](#-tech-stack)
- [Getting Started](#-getting-started)
- [Project Structure](#-project-structure)
- [Configuration](#-configuration)
- [API Endpoints](#-api-endpoints)
- [Database Schema](#-database-schema)
- [Authentication](#-authentication)
- [Deployment](#-deployment)

---

## 🎯 Overview

The GeoWhisper backend is a RESTful API built with Spring Boot 3.5.7 and Java 21. It provides secure, scalable services for location-based posts, real-time chat, user authentication, and AI-powered features using Firebase and OpenAI integration.

---

## 🛠️ Tech Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| **Spring Boot** | 3.5.7 | Application framework |
| **Java** | 21 | Programming language |
| **Spring Security** | Latest | Authentication & authorization |
| **Spring Web** | Latest | REST API |
| **Spring AI** | 1.0.3 | OpenAI integration |
| **Firebase Admin SDK** | Latest | Database & storage |
| **Firestore** | Latest | NoSQL database |
| **Firebase Storage** | Latest | File storage |
| **Maven** | 3.8+ | Build tool |

---

## 🚀 Getting Started

### Prerequisites

- **Java Development Kit (JDK)** 21 or higher
- **Maven** 3.8 or higher
- **Firebase Project** with:
  - Firestore Database enabled
  - Storage bucket created
  - Admin SDK key generated
- **OpenAI API Key** (optional, for AI features)

### Installation

1. **Navigate to backend directory**
   ```bash
   cd GeoWhisper/backend
   ```

2. **Set up Firebase Admin SDK**
   
   a. Go to [Firebase Console](https://console.firebase.google.com/)
   
   b. Select your project → Project Settings → Service Accounts
   
   c. Click "Generate New Private Key"
   
   d. Save the JSON file as `src/main/resources/firebase-key.json`

3. **Configure environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and add:
   ```env
   FIREBASE_STORAGE_BUCKET=your-project-id.firebasestorage.app
   ```

4. **Update application.properties**
   
   Edit `src/main/resources/application.properties`:
   ```properties
   # Add your OpenAI API key
   spring.ai.openai.api-key=sk-proj-YOUR_KEY_HERE
   ```

5. **Run the application**
   ```bash
   ./mvnw spring-boot:run
   ```
   
   Or on Windows:
   ```bash
   mvnw.cmd spring-boot:run
   ```

6. **Verify it's running**
   
   Open [http://localhost:8080/actuator/health](http://localhost:8080/actuator/health)
   
   You should see: `{"status":"UP"}`

---

## 📁 Project Structure

```
backend/
├── src/
│   ├── main/
│   │   ├── java/com/geowhisper/geowhisperbackendnew/
│   │   │   ├── config/          # Configuration classes
│   │   │   │   ├── CorsConfig.java
│   │   │   │   ├── FirebaseConfig.java
│   │   │   │   └── SecurityConfig.java
│   │   │   │
│   │   │   ├── controller/      # REST controllers
│   │   │   │   ├── AuthController.java
│   │   │   │   ├── ChatController.java
│   │   │   │   ├── PostController.java
│   │   │   │   └── UserController.java
│   │   │   │
│   │   │   ├── service/         # Business logic
│   │   │   │   ├── AuthService.java
│   │   │   │   ├── ChatService.java
│   │   │   │   ├── FirebaseService.java
│   │   │   │   ├── PostService.java
│   │   │   │   └── UserService.java
│   │   │   │
│   │   │   ├── model/           # Data models
│   │   │   │   ├── User.java
│   │   │   │   ├── Post.java
│   │   │   │   ├── ChatMessage.java
│   │   │   │   └── Tower.java
│   │   │   │
│   │   │   ├── dto/             # Data transfer objects
│   │   │   │   ├── AuthRequest.java
│   │   │   │   ├── PostRequest.java
│   │   │   │   └── ChatRequest.java
│   │   │   │
│   │   │   ├── security/        # Security components
│   │   │   │   ├── JwtAuthFilter.java
│   │   │   │   └── JwtTokenProvider.java
│   │   │   │
│   │   │   └── util/            # Utility classes
│   │   │       ├── LocationUtil.java
│   │   │       └── ValidationUtil.java
│   │   │
│   │   └── resources/
│   │       ├── application.properties   # Main configuration
│   │       └── firebase-key.json        # Firebase Admin SDK key
│   │
│   └── test/
│       └── java/                        # Test classes
│
├── target/                              # Build output
├── .env                                 # Environment variables
├── .env.example                         # Environment template
├── docker-compose.yml                   # Docker configuration
├── Dockerfile                           # Docker image
├── pom.xml                              # Maven dependencies
├── mvnw                                 # Maven wrapper (Unix)
└── mvnw.cmd                             # Maven wrapper (Windows)
```

---

## ⚙️ Configuration

### application.properties

```properties
# Server Configuration
server.port=${PORT:8080}

# CORS Configuration
spring.web.cors.allowed-origins=http://localhost:3000,http://localhost:5173
spring.web.cors.allowed-methods=GET,POST,PUT,DELETE,OPTIONS
spring.web.cors.allowed-headers=*
spring.web.cors.allow-credentials=true

# Spring AI (OpenAI)
spring.ai.openai.api-key=YOUR_OPENAI_API_KEY
spring.ai.openai.chat.options.model=gpt-3.5-turbo
spring.ai.openai.chat.options.temperature=0.1

# Firebase Storage
# Set via environment variable: FIREBASE_STORAGE_BUCKET

# Logging
logging.level.com.geowhisper=DEBUG

# Actuator Endpoints
management.endpoints.web.exposure.include=health,info
management.endpoint.health.show-details=when-authorized
```

### Environment Variables

Create a `.env` file:

```env
# Firebase Storage Bucket
FIREBASE_STORAGE_BUCKET=your-project-id.firebasestorage.app

# For cloud deployment (optional)
FIREBASE_CONFIG=<base64-encoded-firebase-key-json>
PORT=8080
```

---

## 🔌 API Endpoints

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/signup` | Create new user account |
| POST | `/api/auth/signin` | User login |
| POST | `/api/auth/google` | Google Sign-In |
| POST | `/api/auth/refresh` | Refresh JWT token |
| POST | `/api/auth/forgot-password` | Request password reset |
| POST | `/api/auth/reset-password` | Reset password |
| GET | `/api/auth/verify-token` | Verify JWT token |

### Posts

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/posts/create` | Create new post |
| GET | `/api/posts/nearby` | Get posts within radius |
| GET | `/api/posts/tower/{towerId}` | Get posts in tower |
| GET | `/api/posts/{postId}` | Get single post |
| POST | `/api/posts/towers` | Get all towers (clustered) |
| DELETE | `/api/posts/{postId}` | Delete post |
| POST | `/api/posts/{postId}/like` | Like/unlike post |

### Chat

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/chat/send` | Send chat message |
| GET | `/api/chat/tower/{towerId}` | Get tower chat messages |
| GET | `/api/chat/tower/{towerId}/recent` | Get recent messages |
| DELETE | `/api/chat/{messageId}` | Delete message |
| POST | `/api/chat/{messageId}/react` | React to message |

### User

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/users/profile` | Get user profile |
| PUT | `/api/users/profile` | Update profile |
| GET | `/api/users/{userId}/posts` | Get user's posts |
| POST | `/api/users/upload-avatar` | Upload profile picture |

### Health Check

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/actuator/health` | Application health status |
| GET | `/actuator/info` | Application info |

---

## 🗄️ Database Schema

### Firestore Collections

#### users
```json
{
  "firebaseUid": "string",
  "email": "string",
  "username": "string",
  "displayName": "string",
  "photoURL": "string (optional)",
  "createdAt": "timestamp",
  "lastActive": "timestamp",
  "postsCount": "number",
  "provider": "string (email/google)"
}
```

#### posts
```json
{
  "postId": "string",
  "userId": "string",
  "username": "string",
  "content": "string",
  "imageUrl": "string (optional)",
  "latitude": "number",
  "longitude": "number",
  "towerId": "string",
  "timestamp": "timestamp",
  "likes": "array<string>",
  "likesCount": "number",
  "visibility": "string (public/private)"
}
```

#### chatMessages
```json
{
  "messageId": "string",
  "towerId": "string",
  "userId": "string",
  "username": "string",
  "message": "string",
  "timestamp": "timestamp",
  "reactions": "map<string, array<string>>",
  "edited": "boolean",
  "deleted": "boolean"
}
```

#### towers
```json
{
  "towerId": "string",
  "latitude": "number",
  "longitude": "number",
  "postCount": "number",
  "lastActive": "timestamp",
  "memberCount": "number"
}
```

---

## 🔐 Authentication

### JWT Token Structure

The backend uses JWT (JSON Web Tokens) for authentication:

```json
{
  "sub": "firebaseUid",
  "email": "user@example.com",
  "username": "username",
  "iat": 1234567890,
  "exp": 1234571490
}
```

### Authentication Flow

1. **Sign Up/Sign In**
   - User provides credentials
   - Backend verifies with Firebase
   - JWT token generated and returned

2. **Subsequent Requests**
   - Client includes token in header: `Authorization: Bearer <token>`
   - Backend validates token
   - Request processed if valid

3. **Token Refresh**
   - Tokens expire after 1 hour
   - Use `/api/auth/refresh` endpoint
   - New token issued

### Security Features

- ✅ Password hashing with bcrypt
- ✅ JWT token validation
- ✅ CORS protection
- ✅ Input validation
- ✅ SQL injection prevention
- ✅ XSS protection
- ✅ Rate limiting (configurable)

---

## 📦 Building

### Development Build

```bash
./mvnw clean install
```

### Production Build

```bash
./mvnw clean package -DskipTests
```

This creates a JAR file in `target/geowhisperbackendnew-0.0.1-SNAPSHOT.jar`

### Running JAR

```bash
java -jar target/geowhisperbackendnew-0.0.1-SNAPSHOT.jar
```

---

## 🐳 Docker

### Build Image

```bash
docker build -t geowhisper-backend .
```

### Run Container

```bash
docker run -p 8080:8080 \
  -e FIREBASE_STORAGE_BUCKET=your-bucket \
  -v $(pwd)/src/main/resources/firebase-key.json:/app/firebase-key.json \
  geowhisper-backend
```

### Docker Compose

```bash
docker-compose up -d
```

---

## 🚢 Deployment

### Render

1. **Create New Web Service**
   - Go to [Render Dashboard](https://dashboard.render.com/)
   - Click "New +" → "Web Service"
   - Connect GitHub repository

2. **Configure Service**
   - **Name**: geowhisper-backend
   - **Environment**: Java
   - **Build Command**: `./mvnw clean package -DskipTests`
   - **Start Command**: `java -jar target/geowhisperbackendnew-0.0.1-SNAPSHOT.jar`

3. **Set Environment Variables**
   ```
   FIREBASE_STORAGE_BUCKET=your-project.firebasestorage.app
   FIREBASE_CONFIG=<base64-encoded-firebase-key.json>
   SPRING_AI_OPENAI_API_KEY=your-openai-key
   ```

4. **Deploy**
   - Click "Create Web Service"
   - Auto-deploys on push to main

### Railway

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Initialize project
railway init

# Deploy
railway up
```

### Heroku

```bash
# Install Heroku CLI
# Login
heroku login

# Create app
heroku create geowhisper-backend

# Set environment variables
heroku config:set FIREBASE_STORAGE_BUCKET=your-bucket

# Deploy
git push heroku main
```

---

## 🧪 Testing

### Run Tests

```bash
./mvnw test
```

### Run with Coverage

```bash
./mvnw test jacoco:report
```

Coverage report: `target/site/jacoco/index.html`

---

## 🐛 Troubleshooting

### Common Issues

**Firebase initialization fails**
- ✅ Check `firebase-key.json` exists in `src/main/resources/`
- ✅ Verify JSON file is valid
- ✅ Ensure Firebase project is active

**Port 8080 already in use**
```bash
# Change port in application.properties
server.port=8081

# Or set environment variable
PORT=8081 ./mvnw spring-boot:run
```

**CORS errors**
- ✅ Add frontend URL to `application.properties`
- ✅ Check CORS configuration in `CorsConfig.java`

**Build fails**
- ✅ Verify Java 21 is installed: `java -version`
- ✅ Clear Maven cache: `./mvnw clean`
- ✅ Delete `target/` folder

---

## 📚 Learn More

- [Spring Boot Documentation](https://spring.io/projects/spring-boot)
- [Spring Security](https://spring.io/projects/spring-security)
- [Firebase Admin SDK](https://firebase.google.com/docs/admin/setup)
- [Spring AI](https://docs.spring.io/spring-ai/reference/)
- [Maven Documentation](https://maven.apache.org/guides/)

---

## 🤝 Contributing

See the main [Contributing Guide](../README.md#-contributing) in the root directory.

---

## 📝 License

MIT License - see [LICENSE](../LICENSE) for details

---

<div align="center">

**[⬆ Back to Top](#%EF%B8%8F-geowhisper-backend)**

Part of the [GeoWhisper](../README.md) project

</div>
