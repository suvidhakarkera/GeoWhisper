package com.geowhisper.geowhisperbackendnew.service;

import com.google.cloud.firestore.*;
import com.google.firebase.database.DatabaseReference;
import com.google.firebase.database.FirebaseDatabase;
import com.geowhisper.geowhisperbackendnew.dto.CreatePostRequest;
import com.geowhisper.geowhisperbackendnew.dto.TowerResponse;
import com.geowhisper.geowhisperbackendnew.model.Tower;
import com.geowhisper.geowhisperbackendnew.util.GeoUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.*;
import java.util.concurrent.ExecutionException;

@Service
public class PostService {

    @Autowired
    private Firestore firestore;

    @Autowired
    private StorageService storageService;

    @Autowired
    private TowerService towerService;

    /**
     * Create a new post without images (backward compatibility)
     */
    public Map<String, Object> createPost(String userId, String username, CreatePostRequest request)
            throws ExecutionException, InterruptedException {
        return createPost(userId, username, request, null);
    }

    /**
     * Create a new post with optional images
     */
    public Map<String, Object> createPost(
            String userId,
            String username,
            CreatePostRequest request,
            MultipartFile[] images)
            throws ExecutionException, InterruptedException {

        // Create document reference first to get the post ID
        DocumentReference docRef = firestore.collection("posts").document();
        String postId = docRef.getId();

        // Upload images if provided
        List<String> imageUrls = new ArrayList<>();
        if (images != null && images.length > 0) {
            try {
                imageUrls = storageService.uploadImages(images, userId, postId);
            } catch (IOException e) {
                throw new RuntimeException("Failed to upload images: " + e.getMessage(), e);
            }
        }

        // Tower assignment logic: Find or create a tower for this post
        String towerId = null;
        double postLat = request.getLatitude();
        double postLon = request.getLongitude();
        int towerRadius = 50; // 50 meters radius for tower clustering

        // Check if there's an existing tower within 50 meters
        Optional<Tower> nearestTower = towerService.findNearestTower(postLat, postLon, towerRadius);

        if (nearestTower.isPresent()) {
            // Add post to existing tower
            Tower tower = nearestTower.get();
            towerId = tower.getTowerId();
            towerService.addPostToTower(towerId, postId);
        } else {
            // No nearby tower found - create a new tower with this post as the first post
            Tower newTower = towerService.createTower(postLat, postLon, towerRadius, postId);
            towerId = newTower.getTowerId();
        }

        // Create post data
        Map<String, Object> postData = new HashMap<>();
        postData.put("userId", userId);
        postData.put("username", username);
        postData.put("content", request.getContent());
        postData.put("latitude", request.getLatitude());
        postData.put("longitude", request.getLongitude());
        postData.put("towerId", towerId); // Store tower reference in post
        postData.put("createdAt", FieldValue.serverTimestamp());
        postData.put("likes", 0);
        postData.put("commentCount", 0);
        postData.put("images", imageUrls);
        postData.put("imageCount", imageUrls.size());

        // Save to Firestore
        docRef.set(postData).get();

        // Also add the post as a chat message to the tower's chat
        long timestamp = System.currentTimeMillis();
        addPostAsChatMessage(towerId, userId, username, request.getContent(), imageUrls, postId, timestamp);

        // Replace FieldValue.serverTimestamp() with actual timestamp for the response
        postData.put("createdAt", timestamp);
        postData.put("id", postId);
        return postData;
    }

