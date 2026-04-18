const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true, minlength: 6 },
  role: { type: String, enum: ['admin', 'teacher', 'student'], required: true },
  rollNo: { type: String }, // for students
  year: { type: String },   // First Year, Second Year etc
  branch: { type: String }, // Computer Science, IT etc
  division: { type: String }, // A, B, C
  subjects: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Subject' }], // for teachers
  department: { type: String }, // for teachers
  enrolledSubjects: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Subject' }], // for students
  class: { type: String }, // for students
  profileImage: { type: String, default: '' },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
