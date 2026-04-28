import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { ClipboardList, Calendar, TrendingUp, Brain, Award, BookOpen } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import AIChatbot from '../../components/AIChatbot';

export default function StudentDashboard() {
  const { user } = useAuth();
  const [results, setResults] = useState([]);
  const [attendance, setAttendance] = useState({ percentage: 0, total: 0, present: 0 });
  const [weakTopics, setWeakTopics] = useState([]);
  const [progress, setProgress] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [resR, attR, weakR, progR, assR] = await Promise.all([
          axios.get('/student/results'),
          axios.get('/student/attendance'),
          axios.get('/student/weak-topics'),
          axios.get('/student/monthly-progress'),
          axios.get('/student/assignments')
        ]);
        setResults(resR.data.results.slice(0, 5));
        setAttendance({ percentage: attR.data.percentage, total: attR.data.total, present: attR.data.present });
        setWeakTopics(weakR.data.weakTopics.slice(0, 3));
        setProgress(progR.data.progress);
        setAssignments(assR.data.assignments.filter(a => !a.submitted).slice(0, 3));
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    fetchAll();
  }, []);

  const avgScore = results.length ? (results.reduce((a, b) => a + b.score, 0) / results.length).toFixed(1) : 0;

  const statCards = [
    { label: 'Tests Taken', value: results.length, icon: ClipboardList, color: 'text-blue-500', bg: 'bg-blue-50' },
    { label: 'Avg Score', value: `${avgScore}/10`, icon: TrendingUp, color: 'text-purple-500', bg: 'bg-purple-50' },
    { label: 'Attendance', value: `${Math.round(parseFloat(attendance.percentage) || 0)}%`, icon: Calendar, color: 'text-green-500', bg: 'bg-green-50' },
    { label: 'Pending Tasks', value: assignments.length, icon: BookOpen, color: 'text-orange-500', bg: 'bg-orange-50' },
  ];

  return (
    <>
      <div className="space-y-6">
        {/* Welcome */}
        <div className="card bg-gradient-to-r from-primary to-blue-400 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Hello, {user?.name?.split(' ')[0]}! 🎓</h1>
              <p className="text-blue-100 mt-1 text-sm">Keep up the great work! Check your progress below.</p>
              {user?.rollNo && <p className="text-blue-200 text-xs mt-1">Roll No: {user.rollNo}</p>}
            </div>
            <Award size={48} className="text-blue-200 hidden sm:block" />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((s, i) => (
            <div key={i} className="card flex items-center gap-4">
              <div className={`w-12 h-12 ${s.bg} rounded-xl flex items-center justify-center flex-shrink-0`}>
                <s.icon size={22} className={s.color} />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-800">{s.value}</p>
                <p className="text-xs text-gray-400 mt-0.5">{s.label}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Progress chart */}
          <div className="card">
            <h2 className="font-semibold text-gray-700 mb-4 flex items-center gap-2">
              <TrendingUp className="text-primary" size={18} />Monthly Progress
            </h2>
            {progress.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={progress}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis domain={[0, 10]} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="averageScore" stroke="#2563EB" strokeWidth={2} dot={{ fill: '#2563EB', r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-48 flex items-center justify-center text-gray-400 text-sm">Take tests to see your progress!</div>
            )}
          </div>

          {/* Weak topics */}
          <div className="card">
            <h2 className="font-semibold text-gray-700 mb-4 flex items-center gap-2">
              <Brain className="text-orange-500" size={18} />AI: Focus on These Topics
            </h2>
            {weakTopics.length > 0 ? (
              <div className="space-y-3">
                {weakTopics.map((t, i) => (
                  <div key={i} className="flex items-center justify-between bg-orange-50 rounded-xl p-3">
                    <span className="text-sm text-gray-700 font-medium">{t.topic}</span>
                    <span className="text-xs bg-orange-100 text-orange-600 px-2 py-1 rounded-full">Failed {t.failCount}x</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-32 flex items-center justify-center text-gray-400 text-sm">No weak topics identified yet! 🎉</div>
            )}
          </div>
        </div>

        {/* Recent results & pending assignments */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card">
            <h2 className="font-semibold text-gray-700 mb-4 flex items-center gap-2">
              <ClipboardList className="text-primary" size={18} />Recent Test Results
            </h2>
            <div className="space-y-3">
              {results.length > 0 ? results.map((r, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-gray-700">{r.test?.topic || 'Test'}</p>
                    <p className="text-xs text-gray-400">{r.subject?.name}</p>
                  </div>
                  <div className="text-right">
                    <span className={`text-sm font-bold ${r.score >= 7 ? 'text-green-600' : r.score >= 5 ? 'text-yellow-600' : 'text-red-500'}`}>{r.score}/10</span>
                    <p className="text-xs text-gray-400">{r.grade}</p>
                  </div>
                </div>
              )) : <p className="text-sm text-gray-400 text-center py-8">No tests taken yet</p>}
            </div>
          </div>

          <div className="card">
            <h2 className="font-semibold text-gray-700 mb-4 flex items-center gap-2">
              <BookOpen className="text-primary" size={18} />Pending Assignments
            </h2>
            <div className="space-y-3">
              {assignments.length > 0 ? assignments.map((a, i) => (
                <div key={i} className={`p-3 rounded-xl border-l-4 ${new Date() > new Date(a.deadline) ? 'border-red-400 bg-red-50' : 'border-primary bg-secondary'}`}>
                  <p className="text-sm font-medium text-gray-700">{a.title}</p>
                  <p className="text-xs text-gray-400 mt-1">{a.subject?.name}</p>
                  <p className={`text-xs mt-1 font-medium ${new Date() > new Date(a.deadline) ? 'text-red-500' : 'text-primary'}`}>
                    Due: {new Date(a.deadline).toLocaleDateString()}
                    {new Date() > new Date(a.deadline) && ' (Overdue!)'}
                  </p>
                </div>
              )) : <p className="text-sm text-gray-400 text-center py-8">No pending assignments! 🎉</p>}
            </div>
          </div>
        </div>
      </div>
      <AIChatbot />
    </>
  );
}
