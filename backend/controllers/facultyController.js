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
// @route   POST /api/faculty/tests
exports.createTest = async (req, res) => {
  try {
    const { subjectId, topic, questions, durationMinutes } = req.body;
    const secretCode = generateCode(6);
    const minutes = durationMinutes || 10;
    const codeExpiresAt = new Date(Date.now() + minutes * 60 * 1000);

    const test = await Test.create({
      subject: subjectId,
      faculty: req.user.id,
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
          message: `A new test on "${topic}" for ${subject.name} is now live. Ask your faculty for the secret code.`,
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

// @desc    Get faculty's subjects
// @route   GET /api/faculty/subjects
exports.getSubjects = async (req, res) => {
  try {
    const { year } = req.query;
    const SystemConfig = require('../models/SystemConfig');
    const activeSemester = await SystemConfig.getActiveSemester();

    let filter = { 
      faculty: req.user.id,
      semesterType: activeSemester,
      isActive: true
    };
    
    if (year) filter.class = { $regex: year, $options: 'i' };
    const subjects = await Subject.find(filter);
    res.json({ success: true, subjects, activeSemester });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Get faculty's created tests
// @route   GET /api/faculty/tests
exports.getTests = async (req, res) => {
  try {
    const SystemConfig = require('../models/SystemConfig');
    const activeSemester = await SystemConfig.getActiveSemester();

    const facultySubjects = await Subject.find({ 
      faculty: req.user.id,
      semesterType: activeSemester 
    }, '_id');
    const subjectIds = facultySubjects.map(s => s._id);

    const tests = await Test.find({ 
      faculty: req.user.id,
      subject: { $in: subjectIds }
    })
      .populate('subject', 'name code')
      .sort({ createdAt: -1 });
    res.json({ success: true, tests, activeSemester });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Update/edit a test (topic, questions, duration — resets timer from NOW)
// @route   PUT /api/faculty/tests/:id
exports.updateTest = async (req, res) => {
  try {
    const { topic, questions, durationMinutes } = req.body;
    const test = await Test.findOne({ _id: req.params.id, faculty: req.user.id });
    if (!test) return res.status(404).json({ success: false, message: 'Test not found' });
    if (topic) test.topic = topic;
    if (questions) test.questions = questions;
    if (durationMinutes && parseInt(durationMinutes) > 0) {
      // Reset timer from NOW — allows restarting an expired test
      test.codeExpiresAt = new Date(Date.now() + parseInt(durationMinutes) * 60 * 1000);
      test.isActive = true;
    }
    await test.save();

    // Notify students that the test has been updated/available
    const subject = await Subject.findById(test.subject);
    if (subject) {
      const students = await User.find({
        role: 'student', isActive: true,
        $or: [
          { enrolledSubjects: subject._id },
          { year: subject.class }
        ]
      }, '_id');
      if (students.length > 0) {
        const notifications = students.map(s => ({
          recipient: s._id,
          sender: req.user.id,
          title: `📝 Test Updated: ${test.topic}`,
          message: `The test for ${subject.name} has been updated. New duration: ${durationMinutes || 10} mins. Ask faculty for the code.`,
          type: 'new_test'
        }));
        await Notification.insertMany(notifications);
      }
    }

    res.json({ success: true, test });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Delete a test
// @route   DELETE /api/faculty/tests/:id
exports.deleteTest = async (req, res) => {
  try {
    const test = await Test.findOneAndDelete({ _id: req.params.id, faculty: req.user.id });
    if (!test) return res.status(404).json({ success: false, message: 'Test not found' });
    res.json({ success: true, message: 'Test deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Upload/update syllabus text for subject
// @route   PUT /api/faculty/subjects/:id/syllabus
exports.updateSyllabus = async (req, res) => {
  try {
    const { syllabus } = req.body;
    const subject = await Subject.findOneAndUpdate(
      { _id: req.params.id, faculty: req.user.id },
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
// @route   POST /api/faculty/subjects/:id/syllabus-pdf
exports.uploadSyllabusPDF = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No PDF uploaded' });
    const subject = await Subject.findOneAndUpdate(
      { _id: req.params.id, faculty: req.user.id },
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
// @route   POST /api/faculty/attendance/generate-code
exports.generateAttendanceCode = async (req, res) => {
  try {
    const { subjectId, type, durationMinutes } = req.body;
    if (!subjectId || !type) return res.status(400).json({ success: false, message: 'Subject and type are required' });

    // Verify faculty owns this subject
    const subject = await Subject.findOne({ _id: subjectId, faculty: req.user.id });
    if (!subject) return res.status(403).json({ success: false, message: 'Subject not assigned to you' });

    const minutes = durationMinutes || 15;
    const code = generateCode(6);
    const expiresAt = new Date(Date.now() + minutes * 60 * 1000);

    // Deactivate old codes for this subject+type
    await AttendanceCode.updateMany({ subject: subjectId, type, isActive: true }, { isActive: false });

    const attCode = await AttendanceCode.create({
      code, subject: subjectId, faculty: req.user.id,
      type, expiresAt, isActive: true
    });

    res.json({ success: true, code, expiresAt, type, subjectId, durationMinutes: minutes });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Get all test results for faculty's subjects
// @route   GET /api/faculty/results
exports.getResults = async (req, res) => {
  try {
    const { subjectId } = req.query;
    const facultySubjects = await Subject.find({ faculty: req.user.id }, '_id');
    const subjectIds = facultySubjects.map(s => s._id);
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
// @route   GET /api/faculty/attendance
exports.getAttendance = async (req, res) => {
  try {
    const { subjectId, month, year, type, date } = req.query;
    if (!subjectId) return res.status(400).json({ success: false, message: 'subjectId required' });

    const subject = await Subject.findById(subjectId);
    if (!subject) return res.status(404).json({ success: false, message: 'Subject not found' });

    // Discovery: Find all students who should be in this subject
    const students = await User.find({
      role: 'student',
      isActive: true,
      $or: [
        { enrolledSubjects: subjectId },
        { year: subject.class },
        { class: subject.class }
      ]
    }, 'name rollNo class branch').sort({ rollNo: 1 });

    const filter = { subject: subjectId };
    if (month) filter.month = parseInt(month);
    if (year) filter.year = parseInt(year);
    if (type && type !== 'all') filter.type = type;

    // Daily View logic
    let dailyRecords = [];
    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      
      const dayFilter = { 
        subject: subjectId, 
        date: { $gte: startOfDay, $lte: endOfDay } 
      };
      if (type && type !== 'all') dayFilter.type = type;

      const dayAttendance = await Attendance.find(dayFilter);
      
      // Map existing attendance onto the full student list
      dailyRecords = students.map(student => {
        const record = dayAttendance.find(a => a.student.toString() === student._id.toString());
        return {
          student,
          status: record ? record.status : 'absent', // Default to absent if no record
          markedVia: record ? record.markedVia : null,
          type: record ? record.type : (type !== 'all' ? type : 'theory')
        };
      });
    }

    // Monthly summary logic
    const attendance = await Attendance.find(filter);
    // Calculate total sessions held for this class in the filtered period
    const sessions = new Set();
    attendance.forEach(a => {
      const dateStr = new Date(a.date).toISOString().split('T')[0];
      sessions.add(`${dateStr}|${a.type || 'theory'}`);
    });
    const totalSessions = sessions.size;

    const studentMap = {};
    
    // Initialize map with all discovered students
    students.forEach(student => {
      studentMap[student._id.toString()] = { student, total: totalSessions, present: 0 };
    });

    attendance.forEach(a => {
      const sid = a.student.toString();
      if (studentMap[sid]) {
        // Only count as present if they were present in a unique session
        if (a.status === 'present') {
          if (!studentMap[sid].presentSessions) studentMap[sid].presentSessions = new Set();
          const dateStr = new Date(a.date).toISOString().split('T')[0];
          studentMap[sid].presentSessions.add(`${dateStr}|${a.type || 'theory'}`);
          studentMap[sid].present = studentMap[sid].presentSessions.size;
        }
      }
    });

    const summary = Object.values(studentMap).map(s => ({
      ...s,
      percentage: s.total ? ((s.present / s.total) * 100).toFixed(1) : 0
    }));

    res.json({ success: true, summary, dailyRecords, type, date });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Manually mark a student attendance
// @route   PUT /api/faculty/attendance/mark
exports.markAttendanceManual = async (req, res) => {
  try {
    const { studentId, subjectId, status, type, date } = req.body;

    const subject = await Subject.findOne({ _id: subjectId, faculty: req.user.id });
    if (!subject) return res.status(403).json({ success: false, message: 'Not authorized' });

    const targetDate = date ? new Date(date) : new Date();
    const m = targetDate.getMonth() + 1;
    const y = targetDate.getFullYear();
    const t = type || 'theory';

    // Find existing record for this specific day/type
    const startOfDay = new Date(targetDate); startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate); endOfDay.setHours(23, 59, 59, 999);

    let record = await Attendance.findOne({ 
      student: studentId, 
      subject: subjectId, 
      type: t,
      date: { $gte: startOfDay, $lte: endOfDay }
    });

    if (record) {
      if (record.isLocked) return res.status(400).json({ success: false, message: 'Attendance is locked' });
      record.status = status;
      record.markedVia = 'manual';
      await record.save();
    } else {
      record = await Attendance.create({
        student: studentId, subject: subjectId,
        date: targetDate,
        month: m, year: y, type: t,
        status, markedVia: 'manual'
      });
    }

    // Notify student about attendance update
    await Notification.create({
      recipient: studentId,
      sender: req.user.id,
      title: 'Attendance Update',
      message: `Your ${t} attendance for ${subject.name} on ${targetDate.toLocaleDateString()} has been marked as ${status}.`,
      type: 'attendance'
    });

    res.json({ success: true, record });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Create assignment
// @route   POST /api/faculty/assignments
exports.createAssignment = async (req, res) => {
  try {
    const { title, description, subjectId, questions, deadline, maxMarks } = req.body;
    const subject = await Subject.findOne({ _id: subjectId, faculty: req.user.id });
    if (!subject) return res.status(403).json({ success: false, message: 'Subject not assigned to you' });

    const assignment = await Assignment.create({
      title, description,
      subject: subjectId,
      faculty: req.user.id,
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
// @route   PUT /api/faculty/assignments/:id/publish
exports.publishAssignment = async (req, res) => {
  try {
    const assignment = await Assignment.findOneAndUpdate(
      { _id: req.params.id, faculty: req.user.id },
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
// @route   PUT /api/faculty/assignments/:id
exports.updateAssignment = async (req, res) => {
  try {
    const assignment = await Assignment.findOne({ _id: req.params.id, faculty: req.user.id });
    if (!assignment) return res.status(404).json({ success: false, message: 'Assignment not found' });

    if (assignment.isPublished) {
      // For published assignments, only allow extending the deadline and updating maxMarks
      if (req.body.deadline) assignment.deadline = new Date(req.body.deadline);
      if (req.body.maxMarks) assignment.maxMarks = req.body.maxMarks;
    } else {
      // Full edit allowed for drafts
      if (req.body.title) assignment.title = req.body.title;
      if (req.body.description !== undefined) assignment.description = req.body.description;
      if (req.body.subjectId) assignment.subject = req.body.subjectId;
      if (req.body.questions) assignment.questions = req.body.questions;
      if (req.body.deadline) assignment.deadline = new Date(req.body.deadline);
      if (req.body.maxMarks) assignment.maxMarks = req.body.maxMarks;
    }
    await assignment.save();

    // If published and deadline was extended, notify students
    if (assignment.isPublished && req.body.deadline) {
      const subject = await Subject.findById(assignment.subject);
      if (subject) {
        const students = await User.find({
          role: 'student', isActive: true,
          $or: [
            { enrolledSubjects: subject._id },
            { year: subject.class }
          ]
        }, '_id');
        if (students.length > 0) {
          const notifications = students.map(s => ({
            recipient: s._id,
            sender: req.user.id,
            title: '⏰ Assignment Deadline Extended',
            message: `The deadline for "${assignment.title}" (${subject.name}) has been extended to ${new Date(assignment.deadline).toLocaleDateString()}.`,
            type: 'new_assignment'
          }));
          await Notification.insertMany(notifications);
        }
      }
    }

    res.json({ success: true, assignment });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Get assignment submissions
// @route   GET /api/faculty/assignments/:id/submissions
exports.getSubmissions = async (req, res) => {
  try {
    const assignment = await Assignment.findOne({ _id: req.params.id, faculty: req.user.id })
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
    }, 'name rollNo branch');

    const submissionStatus = enrolledStudents.map(student => {
      const sub = assignment.submissions.find(s => s.student._id?.toString() === student._id.toString());
      return {
        student: { id: student._id, name: student.name, rollNo: student.rollNo, branch: student.branch },
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
// @route   PUT /api/faculty/assignments/:id/submissions/:studentId/grade
exports.gradeSubmission = async (req, res) => {
  try {
    const { score } = req.body;
    const assignment = await Assignment.findOne({ _id: req.params.id, faculty: req.user.id });
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

// @desc    Delete an assignment (draft or published)
// @route   DELETE /api/faculty/assignments/:id
exports.deleteAssignment = async (req, res) => {
  try {
    const assignment = await Assignment.findOneAndDelete({ _id: req.params.id, faculty: req.user.id });
    if (!assignment) return res.status(404).json({ success: false, message: 'Assignment not found or not authorized' });
    res.json({ success: true, message: 'Assignment deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};


// @route   GET /api/faculty/assignments
exports.getAssignments = async (req, res) => {
  try {
    const SystemConfig = require('../models/SystemConfig');
    const activeSemester = await SystemConfig.getActiveSemester();

    const facultySubjects = await Subject.find({ 
      faculty: req.user.id,
      semesterType: activeSemester 
    }, '_id');
    
    const subjectIds = facultySubjects.map(s => s._id);
    const { subjectId } = req.query;
    const filter = subjectId ? { subject: subjectId, faculty: req.user.id } : { subject: { $in: subjectIds } };
    const assignments = await Assignment.find(filter)
      .populate('subject', 'name code')
      .sort({ createdAt: -1 });
    res.json({ success: true, assignments, activeSemester });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Create announcement
// @route   POST /api/faculty/announcements
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

    // Send notification to students (match by subject enrollment OR class/year)
    let students = [];
    if (subjectId) {
      const subject = await Subject.findById(subjectId);
      if (subject) {
        students = await User.find({
          role: 'student', isActive: true,
          $or: [
            { enrolledSubjects: subjectId },
            { year: subject.class }
          ]
        }, '_id');
      }
    } else {
      // No specific subject selected - broadcast to all active students
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

// @desc    Get faculty's announcements
// @route   GET /api/faculty/announcements
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
// @route   GET /api/faculty/monthly-report
exports.getMonthlyReport = async (req, res) => {
  try {
    const { subjectId, month, year } = req.query;
    // Security: Ensure subject belongs to faculty
    const subject = await Subject.findOne({ _id: subjectId, faculty: req.user.id });
    if (!subject) return res.status(404).json({ success: false, message: 'Subject not found or unauthorized' });

    // Find all students for this subject
    const students = await User.find({
      role: 'student',
      isActive: true,
      $or: [
        { enrolledSubjects: subjectId },
        { year: subject.class },
        { class: subject.class }
      ]
    }, 'name rollNo class branch').sort({ rollNo: 1 });

    const m = parseInt(month);
    const y = parseInt(year);
    const startDate = new Date(y, m - 1, 1);
    const endDate = new Date(y, m, 1);

    const TestResult = require('../models/TestResult');
    const Attendance = require('../models/Attendance');

    // Calculate total class sessions held this month for this subject
    // We group by date (normalized to day) and type to find unique sessions
    const allAttendance = await Attendance.find({ 
      subject: subjectId, 
      month: m, 
      year: y 
    });

    // Extract unique sessions: Set of "YYYY-MM-DD|type"
    const sessions = new Set();
    allAttendance.forEach(a => {
      const dateStr = new Date(a.date).toISOString().split('T')[0];
      sessions.add(`${dateStr}|${a.type || 'theory'}`);
    });
    const totalSessions = sessions.size;

    const report = await Promise.all(students.map(async (student) => {
      const results = await TestResult.find({
        student: student._id,
        subject: subjectId,
        createdAt: { $gte: startDate, $lt: endDate }
      });

      const studentAttendance = allAttendance.filter(a => a.student.toString() === student._id.toString());
      
      // Count UNIQUE sessions where student was present
      const presentSessions = new Set();
      studentAttendance.forEach(a => {
        if (a.status === 'present') {
          const dateStr = new Date(a.date).toISOString().split('T')[0];
          presentSessions.add(`${dateStr}|${a.type || 'theory'}`);
        }
      });
      const presentCount = presentSessions.size;

      const avgScore = results.length ? (results.reduce((s, r) => s + r.score, 0) / results.length).toFixed(1) : 0;

      return {
        student: { name: student.name, rollNo: student.rollNo, class: student.class },
        testsGiven: results.length,
        averageScore: avgScore,
        // Attendance is (unique sessions present / total sessions held for class)
        attendancePercentage: totalSessions ? ((presentCount / totalSessions) * 100).toFixed(1) : 0,
        grade: getGrade(parseFloat(avgScore))
      };
    }));

    res.json({ success: true, report, month, year, subject: subjectId, totalSessions });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
// @desc    Update faculty's announcement
// @route   PUT /api/faculty/announcements/:id
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

// @desc    Delete faculty's announcement
// @route   DELETE /api/faculty/announcements/:id
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
