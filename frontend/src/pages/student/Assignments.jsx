import { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { FileText, Upload, Clock, CheckCircle, AlertTriangle, Loader, Eye } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function StudentAssignments() {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploadingId, setUploadingId] = useState(null);
  const [fileMap, setFileMap] = useState({}); // id -> File

  const [subjects, setSubjects] = useState([]);
  const [filterSubjectId, setFilterSubjectId] = useState('');

  const filteredAssignments = assignments.filter(a => a.subject?._id === filterSubjectId);

  useEffect(() => {
    fetchAssignments();
    fetchSubjects();
  }, []);

  const fetchSubjects = async () => {
    try {
      const res = await axios.get('/student/subjects');
      const fetchedSubjects = res.data.subjects || [];
      setSubjects(fetchedSubjects);
      if (fetchedSubjects.length > 0 && !filterSubjectId) {
        setFilterSubjectId(fetchedSubjects[0]._id);
      }
    } catch (err) {
      console.error('Failed to fetch subjects', err);
    }
  };

  // Update default filter when subjects load
  useEffect(() => {
    if (subjects.length > 0 && !filterSubjectId) {
      setFilterSubjectId(subjects[0]._id);
    }
  }, [subjects, filterSubjectId]);

  const fetchAssignments = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/student/assignments');
      setAssignments(res.data.assignments);
    } catch (err) {
      console.error(err);
    } finally { setLoading(false); }
  };

  const handleFileSelect = (id, file) => {
    if (!file) return;
    if (file.type !== 'application/pdf') { toast.error('Only PDF files are allowed'); return; }
    if (file.size > 10 * 1024 * 1024) { toast.error('File size must be under 10MB'); return; }
    setFileMap(prev => ({ ...prev, [id]: file }));
  };

  const uploadPDF = async (assignmentId) => {
    const file = fileMap[assignmentId];
    if (!file) { toast.error('Please select a PDF first'); return; }
    setUploadingId(assignmentId);
    try {
      const formData = new FormData();
      formData.append('pdf', file);
      await axios.post(`/student/assignments/${assignmentId}/submit-pdf`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success('Assignment submitted successfully! 🎉');
      setFileMap(prev => { const n = {...prev}; delete n[assignmentId]; return n; });
      fetchAssignments();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed. Try again.');
    } finally { setUploadingId(null); }
  };

  const getStatusBadge = (a) => {
    if (!a.submitted) {
      if (a.isOverdue) return <span className="text-xs px-2 py-1 rounded-full bg-red-100 text-red-600 font-medium">⚠ Overdue</span>;
      return <span className="text-xs px-2 py-1 rounded-full bg-yellow-100 text-yellow-700 font-medium">Pending</span>;
    }
    if (a.isLate) return <span className="text-xs px-2 py-1 rounded-full bg-orange-100 text-orange-700 font-medium">Submitted Late</span>;
    return <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700 font-medium">✓ Submitted</span>;
  };

  const getDaysLeft = (deadline) => {
    const ms = new Date(deadline) - new Date();
    if (ms < 0) return <span className="text-red-500 text-xs">Overdue</span>;
    const days = Math.floor(ms / (1000 * 60 * 60 * 24));
    const hours = Math.floor((ms % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    if (days === 0) return <span className="text-orange-500 text-xs font-medium">{hours}h left</span>;
    return <span className={`text-xs ${days <= 2 ? 'text-orange-500' : 'text-gray-400'}`}>{days}d left</span>;
  };

  return (
    <div className="space-y-6">
      <div className="card">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-xl flex items-center justify-center">
              <FileText size={20} className="text-white" />
            </div>
            <div>
              <h1 className="font-bold text-gray-800 text-lg">Assignments</h1>
              <p className="text-xs text-gray-400">Upload your assignments as PDF for AI + faculty review</p>
            </div>
          </div>

          {/* Subject Filter Dropdown */}
          {!loading && assignments.length > 0 && (
            <div className="relative w-full sm:w-auto min-w-[200px]">
              <select
                className="w-full input pr-10 appearance-none cursor-pointer font-medium border-blue-100 text-blue-700 bg-blue-50/50 hover:bg-blue-50 focus:border-blue-400 transition-all text-sm"
                value={filterSubjectId}
                onChange={e => setFilterSubjectId(e.target.value)}
              >

                {subjects.map(s => (
                  <option key={s._id} value={s._id}>
                    {s.name}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
                <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader size={24} className="animate-spin text-blue-600" /></div>
      ) : assignments.length === 0 ? (
        <div className="card text-center py-16">
          <FileText size={40} className="text-gray-200 mx-auto mb-3" />
          <p className="text-gray-400">No assignments yet. Check back later!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredAssignments.length === 0 ? (
            <div className="card text-center py-12 text-gray-400 text-sm">
              No assignments found for this subject.
            </div>
          ) : (
            filteredAssignments.map(a => (
              <div key={a.id} className={`card border-2 transition-all ${a.isOverdue && !a.submitted ? 'border-red-100' : a.submitted ? 'border-green-100' : 'border-transparent hover:border-blue-100'}`}>
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h3 className="font-semibold text-gray-800">{a.title}</h3>
                      {getStatusBadge(a)}
                    </div>
                    <p className="text-xs text-blue-600 font-medium mb-1">{a.subject?.name} {a.subject?.code ? `(${a.subject.code})` : ''}</p>
                    {a.description && <p className="text-sm text-gray-500 mb-2">{a.description}</p>}
                    <div className="flex items-center gap-4 text-xs text-gray-400">
                      <span className="flex items-center gap-1"><Clock size={11} />Due: {new Date(a.deadline).toLocaleString()}</span>
                      <span>{getDaysLeft(a.deadline)}</span>
                    </div>
                  </div>

                  {/* Score if graded */}
                  {(a.score !== undefined && a.score !== null) && (
                    <div className="flex-shrink-0 text-center bg-blue-50 rounded-xl px-4 py-2 border border-blue-100 shadow-sm shadow-blue-50">
                      <p className="text-2xl font-bold text-blue-600">{a.score}</p>
                      <p className="text-[10px] text-blue-400 font-bold uppercase tracking-wider">Score</p>
                    </div>
                  )}
                </div>

                {/* Upload section — only if not submitted */}
                {!a.submitted && (
                  <div className="border-t border-gray-100 pt-4 space-y-3">
                    {a.isOverdue && (
                      <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 flex items-center gap-1.5">
                        <AlertTriangle size={12} />This assignment is past its original deadline — check with your faculty if submission is still allowed (late submission may be penalized).
                      </p>
                    )}
                    <div className="flex items-center gap-3">
                      <label className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 border-2 border-dashed rounded-xl cursor-pointer transition-all text-sm font-medium
                        ${fileMap[a.id] ? 'border-blue-400 bg-blue-50 text-blue-600' : 'border-gray-200 text-gray-400 hover:border-blue-300 hover:text-blue-500'}`}>
                        <Upload size={16} />
                        {fileMap[a.id] ? fileMap[a.id].name : 'Select PDF (max 10MB)'}
                        <input type="file" accept=".pdf" className="hidden"
                          onChange={e => handleFileSelect(a.id, e.target.files[0])} />
                      </label>
                      <button onClick={() => uploadPDF(a.id)}
                        disabled={!fileMap[a.id] || uploadingId === a.id}
                        className="btn-primary px-5 py-2.5 flex items-center gap-2 flex-shrink-0 text-sm shadow-sm">
                        {uploadingId === a.id ? <><Loader size={14} className="animate-spin" />Uploading...</> : 'Submit'}
                      </button>
                    </div>
                  </div>
                )}

                {/* Submitted state */}
                {a.submitted && (
                  <div className="border-t border-gray-100 pt-3 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-green-600 font-medium">
                      <CheckCircle size={16} />
                      <span>Submitted {a.submittedAt ? new Date(a.submittedAt).toLocaleString() : ''}</span>
                      {a.isLate && <span className="text-orange-500 text-xs">(Late)</span>}
                    </div>
                    {a.score !== undefined && a.score !== null && (
                      <span className="text-sm font-semibold text-blue-600">Final Grade: {a.score}/{a.maxMarks || 10}</span>
                    )}
                    {(a.score === undefined || a.score === null) && (
                      <span className="text-xs text-gray-400 bg-gray-50 px-2 py-1 rounded-md border border-gray-100">⏳ Awaiting grading</span>
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
