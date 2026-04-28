const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { uploadPDF } = require('../middleware/uploadMiddleware');
const {
  validateCode, submitTest, getMyResults, getMyAttendance,
  getAssignments, submitAssignment, submitAssignmentPDF,
  getWeakTopics, getMonthlyProgress, markAttendanceByCode, getSubjects, getAnnouncements
} = require('../controllers/studentController');

router.use(protect, authorize('student'));

router.get('/subjects', getSubjects);
router.get('/announcements', getAnnouncements);

router.post('/validate-code', validateCode);
router.post('/submit-test', submitTest);
router.get('/results', getMyResults);
router.get('/attendance', getMyAttendance);
router.post('/attendance/code', markAttendanceByCode);
router.get('/assignments', getAssignments);
router.get('/assignments/:id', async (req, res) => {
  try {
    const Assignment = require('../models/Assignment');
    const assignment = await Assignment.findById(req.params.id).populate('subject', 'name code');
    if (!assignment || !assignment.isPublished) return res.status(404).json({ success: false, message: 'Assignment not found' });
    res.json({ success: true, assignment });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});
router.post('/assignments/:id/submit', submitAssignment);
router.post('/assignments/:id/submit-pdf', uploadPDF.single('pdf'), submitAssignmentPDF);
router.get('/weak-topics', getWeakTopics);
router.get('/monthly-progress', getMonthlyProgress);

module.exports = router;
