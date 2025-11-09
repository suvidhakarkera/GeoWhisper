package com.geowhisper.geowhisperbackendnew.controller;

import com.geowhisper.geowhisperbackendnew.dto.ApiResponse;
import com.geowhisper.geowhisperbackendnew.service.TowerMigrationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * Controller for tower migration and management endpoints.
 * These endpoints should be used by administrators only.
 */
@RestController
@RequestMapping("/api/admin/towers")
@Slf4j
@Tag(name = "Tower Admin", description = "Administrative endpoints for tower management")
public class TowerMigrationController {
    
    @Autowired
    private TowerMigrationService migrationService;
    
    /**
     * Migrate existing posts to towers.
     * This processes all posts that don't have a towerId assigned yet.
     * 
     * POST /api/admin/towers/migrate
     */
    @PostMapping("/migrate")
    @Operation(summary = "Migrate existing posts to towers", 
               description = "Assigns all posts without towerId to appropriate towers")
    public ResponseEntity<?> migrateExistingPosts() {
        try {
            log.info("Starting tower migration...");
            Map<String, Object> stats = migrationService.migrateExistingPosts();
            
            return ResponseEntity.ok(ApiResponse.success(
                "Migration completed successfully", 
                stats
            ));
        } catch (Exception e) {
            log.error("Error during migration: {}", e.getMessage(), e);
            return ResponseEntity.badRequest()
                .body(ApiResponse.error("Migration failed: " + e.getMessage()));
        }
    }
    
    /**
     * Rebuild all towers from scratch.
     * WARNING: This deletes all existing towers and recreates them!
     * 
     * POST /api/admin/towers/rebuild
     */
    @PostMapping("/rebuild")
    @Operation(summary = "Rebuild all towers", 
               description = "DELETE all existing towers and recreate them from posts. Use with caution!")
    public ResponseEntity<?> rebuildAllTowers(
            @RequestParam(value = "confirm", defaultValue = "false") boolean confirm) {
        
        if (!confirm) {
            return ResponseEntity.badRequest()
                .body(ApiResponse.error(
                    "This operation will DELETE all existing tower data. " +
                    "Add '?confirm=true' to the URL to confirm."
                ));
        }
        
        try {
            log.warn("REBUILDING ALL TOWERS - User confirmed deletion");
            Map<String, Object> stats = migrationService.rebuildAllTowers();
            
            return ResponseEntity.ok(ApiResponse.success(
                "Rebuild completed successfully", 
                stats
            ));
        } catch (Exception e) {
            log.error("Error during rebuild: {}", e.getMessage(), e);
            return ResponseEntity.badRequest()
                .body(ApiResponse.error("Rebuild failed: " + e.getMessage()));
        }
    }
}
