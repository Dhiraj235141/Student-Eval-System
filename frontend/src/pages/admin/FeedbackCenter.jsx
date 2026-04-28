import { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  MessageSquare, User, Calendar, Mail, 
  Search, CheckCircle2, AlertTriangle, 
  Bug, Lightbulb, Heart, Shield, RefreshCw,
  X, Send, ChevronRight, UserCircle
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminFeedbackCenter() {
  const [feedbacks, setFeedbacks] = useState([]);
  const [filteredFeedbacks, setFilteredFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All'); 
  const [search, setSearch] = useState('');
  
  // Reply Modal State
  const [replyOpen, setReplyOpen] = useState(false);
  const [selectedFeedback, setSelectedFeedback] = useState(null);
  const [replyMessage, setReplyMessage] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);

  const fetchFeedbacks = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/feedback');
      setFeedbacks(res.data.feedbacks);
      setFilteredFeedbacks(res.data.feedbacks);
    } catch (err) {
      toast.error('Failed to load feedback');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeedbacks();
  }, []);

  useEffect(() => {
    let result = feedbacks;
    if (filter !== 'All') {
      const role = filter === 'Faculty' ? 'faculty' : 'student';
      result = result.filter(f => f.user?.role === role);
    }
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(f => 
        f.subject.toLowerCase().includes(q) || 
        f.message.toLowerCase().includes(q) || 
        f.user?.name.toLowerCase().includes(q)
      );
    }
    setFilteredFeedbacks(result);
  }, [filter, search, feedbacks]);

  const handleReplyClick = (f) => {
    setSelectedFeedback(f);
    setReplyMessage('');
    setReplyOpen(true);
  };

  const submitReply = async () => {
    if (!replyMessage.trim()) {
      toast.error('Reply cannot be empty');
      return;
    }
    setSubmittingReply(true);
    try {
      await axios.post(`/feedback/${selectedFeedback._id}/reply`, { replyMessage });
      toast.success(`Reply sent to ${selectedFeedback.user?.name}`);
      setReplyOpen(false);
      fetchFeedbacks(); // Refresh to show resolved status
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send reply');
    } finally {
      setSubmittingReply(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-in relative">
      {/* Search & Stats Banner */}
      <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <MessageSquare className="text-blue-600" size={24} /> Feedback Center
          </h1>
          <p className="text-gray-400 text-sm mt-1">Manage responses from the academic community</p>
        </div>
        
        <div className="flex bg-gray-50/50 p-1 rounded-2xl border border-gray-100 overflow-x-auto no-scrollbar">
          {['All', 'Student', 'Faculty'].map(t => (
            <button key={t} onClick={() => setFilter(t)}
              className={`px-3 sm:px-6 py-2 rounded-xl text-[10px] sm:text-xs font-bold transition-all uppercase tracking-wider whitespace-nowrap
                ${filter === t ? 'bg-blue-600 text-white shadow-md' : 'text-gray-500 hover:text-gray-800'}`}>
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="relative group max-w-2xl mx-auto">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500" size={18} />
        <input type="text" placeholder="Quick search messages..." value={search} onChange={e => setSearch(e.target.value)}
          className="w-full pl-12 pr-4 py-4 bg-white border border-gray-100 rounded-2xl outline-none focus:border-blue-500 shadow-sm text-sm" />
      </div>

      {/* Message List */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden min-h-[400px]">
        {loading ? (
          <div className="py-32 flex flex-col items-center justify-center text-gray-400">
            <RefreshCw className="animate-spin mb-4 text-blue-500" size={32} />
            <p className="font-medium">Loading feedback inbox...</p>
          </div>
        ) : filteredFeedbacks.length > 0 ? (
          <div className="divide-y divide-gray-50">
            {filteredFeedbacks.map((f) => (
              <div key={f._id} className={`group flex flex-col lg:flex-row lg:items-center gap-4 p-5 hover:bg-slate-50 transition-colors relative
                ${f.status === 'Resolved' ? 'opacity-70' : ''}`}>
                
                <div className={`absolute top-0 left-0 bottom-0 w-1 ${f.user?.role === 'faculty' ? 'bg-indigo-500' : 'bg-emerald-500'}`} />

                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold flex-shrink-0 shadow-sm ${f.user?.role === 'faculty' ? 'bg-indigo-500' : 'bg-emerald-500'}`}>
                  {f.user?.name?.charAt(0).toUpperCase()}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <span className="font-bold text-gray-800 text-sm truncate">{f.user?.name}</span>
                    <span className="text-[10px] font-bold bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full uppercase truncate max-w-[100px]">
                      {f.user?.role === 'faculty' ? 'Faculty' : 'Student'}
                    </span>
                    {f.status === 'Resolved' && (
                      <span className="text-[10px] font-bold bg-emerald-100 text-emerald-600 px-2 py-0.5 rounded-full uppercase">Resolved</span>
                    )}
                    <span className="text-[10px] text-gray-400 ml-auto whitespace-nowrap">{new Date(f.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <h3 className={`text-sm font-bold truncate ${f.status === 'Pending' ? 'text-gray-900' : 'text-gray-500'}`}>{f.subject}</h3>
                    <span className="text-gray-300">•</span>
                    <p className="text-xs text-gray-400 truncate">{f.message}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 lg:opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => handleReplyClick(f)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 shadow-lg shadow-blue-500/20 active:scale-95 transition-all">
                    <Mail size={14} /> Reply
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-24 flex flex-col items-center justify-center text-gray-400">
            <MessageSquare size={48} className="text-gray-100 mb-4" />
            <p className="font-bold text-gray-600">Your inbox is empty</p>
          </div>
        )}
      </div>

      {/* Reply Modal */}
      {replyOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-6 border-b border-gray-50 flex items-center justify-between bg-gray-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg">
                  <Send size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-gray-800">Direct Reply</h3>
                  <p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest">To: {selectedFeedback?.user?.email}</p>
                </div>
              </div>
              <button onClick={() => setReplyOpen(false)} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                <X size={20} className="text-gray-400" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <p className="text-[10px] font-bold text-gray-400 uppercase mb-2">Original Feedback</p>
                <p className="text-sm text-gray-600 italic leading-relaxed">"{selectedFeedback?.message}"</p>
              </div>

              <div className="space-y-3">
                <label className="text-xs font-bold text-gray-700 flex items-center gap-2">
                   Message for {selectedFeedback?.user?.name.split(' ')[0]}
                </label>
                <textarea rows={6} value={replyMessage} onChange={e => setReplyMessage(e.target.value)}
                  placeholder="Type your response here..."
                  className="w-full p-5 bg-gray-50 border-gray-100 border-2 rounded-2xl focus:bg-white focus:border-blue-500 outline-none transition-all text-sm font-medium resize-none" />
              </div>

              <div className="flex gap-4 pt-2">
                <button onClick={() => setReplyOpen(false)} className="flex-1 py-4 bg-gray-100 text-gray-500 rounded-2xl font-bold hover:bg-gray-200 transition-all text-sm">Cancel</button>
                <button onClick={submitReply} disabled={submittingReply}
                  className="flex-[2] py-4 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 shadow-xl shadow-blue-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 text-sm">
                  {submittingReply ? <RefreshCw className="animate-spin" size={18} /> : <Send size={18} />}
                  {submittingReply ? 'Sending...' : 'Send Direct Reply'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
