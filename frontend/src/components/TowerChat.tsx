'use client';

import { useState, useEffect, useRef } from 'react';
import { ref, onValue, push, set, off } from 'firebase/database';
import { Send, AlertTriangle, Flag, Trash2, EyeOff, Loader2, Image as ImageIcon, X, Sparkles, MessageSquare, MessageCircle, Camera, Reply, Images } from 'lucide-react';
import { chatService, ChatMessage, ContentModerationResponse } from '@/services/chatService';
import { database } from '@/config/firebase';
import { API_BASE_URL } from '@/config/api';
import { useToast } from '@/components/ToastContext';
import TowerImagesModal from '@/components/TowerImagesModal';

interface TowerChatProps {
  towerId: string;
  currentUserId: string;
  currentUsername: string;
  isModerator?: boolean;
  postCount?: number;
  isCurrentTower?: boolean; // Whether this is the tower the user is currently in (within 500m)
}

export default function TowerChat({ 
  towerId, 
  currentUserId, 
  currentUsername, 
  isModerator = false,
  postCount = 0,
  isCurrentTower = false
}: TowerChatProps) {
  const { show } = useToast();
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
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [canInteract, setCanInteract] = useState<boolean | null>(null); // null = loading
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isOutOfRange, setIsOutOfRange] = useState(false); // Separate flag for out-of-range vs actual errors
  const [distanceFromTower, setDistanceFromTower] = useState<number | null>(null);
  const [showRangePopup, setShowRangePopup] = useState(false);
  const [checkingPermissions, setCheckingPermissions] = useState(true);
  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);
  const [touchStart, setTouchStart] = useState<{ x: number; y: number; messageId: string } | null>(null);
  const [showImagesModal, setShowImagesModal] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Get user location on mount
  useEffect(() => {
    const getUserLocation = async () => {
      setCheckingPermissions(true);
      
      // Check if geolocation is available
      if (!navigator.geolocation) {
        console.error('Geolocation is not supported by this browser');
        setLocationError('Geolocation is not supported by your browser.');
        setCanInteract(false);
        setCheckingPermissions(false);
        return;
      }
      
      try {
        // Get user location with 3 second timeout
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          if (!navigator.geolocation) {
            reject(new Error('Geolocation is not supported by your browser'));
            return;
          }
          
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: false, // Use cached location for faster response
            timeout: 3000, // 3 second timeout
            maximumAge: 120000, // Accept cached location up to 2 minutes old
          });
        });

        const location = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };
        setUserLocation(location);
        
        console.log('=== LOCATION CHECK DEBUG ===');
        console.log('User location:', location);
        console.log('Tower ID:', towerId);
        console.log('isCurrentTower prop:', isCurrentTower);

        // If this is the user's current tower, automatically grant access
        if (isCurrentTower) {
          console.log('✅ This is the current tower - automatically granting interaction access');
          setCanInteract(true);
          setDistanceFromTower(0); // User is within the tower
          setCheckingPermissions(false);
          return;
        }

        // Check if user can interact with this tower and get distance
        console.log('🔍 Checking interaction permission for tower:', towerId);
        console.log('Making API request to:', `${API_BASE_URL}/api/towers/${towerId}/can-interact?latitude=${location.latitude}&longitude=${location.longitude}`);
        try {
          const response = await fetch(
            `${API_BASE_URL}/api/towers/${towerId}/can-interact?latitude=${location.latitude}&longitude=${location.longitude}`
          );
          
          console.log('API response status:', response.status);
          
          if (response.ok) {
            const result = await response.json();
            const data = result.data;
            console.log('✅ Permission check result:', data);
            console.log('Can interact:', data.canInteract, 'Distance:', data.distance, 'm');
            
            setCanInteract(data.canInteract);
            setDistanceFromTower(data.distance);
            
            if (!data.canInteract) {
              setIsOutOfRange(true);
              setLocationError(null); // Clear any location errors
              console.log('❌ User is out of range:', data.message);
            } else {
              setIsOutOfRange(false);
              console.log('✅ User can interact with this tower!');
            }
          } else if (response.status === 403 || response.status === 401) {
            // Permission denied at API level - treat as out of range for now
            console.warn('⚠️ Permission check failed with status:', response.status);
            const errorText = await response.text();
            console.warn('Response body:', errorText);
            setCanInteract(false);
            setIsOutOfRange(true);
            setLocationError(null);
            setDistanceFromTower(null);
          } else {
            console.error('❌ Failed to check permissions. Status:', response.status);
            const errorText = await response.text();
            console.error('Response body:', errorText);
            setCanInteract(false);
            setIsOutOfRange(true);
            setLocationError(null);
          }
        } catch (fetchError) {
          console.error('❌ Error checking tower permissions:', fetchError);
          // If the API call fails, treat it as out of range rather than an error
          setCanInteract(false);
          setIsOutOfRange(true);
          setLocationError(null);
        }
      } catch (error: any) {
        // Provide more specific error messages
        let errorMessage = 'Unable to get your location. Interaction may be restricted.';
        let isTimeout = false;
        
        // Check if it's a GeolocationPositionError
        if (error && typeof error === 'object' && 'code' in error) {
          const errorCode = error.code;
          const errorMsg = error.message || 'Unknown error';
          
          console.error('Geolocation error code:', errorCode);
          console.error('Geolocation error message:', errorMsg);
          console.error('Error type:', error.constructor?.name || 'Unknown');
          
          switch (errorCode) {
            case 1: // PERMISSION_DENIED
              errorMessage = 'Location permission denied. Please enable location access in your browser settings to interact with this tower.';
              console.log('Location permission denied by user');
              break;
            case 2: // POSITION_UNAVAILABLE
              errorMessage = 'Location information is unavailable. Please check your device settings.';
              console.log('Position unavailable');
              break;
            case 3: // TIMEOUT
              // With 3 second timeout, treat this as out of range rather than an error
              isTimeout = true;
              console.log('Geolocation timeout - treating as out of range');
              break;
            default:
              errorMessage = 'Failed to get location. Please ensure location services are enabled.';
              console.error('Unknown error code:', errorCode);
          }
        } else if (!navigator.geolocation) {
          errorMessage = 'Geolocation is not supported by your browser.';
          console.error('Geolocation not supported by browser');
        } else {
          // Generic error - log what we can
          console.error('Unknown geolocation error type:', typeof error);
          if (error instanceof Error) {
            console.error('Error message:', error.message);
            console.error('Error name:', error.name);
          } else {
            console.error('Error value:', String(error));
          }
        }
        
        if (isTimeout) {
          // Treat timeout as out of range, not an error
          setLocationError(null);
          setIsOutOfRange(true);
          setCanInteract(false);
        } else {
          setLocationError(errorMessage);
          setCanInteract(false);
        }
      } finally {
        setCheckingPermissions(false);
      }
    };

    getUserLocation();
  }, [towerId, isCurrentTower]);

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
      console.error('Database value:', database);
      console.error('Firebase config check:', {
        apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY?.substring(0, 10) + '...',
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL
      });
      setDbError('⚠️ Firebase Realtime Database not initialized. Please enable it in Firebase Console.');
      return;
    }

    console.log('✅ Firebase database initialized, listening to:', `chats/${towerId}/messages`);
    const messagesRef = ref(database, `chats/${towerId}/messages`);

    console.log('📡 Setting up Firebase listener for tower:', towerId);
    
    const unsubscribe = onValue(
      messagesRef, 
      (snapshot) => {
        console.log('📨 Firebase snapshot received. Has data:', snapshot.exists());
        const messagesData: ChatMessage[] = [];
        
        snapshot.forEach((childSnapshot) => {
          const msg = childSnapshot.val();
          
          // Strip any leading emoji + "Created a post:" prefix from post messages
          let messageText = msg.message;
          if (messageText) {
            messageText = messageText.replace(/^\s*(📍\s*)?Created a post:\s*/i, '').trim();
          }
          
          // Debug log for reply fields
          if (msg.replyTo) {
            console.log('Message with reply found:', {
              messageId: childSnapshot.key,
              replyTo: msg.replyTo,
              repliedMessage: msg.repliedMessage,
              repliedUsername: msg.repliedUsername
            });
          }
          
          messagesData.push({
            id: childSnapshot.key!,
            messageId: childSnapshot.key!,
            userId: msg.userId,
            username: msg.username,
            message: messageText,
            timestamp: msg.timestamp,
            createdAt: msg.createdAt,
            // Post-related fields
            isPost: msg.isPost,
            postId: msg.postId,
            image: msg.image,
            // Reply-related fields
            replyTo: msg.replyTo,
            repliedMessage: msg.repliedMessage,
            repliedUsername: msg.repliedUsername,
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
        console.log('✅ Loaded', messagesData.length, 'messages from Firebase');
        setMessages(messagesData);
        setDbError(null);
      },
      (error) => {
        console.error('❌ Firebase onValue error:', error);
        console.error('Error code:', error.code);
        console.error('Error message:', error.message);
        
        if (error.code === 'PERMISSION_DENIED') {
          setDbError('🔒 Firebase Realtime Database: Permission denied. Please check Firebase security rules.');
        } else if (error.message?.includes('404') || error.message?.includes('not found')) {
          setDbError('🔥 Firebase Realtime Database not created yet. Enable it in Firebase Console → Realtime Database → Create Database.');
        } else {
          setDbError(`Failed to load messages: ${error.message}`);
        }
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
    // Clear moderation warning when user removes the image
    setModerationWarning(null);
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

  // Send message through backend API with location validation
  const sendMessage = async () => {
    if ((!newMessage.trim() && !selectedImage) || sending) return;

    if (!userLocation) {
      console.error('User location not available:', userLocation);
      alert('Unable to send message. Location not available. Please refresh the page and allow location access.');
      return;
    }

    if (!userLocation.latitude || !userLocation.longitude) {
      console.error('Invalid coordinates:', userLocation);
      alert('Unable to send message. Invalid location coordinates.');
      return;
    }

    if (!canInteract) {
      alert('You must be within 500 meters of this tower to send messages.');
      return;
    }

    setSending(true);

    try {
      // Use the existing user location (already validated)
      const currentLocation = userLocation;

      let imageData: string | undefined;

      // If there's an image, convert to base64
      if (selectedImage) {
        const reader = new FileReader();
        imageData = await new Promise<string>((resolve, reject) => {
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(selectedImage);
        });
      }

      // Send message through backend API
      console.log('=== SENDING MESSAGE ===');
      console.log('Tower ID:', towerId);
      console.log('User location:', {
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude
      });
      console.log('Is current tower:', isCurrentTower);
      console.log('Can interact:', canInteract);
      console.log('Distance from tower:', distanceFromTower, 'm');
      console.log('Reply data:', {
        replyingTo: replyingTo?.id,
        repliedMessage: replyingTo?.message,
        repliedUsername: replyingTo?.username
      });
      
      const result = await chatService.sendMessage(
        towerId,
        newMessage.trim() || '📷 Photo',
        currentLocation.latitude,
        currentLocation.longitude,
        imageData,
        replyingTo?.id,
        replyingTo?.message,
        replyingTo?.username
      );

      console.log('Send message result:', result);

      if (!result.success) {
        console.error('Failed to send message:', result.error);
        throw new Error(result.error || 'Failed to send message');
      }

      // Clear inputs on success
      console.log('Message sent successfully!');
      setNewMessage('');
      setSelectedImage(null);
      setImagePreview(null);
      setModerationWarning(null);
      setReplyingTo(null);
      setDbError(null);
    } catch (error: any) {
      console.error('Error sending message:', error);
      const errorMsg = error.message || 'Failed to send message. Please try again.';
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
      show('Post deleted successfully!', 'success');
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
    <div className="flex flex-col h-full bg-gradient-to-br from-gray-900 via-gray-900 to-black text-white relative">
      {/* Modern Header with Action Buttons */}
      <div className="bg-gradient-to-r from-gray-800/80 to-gray-900/80 backdrop-blur-xl border-b border-gray-700/50 px-2 py-3 shadow-lg relative z-[50]">
        <div className="flex gap-2 items-center justify-between flex-wrap">
          <div className="flex gap-2 items-center flex-wrap">
            {/* Moderator Badge */}
            {isModerator && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-purple-600/20 to-pink-600/20 border-2 border-purple-500/50 rounded-lg">
                <span className="text-xs font-bold text-purple-300">🛡️ MODERATOR</span>
              </div>
            )}
            <button
              onClick={fetchChatSummary}
              disabled={loadingSummary || messages.length === 0}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 disabled:bg-gray-700/50 disabled:text-gray-500 disabled:cursor-not-allowed rounded-lg text-xs font-medium transition-all border-2 border-gray-700 hover:border-blue-400 disabled:border-gray-700 text-white whitespace-nowrap"
              title="Generate AI chat summary"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>{loadingSummary ? 'Generating...' : 'Summary'}</span>
            </button>
            
            <button
              onClick={fetchVibeSummary}
              disabled={loadingVibe || postCount === 0}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 disabled:bg-gray-700/50 disabled:text-gray-500 disabled:cursor-not-allowed rounded-lg text-xs font-medium transition-all border-2 border-gray-700 hover:border-blue-400 disabled:border-gray-700 text-white whitespace-nowrap"
              title={postCount === 0 ? "No posts in this tower yet" : "Get vibe of this tower"}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{loadingVibe ? 'Loading...' : 'Vibe Check'}</span>
            </button>
            
            <button
              onClick={() => setShowImagesModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-xs font-medium transition-all border-2 border-gray-700 hover:border-blue-400 text-white whitespace-nowrap"
              title="View all images posted in this tower"
            >
              <Images className="w-3.5 h-3.5" />
              <span>Gallery</span>
            </button>

            {/* View Only Mode Indicator - Show when checking or when out of range */}
            {(checkingPermissions || canInteract === false) && (
              <div className="relative z-[100]">
                <button
                  onClick={() => setShowRangePopup(!showRangePopup)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 backdrop-blur-sm rounded-lg text-xs font-medium transition-all border-2 text-white whitespace-nowrap ${
                    locationError 
                      ? 'bg-red-500/10 hover:bg-red-500/20 border-red-500/50 hover:border-red-500' 
                      : isOutOfRange
                      ? 'bg-yellow-500/10 hover:bg-yellow-500/20 border-yellow-500/50 hover:border-yellow-500'
                      : 'bg-white/5 hover:bg-white/10 border-gray-700 hover:border-blue-400'
                  }`}
                  title="Click for details"
                >
                  {locationError ? <AlertTriangle className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                  <span>{locationError ? 'Location Error' : isOutOfRange ? 'Out of Range' : 'View Only'}</span>
                </button>

                {/* Popup - Click outside to close, positioned to stay within screen */}
                {showRangePopup && (
                  <>
                    {/* Backdrop to close popup */}
                    <div 
                      className="fixed inset-0 bg-black/50 z-[99998]"
                      onClick={() => setShowRangePopup(false)}
                    />
                    <div className="fixed top-20 left-1/2 -translate-x-1/2 w-80 max-w-[90vw] bg-black border-2 border-blue-400/50 rounded-xl z-[99999] p-5 shadow-2xl">
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-gray-800 rounded-lg border border-gray-700">
                          <AlertTriangle className="w-5 h-5 text-gray-300" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-bold text-white text-sm mb-2">
                            {locationError ? 'Location Access Required' : isOutOfRange ? 'Out of Tower Range' : 'View Only Mode'}
                          </h4>
                          <p className="text-xs text-gray-300 mb-2 leading-relaxed">
                            {locationError ? (
                              <>{locationError}</>
                            ) : isOutOfRange && distanceFromTower ? (
                              <>
                                You are <span className="font-bold text-yellow-400">{Math.round(distanceFromTower)}m</span> away from this tower.
                              </>
                            ) : distanceFromTower ? (
                              <>
                                You are <span className="font-bold text-blue-400">{Math.round(distanceFromTower)}m</span> away from this tower.
                              </>
                            ) : (
                              <>Checking your location...</>
                            )}
                          </p>
                          {locationError ? (
                            <p className="text-xs text-gray-400 leading-relaxed">
                              Please enable location access in your browser settings to interact with this tower.
                            </p>
                          ) : isOutOfRange ? (
                            <p className="text-xs text-gray-400 leading-relaxed">
                              You are outside the 500m interaction range. <span className="font-semibold text-white">Only viewing is enabled.</span> Move closer to send messages.
                            </p>
                          ) : (
                            <p className="text-xs text-gray-400 leading-relaxed">
                              You can view messages but cannot send messages or interact with content.
                            </p>
                          )}
                          <button
                            onClick={() => setShowRangePopup(false)}
                            className="mt-4 w-full px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg text-sm font-medium transition-all border-2 border-gray-700 hover:border-blue-400"
                          >
                            Got it
                          </button>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
          
          {vibeSummary && (
            <div className="mt-2 px-3 py-2 bg-gray-800/60 border border-cyan-500/20 rounded-xl backdrop-blur-sm">
              <p className="text-xs text-cyan-400 font-medium">
                ✨ {vibeSummary}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Chat Summary Display */}
      {showSummary && chatSummary && (
        <div className="bg-gray-800/60 border-b border-gray-700/50 px-4 py-4 backdrop-blur-sm">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-gray-700/50 rounded-lg">
              <MessageSquare className="w-5 h-5 text-gray-300" />
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-bold text-gray-200 mb-2">Chat Summary</h4>
              <p className="text-sm text-gray-400 whitespace-pre-wrap leading-relaxed">{chatSummary}</p>
            </div>
            <button
              onClick={() => setShowSummary(false)}
              className="p-1.5 bg-gray-700/50 hover:bg-gray-600/50 rounded-lg text-gray-400 hover:text-gray-300 transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Database Error Banner */}
      {dbError && (
        <div className="bg-gradient-to-r from-red-900/60 to-orange-900/60 border-b border-red-500/30 px-4 py-4 backdrop-blur-sm">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-red-500/20 rounded-lg flex-shrink-0">
              <AlertTriangle className="w-5 h-5 text-red-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-red-200 mb-2">{dbError}</p>
              {dbError.includes('not created') || dbError.includes('not initialized') ? (
                <div className="text-xs text-red-300/90 space-y-2 bg-black/20 rounded-lg p-3 border border-red-500/20">
                  <p className="font-semibold">🔥 Quick Fix:</p>
                  <ol className="list-decimal list-inside space-y-1 pl-2">
                    <li>Open <a href="https://console.firebase.google.com/" target="_blank" rel="noopener noreferrer" className="underline hover:text-red-100">Firebase Console</a></li>
                    <li>Select project: <span className="font-mono bg-black/30 px-1 rounded">geowhisper-final</span></li>
                    <li>Go to <span className="font-semibold">Build → Realtime Database</span></li>
                    <li>Click <span className="font-semibold">"Create Database"</span></li>
                    <li>Choose <span className="font-semibold">Test Mode</span> (us-central1)</li>
                    <li>Restart both servers</li>
                  </ol>
                  <p className="text-[10px] text-red-400/70 mt-2">See FIREBASE_REALTIME_DATABASE_SETUP.md for details</p>
                </div>
              ) : (
                <p className="text-xs text-red-300/80">Check browser console (F12) for details</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Messages Area - Modern Scrollable */}
  <div className="flex-1 overflow-y-auto p-4 space-y-3 chat-scrollbar pb-24">
        {messages.length === 0 ? (
          <div className="text-center text-gray-400 py-12">
            {dbError ? (
              <>
                <div className="inline-block p-4 bg-red-500/10 rounded-2xl mb-3">
                  <AlertTriangle className="w-12 h-12 text-red-400" />
                </div>
                <p className="font-medium">Unable to load messages</p>
              </>
            ) : (
              <>
                <div className="inline-block p-4 bg-blue-500/10 rounded-2xl mb-3">
                  <MessageCircle className="w-12 h-12 text-blue-400" />
                </div>
                <p className="font-medium">No messages yet</p>
                <p className="text-sm text-gray-500 mt-1">Be the first to start the conversation!</p>
              </>
            )}
          </div>
        ) : (
          messages.map((msg) => {
            const formatted = chatService.formatMessage(msg, currentUserId, isModerator);
            
            if (!formatted.shouldShow) return null;

            const isOwnMessage = msg.userId === currentUserId;
            
            // Get user initials for avatar
            const getInitials = (username: string) => {
              if (!username) return '?';
              const parts = username.split('_');
              if (parts.length >= 2) {
                return (parts[0][0] + parts[1][0]).toUpperCase();
              }
              return username.substring(0, 2).toUpperCase();
            };

            // Swipe gesture handlers
            const handleTouchStart = (e: React.TouchEvent) => {
              if (!canInteract || formatted.isModerated) return;
              setTouchStart({
                x: e.touches[0].clientX,
                y: e.touches[0].clientY,
                messageId: msg.id
              });
            };

            const handleTouchEnd = (e: React.TouchEvent) => {
              if (!touchStart || touchStart.messageId !== msg.id || !canInteract) return;
              
              const touchEnd = {
                x: e.changedTouches[0].clientX,
                y: e.changedTouches[0].clientY
              };

              const deltaX = touchEnd.x - touchStart.x;
              const deltaY = Math.abs(touchEnd.y - touchStart.y);

              // Check if it's a horizontal swipe (not vertical scroll)
              if (Math.abs(deltaX) > 50 && deltaY < 30) {
                setReplyingTo(msg);
              }

              setTouchStart(null);
            };

            return (
              <div
                key={msg.id}
                className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} group`}
              >
                <div 
                  className="flex flex-col gap-1 max-w-[75%]"
                  onTouchStart={handleTouchStart}
                  onTouchEnd={handleTouchEnd}
                >
                  {/* Avatar and username above the message for other users */}
                  {!isOwnMessage && (
                    <div className="flex items-center gap-2 px-2">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-slate-600 to-slate-700 border border-slate-500/30 flex items-center justify-center text-white text-xs font-bold shadow-md">
                        {getInitials(msg.username)}
                      </div>
                      <span className="text-xs font-semibold text-gray-300">
                        {msg.username}
                      </span>
                    </div>
                  )}
                  
                  <div
                    className={`relative rounded-2xl p-3 pr-20 shadow-lg transition-all ${
                      formatted.isModerated
                        ? 'bg-gradient-to-br from-red-900/40 to-red-800/40 border border-red-500/30 backdrop-blur-sm'
                        : msg.isPost
                        ? 'bg-gradient-to-br from-cyan-900/50 to-blue-900/50 border border-cyan-500/30 backdrop-blur-sm' // Special styling for posts
                        : isOwnMessage
                        ? 'bg-[#2d3e50] backdrop-blur-sm'
                        : 'bg-gradient-to-br from-gray-700/80 to-gray-800/80 backdrop-blur-sm border border-gray-600/30'
                    }`}
                  >
                    {/* Chat bubble tail/pointer */}
                    {!isOwnMessage ? (
                      // Left tail for other users' messages
                      <div className="absolute -left-2 top-4 w-0 h-0 border-t-[8px] border-t-transparent border-r-[10px] border-r-gray-700/80 border-b-[8px] border-b-transparent"></div>
                    ) : (
                      // Right tail for own messages
                      <div className="absolute -right-2 top-4 w-0 h-0 border-t-[8px] border-t-transparent border-l-[10px] border-l-[#2d3e50] border-b-[8px] border-b-transparent"></div>
                    )}
                    
                    {!formatted.isModerated && msg.isPost && (
                      <div className="text-xs text-gray-300 mb-2 font-semibold flex items-center gap-2">
                        <span className="px-2 py-0.5 bg-cyan-500/20 text-cyan-300 text-xs rounded-full font-medium">
                          📍 Post
                        </span>
                        {msg.flagged && isModerator && (
                          <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-400 text-xs rounded-full font-medium">
                            <Flag className="inline w-3 h-3" /> Flagged
                          </span>
                        )}
                      </div>
                    )}
                  
                  {/* Display replied message if this is a reply */}
                  {msg.replyTo && msg.repliedMessage && (
                    <div className="mb-2 pl-3 border-l-2 border-blue-400/50 bg-black/20 rounded-r-lg p-2">
                      <div className="flex items-center gap-1 mb-1">
                        <Reply className="w-3 h-3 text-blue-400" />
                        <span className="text-xs font-semibold text-blue-400">
                          {msg.repliedUsername || 'User'}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 line-clamp-2">
                        {msg.repliedMessage}
                      </p>
                    </div>
                  )}
                  
                  {/* Display image if present (for both posts and regular messages) */}
                  {((msg as any).hasImage || msg.image) && (msg as any).image && !formatted.isModerated && (
                    <div className="mb-2">
                      <img 
                        src={(msg as any).image} 
                        alt="Chat attachment" 
                        className="max-w-full h-auto rounded-xl max-h-64 object-cover border border-gray-600/30"
                      />
                    </div>
                  )}
                  
                  <div className={`text-sm leading-relaxed ${formatted.isModerated ? 'text-gray-400 italic' : isOwnMessage ? 'text-white' : 'text-gray-100'}`}>
                    {formatted.displayMessage}
                  </div>

                  {formatted.moderationReason && isOwnMessage && (
                    <div className="text-xs text-red-300 mt-2 px-2 py-1 bg-red-500/10 rounded-lg border border-red-500/20">
                      <span className="font-medium">Reason:</span> {formatted.moderationReason}
                    </div>
                  )}

                  {/* Reply Button - Top Right (for all users except moderated messages) */}
                  {!formatted.isModerated && canInteract && (
                    <button
                      onClick={() => setReplyingTo(msg)}
                      className={`absolute top-2 ${isOwnMessage ? 'right-12' : 'right-2'} p-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 hover:text-blue-300 rounded-lg transition-all duration-300 border border-blue-500/20 hover:border-blue-500/40 opacity-0 group-hover:opacity-100 z-10`}
                      title="Reply to this message"
                    >
                      <Reply className="w-3.5 h-3.5" />
                    </button>
                  )}
                  
                  {/* Delete Button (for own messages) - Top Right */}
                  {isOwnMessage && !formatted.isModerated && (
                    <div>
                      {msg.isPost && msg.postId ? (
                        <button
                          onClick={() => handleDeletePost(msg.postId!)}
                          className="absolute top-2 right-2 p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 rounded-lg transition-all duration-300 border border-red-500/20 hover:border-red-500/40 opacity-0 group-hover:opacity-100 z-10"
                          title="Delete this post"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      ) : (
                        <button
                          onClick={() => handleDeleteChatMessage(msg.messageId || msg.id)}
                          className="absolute top-2 right-2 p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 rounded-lg transition-all duration-300 border border-red-500/20 hover:border-red-500/40 opacity-0 group-hover:opacity-100 z-10"
                          title="Delete this message"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  )}

                  <div className={`text-xs mt-2 flex items-center justify-between ${isOwnMessage ? 'text-blue-200' : 'text-gray-400'}`}>
                    <span className="opacity-75">
                      {new Date(msg.timestamp).toLocaleTimeString()}
                    </span>
                  </div>

                  {/* Moderator Actions */}
                  {isModerator && !formatted.isModerated && (
                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={() => handleModerateMessage(msg.messageId || msg.id, 'DELETE')}
                        className="px-2.5 py-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 text-xs font-medium rounded-lg transition-all border border-red-500/20 hover:border-red-500/30"
                        title="Delete"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => handleModerateMessage(msg.messageId || msg.id, 'HIDE')}
                        className="px-2.5 py-1 bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-400 hover:text-yellow-300 text-xs font-medium rounded-lg transition-all border border-yellow-500/20 hover:border-yellow-500/30"
                        title="Hide"
                      >
                        <EyeOff className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => handleModerateMessage(msg.messageId || msg.id, 'FLAG')}
                        className="px-2.5 py-1 bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 hover:text-orange-300 text-xs font-medium rounded-lg transition-all border border-orange-500/20 hover:border-orange-500/30"
                        title="Flag"
                      >
                        <Flag className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Moderation Warning */}
      {moderationWarning && (
        <div className="px-4 py-3 bg-gradient-to-r from-yellow-900/40 to-orange-900/40 border-t border-yellow-500/30 backdrop-blur-sm">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-yellow-500/20 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0" />
            </div>
            <div className="flex-1">
              <div className="font-bold text-yellow-300">
                {moderationWarning.suggestedAction === 'BLOCK' ? 'Message Blocked' : 'Warning'}
              </div>
              <div className="text-sm text-gray-300 mt-1">
                {moderationWarning.explanation}
              </div>
              {moderationWarning.violations.length > 0 && (
                <ul className="text-xs text-gray-400 mt-2 space-y-0.5 list-disc pl-4">
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
                className="px-4 py-2 bg-gray-700/80 hover:bg-gray-600/80 backdrop-blur-sm text-white rounded-xl font-medium transition-all border border-gray-600/30 hover:border-gray-500/50"
              >
                Edit Message
              </button>
              <button
                onClick={sendAnyway}
                className="px-4 py-2 bg-gradient-to-r from-yellow-600 to-yellow-700 hover:from-yellow-500 hover:to-yellow-600 text-white rounded-xl font-medium transition-all shadow-lg shadow-yellow-500/30"
              >
                Send Anyway
              </button>
            </div>
          )}
        </div>
      )}

      {/* Input Area - Only show if user can interact (within 500m) and checking is complete */}
      {!checkingPermissions && canInteract === true && (
        <div className="sticky bottom-0 z-50 p-4 bg-gradient-to-b from-gray-800/80 to-gray-900/80 backdrop-blur-xl border-t border-gray-700/50">
        {/* Reply Preview */}
        {replyingTo && (
          <div className="mb-3 bg-gray-700/60 border border-blue-500/30 rounded-xl p-3 backdrop-blur-sm">
            <div className="flex items-start gap-2">
              <Reply className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold text-blue-400 mb-1">
                  Replying to {replyingTo.username}
                </div>
                <p className="text-xs text-gray-300 line-clamp-2">
                  {replyingTo.message}
                </p>
              </div>
              <button
                onClick={() => setReplyingTo(null)}
                className="p-1 bg-gray-600/50 hover:bg-gray-500/50 rounded-lg transition-all flex-shrink-0"
                type="button"
                title="Cancel reply"
              >
                <X className="w-3.5 h-3.5 text-gray-300" />
              </button>
            </div>
          </div>
        )}
        
        {/* Image Preview */}
        {imagePreview && (
          <div className="mb-3 relative inline-block">
            <img 
              src={imagePreview} 
              alt="Preview" 
              className="max-h-32 rounded-xl border-2 border-gray-600/50 shadow-lg"
            />
            <button
              onClick={handleRemoveImage}
              className="absolute -top-2 -right-2 p-1.5 bg-gradient-to-br from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 rounded-full transition-all shadow-lg"
              type="button"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
        
        <div className="flex gap-2">
          {/* Hidden file inputs */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageSelect}
            className="hidden"
          />
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleImageSelect}
            className="hidden"
          />
          
          {/* Camera button - Mobile only */}
          <button
            onClick={() => cameraInputRef.current?.click()}
            disabled={sending || checking}
            className="md:hidden px-3 py-2 bg-gray-700/80 hover:bg-gray-600/80 disabled:bg-gray-600/50 disabled:cursor-not-allowed rounded-xl transition-all backdrop-blur-sm flex items-center gap-2 border border-gray-600/30 hover:border-gray-500/50 shadow-lg flex-shrink-0"
            type="button"
            title="Take photo"
          >
            <Camera className="w-5 h-5" />
          </button>
          
          {/* Image upload button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={sending || checking}
            className="px-3 py-2 bg-gray-700/80 hover:bg-gray-600/80 disabled:bg-gray-600/50 disabled:cursor-not-allowed rounded-xl transition-all backdrop-blur-sm flex items-center gap-2 border border-gray-600/30 hover:border-gray-500/50 shadow-lg flex-shrink-0"
            type="button"
            title="Add photo"
          >
            <ImageIcon className="w-5 h-5" />
          </button>
          
          <input
            type="text"
            value={newMessage}
            onChange={(e) => {
              const v = e.target.value;
              setNewMessage(v);
              // If user cleared the input (no meaningful text), remove moderation warning
              if (!v.trim()) {
                setModerationWarning(null);
              }
            }}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleCheckMessage();
              }
            }}
            placeholder="Type a message..."
            className="flex-1 min-w-0 px-4 py-3 bg-gray-700/80 backdrop-blur-sm border border-gray-600/30 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 text-white placeholder-gray-400 transition-all shadow-inner"
            disabled={sending || checking}
          />
          <button
            onClick={handleCheckMessage}
            disabled={(!newMessage.trim() && !selectedImage) || sending || checking}
            className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed rounded-xl transition-all flex items-center gap-2 flex-shrink-0"
            title="Send message"
          >
            {sending || checking ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>
        <div className="text-xs text-gray-400 mt-2 flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
          Messages are checked for inappropriate content • You can attach photos
        </div>
        </div>
      )}

      {/* Tower Images Modal */}
      <TowerImagesModal 
        towerId={towerId}
        isOpen={showImagesModal}
        onClose={() => setShowImagesModal(false)}
      />
    </div>
  );
}
