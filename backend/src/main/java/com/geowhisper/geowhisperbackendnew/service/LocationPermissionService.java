package com.geowhisper.geowhisperbackendnew.service;

import com.geowhisper.geowhisperbackendnew.model.Tower;
import com.geowhisper.geowhisperbackendnew.util.GeoUtils;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.concurrent.ExecutionException;

/**
 * Service to validate if a user has permission to interact with a tower
 * based on their distance from the tower center.
 * 
 * Rules:
 * - Within 500m: Full access (post, chat, like, delete, comment)
 * - Beyond 500m: View-only (can view chats, use summarizers, but no interactions)
 */
@Service
@Slf4j
public class LocationPermissionService {

    @Autowired
    private TowerService towerService;

    // Distance threshold for full interaction permissions (in meters)
    private static final double INTERACTION_RADIUS_METERS = 500.0;

    /**
     * Check if a user can interact with a tower (post, chat, like, delete)
     * 
     * @param towerId       The tower ID
     * @param userLatitude  User's current latitude
     * @param userLongitude User's current longitude
    * @return true if user is within 500m of tower center, false otherwise
     */
    public boolean canInteractWithTower(String towerId, double userLatitude, double userLongitude) 
            throws ExecutionException, InterruptedException {
        
        // Get tower details
        Tower tower = towerService.getTowerById(towerId).orElse(null);
        
        if (tower == null) {
            log.warn("Tower not found: {}", towerId);
            return false;
        }

        // Calculate distance between user and tower center
        double distance = GeoUtils.calculateDistance(
                userLatitude, userLongitude,
                tower.getLatitude(), tower.getLongitude()
        );

        boolean canInteract = distance <= INTERACTION_RADIUS_METERS;
        
        log.info("User distance from tower {}: {}m - Can interact: {}", 
            towerId, distance, canInteract);
        
        return canInteract;
    }

    /**
     * Get the distance of a user from a tower center
     * 
     * @param towerId       The tower ID
     * @param userLatitude  User's current latitude
     * @param userLongitude User's current longitude
     * @return Distance in meters
     */
    public double getDistanceFromTower(String towerId, double userLatitude, double userLongitude) 
            throws ExecutionException, InterruptedException {
        
        Tower tower = towerService.getTowerById(towerId).orElse(null);
        
        if (tower == null) {
            log.warn("Tower not found: {}", towerId);
            return Double.MAX_VALUE;
        }

        log.debug("Tower {} center: lat={}, lon={}", towerId, tower.getLatitude(), tower.getLongitude());
        
        double distance = GeoUtils.calculateDistance(
                userLatitude, userLongitude,
                tower.getLatitude(), tower.getLongitude()
        );
        
        log.debug("Calculated distance: {:.2f}m", distance);
        
        return distance;
    }

    /**
     * Validate if user can perform an action on a tower.
     * Throws exception if user doesn't have permission.
     * 
     * @param towerId       The tower ID
     * @param userLatitude  User's current latitude
     * @param userLongitude User's current longitude
     * @param actionName    Name of the action being performed (for error message)
     * @throws IllegalStateException if user is too far from tower
     */
    public void validateInteractionPermission(String towerId, double userLatitude, 
                                             double userLongitude, String actionName) 
            throws ExecutionException, InterruptedException {
        
        double distance = getDistanceFromTower(towerId, userLatitude, userLongitude);
        
        log.info("=== VALIDATING INTERACTION ===");
        log.info("Tower ID: {}", towerId);
        log.info("User location: lat={}, lon={}", userLatitude, userLongitude);
        log.info("Distance from tower center: {:.2f}m", distance);
        log.info("Interaction radius: {:.0f}m", INTERACTION_RADIUS_METERS);
        log.info("Can interact: {}", distance <= INTERACTION_RADIUS_METERS);
        
        if (distance > INTERACTION_RADIUS_METERS) {
            String errorMsg = String.format(
                    "You must be within %.0fm of the tower to %s. You are %.0fm away (view-only mode).",
                    INTERACTION_RADIUS_METERS, actionName, distance
            );
            log.warn("Permission denied: {}", errorMsg);
            throw new IllegalStateException(errorMsg);
        }
        
        log.info("Permission granted to {} at tower {}", actionName, towerId);
    }

    /**
     * Get interaction radius in meters
     */
    public double getInteractionRadius() {
        return INTERACTION_RADIUS_METERS;
    }
}
