const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { submitFeedback, getFeedbacks, replyToFeedback } = require('../controllers/feedbackController');

// All feedback routes require authentication
router.use(protect);

// Student and Faculty submit feedback
router.post('/', authorize('student', 'faculty'), submitFeedback);

// Admin view and reply
router.get('/', authorize('admin'), getFeedbacks);
router.post('/:id/reply', authorize('admin'), replyToFeedback);

module.exports = router;
