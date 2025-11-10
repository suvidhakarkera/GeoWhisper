package com.geowhisper.geowhisperbackendnew.controller;

import com.geowhisper.geowhisperbackendnew.dto.ApiResponse;
import com.geowhisper.geowhisperbackendnew.dto.CreatePostRequest;
import com.geowhisper.geowhisperbackendnew.service.PostService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/seed")
public class SeedController {

    @Autowired
    private PostService postService;

    // Delhi coordinates: approximately 28.6139° N, 77.2090° E
    private static final double DELHI_LAT = 28.6139;
    private static final double DELHI_LON = 77.2090;

    // Sample post content for variety
    private static final String[] POST_CONTENTS = {
            "Great coffee spot! ☕ Highly recommend",
            "Traffic is smooth today 🚗",
            "Beautiful weather here! ☀️",
            "Just discovered an amazing restaurant 🍽️",
            "Love this neighborhood! 🏘️",
            "Perfect spot for evening walks 🌅",
            "Amazing street food here! 🌮",
            "Quiet and peaceful area 🌿",
            "Great place for shopping 🛍️",
            "Best chai in town! ☕",
            "Clean and well-maintained park 🌳",
            "Friendly community here! 👋",
            "Nice spot for morning jogs 🏃",
            "Excellent public transport connectivity 🚌",
            "Hidden gem alert! 💎",
            "Cool hangout spot 🎨",
            "Fresh produce market nearby 🥬",
            "Safe area, even at night 🌙",
            "Great views from here! 📸",
            "Lots of greenery around 🌲",
            "Good gym facilities nearby 💪",
            "Kids love playing here! 👶",
            "Pet-friendly zone 🐕",
            "Awesome street art! 🎨",
            "Convenient for daily needs 🏪",
            "Peaceful morning vibes ☮️",
            "Great connectivity to metro 🚇",
            "Local markets are vibrant 🎪",
            "Nice cycling paths here 🚴",
            "Cozy cafes all around ☕",
            "Beautiful architecture 🏛️",
            "Safe for solo travelers 🎒",
            "Friendly shopkeepers 🛒",
            "Good for families 👨‍👩‍👧‍👦",
            "Lots of food options 🍕",
            "Well-lit streets at night 💡",
            "Good parking availability 🅿️",
            "Clean and hygienic area 🧹",
            "Nice library nearby 📚",
            "Great community events 🎉",
            "Affordable living costs 💰",
            "Good schools in the area 🏫",
            "Excellent healthcare facilities 🏥",
            "Modern infrastructure 🏗️",
            "Cultural diversity at its best 🌍",
            "Great street markets on weekends 🛍️",
            "Serene temple nearby 🕉️",
            "Historic monuments worth visiting 🏰",
            "Lively atmosphere always! 🎊",
            "Amazing sunset views 🌄"
    };

    private static final String[] USERNAMES = {
            "DelhiExplorer", "CityWanderer", "LocalGuide", "TravelBug",
            "FoodieDelhi", "CityNomad", "UrbanExplorer", "MetroMover",
            "DelhiDiaries", "CapitalCraze", "IndiaRocks", "CitySlicker"
    };

    @PostMapping("/posts/delhi")
    public ResponseEntity<?> seedDelhiPosts(
            @RequestParam(defaultValue = "50") int count,
            @RequestParam(defaultValue = "false") boolean clustered) {

        if (count < 1 || count > 200) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Count must be between 1 and 200"));
        }

