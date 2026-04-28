const User = require('../models/User');
const Subject = require('../models/Subject');
const Notification = require('../models/Notification');
const Announcement = require('../models/Announcement');
const SystemConfig = require('../models/SystemConfig');
const nodemailer = require('nodemailer');

// Temporary in-memory store for pending faculty OTPs
// { email -> { otp, expiry, name, password, department } }
const pendingFacultyOTPs = new Map();

const sendFacultyOTPEmail = async (email, otp, name) => {
  try {
    const emailPass = (process.env.EMAIL_PASS || '').replace(/\s+/g, '');
    const emailUser = (process.env.EMAIL_USER || '').trim();
    if (!emailUser || !emailPass) return;

    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com', port: 465, secure: true,
      auth: { user: emailUser, pass: emailPass },
      tls: { rejectUnauthorized: false },
    });
    await transporter.verify();
    await transporter.sendMail({
      from: `"Student Eval System" <${emailUser}>`,
      to: email,
      subject: 'Faculty Account Creation — Verify Your Email',
      html: `
        <div style="font-family: Inter, sans-serif; max-width: 480px; margin: auto; background: #f0f7ff; border-radius: 16px; overflow: hidden;">
          <div style="background: #2563EB; padding: 24px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 20px;">Student Evaluation System</h1>
          </div>
          <div style="padding: 32px;">
            <p style="color: #1F2937; font-size: 16px;">Hi <strong>${name}</strong>,</p>
            <p style="color: #4B5563;">An admin has initiated your faculty account creation. Please share this OTP with the admin to complete the process:</p>
            <div style="background: #2563EB; border-radius: 12px; padding: 24px; text-align: center; margin: 24px 0;">
              <span style="color: white; font-size: 36px; font-weight: 800; letter-spacing: 8px;">${otp}</span>
            </div>
            <p style="color: #6B7280; font-size: 14px;">This OTP is valid for <strong>10 minutes</strong>. If you did not expect this, please ignore it.</p>
          </div>
        </div>
      `,
    });
  } catch (err) {
    console.error('[FACULTY OTP EMAIL ERROR]', err.message);
  }
};

