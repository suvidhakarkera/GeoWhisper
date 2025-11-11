package com.geowhisper.geowhisperbackendnew.controller;

import com.geowhisper.geowhisperbackendnew.dto.ApiResponse;
import com.geowhisper.geowhisperbackendnew.service.AIAgentService;
import com.geowhisper.geowhisperbackendnew.service.PostService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/ai")
public class AIController {

    @Autowired
    private AIAgentService aiAgentService;

    @Autowired
    private PostService postService;

    /**
     * Get vibe summary for a specific tower
     * GET /api/ai/vibe-summary/tower/{towerId}?limit=20
     * 
     * Returns a casual 3-5 word summary of the tower's vibe based on recent posts
     */
    @GetMapping("/vibe-summary/tower/{towerId}")
    public ResponseEntity<?> getVibeSummaryByTower(
            @PathVariable String towerId,
            @RequestParam(defaultValue = "20") Integer limit) {
        
        // Validate tower ID
        if (towerId == null || towerId.trim().isEmpty()) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Tower ID is required"));
        }

        // Validate limit
        if (limit != null && (limit < 1 || limit > 100)) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Limit must be between 1 and 100"));
        }

        try {
            List<Map<String, Object>> posts = postService.getPostsForTower(towerId, limit);
            
            System.out.println("📊 Fetched " + (posts != null ? posts.size() : 0) + " posts for tower: " + towerId);

            String summary = aiAgentService.generateVibeSummary(posts);
            
            System.out.println("✨ Generated vibe summary: \"" + summary + "\"");

            Map<String, Object> response = Map.of(
                    "summary", summary,
                    "postCount", posts != null ? posts.size() : 0,
                    "towerId", towerId);

            return ResponseEntity.ok(ApiResponse.success("Vibe summary generated", response));
        } catch (IllegalArgumentException e) {
            // Tower not found or invalid
            Map<String, Object> errorResponse = Map.of(
                    "summary", "Tower not found",
                    "postCount", 0,
                    "towerId", towerId);
            
            ApiResponse response = new ApiResponse(false, e.getMessage(), errorResponse);
            return ResponseEntity.status(404).body(response);
        } catch (Exception e) {
            // Unexpected error - return graceful fallback
            Map<String, Object> errorResponse = Map.of(
                    "summary", "Unable to generate",
                    "postCount", 0,
                    "towerId", towerId);
            
            ApiResponse response = new ApiResponse(false, "Service temporarily unavailable", errorResponse);
            return ResponseEntity.status(500).body(response);
        }
    }

    @GetMapping("/welcome")
    public ResponseEntity<?> getWelcomeMessage(
            @RequestParam String zoneName,
            @RequestParam(defaultValue = "0") int postCount) {
        try {
            String message = aiAgentService.generateWelcomeMessage(zoneName, postCount);
            return ResponseEntity.ok(ApiResponse.success("Welcome message generated",
                    Map.of("message", message)));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Failed to generate welcome message: " + e.getMessage()));
        }
    }
}
