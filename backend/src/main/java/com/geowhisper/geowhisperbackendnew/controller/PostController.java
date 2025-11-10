package com.geowhisper.geowhisperbackendnew.controller;

import com.geowhisper.geowhisperbackendnew.dto.ApiResponse;
import com.geowhisper.geowhisperbackendnew.dto.CreatePostRequest;
import com.geowhisper.geowhisperbackendnew.dto.NearbyPostsRequest;
import com.geowhisper.geowhisperbackendnew.dto.TowerResponse;
import com.geowhisper.geowhisperbackendnew.dto.TowersRequest;
import com.geowhisper.geowhisperbackendnew.service.PostService;
import com.geowhisper.geowhisperbackendnew.service.StorageService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/posts")
public class PostController {

    @Autowired
    private PostService postService;

    @Autowired
    private StorageService storageService;

    @PostMapping(consumes = { "multipart/form-data" })
    public ResponseEntity<?> createPost(
            @RequestHeader("X-User-Id") String userId,
            @RequestHeader(value = "X-Username", defaultValue = "Anonymous") String username,
            @RequestParam("content") String content,
            @RequestParam("latitude") double latitude,
            @RequestParam("longitude") double longitude,
            @RequestParam(value = "images", required = false) MultipartFile[] images) {
        try {
            // Validate images if provided
            if (images != null && images.length > 0) {
                storageService.validateImageFiles(images);
            }

            // Create request object
            CreatePostRequest request = new CreatePostRequest();
            request.setContent(content);
            request.setLatitude(latitude);
            request.setLongitude(longitude);

            // Create post with images
            Map<String, Object> post = postService.createPost(userId, username, request, images);
            return ResponseEntity.ok(ApiResponse.success("Post created successfully", post));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Validation error: " + e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Failed to create post: " + e.getMessage()));
        }
    }

    @PostMapping("/nearby")
    public ResponseEntity<?> getNearbyPosts(@RequestBody NearbyPostsRequest request) {
        try {
            List<Map<String, Object>> posts = postService.getNearbyPosts(
                    request.getLatitude(),
                    request.getLongitude(),
                    request.getRadiusMeters(),
                    request.getLimit());

            return ResponseEntity.ok(ApiResponse.success(
                    "Found " + posts.size() + " nearby posts",
                    posts));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Failed to fetch posts: " + e.getMessage()));
        }
    }

    /**
     * Get all posts by a specific user
     * 
     * GET /api/posts/user/{userId}
     * Optional query parameters:
     * - limit: Maximum number of posts (default: 100, max: 1000)
     * - sortBy: Sort order - "newest" or "oldest" (default: "newest")
     * - includeStats: Include post statistics (default: false)
     * 
     * Example: /api/posts/user/abc123?limit=50&sortBy=newest&includeStats=true
     */
    @GetMapping("/user/{userId}")
    public ResponseEntity<?> getUserPosts(
            @PathVariable String userId,
            @RequestParam(defaultValue = "100") int limit,
            @RequestParam(defaultValue = "newest") String sortBy,
            @RequestParam(defaultValue = "false") boolean includeStats) {

        // Validate userId
        if (userId == null || userId.trim().isEmpty()) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("User ID is required"));
        }

        // Validate limit
        if (limit < 1 || limit > 1000) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Limit must be between 1 and 1000"));
        }

        // Validate sortBy
        if (!sortBy.equals("newest") && !sortBy.equals("oldest")) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("sortBy must be 'newest' or 'oldest'"));
        }

        try {
            List<Map<String, Object>> posts = postService.getUserPosts(userId);

            // Handle empty result
            if (posts == null || posts.isEmpty()) {
                return ResponseEntity.ok(ApiResponse.success(
                        "No posts found for this user",
                        List.of()));
            }

            // Sort posts
            if (sortBy.equals("oldest")) {
                posts.sort((a, b) -> {
                    try {
                        String dateA = (String) a.get("createdAt");
                        String dateB = (String) b.get("createdAt");
                        return dateA.compareTo(dateB);
                    } catch (Exception e) {
                        return 0;
                    }
                });
            } else {
                // Default: newest first
                posts.sort((a, b) -> {
                    try {
                        String dateA = (String) a.get("createdAt");
                        String dateB = (String) b.get("createdAt");
                        return dateB.compareTo(dateA);
                    } catch (Exception e) {
                        return 0;
                    }
                });
            }

            // Apply limit
            List<Map<String, Object>> limitedPosts = posts.stream()
                    .limit(limit)
                    .toList();

            // Add statistics if requested
            if (includeStats) {
                Map<String, Object> stats = new java.util.HashMap<>();
                stats.put("totalPosts", posts.size());
                stats.put("returnedPosts", limitedPosts.size());
                stats.put("userId", userId);
                stats.put("sortBy", sortBy);

                // Calculate total interactions
                int totalLikes = posts.stream()
                        .mapToInt(p -> (Integer) p.getOrDefault("likes", 0))
                        .sum();
                int totalComments = posts.stream()
                        .mapToInt(p -> (Integer) p.getOrDefault("commentCount", 0))
                        .sum();

                stats.put("totalLikes", totalLikes);
                stats.put("totalComments", totalComments);
                stats.put("totalInteractions", totalLikes + totalComments);

                // Most liked post
                posts.stream()
                        .max((a, b) -> Integer.compare(
                                (Integer) a.getOrDefault("likes", 0),
                                (Integer) b.getOrDefault("likes", 0)))
                        .ifPresent(mostLiked -> stats.put("mostLikedPostId", mostLiked.get("id")));

                // Create response with stats
                Map<String, Object> response = new java.util.HashMap<>();
                response.put("posts", limitedPosts);
                response.put("statistics", stats);

                return ResponseEntity.ok(ApiResponse.success(
                        "Fetched " + limitedPosts.size() + " posts with statistics",
                        response));
            }

            return ResponseEntity.ok(ApiResponse.success(
                    "Fetched " + limitedPosts.size() + " posts",
                    limitedPosts));

        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Failed to fetch posts: " + e.getMessage()));
        }
    }

    /**
     * Delete a user's post
     * 
     * DELETE /api/posts/{postId}
     * Headers: X-User-Id (required for authorization)
     */
    @DeleteMapping("/{postId}")
    public ResponseEntity<?> deletePost(
            @PathVariable String postId,
            @RequestHeader("X-User-Id") String userId) {

        // Validate inputs
        if (postId == null || postId.trim().isEmpty()) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Post ID is required"));
        }

        if (userId == null || userId.trim().isEmpty()) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("User ID is required"));
        }

        try {
            boolean deleted = postService.deletePost(postId, userId);

            if (deleted) {
                return ResponseEntity.ok(ApiResponse.success(
                        "Post deleted successfully",
                        Map.of("postId", postId)));
            } else {
                return ResponseEntity.status(403)
                        .body(ApiResponse.error("You are not authorized to delete this post"));
            }

        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(404)
                    .body(ApiResponse.error("Post not found: " + e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Failed to delete post: " + e.getMessage()));
        }
    }

    /**
     * Get user post statistics
     * 
     * GET /api/posts/user/{userId}/stats
     */
    @GetMapping("/user/{userId}/stats")
    public ResponseEntity<?> getUserPostStats(@PathVariable String userId) {
        if (userId == null || userId.trim().isEmpty()) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("User ID is required"));
        }

        try {
            List<Map<String, Object>> posts = postService.getUserPosts(userId);

            Map<String, Object> stats = new java.util.HashMap<>();
            stats.put("userId", userId);
            stats.put("totalPosts", posts.size());

            if (posts.isEmpty()) {
                stats.put("totalLikes", 0);
                stats.put("totalComments", 0);
                stats.put("averageLikes", 0.0);
                stats.put("averageComments", 0.0);
                stats.put("firstPostDate", null);
                stats.put("lastPostDate", null);

                return ResponseEntity.ok(ApiResponse.success(
                        "User has no posts yet",
                        stats));
            }

            // Calculate statistics
            int totalLikes = posts.stream()
                    .mapToInt(p -> (Integer) p.getOrDefault("likes", 0))
                    .sum();
            int totalComments = posts.stream()
                    .mapToInt(p -> (Integer) p.getOrDefault("commentCount", 0))
                    .sum();

            stats.put("totalLikes", totalLikes);
            stats.put("totalComments", totalComments);
            stats.put("totalInteractions", totalLikes + totalComments);
            stats.put("averageLikes", (double) totalLikes / posts.size());
            stats.put("averageComments", (double) totalComments / posts.size());

            // Date range
            posts.sort((a, b) -> {
                String dateA = (String) a.get("createdAt");
                String dateB = (String) b.get("createdAt");
                return dateA.compareTo(dateB);
            });

            stats.put("firstPostDate", posts.get(0).get("createdAt"));
            stats.put("lastPostDate", posts.get(posts.size() - 1).get("createdAt"));

            // Most engaged post
            posts.stream()
                    .max((a, b) -> {
                        int engagementA = (Integer) a.getOrDefault("likes", 0) +
                                (Integer) a.getOrDefault("commentCount", 0);
                        int engagementB = (Integer) b.getOrDefault("likes", 0) +
                                (Integer) b.getOrDefault("commentCount", 0);
                        return Integer.compare(engagementA, engagementB);
                    })
                    .ifPresent(mostEngaged -> {
                        stats.put("mostEngagedPost", Map.of(
                                "id", mostEngaged.get("id"),
                                "content", mostEngaged.get("content"),
                                "likes", mostEngaged.get("likes"),
                                "comments", mostEngaged.get("commentCount")));
                    });

            return ResponseEntity.ok(ApiResponse.success(
                    "User statistics retrieved successfully",
                    stats));

        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Failed to fetch statistics: " + e.getMessage()));
        }
    }

    @PostMapping("/towers")
    public ResponseEntity<?> getPostsGroupedIntoTowers(@RequestBody TowersRequest request) {
        try {
            int clusterRadius = request.getClusterRadiusMeters() != null
                    ? request.getClusterRadiusMeters()
                    : 50;
            int maxPosts = request.getMaxPosts() != null
                    ? request.getMaxPosts()
                    : 1000;

            List<TowerResponse> towers = postService.getPostsGroupedIntoTowers(
                    clusterRadius,
                    maxPosts);

            return ResponseEntity.ok(ApiResponse.success(
                    "Found " + towers.size() + " towers with " +
                            towers.stream().mapToInt(TowerResponse::getPostCount).sum() + " total posts",
                    towers));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Failed to cluster posts into towers: " + e.getMessage()));
        }
    }
}
