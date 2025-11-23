package com.geowhisper.geowhisperbackendnew.controller;

import com.geowhisper.geowhisperbackendnew.dto.ApiResponse;
import com.geowhisper.geowhisperbackendnew.dto.HotZoneRequest;
import com.geowhisper.geowhisperbackendnew.dto.HotZonesMapResponse;
import com.geowhisper.geowhisperbackendnew.service.HotZoneService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.concurrent.CompletableFuture;

@RestController
@RequestMapping("/api/hotzones")
@Slf4j
public class HotZoneController {

        @Autowired
        private HotZoneService hotZoneService;

        /**
         * Get all hot zones based on message activity
         * 
         * POST /api/hotzones
         * 
         * Request Body:
         * {
         * "messageThreshold": 50, // Minimum messages to be considered hot (default:
         * 50)
         * "timeRangeHours": 24, // Time window to check (default: 24)
         * "latitude": 28.6139, // Optional: center point for search
         * "longitude": 77.2090, // Optional: center point for search
         * "radiusKm": 10.0 // Optional: search radius in km (default: 10)
         * }
         * 
         * Response includes:
         * - List of hot zones sorted by activity
         * - Activity levels: "hot" (50-99), "very_hot" (100-199), "extreme" (200+)
         * - Activity scores (0-100) based on messages, recent activity, and engagement
         * - Statistics and trending topics
         * 
         * Example:
         * curl -X POST http://localhost:8080/api/hotzones \
         * -H "Content-Type: application/json" \
         * -d '{"messageThreshold":50,"timeRangeHours":24}'
         */
        @PostMapping
        public CompletableFuture<ResponseEntity<ApiResponse>> getHotZones(
                        @RequestBody(required = false) HotZoneRequest request) {
                log.info("Fetching hot zones with threshold: {}",
                                request != null ? request.getMessageThreshold() : 50);

                if (request == null) {
                        request = new HotZoneRequest();
                }

                return hotZoneService.getHotZones(request)
                                .thenApply(response -> {
                                        log.info("Found {} hot zones", response.getTotalHotZones());
                                        return ResponseEntity.ok(ApiResponse.success(
                                                        "Hot zones retrieved successfully",
                                                        response));
                                })
                                .exceptionally(ex -> {
                                        log.error("Error fetching hot zones: {}", ex.getMessage(), ex);
                                        return ResponseEntity.badRequest()
                                                        .body(ApiResponse.error("Failed to fetch hot zones: "
                                                                        + ex.getMessage()));
                                });
        }

        /**
         * Get hot zones within a specific geographic area
         * 
         * POST /api/hotzones/nearby
         * 
         * Request Body:
         * {
         * "latitude": 28.6139,
         * "longitude": 77.2090,
         * "radiusKm": 5.0,
         * "messageThreshold": 30,
         * "timeRangeHours": 12
         * }
         * 
         * Example:
         * curl -X POST http://localhost:8080/api/hotzones/nearby \
         * -H "Content-Type: application/json" \
         * -d '{"latitude":28.6139,"longitude":77.2090,"radiusKm":5.0}'
         */
        @PostMapping("/nearby")
        public CompletableFuture<ResponseEntity<ApiResponse>> getNearbyHotZones(@RequestBody HotZoneRequest request) {
                if (request.getLatitude() == null || request.getLongitude() == null) {
                        return CompletableFuture.completedFuture(
                                        ResponseEntity.badRequest()
                                                        .body(ApiResponse
                                                                        .error("Latitude and longitude are required")));
                }

                log.info("Fetching hot zones near ({}, {}) within {} km",
                                request.getLatitude(), request.getLongitude(), request.getRadiusKm());

                return hotZoneService.getHotZones(request)
                                .thenApply(response -> {
                                        log.info("Found {} hot zones nearby", response.getTotalHotZones());
                                        return ResponseEntity.ok(ApiResponse.success(
                                                        "Nearby hot zones retrieved successfully",
                                                        response));
                                })
                                .exceptionally(ex -> {
                                        log.error("Error fetching nearby hot zones: {}", ex.getMessage(), ex);
                                        return ResponseEntity.badRequest()
                                                        .body(ApiResponse.error("Failed to fetch nearby hot zones: "
                                                                        + ex.getMessage()));
                                });
        }

        /**
         * Get hot zone status for a specific tower
         * 
         * GET /api/hotzones/tower/{towerId}?messageThreshold=50
         * 
         * Returns detailed hot zone information for a single tower:
         * - Current activity level
         * - Message counts (total, last hour, last 24h)
         * - Unique user count
         * - Activity score
         * - Trending topic
         * - Recent active users
         * 
         * Example:
         * curl
         * http://localhost:8080/api/hotzones/tower/RwvBgwnDbPsupDsZ7rH1?messageThreshold=50
         */
        @GetMapping("/tower/{towerId}")
        public CompletableFuture<ResponseEntity<ApiResponse>> getTowerHotZoneStatus(
                        @PathVariable String towerId,
                        @RequestParam(defaultValue = "50") Integer messageThreshold) {

                log.info("Checking hot zone status for tower: {}", towerId);

                return hotZoneService.getTowerHotZoneStatus(towerId, messageThreshold)
                                .thenApply(response -> {
                                        if (response == null) {
                                                return ResponseEntity.ok(ApiResponse.success(
                                                                "Tower is not a hot zone (below threshold)",
                                                                null));
                                        }

                                        log.info("Tower {} is {} with {} messages",
                                                        towerId, response.getActivityLevel(),
                                                        response.getMessageCount());

                                        return ResponseEntity.ok(ApiResponse.success(
                                                        "Tower hot zone status retrieved successfully",
                                                        response));
                                })
                                .exceptionally(ex -> {
                                        log.error("Error checking tower hot zone status: {}", ex.getMessage(), ex);
                                        return ResponseEntity.badRequest()
                                                        .body(ApiResponse.error("Failed to check tower status: "
                                                                        + ex.getMessage()));
                                });
        }

        /**
         * Get hot zones summary statistics
         * 
         * GET /api/hotzones/stats?messageThreshold=50
         * 
         * Returns quick statistics about hot zones:
         * - Total count of hot zones
         * - Count by activity level (hot, very hot, extreme)
         * - Total messages and unique users
         * - Most active zone
         * 
         * Example:
         * curl http://localhost:8080/api/hotzones/stats
         */
        @GetMapping("/stats")
        public CompletableFuture<ResponseEntity<ApiResponse>> getHotZonesStats(
                        @RequestParam(defaultValue = "50") Integer messageThreshold,
                        @RequestParam(defaultValue = "24") Integer timeRangeHours) {

                log.info("Fetching hot zones statistics");

                HotZoneRequest request = new HotZoneRequest();
                request.setMessageThreshold(messageThreshold);
                request.setTimeRangeHours(timeRangeHours);

                return hotZoneService.getHotZones(request)
                                .thenApply(response -> {
                                        HotZonesMapResponse.HotZoneStatistics stats = response.getStatistics();

                                        return ResponseEntity.ok(ApiResponse.success(
                                                        "Hot zones statistics retrieved successfully",
                                                        stats));
                                })
                                .exceptionally(ex -> {
                                        log.error("Error fetching hot zones stats: {}", ex.getMessage(), ex);
                                        return ResponseEntity.badRequest()
                                                        .body(ApiResponse.error(
                                                                        "Failed to fetch stats: " + ex.getMessage()));
                                });
        }
}
