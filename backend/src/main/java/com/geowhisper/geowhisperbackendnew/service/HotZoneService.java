package com.geowhisper.geowhisperbackendnew.service;

import com.geowhisper.geowhisperbackendnew.dto.HotZoneRequest;
import com.geowhisper.geowhisperbackendnew.dto.HotZoneResponse;
import com.geowhisper.geowhisperbackendnew.dto.HotZonesMapResponse;
import com.google.firebase.database.*;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

@Service
@Slf4j
public class HotZoneService {

    @Autowired
    private PostService postService;

    /**
     * Get all hot zones based on message activity
     */
    public CompletableFuture<HotZonesMapResponse> getHotZones(HotZoneRequest request) {
        CompletableFuture<HotZonesMapResponse> future = new CompletableFuture<>();

        try {
            // Get all towers
            List<Map<String, Object>> towers = postService.getAllTowersWithStats();

            if (towers.isEmpty()) {
                future.complete(HotZonesMapResponse.builder()
                        .hotZones(List.of())
                        .totalHotZones(0)
                        .messageThreshold(request.getMessageThreshold())
                        .timeRangeHours(request.getTimeRangeHours())
                        .searchArea("No towers found")
                        .statistics(HotZonesMapResponse.HotZoneStatistics.builder()
                                .totalMessages(0)
                                .totalUniqueUsers(0)
                                .hotZonesCount(0)
                                .veryHotZonesCount(0)
                                .extremeZonesCount(0)
                                .build())
                        .build());
                return future;
            }

            // Filter towers by location if specified
            List<Map<String, Object>> filteredTowers = towers;
            if (request.getLatitude() != null && request.getLongitude() != null) {
                filteredTowers = filterTowersByLocation(towers, 
                        request.getLatitude(), 
                        request.getLongitude(), 
                        request.getRadiusKm());
            }

            log.info("Analyzing {} towers for hot zones", filteredTowers.size());

            // Analyze each tower's message activity
            List<CompletableFuture<HotZoneResponse>> futures = new ArrayList<>();
            
            for (Map<String, Object> tower : filteredTowers) {
                String towerId = (String) tower.get("towerId");
                if (towerId != null && !towerId.isEmpty()) {
                    CompletableFuture<HotZoneResponse> towerFuture = 
                            analyzeTowerActivity(towerId, tower, request);
                    futures.add(towerFuture);
                }
            }

            // Make variables effectively final for lambda
            final HotZoneRequest finalRequest = request;
            final int filteredTowersCount = filteredTowers.size();

            // Wait for all analyses to complete
            CompletableFuture.allOf(futures.toArray(new CompletableFuture[0]))
                    .thenAccept(v -> {
                        List<HotZoneResponse> allZones = futures.stream()
                                .map(CompletableFuture::join)
                                .filter(Objects::nonNull)
                                .filter(zone -> zone.getMessageCount() >= finalRequest.getMessageThreshold())
                                .sorted(Comparator.comparingInt(HotZoneResponse::getMessageCount).reversed())
                                .collect(Collectors.toList());

                        // Calculate statistics
                        HotZonesMapResponse.HotZoneStatistics stats = calculateStatistics(allZones);

                        HotZonesMapResponse response = HotZonesMapResponse.builder()
                                .hotZones(allZones)
                                .totalHotZones(allZones.size())
                                .messageThreshold(finalRequest.getMessageThreshold())
                                .timeRangeHours(finalRequest.getTimeRangeHours())
                                .searchArea(getSearchAreaDescription(finalRequest, filteredTowersCount))
                                .statistics(stats)
                                .build();

                        future.complete(response);
                    })
                    .exceptionally(ex -> {
                        log.error("Error analyzing hot zones: {}", ex.getMessage(), ex);
                        future.completeExceptionally(ex);
                        return null;
                    });

        } catch (Exception e) {
            log.error("Error getting hot zones: {}", e.getMessage(), e);
            future.completeExceptionally(e);
        }

        return future;
    }

    /**
     * Get hot zone status for a specific tower
     */
    public CompletableFuture<HotZoneResponse> getTowerHotZoneStatus(String towerId, Integer messageThreshold) {
        CompletableFuture<HotZoneResponse> future = new CompletableFuture<>();

        try {
            // Get tower details
            List<Map<String, Object>> towers = postService.getAllTowersWithStats();
            Map<String, Object> tower = towers.stream()
                    .filter(t -> towerId.equals(t.get("towerId")))
                    .findFirst()
                    .orElse(null);

            if (tower == null) {
                future.complete(null);
                return future;
            }

            HotZoneRequest request = new HotZoneRequest();
            request.setMessageThreshold(messageThreshold != null ? messageThreshold : 50);
            request.setTimeRangeHours(24);

            return analyzeTowerActivity(towerId, tower, request);

        } catch (Exception e) {
            log.error("Error getting tower hot zone status: {}", e.getMessage(), e);
            future.completeExceptionally(e);
        }

        return future;
    }

