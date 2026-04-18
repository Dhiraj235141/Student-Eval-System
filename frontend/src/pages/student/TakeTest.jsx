import { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { Shield, AlertTriangle, CheckCircle, Clock, Lock, PlayCircle } from 'lucide-react';

export default function TakeTest() {
  const { user } = useAuth();
  const [step, setStep] = useState('enter-code'); // enter-code | taking | submitted
  const [code, setCode] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [subjects, setSubjects] = useState([]);
  const [test, setTest] = useState(null);
  const [answers, setAnswers] = useState({});
  const [warnings, setWarnings] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [showWarning, setShowWarning] = useState(false);
  const [warningMsg, setWarningMsg] = useState('');
  const tabSwitchCount = useRef(0);
  const timerRef = useRef(null);

  // Fetch subjects based on student's year from backend
  useEffect(() => {
    axios.get('/student/subjects').then(res => setSubjects(res.data.subjects || [])).catch(() => {});
  }, []);

  // Anti-cheat: tab visibility
  useEffect(() => {
    if (step !== 'taking') return;
    const handleVisibilityChange = () => { if (document.hidden) handleCheat(); };
    const handleBlur = () => handleCheat();
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
    };
  }, [step, warnings]);

  const handleCheat = useCallback(() => {
    tabSwitchCount.current += 1;
    const count = tabSwitchCount.current;
    if (count === 1) {
      setWarnings(1); setWarningMsg('⚠️ Warning 1/2: Please stay on the test page!');
      setShowWarning(true); setTimeout(() => setShowWarning(false), 4000);
    } else if (count === 2) {
      setWarnings(2); setWarningMsg('🚨 Final Warning 2/2: Next violation will auto-submit!');
      setShowWarning(true); setTimeout(() => setShowWarning(false), 4000);
    } else if (count >= 3) {
      setWarningMsg('❌ Test auto-submitted due to tab switching!');
      setShowWarning(true); submitTest(true);
    }
  }, []);

  // Timer
  useEffect(() => {
    if (step !== 'taking' || !test) return;
    const expiry = new Date(test.codeExpiresAt).getTime();
    timerRef.current = setInterval(() => {
      const left = Math.max(0, Math.floor((expiry - Date.now()) / 1000));
      setTimeLeft(left);
      if (left === 0) { clearInterval(timerRef.current); submitTest(true); }
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [step, test]);

  const validateCode = async () => {
    if (!code || !selectedSubject) { toast.error('Enter code and select subject'); return; }
    setLoading(true);
    try {
      const res = await axios.post('/student/validate-code', { secretCode: code, subjectId: selectedSubject });
      setTest(res.data.test); setAnswers({}); setStep('taking');
      toast.success('Code verified! Good luck! 🎯');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid or expired code');
    } finally { setLoading(false); }
  };

  const submitTest = async (auto = false) => {
    if (timerRef.current) clearInterval(timerRef.current);
    setLoading(true);
    try {
      const answersArray = test.questions.map((_, i) => answers[i] ?? -1);
      const res = await axios.post('/student/submit-test', {
        testId: test.id, answers: answersArray,
        tabSwitchCount: tabSwitchCount.current, autoSubmitted: auto
      });
      setResult(res.data.result); setStep('submitted');
      toast.success('Test submitted successfully!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Submission failed');
    } finally { setLoading(false); }
  };

  const formatTime = (s) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;
  const answeredCount = Object.keys(answers).length;
  const progress = test ? (answeredCount / test.questions.length) * 100 : 0;

  return (
    <div className="max-w-2xl mx-auto">
      {/* Anti-cheat warning overlay */}
      {showWarning && (
        <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-6 py-4 rounded-2xl shadow-xl text-white font-semibold text-sm flex items-center gap-3
          ${warnings >= 2 ? 'bg-red-500' : 'bg-orange-500'}`}>
          <AlertTriangle size={20} />{warningMsg}
        </div>
      )}

      {/* Enter Code */}
      {step === 'enter-code' && (
        <div className="card">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-xl flex items-center justify-center shadow-sm">
              <Lock size={22} className="text-white" />
            </div>
            <div>
              <h1 className="font-bold text-gray-800 text-lg">Test</h1>
              <p className="text-xs text-gray-400">Enter the secret code from your teacher to begin</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">Select Subject</label>
              <select className="input" value={selectedSubject} onChange={e => setSelectedSubject(e.target.value)}>
                <option value="">-- Select Subject --</option>
                {subjects.map(s => (
                  <option key={s._id} value={s._id}>{s.name} {s.code ? `(${s.code})` : ''}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">Secret Code</label>
              <input className="input text-center text-2xl font-bold tracking-widest uppercase" maxLength={6}
                placeholder="XXXXXX" value={code} onChange={e => setCode(e.target.value.toUpperCase())} />
            </div>

            <div className="bg-blue-50 rounded-xl p-4 text-xs text-blue-600 space-y-2">
              <div className="flex items-center gap-2"><Shield size={12} />Anti-cheat monitoring is active during the test</div>
              <div className="flex items-center gap-2"><AlertTriangle size={12} />Tab switching: 2 warnings → auto-submit on 3rd</div>
              <div className="flex items-center gap-2"><Clock size={12} />Test ends when the timer expires</div>
            </div>

            <button onClick={validateCode} disabled={loading || !code || !selectedSubject}
              className="w-full bg-gradient-to-r from-blue-600 to-cyan-500 text-white py-3.5 rounded-xl font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50">
              <PlayCircle size={20} />
              {loading ? 'Verifying...' : 'Start Test →'}
            </button>
          </div>
        </div>
      )}

      {/* Taking test */}
      {step === 'taking' && test && (
        <div className="space-y-4">
          <div className="card">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="font-bold text-gray-800">{test.topic}</h2>
                <p className="text-xs text-gray-400">{test.subject?.name} {test.subject?.code ? `• ${test.subject.code}` : ''} • {test.questions.length} Questions</p>
              </div>
              <div className={`flex items-center gap-2 font-mono font-bold text-lg px-4 py-2 rounded-xl ${timeLeft < 120 ? 'bg-red-50 text-red-500' : 'bg-blue-50 text-blue-600'}`}>
                <Clock size={16} />{formatTime(timeLeft)}
              </div>
            </div>
            <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
              <span>{answeredCount}/{test.questions.length} answered</span>
              <span className={warnings > 0 ? 'text-orange-500 font-medium' : ''}>
                {warnings > 0 ? `⚠️ ${warnings}/2 warnings` : '✅ No warnings'}
              </span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2">
              <div className="bg-gradient-to-r from-blue-600 to-cyan-500 h-2 rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
            </div>
          </div>

          {test.questions.map((q, i) => (
            <div key={i} className={`card border-2 transition-all ${answers[i] !== undefined ? 'border-blue-200 bg-blue-50/30' : 'border-transparent'}`}>
              <div className="flex items-start gap-3 mb-4">
                <span className="w-7 h-7 bg-gradient-to-br from-blue-600 to-cyan-500 text-white rounded-lg text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</span>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`badge-${q.difficulty}`}>{q.difficulty}</span>
                    {q.topic && <span className="text-xs text-gray-400">• {q.topic}</span>}
                  </div>
                  <p className="text-sm font-medium text-gray-800">{q.question}</p>
                </div>
              </div>
              <div className="space-y-2 ml-10">
                {q.options.map((opt, j) => (
                  <label key={j} className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer border-2 transition-all text-sm
                    ${answers[i] === j ? 'border-blue-500 bg-blue-50 text-blue-700 font-medium' : 'border-gray-100 hover:border-gray-200 text-gray-700'}`}>
                    <input type="radio" name={`q-${i}`} value={j} checked={answers[i] === j}
                      onChange={() => setAnswers(prev => ({ ...prev, [i]: j }))} className="hidden" />
                    <span className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center text-xs font-bold flex-shrink-0
                      ${answers[i] === j ? 'border-blue-500 bg-blue-500 text-white' : 'border-gray-200'}`}>{['A','B','C','D'][j]}</span>
                    {opt}
                  </label>
                ))}
              </div>
            </div>
          ))}

          <button onClick={() => submitTest(false)} disabled={loading}
            className="w-full bg-gradient-to-r from-blue-600 to-cyan-500 text-white py-4 rounded-xl font-bold text-base sticky bottom-4 shadow-lg hover:opacity-90 transition-opacity">
            {loading ? 'Submitting...' : `Submit Test (${answeredCount}/${test.questions.length} answered)`}
          </button>
        </div>
      )}

      {/* Submitted */}
      {step === 'submitted' && result && (
        <div className="card text-center space-y-6">
          <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto ${result.score >= 7 ? 'bg-green-100' : result.score >= 5 ? 'bg-yellow-100' : 'bg-red-100'}`}>
            <CheckCircle size={40} className={result.score >= 7 ? 'text-green-500' : result.score >= 5 ? 'text-yellow-500' : 'text-red-500'} />
          </div>
          <div>
            <h2 className="text-3xl font-bold text-gray-800">{result.score}/{test?.questions?.length || 10}</h2>
            <p className={`text-lg font-semibold mt-1 ${result.score >= 7 ? 'text-green-600' : result.score >= 5 ? 'text-yellow-600' : 'text-red-500'}`}>{result.grade}</p>
            <p className="text-sm text-gray-400 mt-1">Attendance has been marked ✅</p>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-green-50 rounded-xl p-3"><p className="text-lg font-bold text-green-600">{result.easyScore}</p><p className="text-xs text-gray-400">Easy</p></div>
            <div className="bg-yellow-50 rounded-xl p-3"><p className="text-lg font-bold text-yellow-600">{result.mediumScore}</p><p className="text-xs text-gray-400">Medium</p></div>
            <div className="bg-red-50 rounded-xl p-3"><p className="text-lg font-bold text-red-600">{result.hardScore}</p><p className="text-xs text-gray-400">Hard</p></div>
          </div>
          {result.weakTopics?.length > 0 && (
            <div className="bg-orange-50 rounded-xl p-4 text-left">
              <p className="text-sm font-semibold text-orange-700 mb-2">🎯 Focus on these topics:</p>
              <div className="flex flex-wrap gap-2">
                {result.weakTopics.map((t, i) => <span key={i} className="bg-orange-100 text-orange-700 text-xs px-2 py-1 rounded-full">{t}</span>)}
              </div>
            </div>
          )}
          <button onClick={() => { setStep('enter-code'); setCode(''); setTest(null); setAnswers({}); setWarnings(0); tabSwitchCount.current = 0; }}
            className="btn-primary w-full py-3">Done</button>
        </div>
      )}
    </div>
  );
}
