package com.geowhisper.geowhisperbackendnew.controller;

import com.geowhisper.geowhisperbackendnew.dto.*;
import com.geowhisper.geowhisperbackendnew.service.ChatModerationService;
import com.geowhisper.geowhisperbackendnew.service.ChatSummaryService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.concurrent.CompletableFuture;

@RestController
@RequestMapping("/api/chat")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Chat", description = "Chat moderation and summary APIs")
public class ChatController {
    
    private final ChatModerationService chatModerationService;
    private final ChatSummaryService chatSummaryService;
    
    /**
     * Generate AI-powered summary of chat messages
     * POST /api/chat/summary
     */
    @PostMapping("/summary")
    @Operation(summary = "Generate chat summary", 
               description = "Generate AI-powered summary of chat messages for a tower")
    public CompletableFuture<ResponseEntity<ChatSummaryResponse>> generateSummary(
            @Valid @RequestBody ChatSummaryRequest request) {
        
        log.info("Generating chat summary for tower: {}", request.getTowerId());
        
        return chatSummaryService.generateChatSummary(request)
                .thenApply(ResponseEntity::ok)
                .exceptionally(ex -> {
                    log.error("Error generating summary: {}", ex.getMessage(), ex);
                    return ResponseEntity.internalServerError().build();
                });
    }
    
    /**
     * Check message content before sending
     * POST /api/chat/check-content
     */
    @PostMapping("/check-content")
    @Operation(summary = "Check message content", 
               description = "Check if message content is appropriate before sending")
    public CompletableFuture<ResponseEntity<ContentModerationResponse>> checkContent(
            @Valid @RequestBody ContentModerationRequest request) {
        
        log.info("Checking content for user: {}", request.getUserId());
        
        // Use AI-powered check for more thorough moderation
        return chatModerationService.checkContentWithAI(request)
                .thenApply(ResponseEntity::ok)
                .exceptionally(ex -> {
                    log.error("Error checking content: {}", ex.getMessage(), ex);
                    // Fallback to basic check
                    return chatModerationService.checkContent(request)
                            .thenApply(ResponseEntity::ok)
                            .join();
                });
    }
    
    /**
     * Check content with basic rules (no AI)
     * POST /api/chat/check-content/basic
     */
    @PostMapping("/check-content/basic")
    @Operation(summary = "Basic content check", 
               description = "Quick content check using rule-based approach")
    public CompletableFuture<ResponseEntity<ContentModerationResponse>> checkContentBasic(
            @Valid @RequestBody ContentModerationRequest request) {
        
        log.info("Performing basic content check for user: {}", request.getUserId());
        
        return chatModerationService.checkContent(request)
                .thenApply(ResponseEntity::ok)
                .exceptionally(ex -> {
                    log.error("Error in basic content check: {}", ex.getMessage(), ex);
                    return ResponseEntity.internalServerError().build();
                });
    }
    
    /**
     * Moderate a specific message (moderator action)
     * POST /api/chat/moderate
     */
    @PostMapping("/moderate")
    @Operation(summary = "Moderate message", 
               description = "Perform moderation action on a specific message (requires moderator role)")
    public CompletableFuture<ResponseEntity<Map<String, String>>> moderateMessage(
            @Valid @RequestBody ChatModerationRequest request) {
        
        log.info("Moderating message {} in tower {} by moderator {}", 
                request.getMessageId(), request.getTowerId(), request.getModeratorUserId());
        
        return chatModerationService.moderateMessage(request)
                .thenApply(message -> ResponseEntity.ok(Map.of("message", message)))
                .exceptionally(ex -> {
                    log.error("Error moderating message: {}", ex.getMessage(), ex);
                    return ResponseEntity.internalServerError()
                            .body(Map.of("error", ex.getMessage()));
                });
    }
    
    /**
     * Get chat statistics for a tower
     * GET /api/chat/{towerId}/stats
     */
    @GetMapping("/{towerId}/stats")
    @Operation(summary = "Get chat stats", 
               description = "Get statistics for tower chat activity")
    public CompletableFuture<ResponseEntity<Map<String, Object>>> getChatStats(
            @PathVariable String towerId) {
        
        log.info("Fetching chat stats for tower: {}", towerId);
        
        return chatSummaryService.getChatStats(towerId)
                .thenApply(ResponseEntity::ok)
                .exceptionally(ex -> {
                    log.error("Error fetching chat stats: {}", ex.getMessage(), ex);
                    return ResponseEntity.internalServerError().build();
                });
    }
    
    /**
     * Get moderation statistics for a tower
     * GET /api/chat/{towerId}/moderation-stats
     */
    @GetMapping("/{towerId}/moderation-stats")
    @Operation(summary = "Get moderation stats", 
               description = "Get moderation statistics for a tower")
    public CompletableFuture<ResponseEntity<Map<String, Object>>> getModerationStats(
            @PathVariable String towerId) {
        
        log.info("Fetching moderation stats for tower: {}", towerId);
        
        return chatModerationService.getModerationStats(towerId)
                .thenApply(ResponseEntity::ok)
                .exceptionally(ex -> {
                    log.error("Error fetching moderation stats: {}", ex.getMessage(), ex);
                    return ResponseEntity.internalServerError().build();
                });
    }
}