    public List<Map<String, Object>> getNearbyPosts(
            double userLat,
            double userLon,
            int radiusMeters,
            int limit) throws ExecutionException, InterruptedException {

        QuerySnapshot querySnapshot = firestore.collection("posts")
                .orderBy("createdAt", Query.Direction.DESCENDING)
                .limit(500)
                .get()
                .get();

        List<Map<String, Object>> nearbyPosts = new ArrayList<>();

        for (DocumentSnapshot doc : querySnapshot.getDocuments()) {
            Map<String, Object> post = doc.getData();
            if (post == null)
                continue;

            // Filter out seeded posts
            String userId = (String) post.get("userId");
            if (userId != null && userId.startsWith("seed_user_")) {
                continue;
            }

            double postLat = ((Number) post.get("latitude")).doubleValue();
            double postLon = ((Number) post.get("longitude")).doubleValue();

            double distance = GeoUtils.calculateDistance(userLat, userLon, postLat, postLon);

            if (distance <= radiusMeters) {
                post.put("id", doc.getId());
                post.put("distance", Math.round(distance));
                nearbyPosts.add(post);
            }

            if (nearbyPosts.size() >= limit) {
                break;
            }
        }

        nearbyPosts.sort((a, b) -> Double.compare((Double) a.get("distance"), (Double) b.get("distance")));

        return nearbyPosts;
    }

    public List<Map<String, Object>> getUserPosts(String userId)
            throws ExecutionException, InterruptedException {

        // Query without orderBy to avoid needing a composite index
        // Sorting will be done on the frontend
        QuerySnapshot querySnapshot = firestore.collection("posts")
                .whereEqualTo("userId", userId)
                .get()
                .get();

        List<Map<String, Object>> posts = new ArrayList<>();
        for (DocumentSnapshot doc : querySnapshot.getDocuments()) {
            Map<String, Object> post = doc.getData();
            if (post != null) {
                post.put("id", doc.getId());
                posts.add(post);
            }
        }

        return posts;
    }

    /**
     * Add a post as a chat message to the tower's chat in Firebase Realtime
     * Database
     */
    private void addPostAsChatMessage(String towerId, String userId, String username,
            String content, List<String> imageUrls,
            String postId, long timestamp) {
        try {
            // Get reference to the tower's chat messages
            DatabaseReference chatRef = FirebaseDatabase.getInstance()
                    .getReference("chats")
                    .child(towerId)
                    .child("messages");

            // Create a new message node
            DatabaseReference newMessageRef = chatRef.push();

            // Prepare message data
            Map<String, Object> messageData = new HashMap<>();
            messageData.put("userId", userId);
            messageData.put("username", username);
            messageData.put("message", "📍 Created a post: " + content);
            messageData.put("timestamp", timestamp);
            messageData.put("createdAt", new Date(timestamp).toString());
            messageData.put("isPost", true); // Flag to identify this as a post
            messageData.put("postId", postId); // Reference to the original post

            // Add image if available
            if (imageUrls != null && !imageUrls.isEmpty()) {
                messageData.put("image", imageUrls.get(0)); // Add first image URL
            }

            // Save asynchronously to Realtime Database
            newMessageRef.setValueAsync(messageData);

            System.out.println("✅ Added post " + postId + " as chat message in tower " + towerId);
        } catch (Exception e) {
            // Don't fail the post creation if chat message fails
            System.err.println("⚠️ Failed to add post as chat message: " + e.getMessage());
        }
    }

    public List<Map<String, Object>> getRecentPostsForZone(
            double lat,
            double lon,
            int radiusMeters) throws ExecutionException, InterruptedException {
        return getNearbyPosts(lat, lon, radiusMeters, 100);
    }

