const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { downloadAttendancePDF, downloadMonthlyReportPDF, downloadStudentReportPDF } = require('../controllers/reportController');

router.use(protect);
router.get('/attendance/pdf', authorize('teacher', 'admin'), downloadAttendancePDF);
router.get('/monthly/pdf', authorize('teacher', 'admin'), downloadMonthlyReportPDF);
router.get('/student/:studentId/pdf', authorize('teacher', 'admin'), downloadStudentReportPDF);

module.exports = router;
