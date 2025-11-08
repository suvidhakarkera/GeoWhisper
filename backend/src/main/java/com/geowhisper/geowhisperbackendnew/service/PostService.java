package com.geowhisper.geowhisperbackendnew.service;

import com.google.cloud.firestore.*;
import com.geowhisper.geowhisperbackendnew.dto.CreatePostRequest;
import com.geowhisper.geowhisperbackendnew.dto.TowerResponse;
import com.geowhisper.geowhisperbackendnew.util.GeoUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.*;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.atomic.AtomicInteger;

@Service
public class PostService {

    @Autowired
    private Firestore firestore;

    @Autowired
    private StorageService storageService;

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

        // Create post data
        Map<String, Object> postData = new HashMap<>();
        postData.put("userId", userId);
        postData.put("username", username);
        postData.put("content", request.getContent());
        postData.put("latitude", request.getLatitude());
        postData.put("longitude", request.getLongitude());
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
        int limit
    ) throws ExecutionException, InterruptedException {
        
        QuerySnapshot querySnapshot = firestore.collection("posts")
            .orderBy("createdAt", Query.Direction.DESCENDING)
            .limit(500)
            .get()
            .get();

        List<Map<String, Object>> nearbyPosts = new ArrayList<>();

        for (DocumentSnapshot doc : querySnapshot.getDocuments()) {
            Map<String, Object> post = doc.getData();
            if (post == null) continue;

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

        nearbyPosts.sort((a, b) -> 
            Double.compare((Double) a.get("distance"), (Double) b.get("distance"))
        );

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
        int radiusMeters
    ) throws ExecutionException, InterruptedException {
        return getNearbyPosts(lat, lon, radiusMeters, 100);
    }

    /**
     * Get all posts and categorize them into towers based on proximity.
     * Posts within the specified cluster radius will be grouped into the same tower.
     * Each tower will have a consolidated coordinate (centroid of all posts in that tower).
     * 
     * @param clusterRadiusMeters The distance threshold in meters for grouping posts into same tower
     * @param maxPosts Maximum number of posts to fetch from database
     * @return List of towers with consolidated coordinates and grouped posts
     */
    public List<TowerResponse> getPostsGroupedIntoTowers(
        int clusterRadiusMeters, 
        int maxPosts
    ) throws ExecutionException, InterruptedException {
        
        // Fetch all posts from database
        QuerySnapshot querySnapshot = firestore.collection("posts")
            .orderBy("createdAt", Query.Direction.DESCENDING)
            .limit(maxPosts)
            .get()
            .get();

        List<Map<String, Object>> allPosts = new ArrayList<>();
        for (DocumentSnapshot doc : querySnapshot.getDocuments()) {
            Map<String, Object> post = doc.getData();
            if (post != null) {
                post.put("id", doc.getId());
                allPosts.add(post);
            }
        }

        // Cluster posts into towers using DBSCAN-like algorithm
        List<TowerResponse> towers = clusterPostsIntoTowers(allPosts, clusterRadiusMeters);
        
        return towers;
    }

    /**
     * Clusters posts into towers based on proximity using a greedy clustering algorithm.
     * This is similar to DBSCAN but simplified for our use case.
     * 
     * @param posts List of all posts to cluster
     * @param radiusMeters Distance threshold for clustering
     * @return List of towers with consolidated coordinates
     */
    private List<TowerResponse> clusterPostsIntoTowers(
        List<Map<String, Object>> posts, 
        int radiusMeters
    ) {
        List<TowerResponse> towers = new ArrayList<>();
        Set<String> processedPostIds = new HashSet<>();
        AtomicInteger towerCounter = new AtomicInteger(1);

        for (Map<String, Object> post : posts) {
            String postId = (String) post.get("id");
            
            // Skip if already processed
            if (processedPostIds.contains(postId)) {
                continue;
            }

            // Create a new tower/cluster for this post
            List<Map<String, Object>> clusterPosts = new ArrayList<>();
            clusterPosts.add(post);
            processedPostIds.add(postId);

            // Find all nearby posts within the cluster radius
            for (Map<String, Object> candidatePost : posts) {
                String candidateId = (String) candidatePost.get("id");
                
                if (processedPostIds.contains(candidateId)) {
                    continue;
                }

                double candidateLat = ((Number) candidatePost.get("latitude")).doubleValue();
                double candidateLon = ((Number) candidatePost.get("longitude")).doubleValue();

                // Check if candidate post is within cluster radius of any post in current cluster
                boolean isNearby = false;
                for (Map<String, Object> clusterPost : clusterPosts) {
                    double clusterPostLat = ((Number) clusterPost.get("latitude")).doubleValue();
                    double clusterPostLon = ((Number) clusterPost.get("longitude")).doubleValue();
                    
                    double distance = GeoUtils.calculateDistance(
                        clusterPostLat, clusterPostLon, 
                        candidateLat, candidateLon
                    );

                    if (distance <= radiusMeters) {
                        isNearby = true;
                        break;
                    }
                }

                if (isNearby) {
                    clusterPosts.add(candidatePost);
                    processedPostIds.add(candidateId);
                }
            }

            // Calculate centroid (consolidated coordinate) for this tower
            double[] centroid = calculateCentroid(clusterPosts);

            // Create tower response
            TowerResponse tower = new TowerResponse(
                "tower-" + towerCounter.getAndIncrement(),
                centroid[0], // latitude
                centroid[1], // longitude
                clusterPosts.size(),
                clusterPosts
            );

            towers.add(tower);
        }

        // Sort towers by post count (descending)
        towers.sort((a, b) -> Integer.compare(b.getPostCount(), a.getPostCount()));

        return towers;
    }

    /**
     * Calculate the centroid (average coordinate) of a list of posts.
     * 
     * @param posts List of posts in the cluster
     * @return Array with [latitude, longitude] of the centroid
     */
    private double[] calculateCentroid(List<Map<String, Object>> posts) {
        if (posts.isEmpty()) {
            return new double[]{0.0, 0.0};
        }

        double sumLat = 0.0;
        double sumLon = 0.0;

        for (Map<String, Object> post : posts) {
            sumLat += ((Number) post.get("latitude")).doubleValue();
            sumLon += ((Number) post.get("longitude")).doubleValue();
        }

        double avgLat = sumLat / posts.size();
        double avgLon = sumLon / posts.size();

        return new double[]{avgLat, avgLon};
    }
}