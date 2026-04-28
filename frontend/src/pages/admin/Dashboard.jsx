import { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Users, GraduationCap, BookOpen, ClipboardList, Shield, Activity, ToggleLeft, ToggleRight, RefreshCw } from 'lucide-react';

export default function AdminDashboard() {
  const [stats, setStats] = useState({ totalStudents: 0, totalFaculty: 0, totalSubjects: 0, activeTests: 0 });
  const [loading, setLoading] = useState(true);
  const [activeSemester, setActiveSemester] = useState('ODD');
  const [semLoading, setSemLoading] = useState(false);

  useEffect(() => {
    axios.get('/admin/stats').then((statsRes) => {
      setStats(statsRes.data.stats);
    }).catch(() => { })
      .finally(() => setLoading(false));
    axios.get('/admin/semester').then(r => setActiveSemester(r.data.activeSemester)).catch(() => {});
  }, []);

  const switchSemester = async () => {
    const next = activeSemester === 'ODD' ? 'EVEN' : 'ODD';
    if (!window.confirm(`Switch active semester from ${activeSemester} to ${next}?\n\nThis will immediately hide all ${activeSemester} semester subjects from students.`)) return;
    setSemLoading(true);
    try {
      await axios.post('/admin/semester', { semester: next });
      setActiveSemester(next);
      toast.success(`Active semester switched to ${next}! 🎓`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to switch semester');
    } finally {
      setSemLoading(false);
    }
  };

  const cards = [
    { label: 'Total Students', value: stats.totalStudents, icon: GraduationCap, color: 'text-emerald-600', bg: 'from-emerald-500 to-emerald-700', light: 'bg-emerald-50' },
    { label: 'Total Faculty', value: stats.totalFaculty, icon: Users, color: 'text-blue-600', bg: 'from-blue-500 to-blue-700', light: 'bg-blue-50' },
    { label: 'Total Subjects', value: stats.totalSubjects, icon: BookOpen, color: 'text-purple-600', bg: 'from-purple-500 to-purple-700', light: 'bg-purple-50' },
    { label: 'Active Tests', value: stats.activeTests || 0, icon: ClipboardList, color: 'text-orange-600', bg: 'from-orange-500 to-orange-700', light: 'bg-orange-50' },
  ];

  return (
    <div className="space-y-6">
      {/* Hero banner */}
      <div className="relative card bg-gradient-to-br from-purple-700 to-purple-900 text-white overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -translate-y-12 translate-x-12" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full translate-y-8 -translate-x-8" />
        <div className="relative flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Admin Panel 🛡️</h1>
            <p className="text-purple-200 mt-1 text-sm">Manage faculty, students, and subjects</p>
          </div>
          <Shield size={52} className="text-purple-300 hidden sm:block" />
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c, i) => (
          <div key={i} className="card flex items-center gap-4 hover:shadow-md transition-shadow">
            <div className={`w-12 h-12 bg-gradient-to-br ${c.bg} rounded-xl flex items-center justify-center shadow-sm flex-shrink-0`}>
              <c.icon size={22} className="text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">{c.value}</p>
              <p className="text-xs text-gray-400">{c.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Active Semester Control */}
      <div className={`card border-2 ${activeSemester === 'ODD' ? 'border-blue-200 bg-blue-50/50' : 'border-green-200 bg-green-50/50'}`}>
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4 w-full md:w-auto">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg flex-shrink-0 ${activeSemester === 'ODD' ? 'bg-gradient-to-br from-blue-500 to-blue-700' : 'bg-gradient-to-br from-green-500 to-green-700'}`}>
              <RefreshCw size={24} className="text-white" />
            </div>
            <div>
              <p className="font-bold text-gray-800">Active Semester Control</p>
              <p className="text-xs text-gray-500 max-w-xs">Only subjects from the active semester are visible to students and faculty.</p>
            </div>
          </div>
          <div className="flex items-center gap-6 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 pt-4 md:pt-0">
            <div className="text-left md:text-center">
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-0.5">Current Status</p>
              <span className={`text-xl font-black ${activeSemester === 'ODD' ? 'text-blue-600' : 'text-green-600'}`}>
                {activeSemester}
              </span>
            </div>
            <button
              onClick={switchSemester}
              disabled={semLoading}
              className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-sm text-white shadow-xl transition-all active:scale-95 ${
                activeSemester === 'ODD'
                  ? 'bg-gradient-to-r from-green-500 to-emerald-600 hover:shadow-green-200'
                  : 'bg-gradient-to-r from-blue-500 to-indigo-600 hover:shadow-blue-200'
              } disabled:opacity-50`}>
              {semLoading ? <RefreshCw size={16} className="animate-spin" /> : (activeSemester === 'ODD' ? <ToggleRight size={20} /> : <ToggleLeft size={20} />)}
              Switch to {activeSemester === 'ODD' ? 'EVEN' : 'ODD'}
            </button>
          </div>
        </div>
      </div>

      {/* Quick Navigation */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[
          { title: 'Manage Faculty', desc: 'Add faculty and assign subjects', icon: Users, path: '/admin/faculty', color: 'from-blue-500 to-blue-700' },
          { title: 'Manage Students', desc: 'View and manage student accounts', icon: GraduationCap, path: '/admin/students', color: 'from-emerald-500 to-emerald-700' },
          { title: 'Manage Subjects', desc: 'Create subjects and assign faculty', icon: BookOpen, path: '/admin/subjects', color: 'from-purple-500 to-purple-700' },
          { title: 'Announcements', desc: 'Send notices to all faculty', icon: Activity, path: '/admin/announcements', color: 'from-orange-500 to-pink-500' },
        ].map((item, i) => (
          <a key={i} href={item.path}
            className="card flex items-center gap-4 hover:shadow-md transition-all cursor-pointer hover:border-gray-200 group">
            <div className={`w-12 h-12 bg-gradient-to-br ${item.color} rounded-xl flex items-center justify-center shadow-sm flex-shrink-0 group-hover:scale-110 transition-transform`}>
              <item.icon size={22} className="text-white" />
            </div>
            <div>
              <p className="font-semibold text-gray-800">{item.title}</p>
              <p className="text-xs text-gray-400">{item.desc}</p>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