        try {
            List<String> createdPostIds = new ArrayList<>();
            Random random = new Random();
            int successCount = 0;
            int failedCount = 0;

            if (clustered) {
                // Create posts in clusters for tower testing
                // Create 5-10 cluster centers, then add posts around each center
                int numClusters = 5 + random.nextInt(6); // 5-10 clusters
                int postsPerCluster = count / numClusters;
                int remainder = count % numClusters;

                for (int cluster = 0; cluster < numClusters; cluster++) {
                    // Generate a random cluster center within ~5km radius of Delhi center
                    double clusterCenterLat = DELHI_LAT + (random.nextDouble() - 0.5) * 0.09;
                    double clusterCenterLon = DELHI_LON + (random.nextDouble() - 0.5) * 0.09;

                    int postsInThisCluster = postsPerCluster + (cluster < remainder ? 1 : 0);

                    for (int i = 0; i < postsInThisCluster; i++) {
                        try {
                            // Generate posts within 20-40 meters of cluster center
                            // 0.0001 degrees ≈ 11 meters at Delhi's latitude
                            double offset = 0.0002 + random.nextDouble() * 0.0002; // 22-44 meters
                            double angle = random.nextDouble() * 2 * Math.PI;

                            double latitude = clusterCenterLat + offset * Math.cos(angle);
                            double longitude = clusterCenterLon + offset * Math.sin(angle);

                            // Random content and user
                            String content = POST_CONTENTS[random.nextInt(POST_CONTENTS.length)];
                            String username = USERNAMES[random.nextInt(USERNAMES.length)];
                            String userId = "seed_user_" + random.nextInt(1000);

                            // Create post request
                            CreatePostRequest request = new CreatePostRequest();
                            request.setContent(content);
                            request.setLatitude(latitude);
                            request.setLongitude(longitude);

                            // Create post
                            Map<String, Object> post = postService.createPost(userId, username, request, null);
                            createdPostIds.add((String) post.get("id"));
                            successCount++;

                        } catch (Exception e) {
                            failedCount++;
                            System.err.println(
                                    "Failed to create post in cluster " + (cluster + 1) + ": " + e.getMessage());
                        }
                    }
                }
            } else {
                // Original behavior: randomly scattered posts
                for (int i = 0; i < count; i++) {
                    try {
                        // Generate random location within ~10km radius of Delhi center
                        double latOffset = (random.nextDouble() - 0.5) * 0.18; // ~10km
                        double lonOffset = (random.nextDouble() - 0.5) * 0.18; // ~10km

                        double latitude = DELHI_LAT + latOffset;
                        double longitude = DELHI_LON + lonOffset;

                        // Random content
                        String content = POST_CONTENTS[random.nextInt(POST_CONTENTS.length)];

                        // Random username
                        String username = USERNAMES[random.nextInt(USERNAMES.length)];
                        String userId = "seed_user_" + random.nextInt(1000);

                        // Create post request
                        CreatePostRequest request = new CreatePostRequest();
                        request.setContent(content);
                        request.setLatitude(latitude);
                        request.setLongitude(longitude);

                        // Create post
                        Map<String, Object> post = postService.createPost(userId, username, request, null);
                        createdPostIds.add((String) post.get("id"));
                        successCount++;

                    } catch (Exception e) {
                        failedCount++;
                        System.err.println("Failed to create post " + (i + 1) + ": " + e.getMessage());
                    }
                }
            }

            Map<String, Object> result = new HashMap<>();
            result.put("successCount", successCount);
            result.put("failedCount", failedCount);
            result.put("totalRequested", count);
            result.put("clustered", clustered);
            result.put("location", "Delhi, India");
            result.put("centerCoordinates", Map.of("latitude", DELHI_LAT, "longitude", DELHI_LON));
            result.put("postIds", createdPostIds);

            return ResponseEntity.ok(ApiResponse.success(
                    "Successfully seeded " + successCount + " posts near Delhi" +
                            (clustered ? " in clusters" : ""),
                    result));

        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Failed to seed posts: " + e.getMessage()));
        }
    }

    @PostMapping("/posts/location")
    public ResponseEntity<?> seedPostsAtLocation(
            @RequestParam double latitude,
            @RequestParam double longitude,
            @RequestParam(defaultValue = "50") int count,
            @RequestParam(defaultValue = "10") double radiusKm) {

        if (count < 1 || count > 200) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Count must be between 1 and 200"));
        }

        if (radiusKm < 0.1 || radiusKm > 50) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Radius must be between 0.1 and 50 km"));
        }

        try {
            List<String> createdPostIds = new ArrayList<>();
            Random random = new Random();
            int successCount = 0;
            int failedCount = 0;

            // Convert km to approximate degrees (rough approximation)
            double radiusDegrees = radiusKm / 111.0;

            for (int i = 0; i < count; i++) {
                try {
                    // Generate random location within specified radius
                    double latOffset = (random.nextDouble() - 0.5) * 2 * radiusDegrees;
                    double lonOffset = (random.nextDouble() - 0.5) * 2 * radiusDegrees;

                    double postLatitude = latitude + latOffset;
                    double postLongitude = longitude + lonOffset;

                    // Random content
                    String content = POST_CONTENTS[random.nextInt(POST_CONTENTS.length)];

                    // Random username
                    String username = USERNAMES[random.nextInt(USERNAMES.length)];
                    String userId = "seed_user_" + random.nextInt(1000);

                    // Create post request
                    CreatePostRequest request = new CreatePostRequest();
                    request.setContent(content);
                    request.setLatitude(postLatitude);
                    request.setLongitude(postLongitude);

                    // Create post
                    Map<String, Object> post = postService.createPost(userId, username, request, null);
                    createdPostIds.add((String) post.get("id"));
                    successCount++;

                } catch (Exception e) {
                    failedCount++;
                    System.err.println("Failed to create post " + (i + 1) + ": " + e.getMessage());
                }
            }

            Map<String, Object> result = new HashMap<>();
            result.put("successCount", successCount);
            result.put("failedCount", failedCount);
            result.put("totalRequested", count);
            result.put("centerCoordinates", Map.of("latitude", latitude, "longitude", longitude));
            result.put("radiusKm", radiusKm);
            result.put("postIds", createdPostIds);

            return ResponseEntity.ok(ApiResponse.success(
                    "Successfully seeded " + successCount + " posts near location",
                    result));

        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Failed to seed posts: " + e.getMessage()));
        }
    }

    @PostMapping("/towers/delhi")
    public ResponseEntity<?> seedTowersInDelhi(
            @RequestParam(defaultValue = "10") int towerCount,
            @RequestParam(defaultValue = "5") int postsPerTower) {

        if (towerCount < 5 || towerCount > 20) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Tower count must be between 5 and 20"));
        }

        if (postsPerTower < 2 || postsPerTower > 20) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Posts per tower must be between 2 and 20"));
        }

        try {
            List<String> createdPostIds = new ArrayList<>();
            List<Map<String, Object>> towerCenters = new ArrayList<>();
            Random random = new Random();
            int successCount = 0;
            int failedCount = 0;

            // Create exactly the specified number of tower centers
            for (int tower = 0; tower < towerCount; tower++) {
                // Generate a random cluster center within ~5km radius of Delhi center
                double clusterCenterLat = DELHI_LAT + (random.nextDouble() - 0.5) * 0.09;
                double clusterCenterLon = DELHI_LON + (random.nextDouble() - 0.5) * 0.09;

                Map<String, Object> towerInfo = new HashMap<>();
                towerInfo.put("centerLat", clusterCenterLat);
                towerInfo.put("centerLon", clusterCenterLon);
                towerInfo.put("expectedPosts", postsPerTower);
                int towerSuccessCount = 0;

                // Create posts clustered around this center
                for (int i = 0; i < postsPerTower; i++) {
                    try {
                        // Generate posts within 20-40 meters of cluster center
                        // 0.0001 degrees ≈ 11 meters at Delhi's latitude
                        double offset = 0.0002 + random.nextDouble() * 0.0002; // 22-44 meters
                        double angle = random.nextDouble() * 2 * Math.PI;

                        double latitude = clusterCenterLat + offset * Math.cos(angle);
                        double longitude = clusterCenterLon + offset * Math.sin(angle);

                        // Random content and user
                        String content = POST_CONTENTS[random.nextInt(POST_CONTENTS.length)];
                        String username = USERNAMES[random.nextInt(USERNAMES.length)];
                        String userId = "seed_user_" + random.nextInt(1000);

                        // Create post request
                        CreatePostRequest request = new CreatePostRequest();
                        request.setContent(content);
                        request.setLatitude(latitude);
                        request.setLongitude(longitude);

                        // Create post
                        Map<String, Object> post = postService.createPost(userId, username, request, null);
                        createdPostIds.add((String) post.get("id"));
                        successCount++;
                        towerSuccessCount++;

                    } catch (Exception e) {
                        failedCount++;
                        System.err.println("Failed to create post in tower " + (tower + 1) + ": " + e.getMessage());
                    }
                }

                towerInfo.put("actualPosts", towerSuccessCount);
                towerCenters.add(towerInfo);
            }

            Map<String, Object> result = new HashMap<>();
            result.put("towersCreated", towerCount);
            result.put("postsPerTower", postsPerTower);
            result.put("totalPostsCreated", successCount);
            result.put("failedPosts", failedCount);
            result.put("location", "Delhi, India");
            result.put("centerCoordinates", Map.of("latitude", DELHI_LAT, "longitude", DELHI_LON));
            result.put("towerCenters", towerCenters);
            result.put("postIds", createdPostIds);

            return ResponseEntity.ok(ApiResponse.success(
                    "Successfully created " + towerCount + " towers with " + successCount + " total posts near Delhi",
                    result));

        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Failed to seed towers: " + e.getMessage()));
        }
    }

    @PostMapping("/verify-towers")
    public ResponseEntity<?> verifyTowers() {
        try {
            // This endpoint verifies that towers are being created automatically
            // It provides statistics about existing towers

            List<Map<String, Object>> towers = postService.getAllTowersWithStats();

            Map<String, Object> stats = new HashMap<>();
            stats.put("totalTowers", towers.size());
            stats.put("towers", towers);

            int totalPosts = towers.stream()
                    .mapToInt(t -> (Integer) t.getOrDefault("postCount", 0))
                    .sum();
            stats.put("totalPostsInTowers", totalPosts);

            return ResponseEntity.ok(ApiResponse.success(
                    "Tower verification complete. Towers are created automatically when posts are made.",
                    stats));

        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Failed to verify towers: " + e.getMessage()));
        }
    }

    /**
     * Seed chat messages for all towers
     * POST /api/seed/chat-messages
     * 
     * This endpoint creates 5 sample chat messages for each existing tower
     * to test the chat summary feature.
     */
    @PostMapping("/chat-messages")
    public ResponseEntity<?> seedChatMessages(
            @RequestParam(defaultValue = "5") int messagesPerTower) {
        
        try {
            // Get all towers
            List<Map<String, Object>> towers = postService.getAllTowersWithStats();
            
            if (towers.isEmpty()) {
                return ResponseEntity.badRequest()
                        .body(ApiResponse.error("No towers found. Please create some posts first."));
            }

            // Sample chat messages
            String[] chatMessages = {
                "This place is amazing! Love the atmosphere here.",
                "Great coffee and excellent wifi!",
                "Anyone tried the cappuccino? Highly recommend it.",
                "Perfect spot for working remotely.",
                "The view from here is spectacular!",
                "Highly recommend the chocolate croissant.",
                "Service is quick and friendly.",
                "This is my go-to spot now!",
                "Food quality is top notch.",
                "Very clean and well-maintained.",
                "Love the ambiance and decor.",
                "Pricing is reasonable for the quality.",
                "Will definitely come back again!",
                "Hidden gem in the neighborhood.",
                "Peaceful and quiet, perfect for reading.",
                "Staff are super friendly and helpful.",
                "Great place for meetings.",
                "Music volume is just right.",
                "Lots of seating options available.",
                "They have great vegetarian options."
            };

            String[] usernames = {
                "Alex", "Sam", "Jordan", "Taylor", "Morgan",
                "Casey", "Riley", "Avery", "Quinn", "Skylar",
                "Jamie", "Parker", "Reese", "Cameron", "Blake"
            };

            // Use Firebase Realtime Database  
            com.google.firebase.database.DatabaseReference dbRef = 
                com.google.firebase.database.FirebaseDatabase.getInstance().getReference();

            int totalMessagesSent = 0;
            int towersSeeded = 0;
            Random random = new Random();

            System.out.println("⏳ Seeding chat messages for " + towers.size() + " towers (processing first 10)...");
            
            // Limit to first 10 towers
            int maxTowers = Math.min(towers.size(), 10);
            int successCount = 0;
            int failureCount = 0;

            for (int towerIndex = 0; towerIndex < maxTowers; towerIndex++) {
                Map<String, Object> tower = towers.get(towerIndex);
                String towerId = (String) tower.get("towerId");
                
                if (towerId == null || towerId.isEmpty()) {
                    continue;
                }

                System.out.println("📝 Tower " + (towerIndex + 1) + "/" + maxTowers + ": " + towerId);

                // Send messagesPerTower messages for this tower
                for (int i = 0; i < messagesPerTower; i++) {
                    String message = chatMessages[random.nextInt(chatMessages.length)];
                    String username = usernames[random.nextInt(usernames.length)];
                    String userId = "user" + random.nextInt(1000);
                    
                    // Create message data
                    Map<String, Object> messageData = new HashMap<>();
                    messageData.put("message", message);
                    messageData.put("userId", userId);
                    messageData.put("username", username);
                    
                    // Spread timestamps over last 24 hours
                    long now = System.currentTimeMillis();
                    long randomOffset = random.nextInt(24 * 60 * 60 * 1000);
                    long timestamp = now - randomOffset;
                    
                    messageData.put("timestamp", timestamp);
                    messageData.put("createdAt", new java.util.Date(timestamp).toString());

                    // Push to Firebase Realtime Database with immediate response
                    try {
                        dbRef.child("chats").child(towerId).child("messages").push()
                            .setValueAsync(messageData);
                        // Don't wait - fire and forget
                        totalMessagesSent++;
                        successCount++;
                    } catch (Exception e) {
                        failureCount++;
                        System.err.println("❌ Error for tower " + towerId + ": " + e.getMessage());
                    }
                }
                
                towersSeeded++;
            }
            
            System.out.println("✅ Initiated " + totalMessagesSent + " messages (writes are async)");
            System.out.println("⚠️  If messages don't appear, UPDATE FIREBASE REALTIME DATABASE RULES!");
            System.out.println("    Go to: https://console.firebase.google.com/project/geowhisper-1/database/geowhisper-1-default-rtdb/rules");
            System.out.println("    Set: { \"rules\": { \".read\": true, \".write\": true } }");

            Map<String, Object> result = new HashMap<>();
            result.put("towersSeeded", towersSeeded);
            result.put("totalTowers", towers.size());
            result.put("towersProcessed", maxTowers);
            result.put("messagesPerTower", messagesPerTower);
            result.put("messagesInitiated", totalMessagesSent);
            result.put("note", "Messages are being written asynchronously. If they don't appear, update Firebase Realtime Database security rules.");
            result.put("rulesUrl", "https://console.firebase.google.com/project/geowhisper-1/database/geowhisper-1-default-rtdb/rules");
            result.put("suggestedRules", "{ \"rules\": { \".read\": true, \".write\": true } }");

            String statusMessage = "Initiated " + totalMessagesSent + " chat messages across " + towersSeeded + " towers. " +
                    "⚠️ IMPORTANT: Update Firebase Realtime Database rules to allow writes, then wait 5-10 seconds before testing summary API.";

            return ResponseEntity.ok(ApiResponse.success(statusMessage, result));

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Failed to seed chat messages: " + e.getMessage()));
        }
    }
}
