'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { User as UserIcon, Calendar, MapPin, Clock, Search, MessageCircle, Trash2, X } from 'lucide-react';
import { useUser } from '@/contexts/UserContext';
import { postService, Post } from '@/src/services/postService';
import { ref, query, orderByChild, equalTo, get } from 'firebase/database';
import { database } from '@/config/firebase';

interface ChatMessage {
  id: string;
  towerId: string;
  message: string;
  timestamp: number;
  createdAt: string;
  username: string;
  image?: string;
}

export default function MyPostsPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useUser();
  const [userPosts, setUserPosts] = useState<Post[]>([]);
  const [userChats, setUserChats] = useState<ChatMessage[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [loadingChats, setLoadingChats] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest'>('newest');
  const [activeTab, setActiveTab] = useState<'posts' | 'chats' | 'all'>('all');

  useEffect(() => {
    // Redirect to signup if not authenticated
    if (!authLoading && !isAuthenticated) {
      router.push('/signup');
      return;
    }

    // Load user's posts and chats
    if (isAuthenticated && user) {
      // Load posts and chats independently (don't await)
      loadUserPosts();
      // Add a small delay before loading chats to prioritize posts
      setTimeout(() => {
        loadUserChats();
      }, 100);
    }
  }, [authLoading, isAuthenticated, router, user]);

  // Keyboard shortcut for search (Ctrl+K or Cmd+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        document.getElementById('search-input')?.focus();
      }
      // Escape to clear search
      if (e.key === 'Escape' && searchQuery) {
        setSearchQuery('');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [searchQuery]);

  const loadUserPosts = async () => {
    try {
      setLoadingPosts(true);
      
      if (!user?.firebaseUid) {
        console.error('User ID not available');
        setLoadingPosts(false);
        return;
      }

      // Fetch user's posts directly using the dedicated endpoint
      const myPosts = await postService.getUserPosts(user.firebaseUid);
      setUserPosts(myPosts);
    } catch (error) {
      console.error('Failed to load user posts:', error);
      setUserPosts([]);
    } finally {
      setLoadingPosts(false);
    }
  };

  const loadUserChats = async () => {
    try {
      setLoadingChats(true);
      
      if (!user?.firebaseUid || !database) {
        console.error('User ID or database not available');
        setLoadingChats(false);
        return;
      }

      console.log('Loading user chats...');
      const allMessages: ChatMessage[] = [];
      
      // Get all towers first
      const towersResponse = await postService.getTowers();
      const towers = towersResponse.data || [];
      console.log(`Found ${towers.length} towers to check`);
      
      // Limit to checking the most recent towers to avoid timeout
      const maxTowersToCheck = 50; // Only check first 50 towers
      const towersToCheck = towers.slice(0, maxTowersToCheck);
      
      // Use Promise.all to fetch messages in parallel (much faster)
      const messagePromises = towersToCheck.map(async (tower) => {
        try {
          if (!database) return [];
          const messagesRef = ref(database, `chats/${tower.towerId}/messages`);
          const snapshot = await get(messagesRef);
          
          const towerMessages: ChatMessage[] = [];
          if (snapshot.exists()) {
            snapshot.forEach((childSnapshot) => {
              const msg = childSnapshot.val();
              if (msg.userId === user.firebaseUid) {
                towerMessages.push({
                  id: childSnapshot.key!,
                  towerId: tower.towerId,
                  message: msg.message,
                  timestamp: msg.timestamp,
                  createdAt: msg.createdAt || new Date(msg.timestamp).toISOString(),
                  username: msg.username,
                  image: msg.image,
                });
              }
            });
          }
          return towerMessages;
        } catch (error) {
          console.error(`Error loading messages from tower ${tower.towerId}:`, error);
          return [];
        }
      });
      
      // Wait for all promises to complete
      const results = await Promise.all(messagePromises);
      
      // Flatten the results
      results.forEach(messages => {
        allMessages.push(...messages);
      });
      
      console.log(`Found ${allMessages.length} user messages`);
      setUserChats(allMessages);
    } catch (error) {
      console.error('Failed to load user chats:', error);
      setUserChats([]);
    } finally {
      setLoadingChats(false);
    }
  };

  // Delete a post
  const handleDeletePost = async (postId: string) => {
    if (!confirm('Are you sure you want to delete this post? This action cannot be undone.')) {
      return;
    }

    if (!user?.firebaseUid) {
      alert('User not authenticated');
      return;
    }

    try {
      await postService.deletePost(postId, user.firebaseUid);
      
      // Remove from local state immediately for better UX
      setUserPosts(prev => prev.filter(post => post.id !== postId));
      
      alert('Post deleted successfully!');
    } catch (error: any) {
      console.error('Error deleting post:', error);
      alert(error.message || 'Failed to delete post');
    }
  };

  // Delete a chat message
  const handleDeleteChatMessage = async (chatId: string, towerId: string) => {
    if (!confirm('Are you sure you want to delete this message? This action cannot be undone.')) {
      return;
    }

    if (!database) {
      alert('Database not initialized');
      return;
    }

    try {
      const { ref: refFunc, remove } = await import('firebase/database');
      const messageRef = refFunc(database, `chats/${towerId}/messages/${chatId}`);
      await remove(messageRef);
      
      // Remove from local state immediately for better UX
      setUserChats(prev => prev.filter(chat => chat.id !== chatId));
      
      alert('Message deleted successfully!');
    } catch (error: any) {
      console.error('Error deleting message:', error);
      alert(error.message || 'Failed to delete message');
    }
  };

  // Format the member since date
  const getMemberSince = () => {
    if (!user?.createdAt) {
      return 'Jan 2023';
    }
    try {
      const date = new Date(user.createdAt);
      return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    } catch {
      return 'Jan 2023';
    }
  };

  const formatTimeDetailed = (timestamp: string | number) => {
    try {
      let date: Date;
      
      // Handle different timestamp formats
      if (typeof timestamp === 'number') {
        // Unix timestamp in milliseconds
        date = new Date(timestamp);
      } else if (typeof timestamp === 'string') {
        // Try parsing as ISO string or timestamp
        const parsed = Date.parse(timestamp);
        if (!isNaN(parsed)) {
          date = new Date(parsed);
        } else {
          // If it's a number string, convert to number first
          const numTimestamp = parseInt(timestamp);
          if (!isNaN(numTimestamp)) {
            date = new Date(numTimestamp);
          } else {
            date = new Date();
          }
        }
      } else {
        date = new Date();
      }
      
      // Check if date is valid
      if (isNaN(date.getTime())) {
        return 'Invalid date';
      }
      
      return date.toLocaleString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    } catch (error) {
      console.error('Error formatting date:', error, timestamp);
      return 'Invalid date';
    }
  };

  // Filter and sort posts (enhanced search)
  const filteredPosts = userPosts
    .filter(post => {
      const query = searchQuery.toLowerCase();
      return (
        post.content.toLowerCase().includes(query) ||
        (post.username && post.username.toLowerCase().includes(query)) ||
        (post.towerId && post.towerId.toLowerCase().includes(query))
      );
    })
    .sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return sortBy === 'newest' ? dateB - dateA : dateA - dateB;
    });

  // Filter and sort chats (enhanced search)
  const filteredChats = userChats
    .filter(chat => {
      const query = searchQuery.toLowerCase();
      return (
        chat.message.toLowerCase().includes(query) ||
        (chat.username && chat.username.toLowerCase().includes(query)) ||
        (chat.towerId && chat.towerId.toLowerCase().includes(query))
      );
    })
    .sort((a, b) => {
      return sortBy === 'newest' ? b.timestamp - a.timestamp : a.timestamp - b.timestamp;
    });

  // Combined and filtered based on active tab
  const getDisplayItems = () => {
    if (activeTab === 'posts') return filteredPosts.map(p => ({ ...p, type: 'post' as const }));
    if (activeTab === 'chats') return filteredChats.map(c => ({ ...c, type: 'chat' as const }));
    
    // All - combine and sort
    const combined = [
      ...filteredPosts.map(p => ({ ...p, type: 'post' as const, sortTime: new Date(p.createdAt).getTime() })),
      ...filteredChats.map(c => ({ ...c, type: 'chat' as const, sortTime: c.timestamp }))
    ];
    
    return combined.sort((a, b) => sortBy === 'newest' ? b.sortTime - a.sortTime : a.sortTime - b.sortTime);
  };

  const displayItems = getDisplayItems();

  // Show loading state while checking auth
  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-gray-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />

      <div className="px-4 sm:px-6 lg:px-8 pt-20 pb-12">
        <div className="mx-auto w-full max-w-7xl">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-100">My Posts</h1>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-6 py-2 rounded-lg font-semibold transition-colors ${
                activeTab === 'all'
                  ? 'bg-cyan-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              All ({userPosts.length + userChats.length})
            </button>
            <button
              onClick={() => setActiveTab('posts')}
              className={`px-6 py-2 rounded-lg font-semibold transition-colors flex items-center gap-2 ${
                activeTab === 'posts'
                  ? 'bg-cyan-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              <MapPin className="w-4 h-4" />
              Posts ({userPosts.length})
            </button>
            <button
              onClick={() => setActiveTab('chats')}
              className={`px-6 py-2 rounded-lg font-semibold transition-colors flex items-center gap-2 ${
                activeTab === 'chats'
                  ? 'bg-cyan-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              <MessageCircle className="w-4 h-4" />
              Chats ({userChats.length})
            </button>
          </div>

          {/* Search and Filter Bar */}
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-700 rounded-xl p-4 mb-6 shadow-lg">
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
              {/* Enhanced Search */}
              <div className="relative w-full sm:flex-1 sm:max-w-2xl">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  id="search-input"
                  type="text"
                  placeholder={`Search by content, username, or tower ID...`}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-24 py-2.5 bg-black/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-12 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-700 rounded-full transition-colors"
                    title="Clear search"
                  >
                    <X className="w-4 h-4 text-gray-400" />
                  </button>
                )}
                <kbd className="absolute right-3 top-1/2 transform -translate-y-1/2 px-2 py-0.5 text-xs bg-gray-800 border border-gray-600 rounded text-gray-400 font-mono">
                  {typeof navigator !== 'undefined' && navigator.platform.includes('Mac') ? '⌘' : 'Ctrl'}+K
                </kbd>
              </div>

              {/* Sort Dropdown */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'newest' | 'oldest')}
                className="px-4 py-2 bg-black/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-cyan-500 transition-colors cursor-pointer"
              >
                <option value="newest" className="text-xs sm:text-base">Newest First</option>
                <option value="oldest" className="text-xs sm:text-base">Oldest First</option>
              </select>
            </div>
          </div>

          {/* Content Header with Search Results */}
          <div className="mb-4">
            <h2 className="text-2xl font-bold text-gray-100 mb-1">
              {activeTab === 'all' ? 'All Activity' : activeTab === 'posts' ? 'Post History' : 'Chat History'}
            </h2>
            <div className="flex items-center gap-2 text-sm">
              <p className="text-gray-400">
                Showing {displayItems.length} 
                {searchQuery && (
                  <>
                    {' '}of {activeTab === 'all' ? userPosts.length + userChats.length : activeTab === 'posts' ? userPosts.length : userChats.length}
                  </>
                )} items
                {loadingPosts && loadingChats ? ' (loading posts and chats...)' : 
                 loadingPosts ? ' (loading posts...)' : 
                 loadingChats ? ' (loading chats...)' : ''}
              </p>
              {searchQuery && (
                <span className="px-2 py-0.5 bg-cyan-600/20 border border-cyan-600/30 rounded-full text-cyan-400 text-xs font-medium">
                  Filtered by: &quot;{searchQuery}&quot;
                </span>
              )}
            </div>
          </div>

          {/* Content Grid - 3 Columns */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {(loadingPosts || loadingChats) ? (
              // Loading skeleton
              Array.from({ length: 6 }).map((_, idx) => (
                <div
                  key={idx}
                  className="bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-700 rounded-xl p-6 animate-pulse"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 bg-gray-700 rounded"></div>
                      <div className="h-4 bg-gray-700 rounded w-20"></div>
                    </div>
                    <div className="h-3 bg-gray-700 rounded w-32"></div>
                  </div>
                  <div className="space-y-2 mb-4">
                    <div className="h-3 bg-gray-700 rounded"></div>
                    <div className="h-3 bg-gray-700 rounded w-3/4"></div>
                  </div>
                  <div className="flex items-center justify-between pt-4 border-t border-gray-700">
                    <div className="h-3 bg-gray-700 rounded w-24"></div>
                    <div className="h-3 bg-gray-700 rounded w-20"></div>
                  </div>
                </div>
              ))
            ) : displayItems.length === 0 ? (
              <div className="col-span-full text-center py-12">
                <p className="text-gray-400">
                  {searchQuery ? `No ${activeTab} found matching your search` : `No ${activeTab} yet`}
                </p>
              </div>
            ) : (
              displayItems.map((item) => {
                const isPost = item.type === 'post';
                return isPost ? (
                <div
                  key={`post-${item.id}`}
                  className="bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-700 rounded-xl p-6 hover:border-cyan-500/50 transition-all duration-300 shadow-lg hover:shadow-cyan-500/20"
                >
                  {/* Post Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-2 text-cyan-400">
                      <MapPin className="w-5 h-5" />
                      <span className="font-semibold text-sm">
                        Post
                      </span>
                    </div>
                    <div className="flex flex-col items-end text-gray-400 text-xs">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        <span>{formatTimeDetailed(item.createdAt).split(',')[0]}</span>
                      </div>
                      <div className="flex items-center gap-1 mt-0.5">
                        <Clock className="w-3 h-3" />
                        <span>{formatTimeDetailed(item.createdAt).split(',')[1]?.trim()}</span>
                      </div>
                    </div>
                  </div>

                  {/* Post Content */}
                  <p className="text-gray-200 leading-relaxed mb-4 line-clamp-3">
                    {item.content}
                  </p>

                  {/* Post Footer */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-700">
                    <div className="text-gray-400 text-xs">
                      {formatTimeDetailed(item.createdAt)}
                    </div>
                    <button
                      onClick={() => handleDeletePost(item.id)}
                      className="flex items-center gap-1 px-3 py-1.5 text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded-lg transition-colors text-xs"
                      title="Delete this post"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  key={`chat-${item.id}`}
                  className="bg-gradient-to-br from-blue-900/20 to-gray-800 border border-blue-700/50 rounded-xl p-6 hover:border-blue-500/50 transition-all duration-300 shadow-lg hover:shadow-blue-500/20"
                >
                  {/* Chat Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-2 text-blue-400">
                      <MessageCircle className="w-5 h-5" />
                      <span className="font-semibold text-sm">
                        Chat in Tower {item.towerId}
                      </span>
                    </div>
                    <div className="flex flex-col items-end text-gray-400 text-xs">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        <span>{formatTimeDetailed(item.timestamp).split(',')[0]}</span>
                      </div>
                      <div className="flex items-center gap-1 mt-0.5">
                        <Clock className="w-3 h-3" />
                        <span>{formatTimeDetailed(item.timestamp).split(',')[1]?.trim()}</span>
                      </div>
                    </div>
                  </div>

                  {/* Chat Content */}
                  {item.image && (
                    <img 
                      src={item.image} 
                      alt="Chat attachment" 
                      className="w-full h-32 object-cover rounded-lg mb-3"
                    />
                  )}
                  <p className="text-gray-200 leading-relaxed mb-4 line-clamp-3">
                    {item.message}
                  </p>

                  {/* Chat Footer */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-700">
                    <div className="text-gray-400 text-xs">
                      {formatTimeDetailed(item.timestamp)}
                    </div>
                    <button
                      onClick={() => handleDeleteChatMessage(item.id, item.towerId)}
                      className="flex items-center gap-1 px-3 py-1.5 text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded-lg transition-colors text-xs"
                      title="Delete this message"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              );
              })
            )}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
