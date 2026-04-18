import { useState, useEffect } from 'react';
import axios from 'axios';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import toast from 'react-hot-toast';
import { FileDown, Calendar, Search, Activity, BookOpen, ChevronDown } from 'lucide-react';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export default function TeacherMonthlyReport() {
  const [subjects, setSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    axios.get('/teacher/subjects').then(r => setSubjects(r.data.subjects));
  }, []);

  const generateReport = async () => {
    if (!selectedSubject) { toast.error('Please select a subject'); return; }
    setLoading(true);
    try {
      const res = await axios.get(`/teacher/monthly-report?subjectId=${selectedSubject}&month=${selectedMonth}&year=${selectedYear}`);
      setReport(res.data.report);
      toast.success('Report successfully generated!');
    } catch (err) { toast.error('Failed to generate report'); }
    finally { setLoading(false); }
  };

  const downloadPDF = () => {
    if (!report || report.length === 0) return;
    const doc = new jsPDF();
    const subjectName = subjects.find(s => s._id === selectedSubject)?.name || '';

    doc.setFontSize(18);
    doc.text('Monthly Assessment Report', 14, 22);
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Subject: ${subjectName}`, 14, 30);
    doc.text(`Period: ${MONTHS[selectedMonth - 1]} ${selectedYear}`, 14, 36);

    const tableColumn = ["Roll No", "Student Name", "Tests", "Avg Score", "Attendance", "Grade"];
    const tableRows = report.map(r => [
      r.student.rollNo || '-',
      r.student.name,
      r.testsGiven,
      `${r.averageScore}/10`,
      `${r.attendancePercentage}%`,
      r.grade
    ]);

    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 45,
      theme: 'grid',
      headStyles: { fillColor: [79, 70, 229] } // indigo-600
    });

    doc.save(`Report_${subjectName.replace(/\s+/g, '_')}_${MONTHS[selectedMonth - 1]}_${selectedYear}.pdf`);
  };

  const getGradeColor = (grade) => {
    if (grade === 'Excellent') return 'text-green-600 bg-green-50 border border-green-200';
    if (grade === 'Good') return 'text-blue-600 bg-blue-50 border border-blue-200';
    if (grade === 'Average') return 'text-yellow-600 bg-yellow-50 border border-yellow-200';
    return 'text-red-600 bg-red-50 border border-red-200';
  };

  return (
    <div className="space-y-6">
      <div className="card">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-xl flex items-center justify-center shadow-sm">
            <Activity size={20} className="text-white" />
          </div>
          <div>
            <h1 className="font-bold text-gray-800 text-lg">Monthly Performance Report</h1>
            <p className="text-xs text-gray-400">Generate aggregated test and attendance reports</p>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div className="md:col-span-2">
            <label className="text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-1.5"><BookOpen size={14}/> Subject *</label>
            <select className="input" value={selectedSubject} onChange={e => setSelectedSubject(e.target.value)}>
              <option value="">-- Select Subject --</option>
              {subjects.map(s => <option key={s._id} value={s._id}>{s.name} ({s.code}) - {s.class}</option>)}
            </select>
          </div>
          
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-1.5"><Calendar size={14}/> Month</label>
            <select className="input" value={selectedMonth} onChange={e => setSelectedMonth(Number(e.target.value))}>
              {MONTHS.map((m, i) => <option key={i+1} value={i+1}>{m}</option>)}
            </select>
          </div>

          <button onClick={generateReport} disabled={loading || !selectedSubject} className="btn-primary w-full py-2.5 flex justify-center items-center gap-2">
            <Search size={18} /> {loading ? 'Fetching...' : 'Get Report'}
          </button>
        </div>
      </div>

      {report && (
        <div className="card px-0 overflow-hidden animate-fade-in">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
            <div>
              <h2 className="font-bold text-gray-800">Report Results</h2>
              <p className="text-xs text-gray-500 mt-0.5">{report.length} students found</p>
            </div>
            <button onClick={downloadPDF} disabled={report.length === 0} className="btn-secondary text-sm flex items-center gap-2 border-indigo-200 text-indigo-700 hover:bg-indigo-50">
              <FileDown size={16} /> Export PDF
            </button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-white text-xs text-gray-400 tracking-wider">
                <tr className="border-b border-gray-100">
                  <th className="px-6 py-3 font-medium">Roll No</th>
                  <th className="px-6 py-3 font-medium">Student Name</th>
                  <th className="px-6 py-3 font-medium text-center">Tests Taken</th>
                  <th className="px-6 py-3 font-medium text-center">Avg Score</th>
                  <th className="px-6 py-3 font-medium text-center">Attendance</th>
                  <th className="px-6 py-3 font-medium text-center">Grade</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {report.length === 0 ? (
                  <tr><td colSpan={6} className="text-center py-12 text-gray-400">No data found for this period.</td></tr>
                ) : (
                  report.map((r, i) => (
                    <tr key={i} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-3 font-mono text-xs text-gray-500">{r.student.rollNo || '-'}</td>
                      <td className="px-6 py-3 font-medium text-gray-800">{r.student.name}</td>
                      <td className="px-6 py-3 text-center text-gray-600">{r.testsGiven}</td>
                      <td className="px-6 py-3 text-center font-bold text-gray-800">{r.averageScore}<span className="text-xs text-gray-400 font-normal">/10</span></td>
                      <td className="px-6 py-3 text-center font-medium text-indigo-600">{r.attendancePercentage}%</td>
                      <td className="px-6 py-3 text-center">
                        <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${getGradeColor(r.grade)}`}>{r.grade}</span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
