import React, { useState, useEffect, useMemo } from 'react';
import PullToRefresh from 'react-pull-to-refresh';
import { getSupabase } from './services/supabaseClient';
import { GoogleGenAI, Type } from "@google/genai";
import { 
  Home, Search, PlusSquare, Heart, MessageCircle, User, 
  Settings, Bookmark, Archive, Activity, Bell, Lock, Globe, 
  Shield, LogOut, MoreHorizontal, Send, Share2, Trash2,
  Image as ImageIcon, Video as VideoIcon, ChevronLeft, ChevronRight,
  Check, X, Grid, List, Play, CheckCircle, Edit2, Flag,
  Key, Smartphone, Star, Moon, Sparkles, DollarSign, HelpCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { User as UserType, Post as PostType, Comment as CommentType, Story as StoryType, Message as MessageType } from './types';

// --- Components ---

const Navbar = ({ activeTab, setActiveTab, user, unreadCount }: { activeTab: string, setActiveTab: (t: string) => void, user: UserType | null, unreadCount: number }) => {
  const tabs = [
    { id: 'home', icon: Home, label: 'Home' },
    { id: 'search', icon: Search, label: 'Search' },
    { id: 'create', icon: PlusSquare, label: 'Create' },
    { id: 'notifications', icon: Bell, label: 'Activity', badge: unreadCount },
    { id: 'messages', icon: MessageCircle, label: 'Messages' },
    { id: 'profile', icon: User, label: 'Profile' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-zinc-900 border-t border-gray-100 dark:border-zinc-800 px-4 py-2 flex justify-around items-center z-50 md:top-0 md:bottom-auto md:flex-col md:w-20 md:h-screen md:border-r md:border-t-0">
      <div className="hidden md:flex mb-8 mt-4">
        <div className="w-10 h-10 bg-black rounded-lg flex items-center justify-center text-white font-bold text-xl">D</div>
      </div>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => setActiveTab(tab.id)}
          className={`p-2 rounded-xl transition-colors relative flex flex-col items-center justify-center w-full md:w-auto ${activeTab === tab.id ? 'text-brand bg-brand/5' : 'text-gray-500 hover:bg-gray-50'}`}
        >
          <tab.icon size={24} strokeWidth={activeTab === tab.id ? 2.5 : 2} />
          {tab.badge > 0 && (
            <div className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white" />
          )}
          <span className="hidden md:block text-[10px] mt-1 font-medium text-center">{tab.label}</span>
        </button>
      ))}
      <div className="hidden md:flex mt-auto mb-4 flex-col gap-4 items-center w-full">
        {user?.is_admin === 1 && (
          <button onClick={() => setActiveTab('admin')} className="p-2 text-gray-500 hover:bg-gray-50 rounded-xl flex flex-col items-center justify-center w-full md:w-auto">
            <Shield size={24} />
          </button>
        )}
        <button onClick={() => setActiveTab('settings')} className="p-2 text-gray-500 hover:bg-gray-50 rounded-xl flex flex-col items-center justify-center w-full md:w-auto">
          <Settings size={24} />
        </button>
      </div>
    </nav>
  );
};

