import { useState } from 'react';
import axios from 'axios';
import { 
  MessageSquare, Send, HelpCircle, Bug, AlertTriangle, 
  Heart, Lightbulb, Loader2, CheckCircle2 
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function StudentFeedback() {
  const [loading, setLoading] = useState(false);
  const [feedbackForm, setFeedbackForm] = useState({ type: 'Suggestion', subject: '', message: '' });
  const [submitted, setSubmitted] = useState(false);

  const feedbackTypes = [
    { id: 'Suggestion', label: 'Suggestion', icon: Lightbulb, color: 'blue' },
    { id: 'Bug Report', label: 'Bug Report', icon: Bug, color: 'red' },
    { id: 'Complaint', label: 'Complaint', icon: AlertTriangle, color: 'amber' },
    { id: 'Compliment', label: 'Compliment', icon: Heart, color: 'emerald' },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!feedbackForm.subject || !feedbackForm.message) {
      toast.error('Please fill in all fields');
      return;
    }
    setLoading(true);
    try {
      await axios.post('/feedback', feedbackForm);
      toast.success('Feedback sent successfully! 🚀');
      setSubmitted(true);
      setFeedbackForm({ type: 'Suggestion', subject: '', message: '' });
      setTimeout(() => setSubmitted(false), 3000);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send feedback');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      <div className="card overflow-hidden border-none shadow-xl bg-white p-0">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-8 text-white text-center relative overflow-hidden">
          <div className="relative z-10">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur-sm shadow-inner">
              <MessageSquare size={32} />
            </div>
            <h1 className="text-3xl font-bold">Student Feedback</h1>
            <p className="text-blue-100 mt-2 font-medium">Your thoughts help us shape a better system</p>
          </div>
          {/* Abstract background elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-32 translate-x-32 blur-3xl" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-400/20 rounded-full translate-y-24 -translate-x-12 blur-2xl" />
        </div>

        <div className="p-8 sm:p-10">
          <div className="space-y-8">
            <div>
              <h3 className="font-bold text-gray-800 mb-6 text-lg">Choose feedback type</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {feedbackTypes.map((t) => {
                  const Icon = t.icon;
                  const isSelected = feedbackForm.type === t.id;
                  return (
                    <button
                      key={t.id}
                      onClick={() => setFeedbackForm({ ...feedbackForm, type: t.id })}
                      className={`flex flex-col items-center justify-center p-6 rounded-2xl border-2 transition-all duration-300 relative group
                        ${isSelected 
                          ? `border-blue-500 bg-blue-50 ring-4 ring-blue-500/10 scale-[1.02]` 
                          : 'border-gray-100 bg-white hover:border-gray-200 hover:bg-gray-50'}`}
                    >
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 transition-transform duration-300 group-hover:scale-110
                        ${isSelected ? 'bg-blue-500 text-white shadow-lg' : `bg-${t.color}-50 text-${t.color}-500`}`}>
                        <Icon size={24} />
                      </div>
                      <span className={`text-sm font-bold ${isSelected ? 'text-blue-700' : 'text-gray-600'}`}>{t.label}</span>
                      {isSelected && (
                        <div className="absolute top-2 right-2 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center shadow-sm">
                          <CheckCircle2 size={12} className="text-white" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                  <HelpCircle size={16} className="text-blue-500" />
                  Subject
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-blue-500 transition-colors">
                    <MessageSquare size={18} />
                  </div>
                  <input
                    type="text"
                    placeholder="E.g., Suggestion for the Exam Interface"
                    className="w-full pl-11 pr-4 py-4 bg-gray-50 border-gray-100 border-2 rounded-2xl focus:bg-white focus:border-blue-500 transition-all outline-none text-gray-700 font-medium"
                    value={feedbackForm.subject}
                    onChange={e => setFeedbackForm({ ...feedbackForm, subject: e.target.value })}
                    maxLength={100}
                    required
                  />
                  <div className="absolute right-4 bottom-[-22px] text-[10px] text-gray-400 font-mono">
                    {feedbackForm.subject.length}/100
                  </div>
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <label className="text-sm font-bold text-gray-700">Detailed Message</label>
                <textarea
                  rows={6}
                  placeholder="Tell us more about your experience..."
                  className="w-full p-5 bg-gray-50 border-gray-100 border-2 rounded-2xl focus:bg-white focus:border-blue-500 transition-all outline-none text-gray-700 font-medium resize-none shadow-inner"
                  value={feedbackForm.message}
                  onChange={e => setFeedbackForm({ ...feedbackForm, message: e.target.value })}
                  maxLength={1000}
                  required
                />
                <div className="text-[10px] text-gray-400 font-mono text-right mt-1">
                  {feedbackForm.message.length}/1000
                </div>
              </div>

              <div className="bg-blue-50/50 rounded-2xl p-5 flex items-center gap-4 border border-blue-100/50">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600 flex-shrink-0">
                  <AlertTriangle size={24} className="animate-pulse" />
                </div>
                <div>
                  <p className="text-sm text-blue-800 font-bold">Private & Secure</p>
                  <p className="text-xs text-blue-600 font-medium leading-relaxed">
                    Your feedback is sent directly to the administration and and will be reviewed within 48 hours.
                  </p>
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className={`flex-1 group relative overflow-hidden py-4 rounded-2xl font-bold transition-all shadow-xl active:scale-[0.98]
                    ${submitted 
                      ? 'bg-emerald-500 text-white cursor-default' 
                      : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20'}`}
                >
                  <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                  <span className="relative flex items-center justify-center gap-2 text-lg">
                    {loading ? <Loader2 size={24} className="animate-spin" /> : 
                     submitted ? <CheckCircle2 size={24} /> : <Send size={24} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />}
                    {loading ? 'Sending Feedback...' : submitted ? 'Message Sent!' : 'Submit Feedback'}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
