import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Bell, Check, CheckCheck, Trash2, X, BookOpen, ClipboardList, TrendingUp, AlertTriangle, Info, Megaphone } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const typeConfig = {
  new_assignment: { icon: BookOpen, color: 'text-blue-500', bg: 'bg-blue-50' },
  assignment: { icon: BookOpen, color: 'text-blue-600', bg: 'bg-blue-100' },
  assignment_deadline: { icon: AlertTriangle, color: 'text-orange-500', bg: 'bg-orange-50' },
  test_result: { icon: TrendingUp, color: 'text-green-500', bg: 'bg-green-50' },
  test: { icon: ClipboardList, color: 'text-purple-600', bg: 'bg-purple-100' },
  new_test: { icon: ClipboardList, color: 'text-purple-500', bg: 'bg-purple-50' },
  attendance: { icon: Check, color: 'text-emerald-500', bg: 'bg-emerald-50' },
  late_submission: { icon: AlertTriangle, color: 'text-red-500', bg: 'bg-red-50' },
  general: { icon: Info, color: 'text-gray-500', bg: 'bg-gray-50' },
  announcement: { icon: Megaphone, color: 'text-pink-500', bg: 'bg-pink-50' }
};

export default function NotificationPanel() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [selectedNotif, setSelectedNotif] = useState(null);
  const panelRef = useRef(null);

  useEffect(() => {
    fetchNotifications();
    // Poll every 30 seconds for new notifications
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClick = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await axios.get('/notifications');
      setNotifications(res.data.notifications);
      setUnreadCount(res.data.unreadCount);
    } catch (err) { /* silent fail */ }
  };

  const markRead = async (id) => {
    try {
      await axios.put(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) { /* silent fail */ }
  };

  const handleNotifClick = async (n) => {
    if (!n.isRead) {
      await markRead(n._id);
    }
    // Only open the modal if we are picking a specific notification details
    setSelectedNotif(n);
  };

  const markAllRead = async () => {
    await axios.put('/notifications/read-all');
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    setUnreadCount(0);
  };

  const deleteNotif = async (id, e) => {
    e.stopPropagation();
    await axios.delete(`/notifications/${id}`);
    setNotifications(prev => prev.filter(n => n._id !== id));
  };

  return (
    <div className="relative" ref={panelRef}>
      <button onClick={() => setOpen(!open)}
        className="p-2 rounded-lg hover:bg-secondary text-gray-500 relative transition-colors">
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 rounded-full text-white text-xs flex items-center justify-center font-bold">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-11 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <Bell size={16} className="text-primary" />
              <span className="font-semibold text-sm text-gray-800">Notifications</span>
              {unreadCount > 0 && <span className="bg-primary text-white text-xs px-1.5 py-0.5 rounded-full">{unreadCount}</span>}
            </div>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button onClick={markAllRead} title="Mark all read"
                  className="p-1.5 hover:bg-secondary rounded-lg text-gray-400 transition-colors">
                  <CheckCheck size={14} />
                </button>
              )}
              <button onClick={() => setOpen(false)} className="p-1.5 hover:bg-secondary rounded-lg text-gray-400">
                <X size={14} />
              </button>
            </div>
          </div>

          {/* Notification list */}
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-gray-300">
                <Bell size={32} />
                <p className="text-sm mt-2">No notifications yet</p>
              </div>
            ) : (
              notifications.map(n => {
                const cfg = typeConfig[n.type] || typeConfig.general;
                const Icon = cfg.icon;
                return (
                  <div key={n._id} onClick={() => handleNotifClick(n)}
                    className={`flex items-start gap-3 px-4 py-3 border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition-colors
                      ${!n.isRead ? 'bg-blue-50/50' : ''}`}>
                    <div className={`w-8 h-8 ${cfg.bg} rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5`}>
                      <Icon size={14} className={cfg.color} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={`text-xs font-semibold text-gray-800 leading-tight ${!n.isRead ? 'font-bold' : ''}`}>{n.title}</p>
                        <button onClick={(e) => deleteNotif(n._id, e)}
                          className="flex-shrink-0 p-0.5 hover:text-red-500 text-gray-300 transition-colors"
                          title="Delete notification">
                          <X size={14} strokeWidth={2.5} />
                        </button>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5 leading-tight">{n.message}</p>
                      <p className="text-xs text-gray-300 mt-1">
                        {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                    {!n.isRead && <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0 mt-1.5" />}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Full Detail Modal */}
      {selectedNotif && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={() => setSelectedNotif(null)}>
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden animate-fade-in" onClick={e => e.stopPropagation()}>
            <div className={`px-5 py-4 border-b border-gray-100 flex items-center justify-between ${(typeConfig[selectedNotif.type] || typeConfig.general).bg}`}>
              <div className="flex items-center gap-2">
                {(() => {
                  const cfg = typeConfig[selectedNotif.type] || typeConfig.general;
                  const Icon = cfg.icon;
                  return <Icon size={18} className={cfg.color} />;
                })()}
                <span className="font-semibold text-gray-800 text-sm">Notification Details</span>
              </div>
              <button onClick={() => setSelectedNotif(null)} className="p-1 hover:bg-white/50 rounded-lg text-gray-500 transition-colors">
                <X size={18} />
              </button>
            </div>
            
            <div className="p-6">
              <h3 className="font-bold text-gray-800 text-lg mb-2">{selectedNotif.title}</h3>
              <p className="text-gray-600 leading-relaxed whitespace-pre-wrap text-sm">{selectedNotif.message}</p>
              
              <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between">
                <p className="text-xs text-gray-400">
                  Received {formatDistanceToNow(new Date(selectedNotif.createdAt), { addSuffix: true })}
                </p>
                <button onClick={() => setSelectedNotif(null)} className="btn-secondary text-sm py-1.5 px-4">
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
