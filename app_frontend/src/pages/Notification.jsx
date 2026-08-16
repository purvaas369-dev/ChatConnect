import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { UserCircleIcon } from '@heroicons/react/24/outline';

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState({});
  const token = localStorage.getItem('access_token') || localStorage.getItem('access');
  const navigate = useNavigate();

  const fetchNotifications = async () => {
    try {
      const res = await axios.get('http://127.0.0.1:8000/api/chat/notifications/', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const markAllRead = async () => {
    try {
      await axios.post('http://127.0.0.1:8000/api/chat/notifications/read/', 
        {}, 
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchNotifications();
    } catch (err) {
      console.error(err);
    }
  };

const acceptConnectRequest = async (notification) => {  // 👈 Pass WHOLE notification
  console.log("🔥 Full notification:", notification);
  
  const senderId = notification.sender_id;  // 👈 Extract from object
  
  if (!senderId) {
    alert(`❌ No sender_id! Debug: ${JSON.stringify(notification)}`);
    return;
  }
  
  setActionLoading(prev => ({ ...prev, [notification.id]: true }));
  
  try {
    const res = await axios.post(
      'http://127.0.0.1:8000/api/chat/create-room/',
      { other_user_id: senderId },
      { 
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        } 
      }
    );
    
    console.log("✅ Room created:", res.data);
    
    // Mark notification read
    await axios.post(
      `http://127.0.0.1:8000/api/chat/notifications/${notification.id}/read/`,
      {}, 
      { headers: { Authorization: `Bearer ${token}` } }
    );
    
    navigate(`/chat/${res.data.room_id}`);
    
  } catch (err) {
    console.error("❌ Error:", err.response?.data || err.message);
    alert('Failed to accept');
  } finally {
    setActionLoading(prev => ({ ...prev, [notification.id]: false }));
    fetchNotifications();
  }
};

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 3000);
    return () => clearInterval(interval);
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-xl text-gray-500 animate-pulse">Loading notifications...</div>
      </div>
    );
  }

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-2xl mx-auto p-6">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-8 pb-6 border-b border-gray-200">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-1">🔔 Notifications</h1>
            <p className="text-gray-600">
              {unreadCount > 0 ? `${unreadCount} unread` : 'You\'re all caught up!'}
            </p>
          </div>
          
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              className="px-6 py-2 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 shadow-md transition-all transform hover:-translate-y-0.5"
            >
              Mark All Read
            </button>
          )}
        </div>

        {/* Empty State */}
        {notifications.length === 0 ? (
          <div className="text-center py-24">
            <div className="w-24 h-24 bg-blue-100 rounded-2xl mx-auto mb-6 flex items-center justify-center text-3xl">
              🔔
            </div>
            <h2 className="text-2xl font-semibold text-gray-700 mb-2">No notifications</h2>
            <p className="text-gray-500 text-lg">New messages and requests will appear here</p>
          </div>
        ) : (
          <div className="space-y-4">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-6 rounded-2xl shadow-md hover:shadow-lg transition-all border-l-4 ${
                  !notification.is_read
                    ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border-l-blue-500'
                    : 'bg-white border-gray-200 border-l-gray-300'
                }`}
              >
                <div className="flex items-start space-x-4">
                  
                  {/* Profile Pic */}
                  <div className="w-16 h-16 rounded-2xl overflow-hidden shadow-xl ring-3 ring-white/50 flex-shrink-0 cursor-pointer hover:scale-105 transition-all" 
                      onClick={() => navigate(`/profile/${notification.sender_id}`)}>
                    {notification.profile_picture ? (
                    <img 
                        src={`http://127.0.0.1:8000${notification.profile_picture}`} 
                        alt={notification.sender_name}
                        className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center text-2xl font-bold text-gray-600">
                      {notification.sender_name?.slice(0,2).toUpperCase() || 'U'}
                    </div>
                  )}
                </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-gray-800 text-lg">
                        {notification.sender_name || 'Someone'}
                      </h3>
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                        !notification.is_read 
                          ? 'bg-blue-100 text-blue-800' 
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {notification.is_read ? 'Read' : 'New'}
                      </span>
                    </div>
                    
                    <p className="text-gray-700 leading-relaxed mb-3">
                      {notification.message}
                    </p>
                    
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <span>{new Date(notification.created_at).toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Actions */}
                    
                    
                    {['connection_request', 'ai_connection_request'].includes(notification.type) && (
                      <button
                        onClick={() => acceptConnectRequest(notification)}
                        disabled={actionLoading[notification.id]}
                        className="px-4 py-1.5 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-semibold 
                                  shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5 disabled:opacity-50"
                      >
                        {actionLoading[notification.id] ? '⏳ Creating Chat...' : '✅ Accept & Chat'}
                      </button>
                    )}
                  </div>
                </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}