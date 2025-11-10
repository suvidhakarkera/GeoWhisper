package com.geowhisper.geowhisperbackendnew.service;

import com.google.cloud.firestore.*;
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

        QuerySnapshot querySnapshot = firestore.collection("posts")
                .whereEqualTo("userId", userId)
                .orderBy("createdAt", Query.Direction.DESCENDING)
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
                        post.put("id", doc.getId());
                        posts.add(post);
                    }
                }
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

}