    /**
     * Analyze message activity for a specific tower
     */
    private CompletableFuture<HotZoneResponse> analyzeTowerActivity(
            String towerId, 
            Map<String, Object> tower, 
            HotZoneRequest request) {
        
        CompletableFuture<HotZoneResponse> future = new CompletableFuture<>();
        CountDownLatch latch = new CountDownLatch(1);

        try {
            DatabaseReference chatRef = FirebaseDatabase.getInstance()
                    .getReference("chats/" + towerId + "/messages");

            // Calculate time thresholds
            long now = System.currentTimeMillis();
            long timeThreshold = now - (request.getTimeRangeHours() * 60 * 60 * 1000L);
            long oneHourAgo = now - (60 * 60 * 1000L);

            Query query = chatRef.orderByChild("timestamp").startAt(timeThreshold);

            query.addListenerForSingleValueEvent(new ValueEventListener() {
                @Override
                public void onDataChange(DataSnapshot dataSnapshot) {
                    try {
                        List<Map<String, Object>> messages = new ArrayList<>();
                        Set<String> uniqueUsers = new HashSet<>();
                        int messagesLast1Hour = 0;
                        List<String> recentUsernames = new ArrayList<>();
                        Long lastTimestamp = null;

                        for (DataSnapshot messageSnapshot : dataSnapshot.getChildren()) {
                            Map<String, Object> data = (Map<String, Object>) messageSnapshot.getValue();
                            if (data != null && data.containsKey("message")) {
                                messages.add(data);
                                
                                String userId = String.valueOf(data.getOrDefault("userId", "unknown"));
                                String username = String.valueOf(data.getOrDefault("username", "Anonymous"));
                                uniqueUsers.add(userId);

                                // Get timestamp
                                Object timestampObj = data.get("timestamp");
                                Long msgTimestamp = null;
                                if (timestampObj instanceof Long) {
                                    msgTimestamp = (Long) timestampObj;
                                } else if (timestampObj instanceof Integer) {
                                    msgTimestamp = ((Integer) timestampObj).longValue();
                                }

                                if (msgTimestamp != null) {
                                    if (msgTimestamp > oneHourAgo) {
                                        messagesLast1Hour++;
                                        if (recentUsernames.size() < 5 && !recentUsernames.contains(username)) {
                                            recentUsernames.add(username);
                                        }
                                    }
                                    if (lastTimestamp == null || msgTimestamp > lastTimestamp) {
                                        lastTimestamp = msgTimestamp;
                                    }
                                }
                            }
                        }

                        int messageCount = messages.size();

                        // Only create response if tower meets threshold
                        if (messageCount >= request.getMessageThreshold()) {
                            // Determine activity level
                            String activityLevel = getActivityLevel(messageCount);
                            
                            // Calculate activity score (0-100)
                            double activityScore = calculateActivityScore(
                                    messageCount, 
                                    messagesLast1Hour, 
                                    uniqueUsers.size());

                            // Extract trending topic (most common word in messages)
                            String trendingTopic = extractTrendingTopic(messages);

                            HotZoneResponse response = HotZoneResponse.builder()
                                    .towerId(towerId)
                                    .towerName((String) tower.getOrDefault("name", "Tower"))
                                    .latitude((Double) tower.get("centerLatitude"))
                                    .longitude((Double) tower.get("centerLongitude"))
                                    .messageCount(messageCount)
                                    .uniqueUsers(uniqueUsers.size())
                                    .activityLevel(activityLevel)
                                    .activityScore(activityScore)
                                    .messagesLast1Hour(messagesLast1Hour)
                                    .messagesLast24Hours(messageCount)
                                    .trendingTopic(trendingTopic)
                                    .recentUsernames(recentUsernames)
                                    .lastMessageTimestamp(lastTimestamp)
                                    .build();

                            future.complete(response);
                        } else {
                            future.complete(null);
                        }

                    } catch (Exception e) {
                        log.error("Error analyzing tower {}: {}", towerId, e.getMessage());
                        future.complete(null);
                    } finally {
                        latch.countDown();
                    }
                }

                @Override
                public void onCancelled(DatabaseError databaseError) {
                    log.error("Error fetching messages for tower {}: {}", towerId, databaseError.getMessage());
                    future.complete(null);
                    latch.countDown();
                }
            });

            // Timeout after 10 seconds
            new Thread(() -> {
                try {
                    if (!latch.await(10, TimeUnit.SECONDS)) {
                        log.warn("Timeout analyzing tower {}", towerId);
                        future.complete(null);
                    }
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                }
            }).start();

        } catch (Exception e) {
            log.error("Error setting up tower analysis: {}", e.getMessage(), e);
            future.complete(null);
        }

        return future;
    }

    /**
     * Determine activity level based on message count
     */
    private String getActivityLevel(int messageCount) {
        if (messageCount >= 200) {
            return "extreme";
        } else if (messageCount >= 100) {
            return "very_hot";
        } else {
            return "hot";
        }
    }

