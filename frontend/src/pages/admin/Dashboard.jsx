import { useState, useEffect } from 'react';
import axios from 'axios';
import { Users, GraduationCap, BookOpen, ClipboardList, TrendingUp, Shield, Activity } from 'lucide-react';

export default function AdminDashboard() {
  const [stats, setStats] = useState({ totalStudents: 0, totalTeachers: 0, totalSubjects: 0, activeTests: 0 });

  useEffect(() => {
    axios.get('/admin/stats').then(r => setStats(r.data.stats)).catch(() => {});
  }, []);

  const cards = [
    { label: 'Total Students', value: stats.totalStudents, icon: GraduationCap, color: 'text-emerald-600', bg: 'from-emerald-500 to-emerald-700', light: 'bg-emerald-50' },
    { label: 'Total Teachers', value: stats.totalTeachers, icon: Users, color: 'text-blue-600', bg: 'from-blue-500 to-blue-700', light: 'bg-blue-50' },
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
            <p className="text-purple-200 mt-1 text-sm">Manage teachers, students, and subjects</p>
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

      {/* Quick Navigation */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[
          { title: 'Manage Teachers', desc: 'Add faculty and assign subjects', icon: Users, path: '/admin/teachers', color: 'from-blue-500 to-blue-700' },
          { title: 'Manage Students', desc: 'View and manage student accounts', icon: GraduationCap, path: '/admin/students', color: 'from-emerald-500 to-emerald-700' },
          { title: 'Manage Subjects', desc: 'Create subjects and assign teachers', icon: BookOpen, path: '/admin/subjects', color: 'from-purple-500 to-purple-700' },
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
