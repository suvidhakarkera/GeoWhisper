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

    @PostMapping(consumes = {"multipart/form-data"})
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

    @GetMapping("/user/{userId}")
    public ResponseEntity<?> getUserPosts(@PathVariable String userId) {
        try {
            List<Map<String, Object>> posts = postService.getUserPosts(userId);
            return ResponseEntity.ok(ApiResponse.success("Fetched user posts", posts));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Failed to fetch posts: " + e.getMessage()));
        }
    }

    @PostMapping("/towers")
    public ResponseEntity<?> getPostsGroupedIntoTowers(@RequestBody TowersRequest request) {
        try {
            int clusterRadius = request.getClusterRadiusMeters() != null 
                ? request.getClusterRadiusMeters() : 50;
            int maxPosts = request.getMaxPosts() != null 
                ? request.getMaxPosts() : 1000;

            List<TowerResponse> towers = postService.getPostsGroupedIntoTowers(
                clusterRadius, 
                maxPosts
            );

            return ResponseEntity.ok(ApiResponse.success(
                "Found " + towers.size() + " towers with " + 
                towers.stream().mapToInt(TowerResponse::getPostCount).sum() + " total posts",
                towers
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Failed to cluster posts into towers: " + e.getMessage()));
        }
    }
}
