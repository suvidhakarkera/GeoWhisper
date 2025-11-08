// Location types
export interface Location {
  latitude: number;
  longitude: number;
}

export interface UserLocation extends Location {
  accuracy: number;
}

// Post types
export interface Post {
  id: string;
  content: string;
  location: Location;
  imageUrl?: string;
  timestamp: number;
  author: {
    id: string;
    username: string;
  };
}

export interface PostData {
  content: string;
  location: Location;
  image?: File;
  timestamp: number;
}

// Geolocation types
export type PermissionStatus = 'prompt' | 'granted' | 'denied';

export interface GeolocationError {
  code: number;
  message: string;
}

// Map types
export interface MapViewport {
  latitude: number;
  longitude: number;
  zoom: number;
}
