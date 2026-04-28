import { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { BookOpen, FileText, Upload, ExternalLink } from 'lucide-react';

export default function FacultySubjects() {
  const [subjects, setSubjects] = useState([]);
  const [uploadingId, setUploadingId] = useState(null);

  useEffect(() => { fetchSubjects(); }, []);

  const fetchSubjects = async () => {
    try {
      const res = await axios.get('/faculty/subjects');
      setSubjects(res.data.subjects);
    } catch { toast.error('Failed to load subjects'); }
  };

  const uploadPDF = async (id, file) => {
    if (!file) return;
    if (file.type !== 'application/pdf') { toast.error('Only PDF allowed'); return; }
    setUploadingId(id);
    try {
      const fd = new FormData();
      fd.append('syllabuspdf', file);
      await axios.post(`/faculty/subjects/${id}/syllabus-pdf`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success('Syllabus PDF uploaded!');
      fetchSubjects();
    } catch { toast.error('PDF upload failed'); }
    finally { setUploadingId(null); }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="card py-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-xl flex items-center justify-center shadow-sm">
            <BookOpen size={18} className="text-white" />
          </div>
          <div>
            <h1 className="font-bold text-gray-800">My Subjects</h1>
            <p className="text-xs text-gray-400">Upload PDF syllabus for your assigned subjects</p>
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {subjects.map(s => (
          <div key={s._id} className="card border-t-4 border-t-indigo-400 p-4">
            {/* Subject info */}
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-semibold text-gray-800">{s.name}</h3>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded font-mono">{s.code}</span>
                  <span className="text-[10px] text-indigo-600 font-medium">{s.class}</span>
                </div>
              </div>
              {/* Syllabus status */}
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${s.syllabusFile ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                {s.syllabusFile ? '✓ PDF uploaded' : 'No PDF'}
              </span>
            </div>

            {/* Syllabus actions row */}
            <div className="flex items-center gap-2 bg-gray-50 rounded-xl p-3 border border-gray-100">
              <FileText size={14} className="text-indigo-400 flex-shrink-0" />
              <span className="text-xs text-gray-500 font-medium flex-1">Syllabus PDF</span>

              {/* Upload */}
              <label className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors border
                ${uploadingId === s._id ? 'text-gray-400 border-gray-100 bg-gray-50' : 'text-indigo-600 border-indigo-200 bg-indigo-50 hover:bg-indigo-100'}`}>
                <Upload size={12} />
                {uploadingId === s._id ? 'Uploading...' : s.syllabusFile ? 'Replace' : 'Upload'}
                <input
                  type="file" accept=".pdf" className="hidden"
                  disabled={uploadingId === s._id}
                  onChange={e => uploadPDF(s._id, e.target.files[0])}
                />
              </label>

              {/* View PDF */}
              {s.syllabusFile && (
                <a
                  href={`http://localhost:5000/uploads/syllabi/${s.syllabusFile}`}
                  target="_blank" rel="noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-blue-600 border border-blue-200 bg-blue-50 hover:bg-blue-100 transition-colors"
                >
                  <ExternalLink size={12} /> Open PDF
                </a>
              )}
            </div>
          </div>
        ))}

        {subjects.length === 0 && (
          <div className="lg:col-span-2 card text-center py-12">
            <BookOpen size={36} className="text-gray-200 mx-auto mb-2" />
            <p className="text-gray-400 text-sm">No subjects assigned. Contact the admin.</p>
          </div>
        )}
      </div>
    </div>
  );
}
