import { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { GraduationCap, Plus, ToggleLeft, ToggleRight, Search, Trash2 } from 'lucide-react';

const YEARS = ['First Year', 'Second Year', 'Third Year', 'Fourth Year'];
const BRANCHES = ['Computer Science', 'Information Technology', 'Electronics', 'Mechanical', 'Civil', 'Electrical', 'Chemical', 'Other'];

export default function AdminStudents() {
  const [students, setStudents] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [filterYear, setFilterYear] = useState('');
  const [filterBranch, setFilterBranch] = useState('');
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({ name: '', email: '', password: '', rollNo: '', year: '', branch: '' });

  useEffect(() => { fetchStudents(); }, []);

  const fetchStudents = async () => {
    const res = await axios.get('/admin/users?role=student');
    setStudents(res.data.users);
  };

  const createStudent = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const classStr = form.year + (form.branch ? ' - ' + form.branch : '');
      await axios.post('/admin/users', { ...form, role: 'student', class: classStr });
      toast.success('Student created!');
      setShowForm(false);
      setForm({ name: '', email: '', password: '', rollNo: '', year: '', branch: '' });
      fetchStudents();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setLoading(false); }
  };

  const toggleUser = async (id) => {
    await axios.put(`/admin/users/${id}/toggle`);
    fetchStudents();
    toast.success('Status updated');
  };

  const deleteStudent = async (id) => {
    if (!window.confirm('Are you sure you want to permanently delete this student? This cannot be undone.')) return;
    try {
      await axios.delete(`/admin/users/${id}`);
      toast.success('Student permanently deleted');
      fetchStudents();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete student');
    }
  };

  const filtered = students.filter(u => {
    if (filterYear && u.year !== filterYear) return false;
    if (filterBranch && u.branch !== filterBranch) return false;
    if (search && !u.name?.toLowerCase().includes(search.toLowerCase()) && !u.rollNo?.includes(search)) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="card">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-xl flex items-center justify-center">
              <GraduationCap size={20} className="text-white" />
            </div>
            <div>
              <h1 className="font-bold text-gray-800 text-lg">Students</h1>
              <p className="text-xs text-gray-400">Manage student accounts and profiles</p>
            </div>
          </div>
          <button onClick={() => setShowForm(!showForm)} className="btn-primary flex items-center gap-2 text-sm">
            <Plus size={16} />Add Student
          </button>
        </div>
      </div>

      {showForm && (
        <form onSubmit={createStudent} className="card space-y-4">
          <h2 className="font-semibold text-gray-800">New Student</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input className="input" placeholder="Full Name *" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
            <input className="input" type="email" placeholder="Email *" value={form.email} onChange={e => setForm({...form, email: e.target.value})} required />
            <input className="input" type="password" placeholder="Password *" value={form.password} onChange={e => setForm({...form, password: e.target.value})} required />
            <input className="input" placeholder="Roll Number" value={form.rollNo} onChange={e => setForm({...form, rollNo: e.target.value})} />
            <select className="input" value={form.year} onChange={e => setForm({...form, year: e.target.value})}>
              <option value="">-- Year --</option>
              {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
            <select className="input" value={form.branch} onChange={e => setForm({...form, branch: e.target.value})}>
              <option value="">-- Branch --</option>
              {BRANCHES.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>
          <div className="flex gap-3">
            <button type="submit" disabled={loading} className="btn-primary flex-1">{loading ? 'Creating...' : 'Create Student'}</button>
            <button type="button" onClick={() => setShowForm(false)} className="btn-secondary flex-1">Cancel</button>
          </div>
        </form>
      )}

      {/* Filters */}
      <div className="card">
        <div className="flex flex-col sm:flex-row flex-wrap gap-3">
          <div className="flex items-center gap-2 flex-1 min-w-[200px]">
            <Search size={16} className="text-gray-400 flex-shrink-0" />
            <input className="input py-1.5 flex-1" placeholder="Search by name or roll no..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select className="input text-sm py-1.5 w-full sm:w-40" value={filterYear} onChange={e => setFilterYear(e.target.value)}>
            <option value="">All Years</option>
            {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <select className="input text-sm py-1.5 w-full sm:w-44" value={filterBranch} onChange={e => setFilterBranch(e.target.value)}>
            <option value="">All Branches</option>
            {BRANCHES.map(b => <option key={b} value={b}>{b}</option>)}
          </select>
        </div>
        <p className="text-xs text-gray-400 mt-2">{filtered.length} student{filtered.length !== 1 ? 's' : ''} found</p>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-gray-400 border-b border-gray-100">
              <th className="pb-3 font-medium">Name</th>
              <th className="pb-3 font-medium">Email</th>
              <th className="pb-3 font-medium">Roll No</th>
              <th className="pb-3 font-medium">Year</th>
              <th className="pb-3 font-medium">Branch</th>
              <th className="pb-3 font-medium">Status</th>
              <th className="pb-3 font-medium">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.map(u => (
              <tr key={u._id} className="hover:bg-gray-50">
                <td className="py-3 font-medium text-gray-700">{u.name}</td>
                <td className="py-3 text-gray-400 text-xs">{u.email}</td>
                <td className="py-3 text-gray-400 text-xs font-mono">{u.rollNo || '-'}</td>
                <td className="py-3 text-gray-400 text-xs">{u.year || '-'}</td>
                <td className="py-3 text-gray-400 text-xs">{u.branch || '-'}</td>
                <td className="py-3"><span className={`text-xs px-2 py-1 rounded-full font-medium ${u.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-500'}`}>{u.isActive ? 'Active' : 'Inactive'}</span></td>
                <td className="py-3">
                  <div className="flex items-center gap-2">
                    <button onClick={() => toggleUser(u._id)} title="Toggle Status">
                      {u.isActive ? <ToggleRight size={22} className="text-blue-600 hover:text-blue-700" /> : <ToggleLeft size={22} className="text-gray-300 hover:text-gray-400" />}
                    </button>
                    <button onClick={() => deleteStudent(u._id)} title="Delete Student" className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan={8} className="text-center py-8 text-gray-400">No students found</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
