package com.geowhisper.geowhisperbackendnew.controller;

import com.geowhisper.geowhisperbackendnew.dto.ApiResponse;
import com.geowhisper.geowhisperbackendnew.dto.CreatePostRequest;
import com.geowhisper.geowhisperbackendnew.dto.NearbyPostsRequest;
import com.geowhisper.geowhisperbackendnew.service.PostService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/posts")
public class PostController {

    @Autowired
    private PostService postService;

    @PostMapping
    public ResponseEntity<?> createPost(
            @RequestHeader("X-User-Id") String userId,
            @RequestHeader(value = "X-Username", defaultValue = "Anonymous") String username,
            @RequestBody CreatePostRequest request) {
        try {
            Map<String, Object> post = postService.createPost(userId, username, request);
            return ResponseEntity.ok(ApiResponse.success("Post created successfully", post));
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
}
