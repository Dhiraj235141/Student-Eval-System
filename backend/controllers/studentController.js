const Test = require('../models/Test');
const TestResult = require('../models/TestResult');
const Attendance = require('../models/Attendance');
const AttendanceCode = require('../models/AttendanceCode');
const Assignment = require('../models/Assignment');
const Notification = require('../models/Notification');
const User = require('../models/User');
const Subject = require('../models/Subject');
const SystemConfig = require('../models/SystemConfig');
const path = require('path');
const fs = require('fs');

// @desc    Get subjects for student (year-based, filtered by active semester)
// @route   GET /api/student/subjects
exports.getSubjects = async (req, res) => {
  try {
    const student = await User.findById(req.user.id);
    const activeSemester = await SystemConfig.getActiveSemester();

    const subjects = await Subject.find({
      isActive: true,
      semesterType: activeSemester,
      $or: [
        { _id: { $in: student.enrolledSubjects || [] } },
        { 
          class: student.year,
          $or: [
            { branch: student.branch }, // Mongoose handles this correctly for arrays (membership check)
            { branch: 'All' },
            { branch: [] },
            { branch: { $exists: false } }
          ]
        }
      ]
    }, 'name code class branch semesterType');
    res.json({ success: true, subjects, activeSemester });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getGrade = (score) => {
  if (score >= 9) return 'Excellent';
  if (score >= 7) return 'Good';
  if (score >= 5) return 'Average';
  if (score >= 3) return 'Below Average';
  return 'Poor';
};

// @desc    Validate secret code and get test
// @route   POST /api/student/validate-code
exports.validateCode = async (req, res) => {
  try {
    const { secretCode, subjectId } = req.body;
    const test = await Test.findOne({
      secretCode: secretCode.toUpperCase(),
      subject: subjectId,
      isActive: true,
      codeExpiresAt: { $gt: new Date() }
    }).populate('subject', 'name code');

    if (!test) return res.status(400).json({ success: false, message: 'Invalid or expired code' });

    const existing = await TestResult.findOne({ test: test._id, student: req.user.id });
    if (existing) return res.status(400).json({ success: false, message: 'You have already submitted this test' });

    const questions = test.questions.map(q => ({
      id: q._id, question: q.question, options: q.options,
      difficulty: q.difficulty, topic: q.topic
    }));

    res.json({ success: true, test: { id: test._id, topic: test.topic, subject: test.subject, questions, codeExpiresAt: test.codeExpiresAt } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Submit test
// @route   POST /api/student/submit-test
exports.submitTest = async (req, res) => {
  try {
    const { testId, answers, tabSwitchCount, autoSubmitted } = req.body;
    const test = await Test.findById(testId);
    if (!test) return res.status(404).json({ success: false, message: 'Test not found' });

    const existing = await TestResult.findOne({ test: testId, student: req.user.id });
    if (existing) return res.status(400).json({ success: false, message: 'Already submitted' });

    let score = 0, easyScore = 0, mediumScore = 0, hardScore = 0;
    const weakTopics = new Set();

    test.questions.forEach((q, i) => {
      const isCorrect = answers[i] === q.correctAnswer;
      if (isCorrect) {
        score++;
        if (q.difficulty === 'easy') easyScore++;
        else if (q.difficulty === 'medium') mediumScore++;
        else hardScore++;
      } else {
        if (q.topic) {
          // Split topic for granular result display
          const subTopics = q.topic.split(/[,;\n]|\.(?=\s|$)/)
            .map(s => s.trim().replace(/^[\.\s]+|[\.\s]+$/g, ''))
            .filter(s => s.length > 3);
          
          subTopics.forEach(sub => weakTopics.add(sub));
        }
      }
    });

    const grade = getGrade(score);
    const result = await TestResult.create({
      test: testId, student: req.user.id, subject: test.subject,
      answers, score, easyScore, mediumScore, hardScore,
      weakTopics: [...weakTopics],
      tabSwitchCount: tabSwitchCount || 0,
      autoSubmitted: autoSubmitted || false,
      grade
    });

    // Mark attendance
    const now = new Date();
    await Attendance.create({
      student: req.user.id, subject: test.subject, test: testId,
      status: 'present', type: 'theory',
      month: now.getMonth() + 1, year: now.getFullYear(),
      markedVia: 'test'
    });

    res.json({ success: true, result: { score, grade, easyScore, mediumScore, hardScore, weakTopics: [...weakTopics] } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Mark attendance via secret code
// @route   POST /api/student/attendance/code
exports.markAttendanceByCode = async (req, res) => {
  try {
    const { subjectId, code, type } = req.body;
    if (!subjectId || !code) return res.status(400).json({ success: false, message: 'Subject and code are required' });

    const attCode = await AttendanceCode.findOne({
      code: code.toUpperCase(),
      subject: subjectId,
      type: type || 'theory',
      isActive: true,
      expiresAt: { $gt: new Date() }
    });

    if (!attCode) return res.status(400).json({ success: false, message: 'Invalid or expired attendance code' });

    // Check if student already used this code
    if (attCode.usedBy.includes(req.user.id)) {
      return res.status(400).json({ success: false, message: 'You have already marked attendance with this code' });
    }

    const now = new Date();
    // Check if already marked today
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const existing = await Attendance.findOne({
      student: req.user.id, subject: subjectId,
      type: type || 'theory',
      date: { $gte: today }
    });

    if (existing) return res.status(400).json({ success: false, message: 'Attendance already marked for today' });

    await Attendance.create({
      student: req.user.id, subject: subjectId,
      status: 'present', type: type || 'theory',
      month: now.getMonth() + 1, year: now.getFullYear(),
      markedVia: 'code'
    });

    // Mark student as used
    attCode.usedBy.push(req.user.id);
    await attCode.save();

    res.json({ success: true, message: `${type === 'practical' ? 'Practical' : 'Theory'} attendance marked as Present!` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Get student's test history
// @route   GET /api/student/results
exports.getMyResults = async (req, res) => {
  try {
    const { subjectId } = req.query;
    const filter = { student: req.user.id };
    if (subjectId) filter.subject = subjectId;
    const results = await TestResult.find(filter)
      .populate('subject', 'name code')
      .populate('test', 'topic date')
      .sort({ createdAt: -1 });
    res.json({ success: true, results });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Get student's attendance
// @route   GET /api/student/attendance
exports.getMyAttendance = async (req, res) => {
  try {
    const { subjectId, month, year, type } = req.query;
    const filter = { student: req.user.id };
    if (subjectId) filter.subject = subjectId;
    if (month) filter.month = parseInt(month);
    if (year) filter.year = parseInt(year);
    if (type) filter.type = type;

    const attendance = await Attendance.find(filter).populate('subject', 'name code').sort({ date: -1 });
    
    // Calculate class-wide sessions to get an accurate denominator
    const allInSubject = await Attendance.find({ subject: subjectId, month: filter.month, year: filter.year });
    const sessionSet = new Set();
    allInSubject.forEach(a => {
      const dateStr = new Date(a.date).toISOString().split('T')[0];
      sessionSet.add(`${dateStr}|${a.type || 'theory'}`);
    });
    const totalSessions = sessionSet.size;
    
    // Count UNIQUE sessions where this specific student was present
    const presentSessions = new Set();
    attendance.forEach(a => {
      if (a.status === 'present') {
        const dateStr = new Date(a.date).toISOString().split('T')[0];
        presentSessions.add(`${dateStr}|${a.type || 'theory'}`);
      }
    });
    const presentCount = presentSessions.size;

    res.json({ 
      success: true, 
      attendance, 
      total: totalSessions, 
      present: presentCount, 
      percentage: totalSessions ? ((presentCount / totalSessions) * 100).toFixed(1) : 0 
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Get assignments for student
// @route   GET /api/student/assignments
exports.getAssignments = async (req, res) => {
  try {
    const student = await User.findById(req.user.id);
    const SystemConfig = require('../models/SystemConfig');
    const activeSemester = await SystemConfig.getActiveSemester();

    const matchingSubjects = await Subject.find({
      $or: [
        { _id: { $in: student.enrolledSubjects || [] } },
        { 
          class: student.year,
          $or: [
            { branch: student.branch },
            { branch: 'All' },
            { branch: [] },
            { branch: { $exists: false } }
          ]
        }
      ],
      semesterType: activeSemester,
      isActive: true
    }, '_id');
    const subjectIds = matchingSubjects.map(s => s._id);

    const assignments = await Assignment.find({
      subject: { $in: subjectIds },
      isPublished: true
    }).populate('subject', 'name code').sort({ deadline: 1 });

    const now = new Date();
    const assignmentsWithStatus = assignments.map(a => {
      const submission = a.submissions.find(s => s.student.toString() === req.user.id);
      return {
        id: a._id,
        title: a.title,
        description: a.description,
        subject: a.subject,
        deadline: a.deadline,
        maxMarks: a.maxMarks,
        isOverdue: now > a.deadline,
        submitted: !!submission,
        isLate: submission?.isLate,
        submittedAt: submission?.submittedAt,
        score: submission?.score,
        aiScore: submission?.aiScore
      };
    });

    res.json({ success: true, assignments: assignmentsWithStatus });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Submit assignment PDF
// @route   POST /api/student/assignments/:id/submit-pdf
exports.submitAssignmentPDF = async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment || !assignment.isPublished) return res.status(404).json({ success: false, message: 'Assignment not found' });

    const alreadySubmitted = assignment.submissions.find(s => s.student.toString() === req.user.id);
    if (alreadySubmitted) return res.status(400).json({ success: false, message: 'Already submitted' });

    if (!req.file) return res.status(400).json({ success: false, message: 'No PDF file uploaded' });

    const now = new Date();
    const isLate = now > assignment.deadline;

    // Try AI grading — pass assignment questions & description for contextual grading
    let aiScore = null;
    try {
      const aiController = require('./aiController');
      if (aiController.gradeAssignmentPDF) {
        aiScore = await aiController.gradeAssignmentPDF(
          req.file.path,
          assignment.maxMarks || 10,
          assignment.questions || [],
          assignment.description || ''
        );
      }
    } catch (aiErr) {
      console.error('AI grading failed:', aiErr.message);
    }

    assignment.submissions.push({
      student: req.user.id,
      submittedAt: now,
      isLate,
      pdfPath: req.file.filename,
      aiScore,
      score: aiScore // initial score = AI score, faculty can override
    });
    await assignment.save();

    // Notify faculty
    await Notification.create({
      recipient: assignment.faculty,
      sender: req.user.id,
      title: '📄 New Assignment Submission',
      message: `A student submitted assignment "${assignment.title}"${aiScore !== null ? `. AI Score: ${aiScore}/${assignment.maxMarks}` : ''}`,
      type: 'new_assignment'
    });

    res.json({ success: true, message: isLate ? 'Submitted (late)' : 'Submitted successfully!', isLate, aiScore });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Submit assignment (old text-based for backward compat)
// @route   POST /api/student/assignments/:id/submit
exports.submitAssignment = async (req, res) => {
  try {
    const { answers } = req.body;
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment || !assignment.isPublished) return res.status(404).json({ success: false, message: 'Assignment not found' });

    const alreadySubmitted = assignment.submissions.find(s => s.student.toString() === req.user.id);
    if (alreadySubmitted) return res.status(400).json({ success: false, message: 'Already submitted' });

    const now = new Date();
    const isLate = now > assignment.deadline;
    assignment.submissions.push({ student: req.user.id, answers, submittedAt: now, isLate });
    await assignment.save();

    res.json({ success: true, message: isLate ? 'Submitted (late)' : 'Submitted successfully!', isLate });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Get student's weak topics
// @route   GET /api/student/weak-topics
exports.getWeakTopics = async (req, res) => {
  try {
    const results = await TestResult.find({ student: req.user.id }).populate('subject', 'name');
    const topicMap = {}; // topicKey -> { topic, subjectName, subjectId, count }

    results.forEach(r => {
      r.weakTopics.forEach(topic => {
        const subjectId = r.subject?._id?.toString() || 'unknown';
        const subjectName = r.subject?.name || 'Unknown Subject';
        
        // Split composite topic strings into granular sub-topics
        // Handles: "Topic A, Topic B", "Topic A; Topic B", "Topic A. Topic B"
        const subTopics = topic
          .split(/[,;\n]|\.(?=\s|$)/) 
          .map(s => s.trim().replace(/^[\.\s]+|[\.\s]+$/g, '')) // Trim and remove leading/trailing dots
          .filter(s => s.length > 3); // Ignore very short or empty strings

        subTopics.forEach(sub => {
          const key = `${subjectId}-${sub.toLowerCase()}`; // Case-insensitive matching
          if (!topicMap[key]) {
            topicMap[key] = { 
              topic: sub, 
              subjectName, 
              subjectId, 
              failCount: 0 
            };
          }
          topicMap[key].failCount++;
        });
      });
    });

    const weakTopics = Object.values(topicMap)
      .sort((a, b) => b.failCount - a.failCount);

    res.json({ success: true, weakTopics });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Get monthly progress
// @route   GET /api/student/monthly-progress
exports.getMonthlyProgress = async (req, res) => {
  try {
    const results = await TestResult.find({ student: req.user.id })
      .populate('subject', 'name')
      .sort({ createdAt: 1 });

    const monthlyMap = {};
    results.forEach(r => {
      const date = new Date(r.createdAt);
      const key = `${date.getFullYear()}-${date.getMonth() + 1}`;
      if (!monthlyMap[key]) monthlyMap[key] = { scores: [], month: date.getMonth() + 1, year: date.getFullYear() };
      monthlyMap[key].scores.push(r.score);
    });

    const progress = Object.values(monthlyMap).map(m => ({
      month: m.month, year: m.year,
      averageScore: (m.scores.reduce((a, b) => a + b, 0) / m.scores.length).toFixed(1),
      testsGiven: m.scores.length
    }));

    res.json({ success: true, progress });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
// @desc    Get announcements for student
// @route   GET /api/student/announcements
exports.getAnnouncements = async (req, res) => {
  try {
    const Announcement = require('../models/Announcement');
    const student = await User.findById(req.user.id);
    
    const announcements = await Announcement.find({
      $or: [
        { targetRole: 'student' },
        { targetRole: 'all' },
        { subject: { $in: student.enrolledSubjects || [] } }
      ]
    })
    .populate('createdBy', 'name role')
    .populate('subject', 'name code')
    .sort({ createdAt: -1 })
    .limit(10);

    res.json({ success: true, announcements });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
