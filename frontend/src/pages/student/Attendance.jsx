import { useState, useEffect } from 'react';
import axios from 'axios';
import { Calendar, TrendingUp, CheckCircle, XCircle, Loader, KeyRound, BookOpen } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export default function StudentAttendance() {
  const { user } = useAuth();
  const [attendance, setAttendance] = useState([]);
  const [stats, setStats] = useState({ total: 0, present: 0, percentage: '0.0' });
  const [selectedSubject, setSelectedSubject] = useState('');
  const [loading, setLoading] = useState(true);
  const [attType, setAttType] = useState('theory'); // theory | practical
  const [codeForm, setCodeForm] = useState({ subject: '', code: '', type: 'theory' });
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('view'); // view | give
  const [subjects, setSubjects] = useState([]);

  useEffect(() => {
    axios.get('/student/subjects').then(r => setSubjects(r.data.subjects || [])).catch(() => {});
  }, []);

  useEffect(() => { fetchAttendance(); }, [selectedSubject, attType]);

  const fetchAttendance = async () => {
    setLoading(true);
    try {
      let url = '/student/attendance';
      const params = [];
      if (selectedSubject) params.push(`subjectId=${selectedSubject}`);
      if (attType) params.push(`type=${attType}`);
      if (params.length) url += '?' + params.join('&');
      const res = await axios.get(url);
      setAttendance(res.data.attendance);
      setStats({ total: res.data.total, present: res.data.present, percentage: res.data.percentage });
    } catch (err) {
      console.error(err);
    } finally { setLoading(false); }
  };

  const submitAttendanceCode = async () => {
    if (!codeForm.subject || !codeForm.code) { toast.error('Select subject and enter the code'); return; }
    setSubmitting(true);
    try {
      await axios.post('/student/attendance/code', {
        subjectId: codeForm.subject,
        code: codeForm.code.toUpperCase(),
        type: codeForm.type
      });
      toast.success(`✅ ${codeForm.type === 'theory' ? 'Theory' : 'Practical'} attendance marked as Present!`);
      setCodeForm({ subject: '', code: '', type: 'theory' });
      fetchAttendance();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid or expired code');
    } finally { setSubmitting(false); }
  };

  const absent = stats.total - stats.present;
  const pieData = [{ name: 'Present', value: stats.present }, { name: 'Absent', value: absent }];
  const byMonth = attendance.reduce((acc, a) => {
    const key = `${a.month || new Date(a.date).getMonth() + 1}-${a.year || new Date(a.date).getFullYear()}`;
    if (!acc[key]) acc[key] = { month: a.month || new Date(a.date).getMonth() + 1, year: a.year || new Date(a.date).getFullYear(), records: [] };
    acc[key].records.push(a);
    return acc;
  }, {});
  const pct = parseFloat(stats.percentage);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-xl flex items-center justify-center">
              <Calendar size={20} className="text-white" />
            </div>
            <div>
              <h1 className="font-bold text-gray-800 text-lg">My Attendance</h1>
              <p className="text-xs text-gray-400">Track your class attendance record</p>
            </div>
          </div>
          <div className="flex gap-2">
            {['view', 'give'].map(t => (
              <button key={t} onClick={() => setActiveTab(t)}
                className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-all ${activeTab === t ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
                {t === 'view' ? ' View' : ' Give Attendance'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Give Attendance Tab */}
      {activeTab === 'give' && (
        <div className="card space-y-5">
          <div className="flex items-center gap-3 mb-2">
            <KeyRound size={20} className="text-blue-600" />
            <h2 className="font-semibold text-gray-800">Mark Your Attendance</h2>
          </div>

          {/* Theory / Practical toggle */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">Attendance Type</label>
            <div className="flex gap-3">
              {['theory', 'practical'].map(t => (
                <button key={t} onClick={() => setCodeForm({ ...codeForm, type: t })}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border-2 transition-all capitalize ${codeForm.type === t ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}>
                  {t === 'theory' ? ' Theory' : 'Practical'}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 mb-1.5 block">Select Subject</label>
            <select className="input" value={codeForm.subject} onChange={e => setCodeForm({ ...codeForm, subject: e.target.value })}>
              <option value="">-- Select Subject --</option>
              {subjects.map(s => <option key={s._id} value={s._id}>{s.name} {s.code ? `(${s.code})` : ''}</option>)}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 mb-1.5 block">Secret Code (from Faculty)</label>
            <input className="input text-center text-2xl font-bold tracking-widest uppercase" maxLength={8}
              placeholder="Enter Code" value={codeForm.code}
              onChange={e => setCodeForm({ ...codeForm, code: e.target.value.toUpperCase() })} />
          </div>

          <button onClick={submitAttendanceCode} disabled={submitting || !codeForm.subject || !codeForm.code}
            className="w-full btn-primary py-3 flex items-center justify-center gap-2">
            {submitting ? 'Marking...' : `✅ Mark ${codeForm.type === 'theory' ? 'Theory' : 'Practical'} Attendance`}
          </button>

          <p className="text-xs text-gray-400 text-center">
            The code is provided by your faculty and is valid for a limited time only.
          </p>
        </div>
      )}

      {/* View Attendance Tab */}
      {activeTab === 'view' && (
        <>
          {/* Filters */}
          <div className="card">
            <div className="flex flex-wrap gap-3">
              <select className="input text-sm py-1.5 flex-1 min-w-32" value={selectedSubject} onChange={e => setSelectedSubject(e.target.value)}>
                <option value="">All Subjects</option>
                {subjects.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
              </select>
              <div className="flex gap-2">
                {['theory', 'practical'].map(t => (
                  <button key={t} onClick={() => setAttType(t)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-all ${attType === t ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-500'}`}>
                    {t === 'theory' ? 'Theory' : ' Practical'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-16"><Loader size={24} className="animate-spin text-blue-600" /></div>
          ) : (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Pie chart */}
                <div className="card flex flex-col items-center">
                  <h2 className="font-semibold text-gray-700 mb-4 self-start capitalize">{attType} Attendance</h2>
                  <div className="relative">
                    <ResponsiveContainer width={160} height={160}>
                      <PieChart>
                        <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={70} dataKey="value" startAngle={90} endAngle={-270}>
                          <Cell fill="#2563EB" />
                          <Cell fill="#E5E7EB" />
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className={`text-2xl font-bold ${pct >= 75 ? 'text-green-600' : 'text-red-500'}`}>{stats.percentage}%</span>
                    </div>
                  </div>
                  <div className="flex gap-4 mt-3 text-xs">
                    <span className="flex items-center gap-1 text-gray-500"><span className="w-3 h-3 bg-blue-600 rounded-full inline-block" />Present: {stats.present}</span>
                    <span className="flex items-center gap-1 text-gray-500"><span className="w-3 h-3 bg-gray-200 rounded-full inline-block" />Absent: {absent}</span>
                  </div>
                  <div className={`mt-3 px-4 py-2 rounded-xl text-sm font-medium ${pct >= 75 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
                    {pct >= 75 ? '✓ Good Standing' : '⚠ Below 75% — Improve!'}
                  </div>
                  {pct < 75 && (
                    <p className="mt-2 text-xs text-red-400 text-center">You may receive low attendance notification</p>
                  )}
                </div>

                {/* Stats */}
                <div className="lg:col-span-2 grid grid-cols-3 gap-4 content-start">
                  {[
                    { label: 'Total Classes', value: stats.total, icon: Calendar, color: 'text-blue-500', bg: 'bg-blue-50' },
                    { label: 'Present', value: stats.present, icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-50' },
                    { label: 'Absent', value: absent, icon: XCircle, color: 'text-red-500', bg: 'bg-red-50' },
                  ].map((s, i) => (
                    <div key={i} className="card flex flex-col items-center py-5 gap-2">
                      <div className={`w-10 h-10 ${s.bg} rounded-xl flex items-center justify-center`}>
                        <s.icon size={20} className={s.color} />
                      </div>
                      <p className="text-2xl font-bold text-gray-800">{s.value}</p>
                      <p className="text-xs text-gray-400">{s.label}</p>
                    </div>
                  ))}
                  <div className="col-span-3 card bg-blue-50">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-600">Attendance Progress</span>
                      <span className="text-sm font-bold text-blue-600">{stats.percentage}%</span>
                    </div>
                    <div className="w-full bg-white rounded-full h-3 shadow-inner">
                      <div className={`h-3 rounded-full transition-all duration-700 ${pct >= 75 ? 'bg-gradient-to-r from-blue-600 to-cyan-500' : 'bg-red-400'}`}
                        style={{ width: `${Math.min(pct, 100)}%` }} />
                    </div>
                    <p className="text-xs text-gray-400 mt-2">Minimum required: 75%</p>
                  </div>
                </div>
              </div>

              {/* Monthly breakdown */}
              {Object.values(byMonth).length > 0 && (
                <div className="card">
                  <h2 className="font-semibold text-gray-700 mb-4">Monthly Breakdown — {attType === 'theory' ? '📚 Theory' : '🔬 Practical'}</h2>
                  <div className="space-y-3">
                    {Object.values(byMonth).sort((a, b) => b.year - a.year || b.month - a.month).map((m, i) => {
                      const presentInMonth = m.records.filter(r => r.status === 'present').length;
                      const pctMonth = m.records.length ? ((presentInMonth / m.records.length) * 100).toFixed(0) : 0;
                      return (
                        <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                          <div>
                            <span className="font-medium text-sm text-gray-700">{MONTHS[m.month - 1]} {m.year}</span>
                            <p className="text-xs text-gray-400">{presentInMonth}/{m.records.length} classes attended</p>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="w-24 bg-gray-200 rounded-full h-2">
                              <div className={`h-2 rounded-full ${pctMonth >= 75 ? 'bg-green-500' : 'bg-red-400'}`} style={{ width: `${pctMonth}%` }} />
                            </div>
                            <span className={`text-sm font-bold w-10 text-right ${pctMonth >= 75 ? 'text-green-600' : 'text-red-500'}`}>{pctMonth}%</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {attendance.length === 0 && (
                <div className="card text-center py-12">
                  <Calendar size={36} className="mx-auto mb-2 text-gray-200" />
                  <p className="text-gray-400">No attendance records yet.</p>
                  <button onClick={() => setActiveTab('give')} className="mt-3 btn-primary text-sm px-4 py-2">
                    Give Attendance Now →
                  </button>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