const Post = ({ post, onLike, onSave, onComment, onArchive, onEdit, onDelete, onHashtagClick, onProfileClick, isOwner }: { post: PostType, onLike: (id: number) => void, onSave: (id: number) => void, onComment: (id: number) => void, onArchive?: (id: number) => void, onEdit?: (id: number, updates: any) => void, onDelete?: (id: number) => void, onHashtagClick?: (tag: string) => void, onProfileClick?: (username: string) => void, isOwner?: boolean, key?: any }) => {
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<CommentType[]>([]);
  const [newComment, setNewComment] = useState('');
  const [showMenu, setShowMenu] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editCaption, setEditCaption] = useState(post.caption);
  const [editUrl, setEditUrl] = useState(post.content_url);
  const [editType, setEditType] = useState(post.content_type);
  const [isReported, setIsReported] = useState(false);

  const fetchComments = async () => {
    const res = await fetch(`/api/posts/${post.id}/comments`);
    const data = await res.json();
    setComments(data);
  };

  useEffect(() => {
    if (showComments) fetchComments();
  }, [showComments]);

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    await fetch(`/api/posts/${post.id}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: newComment })
    });
    setNewComment('');
    fetchComments();
  };

  const handleSaveEdit = async () => {
    if (onEdit) {
      await onEdit(post.id, { caption: editCaption, content_url: editUrl, content_type: editType });
    }
    setIsEditing(false);
  };

  const handleReport = async () => {
    try {
      await fetch(`/api/posts/${post.id}/report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: 'Inappropriate content' })
      });
      setIsReported(true);
      setShowMenu(false);
    } catch (err) {
      console.error('Failed to report post', err);
    }
  };

  const renderCaption = (caption: string) => {
    if (!caption) return null;
    const parts = caption.split(/(#\w+)/g);
    return parts.map((part, i) => {
      if (part.startsWith('#') && onHashtagClick) {
        return (
          <button 
            key={i} 
            onClick={() => onHashtagClick(part)}
            className="text-brand font-bold hover:underline"
          >
            {part}
          </button>
        );
      }
      return <span key={i}>{part}</span>;
    });
  };

  return (
    <div className="bg-white dark:bg-zinc-800 border border-gray-100 dark:border-zinc-700 rounded-2xl overflow-hidden mb-6 shadow-sm">
      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => onProfileClick && onProfileClick(post.username)} className="flex items-center gap-3 text-left group">
            <img src={post.avatar_url} className="w-10 h-10 rounded-full object-cover border border-gray-100 group-hover:border-brand transition-colors" referrerPolicy="no-referrer" />
            <div>
              <p className="font-semibold text-sm flex items-center gap-1 dark:text-white group-hover:text-brand transition-colors">
                {post.username}
                {post.is_verified === 1 && <CheckCircle size={14} className="text-blue-500" fill="currentColor" stroke="white" />}
              </p>
              <p className="text-xs text-gray-500 dark:text-zinc-400">{new Date(post.created_at).toLocaleDateString()}</p>
            </div>
          </button>
        </div>
        <div className="relative">
          <button onClick={() => setShowMenu(!showMenu)} className="text-gray-400 p-1 hover:bg-gray-50 dark:hover:bg-zinc-700 rounded-lg transition-colors">
            <MoreHorizontal size={20} />
          </button>
          
          <AnimatePresence>
            {showMenu && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 10 }}
                  className="absolute right-0 mt-2 w-48 bg-white dark:bg-zinc-800 rounded-2xl shadow-xl border border-gray-100 dark:border-zinc-700 z-20 overflow-hidden"
                >
                  {isOwner && onArchive && (
                    <button 
                      onClick={() => { onArchive(post.id); setShowMenu(false); }}
                      className="w-full flex items-center gap-3 p-4 hover:bg-gray-50 dark:hover:bg-zinc-700 transition-colors text-sm font-medium text-gray-700 dark:text-zinc-300"
                    >
                      <Archive size={18} /> {post.is_archived ? 'Unarchive' : 'Archive'}
                    </button>
                  )}
                  {isOwner && onEdit && (
                    <button 
                      onClick={() => { setIsEditing(true); setShowMenu(false); }}
                      className="w-full flex items-center gap-3 p-4 hover:bg-gray-50 dark:hover:bg-zinc-700 transition-colors text-sm font-medium text-gray-700 dark:text-zinc-300 border-t border-gray-50 dark:border-zinc-700"
                    >
                      <Edit2 size={18} /> Edit Post
                    </button>
                  )}
                  {isOwner ? (
                    <button 
                      onClick={() => { if(onDelete) onDelete(post.id); setShowMenu(false); }}
                      className="w-full flex items-center gap-3 p-4 hover:bg-gray-50 dark:hover:bg-zinc-700 transition-colors text-sm font-medium text-red-500 border-t border-gray-50 dark:border-zinc-700"
                    >
                      <Trash2 size={18} /> Delete
                    </button>
                  ) : (
                    <button 
                      onClick={handleReport}
                      disabled={isReported}
                      className={`w-full flex items-center gap-3 p-4 transition-colors text-sm font-medium border-t border-gray-50 ${isReported ? 'text-gray-400 bg-gray-50 cursor-not-allowed' : 'text-red-500 hover:bg-gray-50'}`}
                    >
                      <Flag size={18} /> {isReported ? 'Reported' : 'Report Post'}
                    </button>
                  )}
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>
      
      <div className="relative aspect-square bg-gray-50 group">
        {isEditing ? (
          <div className="absolute inset-0 p-4 bg-white z-10 flex flex-col gap-4">
            <h3 className="font-bold text-lg">Edit Post</h3>
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 uppercase">Image/Video URL</label>
              <input 
                type="text" 
                value={editUrl}
                onChange={e => setEditUrl(e.target.value)}
                className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl text-sm"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 uppercase">Content Type</label>
              <div className="flex gap-2">
                <button 
                  onClick={() => setEditType('image')}
                  className={`flex-1 py-2 rounded-xl text-sm font-bold transition-colors ${editType === 'image' ? 'bg-brand text-white' : 'bg-gray-100 text-gray-600'}`}
                >
                  Image
                </button>
                <button 
                  onClick={() => setEditType('video')}
                  className={`flex-1 py-2 rounded-xl text-sm font-bold transition-colors ${editType === 'video' ? 'bg-brand text-white' : 'bg-gray-100 text-gray-600'}`}
                >
                  Video
                </button>
              </div>
            </div>
            <div className="space-y-2 flex-1">
              <label className="text-xs font-bold text-gray-400 uppercase">Caption</label>
              <textarea 
                value={editCaption}
                onChange={e => setEditCaption(e.target.value)}
                className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl text-sm resize-none h-24"
              />
            </div>
            <div className="flex gap-2 mt-auto">
              <button onClick={() => setIsEditing(false)} className="flex-1 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl">Cancel</button>
              <button onClick={handleSaveEdit} className="flex-1 py-3 bg-brand text-white font-bold rounded-xl">Save Changes</button>
            </div>
          </div>
        ) : post.content_type === 'video' ? (
          <video src={post.content_url} className="w-full h-full object-cover" controls />
        ) : (
          <img src={post.content_url} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
        )}
      </div>

      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <button onClick={() => onLike(post.id)} className={`transition-transform active:scale-125 ${post.is_liked ? 'text-brand' : 'text-gray-700'}`}>
              <Heart size={24} fill={post.is_liked ? 'currentColor' : 'none'} />
            </button>
            <button onClick={() => setShowComments(!showComments)} className="text-gray-700">
              <MessageCircle size={24} />
            </button>
            <button className="text-gray-700"><Share2 size={24} /></button>
          </div>
          <button onClick={() => onSave(post.id)} className={post.is_saved ? 'text-black' : 'text-gray-700'}>
            <Bookmark size={24} fill={post.is_saved ? 'currentColor' : 'none'} />
          </button>
        </div>
        
        <p className="font-bold text-sm mb-1">{post.likes_count} likes</p>
        <p className="text-sm">
          <span className="font-bold mr-2 inline-flex items-center gap-1">
            {post.username}
            {post.is_verified === 1 && <CheckCircle size={14} className="text-blue-500" fill="currentColor" stroke="white" />}
          </span>
          {renderCaption(post.caption)}
        </p>
        
        <button 
          onClick={() => setShowComments(!showComments)}
          className="text-gray-400 text-sm mt-2"
        >
          {showComments ? 'Hide comments' : 'View all comments'}
        </button>

        <AnimatePresence>
          {showComments && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mt-4 space-y-3 overflow-hidden"
            >
              {comments.map(comment => (
                <div key={comment.id} className="flex gap-2 text-sm">
                  <span className="font-bold inline-flex items-center gap-1">
                    {comment.username}
                    {comment.is_verified === 1 && <CheckCircle size={12} className="text-blue-500" fill="currentColor" stroke="white" />}
                  </span>
                  <span className="flex-1">{comment.text}</span>
                </div>
              ))}
              <form onSubmit={handleAddComment} className="flex gap-2 mt-4">
                <input 
                  type="text" 
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Add a comment..." 
                  className="flex-1 text-sm border-none focus:ring-0 p-0"
                />
                <button type="submit" className="text-brand font-semibold text-sm">Post</button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

const StoryCircle = ({ story, onClick }: { story: StoryType, onClick: () => void, key?: any }) => (
  <button onClick={onClick} className="flex flex-col items-center gap-1 shrink-0">
    <div className="p-0.5 rounded-full bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-600">
      <div className="p-0.5 bg-white rounded-full">
        <img src={story.avatar_url} className="w-16 h-16 rounded-full object-cover" referrerPolicy="no-referrer" />
      </div>
    </div>
    <span className="text-[10px] font-medium truncate w-16 text-center">{story.username}</span>
  </button>
);

const ProfileView = ({ username, currentUser, onNavigate }: { username: string, currentUser: UserType | null, onNavigate: (tab: string, profile?: string | null, query?: string) => void }) => {
  const [user, setUser] = useState<UserType | null>(null);
  const [posts, setPosts] = useState<PostType[]>([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch(`/api/users/${username}`).then(res => res.json()).then(data => {
      setUser(data);
      if (data.is_following !== undefined) {
        setIsFollowing(data.is_following);
      }
    });
    fetch(`/api/posts`).then(res => res.json()).then(data => setPosts(data.filter((p: any) => p.username === username)));
  }, [username, currentUser]);

  const handleFollow = async () => {
    if (!user) return;
    const res = await fetch(`/api/users/${user.id}/follow`, { method: 'POST' });
    const data = await res.json();
    setIsFollowing(data.following);
  };

  const handleCopyLink = () => {
    if (!user) return;
    const url = `${window.location.origin}/profile/${user.username}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    if (!user) return;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `DicTok - ${user.full_name}`,
          text: `Check out ${user.username}'s profile on DicTok!`,
          url: `${window.location.origin}/profile/${user.username}`,
        });
      } catch (err) {
        setShowShareMenu(true);
      }
    } else {
      setShowShareMenu(true);
    }
  };

  if (!user) return <div className="p-8 text-center">Loading...</div>;

  return (
    <div className="max-w-2xl mx-auto pb-24 relative bg-white dark:bg-zinc-900 min-h-screen">
      {/* Banner */}
      <div className="h-32 md:h-48 bg-gray-100 relative overflow-hidden">
        <img 
          src={user.banner_url || `https://picsum.photos/seed/${user.username}-banner/1200/400`} 
          className="w-full h-full object-cover" 
          referrerPolicy="no-referrer" 
        />
      </div>

      <div className="px-4 -mt-10 relative z-10">
        <div className="flex items-end justify-between mb-4">
          <div className="relative">
            <img src={user.avatar_url} className="w-20 h-20 md:w-24 md:h-24 rounded-full object-cover border-4 border-white dark:border-zinc-900 shadow-md" referrerPolicy="no-referrer" />
          </div>
          <div className="flex gap-2 pb-1">
            {currentUser?.username === user.username ? (
              <button 
                onClick={() => onNavigate('edit_profile')}
                className="px-5 py-2 bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 rounded-full text-xs font-bold transition-all dark:text-white border border-transparent hover:border-gray-300 dark:hover:border-zinc-600"
              >
                Edit Profile
              </button>
            ) : (
              <>
                <button 
                  onClick={() => onNavigate('messages', user.username)}
                  className="px-6 py-2 rounded-full text-xs font-bold transition-all bg-gray-100 dark:bg-zinc-800 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-zinc-700"
                >
                  Message
                </button>
                <button 
                  onClick={handleFollow}
                  className={`px-6 py-2 rounded-full text-xs font-bold transition-all ${isFollowing ? 'bg-gray-100 dark:bg-zinc-800 text-gray-900 dark:text-white' : 'bg-brand text-white shadow-lg shadow-brand/20'}`}
                >
                  {isFollowing ? 'Following' : 'Follow'}
                </button>
              </>
            )}
            <button 
              onClick={handleShare}
              className="p-2 bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 rounded-full transition-colors dark:text-white border border-transparent hover:border-gray-300 dark:hover:border-zinc-600"
            >
              <Share2 size={16} />
            </button>
          </div>
        </div>

        <div className="mb-6">
          <div className="flex items-center gap-2 mb-0.5">
            <h2 className="text-lg font-black tracking-tight flex items-center gap-1 dark:text-white">
              {user.username}
              {user.is_verified === 1 && <CheckCircle size={16} className="text-blue-500" fill="currentColor" stroke="white" />}
            </h2>
            {user.pronouns && <span className="text-[9px] font-bold text-gray-400 bg-gray-100 dark:bg-zinc-800 px-2 py-0.5 rounded-full uppercase tracking-tighter">{user.pronouns}</span>}
          </div>
          <p className="text-xs font-bold text-gray-400 dark:text-zinc-500 mb-2">@{user.username}</p>
          <p className="text-sm font-medium text-gray-900 dark:text-white leading-tight">{user.full_name}</p>
          <p className="text-sm text-gray-600 dark:text-zinc-400 whitespace-pre-wrap mt-2 leading-relaxed">{user.bio}</p>
          
          {user.link && (
            <a 
              href={user.link.startsWith('http') ? user.link : `https://${user.link}`} 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs font-bold text-brand mt-3 hover:underline"
            >
              <Globe size={12} /> {user.link.replace(/^https?:\/\//, '')}
            </a>
          )}
        </div>

        <div className="flex items-center justify-around py-4 border-y border-gray-50 dark:border-zinc-800 mb-6 bg-gray-50/50 dark:bg-zinc-800/30 rounded-2xl px-2">
          <div className="text-center">
            <p className="text-base font-black dark:text-white">{posts.length}</p>
            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Posts</p>
          </div>
          <div className="w-px h-8 bg-gray-200 dark:bg-zinc-700" />
          <div className="text-center">
            <p className="text-base font-black dark:text-white">{user.followers || 0}</p>
            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Followers</p>
          </div>
          <div className="w-px h-8 bg-gray-200 dark:bg-zinc-700" />
          <div className="text-center">
            <p className="text-base font-black dark:text-white">{user.following || 0}</p>
            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Following</p>
          </div>
        </div>
        <div className="flex justify-center gap-12 mb-6 border-b border-gray-50 dark:border-zinc-800">
          <button className="flex items-center gap-2 text-[10px] font-black tracking-[0.2em] border-b-2 border-black dark:border-white pb-3 transition-all">POSTS</button>
          <button className="flex items-center gap-2 text-[10px] font-black tracking-[0.2em] text-gray-300 dark:text-zinc-600 pb-3 hover:text-gray-500 transition-all">LIKED</button>
        </div>

        <div className="grid grid-cols-3 gap-1">
          {posts.map(post => (
            <div key={post.id} className="aspect-[3/4] bg-gray-100 relative group cursor-pointer overflow-hidden rounded-sm">
              <img src={post.content_url} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" referrerPolicy="no-referrer" />
              <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white gap-4">
                <span className="flex items-center gap-1 font-bold"><Heart size={18} fill="white" /> {post.likes_count}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {showShareMenu && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowShareMenu(false)}
              className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, y: 100 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 100 }}
              className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-2xl z-50 overflow-hidden pb-8"
            >
              <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto my-4" />
              <h3 className="text-center font-bold mb-4">Share Profile</h3>
              <div className="grid grid-cols-4 gap-4 p-4">
                <button onClick={handleCopyLink} className="flex flex-col items-center gap-2">
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                    {copied ? <Check className="text-green-500" /> : <List />}
                  </div>
                  <span className="text-[10px] font-bold">Copy Link</span>
                </button>
                <a 
                  href={`https://wa.me/?text=Check out ${user.username}'s profile on DicTok! ${window.location.origin}/profile/${user.username}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-col items-center gap-2"
                >
                  <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
                    <MessageCircle />
                  </div>
                  <span className="text-[10px] font-bold">WhatsApp</span>
                </a>
                <a 
                  href={`https://twitter.com/intent/tweet?text=Check out ${user.username}'s profile on DicTok!&url=${window.location.origin}/profile/${user.username}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-col items-center gap-2"
                >
                  <div className="w-12 h-12 bg-blue-100 text-blue-500 rounded-full flex items-center justify-center">
                    <Share2 />
                  </div>
                  <span className="text-[10px] font-bold">Twitter</span>
                </a>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

const EditProfileView = ({ user, onUpdate, onBack }: { user: UserType | null, onUpdate: () => void, onBack: () => void }) => {
  const [formData, setFormData] = useState({
    full_name: user?.full_name || '',
    username: user?.username || '',
    pronouns: user?.pronouns || '',
    bio: user?.bio || '',
    link: user?.link || '',
    gender: user?.gender || 'Prefer not to say',
    avatar_url: user?.avatar_url || '',
    banner_url: user?.banner_url || ''
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        full_name: user.full_name || '',
        username: user.username || '',
        pronouns: user.pronouns || '',
        bio: user.bio || '',
        link: user.link || '',
        gender: user.gender || 'Prefer not to say',
        avatar_url: user.avatar_url || '',
        banner_url: user.banner_url || ''
      });
    }
  }, [user]);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setLoading(true);
    try {
      await fetch('/api/users/me', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      onUpdate();
      onBack();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, field: 'avatar_url' | 'banner_url') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, [field]: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const genders = ['Male', 'Female', 'Prefer not to say', 'Other'];

  return (
    <div className="max-w-xl mx-auto p-4 pb-24">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Edit Profile</h2>
        <button 
          onClick={() => handleSubmit()}
          disabled={loading}
          className="text-brand font-bold disabled:opacity-50"
        >
          {loading ? 'Saving...' : 'Done'}
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="relative mb-12">
          <label className="h-32 bg-gray-200 rounded-3xl overflow-hidden relative group cursor-pointer block">
            <input 
              type="file" 
              accept="image/*" 
              className="hidden" 
              onChange={(e) => handleImageUpload(e, 'banner_url')}
            />
            <img 
              src={formData.banner_url || 'https://picsum.photos/seed/banner/800/200'} 
              className="w-full h-full object-cover" 
              referrerPolicy="no-referrer" 
            />
            <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <ImageIcon className="text-white mb-1" size={24} />
              <span className="text-white text-xs font-bold">Change Banner</span>
            </div>
          </label>
          <label className="absolute -bottom-10 left-6 group cursor-pointer block">
            <input 
              type="file" 
              accept="image/*" 
              className="hidden" 
              onChange={(e) => handleImageUpload(e, 'avatar_url')}
            />
            <div className="w-24 h-24 rounded-full border-4 border-white overflow-hidden bg-gray-100 relative shadow-md">
              <img 
                src={formData.avatar_url} 
                className="w-full h-full object-cover" 
                referrerPolicy="no-referrer" 
              />
              <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <ImageIcon className="text-white mb-1" size={20} />
                <span className="text-white text-[10px] font-bold">Change</span>
              </div>
            </div>
          </label>
        </div>

        <div className="space-y-4 pt-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-400 uppercase px-1">Name</label>
            <input 
              type="text" 
              value={formData.full_name}
              onChange={(e) => setFormData({...formData, full_name: e.target.value})}
              className="w-full p-4 bg-white border border-gray-100 rounded-2xl focus:ring-2 focus:ring-brand"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-400 uppercase px-1">Username</label>
            <input 
              type="text" 
              value={formData.username}
              onChange={(e) => setFormData({...formData, username: e.target.value})}
              className="w-full p-4 bg-white border border-gray-100 rounded-2xl focus:ring-2 focus:ring-brand"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-400 uppercase px-1">Pronouns</label>
            <input 
              type="text" 
              value={formData.pronouns}
              onChange={(e) => setFormData({...formData, pronouns: e.target.value})}
              placeholder="e.g. they/them"
              className="w-full p-4 bg-white border border-gray-100 rounded-2xl focus:ring-2 focus:ring-brand"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-400 uppercase px-1">Bio</label>
            <textarea 
              value={formData.bio}
              onChange={(e) => setFormData({...formData, bio: e.target.value})}
              rows={3}
              className="w-full p-4 bg-white border border-gray-100 rounded-2xl focus:ring-2 focus:ring-brand resize-none"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-400 uppercase px-1">Link</label>
            <input 
              type="text" 
              value={formData.link}
              onChange={(e) => setFormData({...formData, link: e.target.value})}
              placeholder="https://yourlink.com"
              className="w-full p-4 bg-white border border-gray-100 rounded-2xl focus:ring-2 focus:ring-brand"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-400 uppercase px-1">Gender</label>
            <div className="grid grid-cols-2 gap-2">
              {genders.map(g => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setFormData({...formData, gender: g})}
                  className={`p-3 rounded-xl text-sm font-medium border transition-all ${formData.gender === g ? 'bg-brand border-brand text-white' : 'bg-white border-gray-100 text-gray-600 hover:border-gray-200'}`}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

const SettingsView = ({ user, onUpdate, onNavigate, darkMode, toggleDarkMode, onLogout, currency, setCurrency, lang, setLang }: { user: UserType | null, onUpdate: () => void, onNavigate: (tab: string) => void, darkMode: boolean, toggleDarkMode: () => void, onLogout: () => void, currency: string, setCurrency: (c: string) => void, lang: string, setLang: (l: string) => void }) => {
  const [isPrivate, setIsPrivate] = useState(user?.is_private === 1);
  const [notifs, setNotifs] = useState(user?.notifications_enabled === 1);
  const [twoFactor, setTwoFactor] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [registerSuccess, setRegisterSuccess] = useState(false);

  const update = async (fields: any) => {
    await fetch('/api/users/me', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(fields)
    });
    onUpdate();
  };

  const sections = [
    {
      title: 'Account Center',
      items: [
        { icon: Lock, label: 'Password & Security', action: () => onNavigate('password_security') },
        { icon: Shield, label: 'Two-Factor Authentication', toggle: true, value: twoFactor, action: () => setTwoFactor(!twoFactor) },
        { icon: Key, label: 'Saved Login Info', action: () => onNavigate('saved_login') },
        { icon: Smartphone, label: 'Logged-in Devices', action: () => onNavigate('logged_in_devices') },
        { icon: Star, label: 'Subscription ($18 / 6 mo)', action: () => onNavigate('subscription') },
      ]
    },
    {
      title: 'Account',
      items: [
        { icon: User, label: 'Edit Profile', action: () => onNavigate('edit_profile') },
        { icon: Bookmark, label: 'Saved', action: () => onNavigate('saved') },
        { icon: Archive, label: 'Archive', action: () => onNavigate('archive') },
        { icon: Activity, label: 'Your Activity', action: () => {} },
      ]
    },
    {
      title: 'Privacy & Security',
      items: [
        { 
          icon: Lock, 
          label: 'Private Account', 
          toggle: true, 
          value: isPrivate, 
          action: () => { setIsPrivate(!isPrivate); update({ is_private: !isPrivate ? 1 : 0 }); } 
        },
        { 
          icon: Bell, 
          label: 'Notifications', 
          toggle: true, 
          value: notifs, 
          action: () => { setNotifs(!notifs); update({ notifications_enabled: !notifs ? 1 : 0 }); } 
        },
        { icon: Shield, label: 'Blocked Users', action: () => {} },
      ]
    },
    {
      title: 'Preferences',
      items: [
        { 
          icon: Globe, 
          label: 'Language', 
          value: lang === 'en' ? 'English' : 'Srpski', 
          action: () => { const n = lang === 'en' ? 'sr' : 'en'; setLang(n); update({ language: n }); } 
        },
        { 
          icon: DollarSign, 
          label: 'Currency', 
          value: currency, 
          action: () => { 
            const currencies = ['EUR', 'USD', 'RSD'];
            const next = currencies[(currencies.indexOf(currency) + 1) % currencies.length];
            setCurrency(next);
          } 
        },
        { 
          icon: Moon, 
          label: 'Dark Mode', 
          toggle: true, 
          value: darkMode, 
          action: toggleDarkMode 
        },
      ]
    },
    {
      title: 'Legal & Support',
      items: [
        { icon: HelpCircle, label: 'Help Center & FAQ', action: () => onNavigate('help') },
        { icon: Shield, label: 'Terms of Service', action: () => onNavigate('tos') },
        { icon: Lock, label: 'Privacy Policy', action: () => onNavigate('privacy') },
        { icon: Flag, label: 'DMCA / Content Removal', action: () => onNavigate('dmca') },
      ]
    }
  ];

  const handleRegisterDemo = async () => {
    setIsRegistering(true);
    try {
      const randomId = Math.floor(Math.random() * 1000);
      const username = `user_${randomId}`;
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username,
          full_name: `Demo User ${randomId}`,
          bio: 'I just joined DicTok!'
        })
      });
      const data = await res.json();
      if (data.success) {
        setRegisterSuccess(true);
        setTimeout(() => setRegisterSuccess(false), 3000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsRegistering(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto p-4 pb-24">
      <h2 className="text-2xl font-bold mb-6">Settings</h2>
      <div className="space-y-8">
        {/* ... existing sections ... */}
        {sections.map((section, idx) => (
          <div key={idx} className="space-y-3">
            <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-4">{section.title}</h3>
            <div className="bg-white dark:bg-zinc-800 rounded-3xl overflow-hidden border border-gray-50 dark:border-zinc-700 shadow-sm">
              {section.items.map((item, i) => (
                <button 
                  key={i} 
                  onClick={item.action}
                  className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-zinc-700/50 transition-colors border-b border-gray-50 last:border-0 dark:border-zinc-700"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gray-50 dark:bg-zinc-700 rounded-xl flex items-center justify-center text-gray-500 dark:text-zinc-400">
                      <item.icon size={18} />
                    </div>
                    <span className="text-sm font-bold dark:text-white">{item.label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {item.value && <span className="text-xs font-bold text-gray-400">{item.value}</span>}
                    {item.toggle ? (
                      <div className={`w-10 h-5 rounded-full relative transition-colors ${item.value ? 'bg-brand' : 'bg-gray-200 dark:bg-zinc-600'}`}>
                        <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${item.value ? 'left-6' : 'left-1'}`} />
                      </div>
                    ) : (
                      <ChevronRight size={16} className="text-gray-300" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        ))}

        <div className="bg-gradient-to-br from-brand/20 to-brand/5 p-6 rounded-3xl border border-brand/20 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-brand text-white rounded-2xl flex items-center justify-center shadow-lg shadow-brand/20">
              <Bell size={20} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900">Demo: Test Welcome Message</h3>
              <p className="text-[11px] text-gray-500">Verify automated admin messages</p>
            </div>
          </div>
          <p className="text-xs text-gray-600 mb-5 leading-relaxed">
            Clicking this will create a new account and trigger an automated welcome message from the Admin.
          </p>
          <button 
            onClick={handleRegisterDemo}
            disabled={isRegistering || registerSuccess}
            className={`w-full py-4 rounded-2xl font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-lg ${
              registerSuccess 
                ? 'bg-green-500 text-white shadow-green-500/20' 
                : 'bg-brand text-white shadow-brand/20 hover:scale-[1.02] active:scale-[0.98]'
            }`}
          >
            {isRegistering ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : registerSuccess ? (
              <><Check size={18} /> Account Created!</>
            ) : (
              'Register Demo User'
            )}
          </button>
        </div>

        <div className="text-center pt-8 pb-4">
          <p className="text-[10px] font-bold text-gray-300 uppercase tracking-[0.3em]">Made with ❤️ by <a href="https://brendi.rs" target="_blank" rel="noopener noreferrer" className="text-brand hover:underline">brendi.rs</a></p>
        </div>

        <button onClick={onLogout} className="w-full p-5 text-red-500 font-bold flex items-center justify-center gap-3 bg-red-50 rounded-3xl hover:bg-red-100 transition-colors">
          <LogOut size={20} /> Log Out
        </button>
      </div>
    </div>
  );
};

const SavedView = ({ onLike, onSave, onEdit, onDelete, onHashtagClick, onProfileClick }: { onLike: (id: number) => void, onSave: (id: number) => void, onEdit: (id: number, updates: any) => void, onDelete: (id: number) => void, onHashtagClick?: (tag: string) => void, onProfileClick?: (username: string) => void }) => {
  const [posts, setPosts] = useState<PostType[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSaved = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/users/me/saved');
      const data = await res.json();
      if (Array.isArray(data)) {
        setPosts(data);
      } else {
        console.error('Failed to fetch saved posts:', data);
        setPosts([]);
      }
    } catch (err) {
      console.error('Error fetching saved posts:', err);
      setPosts([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchSaved();
  }, []);

  return (
    <div className="max-w-xl mx-auto p-4 pb-24">
      <h2 className="text-2xl font-bold mb-6">Saved</h2>
      {loading ? (
        <div className="text-center p-8">Loading...</div>
      ) : posts.length === 0 ? (
        <div className="text-center p-12 bg-white rounded-2xl border border-gray-100">
          <Bookmark size={48} className="mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500">No saved posts yet.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {posts.map(post => (
            <Post 
              key={post.id} 
              post={post} 
              onLike={onLike} 
              onSave={async (id) => {
                await onSave(id);
                fetchSaved();
              }} 
              onComment={() => {}} 
              onEdit={async (id, updates) => {
                await onEdit(id, updates);
                fetchSaved();
              }}
              onDelete={async (id) => {
                await onDelete(id);
                fetchSaved();
              }}
              onHashtagClick={onHashtagClick}
              onProfileClick={onProfileClick}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const ArchivedView = ({ onArchive, onLike, onSave, onEdit, onDelete, onHashtagClick, onProfileClick }: { onArchive: (id: number) => void, onLike: (id: number) => void, onSave: (id: number) => void, onEdit: (id: number, updates: any) => void, onDelete: (id: number) => void, onHashtagClick?: (tag: string) => void, onProfileClick?: (username: string) => void }) => {
  const [posts, setPosts] = useState<PostType[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchArchived = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/users/me/archived');
      const data = await res.json();
      if (Array.isArray(data)) {
        setPosts(data);
      } else {
        console.error('Failed to fetch archived posts:', data);
        setPosts([]);
      }
    } catch (err) {
      console.error('Error fetching archived posts:', err);
      setPosts([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchArchived();
  }, []);

  return (
    <div className="max-w-xl mx-auto p-4 pb-24">
      <h2 className="text-2xl font-bold mb-6">Archive</h2>
      {loading ? (
        <div className="text-center p-8">Loading...</div>
      ) : posts.length === 0 ? (
        <div className="text-center p-12 bg-white rounded-2xl border border-gray-100">
          <Archive size={48} className="mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500">No archived posts yet.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {posts.map(post => (
            <Post 
              key={post.id} 
              post={post} 
              onLike={onLike} 
              onSave={onSave} 
              onComment={() => {}} 
              onArchive={async (id) => {
                await onArchive(id);
                fetchArchived();
              }}
              onEdit={async (id, updates) => {
                await onEdit(id, updates);
                fetchArchived();
              }}
              onDelete={async (id) => {
                await onDelete(id);
                fetchArchived();
              }}
              onHashtagClick={onHashtagClick}
              onProfileClick={onProfileClick}
              isOwner={true}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const AdminPanel = () => {
  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);

  const fetchAdminData = async () => {
    const [statsRes, usersRes, reportsRes] = await Promise.all([
      fetch('/api/admin/stats'),
      fetch('/api/admin/users'),
      fetch('/api/admin/reports')
    ]);
    setStats(await statsRes.json());
    setUsers(await usersRes.json());
    setReports(await reportsRes.json());
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleVerify = async (id: number) => {
    await fetch(`/api/admin/users/${id}/verify`, { method: 'POST' });
    fetchAdminData();
  };

  const handleResolveReport = async (id: number) => {
    await fetch(`/api/admin/reports/${id}/resolve`, { method: 'POST' });
    fetchAdminData();
  };

  if (!stats) return <div className="p-8 text-center">Unauthorized or Loading...</div>;

  return (
    <div className="max-w-4xl mx-auto p-4 pb-24">
      <h2 className="text-2xl font-bold mb-6">Admin Dashboard</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <p className="text-gray-500 text-sm mb-1">Total Users</p>
          <p className="text-3xl font-bold">{stats.users.count}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <p className="text-gray-500 text-sm mb-1">Total Posts</p>
          <p className="text-3xl font-bold">{stats.posts.count}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <p className="text-gray-500 text-sm mb-1">Total Comments</p>
          <p className="text-3xl font-bold">{stats.comments.count}</p>
        </div>
      </div>
      
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-8">
        <div className="p-4 border-b border-gray-100 flex justify-between items-center">
          <h3 className="font-bold">User Management</h3>
        </div>
        <div className="divide-y divide-gray-100">
          {users.map(u => (
            <div key={u.id} className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img src={u.avatar_url} className="w-10 h-10 rounded-full object-cover" referrerPolicy="no-referrer" />
                <div>
                  <p className="font-bold text-sm flex items-center gap-1">
                    {u.username}
                    {u.is_verified === 1 && <CheckCircle size={14} className="text-blue-500" fill="currentColor" stroke="white" />}
                  </p>
                  <p className="text-xs text-gray-500">{u.full_name}</p>
                </div>
              </div>
              <button 
                onClick={() => handleVerify(u.id)}
                className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-colors ${u.is_verified ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' : 'bg-blue-50 text-blue-600 hover:bg-blue-100'}`}
              >
                {u.is_verified ? 'Remove Badge' : 'Verify User'}
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-8">
        <div className="p-4 border-b border-gray-100 flex justify-between items-center">
          <h3 className="font-bold">Reported Posts</h3>
        </div>
        <div className="divide-y divide-gray-100">
          {reports.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No reports found.</div>
          ) : reports.map(report => (
            <div key={report.id} className="p-4 flex gap-4">
              <div className="w-20 h-20 shrink-0 bg-gray-100 rounded-xl overflow-hidden">
                {report.content_type === 'video' ? (
                  <video src={report.content_url} className="w-full h-full object-cover" />
                ) : (
                  <img src={report.content_url} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                )}
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-start mb-1">
                  <p className="font-bold text-sm">Reported by: {report.reporter_username}</p>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-tighter ${report.status === 'resolved' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                    {report.status}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mb-2">Author: {report.author_username}</p>
                <p className="text-sm font-medium text-gray-800 mb-3">Reason: {report.reason}</p>
                
                {report.status !== 'resolved' && (
                  <button 
                    onClick={() => handleResolveReport(report.id)}
                    className="px-4 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold transition-colors"
                  >
                    Mark as Resolved
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const CreatePost = ({ onComplete }: { onComplete: () => void }) => {
  const [caption, setCaption] = useState('');
  const [url, setUrl] = useState('');
  const [type, setType] = useState<'image' | 'video'>('image');
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isVideo = file.type.startsWith('video/');
    setType(isVideo ? 'video' : 'image');

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      setUrl(base64);
      setPreview(base64);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) {
      alert('Please provide a content URL or select a file');
      return;
    }
    
    setLoading(true);
    try {
      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content_url: url, content_type: type, caption })
      });
      if (res.ok) {
        onComplete();
      } else {
        alert('Failed to share post');
      }
    } catch (err) {
      alert('Error sharing post');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto p-4 pb-24">
      <h2 className="text-2xl font-bold mb-6">New Post</h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <label className="text-sm font-bold text-gray-500 uppercase">Content</label>
          
          <div className="flex gap-4">
            <button 
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className={`flex-1 p-6 rounded-2xl border-2 border-dashed transition-all flex flex-col items-center gap-2 ${type === 'image' && url ? 'border-brand bg-brand/5' : 'border-gray-200 hover:border-gray-300'}`}
            >
              <ImageIcon size={32} className={type === 'image' && url ? 'text-brand' : 'text-gray-400'} />
              <span className="text-sm font-bold">Select Image</span>
            </button>
            <button 
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className={`flex-1 p-6 rounded-2xl border-2 border-dashed transition-all flex flex-col items-center gap-2 ${type === 'video' && url ? 'border-brand bg-brand/5' : 'border-gray-200 hover:border-gray-300'}`}
            >
              <VideoIcon size={32} className={type === 'video' && url ? 'text-brand' : 'text-gray-400'} />
              <span className="text-sm font-bold">Select Video</span>
            </button>
          </div>
          
          <input 
            type="file" 
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*,video/*"
            className="hidden"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-bold text-gray-500 uppercase">Or Content URL</label>
          <input 
            type="text" 
            value={url.startsWith('data:') ? '' : url}
            onChange={(e) => {
              setUrl(e.target.value);
              setPreview(e.target.value);
              if (e.target.value.includes('video') || e.target.value.endsWith('.mp4')) {
                setType('video');
              } else {
                setType('image');
              }
            }}
            placeholder="https://picsum.photos/seed/..." 
            className="w-full p-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-brand"
          />
        </div>

        {preview && (
          <div className="relative aspect-square rounded-2xl overflow-hidden bg-gray-100 border border-gray-100">
            {type === 'video' ? (
              <video src={preview} className="w-full h-full object-cover" controls />
            ) : (
              <img src={preview} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            )}
            <button 
              type="button"
              onClick={() => { setUrl(''); setPreview(null); }}
              className="absolute top-2 right-2 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        )}

        <div className="space-y-2">
          <label className="text-sm font-bold text-gray-500 uppercase">Caption</label>
          <textarea 
            rows={4}
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Write something..." 
            className="w-full p-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-brand resize-none"
          />
        </div>

        <button 
          type="submit" 
          disabled={loading || !url}
          className={`w-full p-4 text-white font-bold rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 ${loading || !url ? 'bg-gray-300 cursor-not-allowed shadow-none' : 'bg-brand hover:scale-[1.02] active:scale-[0.98] shadow-brand/20'}`}
        >
          {loading ? (
            <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>Share Post</>
          )}
        </button>
      </form>
    </div>
  );
};

const SearchView = ({ onProfileClick, initialQuery = '' }: { onProfileClick: (u: string) => void, initialQuery?: string }) => {
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const fetchSearch = async (q: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      setResults(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialQuery) {
      setQuery(initialQuery);
    }
  }, [initialQuery]);

  useEffect(() => {
    if (query.trim().length > 0) {
      const delay = setTimeout(() => {
        fetchSearch(query);
      }, 300);
      return () => clearTimeout(delay);
    } else {
      fetchSearch(''); // Fetch suggestions
    }
  }, [query]);

  return (
    <div className="max-w-xl mx-auto p-4 pb-24">
      <div className="relative mb-6">
        <Search className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${loading ? 'text-brand' : 'text-gray-400'}`} size={20} />
        <input 
          type="text" 
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search users or #hashtags" 
          className="w-full pl-12 pr-4 py-4 bg-gray-100 border-none rounded-2xl focus:ring-2 focus:ring-brand transition-all"
        />
        {loading && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2">
            <div className="w-5 h-5 border-2 border-brand/30 border-t-brand rounded-full animate-spin" />
          </div>
        )}
      </div>

      {results && (
        <div className="space-y-6">
          {results.type === 'suggestions' && (
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider px-2">Suggested for you</h3>
          )}
          
          {results.type === 'users' || results.type === 'suggestions' ? (
            <div className="space-y-2">
              {results.results.length === 0 ? (
                <div className="text-center p-12 text-gray-400">
                  <User size={48} className="mx-auto mb-4 opacity-20" />
                  <p>No users found for "{query}"</p>
                </div>
              ) : (
                results.results.map((user: any) => (
                  <button 
                    key={user.id} 
                    onClick={() => onProfileClick(user.username)}
                    className="w-full flex items-center gap-4 p-3 hover:bg-white hover:shadow-md rounded-2xl transition-all group"
                  >
                    <div className="relative">
                      <img src={user.avatar_url} className="w-14 h-14 rounded-full object-cover border-2 border-transparent group-hover:border-brand transition-colors" referrerPolicy="no-referrer" />
                      <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-white rounded-full flex items-center justify-center shadow-sm">
                        <div className="w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
                      </div>
                    </div>
                    <div className="text-left flex-1">
                      <p className="font-bold text-sm group-hover:text-brand transition-colors flex items-center gap-1">
                        {user.username}
                        {user.is_verified === 1 && <CheckCircle size={14} className="text-blue-500" fill="currentColor" stroke="white" />}
                      </p>
                      <p className="text-xs text-gray-500">{user.full_name}</p>
                    </div>
                    <div className="px-4 py-1.5 bg-gray-100 rounded-full text-[10px] font-bold text-gray-600 group-hover:bg-brand group-hover:text-white transition-all">
                      View Profile
                    </div>
                  </button>
                ))
              )}
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-1 rounded-2xl overflow-hidden">
              {results.results.length === 0 ? (
                <div className="col-span-3 text-center p-12 text-gray-400">
                  <Play size={48} className="mx-auto mb-4 opacity-20" />
                  <p>No posts found for "{query}"</p>
                </div>
              ) : (
                results.results.map((post: any) => (
                  <div key={post.id} className="aspect-square bg-gray-100 relative group cursor-pointer">
                    <img src={post.content_url} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                      <Heart size={20} fill="currentColor" />
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}

      {!results && !loading && (
        <div className="grid grid-cols-3 gap-1">
          {[...Array(12)].map((_, i) => (
            <div key={i} className="aspect-square bg-gray-100 animate-pulse rounded-sm" />
          ))}
        </div>
      )}
    </div>
  );
};

const NotificationsView = ({ onProfileClick }: { onProfileClick: (u: string) => void }) => {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await fetch('/api/notifications');
        const data = await res.json();
        setNotifications(data);
        
        // Mark as read
        await fetch('/api/notifications/read', { method: 'POST' });
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchNotifications();
  }, []);

  const getNotificationText = (type: string) => {
    switch (type) {
      case 'like': return 'liked your post.';
      case 'comment': return 'commented on your post:';
      case 'follow': return 'started following you.';
      case 'message': return 'sent you a message:';
      default: return 'interacted with your profile.';
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'like': return <Heart size={16} className="text-red-500" fill="currentColor" />;
      case 'comment': return <MessageCircle size={16} className="text-blue-500" fill="currentColor" />;
      case 'follow': return <User size={16} className="text-green-500" fill="currentColor" />;
      case 'message': return <Send size={16} className="text-brand" fill="currentColor" />;
      default: return <Bell size={16} className="text-gray-500" />;
    }
  };

  return (
    <div className="max-w-xl mx-auto pt-4 pb-24 px-4 min-h-screen bg-white">
      <h2 className="text-2xl font-bold mb-6">Activity</h2>
      
      {loading ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-4 animate-pulse">
              <div className="w-12 h-12 bg-gray-200 rounded-full" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4" />
                <div className="h-3 bg-gray-200 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <Bell size={48} className="mx-auto mb-4 opacity-20" />
          <p>No new notifications</p>
        </div>
      ) : (
        <div className="space-y-4">
          {notifications.map((notif) => (
            <div 
              key={notif.id} 
              className={`flex items-start gap-4 p-3 rounded-2xl transition-colors ${notif.is_read ? 'bg-white' : 'bg-brand/5'}`}
            >
              <button onClick={() => onProfileClick(notif.username)} className="relative shrink-0">
                <img src={notif.avatar_url} className="w-12 h-12 rounded-full object-cover border border-gray-100" referrerPolicy="no-referrer" />
                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-sm">
                  {getNotificationIcon(notif.type)}
                </div>
              </button>
              
              <div className="flex-1 pt-1">
                <p className="text-sm">
                  <button onClick={() => onProfileClick(notif.username)} className="font-bold hover:underline mr-1 inline-flex items-center gap-1">
                    {notif.username}
                    {notif.is_verified === 1 && <CheckCircle size={14} className="text-blue-500" fill="currentColor" stroke="white" />}
                  </button>
                  <span className="text-gray-600">{getNotificationText(notif.type)}</span>
                </p>
                {notif.message && (
                  <p className="text-sm text-gray-500 mt-1 line-clamp-1 italic">"{notif.message}"</p>
                )}
                <p className="text-xs text-gray-400 mt-1">
                  {new Date(notif.created_at).toLocaleDateString()}
                </p>
              </div>

              {notif.post_image && (
                <div className="w-12 h-12 shrink-0 rounded-lg overflow-hidden bg-gray-100">
                  <img src={notif.post_image} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const MessagesView = ({ currentUser, initialUsername }: { currentUser: UserType | null, initialUsername?: string | null }) => {
  const [chats, setChats] = useState<any[]>([]);
  const [activeChat, setActiveChat] = useState<any>(null);
  const [messages, setMessages] = useState<MessageType[]>([]);
  const [newMessage, setNewMessage] = useState('');

  useEffect(() => {
    fetch('/api/messages').then(res => res.json()).then(data => {
      if (Array.isArray(data)) {
        setChats(data);
      } else {
        setChats([]);
      }
    }).catch(() => setChats([]));
  }, []);

  useEffect(() => {
    if (initialUsername) {
      fetch(`/api/users/${initialUsername}`).then(res => res.json()).then(user => {
        if (user && !user.error) setActiveChat(user);
      });
    }
  }, [initialUsername]);

  useEffect(() => {
    if (activeChat) {
      fetch(`/api/messages/${activeChat.id}`).then(res => res.json()).then(data => {
        if (Array.isArray(data)) {
          setMessages(data);
        } else {
          setMessages([]);
        }
      }).catch(() => setMessages([]));
    }
  }, [activeChat]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeChat) return;
    await fetch('/api/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ receiver_id: activeChat.id, text: newMessage })
    });
    setNewMessage('');
    fetch(`/api/messages/${activeChat.id}`).then(res => res.json()).then(setMessages);
  };

  if (activeChat) {
    return (
      <div className="flex flex-col h-[calc(100vh-64px)] md:h-screen max-w-2xl mx-auto bg-white">
        <div className="p-4 border-b border-gray-100 flex items-center gap-4">
          <button onClick={() => setActiveChat(null)}><ChevronLeft size={24} /></button>
          <img src={activeChat.avatar_url} className="w-10 h-10 rounded-full object-cover" referrerPolicy="no-referrer" />
          <span className="font-bold">{activeChat.username}</span>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
          {messages.map(msg => (
            <div key={msg.id} className={`flex ${msg.sender_id === currentUser?.id ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[70%] p-3 rounded-2xl text-sm ${msg.sender_id === currentUser?.id ? 'bg-brand text-white rounded-tr-none' : 'bg-gray-100 rounded-tl-none'}`}>
                {msg.text}
              </div>
            </div>
          ))}
        </div>
        <form onSubmit={handleSend} className="p-4 border-t border-gray-100 flex gap-2">
          <input 
            type="text" 
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Message..." 
            className="flex-1 p-3 bg-gray-100 border-none rounded-full text-sm focus:ring-2 focus:ring-brand"
          />
          <button type="submit" className="p-3 text-brand"><Send size={20} /></button>
        </form>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto p-4">
      <h2 className="text-2xl font-bold mb-6">Messages</h2>
      <div className="space-y-2">
        {chats.map(chat => (
          <button 
            key={chat.id}
            onClick={() => setActiveChat(chat)}
            className="w-full flex items-center gap-4 p-4 hover:bg-gray-50 rounded-2xl transition-colors"
          >
            <img src={chat.avatar_url} className="w-14 h-14 rounded-full object-cover" referrerPolicy="no-referrer" />
            <div className="text-left flex-1">
              <p className="font-bold">{chat.username}</p>
              <p className="text-sm text-gray-500 truncate">{chat.last_msg}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

const PasswordSecurityView = ({ onBack }: { onBack: () => void }) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      alert('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      await fetch('/api/users/me/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword })
      });
      alert('Password updated successfully');
      onBack();
    } catch (err) {
      alert('Error updating password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto p-4 pb-24">
      <h2 className="text-2xl font-bold mb-6">Password & Security</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input type="password" placeholder="Current Password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className="w-full p-4 rounded-2xl border border-gray-200" />
        <input type="password" placeholder="New Password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full p-4 rounded-2xl border border-gray-200" />
        <input type="password" placeholder="Confirm New Password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full p-4 rounded-2xl border border-gray-200" />
        <button type="submit" disabled={loading} className="w-full py-4 bg-brand text-white rounded-2xl font-bold">
          {loading ? 'Updating...' : 'Update Password'}
        </button>
        <button type="button" onClick={onBack} className="w-full py-4 bg-gray-100 text-gray-700 rounded-2xl font-bold">
          Back
        </button>
      </form>
    </div>
  );
};

const SettingsDetailView = ({ title, onBack }: { title: string, onBack: () => void }) => {
  return (
    <div className="max-w-xl mx-auto p-4 pb-24">
      <h2 className="text-2xl font-bold mb-6">{title}</h2>
      <p className="text-gray-500">This feature is currently under development.</p>
      <button onClick={onBack} className="mt-6 w-full py-4 bg-gray-100 text-gray-700 rounded-2xl font-bold">
        Back
      </button>
    </div>
  );
};

const StoryViewer = ({ stories, initialStoryId, onClose }: { stories: StoryType[], initialStoryId: number, onClose: () => void }) => {
  const [currentIndex, setCurrentIndex] = useState(stories.findIndex(s => s.id === initialStoryId));
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          if (currentIndex < stories.length - 1) {
            setCurrentIndex(prev => prev + 1);
            return 0;
          } else {
            onClose();
            return 100;
          }
        }
        return prev + 2;
      });
    }, 100);
    return () => clearInterval(timer);
  }, [currentIndex, stories.length, onClose]);

  const story = stories[currentIndex];
  if (!story) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black flex items-center justify-center">
      <div className="absolute top-4 left-0 right-0 px-4 flex gap-2">
        {stories.map((_, i) => (
          <div key={i} className="h-1 bg-gray-600 flex-1 rounded-full overflow-hidden">
            <div className="h-full bg-white" style={{ width: i === currentIndex ? `${progress}%` : i < currentIndex ? '100%' : '0%' }} />
          </div>
        ))}
      </div>
      
      <button onClick={() => { setProgress(0); setCurrentIndex(prev => Math.max(0, prev - 1)); }} className="absolute left-0 top-0 bottom-0 w-1/4" />
      <button onClick={() => { setProgress(0); setCurrentIndex(prev => Math.min(stories.length - 1, prev + 1)); }} className="absolute right-0 top-0 bottom-0 w-1/4" />
      
      {story.content_url.match(/\.(mp4|webm|ogg)$/) ? (
        <video src={story.content_url} className="w-full h-full object-contain" autoPlay muted />
      ) : (
        <img src={story.content_url} className="w-full h-full object-contain" referrerPolicy="no-referrer" />
      )}
      
      <button onClick={onClose} className="absolute top-4 right-4 text-white"><X size={32} /></button>
    </div>
  );
};

const LoginView = ({ onLogin, onSwitch }: { onLogin: (user: UserType) => void, onSwitch: () => void }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      if (res.ok) {
        onLogin(data.user);
      } else {
        setError(data.error || 'Login failed');
      }
    } catch (err) {
      setError('Connection error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <div className="w-16 h-16 bg-black rounded-2xl flex items-center justify-center text-white font-bold text-3xl mx-auto mb-4">D</div>
          <h1 className="text-3xl font-bold">Welcome back</h1>
          <p className="text-gray-500 mt-2">Sign in to continue to DicTok</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="p-4 bg-red-50 text-red-500 rounded-2xl text-sm font-medium">{error}</div>}
          <div className="space-y-2">
            <label className="text-sm font-semibold ml-1">Username or Email</label>
            <input 
              type="text" 
              value={username} 
              onChange={(e) => setUsername(e.target.value)}
              className="w-full p-4 rounded-2xl border border-gray-100 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-brand/20 outline-none transition-all" 
              placeholder="Enter your username"
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold ml-1">Password</label>
            <input 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-4 rounded-2xl border border-gray-100 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-brand/20 outline-none transition-all" 
              placeholder="Enter your password"
              required
            />
          </div>
          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-4 bg-black text-white rounded-2xl font-bold hover:bg-zinc-800 transition-colors disabled:opacity-50"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
        
        <div className="text-center">
          <p className="text-gray-500">Don't have an account? <button onClick={onSwitch} className="text-brand font-bold">Sign Up</button></p>
        </div>
      </div>
    </div>
  );
};



const LegalView = ({ type, onBack }: { type: 'tos' | 'privacy' | 'dmca', onBack: () => void }) => {
  const content = {
    tos: {
      title: 'Terms of Service',
      text: `Dobrodošli na DicTok. Korišćenjem naše platforme pristajete na sledeća pravila:
      1. Morate imati najmanje 18 godina.
      2. Zabranjeno je postavljanje nelegalnog sadržaja.
      3. Poštujte druge korisnike.
      4. DicTok zadržava pravo da ukloni bilo koji sadržaj koji krši naša pravila.`
    },
    privacy: {
      title: 'Privacy Policy',
      text: `Vaša privatnost nam je važna.
      1. Prikupljamo vaš email i osnovne podatke za rad aplikacije.
      2. Podaci se čuvaju u sigurnoj Supabase bazi podataka.
      3. Ne delimo vaše podatke sa trećim licima bez vašeg pristanka.
      4. Možete zatražiti brisanje vaših podataka u bilo kom trenutku.`
    },
    dmca: {
      title: 'DMCA / Content Removal',
      text: `DicTok poštuje prava intelektualne svojine.
      Ako smatrate da je vaš sadržaj objavljen bez dozvole:
      1. Pošaljite prijavu na support@brendi.rs.
      2. Navedite tačan link do spornog sadržaja.
      3. Priložite dokaz o vlasništvu.
      4. Naš tim će reagovati u roku od 48 sati.`
    }
  };

  return (
    <div className="max-w-xl mx-auto p-6 pb-24">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
          <ChevronLeft size={24} />
        </button>
        <h2 className="text-2xl font-bold">{content[type].title}</h2>
      </div>
      <div className="bg-white dark:bg-zinc-800 p-6 rounded-3xl border border-gray-100 dark:border-zinc-700 shadow-sm">
        <p className="text-gray-600 dark:text-zinc-400 whitespace-pre-wrap leading-relaxed">
          {content[type].text}
        </p>
      </div>
      <div className="mt-12 text-center">
        <p className="text-xs text-gray-400">Poslednji put ažurirano: 9. Mart 2026.</p>
      </div>
    </div>
  );
};

const HelpView = ({ onBack }: { onBack: () => void }) => {
  const faqs = [
    { q: "Kako da postanem model?", a: "Samo počnite da objavljujete kvalitetan sadržaj i verifikujte svoj nalog u podešavanjima." },
    { q: "Kako da povučem novac?", a: "Isplate se vrše putem bankovnog transfera ili Payoneer-a nakon što dostignete prag od 50 EUR." },
    { q: "Da li je diskretno?", a: "Da, vaši podaci su enkriptovani i možete podesiti profil na 'Private'." }
  ];

  return (
    <div className="max-w-xl mx-auto p-6 pb-24">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
          <ChevronLeft size={24} />
        </button>
        <h2 className="text-2xl font-bold">Help & Support</h2>
      </div>
      
      <div className="space-y-6">
        <div className="bg-brand/5 p-6 rounded-3xl border border-brand/10">
          <h3 className="font-bold mb-2">Kontaktirajte nas</h3>
          <p className="text-sm text-gray-600 mb-4">Imate problem sa upload-om ili plaćanjem? Pišite nam direktno.</p>
          <a href="mailto:support@brendi.rs" className="inline-block py-3 px-6 bg-brand text-white rounded-2xl font-bold text-sm">
            Pošalji Email
          </a>
        </div>

        <div className="space-y-4">
          <h3 className="font-bold text-lg px-2">FAQ</h3>
          {faqs.map((faq, i) => (
            <div key={i} className="bg-white dark:bg-zinc-800 p-4 rounded-2xl border border-gray-100 dark:border-zinc-700">
              <p className="font-bold text-sm mb-1">{faq.q}</p>
              <p className="text-xs text-gray-500">{faq.a}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const AgeGate = ({ onAccept }: { onAccept: () => void }) => {
  return (
    <div className="fixed inset-0 z-[100] bg-black flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-[40px] p-8 text-center space-y-6 shadow-2xl">
        <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto">
          <span className="text-3xl font-black text-red-500">18+</span>
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold">Age Verification</h2>
          <p className="text-gray-500 text-sm">DicTok contains adult content. You must be at least 18 years old to enter.</p>
        </div>
        <div className="space-y-3">
          <button 
            onClick={onAccept}
            className="w-full py-4 bg-black text-white rounded-2xl font-bold hover:bg-zinc-800 transition-all"
          >
            I am 18 or older - Enter
          </button>
          <button 
            onClick={() => window.location.href = 'https://google.com'}
            className="w-full py-4 bg-gray-100 text-gray-500 rounded-2xl font-bold hover:bg-gray-200 transition-all"
          >
            Exit
          </button>
        </div>
        <p className="text-[10px] text-gray-400">
          By entering, you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  );
};

const RegisterView = ({ onRegister, onSwitch }: { onRegister: (user: UserType) => void, onSwitch: () => void }) => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreed) {
      setError('Morate se složiti sa uslovima korišćenja i politikom privatnosti.');
      return;
    }
    setLoading(true);
    setError('');

    // Client-side age check
    const birth = new Date(birthDate);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    
    if (age < 18) {
      setError('You must be at least 18 years old.');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password, full_name: fullName, birth_date: birthDate })
      });
      const data = await res.json();
      if (res.ok) {
        const meRes = await fetch('/api/users/me');
        const meData = await meRes.json();
        onRegister(meData);
      } else {
        setError(data.error || 'Registration failed');
      }
    } catch (err) {
      setError('Connection error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <div className="w-16 h-16 bg-black rounded-2xl flex items-center justify-center text-white font-bold text-3xl mx-auto mb-4">D</div>
          <h1 className="text-3xl font-bold">Create account</h1>
          <p className="text-gray-500 mt-2">Join the DicTok community today (18+)</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="p-4 bg-red-50 text-red-500 rounded-2xl text-sm font-medium">{error}</div>}
          <div className="space-y-2">
            <label className="text-sm font-semibold ml-1">Full Name</label>
            <input 
              type="text" 
              value={fullName} 
              onChange={(e) => setFullName(e.target.value)}
              className="w-full p-4 rounded-2xl border border-gray-100 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-brand/20 outline-none transition-all" 
              placeholder="Enter your full name"
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold ml-1">Username</label>
            <input 
              type="text" 
              value={username} 
              onChange={(e) => setUsername(e.target.value)}
              className="w-full p-4 rounded-2xl border border-gray-100 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-brand/20 outline-none transition-all" 
              placeholder="Choose a username"
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold ml-1">Email</label>
            <input 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-4 rounded-2xl border border-gray-100 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-brand/20 outline-none transition-all" 
              placeholder="Enter your email"
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold ml-1">Birth Date</label>
            <input 
              type="date" 
              value={birthDate} 
              onChange={(e) => setBirthDate(e.target.value)}
              className="w-full p-4 rounded-2xl border border-gray-100 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-brand/20 outline-none transition-all" 
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold ml-1">Password</label>
            <input 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-4 rounded-2xl border border-gray-100 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-brand/20 outline-none transition-all" 
              placeholder="Create a password"
              required
            />
          </div>
          <div className="flex items-start gap-3 p-2">
            <input 
              type="checkbox" 
              id="terms"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-1 w-4 h-4 rounded border-gray-300 text-brand focus:ring-brand"
              required
            />
            <label htmlFor="terms" className="text-xs text-gray-500 leading-relaxed">
              Slažem se sa <button type="button" className="text-brand font-bold hover:underline">Uslovima korišćenja</button>, <button type="button" className="text-brand font-bold hover:underline">Politikom privatnosti</button> i <button type="button" className="text-brand font-bold hover:underline">DMCA</button> pravilima. Potvrđujem da imam 18 ili više godina.
            </label>
          </div>
          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-4 bg-black text-white rounded-2xl font-bold hover:bg-zinc-800 transition-colors disabled:opacity-50"
          >
            {loading ? 'Creating account...' : 'Sign Up'}
          </button>
        </form>
        
        <div className="text-center">
          <p className="text-gray-500">Already have an account? <button onClick={onSwitch} className="text-brand font-bold">Sign In</button></p>
        </div>
      </div>
    </div>
  );
};

// --- Main App ---

export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [darkMode, setDarkMode] = useState(false);
  const [user, setUser] = useState<UserType | null>(null);
  const [posts, setPosts] = useState<PostType[]>([]);
  const [stories, setStories] = useState<StoryType[]>([]);
  const [selectedProfile, setSelectedProfile] = useState<string | null>(null);
  const [navStack, setNavStack] = useState<{ tab: string, profile: string | null }[]>([]);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [activeStory, setActiveStory] = useState<number | null>(null);
  const [feedType, setFeedType] = useState<'following' | 'for-you'>('following');
  const [forYouPosts, setForYouPosts] = useState<PostType[]>([]);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [ageVerified, setAgeVerified] = useState(false);
  const [currency, setCurrency] = useState('EUR');
  const [lang, setLang] = useState('en');
  const [legalType, setLegalType] = useState<'tos' | 'privacy' | 'dmca' | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch('/api/users/me');
        const data = await res.json();
        setUser(data);
      } catch (e) {
        console.error("Auth check failed");
      } finally {
        setIsAuthLoading(false);
      }
    };
    checkAuth();
  }, []);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  useEffect(() => {
    try {
      getSupabase();
      console.log("Supabase client initialized successfully");
    } catch (e) {
      console.error("Supabase initialization error:", e);
    }
  }, []);

  const fetchData = async () => {
    const [uRes, pRes, sRes, nRes] = await Promise.all([
      fetch('/api/users/me'),
      fetch('/api/posts'),
      fetch('/api/stories'),
      fetch('/api/notifications/unread-count')
    ]);
    const userData = await uRes.json();
    const postsData = await pRes.json();
    const storiesData = await sRes.json();
    
    setUser(userData);
    setPosts(postsData);
    setStories(storiesData);
    
    if (nRes.ok) {
      const { count } = await nRes.json();
      setUnreadNotifications(count);
    }

    if (feedType === 'for-you' && userData && postsData.length > 0) {
      generateForYouFeed(userData, postsData);
    }
  };

  const generateForYouFeed = async (currentUser: UserType, allPosts: PostType[]) => {
    if (!allPosts.length) return;
    setIsAiLoading(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
      
      // Get user's liked posts to understand interests
      const likedRes = await fetch('/api/users/me/saved'); // Using saved as proxy for interests if needed, or we could fetch likes
      const likedPosts = await likedRes.json();
      
      const prompt = `
        You are a social media recommendation engine. 
        User Profile: ${currentUser.full_name}, Bio: ${currentUser.bio}
        User Interests (based on saved posts): ${likedPosts.map((p: any) => p.caption).join(', ')}
        
        Available Posts:
        ${allPosts.map(p => `ID: ${p.id}, Author: ${p.username}, Caption: ${p.caption}`).join('\n')}
        
        Task: Rank the top 10 most relevant post IDs for this user. 
        Prioritize posts that match user interests or seem high quality.
        Return ONLY a JSON array of post IDs.
      `;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: { type: Type.INTEGER }
          }
        }
      });

      const rankedIds = JSON.parse(response.text);
      const rankedPosts = rankedIds
        .map((id: number) => allPosts.find(p => p.id === id))
        .filter(Boolean) as PostType[];
      
      // Add some random ones if AI didn't return enough or to keep it fresh
      const remaining = allPosts.filter(p => !rankedIds.includes(p.id));
      const finalFeed = [...rankedPosts, ...remaining.sort(() => Math.random() - 0.5)].slice(0, 20);
      
      setForYouPosts(finalFeed);
    } catch (err) {
      console.error('AI Feed generation failed:', err);
      setForYouPosts(allPosts.sort(() => Math.random() - 0.5));
    } finally {
      setIsAiLoading(false);
    }
  };

  useEffect(() => {
    if (feedType === 'for-you' && user && posts.length > 0 && forYouPosts.length === 0) {
      generateForYouFeed(user, posts);
    }
  }, [feedType, user, posts]);

  useEffect(() => {
    fetchData();
  }, []);

  const navigateTo = (tab: string, profile: string | null = null, query: string = '') => {
    setNavStack(prev => [...prev, { tab: activeTab, profile: selectedProfile }]);
    setActiveTab(tab);
    setSelectedProfile(profile);
    if (query) setSearchQuery(query);
    else if (tab === 'search') setSearchQuery('');
  };

  const goBack = () => {
    if (navStack.length > 0) {
      const last = navStack[navStack.length - 1];
      setNavStack(prev => prev.slice(0, -1));
      setActiveTab(last.tab);
      setSelectedProfile(last.profile);
    } else if (selectedProfile) {
      setSelectedProfile(null);
    } else if (activeTab !== 'home') {
      setActiveTab('home');
    }
  };

  const handleLike = async (id: number) => {
    const res = await fetch(`/api/posts/${id}/like`, { method: 'POST' });
    const data = await res.json();
    setPosts(posts.map(p => p.id === id ? { ...p, is_liked: data.liked ? 1 : 0, likes_count: data.liked ? p.likes_count + 1 : p.likes_count - 1 } : p));
  };

  const handleSave = async (id: number) => {
    const res = await fetch(`/api/posts/${id}/save`, { method: 'POST' });
    const data = await res.json();
    setPosts(posts.map(p => p.id === id ? { ...p, is_saved: data.saved ? 1 : 0 } : p));
  };

  const handleArchive = async (id: number) => {
    const res = await fetch(`/api/posts/${id}/archive`, { method: 'POST' });
    const data = await res.json();
    if (data.archived) {
      setPosts(posts.filter(p => p.id !== id));
    } else {
      fetchData(); // Refresh to show unarchived post
    }
  };

  const handleEdit = async (id: number, updates: any) => {
    await fetch(`/api/posts/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    fetchData(); // Refresh to show updated post
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this post?')) {
      await fetch(`/api/posts/${id}`, { method: 'DELETE' });
      setPosts(posts.filter(p => p.id !== id));
    }
  };

  const handleStoryUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      try {
        await fetch('/api/stories', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content_url: reader.result })
        });
        fetchData(); // Refresh stories
      } catch (err) {
        console.error('Failed to upload story:', err);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
    setActiveTab('home');
    setNavStack([]);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        const displayedPosts = feedType === 'for-you' ? forYouPosts : posts;
        return (
          <>
            {activeStory !== null && (
              <StoryViewer stories={stories} initialStoryId={activeStory} onClose={() => setActiveStory(null)} />
            )}
            <div className="max-w-xl mx-auto pt-4 sticky top-0 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md z-10">
              <div className="flex justify-center gap-8 border-b border-gray-100 dark:border-zinc-800 mb-4 pb-2">
                <button 
                  onClick={() => setFeedType('following')}
                  className={`text-sm font-semibold transition-colors relative py-2 ${feedType === 'following' ? 'text-black dark:text-white' : 'text-gray-400'}`}
                >
                  Following
                  {feedType === 'following' && <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand" />}
                </button>
                <button 
                  onClick={() => setFeedType('for-you')}
                  className={`text-sm font-semibold transition-colors relative py-2 flex items-center gap-1 ${feedType === 'for-you' ? 'text-black dark:text-white' : 'text-gray-400'}`}
                >
                  <Sparkles size={14} className={isAiLoading ? "animate-pulse" : ""} />
                  For You
                  {feedType === 'for-you' && <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand" />}
                </button>
              </div>
            </div>
            {(() => {
              const PTR = PullToRefresh as any;
              return (
                <PTR onRefresh={fetchData}>
                  <div className="max-w-xl mx-auto pb-24">
                    <div className="flex gap-4 overflow-x-auto pb-6 px-4 no-scrollbar">
                      <label className="flex flex-col items-center gap-1 shrink-0 cursor-pointer">
                        <input 
                          type="file" 
                          accept="image/*,video/*" 
                          className="hidden" 
                          onChange={handleStoryUpload}
                        />
                        <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center border-2 border-dashed border-gray-300 hover:border-brand transition-colors">
                          <PlusSquare size={24} className="text-gray-400" />
                        </div>
                        <span className="text-[10px] font-medium">Your Story</span>
                      </label>
                      {stories.map(story => (
                        <StoryCircle key={story.id} story={story} onClick={() => setActiveStory(story.id)} />
                      ))}
                    </div>

                    {isAiLoading && displayedPosts.length === 0 && (
                      <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                        <Sparkles size={48} className="animate-spin mb-4 text-brand/20" />
                        <p className="text-sm font-medium">Curating your personalized feed...</p>
                      </div>
                    )}

                    <div className="px-4">
                      {displayedPosts.map(post => (
                        <Post 
                          key={post.id} 
                          post={post} 
                          onLike={handleLike} 
                          onSave={handleSave} 
                          onComment={() => {}} 
                          onArchive={handleArchive}
                          onEdit={handleEdit}
                          onDelete={handleDelete}
                          onHashtagClick={(tag) => navigateTo('search', null, tag)}
                          onProfileClick={(u) => navigateTo('profile', u)}
                          isOwner={post.user_id === user?.id}
                        />
                      ))}
                    </div>
                  </div>
                </PTR>
              );
            })()}
          </>
        );
      case 'search':
        return <SearchView onProfileClick={(u) => navigateTo('profile', u)} initialQuery={searchQuery} />;
      case 'notifications':
        return <NotificationsView onProfileClick={(u) => navigateTo('profile', u)} />;
      case 'create':
        return <CreatePost onComplete={() => { setActiveTab('home'); setNavStack([]); fetchData(); }} />;
      case 'messages':
        return <MessagesView currentUser={user} initialUsername={selectedProfile} />;
      case 'password_security':
        return <PasswordSecurityView onBack={() => setActiveTab('settings')} />;
      case 'saved_login':
        return <SettingsDetailView title="Saved Login Info" onBack={() => setActiveTab('settings')} />;
      case 'logged_in_devices':
        return <SettingsDetailView title="Logged-in Devices" onBack={() => setActiveTab('settings')} />;
      case 'subscription':
        return <SettingsDetailView title="Subscription" onBack={() => setActiveTab('settings')} />;
      case 'profile':
        return <ProfileView username={selectedProfile || user?.username || ''} currentUser={user} onNavigate={navigateTo} />;
      case 'settings':
        return <SettingsView user={user} onUpdate={fetchData} onNavigate={navigateTo} darkMode={darkMode} toggleDarkMode={() => setDarkMode(!darkMode)} onLogout={handleLogout} currency={currency} setCurrency={setCurrency} lang={lang} setLang={setLang} />;
      case 'edit_profile':
        return <EditProfileView user={user} onUpdate={fetchData} onBack={goBack} />;
      case 'archive':
        return <ArchivedView onArchive={handleArchive} onLike={handleLike} onSave={handleSave} onEdit={handleEdit} onDelete={handleDelete} onHashtagClick={(tag) => navigateTo('search', null, tag)} onProfileClick={(u) => navigateTo('profile', u)} />;
      case 'saved':
        return <SavedView onLike={handleLike} onSave={handleSave} onEdit={handleEdit} onDelete={handleDelete} onHashtagClick={(tag) => navigateTo('search', null, tag)} onProfileClick={(u) => navigateTo('profile', u)} />;
      case 'admin':
        return <AdminPanel />;
      case 'help':
        return <HelpView onBack={goBack} />;
      case 'tos':
        return <LegalView type="tos" onBack={goBack} />;
      case 'privacy':
        return <LegalView type="privacy" onBack={goBack} />;
      case 'dmca':
        return <LegalView type="dmca" onBack={goBack} />;
      default:
        return null;
    }
  };

  if (isAuthLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-brand border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <>
        {!ageVerified && <AgeGate onAccept={() => setAgeVerified(true)} />}
        {authMode === 'login' 
          ? <LoginView onLogin={(u) => setUser(u)} onSwitch={() => setAuthMode('register')} />
          : <RegisterView onRegister={(u) => setUser(u)} onSwitch={() => setAuthMode('login')} />}
      </>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-900 dark:text-white md:pl-20">
      <header className="sticky top-0 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md z-40 border-b border-gray-100 dark:border-zinc-800 px-4 py-3 flex items-center justify-between md:hidden">
        <div className="flex items-center gap-3">
          {(navStack.length > 0 || selectedProfile || activeTab !== 'home') && (
            <button onClick={goBack} className="p-1 -ml-1 hover:bg-gray-100 rounded-lg transition-colors">
              <ChevronLeft size={24} />
            </button>
          )}
          <h1 className="text-2xl font-black tracking-tighter italic">DicTok</h1>
        </div>
        <div className="flex gap-4">
          <button onClick={() => navigateTo('messages')}><MessageCircle size={24} /></button>
          <button onClick={() => navigateTo('settings')}><Settings size={24} /></button>
        </div>
      </header>

      <main className="dark:bg-zinc-900 dark:text-white min-h-screen">
        {(navStack.length > 0 || selectedProfile) && (
          <button 
            onClick={goBack}
            className="fixed top-4 left-4 md:left-24 z-50 p-2 bg-white dark:bg-zinc-800 rounded-full shadow-lg hover:scale-110 active:scale-95 transition-all"
          >
            <ChevronLeft size={24} />
          </button>
        )}
        {renderContent()}
      </main>

      <Navbar activeTab={activeTab} setActiveTab={(t) => { setNavStack([]); setSelectedProfile(null); setActiveTab(t); if(t === 'notifications') setUnreadNotifications(0); }} user={user} unreadCount={unreadNotifications} />
    </div>
  );
}
