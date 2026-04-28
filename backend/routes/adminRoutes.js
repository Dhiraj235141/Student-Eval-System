const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  createUser, getAllUsers, updateUser, toggleUserStatus,
  createSubject, updateSubject, enrollStudent, getAllSubjects,
  getDashboardStats, assignSubjectToFaculty, removeSubjectFromFaculty,
  getAnnouncements,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
  deleteUser,
  deleteSubject,
  requestFacultyOTP,
  verifyOTPAndCreateFaculty,
  getActiveSemester,
  setActiveSemester
} = require('../controllers/adminController');

router.use(protect, authorize('admin'));

router.get('/stats', getDashboardStats);
router.post('/users', createUser);
router.get('/users', getAllUsers);
router.put('/users/:id', updateUser);
router.delete('/users/:id', deleteUser);
router.put('/users/:id/toggle', toggleUserStatus);
router.post('/subjects', createSubject);
router.get('/subjects', getAllSubjects);
router.put('/subjects/:id', updateSubject);
router.delete('/subjects/:id', deleteSubject);
router.post('/enroll', enrollStudent);
router.post('/assign-subject', assignSubjectToFaculty);
router.post('/remove-subject', removeSubjectFromFaculty);
router.post('/faculty/request-otp', requestFacultyOTP);
router.post('/faculty/verify-and-create', verifyOTPAndCreateFaculty);
router.get('/semester', getActiveSemester);
router.post('/semester', setActiveSemester);
router.get('/announcements', protect, getAnnouncements);
router.post('/announcements', protect, createAnnouncement);
router.put('/announcements/:id', protect, updateAnnouncement);
router.delete('/announcements/:id', protect, deleteAnnouncement);

module.exports = router;
