const Notification = require('../models/Notification');
const User = require('../models/User');

// Helper to create a notification
exports.createNotification = async ({ recipientId, senderId, type, title, message, link, metadata }) => {
  try {
    await Notification.create({ recipient: recipientId, sender: senderId, type, title, message, link, metadata });
  } catch (err) {
    console.error('Notification error:', err.message);
  }
};

// Helper to notify all students in a subject
exports.notifySubjectStudents = async ({ subjectId, senderId, type, title, message, link, metadata }) => {
  try {
    const Subject = require('../models/Subject');
    const targetSubject = await Subject.findById(subjectId);
    if (!targetSubject) return;

    // Find all students whose physical 'class' string exactly matches the target subject's 'class' string.
    const students = await User.find({ class: targetSubject.class, role: 'student', isActive: true }, '_id');
    const notifications = students.map(s => ({
      recipient: s._id, sender: senderId, type, title, message, link, metadata
    }));
    await Notification.insertMany(notifications);
  } catch (err) {
    console.error('Bulk notification error:', err.message);
  }
};

// @desc   Get my notifications
// @route  GET /api/notifications
exports.getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ recipient: req.user.id })
      .sort({ createdAt: -1 }).limit(50)
      .populate('sender', 'name role');
    const unreadCount = await Notification.countDocuments({ recipient: req.user.id, isRead: false });
    res.json({ success: true, notifications, unreadCount });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc   Mark notification as read
// @route  PUT /api/notifications/:id/read
exports.markAsRead = async (req, res) => {
  try {
    await Notification.findOneAndUpdate({ _id: req.params.id, recipient: req.user.id }, { isRead: true });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc   Mark all as read
// @route  PUT /api/notifications/read-all
exports.markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany({ recipient: req.user.id, isRead: false }, { isRead: true });
    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc   Delete notification
// @route  DELETE /api/notifications/:id
exports.deleteNotification = async (req, res) => {
  try {
    await Notification.findOneAndDelete({ _id: req.params.id, recipient: req.user.id });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
