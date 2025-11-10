package com.geowhisper.geowhisperbackendnew.dto;

import lombok.Data;

@Data
public class HotZoneRequest {
    private Integer messageThreshold = 50; // Default threshold
    private Integer timeRangeHours = 24; // Check messages in last 24 hours
    private Double latitude;
    private Double longitude;
    private Double radiusKm = 10.0; // Search radius in km
}
