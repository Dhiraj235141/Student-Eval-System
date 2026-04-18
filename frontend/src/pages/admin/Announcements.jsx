import { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Megaphone, Plus, Send, Loader, Bell, Trash2, Edit2, X } from 'lucide-react';

export default function AdminAnnouncements() {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ title: '', body: '' });

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = () => {
    axios.get('/admin/announcements').catch(() => ({ data: { announcements: [] } }))
      .then(r => setAnnouncements(r.data?.announcements || []))
      .finally(() => setLoading(false));
  };

  const saveAnnouncement = async (e) => {
    e.preventDefault();
    if (!form.title || !form.body) { toast.error('Title and message required'); return; }
    setSending(true);
    try {
      if (editId) {
        await axios.put(`/admin/announcements/${editId}`, form);
        toast.success('Announcement updated!');
      } else {
        await axios.post('/admin/announcements', form);
        toast.success('Announcement sent to all faculty! 📢');
      }
      setForm({ title: '', body: '' });
      setShowForm(false);
      setEditId(null);
      fetchAnnouncements();
    } catch (err) { toast.error('Failed to save announcement'); }
    finally { setSending(false); }
  };

  const deleteAnnouncement = async (id) => {
    if (!window.confirm('Delete this announcement?')) return;
    try {
      await axios.delete(`/admin/announcements/${id}`);
      setAnnouncements(prev => prev.filter(a => a._id !== id));
      toast.success('Deleted announcement');
    } catch (err) {
      toast.error('Failed to delete');
    }
  };

  const startEdit = (a) => {
    setEditId(a._id);
    setForm({ title: a.title, body: a.body });
    setShowForm(true);
  };

  const cancelForm = () => {
    setShowForm(false);
    setEditId(null);
    setForm({ title: '', body: '' });
  };

  return (
    <div className="space-y-6">
      <div className="card">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-pink-500 rounded-xl flex items-center justify-center shadow-sm">
              <Megaphone size={20} className="text-white" />
            </div>
            <div>
              <h1 className="font-bold text-gray-800 text-lg">Announcements</h1>
              <p className="text-xs text-gray-400">Send system-wide announcements to faculty</p>
            </div>
          </div>
          <button onClick={() => setShowForm(!showForm)} className="btn-primary flex items-center gap-2 text-sm shadow-md">
            {showForm ? <X size={16} /> : <Plus size={16} />}{showForm ? 'Cancel' : 'New Announcement'}
          </button>
        </div>
      </div>

      {showForm && (
        <form onSubmit={saveAnnouncement} className="card space-y-4 animate-fade-in border-t-4 border-t-purple-500">
          <h2 className="font-semibold text-gray-800 flex items-center gap-2">
            <Bell size={16} className="text-purple-600" />{editId ? 'Edit Announcement' : 'New System Announcement'}
          </h2>
          <input className="input" placeholder="Title *" value={form.title} onChange={e => setForm({...form, title: e.target.value})} required />
          <textarea className="input resize-none" rows={4} placeholder="Enter announcement message..." value={form.body} onChange={e => setForm({...form, body: e.target.value})} required />
          <div className="flex gap-3">
            <button type="button" onClick={cancelForm} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={sending} className="btn-primary flex-1 flex items-center justify-center gap-2 shadow-sm">
              {sending ? <Loader size={16} className="animate-spin" /> : <Send size={16} />}
              {sending ? 'Saving...' : editId ? 'Update Announcement' : 'Send to All Faculty'}
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="flex justify-center py-16"><Loader size={24} className="animate-spin text-purple-600" /></div>
      ) : announcements.length === 0 ? (
        <div className="card text-center py-16">
          <Megaphone size={40} className="text-gray-200 mx-auto mb-3" />
          <p className="text-gray-400">No announcements sent yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {announcements.map(a => (
            <div key={a._id} className="card border-l-4 border-l-purple-500 hover:border-l-purple-600 transition-all group">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-800">{a.title}</h3>
                  <p className="text-sm text-gray-600 mt-1 leading-relaxed whitespace-pre-wrap">{a.body}</p>
                  <p className="text-xs text-gray-400 mt-2">{new Date(a.createdAt).toLocaleString()}</p>
                </div>
                <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2">
                  <button onClick={() => startEdit(a)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded bg-gray-50 transition-colors"><Edit2 size={14} /></button>
                  <button onClick={() => deleteAnnouncement(a._id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded bg-gray-50 transition-colors"><Trash2 size={14} /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
