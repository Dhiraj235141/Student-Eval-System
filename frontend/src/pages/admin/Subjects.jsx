import { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { BookOpen, Plus, Edit2, Trash2, Users, ToggleLeft, ToggleRight, Filter } from 'lucide-react';

const YEARS = ['First Year', 'Second Year', 'Third Year', 'Fourth Year'];
const BRANCHES = ['Computer Science', 'Information Technology', 'Electronics', 'Mechanical', 'Civil', 'Electrical', 'Chemical', 'Other', 'All'];
const SEMESTER_TYPES = ['ODD', 'EVEN'];

export default function AdminSubjects() {
  const [subjects, setSubjects] = useState([]);
  const [faculty, setFaculty] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [semFilter, setSemFilter] = useState('ALL');
  const [activeSemester, setActiveSemester] = useState('ODD');
  const [form, setForm] = useState({ name: '', code: '', class: '', branch: ['All'], facultyId: '', semesterType: 'ODD' });
  const [branchDropdownOpen, setBranchDropdownOpen] = useState(false);

  useEffect(() => { fetchData(); }, [semFilter]);

  const fetchData = async () => {
    const [subRes, teacherRes] = await Promise.all([
      axios.get(`/admin/subjects?semesterFilter=${semFilter}`),
      axios.get('/admin/users?role=faculty')
    ]);
    setSubjects(subRes.data.subjects);
    setActiveSemester(subRes.data.activeSemester || 'ODD');
    setFaculty(teacherRes.data.users);
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
      setForm({ name: '', code: '', class: '', branch: ['All'], facultyId: '', semesterType: 'ODD' });
      fetchData();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setLoading(false); }
  };

  const startEdit = (s) => {
    setEditId(s._id);
    setForm({ 
      name: s.name, 
      code: s.code, 
      class: s.class || '', 
      branch: Array.isArray(s.branch) ? s.branch : [s.branch || 'All'], 
      facultyId: s.faculty?._id || '', 
      semesterType: s.semesterType || 'ODD' 
    });
    setShowForm(true);
  };

  const deleteSubject = async (id) => {
    if (!window.confirm('Are you sure you want to permanently delete this subject? It will be removed from all assigned faculty and enrolled students.')) return;
    try {
      await axios.delete(`/admin/subjects/${id}`);
      toast.success('Subject permanently deleted');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete subject');
    }
  };

  const toggleBranch = (b) => {
    setForm(prev => {
      let newBranches = [...(prev.branch || [])];
      if (b === 'All') {
        newBranches = ['All'];
      } else {
        newBranches = newBranches.filter(item => item !== 'All');
        if (newBranches.includes(b)) {
          newBranches = newBranches.filter(item => item !== b);
        } else {
          newBranches.push(b);
        }
        if (newBranches.length === 0) newBranches = ['All'];
      }
      return { ...prev, branch: newBranches };
    });
  };

  const semBadge = (type) => type === 'ODD'
    ? <span className="text-[10px] font-bold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">ODD</span>
    : <span className="text-[10px] font-bold bg-green-100 text-green-700 px-2 py-0.5 rounded-full">EVEN</span>;

  const activeBadge = (type) => type === activeSemester
    ? <span className="text-[10px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-200 px-2 py-0.5 rounded-full">● Active</span>
    : <span className="text-[10px] font-bold bg-gray-50 text-gray-400 border border-gray-200 px-2 py-0.5 rounded-full">Inactive</span>;

  const sortedSubjects = [...subjects].sort((a, b) => {
    const yearOrder = { 'First Year': 1, 'Second Year': 2, 'Third Year': 3, 'Fourth Year': 4 };
    const yearA = yearOrder[a.class] || 99;
    const yearB = yearOrder[b.class] || 99;
    if (yearA !== yearB) return yearA - yearB;
    return a.name.localeCompare(b.name);
  });

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
              <p className="text-xs text-gray-400">
                Active Semester: <span className={`font-bold ${activeSemester === 'ODD' ? 'text-blue-600' : 'text-green-600'}`}>{activeSemester}</span>
              </p>
            </div>
          </div>
          <button onClick={() => { setShowForm(!showForm); setEditId(null); setForm({ name: '', code: '', class: '', branch: ['All'], facultyId: '', semesterType: activeSemester }); }}
            className="btn-primary flex items-center gap-2 text-sm">
            <Plus size={16} />{showForm ? 'Cancel' : 'Add Subject'}
          </button>
        </div>
      </div>

      {/* Semester filter tabs */}
      <div className="flex flex-wrap items-center gap-2">
        <Filter size={14} className="text-gray-400" />
        <div className="flex flex-wrap gap-2">
          {['ALL', 'ODD', 'EVEN'].map(f => (
            <button key={f} onClick={() => setSemFilter(f)}
              className={`text-[10px] sm:text-xs font-bold px-3 sm:px-4 py-1.5 rounded-full border transition-all ${
                semFilter === f
                  ? f === 'ODD' ? 'bg-blue-600 text-white border-blue-600'
                    : f === 'EVEN' ? 'bg-green-600 text-white border-green-600'
                    : 'bg-gray-800 text-white border-gray-800'
                  : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400'
              }`}>
              {f === 'ALL' ? 'All Semesters' : `${f} Semester`}
            </button>
          ))}
        </div>
        <span className="text-[10px] sm:text-xs text-gray-400 ml-auto sm:ml-2">{subjects.length} subject{subjects.length !== 1 ? 's' : ''}</span>
      </div>

      {showForm && (
        <form onSubmit={saveSubject} className="card space-y-4">
          <h2 className="font-semibold text-gray-800">{editId ? 'Edit Subject' : 'New Subject'}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input className="input" placeholder="Subject Name *" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
            <input className="input" placeholder="Subject Code *" value={form.code} onChange={e => setForm({...form, code: e.target.value.toUpperCase()})} required />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">Class / Year *</label>
              <select className="input" value={form.class} onChange={e => setForm({...form, class: e.target.value})} required>
                <option value="">-- Select Year --</option>
                {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
          </div>

          <div className="relative">
            <label className="text-sm font-medium text-gray-700 mb-1.5 block">Branches *</label>
            <div 
              className="input flex items-center justify-between cursor-pointer bg-white"
              onClick={() => setBranchDropdownOpen(!branchDropdownOpen)}
            >
              <span className="truncate text-gray-700">
                {form.branch.length > 0 ? form.branch.join(', ') : '-- Select Branches --'}
              </span>
              <Filter size={14} className={`text-gray-400 transition-transform ${branchDropdownOpen ? 'rotate-180' : ''}`} />
            </div>

            {branchDropdownOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setBranchDropdownOpen(false)} />
                <div className="absolute z-20 mt-1 w-full bg-white rounded-xl shadow-xl border border-gray-100 p-2 max-h-60 overflow-y-auto">
                  {BRANCHES.map(b => (
                    <label key={b} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors group">
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        checked={form.branch.includes(b)}
                        onChange={(e) => {
                          e.stopPropagation();
                          toggleBranch(b);
                        }}
                      />
                      <span className={`text-sm ${form.branch.includes(b) ? 'text-blue-600 font-semibold' : 'text-gray-600'}`}>
                        {b}
                      </span>
                    </label>
                  ))}
                </div>
              </>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">Semester Type *</label>
              <div className="flex gap-2">
                {SEMESTER_TYPES.map(t => (
                  <button key={t} type="button"
                    onClick={() => setForm({...form, semesterType: t})}
                    className={`flex-1 py-2.5 text-[10px] sm:text-sm font-bold rounded-xl border-2 transition-all ${
                      form.semesterType === t
                        ? t === 'ODD' ? 'bg-blue-600 text-white border-blue-600' : 'bg-green-600 text-white border-green-600'
                        : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400'
                    }`}>
                    {t}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 mb-1.5 block">Assign Faculty (optional)</label>
            <select className="input" value={form.facultyId} onChange={e => setForm({...form, facultyId: e.target.value})}>
              <option value="">-- No Faculty --</option>
              {faculty.map(t => <option key={t._id} value={t._id}>{t.name} ({t.email})</option>)}
            </select>
          </div>

          <div className="flex gap-3">
            <button type="submit" disabled={loading} className="btn-primary flex-1">{loading ? 'Saving...' : editId ? 'Update Subject' : 'Create Subject'}</button>
            <button type="button" onClick={() => { setShowForm(false); setEditId(null); }} className="btn-secondary flex-1">Cancel</button>
          </div>
        </form>
      )}

      <div className="space-y-3">
        {sortedSubjects.length > 0 && sortedSubjects.map(s => (
          <div key={s._id} className="card flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-l-4 border-l-transparent hover:border-l-blue-500 transition-all">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white text-xs font-bold flex-shrink-0 ${s.semesterType === 'ODD' ? 'bg-gradient-to-br from-blue-500 to-blue-700' : 'bg-gradient-to-br from-green-500 to-green-700'}`}>
                {s.code?.slice(0, 3)}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-semibold text-gray-800 truncate">{s.name}</p>
                  {semBadge(s.semesterType || 'ODD')}
                  {activeBadge(s.semesterType || 'ODD')}
                </div>
                <p className="text-xs text-gray-400">
                  {s.class || 'No Year'} 
                  {s.branch && s.branch.length > 0 && (
                    <>
                      <span className="mx-1">•</span>
                      <span className="text-blue-500 font-medium">
                        {Array.isArray(s.branch) ? s.branch.join(', ') : s.branch}
                      </span>
                    </>
                  )}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0 w-full sm:w-auto justify-end">
              {s.faculty ? (
                <span className="text-[10px] bg-blue-50 text-blue-700 px-2 py-1 rounded-lg font-bold flex items-center gap-1 uppercase">
                  <Users size={10} />{s.faculty.name}
                </span>
              ) : (
                <span className="text-[10px] bg-gray-50 text-gray-400 px-2 py-1 rounded-lg font-bold uppercase">Unassigned</span>
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
        {sortedSubjects.length === 0 && (
          <div className="card py-12 flex flex-col items-center justify-center text-center space-y-4 bg-gray-50/50 border-dashed border-2 border-gray-200">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm">
              <BookOpen size={32} className="text-gray-300" />
            </div>
            <div>
              <p className="text-gray-600 font-medium">No Subjects Found</p>
              <p className="text-sm text-gray-400 mt-1">Try adjusting your filters or add a new subject to get started.</p>
            </div>
            {!showForm && (
              <button 
                onClick={() => { setShowForm(true); setEditId(null); setForm({ name: '', code: '', class: '', branch: ['All'], facultyId: '', semesterType: activeSemester }); }}
                className="text-blue-600 text-sm font-bold hover:underline"
              >
                + Add your first subject
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
