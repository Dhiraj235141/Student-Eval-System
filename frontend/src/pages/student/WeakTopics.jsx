import { useState, useEffect } from 'react';
import axios from 'axios';
import { Brain, ChevronDown, ChevronUp, Loader, TrendingDown, BookOpen, Lightbulb } from 'lucide-react';
import toast from 'react-hot-toast';

export default function WeakTopics() {
  const [weakTopics, setWeakTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState({}); // topic -> { loading, content }
  const [expanded, setExpanded] = useState({});
  const [selectedSubject, setSelectedSubject] = useState('all');

  useEffect(() => { fetchWeakTopics(); }, []);

  const fetchWeakTopics = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/student/weak-topics');
      setWeakTopics(res.data.weakTopics);
    } catch (err) {
      console.error(err);
    } finally { setLoading(false); }
  };

  const toggleNotes = async (topicKey, topicName) => {
    if (expanded[topicKey]) {
      setExpanded(prev => ({ ...prev, [topicKey]: false }));
      return;
    }
    setExpanded(prev => ({ ...prev, [topicKey]: true }));

    if (notes[topicKey]?.content) return; // already loaded

    // Clean topic name for better AI results (remove numbers like 3.4 or Unit 1)
    const cleanTopicName = topicName.replace(/^([0-9\.]+|Unit\s*[0-9]+|Chapter\s*[0-9]+)[:\s\-]*/i, '').trim();

    setNotes(prev => ({ ...prev, [topicKey]: { loading: true, content: null } }));
    try {
      const res = await axios.post('/ai/study-notes', { topic: cleanTopicName });
      setNotes(prev => ({ ...prev, [topicKey]: { loading: false, content: res.data.notes } }));
    } catch (err) {
      console.error('AI Notes Error:', err);
      setNotes(prev => ({ ...prev, [topicKey]: { loading: false, content: null, error: true } }));
      toast.error('Could not load study notes for: ' + cleanTopicName);
    }
  };

  const getUrgencyColor = (count) => {
    if (count >= 3) return { bg: 'bg-red-50', border: 'border-red-200', badge: 'bg-red-100 text-red-700', label: 'Urgent' };
    if (count === 2) return { bg: 'bg-orange-50', border: 'border-orange-200', badge: 'bg-orange-100 text-orange-700', label: 'Review Needed' };
    return { bg: 'bg-yellow-50', border: 'border-yellow-200', badge: 'bg-yellow-100 text-yellow-700', label: 'Watch' };
  };

  return (
    <div className="space-y-6">
      <div className="card">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center">
            <Brain size={20} className="text-white" />
          </div>
          <div>
            <h1 className="font-bold text-gray-800 text-lg">Weak Topics Analysis</h1>
            <p className="text-xs text-gray-400">AI-identified areas to focus on + study notes</p>
          </div>
        </div>

        {/* Filter Section */}
        {!loading && weakTopics.length > 0 && (
          <div className="mt-6 pt-6 border-t border-gray-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <BookOpen size={16} className="text-orange-500" />
              Filter by Subject:
            </label>
            <select 
              value={selectedSubject} 
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all w-full sm:min-w-[200px]"
            >
              {[...new Set(weakTopics.map(t => t.subjectName))].map((s, i) => {
                if (selectedSubject === 'all' && i === 0) setSelectedSubject(s);
                return <option key={s} value={s}>{s}</option>;
              })}
            </select>
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader size={24} className="animate-spin text-orange-500" /></div>
      ) : weakTopics.length === 0 ? (
        <div className="card text-center py-16">
          <Brain size={40} className="text-gray-200 mx-auto mb-3" />
          <p className="text-gray-400 font-medium">No weak topics identified yet!</p>
          <p className="text-gray-300 text-sm mt-1">Take more tests to see your performance analysis.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { label: 'Total Weak Areas', value: weakTopics.length, color: 'text-orange-500', bg: 'bg-orange-50' },
              { label: 'Urgent (3+ fails)', value: weakTopics.filter(t => t.failCount >= 3).length, color: 'text-red-500', bg: 'bg-red-50' },
              { label: 'Review Needed', value: weakTopics.filter(t => t.failCount === 2).length, color: 'text-yellow-600', bg: 'bg-yellow-50' },
            ].map((s, i) => (
              <div key={i} className="card flex flex-row sm:flex-col items-center py-3 sm:py-4 px-4 gap-3 sm:gap-2">
                <div className={`w-10 h-10 ${s.bg} rounded-xl flex items-center justify-center flex-shrink-0`}>
                  <TrendingDown size={20} className={s.color} />
                </div>
                <div className="sm:text-center">
                  <p className="text-xl sm:text-2xl font-bold text-gray-800 leading-none">{s.value}</p>
                  <p className="text-[10px] sm:text-xs text-gray-400 mt-0.5">{s.label}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-3 mt-4">
            {weakTopics
              .filter(t => selectedSubject === 'all' || t.subjectName === selectedSubject)
              .map((item, i) => {
                const topicKey = `${item.subjectId}-${item.topic}`;
                const colors = getUrgencyColor(item.failCount);
                const isExpanded = expanded[topicKey];
                const note = notes[topicKey];

              return (
                <div key={i} className={`rounded-2xl border-2 ${colors.border} ${colors.bg} overflow-hidden transition-all hover:shadow-md`}>
                  <div className="p-4 cursor-pointer" onClick={() => toggleNotes(topicKey, item.topic)}>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm border border-gray-100">
                          <BookOpen size={18} className="text-orange-500" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-gray-800 truncate text-sm sm:text-base">{item.topic}</p>
                          <div className="flex items-center gap-2 flex-wrap mt-0.5">
                            <span className="text-[10px] bg-white/60 text-orange-700 px-2 py-0.5 rounded font-bold uppercase">{item.subjectName}</span>
                            <span className="text-[10px] text-gray-500">Failed {item.failCount}x</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between sm:justify-end gap-3 pt-3 sm:pt-0 border-t sm:border-0 border-orange-100/50">
                        <span className={`text-[10px] uppercase font-bold px-2.5 py-1 rounded-lg ${colors.badge}`}>{colors.label}</span>
                        <div className="flex items-center gap-1.5 text-xs text-orange-600 font-bold bg-white px-3 py-1.5 rounded-xl shadow-sm border border-orange-100">
                          <Lightbulb size={14} className="text-yellow-500" />
                          <span className="hidden sm:inline">AI Study Notes</span>
                          <span className="sm:hidden">Notes</span>
                          {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* AI Study Notes */}
                  {isExpanded && (
                    <div className="border-t border-white/50 p-4 bg-white/50">
                      {note?.loading && (
                        <div className="flex items-center gap-2 text-sm text-orange-600 py-2">
                          <Loader size={16} className="animate-spin" />Generating study notes with AI...
                        </div>
                      )}
                      {note?.error && (
                        <p className="text-sm text-red-500 py-2">Could not load notes. Please try again.</p>
                      )}
                      {note?.content && (
                        <div>
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                            <Lightbulb size={12} className="text-yellow-500" />AI Study Notes
                          </p>
                          <div className="space-y-2">
                            {Array.isArray(note.content)
                              ? note.content.map((line, j) => (
                                  <div key={j} className="flex items-start gap-2 text-sm text-gray-700">
                                    <span className="w-5 h-5 bg-orange-100 text-orange-600 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">{j + 1}</span>
                                    <p className="leading-relaxed">{line}</p>
                                  </div>
                                ))
                              : <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{note.content}</p>
                            }
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
