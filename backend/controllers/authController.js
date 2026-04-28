const User = require('../models/User');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const { OAuth2Client } = require('google-auth-library');

const generateToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE });

// Helper: send OTP email
const sendOTPEmail = async (email, otp, name) => {
  // console.log(`\n=========================================`);
  // console.log(`[DEVELOPMENT] OTP for ${email} is: ${otp}`);
  // console.log(`=========================================\n`);

  try {
    const emailPass = (process.env.EMAIL_PASS || '').replace(/\s+/g, '');
    const emailUser = (process.env.EMAIL_USER || '').trim();

    if (!emailUser || !emailPass) {
      console.log('EMAIL_USER or EMAIL_PASS not set, skipping real email send.');
      return;
    }

    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: { user: emailUser, pass: emailPass },
      tls: { rejectUnauthorized: false },
    });

    await transporter.verify();
    await transporter.sendMail({
      from: `"Student Eval System" <${emailUser}>`,
      to: email,
      subject: 'Password Reset OTP - Student Evaluation System',
      html: `
        <div style="font-family: Inter, sans-serif; max-width: 480px; margin: auto; background: #f0f7ff; border-radius: 16px; overflow: hidden;">
          <div style="background: #2563EB; padding: 24px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 20px;">Student Evaluation System</h1>
          </div>
          <div style="padding: 32px;">
            <p style="color: #1F2937; font-size: 16px;">Hi <strong>${name}</strong>,</p>
            <p style="color: #4B5563;">You requested a password reset. Use the OTP below to proceed:</p>
            <div style="background: #2563EB; border-radius: 12px; padding: 24px; text-align: center; margin: 24px 0;">
              <span style="color: white; font-size: 36px; font-weight: 800; letter-spacing: 8px;">${otp}</span>
            </div>
            <p style="color: #6B7280; font-size: 14px;">This OTP is valid for <strong>10 minutes</strong>. Do not share it with anyone.</p>
            <p style="color: #6B7280; font-size: 14px;">If you did not request this, please ignore this email.</p>
          </div>
        </div>
      `,
    });
  } catch (err) {
    console.log(`[MAILER ERROR] Failed to send email, but OTP was logged above. Error: ${err.message}`);
  }
};

// Helper: send Registration OTP email
const sendRegistrationOTPEmail = async (email, otp, name) => {
  // console.log(`\n=========================================`);
  // console.log(`[DEVELOPMENT] Registration OTP for ${email} is: ${otp}`);
  // console.log(`=========================================\n`);

  try {
    const emailPass = (process.env.EMAIL_PASS || '').replace(/\s+/g, '');
    const emailUser = (process.env.EMAIL_USER || '').trim();

    if (!emailUser || !emailPass) {
      console.log('EMAIL_USER or EMAIL_PASS not set, skipping real email send.');
      return;
    }

    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com', port: 465, secure: true,
      auth: { user: emailUser, pass: emailPass },
      tls: { rejectUnauthorized: false },
    });

    await transporter.verify();
    await transporter.sendMail({
      from: `"Student Eval System" <${emailUser}>`,
      to: email,
      subject: 'Welcome! Verify your Email - Student Evaluation System',
      html: `
        <div style="font-family: Inter, sans-serif; max-width: 480px; margin: auto; background: #f0f7ff; border-radius: 16px; overflow: hidden;">
          <div style="background: #2563EB; padding: 24px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 20px;">Student Evaluation System</h1>
          </div>
          <div style="padding: 32px;">
            <p style="color: #1F2937; font-size: 16px;">Welcome <strong>${name}</strong>!</p>
            <p style="color: #4B5563;">Thank you for registering. Please enter the OTP below to verify your email address and activate your account:</p>
            <div style="background: #2563EB; border-radius: 12px; padding: 24px; text-align: center; margin: 24px 0;">
              <span style="color: white; font-size: 36px; font-weight: 800; letter-spacing: 8px;">${otp}</span>
            </div>
            <p style="color: #6B7280; font-size: 14px;">This OTP is valid for <strong>10 minutes</strong>.</p>
          </div>
        </div>
      `,
    });
  } catch (err) {
    console.log(`[MAILER ERROR] Failed to send email, but OTP was logged above. Error: ${err.message}`);
  }
};

