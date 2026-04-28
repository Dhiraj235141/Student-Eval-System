import { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Calendar, Download, Search, Users, KeyRound, Timer, Lock, ToggleLeft, ToggleRight, RefreshCw, Eye } from 'lucide-react';

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const currentYear = new Date().getFullYear();
const currentMonth = new Date().getMonth() + 1;

export default function FacultyAttendance() {
  const [allSubjects, setAllSubjects] = useState([]);
  const [availableYears, setAvailableYears] = useState([]);
  const [filterYear, setFilterYear] = useState('');
  
  const subjects = allSubjects.filter(s => s.class === filterYear);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [month, setMonth] = useState(currentMonth);
  const [year, setYear] = useState(currentYear);
  const [summary, setSummary] = useState([]);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [activeTab, setActiveTab] = useState('view'); // view | generate
  const [viewMode, setViewMode] = useState('monthly'); // monthly | daily
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedType, setSelectedType] = useState('all');
  const [dailyRecords, setDailyRecords] = useState([]);

  // Code generation state
  const [codeSubject, setCodeSubject] = useState('');
  const [codeType, setCodeType] = useState('theory');
  const [codeMinutes, setCodeMinutes] = useState(15);
  const [generatedCode, setGeneratedCode] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [codeTimeLeft, setCodeTimeLeft] = useState(0);
  const [codeTimer, setCodeTimer] = useState(null);

  useEffect(() => {
    axios.get('/faculty/subjects').then(r => {
      const subs = r.data.subjects || [];
      setAllSubjects(subs);
      const years = [...new Set(subs.map(s => s.class))].filter(Boolean);
      setAvailableYears(years);
      if (years.length > 0) {
        setFilterYear(years[0]);
      }
    });
  }, []);

  useEffect(() => {
    if (subjects.length > 0 && !subjects.find(s => s._id === selectedSubject)) {
      setSelectedSubject(subjects[0]._id);
    } else if (subjects.length === 0) {
      setSelectedSubject('');
    }
    if (subjects.length > 0 && !subjects.find(s => s._id === codeSubject)) {
      setCodeSubject(subjects[0]._id);
    } else if (subjects.length === 0) {
      setCodeSubject('');
    }
  }, [filterYear, allSubjects]);

  // Code countdown timer
  useEffect(() => {
    if (generatedCode && codeTimeLeft > 0) {
      const t = setInterval(() => {
        setCodeTimeLeft(prev => {
          if (prev <= 1) { clearInterval(t); setGeneratedCode(null); toast('Attendance code has expired'); return 0; }
          return prev - 1;
        });
      }, 1000);
      setCodeTimer(t);
      return () => clearInterval(t);
    }
  }, [generatedCode]);

  const generateCode = async () => {
    if (!codeSubject) { toast.error('Select a subject'); return; }
    setGenerating(true);
    try {
      const res = await axios.post('/faculty/attendance/generate-code', {
        subjectId: codeSubject, type: codeType, durationMinutes: codeMinutes
      });
      setGeneratedCode(res.data.code);
      setCodeTimeLeft(codeMinutes * 60);
      toast.success(`Code generated! Valid for ${codeMinutes} minutes`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to generate code');
    } finally { setGenerating(false); }
  };

  const fetchAttendance = async () => {
    if (!selectedSubject) { toast.error('Please select a subject'); return; }
    setLoading(true);
    try {
      let url = `/faculty/attendance?subjectId=${selectedSubject}&type=${selectedType}`;
      if (viewMode === 'monthly') {
        url += `&month=${month}&year=${year}`;
      } else {
        url += `&date=${selectedDate}`;
      }
      const res = await axios.get(url);
      setSummary(res.data.summary);
      setDailyRecords(res.data.dailyRecords || []);
      setSearched(true);
    } catch (err) {
      toast.error('Failed to load attendance');
    } finally { setLoading(false); }
  };

  const toggleStatus = async (studentId, currentStatus) => {
    try {
      const newStatus = currentStatus === 'present' ? 'absent' : 'present';
      const payload = { 
        studentId, 
        subjectId: selectedSubject, 
        status: newStatus,
        type: selectedType === 'all' ? 'theory' : selectedType 
      };
      
      if (viewMode === 'monthly') {
        payload.month = month;
        payload.year = year;
      } else {
        payload.date = selectedDate;
      }

      await axios.put('/faculty/attendance/mark', payload);
      
      // Update locally
      if (viewMode === 'daily') {
        setDailyRecords(prev => prev.map(r => r.student._id === studentId ? { ...r, status: newStatus } : r));
      }
      
      // Refresh summary to keep percentages accurate
      const res = await axios.get(`/faculty/attendance?subjectId=${selectedSubject}&month=${month}&year=${year}&type=${selectedType}`);
      setSummary(res.data.summary);
      
      toast.success('Status updated');
    } catch (err) { toast.error('Failed to update'); }
  };

  const downloadPDF = async (type = 'monthly') => {
    setDownloading(true);
    try {
      const res = await axios.get(`/reports/attendance/pdf?subjectId=${selectedSubject}&month=${month}&year=${year}&type=${type}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a'); a.href = url;
      a.download = `Attendance_${MONTHS[month-1]}_${year}_${type}.pdf`;
      a.click(); window.URL.revokeObjectURL(url);
      toast.success('Report downloaded!');
    } catch (err) { toast.error('Download failed'); }
    finally { setDownloading(false); }
  };

  const formatTime = (s) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;
  const avgAtt = summary.length ? (summary.reduce((a, b) => a + parseFloat(b.percentage), 0) / summary.length).toFixed(1) : 0;

  return (
    <div className="space-y-6">
      <div className="card">
        <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-xl flex items-center justify-center">
              <Calendar size={20} className="text-white" />
            </div>
            <div>
              <h1 className="font-bold text-gray-800 text-lg">Attendance</h1>
              <p className="text-xs text-gray-400">Generate codes, view reports, and download attendance</p>
            </div>
          </div>
          <div className="flex gap-2">
            {['view', 'generate'].map(t => (
              <button key={t} onClick={() => setActiveTab(t)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === t ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
                {t === 'view' ? '📊 View Report' : '🔑 Generate Code'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Generate Code Tab */}
      {activeTab === 'generate' && (
        <div className="card space-y-5">
          <div className="flex items-center gap-3">
            <KeyRound size={20} className="text-blue-600" />
            <h2 className="font-semibold text-gray-800">Generate Attendance Code</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">Year</label>
              <select className="input cursor-pointer" value={filterYear} onChange={e => setFilterYear(e.target.value)}>
                {availableYears.length === 0 && <option value="">No Years</option>}
                {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">Subject</label>
              <select className="input cursor-pointer" value={codeSubject} onChange={e => setCodeSubject(e.target.value)}>
                <option value="">-- Select Subject --</option>
                {subjects.map(s => <option key={s._id} value={s._id}>{s.name} ({s.code})</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 mb-1.5 block">Attendance Type</label>
            <div className="flex gap-3">
              {['theory', 'practical'].map(t => (
                <button key={t} onClick={() => setCodeType(t)}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border-2 transition-all capitalize ${
                    codeType === t ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-500'}`}>
                  {t === 'theory' ? '📚 Theory' : '🔬 Practical'}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 mb-1.5 block flex items-center gap-1.5">
              <Timer size={14} />Time Limit (minutes)
            </label>
            <div className="flex gap-3 flex-wrap">
              {[5, 10, 15, 20, 30].map(m => (
                <button key={m} onClick={() => setCodeMinutes(m)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium border-2 transition-all ${codeMinutes === m ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-500'}`}>
                  {m}m
                </button>
              ))}
              <input type="number" className="input w-24 text-center text-sm" value={codeMinutes}
                onChange={e => setCodeMinutes(Math.max(1, parseInt(e.target.value) || 1))} min={1} max={120} />
            </div>
          </div>

          {/* Generated Code Display */}
          {generatedCode && (
            <div className="bg-gradient-to-br from-blue-600 to-cyan-500 rounded-2xl p-6 text-white text-center">
              <p className="text-sm font-medium opacity-80 mb-2">Secret Attendance Code — {codeType === 'theory' ? '📚 Theory' : '🔬 Practical'}</p>
              <div className="text-5xl font-extrabold tracking-[0.3em] font-mono mb-4">{generatedCode}</div>
              <div className="flex items-center justify-center gap-2 bg-white/20 rounded-xl py-2 px-4">
                <Timer size={16} />
                <span className="font-mono font-bold text-lg">{formatTime(codeTimeLeft)}</span>
                <span className="text-sm opacity-70">remaining</span>
              </div>
              <p className="text-xs opacity-60 mt-3">Share this code with students. It expires automatically.</p>
            </div>
          )}

          <button onClick={generateCode} disabled={generating || !codeSubject}
            className="w-full btn-primary py-3 flex items-center justify-center gap-2">
            <RefreshCw size={16} className={generating ? 'animate-spin' : ''} />
            {generating ? 'Generating...' : generatedCode ? 'Regenerate Code' : 'Generate Code'}
          </button>
        </div>
      )}

      {/* View Attendance Tab */}
      {activeTab === 'view' && (
        <>
          <div className="card">
            <div className="flex items-center justify-between mb-4 bg-gray-50 p-2 rounded-xl border border-gray-100">
              <div className="flex gap-1 flex-1">
                {['monthly', 'daily'].map(m => (
                  <button key={m} onClick={() => setViewMode(m)}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all capitalize shadow-sm ${viewMode === m ? 'bg-white text-blue-600 border border-blue-100' : 'text-gray-400 border border-transparent'}`}>
                    {m === 'monthly' ? '📅 Monthly Summary' : '📍 Daily Record'}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
              <select className="input sm:col-span-1" value={filterYear} onChange={e => setFilterYear(e.target.value)}>
                {availableYears.length === 0 && <option value="">No Years</option>}
                {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
              
              <select className="input sm:col-span-1" value={selectedSubject} onChange={e => setSelectedSubject(e.target.value)}>
                <option value="">-- Select Subject --</option>
                {subjects.map(s => <option key={s._id} value={s._id}>{s.name} ({s.code})</option>)}
              </select>
              
              <select className="input" value={selectedType} onChange={e => setSelectedType(e.target.value)}>
                <option value="all">All Types</option>
                <option value="theory">Theory Only</option>
                <option value="practical">Practical Only</option>
              </select>

              {viewMode === 'monthly' ? (
                <>
                  <select className="input" value={month} onChange={e => setMonth(parseInt(e.target.value))}>
                    {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
                  </select>
                  <select className="input" value={year} onChange={e => setYear(parseInt(e.target.value))}>
                    {[currentYear, currentYear - 1, currentYear - 2].map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </>
              ) : (
                <div className="sm:col-span-2">
                  <input type="date" className="input" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} />
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-4">
              <button onClick={fetchAttendance} disabled={loading} className="btn-primary flex items-center gap-2 flex-1">
                <Search size={16} />{loading ? 'Loading...' : `View ${viewMode === 'daily' ? 'Daily' : 'Monthly'} Attendance`}
              </button>
              {searched && (
                <>
                  <button onClick={() => downloadPDF('monthly')} disabled={downloading} className="btn-secondary flex items-center gap-2 px-5">
                    <Download size={16} />Monthly PDF
                  </button>
                </>
              )}
            </div>
          </div>

          {searched && (
            <>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { label: 'Total Students', value: summary.length, color: 'text-blue-500', bg: 'bg-blue-50' },
                  { label: 'Class Avg', value: `${avgAtt}%`, color: 'text-green-500', bg: 'bg-green-50' },
                  { label: 'Below 75%', value: summary.filter(s => parseFloat(s.percentage) < 75).length, color: 'text-red-500', bg: 'bg-red-50' },
                ].map((s, i) => (
                  <div key={i} className="card flex items-center gap-3 py-4">
                    <div className={`w-10 h-10 ${s.bg} rounded-xl flex items-center justify-center flex-shrink-0`}>
                      <span className={`text-base font-bold ${s.color}`}>{s.value}</span>
                    </div>
                    <span className="text-xs text-gray-400 font-medium">{s.label}</span>
                  </div>
                ))}
              </div>

              <div className="card">
                <h2 className="font-semibold text-gray-700 mb-4 flex items-center gap-2">
                  <Users size={16} className="text-blue-600" />
                  {viewMode === 'daily' 
                    ? `Daily Attendance — ${new Date(selectedDate).toLocaleDateString()}`
                    : `${MONTHS[month - 1]} ${year} — Attendance Summary`
                  }
                </h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-xs text-gray-400 border-b border-gray-100">
                        <th className="pb-3 font-medium">Roll No</th>
                        <th className="pb-3 font-medium">Student Name</th>
                        {viewMode === 'monthly' ? (
                          <>
                            <th className="pb-3 font-medium text-center">Present</th>
                            <th className="pb-3 font-medium text-center">Total</th>
                            <th className="pb-3 font-medium text-center">%</th>
                          </>
                        ) : (
                          <>
                            <th className="pb-3 font-medium text-center">Type</th>
                            <th className="pb-3 font-medium text-center">Method</th>
                          </>
                        )}
                        <th className="pb-3 font-medium text-center">Branch</th>
                        <th className="pb-3 font-medium text-center">{viewMode === 'daily' ? 'Mark Status' : 'Overview'}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {(viewMode === 'monthly' ? summary : dailyRecords).map((r, i) => {
                        if (viewMode === 'monthly') {
                          const pct = parseFloat(r.percentage);
                          return (
                            <tr key={i} className="hover:bg-gray-50 transition-colors">
                              <td className="py-3 text-xs text-gray-400">{r.student.rollNo || '-'}</td>
                              <td className="py-3 font-medium text-gray-700">{r.student.name}</td>
                              <td className="py-3 text-center text-green-600 font-medium">{r.present}</td>
                              <td className="py-3 text-center text-gray-400">{r.total}</td>
                              <td className="py-3 text-center">
                                <div className="flex items-center justify-center gap-2">
                                  <div className="w-16 bg-gray-100 rounded-full h-1.5">
                                    <div className={`h-1.5 rounded-full ${pct >= 75 ? 'bg-green-500' : 'bg-red-400'}`} style={{ width: `${Math.min(pct, 100)}%` }} />
                                  </div>
                                <span className={`text-sm font-bold ${pct >= 75 ? 'text-green-600' : 'text-red-500'}`}>{r.percentage}%</span>
                                </div>
                              </td>
                              <td className="py-3 text-center text-xs text-gray-500">{r.student.branch || 'IT'}</td>
                              <td className="py-3 text-center">
                                <span className={`text-xs px-2 py-1 rounded-full font-medium ${pct >= 75 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                                  {pct >= 75 ? '✓ Regular' : '⚠ Low'}
                                </span>
                              </td>
                            </tr>
                          );
                        } else {
                          // Daily View row
                          const isPresent = r.status === 'present';
                          return (
                            <tr key={i} className="hover:bg-gray-50 transition-colors">
                              <td className="py-3 text-xs text-gray-400">{r.student.rollNo || '-'}</td>
                              <td className="py-3 font-medium text-gray-700">{r.student.name}</td>
                              <td className="py-3 text-center capitalize">{r.type}</td>
                              <td className="py-3 text-center text-xs text-gray-400 italic">{r.markedVia || 'unmarked'}</td>
                              <td className="py-3 text-center text-xs text-gray-500">{r.student.branch || 'IT'}</td>
                              <td className="py-3 text-center">
                                <button
                                  onClick={() => toggleStatus(r.student._id, r.status)}
                                  className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 mx-auto ${
                                    isPresent ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-red-100 text-red-600 border border-red-200'
                                  }`}
                                >
                                  {isPresent ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}
                                  {isPresent ? 'PRESENT' : 'ABSENT'}
                                </button>
                              </td>
                            </tr>
                          );
                        }
                      })}
                      {(viewMode === 'monthly' ? summary : dailyRecords).length === 0 && <tr><td colSpan={6} className="text-center py-8 text-gray-400">No attendance data found</td></tr>}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
