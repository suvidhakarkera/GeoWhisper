'use client';

import { useState, useEffect, useRef } from 'react';
import { ref, onValue, push, set, off } from 'firebase/database';
import { Send, AlertTriangle, Flag, Trash2, EyeOff, Loader2, Image as ImageIcon, X, Sparkles, MessageSquare } from 'lucide-react';
import { chatService, ChatMessage, ContentModerationResponse } from '@/services/chatService';
import { database } from '@/config/firebase';
import { API_BASE_URL } from '@/config/api';

interface TowerChatProps {
  towerId: string;
  currentUserId: string;
  currentUsername: string;
  isModerator?: boolean;
  postCount?: number;
}

export default function TowerChat({ 
  towerId, 
  currentUserId, 
  currentUsername, 
  isModerator = false,
  postCount = 0
}: TowerChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [checking, setChecking] = useState(false);
  const [moderationWarning, setModerationWarning] = useState<ContentModerationResponse | null>(null);
  const [dbError, setDbError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [chatSummary, setChatSummary] = useState<string | null>(null);
  const [vibeSummary, setVibeSummary] = useState<string | null>(null);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [loadingVibe, setLoadingVibe] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Listen for real-time messages
  useEffect(() => {
    if (!database) {
      console.error('Firebase Database not initialized');
      setDbError('Chat service not available. Firebase not configured.');
      return;
    }

    const messagesRef = ref(database, `chats/${towerId}/messages`);

    const unsubscribe = onValue(
      messagesRef, 
      (snapshot) => {
        const messagesData: ChatMessage[] = [];
        
        snapshot.forEach((childSnapshot) => {
          const msg = childSnapshot.val();
          messagesData.push({
            id: childSnapshot.key!,
            messageId: childSnapshot.key!,
            userId: msg.userId,
            username: msg.username,
            message: msg.message,
            timestamp: msg.timestamp,
            createdAt: msg.createdAt,
            // Post-related fields
            isPost: msg.isPost,
            postId: msg.postId,
            image: msg.image,
            // Moderation fields
            moderated: msg.moderated,
            moderationAction: msg.moderationAction,
            moderationReason: msg.moderationReason,
            moderatedAt: msg.moderatedAt,
            moderatedBy: msg.moderatedBy,
            hidden: msg.hidden,
            flagged: msg.flagged,
            flagReason: msg.flagReason,
            flaggedAt: msg.flaggedAt,
            flaggedBy: msg.flaggedBy,
          });
        });

        // Sort by timestamp
        messagesData.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
        setMessages(messagesData);
        setDbError(null);
      },
      (error) => {
        console.error('Firebase onValue error:', error);
        setDbError('Failed to load messages. Check Firebase permissions.');
      }
    );

    return () => {
      off(messagesRef);
    };
  }, [towerId]);

  // Handle image selection
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image size must be less than 5MB');
      return;
    }

    setSelectedImage(file);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Remove selected image
  const handleRemoveImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Check message before sending
  const handleCheckMessage = async () => {
    if (!newMessage.trim() && !selectedImage) return;

    setChecking(true);
    setModerationWarning(null);

    try {
      // Only check text content if present
      if (newMessage.trim()) {
        const result = await chatService.checkContent({
          content: newMessage,
          userId: currentUserId,
          towerId: towerId,
        });

        if (result.suggestedAction === 'BLOCK') {
          setModerationWarning(result);
          setChecking(false);
          return;
        } else if (result.suggestedAction === 'WARN') {
          setModerationWarning(result);
          setChecking(false);
          return;
        }
      }
      
      // Message is ok, send it
      await sendMessage();
    } catch (error) {
      console.error('Error checking message:', error);
      // If check fails, send anyway (graceful degradation)
      await sendMessage();
    } finally {
      setChecking(false);
    }
  };

  // Send message to Firebase
  const sendMessage = async () => {
    if ((!newMessage.trim() && !selectedImage) || sending) return;

    if (!database) {
      alert('Chat service not available. Firebase not configured.');
      return;
    }

    setSending(true);

    try {
      const messagesRef = ref(database, `chats/${towerId}/messages`);
      const newMessageRef = push(messagesRef);

      const messageData: any = {
        message: newMessage.trim() || '📷 Photo',
        userId: currentUserId,
        username: currentUsername,
        timestamp: Date.now(),
        createdAt: new Date().toISOString(),
      };

      // If there's an image, convert to base64 and include it
      if (selectedImage) {
        const reader = new FileReader();
        reader.onloadend = async () => {
          messageData.image = reader.result as string;
          messageData.hasImage = true;
          
          await set(newMessageRef, messageData);
          
          setNewMessage('');
          setSelectedImage(null);
          setImagePreview(null);
          setModerationWarning(null);
          setDbError(null);
          setSending(false);
        };
        reader.readAsDataURL(selectedImage);
        return; // Exit early, reader callback will handle the rest
      }

      // No image, just send text
      await set(newMessageRef, messageData);

      setNewMessage('');
      setModerationWarning(null);
      setDbError(null);
    } catch (error: any) {
      console.error('Error sending message:', error);
      const errorMsg = error?.code === 'PERMISSION_DENIED' 
        ? 'Permission denied. Check Firebase Realtime Database rules.'
        : 'Failed to send message. Please try again.';
      alert(errorMsg);
      setDbError(errorMsg);
    } finally {
      setSending(false);
    }
  };

  // Override moderation warning and send anyway
  const sendAnyway = async () => {
    setModerationWarning(null);
    await sendMessage();
  };

  // Fetch chat summary
  const fetchChatSummary = async () => {
    try {
      setLoadingSummary(true);
      
      const response = await fetch(`${API_BASE_URL}/api/chat/summary`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          towerId: towerId,
          messageLimit: 50 // Get summary of last 50 messages
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch chat summary');
      }

      const data = await response.json();
      setChatSummary(data.summary || 'No summary available');
      setShowSummary(true);
    } catch (error) {
      console.error('Error fetching chat summary:', error);
      setChatSummary('Unable to generate summary at this time.');
      setShowSummary(true);
    } finally {
      setLoadingSummary(false);
    }
  };

  // Fetch vibe summary
  const fetchVibeSummary = async () => {
    try {
      setLoadingVibe(true);
      
      const response = await fetch(`${API_BASE_URL}/api/ai/vibe-summary/tower/${towerId}?limit=20`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch vibe summary');
      }

      const data = await response.json();
      setVibeSummary(data.data?.summary || data.summary || 'No vibe available');
    } catch (error) {
      console.error('Error fetching vibe summary:', error);
      setVibeSummary('Unable to get vibe at this time.');
    } finally {
      setLoadingVibe(false);
    }
  };

  // Delete a post
  const handleDeletePost = async (postId: string) => {
    if (!confirm('Are you sure you want to delete this post? This action cannot be undone.')) {
      return;
    }

    try {
      const { postService } = await import('@/services/postService');
      await postService.deletePost(postId, currentUserId);
      alert('Post deleted successfully!');
      // The message will be automatically removed from the chat via Firebase listener
    } catch (error: any) {
      console.error('Error deleting post:', error);
      alert(error.message || 'Failed to delete post');
    }
  };

  // Delete a chat message
  const handleDeleteChatMessage = async (messageId: string) => {
    if (!confirm('Are you sure you want to delete this message? This action cannot be undone.')) {
      return;
    }

    if (!database) {
      alert('Database not initialized');
      return;
    }

    try {
      const messageRef = ref(database, `chats/${towerId}/messages/${messageId}`);
      
      // Import remove from firebase/database
      const { remove } = await import('firebase/database');
      await remove(messageRef);
      
      // The message will be automatically removed from the UI via Firebase listener
    } catch (error: any) {
      console.error('Error deleting message:', error);
      alert(error.message || 'Failed to delete message');
    }
  };

  // Moderate message (moderator only)
  const handleModerateMessage = async (messageId: string, action: 'DELETE' | 'HIDE' | 'FLAG') => {
    if (!isModerator) return;

    const reason = prompt(`Enter reason for ${action.toLowerCase()}:`);
    if (!reason) return;

    try {
      await chatService.moderateMessage({
        towerId,
        messageId,
        moderatorUserId: currentUserId,
        reason,
        action,
      });
    } catch (error) {
      console.error('Error moderating message:', error);
      alert('Failed to moderate message');
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-900 text-white">
      {/* Summary Action Buttons */}
      <div className="bg-gray-800 border-b border-gray-700 px-4 py-2">
        <div className="flex gap-2 items-center justify-between">
          <div className="flex gap-2">
            <button
              onClick={fetchChatSummary}
              disabled={loadingSummary || messages.length === 0}
              className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-lg text-sm transition-colors"
              title="Generate AI chat summary"
            >
              <MessageSquare className="w-4 h-4" />
              {loadingSummary ? 'Generating...' : 'Chat Summary'}
            </button>
            
            <button
              onClick={fetchVibeSummary}
              disabled={loadingVibe || postCount === 0}
              className="flex items-center gap-2 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-lg text-sm transition-colors"
              title={postCount === 0 ? "No posts in this tower yet" : "Get vibe of this tower"}
            >
              <Sparkles className="w-4 h-4" />
              {loadingVibe ? 'Loading...' : 'Vibe Check'}
            </button>
          </div>
          
          {vibeSummary && (
            <div className="text-sm text-purple-300 font-medium italic">
              ✨ {vibeSummary}
            </div>
          )}
        </div>
      </div>

      {/* Chat Summary Display */}
      {showSummary && chatSummary && (
        <div className="bg-gradient-to-r from-blue-900/40 to-cyan-900/40 border-b border-blue-700/50 px-4 py-3">
          <div className="flex items-start gap-3">
            <MessageSquare className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-blue-300 mb-1">Chat Summary</h4>
              <p className="text-sm text-gray-200 whitespace-pre-wrap">{chatSummary}</p>
            </div>
            <button
              onClick={() => setShowSummary(false)}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Database Error Banner */}
      {dbError && (
        <div className="bg-red-900/50 border-b border-red-700 px-4 py-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm text-red-200">{dbError}</p>
              <p className="text-xs text-red-300 mt-1">Check browser console for details</p>
            </div>
          </div>
        </div>
      )}

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            {dbError ? (
              <>
                <AlertTriangle className="w-12 h-12 mx-auto mb-2 text-red-500" />
                <p>Unable to load messages</p>
              </>
            ) : (
              <>No messages yet. Be the first to chat!</>
            )}
          </div>
        ) : (
          messages.map((msg) => {
            const formatted = chatService.formatMessage(msg, currentUserId, isModerator);
            
            if (!formatted.shouldShow) return null;

            const isOwnMessage = msg.userId === currentUserId;

            return (
              <div
                key={msg.id}
                className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[70%] rounded-lg p-3 ${
                    formatted.isModerated
                      ? 'bg-red-900/30 border border-red-700'
                      : msg.isPost
                      ? 'bg-cyan-900/40 border border-cyan-700' // Special styling for posts
                      : isOwnMessage
                      ? 'bg-blue-600'
                      : 'bg-gray-700'
                  }`}
                >
                  {!formatted.isModerated && (
                    <div className="text-xs text-gray-300 mb-1 font-semibold">
                      {msg.username}
                      {msg.isPost && (
                        <span className="ml-2 text-cyan-400 text-xs">
                          📍 Post
                        </span>
                      )}
                      {msg.flagged && isModerator && (
                        <span className="ml-2 text-yellow-400">
                          <Flag className="inline w-3 h-3" /> Flagged
                        </span>
                      )}
                    </div>
                  )}
                  
                  {/* Display image if present (for both posts and regular messages) */}
                  {((msg as any).hasImage || msg.image) && (msg as any).image && !formatted.isModerated && (
                    <div className="mb-2">
                      <img 
                        src={(msg as any).image} 
                        alt="Chat attachment" 
                        className="max-w-full h-auto rounded-lg max-h-64 object-cover"
                      />
                    </div>
                  )}
                  
                  <div className={formatted.isModerated ? 'text-gray-400 italic' : ''}>
                    {formatted.displayMessage}
                  </div>

                  {formatted.moderationReason && isOwnMessage && (
                    <div className="text-xs text-red-400 mt-1">
                      Reason: {formatted.moderationReason}
                    </div>
                  )}

                  <div className="text-xs text-gray-400 mt-1">
                    {new Date(msg.timestamp).toLocaleTimeString()}
                  </div>

                  {/* Delete Button (for own messages) */}
                  {isOwnMessage && !formatted.isModerated && (
                    <div className="mt-2">
                      {msg.isPost && msg.postId ? (
                        <button
                          onClick={() => handleDeletePost(msg.postId!)}
                          className="flex items-center gap-1 text-red-400 hover:text-red-300 text-xs transition-colors"
                          title="Delete this post"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Delete Post</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => handleDeleteChatMessage(msg.messageId || msg.id)}
                          className="flex items-center gap-1 text-red-400 hover:text-red-300 text-xs transition-colors"
                          title="Delete this message"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Delete Message</span>
                        </button>
                      )}
                    </div>
                  )}

                  {/* Moderator Actions */}
                  {isModerator && !formatted.isModerated && (
                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={() => handleModerateMessage(msg.messageId || msg.id, 'DELETE')}
                        className="text-red-400 hover:text-red-300 text-xs"
                        title="Delete"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => handleModerateMessage(msg.messageId || msg.id, 'HIDE')}
                        className="text-yellow-400 hover:text-yellow-300 text-xs"
                        title="Hide"
                      >
                        <EyeOff className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => handleModerateMessage(msg.messageId || msg.id, 'FLAG')}
                        className="text-orange-400 hover:text-orange-300 text-xs"
                        title="Flag"
                      >
                        <Flag className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Moderation Warning */}
      {moderationWarning && (
        <div className="px-4 py-3 bg-yellow-900/50 border-t border-yellow-700">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <div className="font-semibold text-yellow-400">
                {moderationWarning.suggestedAction === 'BLOCK' ? 'Message Blocked' : 'Warning'}
              </div>
              <div className="text-sm text-gray-300 mt-1">
                {moderationWarning.explanation}
              </div>
              {moderationWarning.violations.length > 0 && (
                <ul className="text-xs text-gray-400 mt-1 list-disc pl-4">
                  {moderationWarning.violations.map((v, i) => (
                    <li key={i}>{v}</li>
                  ))}
                </ul>
              )}
            </div>
          </div>
          {moderationWarning.suggestedAction === 'WARN' && (
            <div className="flex gap-2 mt-3">
              <button
                onClick={() => setModerationWarning(null)}
                className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-sm"
              >
                Edit Message
              </button>
              <button
                onClick={sendAnyway}
                className="px-3 py-1 bg-yellow-600 hover:bg-yellow-500 rounded text-sm"
              >
                Send Anyway
              </button>
            </div>
          )}
        </div>
      )}

      {/* Input Area */}
      <div className="p-4 bg-gray-800 border-t border-gray-700">
        {/* Image Preview */}
        {imagePreview && (
          <div className="mb-3 relative inline-block">
            <img 
              src={imagePreview} 
              alt="Preview" 
              className="max-h-32 rounded-lg border border-gray-600"
            />
            <button
              onClick={handleRemoveImage}
              className="absolute -top-2 -right-2 p-1 bg-red-600 hover:bg-red-700 rounded-full transition-colors"
              type="button"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
        
        <div className="flex gap-2">
          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageSelect}
            className="hidden"
          />
          
          {/* Image upload button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={sending || checking}
            className="px-3 py-2 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg transition-colors flex items-center gap-2"
            type="button"
            title="Add photo"
          >
            <ImageIcon className="w-5 h-5" />
          </button>
          
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleCheckMessage();
              }
            }}
            placeholder="Type a message..."
            className="flex-1 px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-blue-500 text-white placeholder-gray-400"
            disabled={sending || checking}
          />
          <button
            onClick={handleCheckMessage}
            disabled={(!newMessage.trim() && !selectedImage) || sending || checking}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg transition-colors flex items-center gap-2"
          >
            {sending || checking ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>
        <div className="text-xs text-gray-500 mt-2">
          Messages are checked for inappropriate content before sending • You can attach photos
        </div>
      </div>
    </div>
  );
}
