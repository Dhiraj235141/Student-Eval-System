const mongoose = require('mongoose');

const attendanceCodeSchema = new mongoose.Schema({
  code: { type: String, required: true, uppercase: true },
  subject: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
  faculty: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['theory', 'practical'], default: 'theory' },
  expiresAt: { type: Date, required: true },
  usedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // students who already used this code
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

// Auto-index for cleanup
attendanceCodeSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('AttendanceCode', attendanceCodeSchema);
