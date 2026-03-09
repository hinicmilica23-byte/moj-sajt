import React, { useState, useEffect } from 'react';
import { getSupabase } from './services/supabaseClient';
import { Home, User, Heart, MessageCircle, Share2 } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [user, setUser] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = getSupabase();

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        // Uzimamo profil
        const { data: profile, error: pError } = await supabase
          .from('profiles')
          .select('*')
          .limit(1)
          .single();
        
        if (pError) console.error("Profil error:", pError);
        if (profile) setUser(profile);
        
        // Uzimamo postove
        const { data: postsData, error: postError } = await supabase
          .from('posts')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (postError) throw postError;
        if (postsData) setPosts(postsData);
        
      } catch (err: any) {
        console.error("Greška pri učitavanju:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) return <div className="h-screen flex items-center justify-center dark:bg-zinc-900 dark:text-white text-xl font-medium">Učitavanje...</div>;
  if (error) return <div className="p-10 text-red-500">Greška: {error}</div>;

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-900 pb-20 md:pl-20">
      <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-zinc-900 border-t dark:border-zinc-800 p-4 flex justify-around md:top-0 md:w-20 md:h-screen md:flex-col md:border-r">
        <button onClick={() => setActiveTab('home')} className={`p-2 ${activeTab === 'home' ? 'text-blue-500' : 'text-gray-500'}`}><Home size={24} /></button>
        <button onClick={() => setActiveTab('profile')} className={`p-2 ${activeTab === 'profile' ? 'text-blue-500' : 'text-gray-500'}`}><User size={24} /></button>
      </nav>

      <main className="max-w-lg mx-auto p-4">
        {activeTab === 'home' ? (
          posts.length > 0 ? (
            posts.map(post => (
              <div key={post.id} className="mb-8 border dark:border-zinc-800 rounded-2xl overflow-hidden bg-white dark:bg-zinc-800 shadow-sm">
                <div className="p-4 flex items-center gap-3">
                  <img src={post.avatar_url || 'https://via.placeholder.com/40'} className="w-10 h-10 rounded-full object-cover" />
                  <span className="font-bold dark:text-white">{post.username}</span>
                </div>
                <img src={post.content_url} className="w-full aspect-square object-cover" />
                <div className="p-4">
                  <div className="flex gap-4 mb-2 dark:text-white">
                    <Heart size={24} /> <MessageCircle size={24} /> <Share2 size={24} />
                  </div>
                  <p className="text-sm dark:text-zinc-300"><span className="font-bold mr-2">{post.username}</span>{post.caption}</p>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-20 dark:text-white font-medium">Nema postova u bazi.</div>
          )
        ) : (
          <div className="text-center py-20 dark:text-white">
             <img src={user?.avatar_url || 'https://via.placeholder.com/100'} className="w-24 h-24 rounded-full mx-auto mb-4 border-4 border-blue-500" />
             <h2 className="text-2xl font-bold">{user?.full_name || 'Korisnik'}</h2>
             <p className="text-gray-500">@{user?.username || 'username'}</p>
          </div>
        )}
      </main>
    </div>
  );
}
