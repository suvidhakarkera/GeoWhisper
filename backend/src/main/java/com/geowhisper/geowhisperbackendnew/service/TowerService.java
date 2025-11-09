package com.geowhisper.geowhisperbackendnew.service;

import com.google.cloud.Timestamp;
import com.google.cloud.firestore.*;
import com.geowhisper.geowhisperbackendnew.model.Tower;
import com.geowhisper.geowhisperbackendnew.util.GeoUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.concurrent.ExecutionException;

/**
 * Service for managing persistent towers in Firestore.
 * Towers are created when posts are made and remain stable over time.
 */
@Service
public class TowerService {
    
    @Autowired
    private Firestore firestore;
    
    private static final String TOWERS_COLLECTION = "towers";
    private static final int DEFAULT_TOWER_RADIUS = 50; // meters
    
    /**
     * Find an existing tower within the specified radius of the given location.
     * Returns the closest tower if multiple towers are found.
     * 
     * @param latitude Post latitude
     * @param longitude Post longitude
     * @param radiusMeters Search radius in meters
     * @return Optional containing the closest tower, or empty if none found
     */
    public Optional<Tower> findNearestTower(double latitude, double longitude, int radiusMeters) 
            throws ExecutionException, InterruptedException {
        
        // Fetch all towers from Firestore
        QuerySnapshot querySnapshot = firestore.collection(TOWERS_COLLECTION)
            .get()
            .get();
        
        Tower nearestTower = null;
        double minDistance = Double.MAX_VALUE;
        
        for (DocumentSnapshot doc : querySnapshot.getDocuments()) {
            Tower tower = documentToTower(doc);
            if (tower == null) continue;
            
            // Calculate distance from post to tower center
            double distance = GeoUtils.calculateDistance(
                latitude, longitude,
                tower.getLatitude(), tower.getLongitude()
            );
            
            // Check if post is within this tower's radius
            if (distance <= radiusMeters && distance < minDistance) {
                nearestTower = tower;
                minDistance = distance;
            }
        }
        
        return Optional.ofNullable(nearestTower);
    }
    
    /**
     * Create a new tower at the specified location.
     * This is called when a post is created and no existing tower is found nearby.
     * 
     * @param latitude Tower center latitude (from first post)
     * @param longitude Tower center longitude (from first post)
     * @param radiusMeters Tower radius in meters
     * @param firstPostId ID of the first post in this tower
     * @return The newly created tower
     */
    public Tower createTower(double latitude, double longitude, int radiusMeters, String firstPostId) 
            throws ExecutionException, InterruptedException {
        
        // Generate a unique tower ID
        DocumentReference docRef = firestore.collection(TOWERS_COLLECTION).document();
        String towerId = docRef.getId();
        
        // Create tower object
        Tower tower = new Tower(towerId, latitude, longitude, radiusMeters);
        tower.addPost(firstPostId);
        tower.setCreatedAt(Timestamp.now());
        tower.setUpdatedAt(Timestamp.now());
        
        // Save to Firestore
        Map<String, Object> towerData = towerToMap(tower);
        docRef.set(towerData).get();
        
        return tower;
    }
    
    /**
     * Add a post to an existing tower.
     * Updates the tower's post count and last updated timestamp.
     * 
     * @param towerId ID of the tower
     * @param postId ID of the post to add
     */
    public void addPostToTower(String towerId, String postId) 
            throws ExecutionException, InterruptedException {
        
        DocumentReference docRef = firestore.collection(TOWERS_COLLECTION).document(towerId);
        
        // Use Firestore transaction to ensure atomic update
        firestore.runTransaction(transaction -> {
            DocumentSnapshot snapshot = transaction.get(docRef).get();
            
            if (!snapshot.exists()) {
                throw new RuntimeException("Tower not found: " + towerId);
            }
            
            @SuppressWarnings("unchecked")
            List<String> postIds = (List<String>) snapshot.get("postIds");
            if (postIds == null) {
                postIds = new ArrayList<>();
            }
            
            // Add post ID if not already present
            if (!postIds.contains(postId)) {
                postIds.add(postId);
                
                transaction.update(docRef, 
                    "postIds", postIds,
                    "postCount", postIds.size(),
                    "updatedAt", Timestamp.now()
                );
            }
            
            return null;
        }).get();
    }
    
