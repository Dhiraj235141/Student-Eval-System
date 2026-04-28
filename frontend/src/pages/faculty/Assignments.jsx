import { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { FileText, Plus, Brain, Send, Users, Loader, X, Clock, Edit2, BookOpen, CalendarClock, RefreshCw, Trash2, Download } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useAuth } from '../../context/AuthContext';

export default function FacultyAssignments() {
  const { user } = useAuth();
  const [allSubjects, setAllSubjects] = useState([]);
  const [availableYears, setAvailableYears] = useState([]);
  const [filterYear, setFilterYear] = useState('');
  const [assignments, setAssignments] = useState([]);
  
  const subjects = allSubjects.filter(s => s.class === filterYear);
  const [filterSubjectId, setFilterSubjectId] = useState('');
  const [activeSemesterName, setActiveSemesterName] = useState('');
  
  const [selectedSubject, setSelectedSubject] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [deadline, setDeadline] = useState('');
  const [questions, setQuestions] = useState([]);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const [submissions, setSubmissions] = useState({});
  const [loadingSubmissions, setLoadingSubmissions] = useState({});
  const [activeTab, setActiveTab] = useState('list');
  const [editingQ, setEditingQ] = useState(null);
  const [maxMarks, setMaxMarks] = useState(10);
  const [editingMarks, setEditingMarks] = useState({});
  const [editingAssignment, setEditingAssignment] = useState(null);

  // Extend deadline modal
  const [extendModal, setExtendModal] = useState(null);
  const [newDeadline, setNewDeadline] = useState('');
  const [extending, setExtending] = useState(false);

  useEffect(() => {
    fetchSubjects();
    fetchAssignments();
  }, []);

  useEffect(() => {
    if (subjects.length > 0 && !subjects.find(s => s._id === filterSubjectId)) {
      setFilterSubjectId(subjects[0]._id);
    } else if (subjects.length === 0) {
      setFilterSubjectId('');
    }
    if (subjects.length > 0 && !subjects.find(s => s._id === selectedSubject)) {
      setSelectedSubject(subjects[0]._id);
    } else if (subjects.length === 0) {
      setSelectedSubject('');
    }
  }, [filterYear, allSubjects]);

  const fetchSubjects = async () => {
    try {
      const res = await axios.get('/faculty/subjects');
      const subs = res.data.subjects || [];
      setAllSubjects(subs);
      setActiveSemesterName(res.data.activeSemester || '');
      const years = [...new Set(subs.map(s => s.class))].filter(Boolean);
      setAvailableYears(years);
      if (years.length > 0) {
        setFilterYear(years[0]);
      }
    } catch (err) { toast.error('Failed to load subjects'); }
  };

  const fetchAssignments = async () => {
    try {
      const res = await axios.get('/faculty/assignments');
      setAssignments(res.data.assignments);
    } catch (err) { console.error('Failed to load assignments'); }
  };

  const generateAIQuestions = async () => {
    if (!title || !selectedSubject) { toast.error('Enter title and select subject first'); return; }
    setGenerating(true);
    try {
      const subjectName = subjects.find(s => s._id === selectedSubject)?.name || '';
      const res = await axios.post('/ai/generate-assignment', { title, subjectName, description });
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
        const res = await axios.put(`/faculty/assignments/${editingAssignment._id}`, {
          title, description, subjectId: selectedSubject, questions, deadline, maxMarks
        });
        newAss = res.data.assignment;
        toast.success('Assignment updated!');
      } else {
        const res = await axios.post('/faculty/assignments', {
          title, description, subjectId: selectedSubject, questions, deadline, maxMarks
        });
        newAss = res.data.assignment;
        if (publish) {
          await axios.put(`/faculty/assignments/${newAss._id}/publish`);
          toast.success('Assignment published to students! 🎉');
        } else {
          toast.success('Draft saved');
        }
      }
      fetchAssignments();
      resetForm();
    } catch (err) { toast.error(err.response?.data?.message || 'Save failed'); }
    finally { setSaving(false); }
  };

  const publishAssignment = async (id) => {
    try {
      await axios.put(`/faculty/assignments/${id}/publish`);
      fetchAssignments();
      toast.success('Assignment published!');
    } catch (err) { toast.error('Failed to publish'); }
  };

  const loadSubmissions = async (id) => {
    if (expandedId === id) { setExpandedId(null); return; }
    setExpandedId(id);
    setLoadingSubmissions(prev => ({ ...prev, [id]: true }));
    try {
      const res = await axios.get(`/faculty/assignments/${id}/submissions`);
      setSubmissions(prev => ({ ...prev, [id]: res.data.submissionStatus }));
    } catch (err) {
      toast.error('Failed to load submissions');
    } finally {
      setLoadingSubmissions(prev => ({ ...prev, [id]: false }));
    }
  };

  const refreshSubmissions = async (id) => {
    setLoadingSubmissions(prev => ({ ...prev, [id]: true }));
    try {
      const res = await axios.get(`/faculty/assignments/${id}/submissions`);
      setSubmissions(prev => ({ ...prev, [id]: res.data.submissionStatus }));
    } catch (err) {
      toast.error('Failed to refresh submissions');
    } finally {
      setLoadingSubmissions(prev => ({ ...prev, [id]: false }));
    }
  };

  const updateQuestion = (index, field, value) => {
    setQuestions(prev => prev.map((q, i) => i === index ? { ...q, [field]: value } : q));
  };
  const removeQuestion = (index) => setQuestions(prev => prev.filter((_, i) => i !== index));

  const saveManualScore = async (assignmentId, sub) => {
    const newScore = editingMarks[sub.student.id] !== undefined ? editingMarks[sub.student.id] : sub.score;
    if (newScore === undefined || newScore === null || newScore === '') { toast.error('Enter a valid score'); return; }
    try {
      await axios.put(`/faculty/assignments/${assignmentId}/submissions/${sub.student.id}/grade`, { score: parseInt(newScore) });
      toast.success('Score saved!');
      refreshSubmissions(assignmentId);
      setEditingMarks(prev => { const n = {...prev}; delete n[sub.student.id]; return n; });
    } catch (err) { toast.error('Failed to save score'); }
  };

  const openExtendModal = (a) => {
    setExtendModal(a);
    setNewDeadline(a.deadline ? new Date(a.deadline).toISOString().slice(0, 16) : '');
  };

  const extendDeadline = async () => {
    if (!newDeadline) { toast.error('Select a new deadline'); return; }
    setExtending(true);
    try {
      await axios.put(`/faculty/assignments/${extendModal._id}`, { deadline: newDeadline });
      toast.success('Deadline extended! Students can now submit.');
      setExtendModal(null);
      fetchAssignments();
      if (expandedId === extendModal._id) refreshSubmissions(extendModal._id);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to extend deadline');
    } finally { setExtending(false); }
  };

  const deleteAssignment = async (id, title) => {
    if (!window.confirm(`Delete assignment "${title}"? This cannot be undone.`)) return;
    try {
      await axios.delete(`/faculty/assignments/${id}`);
      toast.success('Assignment deleted');
      fetchAssignments();
      if (expandedId === id) setExpandedId(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete assignment');
    }
  };

  const statusColor = (status) => {
    if (status === 'submitted') return 'bg-green-100 text-green-700';
    if (status === 'late') return 'bg-orange-100 text-orange-700';
    return 'bg-gray-100 text-gray-500';
  };

  const resetForm = () => {
    setActiveTab('list');
    setTitle(''); setDescription(''); setDeadline(''); setQuestions([]);
    setSelectedSubject(''); setMaxMarks(10); setEditingAssignment(null);
  };

  const startEditAssignment = (a) => {
    if (a.isPublished) {
      openExtendModal(a);
      return;
    }
    setEditingAssignment(a);
    setTitle(a.title);
    setDescription(a.description || '');
    setDeadline(a.deadline ? new Date(a.deadline).toISOString().slice(0, 16) : '');
    setSelectedSubject(a.subject?._id || '');
    setQuestions(a.questions || []);
    setMaxMarks(a.maxMarks || 10);
    setActiveTab('create');
  };

  const isOverdue = (a) => new Date(a.deadline) < new Date();

  // --- PDF GENERATION LOGIC ---

  const generateQuestionsPDF = (assignmentObj, isPreview = false) => {
    const qs = isPreview ? questions : assignmentObj.questions;
    if (!qs || qs.length === 0) {
      toast.error("No questions to download.");
      return;
    }
    const doc = new jsPDF();
    const img = new Image();
    img.src = '/logo.png';
    img.onload = () => createQuestionsPDFContent(doc, qs, assignmentObj, img, isPreview);
    img.onerror = () => createQuestionsPDFContent(doc, qs, assignmentObj, null, isPreview);
  };

  const createQuestionsPDFContent = (doc, qs, assignmentObj, img, isPreview) => {
    if (img) {
      doc.addImage(img, 'PNG', 15, 10, 20, 20);
    }
    
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("GOVERNMENT POLYTECHNIC NASHIK", 105, 20, { align: "center" });
    
    doc.setLineWidth(0.5);
    doc.line(15, 32, 195, 32); // Top line
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    
    doc.text(`Academic Year : 2025-26`, 15, 38);
    doc.text(`Program : Information Technology`, 15, 43);
    doc.text(`Semester : Even`, 15, 48);
    
    let subjectName = "";
    if (isPreview) {
       subjectName = subjects.find(s => s._id === selectedSubject)?.name || "Subject";
    } else {
       subjectName = assignmentObj?.subject?.name || "Subject";
    }
    const courseCode = isPreview 
       ? subjects.find(s => s._id === selectedSubject)?.code || "" 
       : assignmentObj?.subject?.code || "";

    doc.text(`Course Name: ${subjectName}`, 120, 38);
    doc.text(`Course Code: ${courseCode}`, 120, 43);
    doc.text(`Name Of Faculty: ${user?.name || 'Faculty'}`, 120, 48);
    
    doc.line(15, 52, 195, 52); // Bottom line

    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 112, 192); // Blueish
    const titleText = isPreview ? title || 'Assignment' : assignmentObj?.title || 'Assignment';
    doc.text(`Assignment :- ${titleText}`, 105, 65, { align: "center" });
    doc.setTextColor(0, 0, 0);

    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    
    let yPos = 85;
    qs.forEach((q, index) => {
      const text = `Q${index + 1}. ${q.question}`;
      const splitText = doc.splitTextToSize(text, 170);
      doc.text(splitText, 15, yPos);
      yPos += splitText.length * 7 + 3;
      
      if (yPos > 270) {
        doc.addPage();
        yPos = 20;
      }
    });

    doc.save(`${titleText.replace(/\s+/g, '_')}_Questions.pdf`);
  };

  const generateAllAssignmentsPDF = () => {
    // Sort published assignments by creation date (oldest = Assignment 1)
    const subjectAssignments = filteredAssignments
      .filter(a => a.isPublished)
      .sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0));

    if (subjectAssignments.length === 0) {
      toast.error('No published assignments found for this subject');
      return;
    }

    const doc = new jsPDF();
    const img = new Image();
    img.src = '/logo.png';
    img.onload = () => createAllAssignmentsPDFContent(doc, subjectAssignments, img);
    img.onerror = () => createAllAssignmentsPDFContent(doc, subjectAssignments, null);
  };

  const createAllAssignmentsPDFContent = (doc, subjectAssignments, img) => {
    subjectAssignments.forEach((assignment, aIndex) => {
      if (aIndex > 0) doc.addPage();

      const assignmentNumber = aIndex + 1; // Sequential: 1, 2, 3...

      if (img) {
        doc.addImage(img, 'PNG', 15, 10, 20, 20);
      }

      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.text("GOVERNMENT POLYTECHNIC NASHIK", 105, 20, { align: "center" });

      doc.setLineWidth(0.5);
      doc.line(15, 32, 195, 32);

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");

      doc.text(`Academic Year : 2025-26`, 15, 38);
      doc.text(`Program : Information Technology`, 15, 43);
      doc.text(`Semester : Even`, 15, 48);

      const subjectName = assignment?.subject?.name || '';
      doc.text(`Course Name: ${subjectName}`, 120, 38);
      doc.text(`Course Code: ${assignment?.subject?.code || ''}`, 120, 43);
      doc.text(`Name Of Faculty: ${user?.name || 'Faculty'}`, 120, 48);

      doc.line(15, 52, 195, 52);

      // Use sequential number in header: "Assignment :- 1", "Assignment :- 2" etc.
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(0, 112, 192);
      doc.text(`Assignment :- ${assignmentNumber}`, 105, 62, { align: "center" });
      doc.setTextColor(0, 0, 0);

      // Show title as subtitle below the number
      doc.setFontSize(10);
      doc.setFont("helvetica", "italic");
      doc.setTextColor(80, 80, 80);
      doc.text(`(${assignment?.title})`, 105, 70, { align: "center" });
      doc.setTextColor(0, 0, 0);
      doc.setFont("helvetica", "normal");

      doc.setFontSize(11);
      let yPos = 85;
      assignment.questions.forEach((q, index) => {
        const text = `Q${index + 1}. ${q.question}`;
        const splitText = doc.splitTextToSize(text, 170);
        doc.text(splitText, 15, yPos);
        yPos += splitText.length * 7 + 5;

        if (yPos > 270) {
          doc.addPage();
          yPos = 20;
        }
      });
    });

    const subjectName = subjectAssignments[0]?.subject?.name || 'Subject';
    doc.save(`${subjectName.replace(/\s+/g, '_')}_All_Assignments.pdf`);
  };


  const generateReportPDF = (assignment, subs) => {
    if (!subs || subs.length === 0) {
      toast.error('No submissions found to generate report');
      return;
    }
    const doc = new jsPDF();
    const img = new Image();
    img.src = '/logo.png';
    img.onload = () => createReportPDFContent(doc, assignment, subs, img);
    img.onerror = () => createReportPDFContent(doc, assignment, subs, null);
  };

  const createReportPDFContent = (doc, assignment, subs, img) => {
    if (img) {
      doc.addImage(img, 'PNG', 15, 10, 20, 20);
    }
    
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("GOVERNMENT POLYTECHNIC NASHIK", 105, 20, { align: "center" });
    
    doc.setFontSize(12);
    doc.text(`Assignment Report: ${assignment.title}`, 105, 30, { align: "center" });
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Subject: ${assignment?.subject?.name || ''}`, 15, 45);
    doc.text(`Max Marks: ${assignment?.maxMarks || 10}`, 15, 50);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 150, 45);

    const tableData = subs.map((s, i) => [
      i + 1,
      s.student.name,
      s.student.rollNo || 'N/A',
      s.student.branch || 'IT',
      s.submittedAt ? new Date(s.submittedAt).toLocaleString() : '-',
      s.status.toUpperCase(),
      s.aiScore !== null && s.aiScore !== undefined ? s.aiScore : '-',
      s.status !== 'pending' ? (s.score !== null && s.score !== undefined ? s.score : '-') : '-'
    ]);

    autoTable(doc, {
      startY: 55,
      head: [['Sr No', 'Name', 'Roll No', 'Branch', 'Date & Time', 'Status', 'AI Score', 'Final Score']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [41, 128, 185], textColor: 255 },
      styles: { fontSize: 8 },
    });

    doc.save(`${assignment.title.replace(/\s+/g, '_')}_Report.pdf`);
  };

  const handleDownloadReport = async (a) => {
    let subs = submissions[a._id];
    if (!subs) {
      toast.loading('Fetching submissions for report...', { id: 'fetch-subs' });
      try {
        const res = await axios.get(`/faculty/assignments/${a._id}/submissions`);
        subs = res.data.submissionStatus;
        setSubmissions(prev => ({ ...prev, [a._id]: subs }));
        toast.success('Report ready!', { id: 'fetch-subs' });
      } catch (err) {
        toast.error('Failed to load submissions', { id: 'fetch-subs' });
        return;
      }
    }
    generateReportPDF(a, subs);
  };

  const filteredAssignments = assignments.filter(a => a.subject?._id === filterSubjectId);

  return (
    <div className="space-y-6">
      {/* Extend Deadline Modal */}
      {extendModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4 animate-fade-in">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center">
                <CalendarClock size={20} className="text-white" />
              </div>
              <div>
                <h2 className="font-bold text-gray-800">Extend Deadline</h2>
                <p className="text-xs text-gray-400 truncate max-w-xs">{extendModal.title}</p>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">New Deadline *</label>
              <input
                type="datetime-local"
                className="input w-full"
                value={newDeadline}
                onChange={e => setNewDeadline(e.target.value)}
                min={new Date().toISOString().slice(0, 16)}
              />
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={extendDeadline} disabled={extending} className="btn-primary flex-1 flex items-center justify-center gap-2">
                {extending ? <Loader size={14} className="animate-spin" /> : <CalendarClock size={14} />}
                {extending ? 'Extending...' : 'Extend Deadline'}
              </button>
              <button onClick={() => setExtendModal(null)} className="btn-secondary flex-1">Cancel</button>
            </div>
          </div>
        </div>
      )}

      <div className="card">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-xl flex items-center justify-center">
              <FileText size={20} className="text-white" />
            </div>
            <div>
              <h1 className="font-bold text-gray-800 text-lg">Assignments</h1>
              <p className="text-xs text-gray-400">PDF Submissions & AI Grading</p>
            </div>
          </div>
          <button onClick={() => activeTab === 'create' ? resetForm() : setActiveTab('create')} className="btn-primary flex items-center justify-center gap-2 text-sm z-10 transition-all w-full sm:w-auto">
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
              <input className="input" placeholder="e.g. Memory Management" value={title} onChange={e => setTitle(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Year *</label>
              <select
                className="input cursor-pointer font-medium"
                value={filterYear}
                onChange={e => setFilterYear(e.target.value)}
              >
                {availableYears.length === 0 ? <option value="">No Years</option> : null}
                {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Subject *</label>
              <div className="relative">
                <select
                  className={`input pr-10 appearance-none cursor-pointer font-medium ${
                    selectedSubject ? 'border-blue-400 text-blue-700 bg-blue-50' : 'text-gray-500'
                  }`}
                  value={selectedSubject}
                  onChange={e => setSelectedSubject(e.target.value)}
                >
                  <option value="">-- Select Subject --</option>
                  {subjects.map(s => (
                    <option key={s._id} value={s._id}>{s.name} ({s.code})</option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
                  <BookOpen size={14} className={selectedSubject ? 'text-blue-500' : 'text-gray-400'} />
                </div>
              </div>
              {selectedSubject && (
                <p className="text-xs text-blue-600 mt-1 font-medium flex items-center gap-1">
                  ✓ {subjects.find(s => s._id === selectedSubject)?.name} selected
                </p>
              )}
            </div>
            <div className="sm:col-span-2">
              <label className="text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                <Brain size={14} className="text-blue-500" />
                Description
                <span className="text-xs font-normal text-gray-400">— AI uses this to generate subject-specific questions</span>
              </label>
              <div className="relative">
                <textarea
                  className={`input resize-none transition-all ${
                    description.trim() && selectedSubject
                      ? 'border-green-400 ring-1 ring-green-200 bg-green-50'
                      : ''
                  }`}
                  rows={4}
                  placeholder={selectedSubject
                    ? `Describe what ${subjects.find(s => s._id === selectedSubject)?.name || 'this subject'} questions should cover. E.g. "Cover CSS Flexbox, Grid layout, and responsive design techniques"...`
                    : 'Select a subject first, then describe what the assignment should cover...'}
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  disabled={!selectedSubject}
                />
                {description.trim() && selectedSubject && (
                  <div className="absolute top-2 right-2">
                    <span className="text-xs bg-green-500 text-white px-2 py-0.5 rounded-full font-medium">Ready ✓</span>
                  </div>
                )}
              </div>
              {!selectedSubject && (
                <p className="text-xs text-amber-500 mt-1">⚠ Select a subject first to enable description</p>
              )}
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

          <button
            onClick={generateAIQuestions}
            disabled={generating || !title || !selectedSubject}
            className={`w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed rounded-xl font-medium transition-all disabled:opacity-50 ${
              title && selectedSubject && description.trim()
                ? 'border-green-400 text-green-700 bg-green-50 hover:bg-green-100'
                : 'border-blue-200 text-blue-600 hover:bg-blue-50'
            }`}
          >
            {generating ? <Loader size={16} className="animate-spin" /> : <Brain size={16} />}
            {generating
              ? `Generating ${subjects.find(s => s._id === selectedSubject)?.name || ''} questions using AI...`
              : description.trim() && selectedSubject
                ? `Generate AI Questions for "${subjects.find(s => s._id === selectedSubject)?.name}" using description`
                : 'Generate AI Questions'
            }
          </button>

          {questions.length > 0 && (
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <p className="text-sm font-semibold text-gray-700">Questions</p>
                <button onClick={() => generateQuestionsPDF(null, true)} className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded flex items-center gap-1.5 transition-colors">
                  <Download size={12} /> Download PDF Preview
                </button>
              </div>
              {questions.map((q, i) => (
                <div key={i} className="border border-gray-100 rounded-xl overflow-hidden p-3 flex items-start gap-3">
                  <span className="w-6 h-6 bg-blue-100 text-blue-700 rounded text-xs font-bold flex items-center justify-center flex-shrink-0">{i + 1}</span>
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

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button onClick={() => saveAssignment(false)} disabled={saving} className="flex-1 btn-secondary w-full">{saving ? 'Saving...' : editingAssignment ? 'Update' : 'Save Draft'}</button>
            {!editingAssignment && (
              <button onClick={() => saveAssignment(true)} disabled={saving} className="flex-1 border-0 bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-medium py-2 rounded-xl flex items-center justify-center gap-2 transition-opacity hover:opacity-90 w-full">{saving ? 'Publishing...' : 'Publish Now'}</button>
            )}
          </div>
        </div>
      )}

      {activeTab === 'list' && (
        <div className="space-y-4">
          {/* Semester & Year Filter Dropdown */}
          <div className="card py-3 px-4 mb-4 bg-gray-50/50">
            <div className="flex flex-col md:flex-row md:items-center gap-4">
              <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-wider">
                <RefreshCw size={12} className="animate-spin-slow" />
                Active: <span className="text-blue-600">{activeSemesterName} Semester</span>
              </div>
              
              <div className="flex flex-1 flex-col sm:flex-row items-start sm:items-center gap-3">
                <div className="flex items-center gap-2">
                  <label className="text-sm font-semibold text-gray-600 whitespace-nowrap">Year:</label>
                  <select 
                    className="input py-1.5 text-xs font-bold border-gray-200 focus:border-blue-400 w-24"
                    value={filterYear}
                    onChange={e => setFilterYear(e.target.value)}
                  >
                    <option disabled value="">Select Year</option>
                    {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>

                <div className="flex items-center gap-2 flex-1">
                  <label className="text-sm font-semibold text-gray-600 whitespace-nowrap">Subject:</label>
                  <div className="relative flex-1 max-w-xs">
                    <select
                      className="input py-1.5 pr-8 appearance-none cursor-pointer text-xs font-bold border-blue-200 text-blue-700 bg-white focus:border-blue-400"
                      value={filterSubjectId}
                      onChange={e => setFilterSubjectId(e.target.value)}
                    >
                      {subjects.length === 0 ? (
                        <option value="">No subjects found</option>
                      ) : (
                        subjects.map(s => (
                          <option key={s._id} value={s._id}>{s.name} ({s.code})</option>
                        ))
                      )}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-2.5 flex items-center">
                      <BookOpen size={12} className="text-blue-400" />
                    </div>
                  </div>
                </div>

                {filterSubjectId && (
                  <span className="text-[10px] bg-blue-100 text-blue-600 px-2 py-1 rounded-full font-bold uppercase tracking-tight">
                    {filteredAssignments.length} Found
                  </span>
                )}
              </div>
            </div>
          </div>

          {filteredAssignments.length === 0 ? (
             <div className="card text-center py-16 text-gray-400">No assignments found for this subject</div>
          ) : (
            filteredAssignments.map(a => (
              <div key={a._id} className="card border-l-4 border-l-transparent hover:border-l-blue-400 transition-all duration-200">
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <h3 className="font-semibold text-gray-800">{a.title}</h3>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${a.isPublished ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {a.isPublished ? 'Live' : 'Draft'}
                      </span>
                      {a.isPublished && isOverdue(a) && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider bg-red-100 text-red-600">Overdue</span>
                      )}
                    </div>
                    <p className="text-xs text-blue-600 font-medium mb-1 flex items-center gap-1.5"><BookOpen size={12}/>{a.subject?.name}</p>
                    <div className="flex flex-wrap items-center gap-4 text-xs text-gray-400 mt-2">
                      <span className="flex items-center gap-1"><Clock size={12} />Due: {new Date(a.deadline).toLocaleString()}</span>
                      <span className="flex items-center gap-1"><FileText size={12} />Max: {a.maxMarks || 10} marks</span>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 bg-gray-50 p-2 rounded-xl border border-gray-100 lg:justify-end">
                    <button onClick={() => generateQuestionsPDF(a)} title="Download Questions PDF" className="text-gray-600 bg-white hover:bg-blue-50 hover:text-blue-600 border border-gray-200 text-xs px-2 py-1.5 rounded-lg flex items-center transition-colors">
                      <Download size={13} /> Questions PDF
                    </button>
                    {!a.isPublished && (
                      <>
                        <button onClick={() => startEditAssignment(a)} className="text-gray-600 bg-white hover:bg-yellow-50 hover:text-yellow-600 border border-gray-200 text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5 font-medium transition-colors">
                          <Edit2 size={12} /> Edit
                        </button>
                        <button onClick={() => publishAssignment(a._id)} className="btn-primary text-xs px-3 py-1.5 flex items-center gap-1 shadow-none bg-blue-600"><Send size={12} />Publish</button>
                      </>
                    )}
                    {a.isPublished && (
                      <button onClick={() => openExtendModal(a)} title="Extend submission deadline" className="text-gray-600 bg-white hover:bg-amber-50 hover:text-amber-600 border border-gray-200 text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5 font-medium transition-colors">
                        <CalendarClock size={12} /> Extend
                      </button>
                    )}
                    <button onClick={() => loadSubmissions(a._id)} className="text-gray-600 bg-white hover:bg-gray-100 border border-gray-200 text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5 font-medium transition-colors">
                      <Users size={14} />{expandedId === a._id ? 'Close' : 'Submissions'}
                    </button>
                    {a.isPublished && (
                      <button onClick={() => handleDownloadReport(a)} title="Download Report PDF" className="text-blue-600 bg-white hover:bg-blue-50 border border-gray-200 text-xs px-2 py-1.5 rounded-lg flex items-center transition-colors">
                        <Download size={13} />
                      </button>
                    )}
                    <button onClick={() => deleteAssignment(a._id, a.title)} title="Delete assignment" className="text-gray-400 bg-white hover:bg-red-50 hover:text-red-600 border border-gray-200 text-xs px-2 py-1.5 rounded-lg flex items-center transition-colors">
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                {expandedId === a._id && (
                  <div className="mt-5 pt-4 border-t border-gray-100">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 gap-2">
                       <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Student Submissions</p>
                       <div className="flex items-center gap-3">
                         <button onClick={() => generateReportPDF(a, submissions[a._id])} className="text-xs text-blue-600 hover:text-blue-700 bg-blue-50 px-2 py-1 rounded flex items-center gap-1 transition-colors">
                           <Download size={12} /> Report PDF
                         </button>
                         <button onClick={() => refreshSubmissions(a._id)} className="text-xs text-gray-400 hover:text-blue-600 flex items-center gap-1 transition-colors">
                           <RefreshCw size={12} /> Refresh
                         </button>
                       </div>
                    </div>
                    {loadingSubmissions[a._id] ? (
                      <div className="flex justify-center py-4"><Loader size={18} className="animate-spin text-blue-500" /></div>
                    ) : submissions[a._id] ? (
                      <div className="overflow-x-auto rounded-xl border border-gray-100">
                        <table className="w-full text-sm text-left whitespace-nowrap min-w-[700px]">
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
                                        value={editingMarks[s.student.id] !== undefined ? editingMarks[s.student.id] : (s.score !== null && s.score !== undefined ? s.score : '')}
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

          {/* Download All Assignments Button */}
          {filteredAssignments.some(a => a.isPublished) && (
            <div className="pt-4 flex justify-center">
              <button onClick={generateAllAssignmentsPDF} className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-5 py-2.5 rounded-xl font-medium shadow-md shadow-blue-200 hover:shadow-lg transition-all hover:-translate-y-0.5">
                <Download size={18} />
                Download All Assignments ({subjects.find(s => s._id === filterSubjectId)?.name})
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
