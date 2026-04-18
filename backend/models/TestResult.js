const mongoose = require('mongoose');

const testResultSchema = new mongoose.Schema({
  test: { type: mongoose.Schema.Types.ObjectId, ref: 'Test', required: true },
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  subject: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
  answers: [{ type: Number }], // student's selected option index per question
  score: { type: Number, required: true }, // out of 10
  totalQuestions: { type: Number, default: 10 },
  easyScore: { type: Number }, // out of 4
  mediumScore: { type: Number }, // out of 4
  hardScore: { type: Number }, // out of 2
  weakTopics: [{ type: String }],
  tabSwitchCount: { type: Number, default: 0 },
  autoSubmitted: { type: Boolean, default: false },
  submittedAt: { type: Date, default: Date.now },
  grade: { type: String } // Excellent, Good, Average, Below Average, Poor
}, { timestamps: true });

module.exports = mongoose.model('TestResult', testResultSchema);