    /**
     * Get all posts grouped into their assigned towers from the database.
     * This retrieves the persistent tower data, ensuring consistent grouping across
     * API calls.
     * 
     * @param clusterRadiusMeters Not used anymore (kept for backward compatibility)
     * @param maxPosts            Maximum number of posts to include per tower
     * @return List of towers with their associated posts
     */
    public List<TowerResponse> getPostsGroupedIntoTowers(
            int clusterRadiusMeters,
            int maxPosts) throws ExecutionException, InterruptedException {

        // Fetch all towers from database
        List<Tower> towers = towerService.getAllTowers();
        List<TowerResponse> towerResponses = new ArrayList<>();

        // For each tower, fetch its posts
        for (Tower tower : towers) {
            List<String> postIds = tower.getPostIds();
            if (postIds == null || postIds.isEmpty()) {
                continue;
            }

            // Fetch post details for this tower
            List<Map<String, Object>> posts = new ArrayList<>();

            // Firestore 'in' query has a limit of 10 items, so we need to batch
            int batchSize = 10;
            for (int i = 0; i < postIds.size(); i += batchSize) {
                List<String> batch = postIds.subList(i, Math.min(i + batchSize, postIds.size()));

                QuerySnapshot postSnapshot = firestore.collection("posts")
                        .whereIn(FieldPath.documentId(), batch)
                        .get()
                        .get();

                for (DocumentSnapshot doc : postSnapshot.getDocuments()) {
                    Map<String, Object> post = doc.getData();
                    if (post != null) {
                        // Filter out seeded posts (userId starts with "seed_user_")
                        String userId = (String) post.get("userId");
                        if (userId != null && userId.startsWith("seed_user_")) {
                            continue; // Skip seeded posts
                        }
                        post.put("id", doc.getId());
                        posts.add(post);
                    }
                }
            }

            // Only include tower if it has at least one non-seeded post
            if (posts.isEmpty()) {
                continue;
            }

            // Create tower response
            TowerResponse towerResponse = new TowerResponse(
                    tower.getTowerId(),
                    tower.getLatitude(),
                    tower.getLongitude(),
                    posts.size(),
                    posts);

            towerResponses.add(towerResponse);
        }

        // Sort by post count (descending)
        towerResponses.sort((a, b) -> Integer.compare(b.getPostCount(), a.getPostCount()));

        return towerResponses;
    }

    /**
     * Get all towers with their statistics
     */
    public List<Map<String, Object>> getAllTowersWithStats()
            throws ExecutionException, InterruptedException {

        List<Tower> towers = towerService.getAllTowers();
        List<Map<String, Object>> towerStats = new ArrayList<>();

        for (Tower tower : towers) {
            Map<String, Object> stats = new HashMap<>();
            stats.put("towerId", tower.getTowerId());
            stats.put("latitude", tower.getLatitude());
            stats.put("longitude", tower.getLongitude());
            stats.put("radiusMeters", tower.getRadiusMeters());
            stats.put("postCount", tower.getPostCount());
            stats.put("postIds", tower.getPostIds());
            stats.put("createdAt", tower.getCreatedAt());
            stats.put("updatedAt", tower.getUpdatedAt());
            towerStats.add(stats);
        }

        return towerStats;
    }

    /**
     * Get posts for a specific tower (for vibe summary)
     * 
     * @param towerId The ID of the tower
     * @param limit   Maximum number of recent posts to fetch (default: 20)
     * @return List of posts for the tower
     */
    public List<Map<String, Object>> getPostsForTower(String towerId, Integer limit)
            throws ExecutionException, InterruptedException {

        // Get tower to verify it exists and get post IDs
        Optional<Tower> towerOpt = towerService.getTowerById(towerId);
        if (towerOpt.isEmpty()) {
            throw new IllegalArgumentException("Tower not found: " + towerId);
        }

        Tower tower = towerOpt.get();
        List<String> postIds = tower.getPostIds();

        if (postIds == null || postIds.isEmpty()) {
            return List.of(); // No posts in this tower
        }

        // Limit the number of posts
        int maxPosts = limit != null ? Math.min(limit, postIds.size()) : Math.min(20, postIds.size());
        List<String> limitedPostIds = postIds.subList(Math.max(0, postIds.size() - maxPosts), postIds.size());

        // Fetch post details
        List<Map<String, Object>> posts = new ArrayList<>();
        int batchSize = 10;

        for (int i = 0; i < limitedPostIds.size(); i += batchSize) {
            List<String> batch = limitedPostIds.subList(i, Math.min(i + batchSize, limitedPostIds.size()));

            QuerySnapshot postSnapshot = firestore.collection("posts")
                    .whereIn(FieldPath.documentId(), batch)
                    .get()
                    .get();

            for (DocumentSnapshot doc : postSnapshot.getDocuments()) {
                Map<String, Object> post = doc.getData();
                if (post != null) {
                    // Filter out seeded posts
                    String postUserId = (String) post.get("userId");
                    if (postUserId != null && postUserId.startsWith("seed_user_")) {
                        continue;
                    }
                    post.put("id", doc.getId());
                    posts.add(post);
                }
            }
        }

        return posts;
    }

