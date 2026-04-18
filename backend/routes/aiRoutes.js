const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { generateTestQuestions, generateAssignmentQuestions, generateWeakTopicSuggestions, getStudyNotes } = require('../controllers/aiController');

router.use(protect);
router.post('/generate-questions', generateTestQuestions);
router.post('/generate-assignment', generateAssignmentQuestions);
router.post('/weak-topic-suggestions', generateWeakTopicSuggestions);
router.post('/study-notes', getStudyNotes);

module.exports = router;
