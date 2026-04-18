const Test = require('../models/Test');
const TestResult = require('../models/TestResult');
const Attendance = require('../models/Attendance');
const AttendanceCode = require('../models/AttendanceCode');
const Subject = require('../models/Subject');
const Assignment = require('../models/Assignment');
const Notification = require('../models/Notification');
const User = require('../models/User');
const crypto = require('crypto');

// Generate random code
const generateCode = (len = 6) => Math.random().toString(36).substring(2, 2 + len).toUpperCase();

// Calculate grade from score
const getGrade = (score) => {
  if (score >= 9) return 'Excellent';
  if (score >= 7) return 'Good';
  if (score >= 5) return 'Average';
  if (score >= 3) return 'Below Average';
  return 'Poor';
};

// @desc    Create test with AI-generated questions
// @route   POST /api/teacher/tests
exports.createTest = async (req, res) => {
  try {
    const { subjectId, topic, questions, durationMinutes } = req.body;
    const secretCode = generateCode(6);
    const minutes = durationMinutes || 10;
    const codeExpiresAt = new Date(Date.now() + minutes * 60 * 1000);

    const test = await Test.create({
      subject: subjectId,
      teacher: req.user.id,
      topic,
      questions,
      secretCode,
      codeExpiresAt
    });

    // Notify all students whose year matches subject's class
    const subject = await Subject.findById(subjectId);
    if (subject) {
      const enrolledStudents = await User.find({
        role: 'student', isActive: true,
        $or: [
          { enrolledSubjects: subjectId },
          { year: subject.class }
        ]
      }, '_id');
      if (enrolledStudents.length > 0) {
        const notifications = enrolledStudents.map(student => ({
          recipient: student._id,
          sender: req.user.id,
          title: '🧪 New Test Available',
          message: `A new test on "${topic}" for ${subject.name} is now live. Ask your teacher for the secret code.`,
          type: 'new_test'
        }));
        await Notification.insertMany(notifications);
      }
    }

    res.status(201).json({ success: true, test: { id: test._id, secretCode, codeExpiresAt, topic, durationMinutes: minutes } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Get teacher's subjects
// @route   GET /api/teacher/subjects
exports.getSubjects = async (req, res) => {
  try {
    const { year } = req.query;
    let filter = { teacher: req.user.id };
    if (year) filter.class = { $regex: year, $options: 'i' };
    const subjects = await Subject.find(filter);
    res.json({ success: true, subjects });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Get teacher's created tests
// @route   GET /api/teacher/tests
exports.getTests = async (req, res) => {
  try {
    const tests = await Test.find({ teacher: req.user.id })
      .populate('subject', 'name code')
      .sort({ createdAt: -1 });
    res.json({ success: true, tests });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Update/edit a test (topic, questions, duration — resets timer from NOW)
// @route   PUT /api/teacher/tests/:id
exports.updateTest = async (req, res) => {
  try {
    const { topic, questions, durationMinutes } = req.body;
    const test = await Test.findOne({ _id: req.params.id, teacher: req.user.id });
    if (!test) return res.status(404).json({ success: false, message: 'Test not found' });
    if (topic) test.topic = topic;
    if (questions) test.questions = questions;
    if (durationMinutes && parseInt(durationMinutes) > 0) {
      // Reset timer from NOW — allows restarting an expired test
      test.codeExpiresAt = new Date(Date.now() + parseInt(durationMinutes) * 60 * 1000);
      test.isActive = true;
    }
    await test.save();
    res.json({ success: true, test });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Delete a test
// @route   DELETE /api/teacher/tests/:id
exports.deleteTest = async (req, res) => {
  try {
    const test = await Test.findOneAndDelete({ _id: req.params.id, teacher: req.user.id });
    if (!test) return res.status(404).json({ success: false, message: 'Test not found' });
    res.json({ success: true, message: 'Test deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Upload/update syllabus text for subject
// @route   PUT /api/teacher/subjects/:id/syllabus
exports.updateSyllabus = async (req, res) => {
  try {
    const { syllabus } = req.body;
    const subject = await Subject.findOneAndUpdate(
      { _id: req.params.id, teacher: req.user.id },
      { syllabus },
      { new: true }
    );
    if (!subject) return res.status(404).json({ success: false, message: 'Subject not found' });
    res.json({ success: true, subject });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Upload syllabus PDF for subject
// @route   POST /api/teacher/subjects/:id/syllabus-pdf
exports.uploadSyllabusPDF = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No PDF uploaded' });
    const subject = await Subject.findOneAndUpdate(
      { _id: req.params.id, teacher: req.user.id },
      { syllabusFile: req.file.filename },
      { new: true }
    );
    if (!subject) return res.status(404).json({ success: false, message: 'Subject not found' });
    res.json({ success: true, subject, filename: req.file.filename });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Generate attendance code
// @route   POST /api/teacher/attendance/generate-code
exports.generateAttendanceCode = async (req, res) => {
  try {
    const { subjectId, type, durationMinutes } = req.body;
    if (!subjectId || !type) return res.status(400).json({ success: false, message: 'Subject and type are required' });

    // Verify teacher owns this subject
    const subject = await Subject.findOne({ _id: subjectId, teacher: req.user.id });
    if (!subject) return res.status(403).json({ success: false, message: 'Subject not assigned to you' });

    const minutes = durationMinutes || 15;
    const code = generateCode(6);
    const expiresAt = new Date(Date.now() + minutes * 60 * 1000);

    // Deactivate old codes for this subject+type
    await AttendanceCode.updateMany({ subject: subjectId, type, isActive: true }, { isActive: false });

    const attCode = await AttendanceCode.create({
      code, subject: subjectId, teacher: req.user.id,
      type, expiresAt, isActive: true
    });

    res.json({ success: true, code, expiresAt, type, subjectId, durationMinutes: minutes });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Get all test results for teacher's subjects
// @route   GET /api/teacher/results
exports.getResults = async (req, res) => {
  try {
    const { subjectId } = req.query;
    const teacherSubjects = await Subject.find({ teacher: req.user.id }, '_id');
    const subjectIds = teacherSubjects.map(s => s._id);
    const filter = subjectId ? { subject: subjectId } : { subject: { $in: subjectIds } };
    const results = await TestResult.find(filter)
      .populate('student', 'name rollNo class')
      .populate('subject', 'name code')
      .populate('test', 'topic date')
      .sort({ createdAt: -1 });
    res.json({ success: true, results });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Get attendance report
// @route   GET /api/teacher/attendance
exports.getAttendance = async (req, res) => {
  try {
    const { subjectId, month, year, type } = req.query;
    if (!subjectId) return res.status(400).json({ success: false, message: 'subjectId required' });
    const filter = { subject: subjectId };
    if (month) filter.month = parseInt(month);
    if (year) filter.year = parseInt(year);
    if (type) filter.type = type;

    const attendance = await Attendance.find(filter)
      .populate('student', 'name rollNo class')
      .sort({ date: -1 });

    // Calculate percentage per student
    const studentMap = {};
    attendance.forEach(a => {
      const sid = a.student._id.toString();
      if (!studentMap[sid]) {
        studentMap[sid] = { student: a.student, total: 0, present: 0 };
      }
      studentMap[sid].total++;
      if (a.status === 'present') studentMap[sid].present++;
    });

    const summary = Object.values(studentMap).map(s => ({
      ...s,
      percentage: ((s.present / s.total) * 100).toFixed(1)
    }));

    res.json({ success: true, attendance, summary });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Manually mark a student attendance
// @route   PUT /api/teacher/attendance/mark
exports.markAttendanceManual = async (req, res) => {
  try {
    const { studentId, subjectId, month, year, status, type } = req.body;

    // Check subject belongs to teacher
    const subject = await Subject.findOne({ _id: subjectId, teacher: req.user.id });
    if (!subject) return res.status(403).json({ success: false, message: 'Not authorized' });

    const now = new Date();
    const m = month || now.getMonth() + 1;
    const y = year || now.getFullYear();
    const t = type || 'theory';

    // Find existing or create
    let record = await Attendance.findOne({ student: studentId, subject: subjectId, month: m, year: y, type: t });
    if (record) {
      if (record.isLocked) return res.status(400).json({ success: false, message: 'Attendance is locked' });
      record.status = status;
      record.markedVia = 'manual';
      await record.save();
    } else {
      record = await Attendance.create({
        student: studentId, subject: subjectId,
        month: m, year: y, type: t,
        status, markedVia: 'manual'
      });
    }

    // Notify student if marked present
    if (status === 'absent') {
      await Notification.create({
        user: studentId,
        title: 'Attendance Update',
        message: `Your ${t} attendance for ${subject.name} on ${m}/${y} has been marked as Absent.`,
        type: 'attendance'
      });
    }

    res.json({ success: true, record });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Create assignment
// @route   POST /api/teacher/assignments
exports.createAssignment = async (req, res) => {
  try {
    const { title, description, subjectId, questions, deadline, maxMarks } = req.body;
    const subject = await Subject.findOne({ _id: subjectId, teacher: req.user.id });
    if (!subject) return res.status(403).json({ success: false, message: 'Subject not assigned to you' });

    const assignment = await Assignment.create({
      title, description,
      subject: subjectId,
      teacher: req.user.id,
      questions: questions || [],
      deadline: new Date(deadline),
      maxMarks: maxMarks || 10,
      isPublished: false
    });

    res.status(201).json({ success: true, assignment });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Publish assignment
// @route   PUT /api/teacher/assignments/:id/publish
exports.publishAssignment = async (req, res) => {
  try {
    const assignment = await Assignment.findOneAndUpdate(
      { _id: req.params.id, teacher: req.user.id },
      { isPublished: true },
      { new: true }
    ).populate('subject', 'name class');
    if (!assignment) return res.status(404).json({ success: false, message: 'Assignment not found' });

    // Notify students whose year matches subject class OR who are enrolled
    const students = await User.find({
      role: 'student', isActive: true,
      $or: [
        { enrolledSubjects: assignment.subject._id },
        { year: assignment.subject.class }
      ]
    }, '_id');
    if (students.length > 0) {
      const notifications = students.map(s => ({
        recipient: s._id,
        sender: req.user.id,
        title: '📋 New Assignment Posted',
        message: `New assignment "${assignment.title}" for ${assignment.subject.name} is due by ${new Date(assignment.deadline).toLocaleDateString()}.`,
        type: 'new_assignment'
      }));
      await Notification.insertMany(notifications);
    }

    res.json({ success: true, message: 'Assignment published!', assignment });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Edit assignment
// @route   PUT /api/teacher/assignments/:id
exports.updateAssignment = async (req, res) => {
  try {
    const assignment = await Assignment.findOneAndUpdate(
      { _id: req.params.id, teacher: req.user.id, isPublished: false },
      req.body,
      { new: true }
    );
    if (!assignment) return res.status(404).json({ success: false, message: 'Cannot edit published assignment' });
    res.json({ success: true, assignment });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Get assignment submissions
// @route   GET /api/teacher/assignments/:id/submissions
exports.getSubmissions = async (req, res) => {
  try {
    const assignment = await Assignment.findOne({ _id: req.params.id, teacher: req.user.id })
      .populate('submissions.student', 'name rollNo');
    if (!assignment) return res.status(404).json({ success: false, message: 'Assignment not found' });

    // Get subject class to find year-based students
    const subject = await Subject.findById(assignment.subject);
    const enrolledStudents = await User.find({
      role: 'student',
      $or: [
        { enrolledSubjects: assignment.subject },
        { year: subject?.class }
      ]
    }, 'name rollNo');

    const submissionStatus = enrolledStudents.map(student => {
      const sub = assignment.submissions.find(s => s.student._id?.toString() === student._id.toString());
      return {
        student: { id: student._id, name: student.name, rollNo: student.rollNo },
        status: sub ? (sub.isLate ? 'late' : 'submitted') : 'pending',
        submittedAt: sub?.submittedAt,
        score: sub?.score,
        aiScore: sub?.aiScore,
        pdfPath: sub?.pdfPath || null,
      };
    });

    res.json({ success: true, submissionStatus, assignment: { title: assignment.title, maxMarks: assignment.maxMarks } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Grade a student's submission (manual override)
// @route   PUT /api/teacher/assignments/:id/submissions/:studentId/grade
exports.gradeSubmission = async (req, res) => {
  try {
    const { score } = req.body;
    const assignment = await Assignment.findOne({ _id: req.params.id, teacher: req.user.id });
    if (!assignment) return res.status(404).json({ success: false, message: 'Not found' });

    const submissionIndex = assignment.submissions.findIndex(
      s => s.student.toString() === req.params.studentId
    );
    if (submissionIndex === -1) return res.status(404).json({ success: false, message: 'Submission not found' });

    assignment.submissions[submissionIndex].score = score;
    await assignment.save();

    // Notify student
    await Notification.create({
      recipient: req.params.studentId,
      sender: req.user.id,
      title: '✅ Assignment Graded',
      message: `Your assignment "${assignment.title}" has been graded: ${score}/${assignment.maxMarks}`,
      type: 'assignment'
    });

    res.json({ success: true, message: 'Score saved' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Get all assignments for teacher's subjects
// @route   GET /api/teacher/assignments
exports.getAssignments = async (req, res) => {
  try {
    const teacherSubjects = await Subject.find({ teacher: req.user.id }, '_id');
    const subjectIds = teacherSubjects.map(s => s._id);
    const { subjectId } = req.query;
    const filter = subjectId ? { subject: subjectId, teacher: req.user.id } : { subject: { $in: subjectIds } };
    const assignments = await Assignment.find(filter)
      .populate('subject', 'name code')
      .sort({ createdAt: -1 });
    res.json({ success: true, assignments });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Create announcement
// @route   POST /api/teacher/announcements
exports.createAnnouncement = async (req, res) => {
  try {
    const Announcement = require('../models/Announcement');
    const { title, body, subjectId } = req.body;
    const announcement = await Announcement.create({
      title, body,
      subject: subjectId || null,
      createdBy: req.user.id,
      targetRole: 'student'
    });

    // Send notification to enrolled students
    let students = [];
    if (subjectId) {
      students = await User.find({ enrolledSubjects: subjectId, role: 'student', isActive: true }, '_id');
    } else {
      // No specific subject selected - broadcast to all active students (similar to how admin broadcasts to all teachers)
      students = await User.find({ role: 'student', isActive: true }, '_id');
    }

    if (students.length > 0) {
      const notifications = students.map(s => ({
        recipient: s._id,
        sender: req.user.id,
        title: `📢 ${title}`,
        message: body,
        type: 'announcement'
      }));
      await Notification.insertMany(notifications);
    }

    const populated = await Announcement.findById(announcement._id).populate('subject', 'name');
    res.status(201).json({ success: true, announcement: populated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Get teacher's announcements
// @route   GET /api/teacher/announcements
exports.getAnnouncements = async (req, res) => {
  try {
    const Announcement = require('../models/Announcement');
    const announcements = await Announcement.find({ createdBy: req.user.id })
      .populate('subject', 'name code')
      .sort({ createdAt: -1 });
    res.json({ success: true, announcements });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Get monthly report
// @route   GET /api/teacher/monthly-report
exports.getMonthlyReport = async (req, res) => {
  try {
    const { subjectId, month, year } = req.query;
    const students = await User.find({ enrolledSubjects: subjectId, role: 'student' }, 'name rollNo class');

    const report = await Promise.all(students.map(async (student) => {
      const results = await TestResult.find({
        student: student._id,
        subject: subjectId,
        createdAt: {
          $gte: new Date(year, month - 1, 1),
          $lt: new Date(year, month, 1)
        }
      });

      const attendance = await Attendance.find({ student: student._id, subject: subjectId, month: parseInt(month), year: parseInt(year) });
      const present = attendance.filter(a => a.status === 'present').length;
      const avgScore = results.length ? (results.reduce((s, r) => s + r.score, 0) / results.length).toFixed(1) : 0;

      return {
        student: { name: student.name, rollNo: student.rollNo, class: student.class },
        testsGiven: results.length,
        averageScore: avgScore,
        attendancePercentage: attendance.length ? ((present / attendance.length) * 100).toFixed(1) : 0,
        grade: getGrade(parseFloat(avgScore))
      };
    }));

    res.json({ success: true, report, month, year, subject: subjectId });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
// @desc    Update teacher's announcement
// @route   PUT /api/teacher/announcements/:id
exports.updateAnnouncement = async (req, res) => {
  try {
    const Announcement = require('../models/Announcement');
    const announcement = await Announcement.findOneAndUpdate(
      { _id: req.params.id, createdBy: req.user.id },
      { title: req.body.title, body: req.body.body },
      { new: true }
    ).populate('subject', 'name code');
    if (!announcement) return res.status(404).json({ success: false, message: 'Announcement not found' });
    res.json({ success: true, announcement });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Delete teacher's announcement
// @route   DELETE /api/teacher/announcements/:id
exports.deleteAnnouncement = async (req, res) => {
  try {
    const Announcement = require('../models/Announcement');
    const announcement = await Announcement.findOneAndDelete({ _id: req.params.id, createdBy: req.user.id });
    if (!announcement) return res.status(404).json({ success: false, message: 'Announcement not found' });
    res.json({ success: true, message: 'Announcement deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