// @desc    Request OTP to create faculty (sends OTP to faculty email)
// @route   POST /api/admin/faculty/request-otp
exports.requestFacultyOTP = async (req, res) => {
  try {
    const { name, email, password, department } = req.body;
    if (!name || !email || !password || !department) {
      return res.status(400).json({ success: false, message: 'Name, email, password and department are required' });
    }
    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) return res.status(400).json({ success: false, message: 'Email already exists' });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = Date.now() + 10 * 60 * 1000; // 10 minutes

    pendingFacultyOTPs.set(email.toLowerCase().trim(), { otp, expiry, name, password, department });

    await sendFacultyOTPEmail(email.toLowerCase().trim(), otp, name);

    res.json({ success: true, message: `OTP sent to ${email}. Ask the faculty member to check their email and share the OTP.` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Verify OTP and create faculty account
// @route   POST /api/admin/faculty/verify-and-create
exports.verifyOTPAndCreateFaculty = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ success: false, message: 'Email and OTP are required' });

    const key = email.toLowerCase().trim();
    const pending = pendingFacultyOTPs.get(key);
    if (!pending) return res.status(400).json({ success: false, message: 'No pending faculty creation for this email. Please request OTP again.' });
    if (Date.now() > pending.expiry) {
      pendingFacultyOTPs.delete(key);
      return res.status(400).json({ success: false, message: 'OTP has expired. Please request a new one.' });
    }
    if (pending.otp !== otp.trim()) {
      return res.status(400).json({ success: false, message: 'Invalid OTP. Please check and try again.' });
    }

    // Create the faculty account
    const user = await User.create({
      name: pending.name,
      email: key,
      password: pending.password,
      role: 'faculty',
      department: pending.department,
      isEmailVerified: true,
      isActive: true,
    });

    pendingFacultyOTPs.delete(key);
    res.status(201).json({ success: true, message: 'Faculty account created successfully!', user: { id: user._id, name: user.name, email: user.email, role: 'faculty' } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Create user (teacher or student)
// @route   POST /api/admin/users
exports.createUser = async (req, res) => {
  try {
    const { name, email, password, role, rollNo, class: cls, year, branch, division, department } = req.body;
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ success: false, message: 'Email already exists' });
    const user = await User.create({ name, email, password, role, rollNo, class: cls, year, branch, division, department });
    res.status(201).json({ success: true, message: `${role} created successfully`, user: { id: user._id, name, email, role } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Get all users
// @route   GET /api/admin/users
exports.getAllUsers = async (req, res) => {
  try {
    const { role } = req.query;
    const filter = role ? { role } : {};
    const users = await User.find(filter).select('-password').populate('subjects', 'name code').populate('enrolledSubjects', 'name code');
    res.json({ success: true, count: users.length, users });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Update user
// @route   PUT /api/admin/users/:id
exports.updateUser = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true }).select('-password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Toggle user active status
// @route   PUT /api/admin/users/:id/toggle
exports.toggleUserStatus = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    user.isActive = !user.isActive;
    await user.save();
    res.json({ success: true, message: `User ${user.isActive ? 'activated' : 'deactivated'}` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Create subject
// @route   POST /api/admin/subjects
exports.createSubject = async (req, res) => {
  try {
    let { name, code, class: cls, branch, facultyId, semesterType } = req.body;
    if (typeof branch === 'string') branch = [branch];
    const subject = await Subject.create({ name, code, class: cls, branch: branch || ['All'], faculty: facultyId || null, semesterType: semesterType || 'ODD' });
    if (facultyId) {
      await User.findByIdAndUpdate(facultyId, { $addToSet: { subjects: subject._id } });
    }
    res.status(201).json({ success: true, message: 'Subject created', subject });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Update subject (reassign teacher, etc.)
// @route   PUT /api/admin/subjects/:id
exports.updateSubject = async (req, res) => {
  try {
    let { name, code, class: cls, branch, facultyId, isActive } = req.body;
    if (typeof branch === 'string') branch = [branch];
    const subject = await Subject.findById(req.params.id);
    if (!subject) return res.status(404).json({ success: false, message: 'Subject not found' });

    // Handle teacher reassignment
    if (facultyId !== undefined && facultyId !== subject.faculty?.toString()) {
      // Remove from old teacher
      if (subject.faculty) {
        await User.findByIdAndUpdate(subject.faculty, { $pull: { subjects: subject._id } });
      }
      // Add to new teacher
      if (facultyId) {
        await User.findByIdAndUpdate(facultyId, { $addToSet: { subjects: subject._id } });
      }
      subject.faculty = facultyId || null;
    }

    if (name) subject.name = name;
    if (code) subject.code = code;
    if (cls) subject.class = cls;
    if (branch !== undefined) subject.branch = branch;
    if (isActive !== undefined) subject.isActive = isActive;
    if (req.body.semesterType) subject.semesterType = req.body.semesterType;

    await subject.save();
    res.json({ success: true, subject });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Assign subject to teacher
// @route   POST /api/admin/assign-subject
exports.assignSubjectToFaculty = async (req, res) => {
  try {
    const { facultyId, subjectId } = req.body;
    const subject = await Subject.findById(subjectId);
    if (!subject) return res.status(404).json({ success: false, message: 'Subject not found' });

    // Validate subject belongs to active semester
    const activeSemester = await SystemConfig.getActiveSemester();
    if (subject.semesterType !== activeSemester) {
      return res.status(400).json({
        success: false,
        message: `"${subject.name}" belongs to the ${subject.semesterType} semester, which is currently inactive. Active semester is ${activeSemester}. You can only assign faculty to ${activeSemester} semester subjects.`
      });
    }

    // Remove from old teacher
    if (subject.faculty && subject.faculty.toString() !== facultyId) {
      await User.findByIdAndUpdate(subject.faculty, { $pull: { subjects: subjectId } });
    }
    // Assign to new teacher
    subject.faculty = facultyId;
    await subject.save();
    await User.findByIdAndUpdate(facultyId, { $addToSet: { subjects: subjectId } });

    res.json({ success: true, message: 'Subject assigned successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Remove subject from teacher
// @route   POST /api/admin/remove-subject
exports.removeSubjectFromFaculty = async (req, res) => {
  try {
    const { facultyId, subjectId } = req.body;
    await User.findByIdAndUpdate(facultyId, { $pull: { subjects: subjectId } });
    await Subject.findByIdAndUpdate(subjectId, { faculty: null });
    res.json({ success: true, message: 'Subject removed from faculty' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Enroll student in subject
// @route   POST /api/admin/enroll
exports.enrollStudent = async (req, res) => {
  try {
    const { studentId, subjectId } = req.body;
    await User.findByIdAndUpdate(studentId, { $addToSet: { enrolledSubjects: subjectId } });
    res.json({ success: true, message: 'Student enrolled in subject' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Get all subjects
// @route   GET /api/admin/subjects
exports.getAllSubjects = async (req, res) => {
  try {
    const { semesterFilter } = req.query;
    const filter = {};
    if (semesterFilter && semesterFilter !== 'ALL') {
      filter.semesterType = semesterFilter;
    }
    const subjects = await Subject.find(filter).populate('faculty', 'name email');
    const activeSemester = await SystemConfig.getActiveSemester();
    res.json({ success: true, subjects, activeSemester });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Get active semester
// @route   GET /api/admin/semester
exports.getActiveSemester = async (req, res) => {
  try {
    const activeSemester = await SystemConfig.getActiveSemester();
    res.json({ success: true, activeSemester });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Set active semester
// @route   POST /api/admin/semester
exports.setActiveSemester = async (req, res) => {
  try {
    const { semester } = req.body;
    if (!['ODD', 'EVEN'].includes(semester)) {
      return res.status(400).json({ success: false, message: 'Semester must be ODD or EVEN' });
    }
    await SystemConfig.setActiveSemester(semester);
    res.json({ success: true, message: `Active semester switched to ${semester}`, activeSemester: semester });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Get dashboard stats
// @route   GET /api/admin/stats
exports.getDashboardStats = async (req, res) => {
  try {
    const totalStudents = await User.countDocuments({ role: 'student', isActive: true });
    const totalFaculty = await User.countDocuments({ role: 'faculty', isActive: true });
    const totalSubjects = await Subject.countDocuments({ isActive: true });
    const Test = require('../models/Test');
    const activeTests = await Test.countDocuments({ isActive: true, codeExpiresAt: { $gt: new Date() } });
    res.json({ success: true, stats: { totalStudents, totalFaculty, totalSubjects, activeTests } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Create admin announcement (to faculty)
// @route   POST /api/admin/announcements
exports.createAnnouncement = async (req, res) => {
  try {
    const { title, body } = req.body;
    const announcement = await Announcement.create({
      title, body, createdBy: req.user.id, targetRole: 'faculty'
    });

    // Notify all teachers
    const teachers = await User.find({ role: 'faculty', isActive: true }, '_id');
    if (teachers.length > 0) {
      const notifications = teachers.map(t => ({
        recipient: t._id,
        sender: req.user.id,
        title: `📢 Admin: ${title}`,
        message: body,
        type: 'announcement'
      }));
      await Notification.insertMany(notifications);
    }

    res.status(201).json({ success: true, announcement });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Get admin announcements
// @route   GET /api/admin/announcements
exports.getAnnouncements = async (req, res) => {
  try {
    const announcements = await Announcement.find({ createdBy: req.user.id }).sort({ createdAt: -1 });
    res.json({ success: true, announcements });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Update admin announcement
// @route   PUT /api/admin/announcements/:id
exports.updateAnnouncement = async (req, res) => {
  try {
    const announcement = await Announcement.findOneAndUpdate(
      { _id: req.params.id, createdBy: req.user.id },
      { title: req.body.title, body: req.body.body },
      { new: true }
    );
    if (!announcement) return res.status(404).json({ success: false, message: 'Announcement not found' });
    res.json({ success: true, announcement });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Delete admin announcement
// @route   DELETE /api/admin/announcements/:id
exports.deleteAnnouncement = async (req, res) => {
  try {
    const announcement = await Announcement.findOneAndDelete({ _id: req.params.id, createdBy: req.user.id });
    if (!announcement) return res.status(404).json({ success: false, message: 'Announcement not found' });
    res.json({ success: true, message: 'Announcement deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Permanently delete a user
// @route   DELETE /api/admin/users/:id
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    // If it's a faculty, remove them from all subjects first
    if (user.role === 'faculty') {
      await Subject.updateMany({ faculty: user._id }, { faculty: null });
    }

    await User.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'User permanently deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Permanently delete a subject
// @route   DELETE /api/admin/subjects/:id
exports.deleteSubject = async (req, res) => {
  try {
    const subject = await Subject.findById(req.params.id);
    if (!subject) return res.status(404).json({ success: false, message: 'Subject not found' });

    // Untether from faculty
    if (subject.faculty) {
      await User.findByIdAndUpdate(subject.faculty, { $pull: { subjects: subject._id } });
    }
    // Untether from students
    await User.updateMany({ enrolledSubjects: subject._id }, { $pull: { enrolledSubjects: subject._id } });

    await Subject.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Subject permanently deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
