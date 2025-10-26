package com.geowhisper.geowhisperbackendnew.controller;

import com.geowhisper.geowhisperbackendnew.dto.ApiResponse;
import com.geowhisper.geowhisperbackendnew.dto.NearbyPostsRequest;
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

    @PostMapping("/vibe-summary")
    public ResponseEntity<?> getVibeSummary(@RequestBody NearbyPostsRequest request) {
        try {
            List<Map<String, Object>> posts = postService.getRecentPostsForZone(
                    request.getLatitude(),
                    request.getLongitude(),
                    request.getRadiusMeters());

            String summary = aiAgentService.generateVibeSummary(posts);

            Map<String, Object> response = Map.of(
                    "summary", summary,
                    "postCount", posts.size(),
                    "location", Map.of(
                            "latitude", request.getLatitude(),
                            "longitude", request.getLongitude()));

            return ResponseEntity.ok(ApiResponse.success("Vibe summary generated", response));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Failed to generate vibe summary: " + e.getMessage()));
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
