package com.geowhisper.geowhisperbackendnew.controller;

import com.geowhisper.geowhisperbackendnew.dto.ApiResponse;
import com.geowhisper.geowhisperbackendnew.service.LocationPermissionService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

/**
 * Controller for tower interaction permission checks
 */
@RestController
@RequestMapping("/api/towers")
@CrossOrigin(origins = "*")
@Slf4j
public class TowerPermissionController {

    @Autowired
    private LocationPermissionService locationPermissionService;

    /**
     * Check if user can interact with a tower based on their location
     * 
     * GET /api/towers/{towerId}/can-interact?latitude=X&longitude=Y
     * 
     * Returns:
     * {
     *   "canInteract": true/false,
     *   "distance": 234.5,
     *   "interactionRadius": 550.0,
     *   "message": "You can interact with this tower" or "View-only mode - you are too far"
     * }
     */
    @GetMapping("/{towerId}/can-interact")
    public ResponseEntity<?> checkInteractionPermission(
            @PathVariable String towerId,
            @RequestParam double latitude,
            @RequestParam double longitude) {
        
        try {
            boolean canInteract = locationPermissionService.canInteractWithTower(
                    towerId, latitude, longitude);
            
            double distance = locationPermissionService.getDistanceFromTower(
                    towerId, latitude, longitude);
            
            Map<String, Object> result = new HashMap<>();
            result.put("canInteract", canInteract);
            result.put("distance", Math.round(distance * 10) / 10.0); // Round to 1 decimal
            result.put("interactionRadius", locationPermissionService.getInteractionRadius());
            
            if (canInteract) {
                result.put("message", "You can interact with this tower");
                result.put("permissions", Map.of(
                    "canChat", true,
                    "canPost", true,
                    "canLike", true,
                    "canDelete", true,
                    "canComment", true
                ));
            } else {
                result.put("message", String.format(
                    "View-only mode - you are %.0fm away (must be within %.0fm)",
                    distance, locationPermissionService.getInteractionRadius()));
                result.put("permissions", Map.of(
                    "canChat", false,
                    "canPost", false,
                    "canLike", false,
                    "canDelete", false,
                    "canComment", false,
                    "canView", true,
                    "canUseSummarizer", true
                ));
            }
            
            return ResponseEntity.ok(ApiResponse.success(
                    "Permission check completed", result));
            
        } catch (Exception e) {
            log.error("Error checking tower interaction permission: {}", e.getMessage(), e);
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Failed to check permission: " + e.getMessage()));
        }
    }

    /**
     * Get distance from tower
     * 
     * GET /api/towers/{towerId}/distance?latitude=X&longitude=Y
     */
    @GetMapping("/{towerId}/distance")
    public ResponseEntity<?> getDistanceFromTower(
            @PathVariable String towerId,
            @RequestParam double latitude,
            @RequestParam double longitude) {
        
        try {
            double distance = locationPermissionService.getDistanceFromTower(
                    towerId, latitude, longitude);
            
            Map<String, Object> result = new HashMap<>();
            result.put("towerId", towerId);
            result.put("distance", Math.round(distance * 10) / 10.0);
            result.put("unit", "meters");
            
            return ResponseEntity.ok(ApiResponse.success(
                    "Distance calculated", result));
            
        } catch (Exception e) {
            log.error("Error calculating distance: {}", e.getMessage(), e);
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Failed to calculate distance: " + e.getMessage()));
        }
    }
}
