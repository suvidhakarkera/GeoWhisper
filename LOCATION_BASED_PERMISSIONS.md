# Location-Based Tower Interaction System

## Overview
Implemented a location-based permission system for tower interactions. Users must be within **500 meters** of a tower to interact with it. Users beyond this radius can only view content but cannot post, chat, like, or delete.

## Features Implemented

### 1. **Backend Services**

#### LocationPermissionService
- **Path**: `backend/src/main/java/.../service/LocationPermissionService.java`
  - **Purpose**: Validates if users are within 500m of tower center
- **Key Methods**:
  - `canInteractWithTower()` - Check if user can interact
  - `getDistanceFromTower()` - Calculate distance from tower
  - `validateInteractionPermission()` - Throw exception if too far

#### ChatService
- **Path**: `backend/src/main/java/.../service/ChatService.java`
- **Purpose**: Handle chat messages with location validation
- **Key Methods**:
  - `sendMessage()` - Send message with location check
  - `canSendMessage()` - Check if user can send messages

#### Updated PostService
- Added location validation to `deletePost()` method
- Users must be within 500m to delete their posts

### 2. **Backend Controllers**

#### TowerPermissionController
- **Path**: `backend/src/main/java/.../controller/TowerPermissionController.java`
- **Endpoints**:
  ```
  GET /api/towers/{towerId}/can-interact?latitude=X&longitude=Y
  GET /api/towers/{towerId}/distance?latitude=X&longitude=Y
  ```

#### Updated ChatController
- **New Endpoints**:
  ```
  POST /api/chat/{towerId}/messages
  GET /api/chat/{towerId}/can-send?latitude=X&longitude=Y
  ```

#### Updated PostController
- Modified `DELETE /api/posts/{postId}` to require location parameters

### 3. **Frontend Services**

#### chatService (Updated)
- **Path**: `frontend/src/services/chatService.ts`
- **New Methods**:
  - `sendMessage()` - Send message through backend with location
  - `canSendMessage()` - Check if user can interact

### 4. **Frontend Components**

#### TowerChat (Updated)
- **Path**: `frontend/components/TowerChat.tsx`
- **Changes**:
  - Gets user location on mount
  - Checks if user can interact with tower
  - Shows "View-Only Mode" banner if too far
  - Disables input fields when user is beyond 500m
  - Sends messages through backend API with location validation

## Permission Matrix

| Distance from Tower | Can View | Can Chat | Can Post | Can Like | Can Delete | Can Use Summarizers |
|---------------------|----------|----------|----------|----------|------------|---------------------|
| **Within 500m**     | ✅       | ✅       | ✅       | ✅       | ✅         | ✅                  |
| **Beyond 500m**     | ✅       | ❌       | ❌       | ❌       | ❌         | ✅                  |

## API Endpoints

### Check Tower Interaction Permission
```http
GET /api/towers/{towerId}/can-interact?latitude=28.6139&longitude=77.2090

Response:
{
  "success": true,
  "message": "Permission check completed",
  "data": {
    "canInteract": true,
    "distance": 234.5,
    "interactionRadius": 500.0,
    "message": "You can interact with this tower",
    "permissions": {
      "canChat": true,
      "canPost": true,
      "canLike": true,
      "canDelete": true,
      "canComment": true
    }
  }
}
```

### Send Chat Message
```http
POST /api/chat/{towerId}/messages
Headers:
  X-User-Id: user123
  X-Username: JohnDoe

Body:
{
  "message": "Hello everyone!",
  "userLatitude": 28.6139,
  "userLongitude": 77.2090,
  "image": "data:image/png;base64,...",  // Optional
  "hasImage": false
}

Response (Success):
{
  "success": true,
  "message": "Message sent successfully",
  "data": {
    "messageId": "msg_abc123",
    "towerId": "tower_xyz",
    "timestamp": 1699876543210
  }
}

Response (Too Far):
{
  "success": false,
  "message": "You must be within 500m of the tower to send messages. You are 1200m away (view-only mode)."
}
```

### Delete Post
```http
DELETE /api/posts/{postId}?latitude=28.6139&longitude=77.2090
Headers:
  X-User-Id: user123

Response (Too Far):
{
  "success": false,
  "message": "You must be within 500m of the tower to delete posts. You are 800m away (view-only mode)."
}
```

## User Experience

### Within 500m (Full Access)
- Normal chat interface
- Can send messages and images
- Can create posts
- Can like/unlike posts
- Can delete own posts
- All features enabled

### Beyond 500m (View-Only)
- Orange "View-Only Mode" banner displayed
- Input fields disabled
- Send button disabled
- Shows distance restriction message
- Can still:
  - View all messages and posts
  - Use chat summarizer
  - Use vibe summarizer
  - See tower statistics

## Testing

### Test Scenarios

1. **User within 500m**:
   - Should be able to send messages
   - Should be able to delete own posts
   - No view-only banner

2. **User beyond 500m**:
   - Should see view-only banner
   - Should NOT be able to send messages
   - Should NOT be able to delete posts
   - API should return 403 with appropriate error

3. **User location unavailable**:
   - Should default to view-only mode
   - Should show location error message

### Testing APIs

```bash
# Check if user can interact with tower
curl "http://localhost:8080/api/towers/TOWER_ID/can-interact?latitude=28.6139&longitude=77.2090"

# Try to send a message
curl -X POST "http://localhost:8080/api/chat/TOWER_ID/messages" \
  -H "Content-Type: application/json" \
  -H "X-User-Id: user123" \
  -H "X-Username: TestUser" \
  -d '{
    "message": "Test message",
    "userLatitude": 28.6139,
    "userLongitude": 77.2090
  }'

# Try to delete a post
curl -X DELETE "http://localhost:8080/api/posts/POST_ID?latitude=28.6139&longitude=77.2090" \
  -H "X-User-Id: user123"
```

## Configuration

The interaction radius is set to **500 meters** in:
- `LocationPermissionService.INTERACTION_RADIUS_METERS`

To change this value, update the constant in the service class.

## Security Considerations

1. **Location Validation**: All interaction endpoints validate user location server-side
2. **Authentication**: All endpoints require user authentication headers
3. **Authorization**: Users can only delete their own posts
4. **Distance Calculation**: Uses Haversine formula for accurate distance calculation

## Future Enhancements

1. **Dynamic Radius**: Allow tower-specific interaction radii
2. **Graduated Permissions**: Different permission levels at different distances
3. **Location Caching**: Cache user location for better performance
4. **Offline Mode**: Handle offline scenarios gracefully
5. **Location Spoofing Protection**: Add additional validation to prevent fake locations
