const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  question: { type: String, required: true },
  options: [{ type: String, required: true }], // 4 options A,B,C,D
  correctAnswer: { type: Number, required: true }, // index 0-3
  difficulty: { type: String, enum: ['easy', 'medium', 'hard'], required: true },
  topic: { type: String }
});

const testSchema = new mongoose.Schema({
  subject: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
  faculty: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  topic: { type: String, required: true },
  questions: [questionSchema], // 4 easy, 4 medium, 2 hard
  secretCode: { type: String, required: true },
  codeExpiresAt: { type: Date, required: true },
  isActive: { type: Boolean, default: true },
  date: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('Test', testSchema);
