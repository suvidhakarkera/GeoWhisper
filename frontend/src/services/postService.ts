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

class PostService {
  /**
   * Create a new post
   */
  async createPost(postData: CreatePostData): Promise<Post> {
    const userId = localStorage.getItem('userId');
    const username = localStorage.getItem('username') || 'Anonymous';

    if (!userId) {
      throw new Error('User not authenticated');
    }

    const response = await fetch(`${API_BASE_URL}/posts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Id': userId,
        'X-Username': username,
      },
      body: JSON.stringify(postData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create post');
    }

    const result = await response.json();
    return result.data;
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
    const response = await fetch(`${API_BASE_URL}/posts/user/${userId}`, {
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
