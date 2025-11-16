import { API_BASE_URL } from '@/config/api';

export interface ChatMessage {
  id: string;
  messageId?: string;
  userId: string;
  username: string;
  message: string;
  timestamp: number;
  createdAt?: string;
  
  // Post-related fields
  isPost?: boolean;
  postId?: string;
  image?: string;
  
  // Reply-related fields
  replyTo?: string; // ID of the message being replied to
  repliedMessage?: string; // Content of the replied message
  repliedUsername?: string; // Username of the person being replied to
  
  // Moderation fields
  moderated?: boolean;
  moderationAction?: 'DELETED' | 'HIDDEN' | 'FLAGGED';
  moderationReason?: string;
  moderatedAt?: number;
  moderatedBy?: string;
  hidden?: boolean;
  flagged?: boolean;
  flagReason?: string;
  flaggedAt?: number;
  flaggedBy?: string;
}

export interface ContentModerationRequest {
  content: string;
  userId: string;
  towerId: string;
}

export interface ContentModerationResponse {
  isAppropriate: boolean;
  violations: string[];
  confidenceScore: number;
  suggestedAction: 'ALLOW' | 'WARN' | 'BLOCK';
  explanation: string;
}

export interface ChatModerationRequest {
  towerId: string;
  messageId: string;
  moderatorUserId: string;
  reason: string;
  action: 'DELETE' | 'HIDE' | 'FLAG';
}

class ChatService {
  /**
   * Check message content before sending (Pre-moderation)
   */
  async checkContent(request: ContentModerationRequest): Promise<ContentModerationResponse> {
    const response = await fetch(`${API_BASE_URL}/api/chat/check-content`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error('Failed to check content');
    }

    return await response.json();
  }

  /**
   * Basic content check (no AI)
   */
  async checkContentBasic(request: ContentModerationRequest): Promise<ContentModerationResponse> {
    const response = await fetch(`${API_BASE_URL}/api/chat/check-content/basic`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error('Failed to check content');
    }

    return await response.json();
  }

  /**
   * Moderate a specific message (Post-moderation - moderator only)
   */
  async moderateMessage(request: ChatModerationRequest): Promise<{ message: string }> {
    const response = await fetch(`${API_BASE_URL}/api/chat/moderate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error('Failed to moderate message');
    }

    return await response.json();
  }

  /**
   * Format message for display based on moderation status
   */
  formatMessage(message: ChatMessage, currentUserId: string, isModerator: boolean): {
    displayMessage: string;
    shouldShow: boolean;
    isModerated: boolean;
    moderationReason?: string;
  } {
    // Strip any leading emoji + "Created a post:" prefix from message text if present
    let messageText = message.message;
    if (messageText) {
      messageText = messageText.replace(/^\s*(📍\s*)?Created a post:\s*/i, '').trim();
    }
    
    // Check if message is moderated
    if (message.moderated) {
      if (message.moderationAction === 'DELETED') {
        return {
          displayMessage: '[Message removed by moderator]',
          shouldShow: true,
          isModerated: true,
          moderationReason: message.moderationReason,
        };
      } else if (message.moderationAction === 'HIDDEN') {
        // Only show to sender and moderators
        if (message.userId === currentUserId || isModerator) {
          return {
            displayMessage: `[Hidden: ${message.moderationReason}]`,
            shouldShow: true,
            isModerated: true,
            moderationReason: message.moderationReason,
          };
        } else {
          return {
            displayMessage: '',
            shouldShow: false,
            isModerated: true,
          };
        }
      }
    }

    // Check if message is flagged (for moderators)
    if (message.flagged && isModerator) {
      return {
        displayMessage: messageText,
        shouldShow: true,
        isModerated: false,
        moderationReason: `Flagged: ${message.flagReason}`,
      };
    }

    // Normal message
    return {
      displayMessage: messageText,
      shouldShow: true,
      isModerated: false,
    };
  }

  /**
   * Send a message to a tower chat with location validation
   */
  async sendMessage(
    towerId: string,
    message: string,
    userLatitude: number,
    userLongitude: number,
    image?: string,
    replyTo?: string,
    repliedMessage?: string,
    repliedUsername?: string
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const authToken = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
      if (!authToken) {
        console.error('❌ No auth token found. User must sign in first.');
        throw new Error('Not authenticated. Please sign in to send messages.');
      }

      const userId = localStorage.getItem('userId') || sessionStorage.getItem('userId');
      const username = localStorage.getItem('username') || sessionStorage.getItem('username') || 'Anonymous';
      
      console.log('🔐 Sending message with auth:', { userId: userId?.substring(0, 8) + '...', username });

      const response = await fetch(`${API_BASE_URL}/api/chat/${towerId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
          'X-User-Id': userId || '',
          'X-Username': username,
        },
        body: JSON.stringify({
          message,
          userLatitude,
          userLongitude,
          image,
          hasImage: !!image,
          replyTo,
          repliedMessage,
          repliedUsername,
        }),
      });

      // Handle empty responses
      if (!response.ok) {
        console.error('❌ Message send failed. Status:', response.status);
        let errorMessage = 'Failed to send message';
        try {
          const result = await response.json();
          console.error('Error response:', result);
          errorMessage = result.message || errorMessage;
        } catch (jsonError) {
          console.error('Failed to parse error response');
          // If JSON parsing fails, use a generic error based on status
          if (response.status === 401) {
            errorMessage = 'Authentication failed. Please sign in again.';
          } else if (response.status === 403) {
            errorMessage = 'You must be within 500m of the tower to send messages';
          } else if (response.status === 500) {
            errorMessage = 'Server error. Please try again.';
          }
        }
        return {
          success: false,
          error: errorMessage,
        };
      }

      const result = await response.json();

      return {
        success: true,
        messageId: result.data?.messageId,
      };
    } catch (error: any) {
      console.error('Error sending message:', error);
      return {
        success: false,
        error: error.message || 'Failed to send message',
      };
    }
  }

  /**
   * Check if user can send messages to a tower based on location
   */
  async canSendMessage(
    towerId: string,
    latitude: number,
    longitude: number
  ): Promise<{ canSend: boolean; message?: string }> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/chat/${towerId}/can-send?latitude=${latitude}&longitude=${longitude}`
      );

      const result = await response.json();
      
      return {
        canSend: result.data?.canSend || false,
        message: result.message,
      };
    } catch (error) {
      console.error('Error checking send permission:', error);
      return {
        canSend: false,
        message: 'Failed to check permissions',
      };
    }
  }
}

export const chatService = new ChatService();
