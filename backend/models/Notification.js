const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  type: {
    type: String,
    enum: ['new_assignment', 'assignment_deadline', 'test_result', 'new_test', 'late_submission', 'general', 'announcement', 'attendance', 'test', 'assignment'],
    required: true
  },
  title: { type: String, required: true },
  message: { type: String, required: true },
  link: { type: String }, // frontend route to navigate on click
  isRead: { type: Boolean, default: false },
  metadata: { type: mongoose.Schema.Types.Mixed } // extra data like assignmentId, testId etc
}, { timestamps: true });

module.exports = mongoose.model('Notification', notificationSchema);
