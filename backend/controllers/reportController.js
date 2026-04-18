const TestResult = require('../models/TestResult');
const Attendance = require('../models/Attendance');
const Assignment = require('../models/Assignment');
const User = require('../models/User');
const Subject = require('../models/Subject');
const { generateAttendanceReport, generateMonthlyReport, generateStudentReport } = require('../utils/pdfGenerator');

const getGrade = (score) => {
  if (score >= 9) return 'Excellent';
  if (score >= 7) return 'Good';
  if (score >= 5) return 'Average';
  if (score >= 3) return 'Below Average';
  return 'Poor';
};

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

// @desc   Download attendance PDF
// @route  GET /api/reports/attendance/pdf
exports.downloadAttendancePDF = async (req, res) => {
  try {
    const { subjectId, month, year } = req.query;
    const subject = await Subject.findById(subjectId);
    if (!subject) return res.status(404).json({ success: false, message: 'Subject not found' });

    const filter = { subject: subjectId };
    if (month) filter.month = parseInt(month);
    if (year) filter.year = parseInt(year);

    const attendance = await Attendance.find(filter).populate('student', 'name rollNo class');

    // Build summary per student
    const studentMap = {};
    attendance.forEach(a => {
      const sid = a.student._id.toString();
      if (!studentMap[sid]) studentMap[sid] = { student: a.student, total: 0, present: 0 };
      studentMap[sid].total++;
      if (a.status === 'present') studentMap[sid].present++;
    });

    const summary = Object.values(studentMap).map(s => ({
      ...s,
      percentage: s.total ? ((s.present / s.total) * 100).toFixed(1) : '0.0'
    })).sort((a, b) => a.student.rollNo?.localeCompare(b.student.rollNo));

    const pdfBuffer = await generateAttendanceReport({
      subjectName: subject.name,
      month: month ? MONTHS[parseInt(month) - 1] : 'All',
      year: year || new Date().getFullYear(),
      summary,
      totalSessions: [...new Set(attendance.map(a => a.date?.toDateString()))].length
    });

    const filename = `Attendance_${subject.name.replace(/\s+/g, '_')}_${month || 'All'}_${year || ''}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(pdfBuffer);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc   Download monthly performance PDF
// @route  GET /api/reports/monthly/pdf
exports.downloadMonthlyReportPDF = async (req, res) => {
  try {
    const { subjectId, month, year } = req.query;
    const subject = await Subject.findById(subjectId);
    if (!subject) return res.status(404).json({ success: false, message: 'Subject not found' });

    const students = await User.find({ enrolledSubjects: subjectId, role: 'student' }, 'name rollNo class');

    const report = await Promise.all(students.map(async (student) => {
      const results = await TestResult.find({
        student: student._id, subject: subjectId,
        createdAt: { $gte: new Date(year, month - 1, 1), $lt: new Date(year, month, 1) }
      });
      const att = await Attendance.find({ student: student._id, subject: subjectId, month: parseInt(month), year: parseInt(year) });
      const present = att.filter(a => a.status === 'present').length;
      const avgScore = results.length ? (results.reduce((s, r) => s + r.score, 0) / results.length).toFixed(1) : 0;
      return {
        student: { name: student.name, rollNo: student.rollNo, class: student.class },
        testsGiven: results.length,
        averageScore: avgScore,
        attendancePercentage: att.length ? ((present / att.length) * 100).toFixed(1) : '0.0',
        grade: getGrade(parseFloat(avgScore))
      };
    }));

    const pdfBuffer = await generateMonthlyReport({
      subjectName: subject.name, month, year,
      report: report.sort((a, b) => a.student.rollNo?.localeCompare(b.student.rollNo))
    });

    const filename = `Monthly_Report_${subject.name.replace(/\s+/g, '_')}_${MONTHS[parseInt(month)-1]}_${year}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(pdfBuffer);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc   Download individual student report PDF
// @route  GET /api/reports/student/:studentId/pdf
exports.downloadStudentReportPDF = async (req, res) => {
  try {
    const { month, year } = req.query;
    const student = await User.findById(req.params.studentId, 'name rollNo class');
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });

    const filter = { student: student._id };
    if (month && year) {
      filter.createdAt = { $gte: new Date(year, month - 1, 1), $lt: new Date(year, month, 1) };
    }

    const results = await TestResult.find(filter)
      .populate('subject', 'name').populate('test', 'topic date').sort({ createdAt: -1 });
    const att = await Attendance.find({ student: student._id, ...(month && year ? { month: parseInt(month), year: parseInt(year) } : {}) });

    // Weak topics
    const topicMap = {};
    results.forEach(r => r.weakTopics?.forEach(t => { topicMap[t] = (topicMap[t] || 0) + 1; }));
    const weakTopics = Object.entries(topicMap).sort((a, b) => b[1] - a[1]).map(([topic, failCount]) => ({ topic, failCount }));

    const avgScore = results.length ? (results.reduce((a, b) => a + b.score, 0) / results.length).toFixed(1) : 0;
    const present = att.filter(a => a.status === 'present').length;

    const pdfBuffer = await generateStudentReport({
      student, results, weakTopics,
      avgScore,
      attendancePercentage: att.length ? ((present / att.length) * 100).toFixed(1) : '0.0',
      overallGrade: getGrade(parseFloat(avgScore)),
      period: month && year ? `${MONTHS[parseInt(month)-1]} ${year}` : 'All Time'
    });

    const filename = `Student_Report_${student.name.replace(/\s+/g, '_')}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(pdfBuffer);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
