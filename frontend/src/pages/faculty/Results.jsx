import { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast'; import { TrendingUp, AlertTriangle, ChevronDown, ChevronUp, Users } from 'lucide-react';

export default function FacultyResults() {
  const [allSubjects, setAllSubjects] = useState([]);
  const [availableYears, setAvailableYears] = useState([]);
  const [filterYear, setFilterYear] = useState('');
  
  const subjects = allSubjects.filter(s => s.class === filterYear);
  const [results, setResults] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [loading, setLoading] = useState(true);
  const [expandedTest, setExpandedTest] = useState(null);

  useEffect(() => {
    axios.get('/faculty/subjects').then(r => {
      const subs = r.data.subjects || [];
      setAllSubjects(subs);
      const years = [...new Set(subs.map(s => s.class))].filter(Boolean);
      setAvailableYears(years);
      if (years.length > 0) setFilterYear(years[0]);
    });
    fetchResults('');
  }, []);

  useEffect(() => {
    // When year changes, reset subject to "All" (empty string) and refresh results
    // Or we could force select first subject. Let's reset to all subjects of that year.
    // Actually the current backend fetchResults('') gets results for ALL subjects.
    // Maybe we should filter the results locally based on subjects?
    // Let's just reset subject to empty and fetch all.
    setSelectedSubject('');
    fetchResults('');
  }, [filterYear]);

  const fetchResults = async (subId) => {
    setLoading(true);
    try {
      const url = subId ? `/faculty/results?subjectId=${subId}` : '/faculty/results';
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

  // Group results by test (topic + date)
  const grouped = results.reduce((acc, r) => {
    const key = r.test?._id || r._id;
    if (!acc[key]) {
      acc[key] = {
        testId: key,
        topic: r.test?.topic || 'Unknown Topic',
        subjectName: r.subject?.name || '',
        subjectCode: r.subject?.code || '',
        date: r.createdAt,
        results: []
      };
    }
    acc[key].results.push(r);
    return acc;
  }, {});

  const groupedList = Object.values(grouped).sort((a, b) => new Date(b.date) - new Date(a.date));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-xl flex items-center justify-center shadow-sm">
            <TrendingUp size={20} className="text-white" />
          </div>
          <div>
            <h1 className="font-bold text-gray-800 text-lg">Test Results</h1>
            <p className="text-xs text-gray-400">View each test's performance — click to expand student list</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <select 
            className="input w-24 bg-white shadow-sm font-bold text-xs border-gray-200"
            value={filterYear}
            onChange={e => setFilterYear(e.target.value)}
          >
            {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <select
            className="input w-full sm:w-64 bg-white shadow-sm font-medium text-sm border-gray-200"
            value={selectedSubject}
            onChange={handleSubjectChange}
          >
            <option value="">All {filterYear} Subjects</option>
            {subjects.map(s => <option key={s._id} value={s._id}>{s.name} ({s.code})</option>)}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="card text-center py-12 text-gray-400 animate-pulse">Loading results...</div>
      ) : groupedList.length === 0 ? (
        <div className="card text-center py-12 text-gray-400">No test results found for selected criteria.</div>
      ) : (
        <div className="space-y-3">
          {groupedList.map(group => {
            const isExpanded = expandedTest === group.testId;
            const avg = (group.results.reduce((s, r) => s + r.score, 0) / group.results.length).toFixed(1);
            return (
              <div key={group.testId} className="card border border-gray-100 hover:border-blue-200 transition-all">
                {/* Test header row */}
                <button
                  onClick={() => setExpandedTest(isExpanded ? null : group.testId)}
                  className="w-full flex items-center justify-between gap-4 text-left"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <p className="font-semibold text-gray-800">{group.topic}</p>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 font-bold uppercase">{group.subjectCode || group.subjectName}</span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-gray-400">
                      <span className="flex items-center gap-1"><Users size={11} />{group.results.length} student{group.results.length !== 1 ? 's' : ''}</span>
                      <span>Avg Score: <strong className="text-gray-600">{avg} / 10</strong></span>
                      <span>{new Date(group.date).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className="text-xs font-medium text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg flex items-center gap-1.5">
                      {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      {isExpanded ? 'Hide' : 'View Results'}
                    </span>
                  </div>
                </button>

                {/* Expanded student results */}
                {isExpanded && (
                  <div className="mt-4 pt-4 border-t border-gray-100 overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wider">
                        <tr>
                          <th className="px-4 py-3 font-semibold">Student</th>
                          <th className="px-4 py-3 font-semibold text-center">Score</th>
                          <th className="px-4 py-3 font-semibold text-center">Grade</th>
                          <th className="px-4 py-3 font-semibold text-center">Anti-Cheat</th>
                          <th className="px-4 py-3 font-semibold text-right">Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50 bg-white">
                        {group.results.map((r) => (
                          <tr key={r._id} className="hover:bg-slate-50 transition-colors">
                            <td className="px-4 py-3">
                              <p className="font-medium text-gray-800">{r.student?.name}</p>
                              <p className="text-[10px] text-gray-400 font-mono mt-0.5 tracking-wider">{r.student?.rollNo || 'N/A'}</p>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <div className="inline-flex items-baseline gap-1">
                                <span className="text-lg font-bold text-gray-800">{r.score}</span>
                                <span className="text-xs text-gray-400 font-medium">/ 10</span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span className={`text-[10px] uppercase font-bold px-2.5 py-1 rounded-full tracking-wide ${getGradeColor(r.grade)}`}>
                                {r.grade}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-center">
                              {r.tabSwitchCount > 0 ? (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-red-600 bg-red-50 px-2 py-1 rounded-md" title="Switched tabs during test">
                                  <AlertTriangle size={12} /> {r.tabSwitchCount} times
                                </span>
                              ) : (
                                <span className="text-xs text-gray-400">-</span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-right text-xs text-gray-500 font-medium">
                              {new Date(r.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
