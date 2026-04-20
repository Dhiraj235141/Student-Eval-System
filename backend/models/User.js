const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, minlength: 6 },
  googleId: { type: String, default: '' },
  appleId: { type: String, default: '' },
  otp: { type: String },
  otpExpiry: { type: Date },
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
  isEmailVerified: { type: Boolean, default: false },
}, { timestamps: true });

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
