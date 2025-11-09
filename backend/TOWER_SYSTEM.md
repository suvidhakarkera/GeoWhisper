# Tower System - Persistent Location Clustering

## Overview

This document describes the new persistent tower system that solves the random re-grouping issue in the GeoWhisper backend.

## Problem Statement

Previously, the tower endpoint (`/api/posts/towers`) would dynamically cluster posts every time it was called, leading to:
- **Random grouping**: 5 posts at equidistant locations (e.g., all within 50m) would be grouped differently on each API call
- **Non-deterministic behavior**: Same posts could form different towers on different requests
- **AI hallucination risk**: The summarize feature had no stable data to reference, leading to potential inconsistencies

## Solution

The new system creates and persists towers in the database when posts are created, ensuring:
- **Deterministic clustering**: The first post within a 50m radius creates a tower, and all subsequent nearby posts join that tower
- **Database persistence**: Towers are stored in Firestore's `towers` collection with stable IDs
- **Consistent API responses**: The `/api/posts/towers` endpoint now returns the same grouping every time
- **Reliable AI summaries**: The summarize feature can use stable tower data without hallucination

## Architecture

### 1. Tower Model (`Tower.java`)

Represents a persistent tower in the database:

```java
{
  "towerId": "string",           // Unique identifier
  "latitude": double,            // Tower center (first post's location)
  "longitude": double,           // Tower center (first post's location)
  "radiusMeters": int,           // Clustering radius (default: 50m)
  "postIds": ["string"],         // Array of post IDs in this tower
  "postCount": int,              // Number of posts
  "createdAt": timestamp,        // Tower creation time
  "updatedAt": timestamp         // Last update time
}
```

### 2. TowerService

Core service for tower management:

**Key Methods:**
- `findNearestTower(lat, lon, radius)` - Find existing tower within radius
- `createTower(lat, lon, radius, postId)` - Create new tower
- `addPostToTower(towerId, postId)` - Add post to existing tower
- `getAllTowers()` - Retrieve all towers from DB
- `getTowersInArea(lat, lon, radius)` - Get towers in geographic area

### 3. Modified PostService

**createPost()** - Enhanced with tower assignment:
1. When a post is created, check for existing towers within 50m
2. If tower exists → add post to that tower
3. If no tower exists → create new tower with this post as the first member
4. Store `towerId` reference in the post document

**getPostsGroupedIntoTowers()** - Now retrieves from DB:
1. Fetch all towers from Firestore
2. For each tower, fetch its associated posts
3. Return tower data with posts
4. Results are consistent across calls

### 4. Post Document Updates

Posts now include a `towerId` field:

```javascript
{
  "id": "post123",
  "userId": "user456",
  "content": "Post content",
  "latitude": 28.6139,
  "longitude": 77.2090,
  "towerId": "tower-abc123",  // NEW: Reference to tower
  "createdAt": timestamp,
  // ... other fields
}
```

## API Endpoints

### Existing Endpoints (Behavior Changed)

#### `POST /api/posts/towers`

**Before:** Dynamically clustered posts on each call (random grouping)

**After:** Returns persistent towers from database (consistent grouping)

**Request:**
```json
{
  "clusterRadiusMeters": 50,  // Still accepted but not used for clustering
  "maxPosts": 1000
}
```

**Response:**
```json
{
  "success": true,
  "message": "Found 10 towers with 50 total posts",
  "data": [
    {
      "towerId": "tower-xyz789",
      "latitude": 28.6139,
      "longitude": 77.2090,
      "postCount": 5,
      "posts": [...]
    }
  ]
}
```

### New Admin Endpoints

#### `POST /api/admin/towers/migrate`

Migrate existing posts to the new tower system. Run this once after deployment.

**Response:**
```json
{
  "success": true,
  "message": "Migration completed successfully",
  "data": {
    "totalPosts": 100,
    "postsProcessed": 95,
    "towersCreated": 15,
    "postsAssignedToExisting": 80,
    "errors": 0,
    "status": "completed"
  }
}
```

