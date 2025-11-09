package com.geowhisper.geowhisperbackendnew.model;

import com.google.cloud.Timestamp;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

/**
 * Tower entity representing a persistent location cluster in Firestore.
 * Towers are created when posts are made and remain stable over time.
 */
@Data
@AllArgsConstructor
@NoArgsConstructor
public class Tower {
    
    /**
     * Unique identifier for the tower (Firestore document ID)
     */
    private String towerId;
    
    /**
     * Latitude coordinate of the tower's center (first post's location)
     */
    private double latitude;
    
    /**
     * Longitude coordinate of the tower's center (first post's location)
     */
    private double longitude;
    
    /**
     * Radius in meters within which posts belong to this tower
     */
    private int radiusMeters;
    
    /**
     * List of post IDs that belong to this tower
     */
    private List<String> postIds;
    
    /**
     * Number of posts in this tower
     */
    private int postCount;
    
    /**
     * Timestamp when the tower was created
     */
    private Timestamp createdAt;
    
    /**
     * Timestamp when the tower was last updated (when a post was added)
     */
    private Timestamp updatedAt;
    
    /**
     * Constructor for creating a new tower
     */
    public Tower(String towerId, double latitude, double longitude, int radiusMeters) {
        this.towerId = towerId;
        this.latitude = latitude;
        this.longitude = longitude;
        this.radiusMeters = radiusMeters;
        this.postIds = new ArrayList<>();
        this.postCount = 0;
    }
    
    /**
     * Add a post ID to this tower
     */
    public void addPost(String postId) {
        if (this.postIds == null) {
            this.postIds = new ArrayList<>();
        }
        if (!this.postIds.contains(postId)) {
            this.postIds.add(postId);
            this.postCount = this.postIds.size();
        }
    }
}
