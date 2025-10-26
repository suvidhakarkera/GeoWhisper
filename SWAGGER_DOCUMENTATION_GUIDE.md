# GeoWhisper API - Swagger Documentation Setup Guide

## ✅ Completed Steps

### 1. Added SpringDoc OpenAPI Dependency
The following dependency has been added to `pom.xml`:
```xml
<dependency>
    <groupId>org.springdoc</groupId>
    <artifactId>springdoc-openapi-starter-webmvc-ui</artifactId>
    <version>2.3.0</version>
</dependency>
```

### 2. Created Swagger Configuration
File: `backend/src/main/java/com/geowhisper/geowhisperbackendnew/config/SwaggerConfig.java`

This configuration provides:
- API title, version, and description
- Contact information
- License details
- Server URLs (local and production)
- Security scheme for Firebase authentication

### 3. Updated All DTO Classes with @Schema Annotations

#### ✅ CreateUserRequest.java
```java
@Data
@Schema(description = "Request object for creating a new user profile")
public class CreateUserRequest {
    
    @Schema(description = "Firebase authentication UID", 
            example = "abc123xyz789firebaseuid", 
            required = true)
    private String firebaseUid;
    
    @Schema(description = "Unique username for the user", 
            example = "john_explorer", 
            required = true)
    private String username;
    
    @Schema(description = "User's email address", 
            example = "john.doe@example.com", 
            required = true)
    private String email;
}
```

#### ✅ CreatePostRequest.java
```java
@Data
@Schema(description = "Request object for creating a new geo-tagged post")
public class CreatePostRequest {
    
    @Schema(description = "Content of the post message", 
            example = "Just had the best coffee at this cafe! ☕ Highly recommend the caramel latte.",
            required = true)
    private String content;
    
    @Schema(description = "Latitude coordinate of the post location", 
            example = "40.7128", 
            required = true)
    private double latitude;
    
    @Schema(description = "Longitude coordinate of the post location", 
            example = "-74.0060", 
            required = true)
    private double longitude;
}
```

#### ✅ NearbyPostsRequest.java
```java
@Data
@Schema(description = "Request object for fetching posts within a specific radius")
public class NearbyPostsRequest {
    
    @Schema(description = "Latitude coordinate of the center point", 
            example = "40.7128", 
            required = true)
    private double latitude;
    
    @Schema(description = "Longitude coordinate of the center point", 
            example = "-74.0060", 
            required = true)
    private double longitude;
    
    @Schema(description = "Search radius in meters", 
            example = "500", 
            defaultValue = "500")
    private int radiusMeters = 500;
    
    @Schema(description = "Maximum number of posts to return", 
            example = "50", 
            defaultValue = "50")
    private int limit = 50;
}
```

#### ✅ ApiResponse.java
```java
@Data
@AllArgsConstructor
@Schema(description = "Standard API response wrapper")
public class ApiResponse {
    
    @Schema(description = "Indicates if the request was successful", 
            example = "true")
    private boolean success;
    
    @Schema(description = "Human-readable message describing the result", 
            example = "Profile created successfully")
    private String message;
    
    @Schema(description = "Response payload data (varies by endpoint)")
    private Object data;
}
```

## 📝 Controller Annotations Guide

### Auth Controller Annotations

Add these annotations to `AuthController.java`:

1. **Class-level annotations:**
```java
@Tag(name = "Authentication", description = "User authentication and profile management endpoints")
```

2. **Health Check Endpoint:**
```java
@Operation(
    summary = "Health check endpoint",
    description = "Verifies that the GeoWhisper backend service is running and operational"
)
@ApiResponses(value = {
    @io.swagger.v3.oas.annotations.responses.ApiResponse(
        responseCode = "200",
        description = "Service is healthy and running"
    )
})
```

3. **Create Profile Endpoint:**
```java
@Operation(
    summary = "Create user profile",
    description = "Creates a new user profile in the system. If the profile already exists, returns the existing profile data."
)
@ApiResponses(value = {
    @io.swagger.v3.oas.annotations.responses.ApiResponse(
        responseCode = "200",
        description = "Profile created successfully or already exists",
        content = @Content(
            mediaType = "application/json",
            schema = @Schema(implementation = ApiResponse.class),
            examples = @ExampleObject(value = "{\"success\":true,\"message\":\"Profile created successfully\",\"data\":{\"username\":\"john_explorer\",\"email\":\"john.doe@example.com\",\"firebaseUid\":\"abc123xyz789firebaseuid\"}}")
        )
    )
})
```

4. **Get Profile Endpoint:**
```java
@Operation(
    summary = "Get user profile",
    description = "Retrieves a user's profile information by their Firebase UID"
)
@Parameter(description = "Firebase authentication UID of the user", example = "abc123xyz789firebaseuid", required = true)
```

### Post Controller Annotations

Add these annotations to `PostController.java`:

