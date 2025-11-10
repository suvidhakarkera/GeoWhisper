'use client';

import { useState, useEffect, useRef } from 'react';
import { getDatabase, ref, onValue, push, set, off } from 'firebase/database';
import { Send, AlertTriangle, Flag, Trash2, EyeOff, Loader2 } from 'lucide-react';
import { chatService, ChatMessage, ContentModerationResponse } from '@/services/chatService';

interface TowerChatProps {
  towerId: string;
  currentUserId: string;
  currentUsername: string;
  isModerator?: boolean;
}

export default function TowerChat({ 
  towerId, 
  currentUserId, 
  currentUsername, 
  isModerator = false 
}: TowerChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [checking, setChecking] = useState(false);
  const [moderationWarning, setModerationWarning] = useState<ContentModerationResponse | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const database = getDatabase();

  // Scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Listen for real-time messages
  useEffect(() => {
    const messagesRef = ref(database, `chats/${towerId}/messages`);

    const unsubscribe = onValue(messagesRef, (snapshot) => {
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
    });

    return () => {
      off(messagesRef);
    };
  }, [towerId, database]);

  // Check message before sending
  const handleCheckMessage = async () => {
    if (!newMessage.trim()) return;

    setChecking(true);
    setModerationWarning(null);

    try {
      const result = await chatService.checkContent({
        content: newMessage,
        userId: currentUserId,
        towerId: towerId,
      });

      if (result.suggestedAction === 'BLOCK') {
        setModerationWarning(result);
      } else if (result.suggestedAction === 'WARN') {
        setModerationWarning(result);
      } else {
        // Message is ok, send it
        await sendMessage();
      }
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
    if (!newMessage.trim() || sending) return;

    setSending(true);

    try {
      const messagesRef = ref(database, `chats/${towerId}/messages`);
      const newMessageRef = push(messagesRef);

      await set(newMessageRef, {
        message: newMessage.trim(),
        userId: currentUserId,
        username: currentUsername,
        timestamp: Date.now(),
        createdAt: new Date().toISOString(),
      });

      setNewMessage('');
      setModerationWarning(null);
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message. Please try again.');
    } finally {
      setSending(false);
    }
  };

  // Override moderation warning and send anyway
  const sendAnyway = async () => {
    setModerationWarning(null);
    await sendMessage();
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
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            No messages yet. Be the first to chat!
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
                      : isOwnMessage
                      ? 'bg-blue-600'
                      : 'bg-gray-700'
                  }`}
                >
                  {!formatted.isModerated && (
                    <div className="text-xs text-gray-300 mb-1 font-semibold">
                      {msg.username}
                      {msg.flagged && isModerator && (
                        <span className="ml-2 text-yellow-400">
                          <Flag className="inline w-3 h-3" /> Flagged
                        </span>
                      )}
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
        <div className="flex gap-2">
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
            disabled={!newMessage.trim() || sending || checking}
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
          Messages are checked for inappropriate content before sending
        </div>
      </div>
    </div>
  );
}
