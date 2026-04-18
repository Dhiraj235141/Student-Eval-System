const express = require('express');
const router = express.Router();
const { login, getMe, changePassword, register, updateProfile, uploadProfileImage } = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { uploadImage } = require('../middleware/uploadMiddleware');

router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, getMe);
router.put('/change-password', protect, changePassword);
router.put('/profile', protect, updateProfile);
router.post('/profile-image', protect, uploadImage.single('image'), uploadProfileImage);

module.exports = router;