1. **Class-level annotations:**
```java
@Tag(name = "Posts", description = "Endpoints for creating and retrieving geo-tagged posts")
```

2. **Create Post Endpoint:**
```java
@Operation(
    summary = "Create a new post",
    description = "Creates a new geo-tagged post at the specified location. Requires user authentication headers.",
    security = @SecurityRequirement(name = "firebaseAuth")
)
@Parameter(description = "Firebase User ID (required)", example = "abc123xyz789firebaseuid", required = true)
@Parameter(description = "Username for display", example = "john_explorer", required = false)
```

3. **Get Nearby Posts Endpoint:**
```java
@Operation(
    summary = "Get nearby posts",
    description = "Retrieves all posts within a specified radius from the given coordinates"
)
```

4. **Get User Posts Endpoint:**
```java
@Operation(
    summary = "Get user's posts",
    description = "Retrieves all posts created by a specific user"
)
@Parameter(description = "User ID to fetch posts for", example = "abc123xyz789firebaseuid", required = true)
```

### AI Controller Annotations

Add these annotations to `AIController.java`:

1. **Class-level annotations:**
```java
@Tag(name = "AI Agent", description = "AI-powered features for location vibes and welcome messages")
```

2. **Vibe Summary Endpoint:**
```java
@Operation(
    summary = "Generate AI vibe summary",
    description = "Analyzes recent posts in a specific location and generates an AI-powered summary"
)
```

3. **Welcome Message Endpoint:**
```java
@Operation(
    summary = "Generate AI welcome message",
    description = "Creates a personalized AI-generated welcome message for a specific zone"
)
@Parameter(description = "Name of the zone/area", example = "Downtown Manhattan", required = true)
@Parameter(description = "Number of posts in this zone", example = "42")
```

## 🚀 Accessing the Swagger Documentation

Once you rebuild and run the application:

1. **Swagger UI (Interactive Documentation):**
   ```
   http://localhost:8080/swagger-ui.html
   ```
   or
   ```
   http://localhost:8080/swagger-ui/index.html
   ```

2. **OpenAPI JSON Spec:**
   ```
   http://localhost:8080/v3/api-docs
   ```

3. **OpenAPI YAML Spec:**
   ```
   http://localhost:8080/v3/api-docs.yaml
   ```

## 📋 Next Steps

1. Rebuild the Maven project:
   ```bash
   cd backend
   mvn clean install
   ```

2. Restart your Spring Boot application

3. Navigate to `http://localhost:8080/swagger-ui.html` to see your interactive API documentation

4. Test your endpoints directly from the Swagger UI interface

## 🎯 Features Provided

✅ Interactive API documentation with try-it-out functionality
✅ Complete request/response examples with real data
✅ Automatic schema validation
✅ Security requirements documented
✅ Organized endpoints by tags (Authentication, Posts, AI Agent)
✅ Parameter descriptions with examples
✅ Response status codes documented
✅ JSON Schema generation for all DTOs

## 🔧 Configuration Options

You can customize Swagger UI by adding properties to `application.properties`:

```properties
# Swagger UI path
springdoc.swagger-ui.path=/api-docs

# Sort endpoints alphabetically
springdoc.swagger-ui.operationsSorter=alpha

# Sort tags alphabetically
springdoc.swagger-ui.tagsSorter=alpha

# Enable filter
springdoc.swagger-ui.filter=true

# Show common extensions
springdoc.swagger-ui.showExtensions=true

# Show common request duration
springdoc.swagger-ui.showCommonExtensions=true
```

## 📝 Example API Responses

### Create Post Response
```json
{
  "success": true,
  "message": "Post created successfully",
  "data": {
    "id": "post123abc456def",
    "content": "Just had the best coffee at this cafe! ☕",
    "latitude": 40.7128,
    "longitude": -74.0060,
    "userId": "abc123xyz789firebaseuid",
    "username": "john_explorer",
    "createdAt": "2025-10-26T14:30:00Z",
    "reactions": {
      "like": 0,
      "love": 0,
      "laugh": 0
    }
  }
}
```

### Nearby Posts Response
```json
{
  "success": true,
  "message": "Found 3 nearby posts",
  "data": [
    {
      "id": "post123abc456def",
      "content": "Just had the best coffee at this cafe! ☕",
      "latitude": 40.7128,
      "longitude": -74.0060,
      "distance": 150.5,
      "username": "john_explorer",
      "reactions": {
        "like": 5,
        "love": 2,
        "laugh": 1
      }
    }
  ]
}
```

### AI Vibe Summary Response
```json
{
  "success": true,
  "message": "Vibe summary generated",
  "data": {
    "summary": "This area is buzzing with energy! People are loving the coffee shops and local eateries.",
    "postCount": 15,
    "location": {
      "latitude": 40.7128,
      "longitude": -74.0060
    }
  }
}
```
