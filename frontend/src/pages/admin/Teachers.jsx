import { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Users, Plus, ToggleLeft, ToggleRight, Edit2, BookOpen, X, Check, Trash2 } from 'lucide-react';

export default function AdminTeachers() {
  const [teachers, setTeachers] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ email: '', password: '', name: '', department: '' });

  useEffect(() => {
    fetchTeachers();
    axios.get('/admin/subjects').then(r => setSubjects(r.data.subjects));
  }, []);

  const fetchTeachers = async () => {
    const res = await axios.get('/admin/users?role=teacher');
    setTeachers(res.data.users);
  };

  const saveFaculty = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editId) {
        // Prepare update payload. Only send password if it's filled.
        const payload = { name: form.name, email: form.email, department: form.department };
        if (form.password) payload.password = form.password;
        await axios.put(`/admin/users/${editId}`, payload);
        toast.success('Faculty updated!');
      } else {
        await axios.post('/admin/users', { ...form, role: 'teacher' });
        toast.success('Faculty created!');
      }
      setShowForm(false);
      setEditId(null);
      setForm({ email: '', password: '', name: '', department: '' });
      fetchTeachers();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setLoading(false); }
  };

  const startEdit = (t) => {
    setEditId(t._id);
    setForm({ email: t.email, password: '', name: t.name, department: t.department || '' });
    setShowForm(true);
  };

  const toggleUser = async (id) => {
    await axios.put(`/admin/users/${id}/toggle`);
    fetchTeachers();
    toast.success('Status updated');
  };

  const deleteTeacher = async (id) => {
    if (!window.confirm('Are you sure you want to permanently delete this faculty member? This cannot be undone and will detach them from their subjects.')) return;
    try {
      await axios.delete(`/admin/users/${id}`);
      toast.success('Faculty permanently deleted');
      fetchTeachers();
      axios.get('/admin/subjects').then(r => setSubjects(r.data.subjects));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete faculty');
    }
  };

  const assignSubject = async (teacherId, subjectId) => {
    try {
      await axios.post('/admin/assign-subject', { teacherId, subjectId });
      toast.success('Subject assigned!');
      fetchTeachers();
      axios.get('/admin/subjects').then(r => setSubjects(r.data.subjects));
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to assign'); }
  };

  const removeSubject = async (teacherId, subjectId) => {
    try {
      await axios.post('/admin/remove-subject', { teacherId, subjectId });
      toast.success('Subject removed');
      fetchTeachers();
      axios.get('/admin/subjects').then(r => setSubjects(r.data.subjects));
    } catch (err) { toast.error('Failed to remove'); }
  };

  const unassignedSubjects = subjects.filter(s => !s.teacher);

  return (
    <div className="space-y-6">
      <div className="card">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl flex items-center justify-center">
              <Users size={20} className="text-white" />
            </div>
            <div>
              <h1 className="font-bold text-gray-800 text-lg">Faculty</h1>
              <p className="text-xs text-gray-400">Manage faculty and subject assignments</p>
            </div>
          </div>
          <button onClick={() => { setShowForm(!showForm); setEditId(null); setForm({ email: '', password: '', name: '', department: '' }); }} className="btn-primary flex items-center gap-2 text-sm">
            <Plus size={16} />{showForm && !editId ? 'Cancel' : 'Add Faculty'}
          </button>
        </div>
      </div>

      {showForm && (
        <form onSubmit={saveFaculty} className="card space-y-4">
          <h2 className="font-semibold text-gray-800">{editId ? 'Edit Faculty' : 'New Faculty'}</h2>
          <div className="grid grid-cols-2 gap-3">
            <input className="input" type="email" placeholder="Email *" value={form.email} onChange={e => setForm({...form, email: e.target.value})} required />
            <input className="input" type="password" placeholder={`Password ${editId ? '(leave blank to keep)' : '(min 6 chars) *'}`} value={form.password} onChange={e => setForm({...form, password: e.target.value})} minLength={editId && !form.password ? 0 : 6} required={!editId} />
            <input className="input" placeholder="Full Name *" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
            <input className="input" placeholder="Department *" value={form.department} onChange={e => setForm({...form, department: e.target.value})} required />
          </div>
          <div className="flex gap-3">
            <button type="submit" disabled={loading} className="btn-primary flex-1">{loading ? 'Saving...' : (editId ? 'Update Faculty' : 'Create Faculty')}</button>
            <button type="button" onClick={() => { setShowForm(false); setEditId(null); }} className="btn-secondary flex-1">Cancel</button>
          </div>
        </form>
      )}

      <div className="space-y-4">
        {teachers.map(t => (
          <div key={t._id} className="card">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                  {t.name?.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-gray-800">{t.name}</p>
                  <p className="text-xs text-gray-400">{t.email} {t.department && `• ${t.department}`}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${t.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-500'}`}>
                  {t.isActive ? 'Active' : 'Inactive'}
                </span>
                <button onClick={() => toggleUser(t._id)}>
                  {t.isActive ? <ToggleRight size={22} className="text-blue-600" /> : <ToggleLeft size={22} className="text-gray-300" />}
                </button>
                <div className="h-4 w-px bg-gray-200 mx-1"></div>
                <button onClick={() => startEdit(t)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Edit Faculty">
                  <Edit2 size={16} />
                </button>
                <button onClick={() => deleteTeacher(t._id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete Faculty">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>

            {/* Assigned subjects */}
            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                <BookOpen size={11} />Assigned Subjects
              </p>
              <div className="flex flex-wrap gap-2 mb-3">
                {t.subjects?.length > 0 ? t.subjects.map(s => (
                  <div key={s._id} className="flex items-center gap-1.5 bg-blue-50 text-blue-700 px-3 py-1 rounded-lg text-xs font-medium">
                    {s.name} <span className="opacity-60">({s.code})</span>
                    <button onClick={() => removeSubject(t._id, s._id)} className="text-blue-400 hover:text-red-500 transition-colors ml-1">
                      <X size={11} />
                    </button>
                  </div>
                )) : <span className="text-xs text-gray-400">No subjects assigned</span>}
              </div>

              {/* Assign subjects dropdown */}
              {unassignedSubjects.length > 0 && (
                <div className="flex gap-2">
                  <select className="input text-sm py-1.5 flex-1" defaultValue=""
                    onChange={e => { if (e.target.value) { assignSubject(t._id, e.target.value); e.target.value = ''; } }}>
                    <option value="">+ Assign a subject</option>
                    {unassignedSubjects.map(s => (
                      <option key={s._id} value={s._id}>{s.name} ({s.code}) — {s.class}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>
        ))}
        {teachers.length === 0 && (
          <div className="card text-center py-12">
            <Users size={36} className="text-gray-200 mx-auto mb-2" />
            <p className="text-gray-400">No faculty members yet. Add one above.</p>
          </div>
        )}
      </div>
    </div>
  );
}