    /**
     * Calculate activity score (0-100) based on multiple factors
     */
    private double calculateActivityScore(int totalMessages, int messagesLast1Hour, int uniqueUsers) {
        // Base score from total messages (max 50 points)
        double messageScore = Math.min(50.0, (totalMessages / 200.0) * 50);
        
        // Recent activity score (max 30 points)
        double recentScore = Math.min(30.0, (messagesLast1Hour / 20.0) * 30);
        
        // User engagement score (max 20 points)
        double engagementScore = Math.min(20.0, (uniqueUsers / 30.0) * 20);
        
        return Math.min(100.0, messageScore + recentScore + engagementScore);
    }

    /**
     * Extract trending topic from messages (simple implementation)
     */
    private String extractTrendingTopic(List<Map<String, Object>> messages) {
        if (messages.isEmpty()) {
            return "General discussion";
        }

        // Count word frequency (simple approach)
        Map<String, Integer> wordCount = new HashMap<>();
        Set<String> stopWords = Set.of("the", "is", "at", "which", "on", "a", "an", "and", "or", "but", "in", "with", "to", "for");

        for (Map<String, Object> message : messages) {
            String text = String.valueOf(message.get("message")).toLowerCase();
            String[] words = text.split("\\s+");
            
            for (String word : words) {
                word = word.replaceAll("[^a-zA-Z]", "");
                if (word.length() > 3 && !stopWords.contains(word)) {
                    wordCount.put(word, wordCount.getOrDefault(word, 0) + 1);
                }
            }
        }

        // Find most common word
        String trendingWord = wordCount.entrySet().stream()
                .max(Map.Entry.comparingByValue())
                .map(Map.Entry::getKey)
                .orElse("discussion");

        return Character.toUpperCase(trendingWord.charAt(0)) + trendingWord.substring(1);
    }

    /**
     * Filter towers by geographic location
     */
    private List<Map<String, Object>> filterTowersByLocation(
            List<Map<String, Object>> towers, 
            double latitude, 
            double longitude, 
            double radiusKm) {
        
        return towers.stream()
                .filter(tower -> {
                    Double towerLat = (Double) tower.get("centerLatitude");
                    Double towerLon = (Double) tower.get("centerLongitude");
                    
                    if (towerLat == null || towerLon == null) {
                        return false;
                    }
                    
                    double distance = calculateDistance(latitude, longitude, towerLat, towerLon);
                    return distance <= radiusKm;
                })
                .collect(Collectors.toList());
    }

    /**
     * Calculate distance between two coordinates (Haversine formula)
     */
    private double calculateDistance(double lat1, double lon1, double lat2, double lon2) {
        final int R = 6371; // Radius of the Earth in km
        
        double latDistance = Math.toRadians(lat2 - lat1);
        double lonDistance = Math.toRadians(lon2 - lon1);
        
        double a = Math.sin(latDistance / 2) * Math.sin(latDistance / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(lonDistance / 2) * Math.sin(lonDistance / 2);
        
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        
        return R * c;
    }

    /**
     * Calculate statistics for hot zones
     */
    private HotZonesMapResponse.HotZoneStatistics calculateStatistics(List<HotZoneResponse> zones) {
        int totalMessages = zones.stream()
                .mapToInt(HotZoneResponse::getMessageCount)
                .sum();
        
        int totalUniqueUsers = zones.stream()
                .mapToInt(HotZoneResponse::getUniqueUsers)
                .sum();
        
        HotZoneResponse mostActive = zones.stream()
                .max(Comparator.comparingDouble(HotZoneResponse::getActivityScore))
                .orElse(null);
        
        int hotCount = (int) zones.stream()
                .filter(z -> "hot".equals(z.getActivityLevel()))
                .count();
        
        int veryHotCount = (int) zones.stream()
                .filter(z -> "very_hot".equals(z.getActivityLevel()))
                .count();
        
        int extremeCount = (int) zones.stream()
                .filter(z -> "extreme".equals(z.getActivityLevel()))
                .count();
        
        return HotZonesMapResponse.HotZoneStatistics.builder()
                .totalMessages(totalMessages)
                .totalUniqueUsers(totalUniqueUsers)
                .mostActiveZone(mostActive)
                .hotZonesCount(hotCount)
                .veryHotZonesCount(veryHotCount)
                .extremeZonesCount(extremeCount)
                .build();
    }

    /**
     * Get search area description
     */
    private String getSearchAreaDescription(HotZoneRequest request, int towerCount) {
        if (request.getLatitude() != null && request.getLongitude() != null) {
            return String.format("Within %.1f km of (%.4f, %.4f) - %d towers analyzed",
                    request.getRadiusKm(), request.getLatitude(), request.getLongitude(), towerCount);
        }
        return String.format("All towers - %d analyzed", towerCount);
    }
}