    /**
     * Delete a post
     * 
     * @param postId The ID of the post to delete
     * @param userId The ID of the user requesting deletion (for authorization)
     * @return true if deleted, false if user is not authorized
     * @throws IllegalArgumentException if post not found
     */
    public boolean deletePost(String postId, String userId)
            throws ExecutionException, InterruptedException {

        // Get the post document
        DocumentReference postRef = firestore.collection("posts").document(postId);
        DocumentSnapshot postDoc = postRef.get().get();

        if (!postDoc.exists()) {
            throw new IllegalArgumentException("Post not found with ID: " + postId);
        }

        Map<String, Object> postData = postDoc.getData();
        if (postData == null) {
            throw new IllegalArgumentException("Post data is null");
        }

        // Check authorization - only post owner can delete
        String postOwnerId = (String) postData.get("userId");
        if (!userId.equals(postOwnerId)) {
            return false; // Not authorized
        }

        // Get tower ID before deletion
        String towerId = (String) postData.get("towerId");

        // Delete associated images from storage
        List<String> imageUrls = (List<String>) postData.get("images");
        if (imageUrls != null && !imageUrls.isEmpty()) {
            try {
                storageService.deleteImages(imageUrls);
            } catch (Exception e) {
                // Log but don't fail deletion if image deletion fails
                System.err.println("Warning: Failed to delete images for post " + postId + ": " + e.getMessage());
            }
        }

        // Delete the post from Firestore
        postRef.delete().get();

        // Remove post from tower
        if (towerId != null && !towerId.isEmpty()) {
            try {
                towerService.removePostFromTower(towerId, postId);
            } catch (Exception e) {
                // Log but don't fail if tower update fails
                System.err.println("Warning: Failed to update tower after post deletion: " + e.getMessage());
            }

            // Delete the corresponding chat message (if it was added as a chat message)
            try {
                deletePostChatMessage(towerId, postId);
            } catch (Exception e) {
                // Log but don't fail if chat message deletion fails
                System.err.println("Warning: Failed to delete chat message for post " + postId + ": " + e.getMessage());
            }
        }

        return true;
    }

    /**
     * Delete a post's chat message from Firebase Realtime Database
     */
    private void deletePostChatMessage(String towerId, String postId) {
        try {
            com.google.firebase.database.DatabaseReference chatRef = com.google.firebase.database.FirebaseDatabase
                    .getInstance()
                    .getReference("chats")
                    .child(towerId)
                    .child("messages");

            // Query for messages with this postId
            chatRef.orderByChild("postId").equalTo(postId).addListenerForSingleValueEvent(
                    new com.google.firebase.database.ValueEventListener() {
                        @Override
                        public void onDataChange(com.google.firebase.database.DataSnapshot snapshot) {
                            for (com.google.firebase.database.DataSnapshot childSnapshot : snapshot.getChildren()) {
                                childSnapshot.getRef().removeValueAsync();
                                System.out
                                        .println("✅ Deleted chat message for post " + postId + " in tower " + towerId);
                            }
                        }

                        @Override
                        public void onCancelled(com.google.firebase.database.DatabaseError error) {
                            System.err.println("❌ Error deleting chat message: " + error.getMessage());
                        }
                    });
        } catch (Exception e) {
            System.err.println("❌ Failed to delete chat message: " + e.getMessage());
        }
    }

}