#### `POST /api/admin/towers/rebuild?confirm=true`

⚠️ **WARNING:** Deletes all towers and recreates them. Use only if data is corrupted.

## Migration Guide

### For First-Time Deployment

1. Deploy the updated backend code
2. Run the migration endpoint:
   ```bash
   curl -X POST http://localhost:8080/api/admin/towers/migrate
   ```
3. Verify tower creation in Firestore console
4. Test `/api/posts/towers` endpoint for consistency

### For New Posts

No action needed! New posts automatically:
1. Find or create appropriate tower
2. Get assigned a `towerId`
3. Update the tower's post count

## Benefits

### 1. Consistency
- Same tower grouping across all API calls
- No more random re-clustering
- Predictable behavior for frontend

### 2. Performance
- Tower data is pre-computed at post creation
- `/api/posts/towers` endpoint just reads from DB
- No expensive clustering algorithm on each request

### 3. AI Reliability
- Summarize feature has stable tower IDs
- Can reference historical tower data
- No hallucination from inconsistent grouping

### 4. Scalability
- Tower membership is maintained incrementally
- No need to process all posts for clustering
- Efficient queries using tower IDs

## Tower Creation Logic

```
When creating a post at (lat, lon):

1. Query all towers in Firestore
2. Calculate distance to each tower
3. Find nearest tower within 50m radius

IF tower found within 50m:
  - Add post to that tower
  - Increment tower's post count
  - Set post.towerId = tower.id
  
ELSE:
  - Create new tower at (lat, lon)
  - Add post as first member
  - Set post.towerId = new tower.id
```

## Database Collections

### `posts` Collection
```
posts/
  {postId}/
    - userId
    - content
    - latitude
    - longitude
    - towerId  ← NEW FIELD
    - createdAt
    - ...
```

### `towers` Collection (NEW)
```
towers/
  {towerId}/
    - latitude
    - longitude
    - radiusMeters
    - postIds[]
    - postCount
    - createdAt
    - updatedAt
```

## Testing

### Test Tower Assignment
```bash
# Create a post
curl -X POST http://localhost:8080/api/posts \
  -H "X-User-Id: user123" \
  -H "X-Username: TestUser" \
  -F "content=Test post" \
  -F "latitude=28.6139" \
  -F "longitude=77.2090"

# Create another post nearby (within 50m)
curl -X POST http://localhost:8080/api/posts \
  -H "X-User-Id: user456" \
  -H "X-Username: TestUser2" \
  -F "content=Another test" \
  -F "latitude=28.6140" \
  -F "longitude=77.2091"

# Check towers - both posts should be in the same tower
curl -X POST http://localhost:8080/api/posts/towers \
  -H "Content-Type: application/json" \
  -d '{"clusterRadiusMeters": 50, "maxPosts": 1000}'

# Call again - should return identical results
curl -X POST http://localhost:8080/api/posts/towers \
  -H "Content-Type: application/json" \
  -d '{"clusterRadiusMeters": 50, "maxPosts": 1000}'
```

## Future Improvements

1. **GeoHashing**: Use geohashing for efficient geographic queries
2. **Tower Limits**: Implement max posts per tower to prevent overcrowding
3. **Tower Merging**: Merge towers if they become too close
4. **Analytics**: Track tower popularity and activity over time
5. **Caching**: Cache frequently accessed towers for better performance

## Notes

- The old `clusterPostsIntoTowers()` method is deprecated but kept for reference
- Tower radius is currently hardcoded to 50 meters but can be made configurable
- The first post in a tower defines its center location (not a centroid)
- Firestore 'in' queries are limited to 10 items, so tower posts are fetched in batches

## Support

For issues or questions, contact the backend team or check the API documentation at `/swagger-ui.html`.
