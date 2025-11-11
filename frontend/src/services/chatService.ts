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
        displayMessage: message.message,
        shouldShow: true,
        isModerated: false,
        moderationReason: `Flagged: ${message.flagReason}`,
      };
    }

    // Normal message
    return {
      displayMessage: message.message,
      shouldShow: true,
      isModerated: false,
    };
  }
}

export const chatService = new ChatService();
