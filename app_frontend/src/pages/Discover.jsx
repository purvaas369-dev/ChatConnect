import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from 'react-router-dom';


export default function Discover() {
  const token = localStorage.getItem("access");
  const [users, setUsers] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState("");
  const [cardOffset, setCardOffset] = useState(0);
  const [aiMatches, setAiMatches] = useState([]);
  const currentUser = users[currentIndex] || {};
  const [connectedUsers, setConnectedUsers] = useState([]);
  const [aiMatchesFiltered, setAiMatchesFiltered] = useState([]);
  const navigate = useNavigate();

  // 🔥 ADD THIS FUNCTION (after your imports)
const formatTime = (hours) => {
  if (!hours) return "Just now";
  
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  
  if (h >= 24) {
    return `${Math.floor(h/24)}d ago`;
  } else if (h > 0) {
    return h === 1 ? `${h}h ago` : `${h}h ${m}m ago`;
  } else {
    return m === 1 ? `${m}m ago` : `${m}m ago`;
  }
};

  useEffect(() => {
    fetchUsers();
    fetchAIMatches();
  }, [token]);

  const fetchUsers = async () => {
    try {
      const res = await axios.get("http://127.0.0.1:8000/api/chat/discover/users/", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(res.data || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAIMatches = async () => {
    console.log('🤖 Fetching Enhanced AI matches...');
    try {
      const res = await axios.get("http://127.0.0.1:8000/api/chat/ai-matches-enhanced/", {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('🤖 AI Data:', res.data);
      setAiMatches(res.data);
    } catch (err) {
      console.error('🤖 AI Error:', err.response?.data || err.message);
    }
  };

  const autoConnectAI = async () => {
  try {
    const res = await axios.post("http://127.0.0.1:8000/api/chat/ai-auto-connect/", {}, {
      headers: { Authorization: `Bearer ${token}` }
    });
    setFeedback(res.data.message);
    fetchAIMatches(); // Refresh
  } catch (err) {
    setFeedback("❌ AI connect failed");
  }
};

  const connectWithUser = async (userId,isAiMatch = false) => {
    try {
      await axios.post("http://127.0.0.1:8000/api/chat/discover/connect/", 
        { target_user_id: userId , is_ai_match: isAiMatch},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (isAiMatch){
        setConnectedUsers(prev => [...prev, userId]);
        setFeedback("✅ AI Match Connected!");
      
        // Optimistic filter
        setAiMatchesFiltered(prev => prev.filter(user => user.id !== userId));
      }else{
      setFeedback("✅ Connected!");
      }
    } catch (error) {
      setFeedback("❌ Failed");
    }
  };

  const animateConnect = () => {
    setCardOffset(500);
    setFeedback("❤️ Connected!");
    setTimeout(() => {
      if (currentUser.id) connectWithUser(currentUser.id);
      nextCard();
    }, 400);
  };

  const animatePass = () => {
    setCardOffset(-500);
    setFeedback("👋 Passed");
    setTimeout(() => nextCard(), 400);
  };

  const nextCard = () => {
    setCurrentIndex(prev => prev + 1);
    setCardOffset(0);
    setFeedback("");
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
  if (aiMatches.length > 0) {
    const filtered = aiMatches.filter(user => !connectedUsers.includes(user.id));
    setAiMatchesFiltered(filtered);
  }
}, [aiMatches,connectedUsers]);

  // Early returns
  if (loading) return (
    <div className="h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center p-8">
      <div className="text-white text-2xl font-bold text-center">Loading users...</div>
    </div>
  );

  if (users.length === 0) return (
    <div className="h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex flex-col items-center justify-center p-8 gap-6 text-white">
      <div className="text-6xl">😔</div>
      <h2 className="text-3xl font-bold text-center">No users found</h2>
      <button onClick={fetchUsers} className="px-12 py-4 bg-white text-blue-600 rounded-2xl font-bold text-xl shadow-2xl hover:bg-blue-50 transition-all">
        🔄 Try Again
      </button>
    </div>
  );

  if (currentIndex >= users.length) return (
    <div className="h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex flex-col items-center justify-center p-8 gap-6 text-white">
      <div className="text-6xl">🎉</div>
      <h2 className="text-3xl font-bold text-center">No more users!</h2>
      <button onClick={() => setCurrentIndex(0)} className="px-12 py-4 bg-white text-blue-600 rounded-2xl font-bold text-xl shadow-2xl hover:bg-blue-50 transition-all">
        🔄 Restart
      </button>
    </div>
  );

  return (
    <div className="h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex flex-col overflow-hidden animate-fade-in">
      
      {/* HEADER - SMALLER */}
      <div className="px-6 pt-4 pb-2 text-center z-10 flex-shrink-0">
        <h1 className="text-3xl font-black bg-gradient-to-r from-white to-gray-200 bg-clip-text text-transparent drop-shadow-xl">
          Discover
        </h1>
        <div className="w-48 h-1.5 mx-auto mt-2 bg-white/40 rounded-full overflow-visible shadow-md">
          <div 
            className="h-full bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full shadow-md transition-all duration-1000"
            style={{ width: `${((currentIndex + 1) / users.length) * 100}%` }}
          />
        </div>
      </div>
      {/* AI CHATBOT - ALWAYS VISIBLE */}
      <div className="fixed bottom-6 right-6 z-50 w-80">
        <div className="bg-gradient-to-b from-slate-900/95 to-slate-800/95 backdrop-blur-2xl 
                        p-6 rounded-3xl shadow-2xl border-2 border-white/20 hover:shadow-emerald-500/40 
                        hover:border-emerald-400/50 transition-all duration-300">
    
       {/* Header - Dynamic message */}
      <div className="flex items-center gap-3 mb-5 pb-4 border-b border-white/10">
        <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-blue-600 
                        rounded-2xl flex items-center justify-center shadow-xl border-4 border-white/20">
          <span className="text-xl font-bold">🤖</span>
        </div>
      <div>
        <h4 className="text-lg font-black text-white drop-shadow-md">AI City Discover</h4>
        <p className="text-emerald-400 text-xs font-semibold">
          {aiMatchesFiltered.length > 0 
            ? `${aiMatchesFiltered.length} new in your city` 
            : 'Finding new users...'
          }
        </p>
      </div>
    </div>
    {/* 🔥 COMPLETE FIXED AI SECTION - REPLACE LINES 200-260 */}
    {aiMatches.length > 0 ? (
      <div className="space-y-3 max-h-64 overflow-y-auto pr-2 mb-4">
        {aiMatchesFiltered.slice(0, 5).map((user) => (
          <div 
            key={user.id} 
            className="group bg-gradient-to-r from-white/10 to-white/5 p-4 rounded-2xl 
                       hover:from-emerald-500/10 hover:to-teal-500/10 border border-white/20 
                       hover:border-emerald-400/50 transition-all duration-200 cursor-default"  // ✅ cursor-default!
          >
            <div className="flex items-center gap-3">
              {/* Profile Image - NOT clickable */}
              <div className="w-12 h-12 rounded-2xl overflow-hidden shadow-xl ring-2 ring-white/30 flex-shrink-0">
                <img 
                  src={`http://127.0.0.1:8000${user.profile_picture || ""}`} 
                  alt={user.username}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                  onError={(e) => e.target.src = `https://ui-avatars.com/api/?name=${user.username}&size=48&background=667EEA&color=fff`}
                />
              </div>
          
              {/* Info - NOT clickable */}
              <div className="flex-1 min-w-0">
                <div className="font-bold text-white text-sm truncate">{user.username}</div>
                <div className="text-emerald-300 text-xs">{user.city}</div>
                <div className="text-gray-300 text-xs">{formatTime(user.hours_ago)}</div>
              </div>
          
              {/* ✅ ONLY THIS BUTTON clickable */}
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();  // ✅ Block ALL parent events
                  connectWithUser(user.id, true);
                }}
                className="ml-auto bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 
                       text-white px-5 py-2 rounded-xl font-bold text-sm shadow-lg hover:shadow-emerald-500/50 
                       transition-all duration-200 hover:scale-[1.05] active:scale-[0.98]"
              >
                Connect
              </button>
            </div>
        
          <div className="mt-2 ml-15 px-3 py-1 bg-emerald-500/90 rounded-full w-fit">
            <span className="text-xs font-bold text-white">NEW</span>
          </div>
        </div>
      ))}
    </div>
  ) : (
  <div className="text-center py-8">
    <div className="text-4xl mb-3">🔍</div>
    <p className="text-white/70 text-sm mb-4">No new users in your city yet</p>
    <button 
      onClick={fetchAIMatches}
      className="bg-blue-600/80 hover:bg-blue-700 text-white px-6 py-2 rounded-xl text-xs font-bold"
    >
      🔄 Refresh
    </button>
  </div>
)}



    {/* Auto-Connect Button - Dynamic */}
    <button 
      onClick={autoConnectAI}
      className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 ...">
      {aiMatchesFiltered.length > 0 
        ? `🤖 AI Auto-Connect ${aiMatchesFiltered.length}`
        : '🔄 Find City Matches'
      }
    </button>
  </div>
</div>


      {/* CARD - FLEXIBLE HEIGHT */}
      <div className="flex-1 flex items-center justify-center px-4 py-4 relative min-h-0">
        <div
          className="relative w-full max-w-sm h-[420px] bg-gradient-to-br from-white/30 via-white/20 to-white/10 
                   backdrop-blur-xl rounded-3xl shadow-2xl border border-white/40 flex flex-col items-center 
                   justify-center p-8 cursor-default z-20 hover:shadow-[0_25px_50px_rgba(0,0,0,0.3)] transition-all duration-500"
          style={{
            transform: `translateX(${cardOffset}px) rotate(${cardOffset * 0.005}deg)`,
          }}
        >
          {/* Profile Image */}
          <div className="w-34 h-34 rounded-full border-6 border-white/90 shadow-2xl mb-6 overflow-hidden ring-4 ring-white/50">
            <img 
              src={currentUser.profile_picture || "https://via.placeholder.com/120/667EEA/FFFFFF?text=👤"} 
              className="w-full h-full object-cover"
              alt="Profile"
            />
          </div>

          {/* Username */}
          <h2 className="text-3xl font-black text-white mb-3 text-center drop-shadow-2xl">
            {currentUser.username || 'Someone'}
          </h2>

          {/* Details */}
          <div className="text-center mb-6">
            <p className="text-xl font-bold text-white/95 mb-1 drop-shadow-xl">
              {currentUser.age || '?'} 
            </p>
            <p className="text-lg text-white/90 drop-shadow-lg">
              {currentUser.city || 'Nearby'}
            </p>
          </div>

         {/* BIO - FULLY VISIBLE */}
          <div className="text-center px-3">
            <p className="text-lg text-white/90 leading-relaxed drop-shadow-xl font-medium max-h-28 overflow-auto scrollbar-thin scrollbar-thumb-white/30 scrollbar-track-transparent">
              "{currentUser.bio || 'Ready to make new connections and meet interesting people! 👋'}"
            </p>
          </div>
        </div>

        {/* Background cards */}
        <div className="absolute w-64 h-[380px] bg-white/20 rounded-3xl blur-sm scale-95 -z-10" />
        <div className="absolute w-72 h-[410px] bg-white/10 rounded-3xl blur-xl scale-90 -z-20" />
      </div>

      {/* FEEDBACK */}
      {feedback && (
        <div className="px-6 pb-6 flex-shrink-0 z-30">
          <div className="bg-black/60 backdrop-blur-xl px-8 py-4 rounded-2xl text-white font-bold text-xl text-center shadow-2xl border border-white/40 mx-4">
            {feedback}
          </div>
        </div>
      )}

      {/* BUTTONS - FULL WIDTH VISIBLE */}
      <div className="px-8 pb-8 flex gap-12 justify-center flex-shrink-0 z-50">
        <button
          onClick={animatePass}
          className="w-20 h-20 bg-gradient-to-br from-rose-500/60 to-red-600/80 hover:from-rose-500/80 hover:to-red-600/100 
                   text-rose-100 font-black text-3xl rounded-2xl shadow-xl hover:shadow-rose-500/50 border-3 border-rose-400/70 
                   backdrop-blur-xl transition-all duration-200 hover:scale-110 active:scale-105 hover:-rotate-12 flex-shrink-0"
        >
          ✕
        </button>
        
        <button
          onClick={animateConnect}
          className="w-20 h-20 bg-gradient-to-br from-emerald-500/95 to-teal-600 hover:from-emerald-600 hover:to-teal-700 
                   text-white font-black text-3xl rounded-2xl shadow-2xl hover:shadow-emerald-500/50 border-3 border-emerald-400/70 
                   backdrop-blur-xl transition-all duration-200 hover:scale-110 active:scale-105 hover:rotate-12 flex-shrink-0"
        >
          ❤️
        </button>
      </div>
    </div>
  );
}

