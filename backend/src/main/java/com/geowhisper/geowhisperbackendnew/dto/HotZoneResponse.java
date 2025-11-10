package com.geowhisper.geowhisperbackendnew.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class HotZoneResponse {
    private String towerId;
    private String towerName;
    private Double latitude;
    private Double longitude;
    private Integer messageCount;
    private Integer uniqueUsers;
    private String activityLevel; // "hot", "very_hot", "extreme"
    private Double activityScore; // Normalized score 0-100
    private Integer messagesLast1Hour;
    private Integer messagesLast24Hours;
    private String trendingTopic; // Most discussed topic
    private List<String> recentUsernames; // Sample of recent active users
    private Long lastMessageTimestamp;
}
