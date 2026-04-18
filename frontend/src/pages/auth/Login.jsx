import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Eye, EyeOff, GraduationCap } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await login(email, password);
      toast.success(`Welcome back, ${user.name}!`);
      if (user.role === 'admin') navigate('/admin');
      else if (user.role === 'teacher') navigate('/teacher');
      else navigate('/student');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-secondary flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-xl overflow-hidden flex w-full max-w-3xl min-h-[480px]">

        {/* Left - Illustration */}
        <div className="hidden md:flex flex-col items-center justify-center bg-secondary w-2/5 p-8">
          <div className="w-40 h-40 bg-primary rounded-3xl flex items-center justify-center mb-6 shadow-lg">
            <GraduationCap size={72} className="text-white" />
          </div>
          <h2 className="text-xl font-bold text-primary text-center">Student Evaluation System</h2>
          <p className="text-sm text-blue-400 text-center mt-2">Empowering Education with AI</p>
        </div>

        {/* Right - Form */}
        <div className="flex-1 flex flex-col justify-center px-8 py-10">
          <h1 className="text-3xl font-bold text-gray-800 mb-1">Welcome Back!</h1>
          <p className="text-sm text-gray-400 mb-8">Sign in to continue to Student Eval System</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                <span className="text-red-500">*</span> Email
              </label>
              <input
                type="email"
                className="input"
                placeholder="Enter your email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                <span className="text-red-500">*</span> Password
              </label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  className="input pr-10"
                  placeholder="Enter your password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="w-full btn-primary py-3 text-base rounded-xl mt-2">
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <p className="text-xs text-gray-400 text-center mt-6">
            New student?{' '}
            <Link to="/register" className="text-primary font-semibold hover:underline">Create Account</Link>
          </p>
          <p className="text-xs text-gray-300 text-center mt-1">
            Contact your administrator if you are a teacher.
          </p>
        </div>
      </div>
    </div>
  );
}
