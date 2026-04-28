import { useState, useEffect } from 'react';
import axios from 'axios';
import { BarChart2, TrendingUp, Award, Loader, Filter } from 'lucide-react';
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { useAuth } from '../../context/AuthContext';

export default function StudentResults() {
  const { user } = useAuth();
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [subjects, setSubjects] = useState([]);

  useEffect(() => {
    axios.get('/student/subjects').then(r => setSubjects(r.data.subjects || [])).catch(() => { });
    fetchResults();
  }, [selectedSubject]);

  const fetchResults = async () => {
    setLoading(true);
    try {
      const url = selectedSubject ? `/student/results?subjectId=${selectedSubject}` : '/student/results';
      const res = await axios.get(url);
      setResults(res.data.results);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const avgScore = results.length ? (results.reduce((a, b) => a + b.score, 0) / results.length).toFixed(1) : 0;
  const best = results.length ? Math.max(...results.map(r => r.score)) : 0;
  const gradeCount = results.reduce((acc, r) => { acc[r.grade] = (acc[r.grade] || 0) + 1; return acc; }, {});

  const chartData = results.slice().reverse().map((r, i) => ({
    test: `T${i + 1}`,
    score: r.score,
    topic: r.test?.topic
  }));

  const diffData = results.length ? [
    { subject: 'Easy', score: +(results.reduce((a, b) => a + (b.easyScore || 0), 0) / results.length * 2.5).toFixed(1) },
    { subject: 'Medium', score: +(results.reduce((a, b) => a + (b.mediumScore || 0), 0) / results.length * 2.5).toFixed(1) },
    { subject: 'Hard', score: +(results.reduce((a, b) => a + (b.hardScore || 0), 0) / results.length * 5).toFixed(1) },
  ] : [];

  const gradeColor = (g) => {
    if (g === 'Excellent') return 'bg-green-100 text-green-700';
    if (g === 'Good') return 'bg-blue-100 text-blue-700';
    if (g === 'Average') return 'bg-yellow-100 text-yellow-700';
    return 'bg-red-100 text-red-600';
  };

  return (
    <div className="space-y-6">
      <div className="card">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
              <BarChart2 size={20} className="text-white" />
            </div>
            <div>
              <h1 className="font-bold text-gray-800 text-lg">My Results</h1>
              <p className="text-xs text-gray-400">Track your test performance over time</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Filter size={14} className="text-gray-400" />
            <select className="input text-sm py-1.5 w-44" value={selectedSubject} onChange={e => setSelectedSubject(e.target.value)}>
              {subjects.map((s, i) => {
                if (selectedSubject === '' && i === 0) setSelectedSubject(s._id);
                return <option key={s._id} value={s._id}>{s.name}</option>;
              })}
            </select>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Tests Taken', value: results.length, color: 'text-blue-500', bg: 'bg-blue-50' },
          { label: 'Average Score', value: `${avgScore}/10`, color: 'text-purple-500', bg: 'bg-purple-50' },
          { label: 'Best Score', value: `${best}/10`, color: 'text-green-500', bg: 'bg-green-50' },
          { label: 'Excellent Count', value: gradeCount['Excellent'] || 0, color: 'text-orange-500', bg: 'bg-orange-50' },
        ].map((s, i) => (
          <div key={i} className="card flex items-center gap-3 py-4">
            <div className={`w-10 h-10 ${s.bg} rounded-xl flex items-center justify-center flex-shrink-0`}>
              <span className={`text-sm font-bold ${s.color}`}>{s.value}</span>
            </div>
            <span className="text-xs text-gray-400 font-medium">{s.label}</span>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader size={24} className="animate-spin text-primary" /></div>
      ) : (
        <>
          {chartData.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="card">
                <h2 className="font-semibold text-gray-700 mb-4 flex items-center gap-2">
                  <TrendingUp size={16} className="text-primary" />Score History
                </h2>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="test" tick={{ fontSize: 11 }} />
                    <YAxis domain={[0, 10]} tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(val, _, props) => [val + '/10', props.payload.topic || 'Score']} />
                    <Bar dataKey="score" radius={[4, 4, 0, 0]}
                      fill="#2563EB"
                      label={{ position: 'top', fontSize: 10, fill: '#6B7280' }} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {diffData.length > 0 && (
                <div className="card">
                  <h2 className="font-semibold text-gray-700 mb-4 flex items-center gap-2">
                    <Award size={16} className="text-primary" />Performance by Difficulty
                  </h2>
                  <ResponsiveContainer width="100%" height={200}>
                    <RadarChart data={diffData}>
                      <PolarGrid />
                      <PolarAngleAxis dataKey="subject" tick={{ fontSize: 12 }} />
                      <Radar dataKey="score" stroke="#2563EB" fill="#2563EB" fillOpacity={0.2} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          )}

          {/* Results table */}
          <div className="card">
            <h2 className="font-semibold text-gray-700 mb-4">All Test Results</h2>
            {results.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-gray-400 border-b border-gray-100">
                      <th className="pb-3 font-medium">Date</th>
                      <th className="pb-3 font-medium">Subject</th>
                      <th className="pb-3 font-medium">Topic</th>
                      <th className="pb-3 font-medium text-center">Score</th>
                      <th className="pb-3 font-medium text-center">Easy</th>
                      <th className="pb-3 font-medium text-center">Medium</th>
                      <th className="pb-3 font-medium text-center">Hard</th>
                      <th className="pb-3 font-medium text-center">Grade</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {results.map((r, i) => (
                      <tr key={i} className="hover:bg-gray-50 transition-colors">
                        <td className="py-3 text-xs text-gray-400">{new Date(r.createdAt).toLocaleDateString()}</td>
                        <td className="py-3 text-gray-600">{r.subject?.name}</td>
                        <td className="py-3 text-gray-600">{r.test?.topic || '-'}</td>
                        <td className="py-3 text-center font-bold">
                          <span className={r.score >= 7 ? 'text-green-600' : r.score >= 5 ? 'text-yellow-600' : 'text-red-500'}>
                            {r.score}/10
                          </span>
                        </td>
                        <td className="py-3 text-center text-xs text-green-600">{r.easyScore ?? '-'}/4</td>
                        <td className="py-3 text-center text-xs text-yellow-600">{r.mediumScore ?? '-'}/4</td>
                        <td className="py-3 text-center text-xs text-red-500">{r.hardScore ?? '-'}/2</td>
                        <td className="py-3 text-center">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${gradeColor(r.grade)}`}>{r.grade}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-10 text-gray-400">
                <BarChart2 size={36} className="mx-auto mb-2 opacity-30" />
                <p>No results yet. Take a test to see your performance!</p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
