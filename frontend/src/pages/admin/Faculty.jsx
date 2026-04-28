import { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Users, Plus, ToggleLeft, ToggleRight, Edit2, BookOpen, X, Trash2, Mail, Loader, ShieldCheck } from 'lucide-react';

const DEPARTMENTS = [
  'Computer Science',
  'Information Technology',
  'Electronics & Telecommunication',
  'Mechanical Engineering',
  'Civil Engineering',
  'Electrical Engineering',
  'Artificial Intelligence & Data Science',
  'Chemical Engineering',
  'Other',
];

export default function AdminFaculty() {
  const [facultyList, setFacultyList] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ email: '', password: '', name: '', department: '' });

  // OTP flow: idle | sending | sent | verifying
  const [otpStep, setOtpStep] = useState('idle');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);

  useEffect(() => {
    fetchFaculty();
    axios.get('/admin/subjects').then(r => setSubjects(r.data.subjects));
  }, []);

  const fetchFaculty = async () => {
    const res = await axios.get('/admin/users?role=faculty');
    setFacultyList(res.data.users);
  };

  const resetForm = () => {
    setShowForm(false);
    setEditId(null);
    setForm({ email: '', password: '', name: '', department: '' });
    setOtpStep('idle');
    setOtp(['', '', '', '', '', '']);
  };

  const handleOtpChange = (index, value) => {
    if (isNaN(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    if (value && index < 5) {
      document.getElementById(`faculty-otp-${index + 1}`)?.focus();
    }
  };

  // Step 1: Send OTP to faculty email
  const requestOTP = async () => {
    if (!form.name || !form.email || !form.password || !form.department) {
      toast.error('Please fill all fields first');
      return;
    }
    if (form.password.length < 6) { toast.error('Password must be at least 6 characters'); return; }
    setOtpStep('sending');
    try {
      const res = await axios.post('/admin/faculty/request-otp', {
        name: form.name, email: form.email, password: form.password, department: form.department
      });
      toast.success(res.data.message);
      setOtpStep('sent');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send OTP');
      setOtpStep('idle');
    }
  };

  // Step 2: Verify OTP and create faculty
  const verifyAndCreate = async () => {
    const otpString = otp.join('');
    if (otpString.length !== 6) { toast.error('Please enter the 6-digit OTP'); return; }
    setOtpStep('verifying');
    try {
      await axios.post('/admin/faculty/verify-and-create', { email: form.email, otp: otpString });
      toast.success('Faculty created successfully! They can now log in.');
      resetForm();
      fetchFaculty();
    } catch (err) {
      toast.error(err.response?.data?.message || 'OTP verification failed');
      setOtpStep('sent');
    }
  };

  // Edit existing faculty (direct update, no OTP)
  const saveFaculty = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = { name: form.name, email: form.email, department: form.department };
      if (form.password) payload.password = form.password;
      await axios.put(`/admin/users/${editId}`, payload);
      toast.success('Faculty updated!');
      resetForm();
      fetchFaculty();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setLoading(false); }
  };

  const startEdit = (t) => {
    setEditId(t._id);
    setForm({ email: t.email, password: '', name: t.name, department: t.department || '' });
    setOtpStep('idle');
    setShowForm(true);
  };

  const toggleUser = async (id) => {
    await axios.put(`/admin/users/${id}/toggle`);
    fetchFaculty();
    toast.success('Status updated');
  };

  const deleteFaculty = async (id) => {
    if (!window.confirm('Permanently delete this faculty member? This cannot be undone.')) return;
    try {
      await axios.delete(`/admin/users/${id}`);
      toast.success('Faculty permanently deleted');
      fetchFaculty();
      axios.get('/admin/subjects').then(r => setSubjects(r.data.subjects));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete faculty');
    }
  };

  const assignSubject = async (facultyId, subjectId) => {
    try {
      await axios.post('/admin/assign-subject', { facultyId, subjectId });
      toast.success('Subject assigned!');
      fetchFaculty();
      axios.get('/admin/subjects').then(r => setSubjects(r.data.subjects));
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to assign'); }
  };

  const removeSubject = async (facultyId, subjectId) => {
    try {
      await axios.post('/admin/remove-subject', { facultyId, subjectId });
      toast.success('Subject removed');
      fetchFaculty();
      axios.get('/admin/subjects').then(r => setSubjects(r.data.subjects));
    } catch (err) { toast.error('Failed to remove'); }
  };

  const unassignedSubjects = subjects.filter(s => !s.faculty);

  return (
    <div className="space-y-6">
      <div className="card">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl flex items-center justify-center">
              <Users size={20} className="text-white" />
            </div>
            <div>
              <h1 className="font-bold text-gray-800 text-lg">Faculty</h1>
              <p className="text-xs text-gray-400">Manage faculty and subject assignments</p>
            </div>
          </div>
          <button
            onClick={() => { if (showForm && !editId) { resetForm(); } else { resetForm(); setShowForm(true); } }}
            className="btn-primary flex items-center gap-2 text-sm"
          >
            {showForm && !editId ? <X size={16} /> : <Plus size={16} />}
            {showForm && !editId ? 'Cancel' : 'Add Faculty'}
          </button>
        </div>
      </div>

      {/* NEW Faculty — OTP flow */}
      {showForm && !editId && (
        <div className="card animate-fade-in">
          {/* Step 1: Details form */}
          {(otpStep === 'idle' || otpStep === 'sending') && (
            <div className="space-y-4">
              <h2 className="font-semibold text-gray-800">New Faculty</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input className="input" type="email" placeholder="Faculty Email *" value={form.email} onChange={e => setForm({...form, email: e.target.value})} required />
                <input className="input" type="password" placeholder="Set Password (min 6 chars) *" value={form.password} onChange={e => setForm({...form, password: e.target.value})} />
                <input className="input sm:col-span-2" placeholder="Full Name *" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
                <select className="input sm:col-span-2" value={form.department} onChange={e => setForm({...form, department: e.target.value})} required>
                  <option value="">-- Select Department *</option>
                  {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <button
                onClick={requestOTP}
                disabled={otpStep === 'sending'}
                className="w-full btn-primary py-3 flex items-center justify-center gap-2"
              >
                {otpStep === 'sending' ? <Loader size={16} className="animate-spin" /> : <Mail size={16} />}
                {otpStep === 'sending' ? 'Sending OTP...' : 'Send OTP to Email'}
              </button>
            </div>
          )}

          {/* Step 2: OTP verification — matches Register.jsx style */}
          {(otpStep === 'sent' || otpStep === 'verifying') && (
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-6">
                <Mail size={32} className="text-blue-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-800 mb-2">Verify Faculty Email</h2>
              <p className="text-sm text-gray-500 text-center mb-8">
                We've sent a 6-digit code to <br />
                <span className="font-semibold text-gray-800">{form.email}</span>
              </p>

              {/* 6 individual OTP boxes */}
              <div className="flex justify-between gap-2 mb-8 w-full max-w-xs">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    id={`faculty-otp-${index}`}
                    type="text"
                    maxLength={1}
                    className="w-12 h-14 text-center text-2xl font-bold border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors"
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Backspace' && !digit && index > 0) {
                        document.getElementById(`faculty-otp-${index - 1}`)?.focus();
                      }
                    }}
                  />
                ))}
              </div>

              <div className="space-y-3 w-full max-w-xs">
                <button
                  onClick={verifyAndCreate}
                  disabled={otpStep === 'verifying' || otp.join('').length !== 6}
                  className="w-full btn-primary py-3.5 text-base rounded-xl font-semibold shadow-lg shadow-blue-500/30 disabled:opacity-70 flex items-center justify-center gap-2"
                >
                  {otpStep === 'verifying' ? <Loader size={16} className="animate-spin" /> : <ShieldCheck size={16} />}
                  {otpStep === 'verifying' ? 'Verifying...' : 'Verify & Create Faculty'}
                </button>
                <button
                  type="button"
                  onClick={() => { setOtpStep('idle'); setOtp(['', '', '', '', '', '']); }}
                  className="w-full py-3 text-sm text-gray-500 font-medium hover:text-gray-800 transition-colors"
                >
                  ← Change details / Resend OTP
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* EDIT Faculty form */}
      {showForm && editId && (
        <form onSubmit={saveFaculty} className="card space-y-4">
          <h2 className="font-semibold text-gray-800 flex items-center gap-2">
            <Edit2 size={16} className="text-blue-500" /> Edit Faculty
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input className="input" type="email" placeholder="Email *" value={form.email} onChange={e => setForm({...form, email: e.target.value})} required />
            <input className="input" type="password" placeholder="New Password (leave blank to keep)" value={form.password} onChange={e => setForm({...form, password: e.target.value})} minLength={form.password ? 6 : 0} />
            <input className="input" placeholder="Full Name *" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
            <select className="input" value={form.department} onChange={e => setForm({...form, department: e.target.value})} required>
              <option value="">-- Select Department *</option>
              {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div className="flex gap-3">
            <button type="submit" disabled={loading} className="btn-primary flex-1">{loading ? 'Saving...' : 'Update Faculty'}</button>
            <button type="button" onClick={resetForm} className="btn-secondary flex-1">Cancel</button>
          </div>
        </form>
      )}

      {/* Faculty list */}
      <div className="space-y-4">
        {facultyList.map(t => (
          <div key={t._id} className="card">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                  {t.name?.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-gray-800">{t.name}</p>
                  <p className="text-xs text-gray-400 truncate">{t.email} {t.department && `• ${t.department}`}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0 w-full sm:w-auto justify-end">
                <span className={`text-[10px] px-2 py-1 rounded-full font-bold uppercase tracking-wider ${t.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-500'}`}>
                  {t.isActive ? 'Active' : 'Inactive'}
                </span>
                <button onClick={() => toggleUser(t._id)}>
                  {t.isActive ? <ToggleRight size={22} className="text-blue-600" /> : <ToggleLeft size={22} className="text-gray-300" />}
                </button>
                <div className="h-4 w-px bg-gray-200 mx-1"></div>
                <button onClick={() => startEdit(t)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Edit Faculty">
                  <Edit2 size={16} />
                </button>
                <button onClick={() => deleteFaculty(t._id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete Faculty">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>

            {/* Assigned subjects */}
            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                <BookOpen size={11} /> Assigned Subjects
              </p>
              <div className="flex flex-wrap gap-2 mb-3">
                {t.subjects?.length > 0 ? t.subjects.map(s => (
                  <div key={s._id} className="flex items-center gap-1.5 bg-blue-50 text-blue-700 px-3 py-1 rounded-lg text-xs font-medium">
                    {s.name} <span className="opacity-60">({s.code})</span>
                    <button onClick={() => removeSubject(t._id, s._id)} className="text-blue-400 hover:text-red-500 transition-colors ml-1">
                      <X size={11} />
                    </button>
                  </div>
                )) : <span className="text-xs text-gray-400">No subjects assigned</span>}
              </div>
              {unassignedSubjects.length > 0 && (
                <select className="input text-sm py-1.5 w-full sm:w-auto" defaultValue=""
                  onChange={e => { if (e.target.value) { assignSubject(t._id, e.target.value); e.target.value = ''; } }}>
                  <option value="">+ Assign a subject</option>
                  {unassignedSubjects.map(s => (
                    <option key={s._id} value={s._id}>{s.name} ({s.code}) — {s.class}</option>
                  ))}
                </select>
              )}
            </div>
          </div>
        ))}
        {facultyList.length === 0 && (
          <div className="card text-center py-12">
            <Users size={36} className="text-gray-200 mx-auto mb-2" />
            <p className="text-gray-400">No faculty members yet. Add one above.</p>
          </div>
        )}
      </div>
    </div>
  );
}
