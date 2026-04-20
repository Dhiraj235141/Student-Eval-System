import { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { BookOpen, Plus, Edit2, Trash2, Users, X } from 'lucide-react';

const YEARS = ['First Year', 'Second Year', 'Third Year'];

export default function AdminSubjects() {
  const [subjects, setSubjects] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: '', code: '', class: '', teacherId: '' });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const [subRes, teacherRes] = await Promise.all([
      axios.get('/admin/subjects'),
      axios.get('/admin/users?role=teacher')
    ]);
    setSubjects(subRes.data.subjects);
    setTeachers(teacherRes.data.users);
  };

  const saveSubject = async (e) => {
    e.preventDefault();
    if (!form.name || !form.code) { toast.error('Name and code are required'); return; }
    setLoading(true);
    try {
      if (editId) {
        await axios.put(`/admin/subjects/${editId}`, form);
        toast.success('Subject updated!');
      } else {
        await axios.post('/admin/subjects', form);
        toast.success('Subject created!');
      }
      setShowForm(false);
      setEditId(null);
      setForm({ name: '', code: '', class: '', teacherId: '' });
      fetchData();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setLoading(false); }
  };

  const startEdit = (s) => {
    setEditId(s._id);
    setForm({ name: s.name, code: s.code, class: s.class || '', teacherId: s.teacher?._id || '' });
    setShowForm(true);
  };

  const deleteSubject = async (id) => {
    if (!window.confirm('Are you sure you want to permanently delete this subject? It will be removed from all assigned teachers and enrolled students.')) return;
    try {
      await axios.delete(`/admin/subjects/${id}`);
      toast.success('Subject permanently deleted');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete subject');
    }
  };

  return (
    <div className="space-y-6">
      <div className="card">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-purple-800 rounded-xl flex items-center justify-center">
              <BookOpen size={20} className="text-white" />
            </div>
            <div>
              <h1 className="font-bold text-gray-800 text-lg">Subjects</h1>
              <p className="text-xs text-gray-400">Create subjects and assign teachers by class/year</p>
            </div>
          </div>
          <button onClick={() => { setShowForm(!showForm); setEditId(null); setForm({ name: '', code: '', class: '', teacherId: '' }); }}
            className="btn-primary flex items-center gap-2 text-sm">
            <Plus size={16} />{showForm ? 'Cancel' : 'Add Subject'}
          </button>
        </div>
      </div>

      {showForm && (
        <form onSubmit={saveSubject} className="card space-y-4">
          <h2 className="font-semibold text-gray-800">{editId ? 'Edit Subject' : 'New Subject'}</h2>
          <div className="grid grid-cols-2 gap-3">
            <input className="input" placeholder="Subject Name *" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
            <input className="input" placeholder="Subject Code *" value={form.code} onChange={e => setForm({...form, code: e.target.value.toUpperCase()})} required />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 mb-1.5 block">Class / Group *</label>
            <select className="input" value={form.class} onChange={e => setForm({...form, class: e.target.value})}>
              <option value="">-- Select Class & Year --</option>
              {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 mb-1.5 block">Assign Teacher (optional)</label>
            <select className="input" value={form.teacherId} onChange={e => setForm({...form, teacherId: e.target.value})}>
              <option value="">-- No Teacher --</option>
              {teachers.map(t => <option key={t._id} value={t._id}>{t.name} ({t.email})</option>)}
            </select>
          </div>

          <div className="flex gap-3">
            <button type="submit" disabled={loading} className="btn-primary flex-1">{loading ? 'Saving...' : editId ? 'Update Subject' : 'Create Subject'}</button>
            <button type="button" onClick={() => { setShowForm(false); setEditId(null); }} className="btn-secondary flex-1">Cancel</button>
          </div>
        </form>
      )}

      <div className="space-y-3">
        {subjects.map(s => (
          <div key={s._id} className="card flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                {s.code}
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-gray-800 truncate">{s.name}</p>
                <p className="text-xs text-gray-400">{s.class || 'No class assigned'}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {s.teacher ? (
                <span className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-lg font-medium flex items-center gap-1">
                  <Users size={10} />{s.teacher.name}
                </span>
              ) : (
                <span className="text-xs bg-gray-50 text-gray-400 px-2 py-1 rounded-lg">Unassigned</span>
              )}
              <button onClick={() => startEdit(s)} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Edit Subject">
                <Edit2 size={15} />
              </button>
              <button onClick={() => deleteSubject(s._id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete Subject">
                <Trash2 size={15} />
              </button>
            </div>
          </div>
        ))}
        {subjects.length === 0 && (
          <div className="card text-center py-12">
            <BookOpen size={36} className="text-gray-200 mx-auto mb-2" />
            <p className="text-gray-400">No subjects yet. Create one above.</p>
          </div>
        )}
      </div>
    </div>
  );
}
