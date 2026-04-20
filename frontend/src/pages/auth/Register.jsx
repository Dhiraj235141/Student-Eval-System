import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Eye, EyeOff, GraduationCap, User, Mail, Lock, Hash, BookOpen } from 'lucide-react';

const BRANCHES = ['Computer Science', 'Information Technology', 'Electronics', 'Mechanical', 'Civil', 'Electrical', 'Chemical', 'Other'];
const YEARS = ['First Year', 'Second Year', 'Third Year', 'Fourth Year'];

export default function Register() {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    name: '', email: '', password: '', confirmPassword: '',
    rollNo: '', year: '', branch: '', division: ''
  });
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleOtpChange = (index, value) => {
    if (isNaN(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    // Auto-focus next input
    if (value && index < 5) {
      document.getElementById(`otp-${index + 1}`).focus();
    }
  };

  const handleSubmitInfo = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      toast.error('Passwords do not match!');
      return;
    }
    if (form.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    try {
      const classStr = `${form.year}${form.branch ? ' - ' + form.branch : ''}${form.division ? ' (' + form.division + ')' : ''}`;
      await axios.post('/auth/register', {
        name: form.name,
        email: form.email,
        password: form.password,
        rollNo: form.rollNo,
        year: form.year,
        branch: form.branch,
        division: form.division,
        class: classStr,
        role: 'student'
      });
      toast.success('OTP sent to your email! Please verify.');
      setStep(2);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    const otpString = otp.join('');
    if (otpString.length !== 6) {
      toast.error('Please enter the 6-digit OTP');
      return;
    }
    setLoading(true);
    try {
      await axios.post('/auth/verify-registration-otp', {
        email: form.email,
        otp: otpString
      });
      toast.success('Account successfully verified! Please login.');
      navigate('/login');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid or expired OTP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-secondary flex items-center justify-center p-4 py-8">
      <div className="bg-white rounded-3xl shadow-xl overflow-hidden flex w-full max-w-3xl">

        {/* Left panel */}
        <div className="hidden md:flex flex-col items-center justify-center bg-secondary w-2/5 p-8">
          <div className="w-40 h-40 bg-primary rounded-3xl flex items-center justify-center mb-6 shadow-lg">
            <GraduationCap size={72} className="text-white" />
          </div>
          <h2 className="text-xl font-bold text-primary text-center">Join the System</h2>
          <p className="text-sm text-blue-400 text-center mt-2">Create your student account today</p>
          <div className="mt-6 space-y-2 text-xs text-blue-400 text-center">
            <p>✓ Take AI-powered tests</p>
            <p>✓ Track your attendance</p>
            <p>✓ Get personalized study tips</p>
            <p>✓ Submit assignments online</p>
          </div>
        </div>

        {/* Right form */}
        <div className="flex-1 px-8 py-8 overflow-y-auto">
          {step === 1 ? (
            <>
              <h1 className="text-2xl font-bold text-gray-800 mb-1">Create Account</h1>
              <p className="text-sm text-gray-400 mb-6">Register as a student</p>

              <form onSubmit={handleSubmitInfo} className="space-y-4">
            {/* Name */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block"><span className="text-red-500">*</span> Full Name</label>
              <div className="relative">
                <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" />
                <input name="name" type="text" className="input pl-9" placeholder="Enter your full name"
                  value={form.name} onChange={handleChange} required />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block"><span className="text-red-500">*</span> Email</label>
              <div className="relative">
                <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" />
                <input name="email" type="email" className="input pl-9" placeholder="Enter your email"
                  value={form.email} onChange={handleChange} required />
              </div>
            </div>

            {/* Roll No */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Roll Number</label>
              <div className="relative">
                <Hash size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" />
                <input name="rollNo" type="text" className="input pl-9" placeholder="e.g. CS2024001"
                  value={form.rollNo} onChange={handleChange} />
              </div>
            </div>

            {/* Year & Branch */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block"><span className="text-red-500">*</span> Year</label>
                <select name="year" className="input" value={form.year} onChange={handleChange} required>
                  <option value="">-- Select Year --</option>
                  {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block"><span className="text-red-500">*</span> Branch</label>
                <select name="branch" className="input" value={form.branch} onChange={handleChange} required>
                  <option value="">-- Select Branch --</option>
                  {BRANCHES.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>
            </div>

            {/* Division */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Division / Section</label>
              <div className="relative">
                <BookOpen size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" />
                <input name="division" type="text" className="input pl-9" placeholder="e.g. A, B, C"
                  value={form.division} onChange={handleChange} />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block"><span className="text-red-500">*</span> Password</label>
              <div className="relative">
                <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" />
                <input name="password" type={showPass ? 'text' : 'password'} className="input pl-9 pr-10"
                  placeholder="Min 6 characters" value={form.password} onChange={handleChange} required />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                  {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block"><span className="text-red-500">*</span> Confirm Password</label>
              <div className="relative">
                <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" />
                <input name="confirmPassword" type={showConfirm ? 'text' : 'password'} className="input pl-9 pr-10"
                  placeholder="Re-enter password" value={form.confirmPassword} onChange={handleChange} required />
                <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                  {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {form.confirmPassword && form.password !== form.confirmPassword && (
                <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
              )}
            </div>

            <button type="submit" disabled={loading || form.password !== form.confirmPassword}
              className="w-full btn-primary py-3 text-base rounded-xl mt-2">
              {loading ? 'Sending OTP...' : 'Send OTP to Email'}
            </button>

            <p className="text-center text-sm text-gray-400">
              Already have an account?{' '}
              <Link to="/login" className="text-primary font-semibold hover:underline">Sign In</Link>
            </p>
          </form>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full max-w-sm mx-auto">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-6">
                <Mail size={32} className="text-primary" />
              </div>
              <h1 className="text-2xl font-bold text-gray-800 mb-2">Verify Your Email</h1>
              <p className="text-sm text-gray-500 text-center mb-8">
                We've sent a 6-digit verification code to <br/>
                <span className="font-semibold text-gray-800">{form.email}</span>
              </p>

              <form onSubmit={handleVerifyOTP} className="w-full space-y-6">
                <div className="flex justify-between gap-2">
                  {otp.map((digit, index) => (
                    <input
                      key={index}
                      id={`otp-${index}`}
                      type="text"
                      maxLength={1}
                      className="w-12 h-14 text-center text-2xl font-bold border-2 border-gray-200 rounded-xl focus:border-primary focus:outline-none transition-colors"
                      value={digit}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Backspace' && !digit && index > 0) {
                          document.getElementById(`otp-${index - 1}`).focus();
                        }
                      }}
                    />
                  ))}
                </div>

                <div className="space-y-3">
                  <button
                    type="submit"
                    disabled={loading || otp.join('').length !== 6}
                    className="w-full btn-primary py-3.5 text-base rounded-xl font-semibold shadow-lg shadow-blue-500/30 disabled:opacity-70"
                  >
                    {loading ? 'Verifying...' : 'Verify Email & Finish'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="w-full py-3 text-sm text-gray-500 font-medium hover:text-gray-800 transition-colors"
                  >
                    Oops, correct email address
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
