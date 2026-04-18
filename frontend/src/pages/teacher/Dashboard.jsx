import { useState, useEffect } from 'react';
import axios from 'axios';
import { Users, BookOpen, Clock, BarChart3, Presentation, PlusSquare } from 'lucide-react';
import { Link } from 'react-router-dom';

import { useAuth } from '../../context/AuthContext';

export default function TeacherDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ subjects: 0, students: 0, tests: 0, assignments: 0 });

  useEffect(() => {
    // Basic stats mockup or fetch - backend currently only has admin stats so we do a quick count locally
    Promise.all([
      axios.get('/teacher/subjects'),
      axios.get('/teacher/results'),
      axios.get('/teacher/assignments')
    ]).then(([subRes, resRes, assRes]) => {
      setStats({
        subjects: subRes.data.subjects.length,
        students: 'Multi', // requires specific aggregate to count unique students
        tests: resRes.data.results.length,
        assignments: assRes.data.assignments.length
      });
    }).catch(() => {});
  }, []);

  const cards = [
    { label: 'Assigned Subjects', value: stats.subjects, icon: BookOpen, color: 'text-indigo-600', bg: 'from-indigo-500 to-indigo-700' },
    { label: 'Test Results', value: stats.tests, icon: BarChart3, color: 'text-emerald-600', bg: 'from-emerald-500 to-emerald-700' },
    { label: 'Assignments', value: stats.assignments, icon: Presentation, color: 'text-blue-600', bg: 'from-blue-500 to-blue-700' },
  ];

  const actions = [
    { label: 'Generate Test', desc: 'Create AI-powered MCQ test', icon: PlusSquare, path: '/teacher/tests', color: 'from-purple-500 to-purple-600' },
    { label: 'Take Attendance', desc: 'Generate attendance codes', icon: Clock, path: '/teacher/attendance', color: 'from-amber-500 to-orange-500' },
    { label: 'Grade Submissions', desc: 'View assignment PDFs', icon: BookOpen, path: '/teacher/assignments', color: 'from-cyan-500 to-blue-500' },
    { label: 'Send Note', desc: 'Notify your students', icon: Users, path: '/teacher/announcements', color: 'from-pink-500 to-rose-500' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="relative card bg-gradient-to-br from-indigo-700 to-purple-800 text-white overflow-hidden rounded-2xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-12 translate-x-12" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full blur-2xl translate-y-8 -translate-x-8" />
        
        <div className="relative z-10">
          <h1 className="text-3xl font-bold mb-2">Welcome Back {user?.name} 👋</h1>
          <p className="text-indigo-100 max-w-lg leading-relaxed font-medium mb-1">
            Faculty Portal
          </p>
          <p className="text-indigo-100/80 max-w-lg leading-relaxed text-sm">
            Manage your subjects, track student performance, and easily generate AI tests or assignments on the fly.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {cards.map((c, i) => (
          <div key={i} className="card flex items-center gap-4 hover:shadow-lg transition-all border-none shadow-sm group">
            <div className={`w-14 h-14 bg-gradient-to-br ${c.bg} rounded-2xl flex items-center justify-center shadow-lg transform group-hover:-translate-y-1 transition-transform`}>
              <c.icon size={24} className="text-white" />
            </div>
            <div>
              <p className="text-3xl font-bold text-gray-800">{c.value}</p>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{c.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="card">
        <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
          <Clock size={18} className="text-indigo-600" />
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {actions.map((a, i) => (
            <Link key={i} to={a.path} className="group block p-4 border border-gray-100 rounded-2xl hover:border-transparent hover:shadow-lg transition-all hover:bg-slate-50 cursor-pointer">
              <div className={`w-10 h-10 bg-gradient-to-br ${a.color} rounded-xl flex items-center justify-center shadow-md mb-3 group-hover:scale-110 transition-transform`}>
                <a.icon size={18} className="text-white" />
              </div>
              <h3 className="font-semibold text-gray-800 text-sm">{a.label}</h3>
              <p className="text-xs text-gray-500 mt-1">{a.desc}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