// @desc    Register student (self registration)
// @route   POST /api/auth/register
exports.register = async (req, res) => {
  try {
    const { name, email, password, rollNo, year, branch, division, class: cls } = req.body;

    if (!name || !email || !password) return res.status(400).json({ success: false, message: 'Name, email and password are required' });
    if (password.length < 6) return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });

    const normalizedEmail = email.toLowerCase().trim();
    let user = await User.findOne({ email: normalizedEmail });

    // Generate 6 digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

    if (user) {
      if (user.isEmailVerified) return res.status(400).json({ success: false, message: 'Email already registered and verified. Please login.' });

      // Update existing unverified user
      user.name = name.trim();
      user.password = password; // Will be hashed by pre-save
      user.rollNo = rollNo || '';
      user.year = year || '';
      user.branch = branch || '';
      user.division = division || '';
      user.class = cls || '';
      user.otp = otp;
      user.otpExpiry = otpExpiry;
      await user.save();
    } else {
      // Create new unverified user
      user = await User.create({
        name: name.trim(),
        email: normalizedEmail,
        password,
        role: 'student',
        rollNo: rollNo || '',
        year: year || '',
        branch: branch || '',
        division: division || '',
        class: cls || '',
        isEmailVerified: false,
        otp,
        otpExpiry
      });
    }

    try {
      await sendRegistrationOTPEmail(normalizedEmail, otp, name.trim());
      res.status(200).json({ success: true, message: 'OTP sent to your email. Please verify to activate your account.' });
    } catch (err) {
      console.error('[EMAIL ERROR]', err);
      res.status(500).json({ success: false, message: 'Failed to send OTP email. Please try again.' });
    }
  } catch (err) {
    console.error('[REGISTER ERROR]', err);
    res.status(500).json({ success: false, message: err.message || 'Registration failed. Please try again.' });
  }
};

// @desc    Verify Registration OTP
// @route   POST /api/auth/verify-registration-otp
exports.verifyRegistrationOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ success: false, message: 'Please provide email and OTP' });

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) return res.status(404).json({ success: false, message: 'No pending registration found for this email' });
    if (user.isEmailVerified) return res.status(400).json({ success: false, message: 'Account is already verified. Please login.' });

    if (user.otp !== otp || user.otpExpiry < Date.now()) {
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
    }

    user.otp = undefined;
    user.otpExpiry = undefined;
    user.isEmailVerified = true;
    user.isActive = true; // Ensure active
    await user.save({ validateBeforeSave: false });

    res.json({ success: true, message: 'Email successfully verified! You can now log in.' });
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

    const user = await User.findOne({ email: email.toLowerCase().trim() })
      .populate('subjects', 'name code class')
      .populate('enrolledSubjects', 'name code class');
    if (!user || !user.isActive) return res.status(401).json({ success: false, message: 'Invalid credentials' });
    if (user.isEmailVerified === false) return res.status(401).json({ success: false, message: 'Please verify your email address to activate your account.' });

    if (!user.password) return res.status(401).json({ success: false, message: 'This account uses Google Sign-In. Please login with Google.' });

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

