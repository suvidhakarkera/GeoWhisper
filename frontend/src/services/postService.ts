import { API_BASE_URL } from '@/config/api';

export interface Post {
  id: string;
  userId: string;
  username: string;
  content: string;
  latitude: number;
  longitude: number;
  createdAt: string;
  likes: number;
  commentCount: number;
  distance?: number;
}

export interface CreatePostData {
  content: string;
  latitude: number;
  longitude: number;
}

export interface NearbyPostsRequest {
  latitude: number;
  longitude: number;
  radiusMeters: number;
  limit: number;
}

export interface TowerPost {
  imageCount: number;
  createdAt: {
    seconds: number;
    nanos: number;
  };
  images: string[];
  latitude: number;
  id: string;
  userId: string;
  content: string;
  commentCount: number;
  likes: number;
  longitude: number;
  username: string;
}

export interface Tower {
  towerId: string;
  latitude: number;
  longitude: number;
  postCount: number;
  posts: TowerPost[];
}

export interface TowersResponse {
  success: boolean;
  message: string;
  data: Tower[];
}

class PostService {
  /**
   * Create a new post
   */
  async createPost(postData: CreatePostData, images?: File[]): Promise<Post> {
    // Try to get userId from different storage keys (backward compatibility)
    const firebaseUid = localStorage.getItem('firebaseUid') || sessionStorage.getItem('firebaseUid');
    const userId = firebaseUid || localStorage.getItem('userId') || sessionStorage.getItem('userId');
    
    const username = localStorage.getItem('username') || 
                     sessionStorage.getItem('username') || 
                     'Anonymous';

    console.log('Auth check:', {
      firebaseUid,
      userId,
      username,
      localStorageKeys: Object.keys(localStorage),
      sessionStorageKeys: Object.keys(sessionStorage)
    });

    if (!userId || userId.trim() === '') {
      throw new Error('User not authenticated. Please sign in to create posts.');
    }
    
    if (!firebaseUid) {
      console.warn('Warning: firebaseUid not found, using fallback userId');
    }
    
    // Validate username
    const validUsername = username && username.trim() !== '' ? username : 'Anonymous';

    // Use FormData for multipart/form-data (backend expects this)
    const formData = new FormData();
    formData.append('content', postData.content);
    formData.append('latitude', postData.latitude.toString());
    formData.append('longitude', postData.longitude.toString());

    // Add images if provided
    if (images && images.length > 0) {
      images.forEach((image) => {
        formData.append('images', image);
      });
    }

    try {
      console.log('Sending POST request to:', `${API_BASE_URL}/api/posts`);
      console.log('Headers:', {
        'X-User-Id': userId,
        'X-Username': validUsername
      });
      console.log('FormData contents:', {
        content: formData.get('content'),
        latitude: formData.get('latitude'),
        longitude: formData.get('longitude'),
        images: images?.length || 0
      });
      
      const response = await fetch(`${API_BASE_URL}/api/posts`, {
        method: 'POST',
        headers: {
          'X-User-Id': userId,
          'X-Username': validUsername,
          // Don't set Content-Type - browser will set it with boundary for FormData
        },
        body: formData,
      });

      console.log('Response status:', response.status, response.statusText);
      
      if (!response.ok) {
        // Try to parse error as JSON, but handle cases where it's not JSON
        let errorMessage = 'Failed to create post';
        try {
          const error = await response.json();
          errorMessage = error.message || errorMessage;
        } catch (e) {
          // Response wasn't JSON, use default message
          errorMessage = `Failed to create post: ${response.status} ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();
      return result.data;
    } catch (error: any) {
      // Handle network errors (backend not running, etc.)
      if (error.message.includes('Failed to fetch') || error.name === 'TypeError') {
        throw new Error('Cannot connect to server. Please ensure the backend is running at ' + API_BASE_URL);
      }
      throw error;
    }
  }

  /**
   * Get nearby posts based on user location
   */
  async getNearbyPosts(request: NearbyPostsRequest): Promise<Post[]> {
    const response = await fetch(`${API_BASE_URL}/posts/nearby`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch nearby posts');
    }

    const result = await response.json();
    return result.data || [];
  }

  /**
   * Get posts by a specific user
   */
  async getUserPosts(userId: string): Promise<Post[]> {
    const response = await fetch(`${API_BASE_URL}/api/posts/user/${userId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch user posts');
    }

    const result = await response.json();
    return result.data || [];
  }

  /**
   * Get current user's location
   */
  async getCurrentLocation(): Promise<{ latitude: number; longitude: number }> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by your browser'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        (error) => {
          reject(new Error('Unable to retrieve your location: ' + error.message));
        }
      );
    });
  }

  /**
   * Get all towers with their posts
   * @param clusterRadiusMeters - Clustering radius in meters (default: 50)
   * @param maxPosts - Maximum number of posts to fetch (default: 1000)
   */
  async getTowers(clusterRadiusMeters: number = 50, maxPosts: number = 1000): Promise<TowersResponse> {
    const response = await fetch(`${API_BASE_URL}/api/posts/towers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        clusterRadiusMeters,
        maxPosts
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Failed to fetch towers' }));
      throw new Error(error.message || 'Failed to fetch towers');
    }

    return await response.json();
  }

  /**
   * Delete a post
   */
  async deletePost(postId: string, userId: string): Promise<void> {
    console.log('🗑️ Deleting post:', postId, 'for user:', userId);
    
    const response = await fetch(`${API_BASE_URL}/api/posts/${postId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Id': userId,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Failed to delete post' }));
      throw new Error(error.message || 'Failed to delete post');
    }

    console.log('✅ Post deleted successfully');
  }
}

export const postService = new PostService();

/**
 * Helper function to get nearby posts with default parameters
 */
export async function getNearbyPosts(
  latitude: number,
  longitude: number,
  radiusKm: number = 10,
  limit: number = 50
): Promise<Post[]> {
  return postService.getNearbyPosts({
    latitude,
    longitude,
    radiusMeters: radiusKm * 1000,
    limit
  });
}
