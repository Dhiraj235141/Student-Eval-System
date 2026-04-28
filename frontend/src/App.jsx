import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import Sidebar from './components/layout/Sidebar';
import { useState } from 'react';
import LoadingScreen from './components/LoadingScreen';

// Auth Pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';
import { GoogleOAuthProvider } from '@react-oauth/google';

// Landing
import LandingPage from './pages/LandingPage';

// Admin Pages
import AdminDashboard from './pages/admin/Dashboard';
import AdminFaculty from './pages/admin/Faculty';
import AdminStudents from './pages/admin/Students';
import AdminSubjects from './pages/admin/Subjects';
import AdminAnnouncements from './pages/admin/Announcements';
import AdminFeedbackCenter from './pages/admin/FeedbackCenter';

// Faculty Pages
import FacultyDashboard from './pages/faculty/Dashboard';
import FacultySubjects from './pages/faculty/Subjects';
import CreateTest from './pages/faculty/CreateTest';
import FacultyAssignments from './pages/faculty/Assignments';
import FacultyResults from './pages/faculty/Results';
import FacultyAttendance from './pages/faculty/Attendance';
import MonthlyReport from './pages/faculty/MonthlyReport';
import FacultyAnnouncements from './pages/faculty/Announcements';
import FacultyFeedback from './pages/faculty/Feedback';

// Student Pages
import StudentDashboard from './pages/student/Dashboard';
import TakeTest from './pages/student/TakeTest';
import StudentAssignments from './pages/student/Assignments';
import StudentResults from './pages/student/Results';
import StudentAttendance from './pages/student/Attendance';
import WeakTopics from './pages/student/WeakTopics';
import StudentFeedback from './pages/student/Feedback';

const ProtectedRoute = ({ children, role }) => {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-secondary">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-500 text-sm">Loading...</p>
      </div>
    </div>
  );
  if (!user) return <Navigate to="/login" replace />;
  if (role && user.role !== role) return <Navigate to={`/${user.role}`} replace />;
  return <Sidebar>{children}</Sidebar>;
};

function AppRoutes() {
  const { user, loading } = useAuth();
  if (loading) return null;
  return (
    <Routes>
      {/* Landing */}
      <Route path="/" element={user ? <Navigate to={`/${user.role}`} replace /> : <LandingPage />} />

      {/* Auth */}
      <Route path="/login" element={!user ? <Login /> : <Navigate to={`/${user.role}`} replace />} />
      <Route path="/register" element={!user ? <Register /> : <Navigate to={`/${user.role}`} replace />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />

      {/* Admin */}
      <Route path="/admin" element={<ProtectedRoute role="admin"><AdminDashboard /></ProtectedRoute>} />
      <Route path="/admin/faculty" element={<ProtectedRoute role="admin"><AdminFaculty /></ProtectedRoute>} />
      <Route path="/admin/students" element={<ProtectedRoute role="admin"><AdminStudents /></ProtectedRoute>} />
      <Route path="/admin/subjects" element={<ProtectedRoute role="admin"><AdminSubjects /></ProtectedRoute>} />
      <Route path="/admin/announcements" element={<ProtectedRoute role="admin"><AdminAnnouncements /></ProtectedRoute>} />
      <Route path="/admin/feedback" element={<ProtectedRoute role="admin"><AdminFeedbackCenter /></ProtectedRoute>} />

      {/* Faculty */}
      <Route path="/faculty" element={<ProtectedRoute role="faculty"><FacultyDashboard /></ProtectedRoute>} />
      <Route path="/faculty/subjects" element={<ProtectedRoute role="faculty"><FacultySubjects /></ProtectedRoute>} />
      <Route path="/faculty/create-test" element={<ProtectedRoute role="faculty"><CreateTest /></ProtectedRoute>} />
      <Route path="/faculty/assignments" element={<ProtectedRoute role="faculty"><FacultyAssignments /></ProtectedRoute>} />
      <Route path="/faculty/results" element={<ProtectedRoute role="faculty"><FacultyResults /></ProtectedRoute>} />
      <Route path="/faculty/attendance" element={<ProtectedRoute role="faculty"><FacultyAttendance /></ProtectedRoute>} />
      <Route path="/faculty/monthly-report" element={<ProtectedRoute role="faculty"><MonthlyReport /></ProtectedRoute>} />
      <Route path="/faculty/announcements" element={<ProtectedRoute role="faculty"><FacultyAnnouncements /></ProtectedRoute>} />
      <Route path="/faculty/feedback" element={<ProtectedRoute role="faculty"><FacultyFeedback /></ProtectedRoute>} />

      {/* Student */}
      <Route path="/student" element={<ProtectedRoute role="student"><StudentDashboard /></ProtectedRoute>} />
      <Route path="/student/test" element={<ProtectedRoute role="student"><TakeTest /></ProtectedRoute>} />
      <Route path="/student/assignments" element={<ProtectedRoute role="student"><StudentAssignments /></ProtectedRoute>} />
      <Route path="/student/results" element={<ProtectedRoute role="student"><StudentResults /></ProtectedRoute>} />
      <Route path="/student/attendance" element={<ProtectedRoute role="student"><StudentAttendance /></ProtectedRoute>} />
      <Route path="/student/weak-topics" element={<ProtectedRoute role="student"><WeakTopics /></ProtectedRoute>} />
      <Route path="/student/feedback" element={<ProtectedRoute role="student"><StudentFeedback /></ProtectedRoute>} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  const [loadingDone, setLoadingDone] = useState(false);
  const clientId = process.env.REACT_APP_GOOGLE_CLIENT_ID || '';

  return (
    <GoogleOAuthProvider clientId={clientId}>
      <AuthProvider>
        {!loadingDone && <LoadingScreen onDone={() => setLoadingDone(true)} />}
        <BrowserRouter>
          <AppRoutes />
          <Toaster
            position="top-center"
            toastOptions={{
              duration: 3000,
              style: { borderRadius: '12px', fontSize: '14px', background: '#1e293b', color: '#f1f5f9' }
            }}
          />
        </BrowserRouter>
      </AuthProvider>
    </GoogleOAuthProvider>
  );
}
