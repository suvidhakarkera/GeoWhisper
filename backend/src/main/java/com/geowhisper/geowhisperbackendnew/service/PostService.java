package com.geowhisper.geowhisperbackendnew.service;

import com.google.cloud.firestore.*;
import com.geowhisper.geowhisperbackendnew.dto.CreatePostRequest;
import com.geowhisper.geowhisperbackendnew.util.GeoUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.concurrent.ExecutionException;

@Service
public class PostService {

    @Autowired
    private Firestore firestore;

    public Map<String, Object> createPost(String userId, String username, CreatePostRequest request) 
        throws ExecutionException, InterruptedException {
        
        Map<String, Object> postData = new HashMap<>();
        postData.put("userId", userId);
        postData.put("username", username);
        postData.put("content", request.getContent());
        postData.put("latitude", request.getLatitude());
        postData.put("longitude", request.getLongitude());
        postData.put("createdAt", FieldValue.serverTimestamp());
        postData.put("likes", 0);
        postData.put("commentCount", 0);

        DocumentReference docRef = firestore.collection("posts").document();
        docRef.set(postData).get();

        postData.put("id", docRef.getId());
        return postData;
    }

    public List<Map<String, Object>> getNearbyPosts(
        double userLat, 
        double userLon, 
        int radiusMeters,
        int limit
    ) throws ExecutionException, InterruptedException {
        
        QuerySnapshot querySnapshot = firestore.collection("posts")
            .orderBy("createdAt", Query.Direction.DESCENDING)
            .limit(500)
            .get()
            .get();

        List<Map<String, Object>> nearbyPosts = new ArrayList<>();

        for (DocumentSnapshot doc : querySnapshot.getDocuments()) {
            Map<String, Object> post = doc.getData();
            if (post == null) continue;

            double postLat = ((Number) post.get("latitude")).doubleValue();
            double postLon = ((Number) post.get("longitude")).doubleValue();

            double distance = GeoUtils.calculateDistance(userLat, userLon, postLat, postLon);

            if (distance <= radiusMeters) {
                post.put("id", doc.getId());
                post.put("distance", Math.round(distance));
                nearbyPosts.add(post);
            }

            if (nearbyPosts.size() >= limit) {
                break;
            }
        }

        nearbyPosts.sort((a, b) -> 
            Double.compare((Double) a.get("distance"), (Double) b.get("distance"))
        );

        return nearbyPosts;
    }

    public List<Map<String, Object>> getUserPosts(String userId) 
        throws ExecutionException, InterruptedException {
        
        QuerySnapshot querySnapshot = firestore.collection("posts")
            .whereEqualTo("userId", userId)
            .orderBy("createdAt", Query.Direction.DESCENDING)
            .get()
            .get();

        List<Map<String, Object>> posts = new ArrayList<>();
        for (DocumentSnapshot doc : querySnapshot.getDocuments()) {
            Map<String, Object> post = doc.getData();
            if (post != null) {
                post.put("id", doc.getId());
                posts.add(post);
            }
        }

        return posts;
    }

    public List<Map<String, Object>> getRecentPostsForZone(
        double lat, 
        double lon, 
        int radiusMeters
    ) throws ExecutionException, InterruptedException {
        return getNearbyPosts(lat, lon, radiusMeters, 100);
    }
}