    /**
     * Get a tower by its ID.
     * 
     * @param towerId Tower ID
     * @return Optional containing the tower, or empty if not found
     */
    public Optional<Tower> getTowerById(String towerId) 
            throws ExecutionException, InterruptedException {
        
        DocumentSnapshot doc = firestore.collection(TOWERS_COLLECTION)
            .document(towerId)
            .get()
            .get();
        
        if (!doc.exists()) {
            return Optional.empty();
        }
        
        return Optional.ofNullable(documentToTower(doc));
    }
    
    /**
     * Get all towers from the database.
     * 
     * @return List of all towers
     */
    public List<Tower> getAllTowers() throws ExecutionException, InterruptedException {
        QuerySnapshot querySnapshot = firestore.collection(TOWERS_COLLECTION)
            .orderBy("postCount", Query.Direction.DESCENDING)
            .get()
            .get();
        
        List<Tower> towers = new ArrayList<>();
        for (DocumentSnapshot doc : querySnapshot.getDocuments()) {
            Tower tower = documentToTower(doc);
            if (tower != null) {
                towers.add(tower);
            }
        }
        
        return towers;
    }
    
    /**
     * Get towers within a specific geographic area.
     * Note: This is a simple implementation that fetches all towers and filters.
     * For production, consider using geohashing or GeoFirestore for better performance.
     * 
     * @param centerLat Center latitude
     * @param centerLon Center longitude
     * @param radiusMeters Search radius in meters
     * @return List of towers within the radius
     */
    public List<Tower> getTowersInArea(double centerLat, double centerLon, int radiusMeters) 
            throws ExecutionException, InterruptedException {
        
        List<Tower> allTowers = getAllTowers();
        List<Tower> towersInArea = new ArrayList<>();
        
        for (Tower tower : allTowers) {
            double distance = GeoUtils.calculateDistance(
                centerLat, centerLon,
                tower.getLatitude(), tower.getLongitude()
            );
            
            if (distance <= radiusMeters) {
                towersInArea.add(tower);
            }
        }
        
        return towersInArea;
    }
    
    /**
     * Convert Firestore document to Tower object.
     */
    private Tower documentToTower(DocumentSnapshot doc) {
        if (!doc.exists()) {
            return null;
        }
        
        try {
            Tower tower = new Tower();
            tower.setTowerId(doc.getId());
            tower.setLatitude(doc.getDouble("latitude"));
            tower.setLongitude(doc.getDouble("longitude"));
            tower.setRadiusMeters(doc.getLong("radiusMeters").intValue());
            
            @SuppressWarnings("unchecked")
            List<String> postIds = (List<String>) doc.get("postIds");
            tower.setPostIds(postIds != null ? postIds : new ArrayList<>());
            tower.setPostCount(doc.getLong("postCount").intValue());
            tower.setCreatedAt(doc.getTimestamp("createdAt"));
            tower.setUpdatedAt(doc.getTimestamp("updatedAt"));
            
            return tower;
        } catch (Exception e) {
            System.err.println("Error converting document to Tower: " + e.getMessage());
            return null;
        }
    }
    
    /**
     * Convert Tower object to Firestore map.
     */
    private Map<String, Object> towerToMap(Tower tower) {
        Map<String, Object> map = new HashMap<>();
        map.put("latitude", tower.getLatitude());
        map.put("longitude", tower.getLongitude());
        map.put("radiusMeters", tower.getRadiusMeters());
        map.put("postIds", tower.getPostIds());
        map.put("postCount", tower.getPostCount());
        map.put("createdAt", tower.getCreatedAt());
        map.put("updatedAt", tower.getUpdatedAt());
        return map;
    }
}
