import { useState, useEffect } from 'react';
import axios from 'axios';
import { BellIcon } from '@heroicons/react/24/outline';

const NotificationBadge = ({ token }) => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchCount = async () => {
    if (!token) return;
    try {
      const res = await axios.get('http://127.0.0.1:8000/api/chat/notification-count/', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUnreadCount(res.data.unread_count);
    } catch (err) {
      console.error('Badge error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCount();
    const interval = setInterval(fetchCount, 3000); // Poll every 3s
    return () => clearInterval(interval);
  }, [token]);

  return (
    <div className="relative">
      <BellIcon className="w-8 h-8 text-white hover:text-gray-200 cursor-pointer p-2 rounded-full hover:bg-white/20 transition-all" />
      
      {unreadCount > 0 && (
        <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold shadow-lg animate-pulse">
          {unreadCount > 99 ? '99+' : unreadCount}
        </div>
      )}
    </div>
  );
};

export default NotificationBadge;