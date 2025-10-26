# 🚀 Render Deployment Guide for GeoWhisper Backend

## Problem Fixed
The application was crashing with `SIGSEGV` error due to:
1. **Native library incompatibility**: Firebase Admin SDK's `grpc-netty-shaded` uses native libraries that conflict with Render's Linux environment
2. **Port binding issue**: App wasn't reading Render's dynamic `PORT` environment variable

## ✅ Solutions Applied

### 1. Port Configuration
**File**: `application.properties`
```properties
server.port=${PORT:8080}
```
- Now reads `PORT` from environment (Render provides this)
- Falls back to `8080` for local development

### 2. Native Library Fix
**File**: `pom.xml`
- **Excluded** `grpc-netty-shaded` (uses native libraries that crash)
- **Added** `grpc-okhttp` (pure Java implementation, no native code)

### 3. Docker Optimizations
**File**: `Dockerfile`
- Added JVM flags to handle temporary native library workdir
- Uses `eclipse-temurin:21-jre-jammy` (Debian-based, better compatibility)

## 📋 Deployment Steps

### Step 1: Prepare Your Repository
```bash
# Commit all changes
git add .
git commit -m "Fix Render deployment: native library and port binding"
git push origin main
```

### Step 2: Create Web Service on Render

1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub repository: `Sankirthan-R/GeoWhisper`
4. Configure:
   - **Name**: `geowhisper-backend`
   - **Region**: Oregon (or closest to you)
   - **Branch**: `main`
   - **Root Directory**: `backend`
   - **Runtime**: `Docker`
   - **Dockerfile Path**: `./Dockerfile`
   - **Plan**: Free

### Step 3: Set Environment Variables

In Render dashboard → Environment tab, add:

#### Required Variables:
```
SPRING_PROFILES_ACTIVE=prod
SPRING_AI_OPENAI_API_KEY=sk-your-actual-openai-key-here
```

#### Firebase Configuration (Choose ONE method):

**Method A: As Base64 String (Recommended)**
```bash
# On your local machine, convert firebase-key.json to base64
# Windows PowerShell:
$content = Get-Content backend/src/main/resources/firebase-key.json -Raw
[Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes($content))

# Then in Render, add:
FIREBASE_CONFIG=<paste-base64-here>
```

**Method B: Upload as File**
- Use Render's "Secret Files" feature
- Upload `firebase-key.json`
- It will be mounted at `/etc/secrets/firebase-key.json`

#### Database (if using PostgreSQL):
```
SPRING_DATASOURCE_URL=jdbc:postgresql://your-db-host:5432/geowhisper
SPRING_DATASOURCE_USERNAME=your_username
SPRING_DATASOURCE_PASSWORD=your_password
```

### Step 4: Update FirebaseConfig (if using Method A)

If you chose to use environment variable for Firebase config, update `FirebaseConfig.java`:

```java
@PostConstruct
public void initialize() {
    try {
        InputStream serviceAccount;
        
        // Try to load from environment variable first (for Render)
        String firebaseConfig = System.getenv("FIREBASE_CONFIG");
        if (firebaseConfig != null && !firebaseConfig.isEmpty()) {
            byte[] decodedKey = Base64.getDecoder().decode(firebaseConfig);
            serviceAccount = new ByteArrayInputStream(decodedKey);
            System.out.println("✅ Loading Firebase config from environment variable");
        } else {
            // Fallback to classpath (for local development)
            ClassPathResource resource = new ClassPathResource("firebase-key.json");
            serviceAccount = resource.getInputStream();
            System.out.println("✅ Loading Firebase config from classpath");
        }

        FirebaseOptions options = FirebaseOptions.builder()
                .setCredentials(GoogleCredentials.fromStream(serviceAccount))
                .build();

        if (FirebaseApp.getApps().isEmpty()) {
            FirebaseApp.initializeApp(options);
        }

        System.out.println("✅ Firebase initialized successfully!");

    } catch (Exception e) {
        System.err.println("❌ Firebase initialization failed: " + e.getMessage());
        e.printStackTrace();
    }
}
```

### Step 5: Deploy

1. Click **"Create Web Service"**
2. Render will automatically:
   - Build your Docker image
   - Deploy the container
   - Assign a URL like: `https://geowhisper-backend.onrender.com`

### Step 6: Add Health Check Endpoint (Optional but Recommended)

Add to `pom.xml`:
```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-actuator</artifactId>
</dependency>
```

Add to `application.properties`:
```properties
# Actuator for health checks
management.endpoints.web.exposure.include=health
management.endpoint.health.show-details=when-authorized
```

## 🔍 Troubleshooting

### Check Logs
```bash
# In Render dashboard, go to Logs tab
# Look for:
# ✅ Firebase initialized successfully!
# ✅ Tomcat started on port(s): XXXX
```

### Common Issues

1. **Still crashing?**
   - Check if `grpc-okhttp` dependency was added
   - Verify `grpc-netty-shaded` is excluded
   - Run `mvn clean package` locally to rebuild

2. **Port binding issues?**
   - Ensure `server.port=${PORT:8080}` is in application.properties
   - Check Render logs for "Web process failed to bind to $PORT"

3. **Firebase not working?**
   - Verify `FIREBASE_CONFIG` environment variable is set
   - Check base64 encoding is correct (no extra spaces/newlines)
   - Look for "Firebase initialization failed" in logs

4. **Database connection issues?**
   - Ensure database URL is accessible from Render
   - Check username/password are correct
   - Verify database allows external connections

## 🌐 Update Frontend

After deployment, update your frontend to use the Render URL:

**File**: `frontend/src/app/page.js` (or API config)
```javascript
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 
                     'https://geowhisper-backend.onrender.com';
```

Update CORS in `application.properties`:
```properties
# Add your frontend URLs
spring.web.cors.allowed-origins=http://localhost:3000,https://your-frontend-url.vercel.app
```

## 📊 Monitoring

- **Free Plan**: App sleeps after 15 mins of inactivity
- **First request after sleep**: Takes ~30 seconds to wake up
- **Upgrade to Starter plan**: Keeps app always running

## 🎉 Success Indicators

You should see in logs:
```
✅ Firebase initialized successfully!
✅ Tomcat started on port(s): XXXX (http)
✅ Started GeowhisperbackendnewApplication
```

Access your API at:
```
https://geowhisper-backend.onrender.com/swagger-ui/index.html
```

## 📝 Notes

- **Build time**: 5-10 minutes (Maven + Docker layers)
- **Cold start**: ~30 seconds on free plan
- **Logs retention**: 7 days on free plan
- **Auto-deploy**: Enabled on git push to main branch
