package com.geowhisper.geowhisperbackendnew.service;

import com.google.cloud.storage.*;
import com.google.firebase.cloud.StorageClient;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

@Service
public class StorageService {

    private static final String BUCKET_NAME = "posts"; // Folder name in Firebase Storage
    private static final long URL_EXPIRATION_DAYS = 365; // URL valid for 1 year

    /**
     * Upload multiple images to Firebase Storage
     * 
     * @param files Array of image files to upload
     * @param userId User ID for organizing files
     * @param postId Post ID for organizing files
     * @return List of public download URLs
     * @throws IOException if upload fails
     */
    public List<String> uploadImages(MultipartFile[] files, String userId, String postId) throws IOException {
        List<String> imageUrls = new ArrayList<>();

        if (files == null || files.length == 0) {
            return imageUrls;
        }

        Bucket bucket = StorageClient.getInstance().bucket();

        for (int i = 0; i < files.length; i++) {
            MultipartFile file = files[i];
            
            if (file.isEmpty()) {
                continue;
            }

            // Validate file type
            String contentType = file.getContentType();
            if (contentType == null || !contentType.startsWith("image/")) {
                throw new IllegalArgumentException("File must be an image. Received: " + contentType);
            }

            // Generate unique filename
            String originalFilename = file.getOriginalFilename();
            String extension = originalFilename != null && originalFilename.contains(".") 
                ? originalFilename.substring(originalFilename.lastIndexOf("."))
                : ".jpg";
            
            String filename = String.format("%s/%s/%s_%d_%s%s", 
                BUCKET_NAME, 
                userId, 
                postId, 
                i, 
                UUID.randomUUID().toString(),
                extension
            );

            // Upload file to Firebase Storage
            BlobId blobId = BlobId.of(bucket.getName(), filename);
            BlobInfo blobInfo = BlobInfo.newBuilder(blobId)
                .setContentType(contentType)
                .build();

            bucket.getStorage().create(blobInfo, file.getBytes());

            // Generate signed URL (public download URL)
            Blob blob = bucket.getStorage().get(blobId);
            String imageUrl = blob.signUrl(URL_EXPIRATION_DAYS, TimeUnit.DAYS).toString();
            
            imageUrls.add(imageUrl);
        }

        return imageUrls;
    }

    /**
     * Upload a single image to Firebase Storage
     * 
     * @param file Image file to upload
     * @param userId User ID for organizing files
     * @param postId Post ID for organizing files
     * @return Public download URL
     * @throws IOException if upload fails
     */
    public String uploadImage(MultipartFile file, String userId, String postId) throws IOException {
        List<String> urls = uploadImages(new MultipartFile[]{file}, userId, postId);
        return urls.isEmpty() ? null : urls.get(0);
    }

    /**
     * Delete an image from Firebase Storage
     * 
     * @param imageUrl The URL or path of the image to delete
     * @return true if deleted successfully
     */
    public boolean deleteImage(String imageUrl) {
        try {
            // Extract the file path from the URL
            // Firebase Storage URLs contain the bucket name and file path
            String[] parts = imageUrl.split("/o/");
            if (parts.length < 2) {
                return false;
            }
            
            String filePath = parts[1].split("\\?")[0];
            filePath = java.net.URLDecoder.decode(filePath, "UTF-8");

            Bucket bucket = StorageClient.getInstance().bucket();
            Blob blob = bucket.get(filePath);
            
            if (blob != null) {
                return blob.delete();
            }
            
            return false;
        } catch (Exception e) {
            System.err.println("Failed to delete image: " + e.getMessage());
            return false;
        }
    }

    /**
     * Delete multiple images from Firebase Storage
     * 
     * @param imageUrls List of image URLs to delete
     * @return Number of successfully deleted images
     */
    public int deleteImages(List<String> imageUrls) {
        int deletedCount = 0;
        
        if (imageUrls == null || imageUrls.isEmpty()) {
            return deletedCount;
        }

        for (String url : imageUrls) {
            if (deleteImage(url)) {
                deletedCount++;
            }
        }

        return deletedCount;
    }

    /**
     * Validate image file
     * 
     * @param file File to validate
     * @throws IllegalArgumentException if validation fails
     */
    public void validateImageFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("File is empty");
        }

        // Check file size (max 10MB)
        long maxSize = 10 * 1024 * 1024; // 10MB
        if (file.getSize() > maxSize) {
            throw new IllegalArgumentException("File size exceeds maximum limit of 10MB");
        }

        // Check content type
        String contentType = file.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            throw new IllegalArgumentException("File must be an image");
        }

        // Allowed image types
        List<String> allowedTypes = List.of(
            "image/jpeg", 
            "image/jpg", 
            "image/png", 
            "image/gif", 
            "image/webp"
        );
        
        if (!allowedTypes.contains(contentType.toLowerCase())) {
            throw new IllegalArgumentException(
                "Unsupported image format. Allowed: JPEG, PNG, GIF, WebP"
            );
        }
    }

    /**
     * Validate multiple image files
     * 
     * @param files Files to validate
     * @throws IllegalArgumentException if validation fails
     */
    public void validateImageFiles(MultipartFile[] files) {
        if (files == null || files.length == 0) {
            return; // Empty is okay, images are optional
        }

        // Check number of files (max 5 images per post)
        if (files.length > 5) {
            throw new IllegalArgumentException("Maximum 5 images allowed per post");
        }

        for (MultipartFile file : files) {
            if (!file.isEmpty()) {
                validateImageFile(file);
            }
        }
    }
}
