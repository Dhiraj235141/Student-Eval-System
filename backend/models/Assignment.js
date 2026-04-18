const mongoose = require('mongoose');

const assignmentSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  subject: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
  teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  questions: [{
    question: { type: String },
    type: { type: String, enum: ['mcq', 'short', 'long'], default: 'mcq' },
    options: [{ type: String }],
    correctAnswer: { type: Number }
  }],
  deadline: { type: Date, required: true },
  maxMarks: { type: Number, default: 10 },
  isPublished: { type: Boolean, default: false },
  submissions: [{
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    answers: [{ type: String }],
    pdfPath: { type: String }, // filename of uploaded PDF
    submittedAt: { type: Date },
    isLate: { type: Boolean, default: false },
    aiScore: { type: Number }, // AI-given score
    score: { type: Number }   // final score (faculty override or AI)
  }]
}, { timestamps: true });

module.exports = mongoose.model('Assignment', assignmentSchema);
