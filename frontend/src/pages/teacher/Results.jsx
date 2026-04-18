import { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { FileText, Calendar, GraduationCap, TrendingUp, Download, Eye, AlertTriangle } from 'lucide-react';

export default function TeacherResults() {
  const [subjects, setSubjects] = useState([]);
  const [results, setResults] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get('/teacher/subjects').then(r => setSubjects(r.data.subjects));
    fetchResults('');
  }, []);

  const fetchResults = async (subId) => {
    setLoading(true);
    try {
      const url = subId ? `/teacher/results?subjectId=${subId}` : '/teacher/results';
      const res = await axios.get(url);
      setResults(res.data.results);
    } catch (err) { toast.error('Failed to fetch results'); }
    finally { setLoading(false); }
  };

  const handleSubjectChange = (e) => {
    const val = e.target.value;
    setSelectedSubject(val);
    fetchResults(val);
  };

  const getGradeColor = (grade) => {
    if (grade === 'Excellent') return 'bg-green-100 text-green-700';
    if (grade === 'Good') return 'bg-blue-100 text-blue-700';
    if (grade === 'Average') return 'bg-yellow-100 text-yellow-700';
    return 'bg-red-100 text-red-700';
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-xl flex items-center justify-center shadow-sm">
            <TrendingUp size={20} className="text-white" />
          </div>
          <div>
            <h1 className="font-bold text-gray-800 text-lg">Test Results</h1>
            <p className="text-xs text-gray-400">View performance across all given tests</p>
          </div>
        </div>

        <select 
          className="input w-full sm:w-64 bg-white shadow-sm font-medium text-sm border-gray-200"
          value={selectedSubject} 
          onChange={handleSubjectChange}
        >
          <option value="">All My Subjects</option>
          {subjects.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
        </select>
      </div>

      <div className="card overflow-x-auto p-0 rounded-2xl">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50/80 text-xs text-gray-500 uppercase tracking-wider border-b border-gray-100">
            <tr>
              <th className="px-6 py-4 font-semibold">Student</th>
              <th className="px-6 py-4 font-semibold">Subject & Topic</th>
              <th className="px-6 py-4 font-semibold text-center">Score</th>
              <th className="px-6 py-4 font-semibold text-center">Grade</th>
              <th className="px-6 py-4 font-semibold text-center">Anti-Cheat</th>
              <th className="px-6 py-4 font-semibold text-right">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 bg-white">
            {loading ? (
              <tr><td colSpan={6} className="text-center py-12 text-gray-400 animate-pulse">Loading results...</td></tr>
            ) : results.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-12 text-gray-400">No test results found for selected criteria.</td></tr>
            ) : (
              results.map((r) => (
                <tr key={r._id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-3">
                    <p className="font-medium text-gray-800">{r.student?.name}</p>
                    <p className="text-[10px] text-gray-400 font-mono mt-0.5 tracking-wider">{r.student?.rollNo || 'N/A'}</p>
                  </td>
                  <td className="px-6 py-3">
                    <p className="text-sm font-medium text-gray-700">{r.test?.topic}</p>
                    <p className="text-[10px] text-indigo-600 font-medium uppercase mt-0.5">{r.subject?.name}</p>
                  </td>
                  <td className="px-6 py-3 text-center">
                    <div className="inline-flex items-baseline gap-1">
                      <span className="text-lg font-bold text-gray-800">{r.score}</span>
                      <span className="text-xs text-gray-400 font-medium">/ 10</span>
                    </div>
                  </td>
                  <td className="px-6 py-3 text-center">
                    <span className={`text-[10px] uppercase font-bold px-2.5 py-1 rounded-full tracking-wide ${getGradeColor(r.grade)}`}>
                      {r.grade}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-center">
                    {r.tabSwitchCount > 0 ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-red-600 bg-red-50 px-2 py-1 rounded-md" title="Switched tabs during test">
                        <AlertTriangle size={12} /> {r.tabSwitchCount} times
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-6 py-3 text-right text-xs text-gray-500 font-medium">
                    {new Date(r.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
