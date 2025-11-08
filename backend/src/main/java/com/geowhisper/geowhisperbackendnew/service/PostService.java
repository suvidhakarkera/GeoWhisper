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

    public Map<String, Object> likePost(String postId, String userId) 
        throws ExecutionException, InterruptedException {
        
        DocumentReference postRef = firestore.collection("posts").document(postId);
        DocumentReference likeRef = postRef.collection("likes").document(userId);
        
        // Check if user already liked
        DocumentSnapshot likeDoc = likeRef.get().get();
        
        if (likeDoc.exists()) {
            throw new IllegalStateException("Post already liked by user");
        }
        
        // Add like
        Map<String, Object> likeData = new HashMap<>();
        likeData.put("userId", userId);
        likeData.put("likedAt", FieldValue.serverTimestamp());
        likeRef.set(likeData).get();
        
        // Increment like count
        postRef.update("likes", FieldValue.increment(1)).get();
        
        // Get updated post
        DocumentSnapshot postDoc = postRef.get().get();
        Map<String, Object> post = postDoc.getData();
        if (post != null) {
            post.put("id", postDoc.getId());
        }
        
        return post;
    }

    public Map<String, Object> unlikePost(String postId, String userId) 
        throws ExecutionException, InterruptedException {
        
        DocumentReference postRef = firestore.collection("posts").document(postId);
        DocumentReference likeRef = postRef.collection("likes").document(userId);
        
        // Check if like exists
        DocumentSnapshot likeDoc = likeRef.get().get();
        
        if (!likeDoc.exists()) {
            throw new IllegalStateException("Post not liked by user");
        }
        
        // Remove like
        likeRef.delete().get();
        
        // Decrement like count
        postRef.update("likes", FieldValue.increment(-1)).get();
        
        // Get updated post
        DocumentSnapshot postDoc = postRef.get().get();
        Map<String, Object> post = postDoc.getData();
        if (post != null) {
            post.put("id", postDoc.getId());
        }
        
        return post;
    }

    public Map<String, Object> addComment(String postId, String userId, String username, String commentText) 
        throws ExecutionException, InterruptedException {
        
        DocumentReference postRef = firestore.collection("posts").document(postId);
        
        // Create comment data
        Map<String, Object> commentData = new HashMap<>();
        commentData.put("userId", userId);
        commentData.put("username", username);
        commentData.put("comment", commentText);
        commentData.put("createdAt", FieldValue.serverTimestamp());
        
        // Add comment to subcollection
        DocumentReference commentRef = postRef.collection("comments").document();
        commentRef.set(commentData).get();
        
        // Increment comment count
        postRef.update("commentCount", FieldValue.increment(1)).get();
        
        commentData.put("id", commentRef.getId());
        return commentData;
    }

    public List<Map<String, Object>> getComments(String postId) 
        throws ExecutionException, InterruptedException {
        
        QuerySnapshot querySnapshot = firestore.collection("posts")
            .document(postId)
            .collection("comments")
            .orderBy("createdAt", Query.Direction.ASCENDING)
            .get()
            .get();
        
        List<Map<String, Object>> comments = new ArrayList<>();
        for (DocumentSnapshot doc : querySnapshot.getDocuments()) {
            Map<String, Object> comment = doc.getData();
            if (comment != null) {
                comment.put("id", doc.getId());
                comments.add(comment);
            }
        }
        
        return comments;
    }

    public void deletePost(String postId, String userId) 
        throws ExecutionException, InterruptedException {
        
        DocumentReference postRef = firestore.collection("posts").document(postId);
        DocumentSnapshot postDoc = postRef.get().get();
        
        if (!postDoc.exists()) {
            throw new IllegalArgumentException("Post not found");
        }
        
        Map<String, Object> post = postDoc.getData();
        String postUserId = (String) post.get("userId");
        
        if (!postUserId.equals(userId)) {
            throw new IllegalStateException("User not authorized to delete this post");
        }
        
        // Delete all likes
        QuerySnapshot likesSnapshot = postRef.collection("likes").get().get();
        for (DocumentSnapshot likeDoc : likesSnapshot.getDocuments()) {
            likeDoc.getReference().delete().get();
        }
        
        // Delete all comments
        QuerySnapshot commentsSnapshot = postRef.collection("comments").get().get();
        for (DocumentSnapshot commentDoc : commentsSnapshot.getDocuments()) {
            commentDoc.getReference().delete().get();
        }
        
        // Delete the post
        postRef.delete().get();
    }
}
