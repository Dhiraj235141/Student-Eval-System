const mongoose = require('mongoose');

const announcementSchema = new mongoose.Schema({
  title: { type: String, required: true },
  body: { type: String, required: true },
  subject: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject' }, // null = all subjects
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  targetRole: { type: String, enum: ['student', 'faculty', 'all'], default: 'student' },
}, { timestamps: true });

module.exports = mongoose.model('Announcement', announcementSchema);
