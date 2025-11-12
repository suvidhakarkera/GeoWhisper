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
 * - Within 550m: Full access (post, chat, like, delete, comment)
 * - Beyond 550m: View-only (can view chats, use summarizers, but no interactions)
 */
@Service
@Slf4j
public class LocationPermissionService {

    @Autowired
    private TowerService towerService;

    // Distance threshold for full interaction permissions (in meters)
    private static final double INTERACTION_RADIUS_METERS = 550.0;

    /**
     * Check if a user can interact with a tower (post, chat, like, delete)
     * 
     * @param towerId       The tower ID
     * @param userLatitude  User's current latitude
     * @param userLongitude User's current longitude
     * @return true if user is within 550m of tower center, false otherwise
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
        
        log.info("User distance from tower {}: {:.2f}m - Can interact: {}", 
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

        return GeoUtils.calculateDistance(
                userLatitude, userLongitude,
                tower.getLatitude(), tower.getLongitude()
        );
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
        
        if (distance > INTERACTION_RADIUS_METERS) {
            throw new IllegalStateException(
                String.format(
                    "You must be within %.0fm of the tower to %s. You are %.0fm away (view-only mode).",
                    INTERACTION_RADIUS_METERS, actionName, distance
                )
            );
        }
    }

    /**
     * Get interaction radius in meters
     */
    public double getInteractionRadius() {
        return INTERACTION_RADIUS_METERS;
    }
}
