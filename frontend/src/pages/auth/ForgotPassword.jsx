import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { ArrowLeft, Mail, Lock, Eye, EyeOff, CheckCircle, GraduationCap, RotateCcw } from 'lucide-react';

// Step indicator component
const StepIndicator = ({ step }) => {
  const steps = ['Email', 'Verify OTP', 'New Password'];
  return (
    <div className="flex items-center justify-center gap-2 mb-7">
      {steps.map((label, i) => {
        const num = i + 1;
        const isActive = num === step;
        const isDone = num < step;
        return (
          <div key={i} className="flex items-center gap-2">
            <div className="flex flex-col items-center gap-1">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                  isDone
                    ? 'bg-green-500 text-white'
                    : isActive
                    ? 'bg-primary text-white shadow-md'
                    : 'bg-gray-100 text-gray-400'
                }`}
              >
                {isDone ? <CheckCircle size={16} /> : num}
              </div>
              <span
                className={`text-xs font-medium transition-colors ${
                  isActive ? 'text-primary' : isDone ? 'text-green-500' : 'text-gray-400'
                }`}
              >
                {label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div
                className={`w-10 sm:w-14 h-0.5 mb-5 transition-all duration-500 ${
                  isDone ? 'bg-green-400' : 'bg-gray-200'
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
};

// OTP Input Box Component (6 individual boxes)
const OTPInput = ({ value, onChange }) => {
  const inputRefs = useRef([]);
  const digits = value.split('');

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const handleKey = (e, idx) => {
    if (e.key === 'Backspace') {
      const newDigits = [...digits];
      if (newDigits[idx]) {
        newDigits[idx] = '';
        onChange(newDigits.join(''));
      } else if (idx > 0) {
        newDigits[idx - 1] = '';
        onChange(newDigits.join(''));
        inputRefs.current[idx - 1]?.focus();
      }
      return;
    }
    if (e.key === 'ArrowLeft' && idx > 0) inputRefs.current[idx - 1]?.focus();
    if (e.key === 'ArrowRight' && idx < 5) inputRefs.current[idx + 1]?.focus();
  };

  const handleChange = (e, idx) => {
    const val = e.target.value.replace(/[^0-9]/g, '');
    if (!val) return;
    const newDigits = [...digits];
    // Support paste
    if (val.length > 1) {
      const pasted = val.slice(0, 6).split('');
      pasted.forEach((d, pi) => { if (pi < 6) newDigits[pi] = d; });
      onChange(newDigits.join(''));
      inputRefs.current[Math.min(pasted.length, 5)]?.focus();
      return;
    }
    newDigits[idx] = val;
    onChange(newDigits.join(''));
    if (idx < 5) inputRefs.current[idx + 1]?.focus();
  };

  return (
    <div className="flex gap-2 sm:gap-3 justify-center">
      {[0, 1, 2, 3, 4, 5].map(i => (
        <input
          key={i}
          ref={el => (inputRefs.current[i] = el)}
          type="text"
          inputMode="numeric"
          maxLength={6}
          value={digits[i] || ''}
          onChange={e => handleChange(e, i)}
          onKeyDown={e => handleKey(e, i)}
          className={`w-11 h-12 sm:w-12 sm:h-14 text-center text-xl font-bold rounded-xl border-2 transition-all focus:outline-none focus:ring-0 ${
            digits[i]
              ? 'border-primary bg-blue-50 text-primary'
              : 'border-gray-200 bg-white text-gray-800 focus:border-primary'
          }`}
        />
      ))}
    </div>
  );
};

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1=email, 2=otp, 3=new-password, 4=success
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);

  // Countdown timer for resend
  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(t => t - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  // Step 1: Send OTP
  const handleSendOTP = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await axios.post('/auth/forgot-password', { email });
      toast.success(res.data.message);
      setStep(2);
      setResendTimer(60);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    if (otp.length < 6) return toast.error('Please enter the complete 6-digit OTP');
    setLoading(true);
    try {
      const res = await axios.post('/auth/verify-otp', { email, otp });
      toast.success(res.data.message);
      setStep(3);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP
  const handleResend = async () => {
    if (resendTimer > 0) return;
    setLoading(true);
    try {
      const res = await axios.post('/auth/forgot-password', { email });
      toast.success('New OTP sent!');
      setOtp('');
      setResendTimer(60);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to resend OTP');
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Reset Password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) return toast.error('Passwords do not match');
    if (newPassword.length < 6) return toast.error('Password must be at least 6 characters');
    setLoading(true);
    try {
      const res = await axios.post('/auth/reset-password', { email, otp, newPassword });
      toast.success(res.data.message);
      setStep(4);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-secondary flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-xl overflow-hidden flex w-full max-w-3xl min-h-[480px]">

        {/* Left Panel */}
        <div className="hidden md:flex flex-col items-center justify-center bg-secondary w-2/5 p-8">
          <div className="w-40 h-40 bg-primary rounded-3xl flex items-center justify-center mb-6 shadow-lg">
            <GraduationCap size={72} className="text-white" />
          </div>
          <h2 className="text-xl font-bold text-primary text-center">Student Evaluation System</h2>
          <p className="text-sm text-blue-400 text-center mt-2">
            {step === 1 && 'Enter your registered email to receive a one-time password.'}
            {step === 2 && 'Check your inbox for the 6-digit verification code.'}
            {step === 3 && 'Choose a new strong password for your account.'}
            {step === 4 && 'Your password has been updated successfully!'}
          </p>
        </div>

        {/* Right Panel */}
        <div className="flex-1 flex flex-col justify-center px-6 sm:px-8 py-8 sm:py-10">

          {/* Back / Mobile Logo */}
          <div className="flex items-center gap-3 mb-5">
            {step < 4 && (
              <button
                onClick={() => step > 1 ? setStep(s => s - 1) : navigate('/login')}
                className="flex items-center gap-1 text-sm text-gray-500 hover:text-primary transition-colors group"
              >
                <ArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
                {step === 1 ? 'Back to Login' : 'Back'}
              </button>
            )}
          </div>

          {/* Step Indicator */}
          {step < 4 && <StepIndicator step={step} />}

          {/* ── Step 1: Enter Email ── */}
          {step === 1 && (
            <form onSubmit={handleSendOTP} className="space-y-5">
              <div>
                <h1 className="text-2xl font-bold text-gray-800">Forgot Password?</h1>
                <p className="text-sm text-gray-400 mt-1">
                  Enter your registered email address and we'll send you a 6-digit OTP.
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  <span className="text-red-500">*</span> Email Address
                </label>
                <div className="relative">
                  <input
                    type="email"
                    className="input pl-10"
                    placeholder="Enter your registered email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                  />
                  <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full btn-primary py-3 text-base rounded-xl"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Sending OTP...
                  </span>
                ) : 'Send OTP'}
              </button>
              <p className="text-xs text-center text-gray-400">
                Remembered your password?{' '}
                <Link to="/login" className="text-primary font-semibold hover:underline">Sign In</Link>
              </p>
            </form>
          )}

          {/* ── Step 2: Verify OTP ── */}
          {step === 2 && (
            <form onSubmit={handleVerifyOTP} className="space-y-5">
              <div>
                <h1 className="text-2xl font-bold text-gray-800">Enter OTP</h1>
                <p className="text-sm text-gray-400 mt-1">
                  We sent a 6-digit code to{' '}
                  <span className="font-semibold text-primary">{email}</span>
                </p>
              </div>

              <div className="py-2">
                <OTPInput value={otp} onChange={setOtp} />
              </div>

              <button
                type="submit"
                disabled={loading || otp.length < 6}
                className="w-full btn-primary py-3 text-base rounded-xl disabled:opacity-50"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Verifying...
                  </span>
                ) : 'Verify OTP'}
              </button>

              <div className="text-center">
                <p className="text-xs text-gray-400 mb-1">Didn't receive the code?</p>
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resendTimer > 0 || loading}
                  className="text-sm font-semibold flex items-center gap-1 mx-auto transition-colors disabled:text-gray-300 text-primary hover:underline disabled:no-underline disabled:cursor-not-allowed"
                >
                  <RotateCcw size={14} />
                  {resendTimer > 0 ? `Resend OTP in ${resendTimer}s` : 'Resend OTP'}
                </button>
              </div>
            </form>
          )}

          {/* ── Step 3: New Password ── */}
          {step === 3 && (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-800">Create New Password</h1>
                <p className="text-sm text-gray-400 mt-1">
                  Set a strong new password for your account.
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  <span className="text-red-500">*</span> New Password
                </label>
                <div className="relative">
                  <input
                    type={showPass ? 'text' : 'password'}
                    className="input pl-10 pr-10"
                    placeholder="At least 6 characters"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                  <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  <span className="text-red-500">*</span> Confirm Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    className={`input pl-10 pr-10 ${
                      confirmPassword && confirmPassword !== newPassword
                        ? 'border-red-400 focus:ring-red-400'
                        : ''
                    }`}
                    placeholder="Re-enter your new password"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    required
                  />
                  <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {confirmPassword && confirmPassword !== newPassword && (
                  <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full btn-primary py-3 text-base rounded-xl mt-1"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Resetting Password...
                  </span>
                ) : 'Reset Password'}
              </button>
            </form>
          )}

          {/* ── Step 4: Success ── */}
          {step === 4 && (
            <div className="flex flex-col items-center text-center space-y-5 py-4">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle size={44} className="text-green-500" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">Password Reset!</h1>
                <p className="text-sm text-gray-400 mt-2">
                  Your password has been successfully updated.<br />
                  You can now sign in with your new password.
                </p>
              </div>
              <button
                onClick={() => navigate('/login')}
                className="w-full btn-primary py-3 text-base rounded-xl"
              >
                Go to Sign In
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
