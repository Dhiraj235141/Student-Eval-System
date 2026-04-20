const User = require('../models/User');
const Subject = require('../models/Subject');
const Notification = require('../models/Notification');
const Announcement = require('../models/Announcement');

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
    const { name, code, class: cls, teacherId } = req.body;
    const subject = await Subject.create({ name, code, class: cls, teacher: teacherId });
    if (teacherId) {
      await User.findByIdAndUpdate(teacherId, { $addToSet: { subjects: subject._id } });
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
    const { name, code, class: cls, teacherId, isActive } = req.body;
    const subject = await Subject.findById(req.params.id);
    if (!subject) return res.status(404).json({ success: false, message: 'Subject not found' });

    // Handle teacher reassignment
    if (teacherId !== undefined && teacherId !== subject.teacher?.toString()) {
      // Remove from old teacher
      if (subject.teacher) {
        await User.findByIdAndUpdate(subject.teacher, { $pull: { subjects: subject._id } });
      }
      // Add to new teacher
      if (teacherId) {
        await User.findByIdAndUpdate(teacherId, { $addToSet: { subjects: subject._id } });
      }
      subject.teacher = teacherId || null;
    }

    if (name) subject.name = name;
    if (code) subject.code = code;
    if (cls) subject.class = cls;
    if (isActive !== undefined) subject.isActive = isActive;

    await subject.save();
    res.json({ success: true, subject });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Assign subject to teacher
// @route   POST /api/admin/assign-subject
exports.assignSubjectToTeacher = async (req, res) => {
  try {
    const { teacherId, subjectId } = req.body;
    const subject = await Subject.findById(subjectId);
    if (!subject) return res.status(404).json({ success: false, message: 'Subject not found' });

    // Remove from old teacher
    if (subject.teacher && subject.teacher.toString() !== teacherId) {
      await User.findByIdAndUpdate(subject.teacher, { $pull: { subjects: subjectId } });
    }
    // Assign to new teacher
    subject.teacher = teacherId;
    await subject.save();
    await User.findByIdAndUpdate(teacherId, { $addToSet: { subjects: subjectId } });

    res.json({ success: true, message: 'Subject assigned successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Remove subject from teacher
// @route   POST /api/admin/remove-subject
exports.removeSubjectFromTeacher = async (req, res) => {
  try {
    const { teacherId, subjectId } = req.body;
    await User.findByIdAndUpdate(teacherId, { $pull: { subjects: subjectId } });
    await Subject.findByIdAndUpdate(subjectId, { teacher: null });
    res.json({ success: true, message: 'Subject removed from teacher' });
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
    const subjects = await Subject.find().populate('teacher', 'name email');
    res.json({ success: true, subjects });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Get dashboard stats
// @route   GET /api/admin/stats
exports.getDashboardStats = async (req, res) => {
  try {
    const totalStudents = await User.countDocuments({ role: 'student', isActive: true });
    const totalTeachers = await User.countDocuments({ role: 'teacher', isActive: true });
    const totalSubjects = await Subject.countDocuments({ isActive: true });
    const Test = require('../models/Test');
    const activeTests = await Test.countDocuments({ isActive: true, codeExpiresAt: { $gt: new Date() } });
    res.json({ success: true, stats: { totalStudents, totalTeachers, totalSubjects, activeTests } });
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
      title, body, createdBy: req.user.id, targetRole: 'teacher'
    });

    // Notify all teachers
    const teachers = await User.find({ role: 'teacher', isActive: true }, '_id');
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
    
    // If it's a teacher, remove them from all subjects first
    if (user.role === 'teacher') {
      await Subject.updateMany({ teacher: user._id }, { teacher: null });
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

    // Untether from teachers
    if (subject.teacher) {
      await User.findByIdAndUpdate(subject.teacher, { $pull: { subjects: subject._id } });
    }
    // Untether from students
    await User.updateMany({ enrolledSubjects: subject._id }, { $pull: { enrolledSubjects: subject._id } });

    await Subject.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Subject permanently deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
