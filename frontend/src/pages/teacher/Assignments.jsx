import { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { FileText, Plus, Brain, Send, Users, CheckCircle, AlertTriangle, Loader, ChevronDown, ChevronUp, X, Clock, Edit2, BookOpen } from 'lucide-react';

export default function TeacherAssignments() {
  const [subjects, setSubjects] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [deadline, setDeadline] = useState('');
  const [questions, setQuestions] = useState([]);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const [submissions, setSubmissions] = useState({}); // assignmentId -> submissions array
  const [activeTab, setActiveTab] = useState('list'); // list | create
  const [editingQ, setEditingQ] = useState(null);
  const [maxMarks, setMaxMarks] = useState(10);
  const [editingMarks, setEditingMarks] = useState({}); // { studentId: score }
  const [editingAssignment, setEditingAssignment] = useState(null); // assignment being edited

  useEffect(() => {
    axios.get('/teacher/subjects').then(r => setSubjects(r.data.subjects));
    fetchAssignments();
  }, []);

  const fetchAssignments = async () => {
    try {
      const res = await axios.get('/teacher/assignments');
      setAssignments(res.data.assignments);
    } catch (err) { console.error('Failed to load assignments'); }
  };

  const generateAIQuestions = async () => {
    if (!title || !selectedSubject) { toast.error('Enter title and select subject first'); return; }
    setGenerating(true);
    try {
      const subjectName = subjects.find(s => s._id === selectedSubject)?.name || '';
      const res = await axios.post('/ai/generate-assignment', { title, subjectName });
      setQuestions(res.data.questions);
      toast.success('5 questions generated! Review before publishing.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to generate');
    } finally { setGenerating(false); }
  };

  const saveAssignment = async (publish = false) => {
    if (!title || !selectedSubject || !deadline) { toast.error('Fill core fields'); return; }
    setSaving(true);
    try {
      let newAss;
      if (editingAssignment) {
        const res = await axios.put(`/teacher/assignments/${editingAssignment._id}`, {
          title, description, subjectId: selectedSubject, questions, deadline, maxMarks
        });
        newAss = res.data.assignment;
        toast.success('Assignment updated!');
      } else {
        const res = await axios.post('/teacher/assignments', {
          title, description, subjectId: selectedSubject, questions, deadline, maxMarks
        });
        newAss = res.data.assignment;
        if (publish) {
          await axios.put(`/teacher/assignments/${newAss._id}/publish`);
          toast.success('Assignment published to students! 🎉');
        } else {
          toast.success('Draft saved');
        }
      }
      fetchAssignments();
      setShowCreateTabs(false);
      setEditingAssignment(null);
    } catch (err) { toast.error(err.response?.data?.message || 'Save failed'); }
    finally { setSaving(false); }
  };

  const publishAssignment = async (id) => {
    try {
      await axios.put(`/teacher/assignments/${id}/publish`);
      fetchAssignments();
      toast.success('Published constraint active');
    } catch (err) { toast.error('Failed to publish'); }
  };

  const loadSubmissions = async (id) => {
    if (expandedId === id) { setExpandedId(null); return; }
    setExpandedId(id);
    if (submissions[id]) return;
    try {
      const res = await axios.get(`/teacher/assignments/${id}/submissions`);
      setSubmissions(prev => ({ ...prev, [id]: res.data.submissionStatus }));
    } catch (err) { toast.error('Failed to load submissions'); }
  };

  const updateQuestion = (index, field, value) => {
    setQuestions(prev => prev.map((q, i) => i === index ? { ...q, [field]: value } : q));
  };
  const removeQuestion = (index) => setQuestions(prev => prev.filter((_, i) => i !== index));

  const saveManualScore = async (assignmentId, sub) => {
    const newScore = editingMarks[sub.student.id] !== undefined ? editingMarks[sub.student.id] : sub.score;
    if (newScore === undefined || newScore === null || newScore === '') { toast.error('Enter a valid score'); return; }
    try {
      await axios.put(`/teacher/assignments/${assignmentId}/submissions/${sub.student.id}/grade`, { score: parseInt(newScore) });
      toast.success('Score saved!');
      loadSubmissions(assignmentId); // Reload to reflect changes
      setSubmissions(prev => ({...prev, [assignmentId]: prev[assignmentId].map(s => s.student.id === sub.student.id ? {...s, score: parseInt(newScore)} : s)}));
      setEditingMarks(prev => { const n = {...prev}; delete n[sub.student.id]; return n; });
    } catch (err) { toast.error('Failed to save score'); }
  };

  const statusColor = (status) => {
    if (status === 'submitted') return 'bg-green-100 text-green-700';
    if (status === 'late') return 'bg-orange-100 text-orange-700';
    return 'bg-gray-100 text-gray-500';
  };

  const setShowCreateTabs = (isCreating) => {
    if (!isCreating) {
      setActiveTab('list');
      setTitle(''); setDescription(''); setDeadline(''); setQuestions([]);
      setSelectedSubject(''); setMaxMarks(10); setEditingAssignment(null);
    } else setActiveTab('create');
  };

  const startEditAssignment = (a) => {
    setEditingAssignment(a);
    setTitle(a.title);
    setDescription(a.description || '');
    setDeadline(a.deadline ? new Date(a.deadline).toISOString().slice(0, 16) : '');
    setSelectedSubject(a.subject?._id || '');
    setQuestions(a.questions || []);
    setMaxMarks(a.maxMarks || 10);
    setActiveTab('create');
  };

  return (
    <div className="space-y-6">
      <div className="card">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-xl flex items-center justify-center">
              <FileText size={20} className="text-white" />
            </div>
            <div>
              <h1 className="font-bold text-gray-800 text-lg">Assignments</h1>
              <p className="text-xs text-gray-400">PDF Submissions & AI Grading</p>
            </div>
          </div>
          <button onClick={() => setShowCreateTabs(activeTab !== 'create')} className="btn-primary flex items-center gap-2 text-sm z-10 transition-all">
            {activeTab === 'create' ? <X size={16} /> : <Plus size={16} />}
            {activeTab === 'create' ? 'Cancel' : 'New Assignment'}
          </button>
        </div>
      </div>

      {activeTab === 'create' && (
        <div className="card space-y-5 animate-fade-in">
          <h2 className="font-semibold text-gray-800 flex items-center gap-2">
            <Brain size={18} className="text-blue-500" />{editingAssignment ? 'Edit Assignment' : 'Draft Details'}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Title *</label>
              <input className="input" placeholder="Title..." value={title} onChange={e => setTitle(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Subject *</label>
              <select className="input" value={selectedSubject} onChange={e => setSelectedSubject(e.target.value)}>
                <option value="">-- Select --</option>
                {subjects.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="text-sm font-medium text-gray-700 mb-1 block">Description</label>
              <textarea className="input resize-none" rows={2} value={description} onChange={e => setDescription(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Deadline *</label>
              <input type="datetime-local" className="input" value={deadline} onChange={e => setDeadline(e.target.value)} min={new Date().toISOString().slice(0, 16)} />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Max Marks *</label>
              <input type="number" className="input" value={maxMarks} onChange={e => setMaxMarks(e.target.value)} min={1} />
            </div>
          </div>

          <button onClick={generateAIQuestions} disabled={generating || !title || !selectedSubject} className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-blue-200 rounded-xl text-blue-600 font-medium hover:bg-blue-50 transition-all disabled:opacity-50">
            {generating ? <Loader size={16} className="animate-spin" /> : <Brain size={16} />}
            {generating ? 'Generating AI guidelines...' : 'Generate 5 AI Questions'}
          </button>

          {questions.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between"><p className="text-sm font-semibold text-gray-700">Questions</p></div>
              {questions.map((q, i) => (
                <div key={i} className="border border-gray-100 rounded-xl overflow-hidden p-3 flex items-start gap-3">
                  <span className="w-6 h-6 bg-blue-100 text-blue-700 rounded text-xs font-bold flex items-center justify-center">{i + 1}</span>
                  <div className="flex-1 space-y-2">
                    {editingQ === i ? (
                      <textarea className="input text-sm resize-none" rows={2} value={q.question} onChange={e => updateQuestion(i, 'question', e.target.value)} onBlur={() => setEditingQ(null)} autoFocus />
                    ) : (
                      <p className="text-sm text-gray-700 cursor-pointer hover:text-blue-500" onClick={() => setEditingQ(i)}>{q.question}</p>
                    )}
                  </div>
                  <button onClick={() => removeQuestion(i)} className="text-gray-300 hover:text-red-400"><X size={14} /></button>
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button onClick={() => saveAssignment(false)} disabled={saving} className="flex-1 btn-secondary">{saving ? 'Saving...' : editingAssignment ? 'Update' : 'Save Draft'}</button>
            {!editingAssignment && (
              <button onClick={() => saveAssignment(true)} disabled={saving} className="flex-1 border-0 bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-medium py-2 rounded-xl flex items-center justify-center gap-2 transition-opacity hover:opacity-90">{saving ? 'Publishing...' : 'Publish Now'}</button>
            )}
          </div>
        </div>
      )}

      {activeTab === 'list' && (
        <div className="space-y-4">
          {assignments.length === 0 ? (
             <div className="card text-center py-16 text-gray-400">No assignments found</div>
          ) : (
            assignments.map(a => (
              <div key={a._id} className="card border-l-4 border-l-transparent hover:border-l-blue-400 transition-all duration-200">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-gray-800">{a.title}</h3>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${a.isPublished ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {a.isPublished ? 'Live' : 'Draft'}
                      </span>
                    </div>
                    <p className="text-xs text-blue-600 font-medium mb-1 flex items-center gap-1.5"><BookOpen size={12}/>{a.subject?.name}</p>
                    <div className="flex items-center gap-4 text-xs text-gray-400 mt-2">
                      <span className="flex items-center gap-1"><Clock size={12} />Due: {new Date(a.deadline).toLocaleDateString()}</span>
                      <span className="flex items-center gap-1"><FileText size={12} />Max: {a.maxMarks || 10} marks</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 bg-gray-50 p-2 rounded-xl border border-gray-100">
                    {!a.isPublished && (
                      <>
                        <button onClick={() => startEditAssignment(a)} className="text-gray-600 bg-white hover:bg-yellow-50 hover:text-yellow-600 border border-gray-200 text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5 font-medium transition-colors">
                          <Edit2 size={12} /> Edit
                        </button>
                        <button onClick={() => publishAssignment(a._id)} className="btn-primary text-xs px-3 py-1.5 flex items-center gap-1 shadow-none bg-blue-600"><Send size={12} />Publish</button>
                      </>
                    )}
                    <button onClick={() => loadSubmissions(a._id)} className="text-gray-600 bg-white hover:bg-gray-100 border border-gray-200 text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5 font-medium transition-colors">
                      <Users size={14} />{expandedId === a._id ? 'Close' : 'Submissions'}
                    </button>
                  </div>
                </div>

                {expandedId === a._id && (
                  <div className="mt-5 pt-4 border-t border-gray-100">
                    <div className="flex items-center justify-between mb-3">
                       <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Student Submissions</p>
                    </div>
                    {submissions[a._id] ? (
                      <div className="overflow-hidden rounded-xl border border-gray-100">
                        <table className="w-full text-sm text-left whitespace-nowrap">
                          <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                            <tr>
                              <th className="px-4 py-3 font-medium">Student</th>
                              <th className="px-4 py-3 font-medium text-center">Status</th>
                              <th className="px-4 py-3 font-medium text-center">AI Score</th>
                              <th className="px-4 py-3 font-medium text-center">Final Score</th>
                              <th className="px-4 py-3 font-medium text-right">Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-50 bg-white">
                            {submissions[a._id].map((s, i) => (
                              <tr key={i} className="hover:bg-slate-50 transition-colors">
                                <td className="px-4 py-3">
                                  <p className="font-medium text-gray-800">{s.student.name}</p>
                                  <p className="text-[10px] text-gray-400 font-mono mt-0.5">{s.student.rollNo || 'N/A'}</p>
                                </td>
                                <td className="px-4 py-3 text-center">
                                  <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded-full ${statusColor(s.status)}`}>{s.status}</span>
                                </td>
                                <td className="px-4 py-3 text-center text-blue-600 font-bold">
                                  {s.aiScore !== null && s.aiScore !== undefined ? s.aiScore : '-'}
                                </td>
                                <td className="px-4 py-3 text-center">
                                  {s.status !== 'pending' ? (
                                    <div className="flex items-center justify-center gap-2">
                                      <input type="number" min="0" max={a.maxMarks || 10}
                                        value={editingMarks[s.student.id] !== undefined ? editingMarks[s.student.id] : (s.score || '')}
                                        onChange={e => setEditingMarks({...editingMarks, [s.student.id]: e.target.value})}
                                        className="w-16 px-2 py-1 text-center border border-gray-200 rounded font-medium focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors outline-none"
                                        placeholder="-" />
                                      <span className="text-xs text-gray-400">/{a.maxMarks || 10}</span>
                                    </div>
                                  ) : <span className="text-gray-300">-</span>}
                                </td>
                                <td className="px-4 py-3 text-right">
                                   {s.status !== 'pending' && (
                                     <div className="flex items-center justify-end gap-2">
                                       <button onClick={() => saveManualScore(a._id, s)} className="text-xs bg-blue-50 hover:bg-blue-100 text-blue-600 font-semibold px-2 py-1.5 rounded transition-colors">Save</button>
                                       {s.pdfPath && <a href={`http://localhost:5000/uploads/assignments/${s.pdfPath}`} target="_blank" rel="noreferrer" className="text-xs bg-gray-50 hover:bg-gray-100 text-gray-600 font-medium px-2 py-1.5 rounded flex items-center gap-1 transition-colors border border-gray-200"><FileText size={12}/> View PDF</a>}
                                     </div>
                                   )}
                                </td>
                              </tr>
                            ))}
                            {submissions[a._id].length === 0 && <tr><td colSpan={5} className="text-center py-6 text-gray-400">No students enrolled</td></tr>}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="flex justify-center py-4"><Loader size={18} className="animate-spin text-blue-500" /></div>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
