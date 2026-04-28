import { useState, useEffect } from 'react';
import { X, User, Mail, Hash, BookOpen, Key, Save, Camera, CheckCircle, Eye, EyeOff } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';

export default function ProfilePanel({ open, onClose }) {
  const { user, login } = useAuth();
  const [tab, setTab] = useState('profile'); // profile | password
  const [form, setForm] = useState({
    name: '',
    email: '',
    rollNo: '',
    year: '',
    branch: '',
    division: '',
    department: '',
    profileImage: '',
  });
  const [passForm, setPassForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [saving, setSaving] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    if (user) {
      setForm({
        name: user.name || '',
        email: user.email || '',
        rollNo: user.rollNo || '',
        year: user.year || '',
        branch: user.branch || '',
        division: user.division || '',
        department: user.department || '',
        profileImage: user.profileImage || '',
      });
    }
  }, [user, open]);

  const saveProfile = async () => {
    if (!form.name || !form.email) { toast.error('Name and email are required'); return; }
    setSaving(true);
    try {
      const res = await axios.put('/auth/profile', form);
      toast.success('Profile updated successfully!');
      // Update local storage token user data
      window.location.reload(); // simplest way to refresh user context
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const changePassword = async () => {
    if (!passForm.currentPassword || !passForm.newPassword) { toast.error('Fill all password fields'); return; }
    if (passForm.newPassword !== passForm.confirmPassword) { toast.error('Passwords do not match'); return; }
    if (passForm.newPassword.length < 6) { toast.error('Password must be at least 6 characters'); return; }
    setSaving(true);
    try {
      await axios.put('/auth/change-password', { currentPassword: passForm.currentPassword, newPassword: passForm.newPassword });
      toast.success('Password changed!');
      setPassForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change password');
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('image', file);
    const toastId = toast.loading('Uploading image...');
    try {
      const res = await axios.post('/auth/profile-image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setForm({...form, profileImage: res.data.profileImage});
      toast.success('Image uploaded successfully!', { id: toastId });
      // We will reload to sync immediately or the user can just push Save Changes
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed', { id: toastId });
    }
  };

  const roleColors = { admin: 'from-purple-500 to-purple-700', faculty: 'from-blue-500 to-blue-700', student: 'from-emerald-500 to-emerald-700' };
  const roleLabels = { admin: 'Administrator', faculty: 'Faculty', student: 'Student' };
  const YEARS = ['First Year', 'Second Year', 'Third Year', 'Fourth Year'];
  const BRANCHES = ['Computer Science', 'Information Technology', 'Electronics', 'Mechanical', 'Civil', 'Electrical', 'Chemical', 'Other'];

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${open ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className={`fixed top-0 right-0 z-50 h-full w-full max-w-sm bg-white shadow-2xl transition-transform duration-300 flex flex-col ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className={`bg-gradient-to-br ${roleColors[user?.role] || 'from-blue-500 to-blue-700'} p-6 flex-shrink-0`}>
          <div className="flex items-start justify-between mb-4">
            <h2 className="text-white font-bold text-lg">My Profile</h2>
            <button onClick={onClose} className="text-white/70 hover:text-white transition-colors">
              <X size={20} />
            </button>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center text-white font-bold text-2xl overflow-hidden">
                {user?.profileImage ? (
                  <img src={user.profileImage} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  user?.name?.charAt(0).toUpperCase()
                )}
              </div>
              <label className="absolute -bottom-1 -right-1 w-6 h-6 bg-white rounded-full flex items-center justify-center cursor-pointer hover:bg-gray-100 shadow-sm border border-gray-100">
                <Camera size={12} className={`text-${user?.role === 'admin' ? 'purple' : user?.role === 'faculty' ? 'blue' : 'emerald'}-600`} />
                <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
              </label>
            </div>
            <div>
              <p className="text-white font-bold">{user?.name}</p>
              <p className="text-white/70 text-xs">{roleLabels[user?.role]}</p>
              {user?.rollNo && <p className="text-white/60 text-xs font-mono mt-0.5">{user.rollNo}</p>}
              {user?.role === 'faculty' && user?.department && <p className="text-white/60 text-xs font-mono mt-0.5">{user.department}</p>}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100 flex-shrink-0">
          {['profile', 'password'].map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`flex-1 py-3 text-sm font-medium transition-colors capitalize ${
                tab === t ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              {t === 'profile' ? 'Edit Profile' : 'Change Password'}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {tab === 'profile' ? (
            <>
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1.5 block flex items-center gap-1.5">
                  <User size={12} /> Full Name *
                </label>
                <input className="input" value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="Your full name" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1.5 block flex items-center gap-1.5">
                  <Mail size={12} /> Email Address *
                </label>
                <input className="input" type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} placeholder="your@email.com" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1.5 block flex items-center gap-1.5">
                  <Camera size={12} /> Profile Photo
                </label>
                <div className="flex bg-gray-50 rounded-xl border border-gray-200 overflow-hidden">
                   <div className="flex-1 py-2 px-3 text-sm text-gray-500 truncate bg-white border-r border-gray-200">
                     {form.profileImage ? 'Image uploaded' : 'Select an image...'}
                   </div>
                   <label className="px-4 py-2 bg-gray-50 hover:bg-gray-100 text-sm font-medium text-gray-600 cursor-pointer transition-colors">
                     Browse
                     <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                   </label>
                </div>
              </div>

              {user?.role === 'faculty' && (
                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1.5 block flex items-center gap-1.5">
                    <BookOpen size={12} /> Department
                  </label>
                  <input className="input" value={form.department} onChange={e => setForm({...form, department: e.target.value})} placeholder="e.g. Computer Science" />
                </div>
              )}

              {user?.role === 'student' && (
                <>
                  <div>
                    <label className="text-xs font-medium text-gray-500 mb-1.5 block flex items-center gap-1.5">
                      <Hash size={12} /> Roll Number
                    </label>
                    <input className="input bg-gray-50 text-gray-500 cursor-not-allowed" value={form.rollNo} readOnly disabled />
                    <p className="text-[10px] text-gray-400 mt-1 italic">Contact admin to change academic details</p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 mb-1.5 block flex items-center gap-1.5">
                      <BookOpen size={12} /> Year
                    </label>
                    <input className="input bg-gray-50 text-gray-500 cursor-not-allowed" value={form.year} readOnly disabled />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 mb-1.5 block">Branch</label>
                    <input className="input bg-gray-50 text-gray-500 cursor-not-allowed" value={form.branch} readOnly disabled />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 mb-1.5 block">Division</label>
                    <input className="input" value={form.division} onChange={e => setForm({...form, division: e.target.value})} placeholder="e.g. A, B" />
                  </div>
                </>
              )}

              <button onClick={saveProfile} disabled={saving} className="w-full btn-primary py-3 flex items-center justify-center gap-2 mt-2">
                {saving ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Saving...</> : <><Save size={16} />Save Changes</>}
              </button>
            </>
          ) : (
            <>
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1.5 block flex items-center gap-1.5">
                  <Key size={12} /> Current Password
                </label>
                <div className="relative">
                  <input className="input pr-10" type={showCurrent ? 'text' : 'password'} value={passForm.currentPassword}
                    onChange={e => setPassForm({...passForm, currentPassword: e.target.value})} placeholder="••••••••" />
                  <button type="button" onClick={() => setShowCurrent(!showCurrent)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                    {showCurrent ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1.5 block flex items-center gap-1.5">
                  <Key size={12} /> New Password
                </label>
                <div className="relative">
                  <input className="input pr-10" type={showNew ? 'text' : 'password'} value={passForm.newPassword}
                    onChange={e => setPassForm({...passForm, newPassword: e.target.value})} placeholder="Min 6 characters" />
                  <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                    {showNew ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1.5 block flex items-center gap-1.5">
                  <CheckCircle size={12} /> Confirm New Password
                </label>
                <div className="relative">
                  <input className="input pr-10" type={showConfirm ? 'text' : 'password'} value={passForm.confirmPassword}
                    onChange={e => setPassForm({...passForm, confirmPassword: e.target.value})} placeholder="Repeat new password" />
                  <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                    {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>
              {passForm.newPassword && passForm.confirmPassword && passForm.newPassword !== passForm.confirmPassword && (
                <p className="text-red-500 text-xs font-medium mt-1">Passwords do not match</p>
              )}
              <button onClick={changePassword} disabled={saving} className="w-full btn-primary py-3 flex items-center justify-center gap-2 mt-2">
                {saving ? 'Changing...' : 'Change Password'}
              </button>
              <p className="text-xs text-gray-400 text-center">You will remain logged in after changing your password.</p>
            </>
          )}
        </div>
      </div>
    </>
  );
}
