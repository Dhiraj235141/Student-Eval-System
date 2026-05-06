const express = require('express');
const router = express.Router();
const { protect, authorize, optionalProtect } = require('../middleware/auth');
const { submitFeedback, getFeedbacks, replyToFeedback } = require('../controllers/feedbackController');

// Public route: Anyone can submit feedback, but optionalProtect identifies logged-in users
router.post('/', optionalProtect, submitFeedback);

// Protected routes: Admin only
router.get('/', protect, authorize('admin'), getFeedbacks);
router.post('/:id/reply', protect, authorize('admin'), replyToFeedback);

module.exports = router;
