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
public class HotZonesMapResponse {
    private List<HotZoneResponse> hotZones;
    private Integer totalHotZones;
    private Integer messageThreshold;
    private Integer timeRangeHours;
    private String searchArea;
    private HotZoneStatistics statistics;
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class HotZoneStatistics {
        private Integer totalMessages;
        private Integer totalUniqueUsers;
        private HotZoneResponse mostActiveZone;
        private Integer hotZonesCount; // 50-99 messages
        private Integer veryHotZonesCount; // 100-199 messages
        private Integer extremeZonesCount; // 200+ messages
    }
}
