const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { submitFeedback, getFeedbacks, replyToFeedback } = require('../controllers/feedbackController');

// Public route: Anyone can submit feedback
router.post('/', submitFeedback);

// Protected routes: Admin only
router.get('/', protect, authorize('admin'), getFeedbacks);
router.post('/:id/reply', protect, authorize('admin'), replyToFeedback);

module.exports = router;