// @desc    Google OAuth login/register
// @route   POST /api/auth/google
exports.googleAuth = async (req, res) => {
  try {
    const { credential } = req.body;
    if (!credential) return res.status(400).json({ success: false, message: 'Google credential is required' });

    const clientId = process.env.GOOGLE_CLIENT_ID;
    if (!clientId) return res.status(500).json({ success: false, message: 'Google OAuth is not configured on the server.' });

    const client = new OAuth2Client(clientId);
    let payload;

    try {
      // Try treating credential as standard ID Token
      const ticket = await client.verifyIdToken({ idToken: credential, audience: clientId });
      payload = ticket.getPayload();
    } catch (tokenErr) {
      // If it fails, assume it's an Access Token from the new @react-oauth/google hook
      const authRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${credential}` }
      });
      if (!authRes.ok) {
        return res.status(400).json({ success: false, message: 'Invalid Google credential provided.' });
      }
      payload = await authRes.json();
    }

    let user = await User.findOne({ email: payload.email })
      .populate('subjects', 'name code class')
      .populate('enrolledSubjects', 'name code class');

    if (user) {
      // Update googleId if not set
      if (!user.googleId) {
        user.googleId = payload.sub;
        await user.save({ validateBeforeSave: false });
      }
      if (!user.isActive) return res.status(401).json({ success: false, message: 'Account is deactivated. Contact admin.' });
    } else {
      // New student registration via Google
      user = await User.create({
        name: payload.name,
        email: payload.email,
        googleId: payload.sub,
        profileImage: payload.picture || '',
        role: 'student',
        password: undefined,
        isEmailVerified: true,
      });
      user = await User.findById(user._id)
        .populate('subjects', 'name code class')
        .populate('enrolledSubjects', 'name code class');
    }

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
    res.status(500).json({ success: false, message: 'Google authentication failed: ' + err.message });
  }
};

// @desc    Apple OAuth login/register
// @route   POST /api/auth/apple
exports.appleAuth = async (req, res) => {
  try {
    const { id_token, user: userJsonString } = req.body;
    if (!id_token) return res.status(400).json({ success: false, message: 'Apple credential is required' });

    const appleSigninAuth = require('apple-signin-auth');
    const payload = await appleSigninAuth.verifyIdToken(id_token, {
      ignoreExpiration: true,
    });

    // Apple only sends 'name' and 'email' the FIRST time a user authorizes the app. 
    // They are packed into a JSON string under the 'user' key.
    let appleName = 'Apple User';
    let appleEmail = payload.email;

    if (userJsonString) {
      try {
        const parsedNode = JSON.parse(userJsonString);
        if (parsedNode.name) appleName = `${parsedNode.name.firstName || ''} ${parsedNode.name.lastName || ''}`.trim();
        if (parsedNode.email) appleEmail = parsedNode.email;
      } catch (e) { }
    }

    if (!appleEmail) return res.status(400).json({ success: false, message: 'Apple account is missing an email address.' });

    let user = await User.findOne({ email: appleEmail })
      .populate('subjects', 'name code class')
      .populate('enrolledSubjects', 'name code class');

    if (user) {
      if (!user.appleId) {
        user.appleId = payload.sub;
        await user.save({ validateBeforeSave: false });
      }
      if (!user.isActive) return res.status(401).json({ success: false, message: 'Account is deactivated. Contact admin.' });
    } else {
      user = await User.create({
        name: appleName || 'Student',
        email: appleEmail,
        appleId: payload.sub,
        role: 'student',
        password: undefined,
        isEmailVerified: true,
      });
      user = await User.findById(user._id)
        .populate('subjects', 'name code class')
        .populate('enrolledSubjects', 'name code class');
    }

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
    res.status(500).json({ success: false, message: 'Apple authentication failed: ' + err.message });
  }
};

// @desc    Forgot password - send OTP
// @route   POST /api/auth/forgot-password
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: 'Email is required' });

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) return res.status(404).json({ success: false, message: 'No account found with that email address' });

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.otp = otp;
    user.otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    await user.save({ validateBeforeSave: false });

    await sendOTPEmail(normalizedEmail, otp, user.name);

    // console.log(`[OTP] Sent to ${normalizedEmail} — OTP: ${otp}`);
    res.json({ success: true, message: `OTP sent to ${normalizedEmail}. Check your inbox (and spam folder).` });
  } catch (err) {
    console.error('[FORGOT PASSWORD ERROR]', err.message);
    res.status(500).json({ success: false, message: 'Failed to send OTP: ' + err.message });
  }
};

// @desc    Verify OTP
// @route   POST /api/auth/verify-otp
exports.verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ success: false, message: 'Email and OTP are required' });

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail, otp: otp.trim(), otpExpiry: { $gt: new Date() } });
    if (!user) return res.status(400).json({ success: false, message: 'Invalid or expired OTP. Please request a new one.' });

    res.json({ success: true, message: 'OTP verified successfully' });
  } catch (err) {
    console.error('[VERIFY OTP ERROR]', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Reset password (after OTP verified)
// @route   POST /api/auth/reset-password
exports.resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword) return res.status(400).json({ success: false, message: 'Email, OTP and new password are required' });
    if (newPassword.length < 6) return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail, otp: otp.trim(), otpExpiry: { $gt: new Date() } });
    if (!user) return res.status(400).json({ success: false, message: 'Invalid or expired OTP. Please start over.' });

    user.password = newPassword;
    user.otp = undefined;
    user.otpExpiry = undefined;
    await user.save();

    res.json({ success: true, message: 'Password reset successfully! You can now login.' });
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
    
    // Safety: Prevent students from changing their core academic details themselves
    if (req.user.role === 'student') {
      // Students can't change year/branch/rollNo via profile update
      // These are locked once registered or set by admin
    } else {
      if (year !== undefined) updateData.year = year;
      if (branch !== undefined) updateData.branch = branch;
      if (rollNo !== undefined) updateData.rollNo = rollNo;
    }

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
