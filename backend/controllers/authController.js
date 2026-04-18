const User = require('../models/User');
const jwt = require('jsonwebtoken');

const generateToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE });

// @desc    Register student (self registration)
// @route   POST /api/auth/register
exports.register = async (req, res) => {
  try {
    const { name, email, password, rollNo, year, branch, division, class: cls } = req.body;
    if (!name || !email || !password) return res.status(400).json({ success: false, message: 'Name, email and password are required' });
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ success: false, message: 'Email already registered' });
    const user = await User.create({ name, email, password, role: 'student', rollNo, year, branch, division, class: cls });
    res.status(201).json({ success: true, message: 'Account created successfully! Please login.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ success: false, message: 'Please provide email and password' });

    const user = await User.findOne({ email })
      .populate('subjects', 'name code class')
      .populate('enrolledSubjects', 'name code class');
    if (!user || !user.isActive) return res.status(401).json({ success: false, message: 'Invalid credentials' });

    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(401).json({ success: false, message: 'Invalid credentials' });

    const token = generateToken(user._id);
    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        rollNo: user.rollNo,
        year: user.year,
        branch: user.branch,
        division: user.division,
        class: user.class,
        department: user.department,
        profileImage: user.profileImage,
        subjects: user.subjects,
        enrolledSubjects: user.enrolledSubjects
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Get current user
// @route   GET /api/auth/me
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select('-password')
      .populate('subjects', 'name code class')
      .populate('enrolledSubjects', 'name code class');
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Update profile
// @route   PUT /api/auth/profile
exports.updateProfile = async (req, res) => {
  try {
    const { name, email, rollNo, year, branch, division, department, profileImage } = req.body;
    if (!name || !email) return res.status(400).json({ success: false, message: 'Name and email are required' });

    // Check if new email is taken by someone else
    const emailExists = await User.findOne({ email, _id: { $ne: req.user.id } });
    if (emailExists) return res.status(400).json({ success: false, message: 'Email already in use by another account' });

    const updateData = { name, email };
    if (rollNo !== undefined) updateData.rollNo = rollNo;
    if (year !== undefined) updateData.year = year;
    if (branch !== undefined) updateData.branch = branch;
    if (division !== undefined) updateData.division = division;
    if (department !== undefined) updateData.department = department;
    if (profileImage !== undefined) updateData.profileImage = profileImage;

    const user = await User.findByIdAndUpdate(req.user.id, updateData, { new: true, runValidators: true })
      .select('-password')
      .populate('subjects', 'name code')
      .populate('enrolledSubjects', 'name code');

    res.json({ success: true, user, message: 'Profile updated successfully!' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Change password
// @route   PUT /api/auth/change-password
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user.id);
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) return res.status(400).json({ success: false, message: 'Current password is incorrect' });
    user.password = newPassword;
    await user.save();
    res.json({ success: true, message: 'Password changed successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Upload profile image
// @route   POST /api/auth/profile-image
exports.uploadProfileImage = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No image uploaded' });
    
    // Construct the URL to the uploaded image. We use the /uploads/profiles route
    const profileImage = `${req.protocol}://${req.get('host')}/uploads/profiles/${req.file.filename}`;
    
    const User = require('../models/User');
    const user = await User.findByIdAndUpdate(req.user.id, { profileImage }, { new: true })
      .select('-password')
      .populate('subjects', 'name code')
      .populate('enrolledSubjects', 'name code');

    res.json({ success: true, user, profileImage, message: 'Profile image updated!' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
