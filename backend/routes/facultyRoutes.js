const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { uploadPDF, uploadSyllabus } = require('../middleware/uploadMiddleware');
const {
  createTest, getSubjects, updateSyllabus, uploadSyllabusPDF, getResults,
  getAttendance, generateAttendanceCode, markAttendanceManual,
  createAssignment, publishAssignment, updateAssignment, deleteAssignment,
  getSubmissions, gradeSubmission, getAssignments,
  createAnnouncement, getAnnouncements, updateAnnouncement, deleteAnnouncement, getMonthlyReport,
  getTests, updateTest, deleteTest
} = require('../controllers/facultyController');

router.use(protect, authorize('faculty'));

router.get('/subjects', getSubjects);
router.put('/subjects/:id/syllabus', updateSyllabus);
router.post('/subjects/:id/syllabus-pdf', uploadSyllabus.single('syllabuspdf'), uploadSyllabusPDF);
router.get('/tests', getTests);
router.post('/tests', createTest);
router.put('/tests/:id', updateTest);
router.delete('/tests/:id', deleteTest);
router.get('/results', getResults);
router.get('/attendance', getAttendance);
router.post('/attendance/generate-code', generateAttendanceCode);
router.put('/attendance/mark', markAttendanceManual);
router.get('/monthly-report', getMonthlyReport);
router.get('/assignments', getAssignments);
router.post('/assignments', createAssignment);
router.put('/assignments/:id', updateAssignment);
router.delete('/assignments/:id', deleteAssignment);
router.put('/assignments/:id/publish', publishAssignment);
router.get('/assignments/:id/submissions', getSubmissions);
router.put('/assignments/:id/submissions/:studentId/grade', gradeSubmission);
router.get('/announcements', getAnnouncements);
router.post('/announcements', createAnnouncement);
router.put('/announcements/:id', updateAnnouncement);
router.delete('/announcements/:id', deleteAnnouncement);

module.exports = router;
