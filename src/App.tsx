import React, { useState, useEffect, useMemo } from 'react';
import PullToRefresh from 'react-pull-to-refresh';
import { getSupabase } from './services/supabaseClient';
import { GoogleGenAI } from "@google/genai";
import { 
  Home, Search, PlusSquare, Heart, MessageCircle, User, 
  Settings, Bookmark, Archive, Shield, Bell, Globe, 
  MoreHorizontal, Share2, Trash2, Image as ImageIcon, 
  CheckCircle, Edit2, Flag, Check, List
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { User as UserType, Post as PostType, Comment as CommentType, Story as StoryType } from './types';

// --- Glavna App Komponenta ---
export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [user, setUser] = useState<UserType | null>(null);
  const [posts, setPosts] = useState<PostType[]>([]);
  const [stories, setStories] = useState<StoryType[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = getSupabase();

  // 1. Učitavanje početnih podataka iz Supabase-a
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      
      // Učitaj profile (uzimamo prvi za test, kasnije ćeš dodati Auth)
      const { data: userData } = await supabase.from('profiles').select('*').limit(1).single();
      if (userData) setUser(userData);

      // Učitaj postove
      const { data: postsData } = await supabase.from('posts').select('*').order('created_at', { ascending: false });
      if (postsData) setPosts(postsData);

      // Učitaj storije
      const { data: storiesData } = await supabase.from('stories').select('*');
      if (storiesData) setStories(storiesData);

      setLoading(false);
    };

    fetchData();
  }, []);

  if (loading) return <div className="flex h-screen items-center justify-center dark:bg-zinc-900 dark:text-white">Loading...</div>;

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-900 pb-20 md:pb-0 md:pl-20">
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} user={user} unreadCount={0} />
      
      <main className="max-w-lg mx-auto pt-4">
        {activeTab === 'home' && (
          <>
            <div className="flex gap-4 overflow-x-auto p-4 no-scrollbar">
              {stories.map(story => (
                <StoryCircle key={story.id} story={story} onClick={() => {}} />
              ))}
            </div>
            <div className="p-4">
              {posts.map(post => (
                <Post key={post.id} post={post} isOwner={user?.username === post.username} onLike={() => {}} onSave={() => {}} onComment={() => {}} />
              ))}
            </div>
          </>
        )}

        {activeTab === 'profile' && user && (
          <ProfileView username={user.username} currentUser={user} onNavigate={setActiveTab} />
        )}
      </main>
    </div>
  );
}

// --- Pomoćne Komponente (Sređene za Supabase) ---

const Navbar = ({ activeTab, setActiveTab, user, unreadCount }: any) => {
  const tabs = [
    { id: 'home', icon: Home, label: 'Home' },
    { id: 'search', icon: Search, label: 'Search' },
    { id: 'create', icon: PlusSquare, label: 'Create' },
    { id: 'profile', icon: User, label: 'Profile' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-zinc-900 border-t dark:border-zinc-800 px-4 py-2 flex justify-around z-50 md:top-0 md:flex-col md:w-20 md:h-screen md:border-r">
      {tabs.map((tab) => (
        <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`p-2 rounded-xl ${activeTab === tab.id ? 'text-blue-500' : 'text-gray-500'}`}>
          <tab.icon size={24} />
        </button>
      ))}
    </nav>
  );
};

const Post = ({ post, isOwner }: { post: PostType, isOwner: boolean, onLike: any, onSave: any, onComment: any }) => {
  return (
    <div className="bg-white dark:bg-zinc-800 border dark:border-zinc-700 rounded-2xl overflow-hidden mb-6 shadow-sm">
      <div className="p-4 flex items-center gap-3">
        <img src={post.avatar_url} className="w-10 h-10 rounded-full object-cover" />
        <span className="font-bold dark:text-white">{post.username}</span>
      </div>
      <img src={post.content_url} className="w-full aspect-square object-cover" />
      <div className="p-4">
        <div className="flex gap-4 mb-2 dark:text-white">
          <Heart size={24} />
          <MessageCircle size={24} />
          <Share2 size={24} />
        </div>
        <p className="text-sm dark:text-zinc-300"><span className="font-bold mr-2">{post.username}</span>{post.caption}</p>
      </div>
    </div>
  );
};

const StoryCircle = ({ story, onClick }: { story: StoryType, onClick: () => void }) => (
  <button onClick={onClick} className="flex flex-col items-center gap-1 shrink-0">
    <div className="p-0.5 rounded-full bg-gradient-to-tr from-yellow-400 to-purple-600">
      <div className="p-0.5 bg-white dark:bg-zinc-900 rounded-full">
        <img src={story.avatar_url} className="w-14 h-14 rounded-full object-cover" />
      </div>
    </div>
    <span className="text-[10px] dark:text-white">{story.username}</span>
  </button>
);

const ProfileView = ({ username, currentUser, onNavigate }: any) => {
  const [user, setUser] = useState<UserType | null>(null);
  const [userPosts, setUserPosts] = useState<PostType[]>([]);
  const supabase = getSupabase();

  useEffect(() => {
    const loadProfile = async () => {
      const { data: profile } = await supabase.from('profiles').select('*').eq('username', username).single();
      setUser(profile);
      const { data: posts } = await supabase.from('posts').select('*').eq('username', username);
      if (posts) setUserPosts(posts);
    };
    loadProfile();
  }, [username]);

  if (!user) return <div className="p-10 text-center">Loading profile...</div>;

  return (
    <div className="dark:text-white">
      <div className="h-32 bg-zinc-800">
        <img src={user.banner_url} className="w-full h-full object-cover" />
      </div>
      <div className="px-4 -mt-10">
        <img src={user.avatar_url} className="w-20 h-20 rounded-full border-4 border-white dark:border-zinc-900" />
        <h2 className="text-xl font-bold mt-2">{user.full_name}</h2>
        <p className="text-gray-500">@{user.username}</p>
        <p className="mt-2 text-sm">{user.bio}</p>
      </div>
      <div className="grid grid-cols-3 gap-1 mt-6">
        {userPosts.map(p => <img key={p.id} src={p.content_url} className="aspect-square object-cover" />)}
      </div>
    </div>
  );
};
