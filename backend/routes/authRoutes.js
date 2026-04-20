const express = require('express');
const router = express.Router();
const {
  login,
  getMe,
  changePassword,
  register,
  updateProfile,
  uploadProfileImage,
  googleAuth,
  appleAuth,
  forgotPassword,
  verifyOTP,
  resetPassword,
  verifyRegistrationOTP,
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { uploadImage } = require('../middleware/uploadMiddleware');

router.post('/register', register);
router.post('/verify-registration-otp', verifyRegistrationOTP);
router.post('/login', login);
router.post('/google', googleAuth);
router.post('/apple', appleAuth);
router.post('/forgot-password', forgotPassword);
router.post('/verify-otp', verifyOTP);
router.post('/reset-password', resetPassword);
router.get('/me', protect, getMe);
router.put('/change-password', protect, changePassword);
router.put('/profile', protect, updateProfile);
router.post('/profile-image', protect, uploadImage.single('image'), uploadProfileImage);

module.exports = router;
