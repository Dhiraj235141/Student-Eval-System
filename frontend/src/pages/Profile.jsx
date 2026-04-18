import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import toast from 'react-hot-toast';
import { User, Mail, Hash, BookOpen, Lock, Eye, EyeOff, Save, GraduationCap, Shield, Edit2, X, Briefcase } from 'lucide-react';

export default function Profile() {
  const { user, updateUser } = useAuth();
  
  // Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loadingPass, setLoadingPass] = useState(false);

  // Profile Edit state
  const [editingProfile, setEditingProfile] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [form, setForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    department: user?.department || ''
  });

  const roleConfig = {
    admin: { color: 'bg-purple-500', label: 'Administrator', icon: Shield },
    teacher: { color: 'bg-primary', label: 'Faculty', icon: User },
    student: { color: 'bg-success', label: 'Student', icon: GraduationCap }
  };
  const cfg = roleConfig[user?.role] || roleConfig.student;
  const RoleIcon = cfg.icon;

  const changePassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) { toast.error('New passwords do not match!'); return; }
    if (newPassword.length < 6) { toast.error('Password must be at least 6 characters'); return; }
    setLoadingPass(true);
    try {
      await axios.put('/auth/change-password', { currentPassword, newPassword });
      toast.success('Password changed successfully!');
      setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change password');
    } finally {
      setLoadingPass(false);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setLoadingProfile(true);
    try {
      const res = await axios.put('/auth/profile', form);
      updateUser(res.data.user);
      toast.success('Profile updated successfully!');
      setEditingProfile(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoadingProfile(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Profile card */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-5">
            <div className={`w-16 h-16 ${cfg.color} rounded-2xl flex items-center justify-center shadow-lg flex-shrink-0`}>
              <span className="text-white text-2xl font-bold">{user?.name?.charAt(0).toUpperCase()}</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-800">{user?.name}</h1>
              <div className="flex items-center gap-2 mt-1">
                <RoleIcon size={14} className="text-gray-400" />
                <span className="text-sm text-gray-400">{cfg.label}</span>
              </div>
            </div>
          </div>
          {user?.role === 'teacher' && !editingProfile && (
            <button onClick={() => setEditingProfile(true)} className="btn-secondary py-1.5 px-3 text-sm flex items-center gap-2">
              <Edit2 size={14} /> Edit Profile
            </button>
          )}
        </div>

        {editingProfile ? (
          <form onSubmit={handleUpdateProfile} className="space-y-4 bg-gray-50 border border-gray-100 p-5 rounded-2xl">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-bold text-gray-700">Edit Details</h3>
              <button type="button" onClick={() => setEditingProfile(false)} className="text-gray-400 hover:text-red-500">
                <X size={18} />
              </button>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Full Name</label>
                <input className="input w-full" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Email</label>
                <input type="email" className="input w-full" value={form.email} onChange={e => setForm({...form, email: e.target.value})} required />
              </div>
              <div className="sm:col-span-2">
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Department</label>
                <input className="input w-full" value={form.department} onChange={e => setForm({...form, department: e.target.value})} required />
              </div>
            </div>
            <div className="pt-2 flex justify-end">
              <button type="submit" disabled={loadingProfile} className="btn-primary flex items-center gap-2 px-5">
                <Save size={16} /> {loadingProfile ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-secondary rounded-xl p-4">
              <div className="flex items-center gap-2 mb-1">
                <Mail size={14} className="text-primary" />
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Email</span>
              </div>
              <p className="text-sm font-semibold text-gray-700">{user?.email}</p>
            </div>

            <div className="bg-secondary rounded-xl p-4">
              <div className="flex items-center gap-2 mb-1">
                <RoleIcon size={14} className="text-primary" />
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Role</span>
              </div>
              <p className="text-sm font-semibold text-gray-700 capitalize">{user?.role === 'teacher' ? 'Faculty' : user?.role}</p>
            </div>

            {user?.role === 'teacher' && user?.department && (
              <div className="bg-secondary rounded-xl p-4 sm:col-span-2">
                <div className="flex items-center gap-2 mb-1">
                  <Briefcase size={14} className="text-primary" />
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Department</span>
                </div>
                <p className="text-sm font-semibold text-gray-700">{user.department}</p>
              </div>
            )}

            {user?.role === 'student' && (
              <>
                {user?.rollNo && (
                  <div className="bg-secondary rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <Hash size={14} className="text-primary" />
                      <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Roll Number</span>
                    </div>
                    <p className="text-sm font-semibold text-gray-700">{user.rollNo}</p>
                  </div>
                )}
                {user?.year && (
                  <div className="bg-secondary rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <BookOpen size={14} className="text-primary" />
                      <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Year</span>
                    </div>
                    <p className="text-sm font-semibold text-gray-700">{user.year}</p>
                  </div>
                )}
                {user?.branch && (
                  <div className="bg-secondary rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <BookOpen size={14} className="text-primary" />
                      <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Branch</span>
                    </div>
                    <p className="text-sm font-semibold text-gray-700">{user.branch}</p>
                  </div>
                )}
                {user?.division && (
                  <div className="bg-secondary rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <User size={14} className="text-primary" />
                      <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Division</span>
                    </div>
                    <p className="text-sm font-semibold text-gray-700">{user.division}</p>
                  </div>
                )}
                {user?.enrolledSubjects?.length > 0 && (
                  <div className="bg-secondary rounded-xl p-4 sm:col-span-2">
                    <div className="flex items-center gap-2 mb-2">
                      <BookOpen size={14} className="text-primary" />
                      <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Enrolled Subjects</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {user.enrolledSubjects.map((s, i) => (
                        <span key={i} className="bg-white text-primary text-xs px-3 py-1 rounded-full font-medium border border-blue-100">
                          {s.name} ({s.code})
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            {user?.role === 'teacher' && user?.subjects?.length > 0 && (
              <div className="bg-secondary rounded-xl p-4 sm:col-span-2">
                <div className="flex items-center gap-2 mb-2">
                  <BookOpen size={14} className="text-primary" />
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Assigned Subjects</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {user.subjects.map((s, i) => (
                    <span key={i} className="bg-white text-primary text-xs px-3 py-1 rounded-full font-medium border border-blue-100">
                      {s.name} ({s.code})
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Change password card */}
      <div className="card">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
            <Lock size={18} className="text-white" />
          </div>
          <div>
            <h2 className="font-bold text-gray-800">Change Password</h2>
            <p className="text-xs text-gray-400">Update your account password</p>
          </div>
        </div>

        <form onSubmit={changePassword} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Current Password</label>
            <div className="relative">
              <input type={showCurrent ? 'text' : 'password'} className="input pr-10"
                placeholder="Enter current password" value={currentPassword}
                onChange={e => setCurrentPassword(e.target.value)} required />
              <button type="button" onClick={() => setShowCurrent(!showCurrent)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                {showCurrent ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">New Password</label>
            <div className="relative">
              <input type={showNew ? 'text' : 'password'} className="input pr-10"
                placeholder="Min 6 characters" value={newPassword}
                onChange={e => setNewPassword(e.target.value)} required />
              <button type="button" onClick={() => setShowNew(!showNew)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                {showNew ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Confirm New Password</label>
            <div className="relative">
              <input type={showConfirm ? 'text' : 'password'} className="input pr-10"
                placeholder="Re-enter new password" value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)} required />
              <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            {confirmPassword && newPassword !== confirmPassword && (
              <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
            )}
          </div>

          <button type="submit" disabled={loadingPass || newPassword !== confirmPassword}
            className="w-full btn-primary py-3 flex items-center justify-center gap-2">
            <Save size={16} />{loadingPass ? 'Changing...' : 'Change Password'}
          </button>
        </form>
      </div>
    </div>
  );
}
