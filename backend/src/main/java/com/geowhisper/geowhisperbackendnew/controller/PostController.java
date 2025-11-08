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

    @PostMapping("/{postId}/like")
    public ResponseEntity<?> likePost(
            @PathVariable String postId,
            @RequestHeader("X-User-Id") String userId) {
        try {
            Map<String, Object> result = postService.likePost(postId, userId);
            return ResponseEntity.ok(ApiResponse.success("Post liked successfully", result));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Failed to like post: " + e.getMessage()));
        }
    }

    @DeleteMapping("/{postId}/like")
    public ResponseEntity<?> unlikePost(
            @PathVariable String postId,
            @RequestHeader("X-User-Id") String userId) {
        try {
            Map<String, Object> result = postService.unlikePost(postId, userId);
            return ResponseEntity.ok(ApiResponse.success("Post unliked successfully", result));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Failed to unlike post: " + e.getMessage()));
        }
    }

    @PostMapping("/{postId}/comment")
    public ResponseEntity<?> addComment(
            @PathVariable String postId,
            @RequestHeader("X-User-Id") String userId,
            @RequestHeader(value = "X-Username", defaultValue = "Anonymous") String username,
            @RequestBody Map<String, String> request) {
        try {
            String commentText = request.get("comment");
            if (commentText == null || commentText.trim().isEmpty()) {
                return ResponseEntity.badRequest()
                        .body(ApiResponse.error("Comment text is required"));
            }

            Map<String, Object> comment = postService.addComment(postId, userId, username, commentText);
            return ResponseEntity.ok(ApiResponse.success("Comment added successfully", comment));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Failed to add comment: " + e.getMessage()));
        }
    }

    @GetMapping("/{postId}/comments")
    public ResponseEntity<?> getComments(@PathVariable String postId) {
        try {
            List<Map<String, Object>> comments = postService.getComments(postId);
            return ResponseEntity.ok(ApiResponse.success("Fetched comments", comments));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Failed to fetch comments: " + e.getMessage()));
        }
    }

    @DeleteMapping("/{postId}")
    public ResponseEntity<?> deletePost(
            @PathVariable String postId,
            @RequestHeader("X-User-Id") String userId) {
        try {
            postService.deletePost(postId, userId);
            return ResponseEntity.ok(ApiResponse.success("Post deleted successfully", null));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Failed to delete post: " + e.getMessage()));
        }
    }
}
