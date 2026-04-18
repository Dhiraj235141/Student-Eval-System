const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  subject: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
  test: { type: mongoose.Schema.Types.ObjectId, ref: 'Test' }, // optional - not required for code-based
  date: { type: Date, default: Date.now },
  status: { type: String, enum: ['present', 'absent'], default: 'present' },
  type: { type: String, enum: ['theory', 'practical'], default: 'theory' },
  month: { type: Number }, // 1-12
  year: { type: Number },
  isLocked: { type: Boolean, default: false },
  markedVia: { type: String, enum: ['test', 'code', 'manual'], default: 'test' }
}, { timestamps: true });

module.exports = mongoose.model('Attendance', attendanceSchema);
