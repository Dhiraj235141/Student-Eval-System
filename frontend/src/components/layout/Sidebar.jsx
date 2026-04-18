import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import {
  LayoutDashboard, BookOpen, ClipboardList, Users, BarChart2,
  FileText, LogOut, Menu, GraduationCap, ChevronRight,
  Calendar, Brain, Award, Megaphone, Shield
} from 'lucide-react';
import NotificationPanel from './NotificationPanel';
import ProfilePanel from './ProfilePanel';

const navItems = {
  admin: [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/admin' },
    { label: 'Teachers', icon: Users, path: '/admin/teachers' },
    { label: 'Students', icon: GraduationCap, path: '/admin/students' },
    { label: 'Subjects', icon: BookOpen, path: '/admin/subjects' },
    { label: 'Announcements', icon: Megaphone, path: '/admin/announcements' },
  ],
  teacher: [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/teacher' },
    { label: 'My Subjects', icon: BookOpen, path: '/teacher/subjects' },
    { label: 'Create Test', icon: ClipboardList, path: '/teacher/create-test' },
    { label: 'Assignments', icon: FileText, path: '/teacher/assignments' },
    { label: 'Results', icon: BarChart2, path: '/teacher/results' },
    { label: 'Attendance', icon: Calendar, path: '/teacher/attendance' },
    { label: 'Monthly Report', icon: Award, path: '/teacher/monthly-report' },
    { label: 'Announcements', icon: Megaphone, path: '/teacher/announcements' },
  ],
  student: [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/student' },
    { label: 'Test', icon: ClipboardList, path: '/student/test' },
    { label: 'Assignments', icon: FileText, path: '/student/assignments' },
    { label: 'My Results', icon: BarChart2, path: '/student/results' },
    { label: 'Attendance', icon: Calendar, path: '/student/attendance' },
    { label: 'Weak Topics', icon: Brain, path: '/student/weak-topics' },
  ]
};

export default function Sidebar({ children }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const items = navItems[user?.role] || [];

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/');
  };

  const roleColors = {
    admin: 'bg-gradient-to-br from-purple-500 to-purple-700',
    teacher: 'bg-gradient-to-br from-blue-500 to-blue-700',
    student: 'bg-gradient-to-br from-emerald-500 to-emerald-700'
  };
  const roleLabels = { admin: 'Administrator', teacher: 'Teacher', student: 'Student' };
  const roleBadgeColors = {
    admin: 'bg-purple-100 text-purple-700',
    teacher: 'bg-blue-100 text-blue-700',
    student: 'bg-emerald-100 text-emerald-700'
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className={`flex items-center gap-3 p-5 border-b border-gray-100 ${collapsed ? 'justify-center' : ''}`}>
        <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm">
          <GraduationCap size={20} className="text-white" />
        </div>
        {!collapsed && <span className="font-bold text-gray-800 text-sm leading-tight">Student Eval<br />System</span>}
      </div>

      {/* User info — clickable to open profile panel */}
      {!collapsed && (
        <button
          onClick={() => { setMobileOpen(false); setProfileOpen(true); }}
          className="p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors text-left w-full"
        >
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl ${roleColors[user?.role]} flex items-center justify-center text-white font-bold text-sm flex-shrink-0 overflow-hidden shadow-sm`}>
              {user?.profileImage ? (
                <img src={user.profileImage} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                user?.name?.charAt(0).toUpperCase()
              )}
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-sm text-gray-800 truncate">{user?.name}</p>
              <span className={`text-xs px-1.5 py-0.5 rounded-md font-medium ${roleBadgeColors[user?.role]}`}>
                {roleLabels[user?.role]}
              </span>
              {user?.role === 'student' && user?.rollNo && (
                <p className="text-xs text-gray-400 font-mono mt-0.5">{user.rollNo}</p>
              )}
            </div>
          </div>
        </button>
      )}

      {/* Nav items */}
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {items.map(item => {
          const isActive = location.pathname === item.path;
          return (
            <Link key={item.path} to={item.path}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150
                ${isActive
                  ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-sm shadow-blue-200'
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'
                }
                ${collapsed ? 'justify-center' : ''}`}
            >
              <item.icon size={18} className="flex-shrink-0" />
              {!collapsed && (
                <>
                  <span className="text-sm font-medium flex-1">{item.label}</span>
                  {isActive && <ChevronRight size={14} />}
                </>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="p-3 border-t border-gray-100">
        <button onClick={handleLogout}
          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-500 hover:bg-red-50 hover:text-red-500 transition-all w-full ${collapsed ? 'justify-center' : ''}`}>
          <LogOut size={18} />
          {!collapsed && <span className="text-sm font-medium">Logout</span>}
        </button>
      </div>
    </div>
  );

  return (
    <>
      <div className="flex h-screen bg-gray-50 overflow-hidden">
        {/* Desktop sidebar */}
        <div className={`hidden md:flex flex-col bg-white border-r border-gray-100 transition-all duration-300 ${collapsed ? 'w-16' : 'w-60'}`}>
          <SidebarContent />
        </div>

        {/* Mobile sidebar overlay */}
        {mobileOpen && (
          <div className="fixed inset-0 z-50 flex md:hidden">
            <div className="w-64 bg-white h-full shadow-xl"><SidebarContent /></div>
            <div className="flex-1 bg-black/40" onClick={() => setMobileOpen(false)} />
          </div>
        )}

        {/* Main content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Top bar */}
          <header className="bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-3">
              <button onClick={() => { setCollapsed(!collapsed); setMobileOpen(!mobileOpen); }}
                className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors">
                <Menu size={18} />
              </button>
              <h1 className="font-semibold text-gray-700 text-sm hidden sm:block">
                {items.find(i => i.path === location.pathname)?.label || 'Dashboard'}
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <NotificationPanel />
              {/* Profile avatar button */}
              <button
                onClick={() => setProfileOpen(true)}
                className={`w-8 h-8 rounded-lg ${roleColors[user?.role]} flex items-center justify-center text-white font-bold text-xs hover:opacity-80 transition-opacity shadow-sm overflow-hidden`}
              >
                {user?.profileImage
                  ? <img src={user.profileImage} alt="P" className="w-full h-full object-cover" />
                  : user?.name?.charAt(0).toUpperCase()
                }
              </button>
            </div>
          </header>

          {/* Page content */}
          <main className="flex-1 overflow-y-auto p-4 md:p-6">
            {children}
          </main>
        </div>
      </div>

      {/* Profile panel */}
      <ProfilePanel open={profileOpen} onClose={() => setProfileOpen(false)} />
    </>
  );
}
