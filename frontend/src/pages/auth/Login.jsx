import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Eye, EyeOff, GraduationCap } from 'lucide-react';
import axios from 'axios';
import { useGoogleLogin } from '@react-oauth/google';
import AppleSignin from 'react-apple-signin-auth';

// Google SVG icon
const GoogleIcon = () => (
  <svg width="24" height="24" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M47.532 24.5528C47.532 22.9214 47.3997 21.2811 47.1175 19.6761H24.48V28.9181H37.4434C36.9055 31.8988 35.177 34.5356 32.6461 36.2111V42.2078H40.3801C44.9217 38.0278 47.532 31.8547 47.532 24.5528Z" fill="#4285F4" />
    <path d="M24.48 48.0016C30.9529 48.0016 36.4116 45.8764 40.3888 42.2078L32.6549 36.2111C30.5031 37.675 27.7252 38.5039 24.4888 38.5039C18.2275 38.5039 12.9187 34.2798 11.0139 28.6006H3.03296V34.7825C7.10718 42.8868 15.4056 48.0016 24.48 48.0016Z" fill="#34A853" />
    <path d="M11.0051 28.6006C9.99973 25.6199 9.99973 22.3922 11.0051 19.4115V13.2296H3.03298C-0.371016 20.0112 -0.371016 28.0009 3.03298 34.7825L11.0051 28.6006Z" fill="#FBBC04" />
    <path d="M24.48 9.49932C27.9016 9.44641 31.2086 10.7339 33.6866 13.0973L40.5387 6.24523C36.2 2.17101 30.4414 -0.068932 24.48 0.00161733C15.4055 0.00161733 7.10718 5.11644 3.03296 13.2296L11.005 19.4115C12.901 13.7235 18.2187 9.49932 24.48 9.49932Z" fill="#EA4335" />
  </svg>
);

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const { login, updateUser } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await login(email, password);
      toast.success(`Welcome back, ${user.name}!`);
      if (user.role === 'admin') navigate('/admin');
      else if (user.role === 'faculty') navigate('/faculty');
      else navigate('/student');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setGoogleLoading(true);
      try {
        const res = await axios.post('/auth/google', { credential: tokenResponse.access_token });
        const { token, user } = res.data;
        localStorage.setItem('token', token);
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        updateUser(user);
        toast.success(`Welcome, ${user.name}!`);
        if (user.role === 'admin') navigate('/admin');
        else if (user.role === 'faculty') navigate('/faculty');
        else navigate('/student');
      } catch (err) {
        toast.error(err.response?.data?.message || 'Google login failed');
      } finally {
        setGoogleLoading(false);
      }
    },
    onError: () => {
      toast.error('Google Sign-In was cancelled or failed.');
    }
  });

  const handleAppleSuccess = async (response) => {
    try {
      if (!response.authorization) return;
      const res = await axios.post('/auth/apple', {
        id_token: response.authorization.id_token,
        user: response.user ? JSON.stringify(response.user) : null
      });
      const { token, user } = res.data;
      localStorage.setItem('token', token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      updateUser(user);
      toast.success(`Welcome, ${user.name}!`);
      if (user.role === 'admin') navigate('/admin');
      else if (user.role === 'faculty') navigate('/faculty');
      else navigate('/student');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Apple login failed');
    }
  };

  return (
    <div className="min-h-screen bg-secondary flex items-center justify-center p-4">

      <div className="bg-white rounded-[2rem] shadow-xl overflow-hidden flex w-full max-w-4xl min-h-[560px]">

        {/* Left Panel - Illustration */}
        <div className="hidden md:flex flex-col items-center justify-center bg-secondary w-[45%] p-8 border-r border-blue-100">
          <div className="w-40 h-40 bg-white rounded-[2rem] flex items-center justify-center mb-6 shadow-xl border border-gray-100 p-4">
            <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
          </div>
          <h2 className="text-2xl font-bold text-primary text-center">Student Evaluation System</h2>
          <p className="text-sm text-blue-500 font-medium text-center mt-2">Empowering Education with AI</p>
        </div>

        {/* Right Panel - Form */}
        <div className="flex-1 flex flex-col justify-center px-8 sm:px-12 py-10 w-full relative">

          {/* Mobile logo */}
          <div className="flex flex-col items-center mb-6 md:hidden">
            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mb-3 shadow-md border border-gray-100 p-1.5">
              <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
            </div>
            <p className="text-xs text-blue-500 font-bold">Student Evaluation System</p>
          </div>

          <h1 className="text-3xl font-bold text-gray-800 mb-1">Welcome Back!</h1>
          <p className="text-sm text-gray-400 mb-8 font-medium">Sign in to continue to Student Eval System</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-[13px] font-bold text-gray-700 mb-1.5 block">
                Email
              </label>
              <input
                type="email"
                className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary transition-colors"
                placeholder="Enter your email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="text-[13px] font-bold text-gray-700 mb-1.5 block">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  className="w-full border-2 border-gray-200 rounded-xl pl-4 pr-10 py-3 text-sm focus:outline-none focus:border-primary transition-colors"
                  placeholder="Enter your password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Forgot Password Right Aligned Under Password */}
            <div className="flex justify-end pt-1">
              <Link
                to="/forgot-password"
                className="text-[13px] text-primary font-bold hover:text-blue-800 transition-colors"
              >
                Forgot password?
              </Link>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary hover:bg-blue-700 text-white font-bold py-3.5 text-base rounded-[1rem] transition-colors shadow-md"
              >
                {loading ? 'Logging In...' : 'Log In'}
              </button>
            </div>
          </form>

          {/* Don't have an account? Sign Up outline button directly under Login */}
          <div className="pt-6 text-center">
            <p className="text-xs text-gray-500 mb-2 font-medium">Don't have an account?</p>
            <Link
              to="/register"
              className="w-full flex items-center justify-center border-2 border-primary text-primary font-bold py-3 text-sm rounded-[1rem] hover:bg-blue-50 transition-colors"
            >
              Sign Up
            </Link>
          </div>

          {/* Divider */}
          <div className="relative pt-8 pb-4">
            <div className="absolute inset-0 flex items-center pt-4">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-4 bg-white text-gray-400 font-medium">Or continue with</span>
            </div>
          </div>

          {/* Circular Social Login Icons */}
          <div className="flex justify-center gap-6 pb-2">
            <button
              onClick={() => handleGoogleLogin()}
              disabled={googleLoading}
              type="button"
              className="w-12 h-12 flex items-center justify-center rounded-full bg-white shadow-md border hover:bg-gray-50 transition-colors"
            >
              {googleLoading ? (
                <span className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              ) : (
                <GoogleIcon />
              )}
            </button>

            <AppleSignin
              authOptions={{
                clientId: 'com.student.eval.service', // Will error unless they provide real client ID later
                scope: 'email name',
                redirectURI: 'https://mysite.com',
                usePopup: true,
              }}
              uiType="dark"
              className="apple-auth-btn"
              noDefaultStyle={false}
              buttonExtraChildren="Apple"
              onSuccess={handleAppleSuccess}
              onError={(error) => console.error(error)}
              skipScript={false}
              render={(props) => (
                <button
                  type="button"
                  onClick={props.onClick}
                  className="w-12 h-12 flex items-center justify-center rounded-full bg-white shadow-md border hover:bg-gray-50 transition-colors text-black"
                >
                  <svg width="20" height="20" viewBox="0 0 384 512" fill="currentColor">
                    <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z" />
                  </svg>
                </button>
              )}
            />
          </div>

        </div>
      </div>
    </div>
  );
}
