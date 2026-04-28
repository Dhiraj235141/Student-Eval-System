const mongoose = require('mongoose');

const subjectSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  code: { type: String, required: true, unique: true },
  class: { type: String, required: true },
  branch: { type: [String], default: ['All'] }, // Array for multi-branch subjects
  faculty: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  syllabus: { type: mongoose.Schema.Types.Mixed, default: '' },
  syllabusFile: { type: String },
  isActive: { type: Boolean, default: true },
  semesterType: { type: String, enum: ['ODD', 'EVEN'], default: 'ODD' }
}, { timestamps: true });

module.exports = mongoose.model('Subject', subjectSchema);

