package com.geowhisper.geowhisperbackendnew.service;

import com.google.cloud.firestore.*;
import com.geowhisper.geowhisperbackendnew.model.Tower;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.concurrent.ExecutionException;

/**
 * Service for migrating existing posts to the new tower system.
 * This should be run once to assign existing posts to towers.
 */
@Service
@Slf4j
public class TowerMigrationService {
    
    @Autowired
    private Firestore firestore;
    
    @Autowired
    private TowerService towerService;
    
    private static final int TOWER_RADIUS = 50; // meters
    
    /**
     * Migrate all existing posts to towers.
     * This processes all posts that don't have a towerId assigned yet.
     * 
     * @return Migration statistics
     */
    public Map<String, Object> migrateExistingPosts() throws ExecutionException, InterruptedException {
        log.info("Starting tower migration for existing posts...");
        
        Map<String, Object> stats = new HashMap<>();
        int totalPosts = 0;
        int postsProcessed = 0;
        int towersCreated = 0;
        int postsAssigned = 0;
        int errors = 0;
        
        try {
            // Fetch all posts that don't have a towerId
            QuerySnapshot querySnapshot = firestore.collection("posts")
                .orderBy("createdAt", Query.Direction.DESCENDING)
                .get()
                .get();
            
            totalPosts = querySnapshot.size();
            log.info("Found {} total posts to check", totalPosts);
            
            List<DocumentSnapshot> postsToProcess = new ArrayList<>();
            
            // Filter posts without towerId
            for (DocumentSnapshot doc : querySnapshot.getDocuments()) {
                Map<String, Object> post = doc.getData();
                if (post != null && !post.containsKey("towerId")) {
                    postsToProcess.add(doc);
                }
            }
            
            log.info("Found {} posts without towerId to migrate", postsToProcess.size());
            
            // Process each post
            for (DocumentSnapshot doc : postsToProcess) {
                try {
                    String postId = doc.getId();
                    Map<String, Object> post = doc.getData();
                    
                    if (post == null) {
                        log.warn("Post {} has no data, skipping", postId);
                        errors++;
                        continue;
                    }
                    
                    double postLat = ((Number) post.get("latitude")).doubleValue();
                    double postLon = ((Number) post.get("longitude")).doubleValue();
                    
                    // Find or create tower for this post
                    Optional<Tower> nearestTower = towerService.findNearestTower(postLat, postLon, TOWER_RADIUS);
                    String towerId;
                    
                    if (nearestTower.isPresent()) {
                        // Assign to existing tower
                        Tower tower = nearestTower.get();
                        towerId = tower.getTowerId();
                        towerService.addPostToTower(towerId, postId);
                        postsAssigned++;
                        log.debug("Assigned post {} to existing tower {}", postId, towerId);
                    } else {
                        // Create new tower
                        Tower newTower = towerService.createTower(postLat, postLon, TOWER_RADIUS, postId);
                        towerId = newTower.getTowerId();
                        towersCreated++;
                        log.debug("Created new tower {} for post {}", towerId, postId);
                    }
                    
                    // Update post with towerId
                    firestore.collection("posts")
                        .document(postId)
                        .update("towerId", towerId)
                        .get();
                    
                    postsProcessed++;
                    
                    if (postsProcessed % 10 == 0) {
                        log.info("Migration progress: {}/{} posts processed", postsProcessed, postsToProcess.size());
                    }
                    
                } catch (Exception e) {
                    log.error("Error processing post {}: {}", doc.getId(), e.getMessage(), e);
                    errors++;
                }
            }
            
            log.info("Tower migration completed successfully!");
            
        } catch (Exception e) {
            log.error("Error during migration: {}", e.getMessage(), e);
            throw e;
        }
        
        stats.put("totalPosts", totalPosts);
        stats.put("postsProcessed", postsProcessed);
        stats.put("towersCreated", towersCreated);
        stats.put("postsAssignedToExisting", postsAssigned);
        stats.put("errors", errors);
        stats.put("status", "completed");
        
        return stats;
    }
    
    /**
     * Rebuild all towers from scratch.
     * WARNING: This deletes all existing towers and recreates them.
     * Use this only if tower data becomes corrupted.
     * 
     * @return Rebuild statistics
     */
    public Map<String, Object> rebuildAllTowers() throws ExecutionException, InterruptedException {
        log.warn("REBUILDING ALL TOWERS - This will delete existing tower data!");
        
        // Delete all existing towers
        QuerySnapshot towerSnapshot = firestore.collection("towers").get().get();
        WriteBatch batch = firestore.batch();
        int towerCount = 0;
        
        for (DocumentSnapshot doc : towerSnapshot.getDocuments()) {
            batch.delete(doc.getReference());
            towerCount++;
        }
        
        if (towerCount > 0) {
            batch.commit().get();
            log.info("Deleted {} existing towers", towerCount);
        }
        
        // Clear towerId from all posts
        QuerySnapshot postSnapshot = firestore.collection("posts").get().get();
        WriteBatch postBatch = firestore.batch();
        int clearCount = 0;
        
        for (DocumentSnapshot doc : postSnapshot.getDocuments()) {
            if (doc.contains("towerId")) {
                postBatch.update(doc.getReference(), "towerId", FieldValue.delete());
                clearCount++;
            }
        }
        
        if (clearCount > 0) {
            postBatch.commit().get();
            log.info("Cleared towerId from {} posts", clearCount);
        }
        
        // Now run normal migration
        return migrateExistingPosts();
    }
}
