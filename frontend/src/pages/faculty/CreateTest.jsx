import { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Brain, FileText, Send, Loader, X, BookOpen, ExternalLink, Edit2, Check, Clock, RefreshCw, Trash2 } from 'lucide-react';

export default function FacultyCreateTest() {
  const [allSubjects, setAllSubjects] = useState([]);
  const [availableYears, setAvailableYears] = useState([]);
  const [filterYear, setFilterYear] = useState('');
  
  const subjects = allSubjects.filter(s => s.class === filterYear);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [topic, setTopic] = useState('');
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null);
  const [duration, setDuration] = useState(15);
  const [createdTest, setCreatedTest] = useState(null);
  const [activeTab, setActiveTab] = useState('create'); // 'create' | 'list'
  const [tests, setTests] = useState([]);
  const [loadingTests, setLoadingTests] = useState(false);
  const [editingTest, setEditingTest] = useState(null); // test being edited
  const [editDuration, setEditDuration] = useState(''); // duration for edit form

  useEffect(() => {
    axios.get('/faculty/subjects')
      .then(res => {
        const subs = res.data.subjects || [];
        setAllSubjects(subs);
        const years = [...new Set(subs.map(s => s.class))].filter(Boolean);
        setAvailableYears(years);
        if (years.length > 0) setFilterYear(years[0]);
      })
      .catch(() => toast.error('Failed to load subjects'));
    fetchTests();
  }, []);

  useEffect(() => {
    if (subjects.length > 0 && !subjects.find(s => s._id === selectedSubject)) {
      setSelectedSubject(subjects[0]._id);
    } else if (subjects.length === 0) {
      setSelectedSubject('');
    }
  }, [filterYear, allSubjects]);

  const fetchTests = async () => {
    setLoadingTests(true);
    try {
      const res = await axios.get('/faculty/tests');
      setTests(res.data.tests);
    } catch { /* silently fail */ }
    finally { setLoadingTests(false); }
  };

  const generateQuestions = async () => {
    if (!topic || !selectedSubject) { toast.error('Please enter a topic and select a subject'); return; }
    setQuestions([]);
    setLoading(true);
    try {
      const subjectData = subjects.find(s => s._id === selectedSubject);
      const subjectName = subjectData?.name || '';
      // Pass syllabus text so AI generates questions strictly within scope
      const syllabusText = Array.isArray(subjectData?.syllabus)
        ? subjectData.syllabus.join(' ')
        : (subjectData?.syllabus || '');
      const res = await axios.post('/ai/generate-questions', {
        topics: topic,
        subjectName,
        syllabusText: syllabusText || undefined,
        count: 10
      });
      const generated = res.data.questions || [];
      setQuestions(generated);
      toast.success(`Generated ${generated.length} questions!`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to generate questions');
    } finally { setLoading(false); }
  };

  const saveTest = async () => {
    if (questions.length === 0) { toast.error('No questions to save'); return; }
    if (!duration || duration < 1) { toast.error('Set a valid duration'); return; }
    setSaving(true);
    try {
      const res = await axios.post('/faculty/tests', { subjectId: selectedSubject, topic, questions, durationMinutes: duration });
      setCreatedTest(res.data.test);
      fetchTests();
      toast.success('Test published!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to publish test');
    } finally { setSaving(false); }
  };

  const saveEditedTest = async () => {
    if (!editingTest) return;
    setSaving(true);
    try {
      await axios.put(`/faculty/tests/${editingTest._id}`, {
        topic: editingTest.topic,
        questions: editingTest.questions,
        durationMinutes: editDuration ? parseInt(editDuration) : undefined
      });
      toast.success(editDuration ? 'Test updated & timer restarted!' : 'Test updated!');
      setEditingTest(null);
      setEditDuration('');
      fetchTests();
    } catch { toast.error('Failed to update test'); }
    finally { setSaving(false); }
  };

  const deleteTest = async (id, topic) => {
    if (!window.confirm(`Delete test "${topic}"? This cannot be undone.`)) return;
    try {
      await axios.delete(`/faculty/tests/${id}`);
      toast.success('Test deleted');
      fetchTests();
    } catch { toast.error('Failed to delete test'); }
  };

  const updateQText = (idx, text) => setQuestions(p => p.map((q, i) => i === idx ? { ...q, question: text } : q));
  const updateOpt = (qi, oi, text) => setQuestions(p => p.map((q, i) => i === qi ? { ...q, options: q.options.map((o, j) => j === oi ? text : o) } : q));
  const setCorrect = (qi, oi) => setQuestions(p => p.map((q, i) => i === qi ? { ...q, correctAnswer: oi } : q));
  const updateEditQ = (idx, field, value) => setEditingTest(t => ({ ...t, questions: t.questions.map((q, i) => i === idx ? { ...q, [field]: value } : q) }));

  const selectedSubjData = subjects.find(s => s._id === selectedSubject);

  if (createdTest) {
    return (
      <div className="card text-center py-12 animate-fade-in max-w-lg mx-auto mt-6">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Send size={32} className="text-green-600" />
        </div>
        <h1 className="text-xl font-bold text-gray-800 mb-1">Test Live!</h1>
        <p className="text-gray-500 mb-6 text-sm">Test on <span className="font-semibold text-gray-700">{createdTest.topic}</span> published.</p>
        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5 mb-6 cursor-pointer select-all hover:bg-blue-100 transition-colors">
          <p className="text-xs font-semibold text-blue-800 uppercase tracking-wider mb-1">Secret Code</p>
          <p className="text-4xl font-black text-blue-600 tracking-[0.2em] font-mono">{createdTest.secretCode}</p>
        </div>
        <p className="text-xs text-gray-400 mb-6 flex items-center justify-center gap-1"><Loader size={12} className="animate-spin" /> Live for {createdTest.durationMinutes} minutes</p>
        <div className="flex gap-3 justify-center">
          <button onClick={() => { setCreatedTest(null); setQuestions([]); setTopic(''); setSelectedSubject(''); setDuration(15); setActiveTab('list'); }} className="btn-secondary text-sm">View All Tests</button>
          <button onClick={() => { setCreatedTest(null); setQuestions([]); setTopic(''); setSelectedSubject(''); setDuration(15); }} className="btn-primary text-sm">Create Another</button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with tabs */}
      <div className="card py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-sm">
              <Brain size={18} className="text-white" />
            </div>
            <div>
              <h1 className="font-bold text-gray-800">AI Test Generator</h1>
              <p className="text-xs text-gray-400">Create timed assessments with anti-cheat</p>
            </div>
          </div>
          <div className="flex bg-gray-100 rounded-xl p-1 gap-1">
            <button onClick={() => setActiveTab('create')} className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${activeTab === 'create' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>Create</button>
            <button onClick={() => { setActiveTab('list'); fetchTests(); }} className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${activeTab === 'list' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>My Tests {tests.length > 0 && `(${tests.length})`}</button>
          </div>
        </div>
      </div>

      {/* CREATE TAB */}
      {activeTab === 'create' && (
        <div className="card space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Year</label>
              <select className="input" value={filterYear} onChange={e => setFilterYear(e.target.value)}>
                {availableYears.length === 0 && <option value="">No Years</option>}
                {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Subject</label>
              <select className="input" value={selectedSubject} onChange={e => setSelectedSubject(e.target.value)}>
                <option value="">Select a subject...</option>
                {subjects.map(s => <option key={s._id} value={s._id}>{s.name} ({s.code})</option>)}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                Test Topic(s)
              </label>
              <input
                type="text"
                className="input"
                placeholder="e.g. React Hooks, Node.js Events"
                value={topic}
                onChange={e => setTopic(e.target.value)}
              />
            </div>
          </div>

          {/* Syllabus — single compact line */}
          {selectedSubject && selectedSubjData && (selectedSubjData.syllabus || selectedSubjData.syllabusFile) && (
            <div className="flex items-center gap-3 px-4 py-2.5 bg-indigo-50 rounded-xl border border-indigo-100">
              <BookOpen size={14} className="text-indigo-500 flex-shrink-0" />
              <span className="text-sm font-medium text-indigo-700 flex-1">Syllabus</span>
              {selectedSubjData.syllabusFile && (
                <a
                  href={`http://localhost:5000/uploads/syllabi/${selectedSubjData.syllabusFile}`}
                  target="_blank" rel="noreferrer"
                  className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:underline"
                >
                  <ExternalLink size={12} /> Open PDF
                </a>
              )}
            </div>
          )}

          <button
            onClick={generateQuestions}
            disabled={loading || !topic || !selectedSubject}
            className="w-full btn-primary py-3 flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:opacity-90 transition-opacity border-0 shadow-md shadow-indigo-200"
          >
            {loading ? <Loader className="animate-spin" size={18} /> : <Brain size={18} />}
            {loading ? 'Generating 10 questions using Llama 3.1' : 'Generate 10 AI Questions'}
          </button>

          {questions.length > 0 && (
            <div className="space-y-3 animate-fade-in">
              <div className="flex items-center justify-between">
                <h2 className="font-bold text-gray-800">Review Questions</h2>
                <span className="text-sm px-3 py-1 bg-green-100 text-green-700 rounded-full font-bold">{questions.length} Generated</span>
              </div>

              <div className="space-y-3">
                {questions.map((q, qIdx) => (
                  <div key={qIdx} className={`card transition-colors ${editingIndex === qIdx ? 'ring-2 ring-indigo-500' : 'hover:border-indigo-200 border-transparent'} border`}>
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-start gap-3 flex-1">
                        <span className="w-6 h-6 bg-indigo-100 text-indigo-700 rounded text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">Q{qIdx + 1}</span>
                        {editingIndex === qIdx ? (
                          <textarea className="input text-sm resize-none" rows="2" value={q.question} onChange={e => updateQText(qIdx, e.target.value)} autoFocus />
                        ) : (
                          <p className="font-medium text-gray-800 text-sm cursor-pointer" onClick={() => setEditingIndex(qIdx)}>{q.question}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${q.difficulty === 'easy' ? 'bg-green-100 text-green-600' : q.difficulty === 'medium' ? 'bg-orange-100 text-orange-600' : 'bg-red-100 text-red-600'}`}>{q.difficulty}</span>
                        <button onClick={() => setQuestions(p => p.filter((_, i) => i !== qIdx))} className="text-gray-400 hover:text-red-500 text-xs"><X size={12} /></button>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 ml-9">
                      {q.options.map((opt, oIdx) => (
                        <div key={oIdx} className={`flex items-center gap-2 p-2 rounded-lg border ${q.correctAnswer === oIdx ? 'bg-indigo-50 border-indigo-200' : 'bg-gray-50 border-gray-100'}`}>
                          <input type="radio" name={`q${qIdx}`} checked={q.correctAnswer === oIdx} onChange={() => setCorrect(qIdx, oIdx)} className="w-3.5 h-3.5 text-indigo-600" />
                          {editingIndex === qIdx ? (
                            <input className="bg-transparent text-sm w-full outline-none" value={opt} onChange={e => updateOpt(qIdx, oIdx, e.target.value)} />
                          ) : (
                            <span className={`text-sm ${q.correctAnswer === oIdx ? 'text-indigo-800 font-medium' : 'text-gray-600'}`}>{opt}</span>
                          )}
                        </div>
                      ))}
                    </div>
                    {editingIndex === qIdx && (
                      <div className="flex justify-end mt-3"><button className="btn-secondary py-1 px-3 text-xs" onClick={() => setEditingIndex(null)}>Done</button></div>
                    )}
                  </div>
                ))}
              </div>

              <div className="card sticky bottom-6 shadow-xl border-indigo-100 z-10 flex flex-col sm:flex-row items-center gap-4 justify-between bg-white/95 backdrop-blur-md">
                <div className="flex items-center gap-3">
                  <p className="text-sm font-semibold text-gray-700">Duration</p>
                  <input type="number" min="1" max="180" className="input py-1.5 w-20 text-center" value={duration} onChange={e => setDuration(e.target.value)} />
                  <span className="text-xs text-gray-500">min</span>
                </div>
                <button onClick={saveTest} disabled={saving} className="btn-primary py-2.5 px-8 w-full sm:w-auto shadow-md flex items-center justify-center gap-2">
                  {saving ? <Loader className="animate-spin" size={16} /> : <Send size={16} />}
                  {saving ? 'Publishing...' : 'Publish Test'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* MY TESTS TAB */}
      {activeTab === 'list' && (
        <div className="space-y-3">
          {loadingTests ? (
            <div className="card flex justify-center py-12"><Loader size={24} className="animate-spin text-indigo-500" /></div>
          ) : tests.length === 0 ? (
            <div className="card text-center py-12 text-gray-400">
              <Brain size={40} className="mx-auto mb-2 text-gray-200" />
              <p className="text-sm">No tests created yet.</p>
            </div>
          ) : tests.map(t => (
            <div key={t._id} className="card">
              {editingTest?._id === t._id ? (
                /* EDIT FORM */
                <div className="space-y-3">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-semibold text-gray-700">Edit Test</p>
                    <button onClick={() => { setEditingTest(null); setEditDuration(''); }} className="text-gray-400 hover:text-red-400"><X size={16} /></button>
                  </div>
                  <input className="input text-sm" value={editingTest.topic} onChange={e => setEditingTest(t => ({ ...t, topic: e.target.value }))} placeholder="Topic" />
                  {/* Duration to restart timer */}
                  <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
                    <Clock size={14} className="text-amber-500 flex-shrink-0" />
                    <span className="text-xs font-medium text-amber-700 flex-1">Restart timer (optional)</span>
                    <input
                      type="number" min="1" max="180"
                      className="w-16 px-2 py-1 text-center border border-amber-300 rounded-lg text-xs font-bold focus:outline-none focus:ring-1 focus:ring-amber-400 bg-white"
                      placeholder="min"
                      value={editDuration}
                      onChange={e => setEditDuration(e.target.value)}
                    />
                    <span className="text-xs text-amber-600">min</span>
                  </div>
                  <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                    {editingTest.questions.map((q, qi) => (
                      <div key={qi} className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                        <textarea className="input text-xs resize-none w-full mb-2" rows={2} value={q.question} onChange={e => updateEditQ(qi, 'question', e.target.value)} />
                        <div className="grid grid-cols-2 gap-1.5">
                          {q.options.map((op, oi) => (
                            <div key={oi} className={`flex items-center gap-1.5 p-1.5 rounded-lg border ${q.correctAnswer === oi ? 'border-indigo-300 bg-indigo-50' : 'border-gray-100'}`}>
                              <input type="radio" name={`eq${qi}`} checked={q.correctAnswer === oi} onChange={() => updateEditQ(qi, 'correctAnswer', oi)} className="w-3 h-3 text-indigo-600" />
                              <input className="bg-transparent text-xs w-full outline-none" value={op} onChange={e => setEditingTest(t => ({ ...t, questions: t.questions.map((qq, i) => i === qi ? { ...qq, options: qq.options.map((o, j) => j === oi ? e.target.value : o) } : qq) }))} />
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2 justify-end pt-1">
                    <button onClick={() => { setEditingTest(null); setEditDuration(''); }} className="btn-secondary text-xs px-3 py-1.5">Cancel</button>
                    <button onClick={saveEditedTest} disabled={saving} className="btn-primary text-xs px-3 py-1.5 flex items-center gap-1">
                      {saving ? <Loader size={12} className="animate-spin" /> : <Check size={12} />} Save
                    </button>
                  </div>
                </div>
              ) : (
                /* VIEW ROW */
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-800 truncate">{t.topic}</p>
                    <p className="text-xs text-indigo-600 font-medium">{t.subject?.name}</p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                      <span className="flex items-center gap-1"><FileText size={10} />{t.questions?.length || 0} questions</span>
                      <span className="flex items-center gap-1"><Clock size={10} />{new Date(t.createdAt).toLocaleDateString()}</span>
                      <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${new Date(t.codeExpiresAt) > new Date() ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'}`}>
                        {new Date(t.codeExpiresAt) > new Date() ? 'Live' : 'Expired'}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <div className="text-center bg-indigo-50 rounded-xl px-3 py-1.5">
                      <p className="text-[10px] text-indigo-500 font-medium uppercase">Code</p>
                      <p className="font-black text-indigo-700 tracking-widest font-mono text-sm">{t.secretCode}</p>
                    </div>
                    <button onClick={() => setEditingTest({ ...t })} className="p-2 rounded-xl hover:bg-indigo-50 text-indigo-600 border border-indigo-100 transition-colors" title="Edit Test"><Edit2 size={14} /></button>
                    <button onClick={() => deleteTest(t._id, t.topic)} className="p-2 rounded-xl hover:bg-red-50 text-red-400 border border-red-100 transition-colors" title="Delete Test"><Trash2 size={14} /></button>
                  </div>
                </div>
              )}
            </div>
          ))}
          {tests.length > 0 && (
            <button onClick={fetchTests} className="w-full text-xs text-gray-400 flex items-center justify-center gap-1 hover:text-gray-600 transition-colors py-2">
              <RefreshCw size={12} /> Refresh
            </button>
          )}
        </div>
      )}
    </div>
  );
}
