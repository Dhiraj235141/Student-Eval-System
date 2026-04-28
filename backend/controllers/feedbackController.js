const Feedback = require('../models/Feedback');
const User = require('../models/User');
const nodemailer = require('nodemailer');

// Helper: Send email
const sendFeedbackEmails = async (student, feedback) => {
  const adminEmail = 'studentevalsystem@gmail.com';
  const emailUser = (process.env.EMAIL_USER || '').trim();
  const emailPass = (process.env.EMAIL_PASS || '').replace(/\s+/g, '');

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

  try {
    await transporter.verify();

    const isFaculty = student.role === 'faculty';
    const roleTitle = isFaculty ? 'FACULTY' : 'STUDENT';

    // 1. Email to Admin
    await transporter.sendMail({
      from: `"Student Eval System" <${emailUser}>`,
      to: adminEmail,
      subject: `NEW ${roleTitle} FEEDBACK: ${feedback.type} - ${feedback.subject}`,
      html: `
        <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #2563EB;">New ${roleTitle.toLowerCase().charAt(0).toUpperCase() + roleTitle.toLowerCase().slice(1)} Feedback</h2>
          <p><strong>From:</strong> ${student.name} (${student.email})</p>
          <p><strong>Role:</strong> ${student.role}</p>
          <p><strong>Type:</strong> ${feedback.type}</p>
          <p><strong>Subject:</strong> ${feedback.subject}</p>
          <hr />
          <p><strong>Message:</strong></p>
          <p style="white-space: pre-wrap;">${feedback.message}</p>
        </div>
      `,
    });

    // 2. Acknowledgment to Student
    await transporter.sendMail({
      from: `"Student Eval System" <${emailUser}>`,
      to: student.email,
      subject: 'Feedback Received - Student Evaluation System',
      html: `
        <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #2563EB;">Thank You for Your Feedback!</h2>
          <p>Hi ${student.name.split(' ')[0]},</p>
          <p>We've received your ${feedback.type.toLowerCase()} regarding "<strong>${feedback.subject}</strong>".</p>
          <p>Our team will review it and get back to you if necessary. We typically respond within 24-48 hours.</p>
          <hr />
          <p style="color: #666; font-size: 12px;">Your original message:</p>
          <p style="font-style: italic; color: #666;">"${feedback.message}"</p>
          <hr />
          <p>Best regards,<br />Student Eval System Team</p>
        </div>
      `,
    });
  } catch (err) {
    console.error('[FEEDBACK EMAIL ERROR]', err.message);
  }
};

// @desc    Submit feedback
// @route   POST /api/feedback
exports.submitFeedback = async (req, res) => {
  try {
    const { type, subject, message } = req.body;
    if (!type || !subject || !message) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }

    const feedback = await Feedback.create({
      user: req.user.id,
      type,
      subject,
      message
    });

    const student = await User.findById(req.user.id);
    if (student) {
      // Send emails asynchronously
      sendFeedbackEmails(student, feedback);
    }

    res.status(201).json({ success: true, message: 'Feedback submitted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Get all feedbacks (Admin only)
// @route   GET /api/feedback
exports.getFeedbacks = async (req, res) => {
  try {
    const feedbacks = await Feedback.find()
      .populate('user', 'name email rollNo class role')
      .sort({ createdAt: -1 });

    res.json({ success: true, feedbacks });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Reply to a feedback
// @route   POST /api/feedback/:id/reply
exports.replyToFeedback = async (req, res) => {
  try {
    const { replyMessage } = req.body;
    if (!replyMessage) {
      return res.status(400).json({ success: false, message: 'Reply message is required' });
    }

    const feedback = await Feedback.findById(req.params.id).populate('user');
    if (!feedback) {
      return res.status(404).json({ success: false, message: 'Feedback not found' });
    }

    // Email logic
    const emailUser = (process.env.EMAIL_USER || '').trim();
    const emailPass = (process.env.EMAIL_PASS || '').replace(/\s+/g, '');

    if (emailUser && emailPass) {
      const transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        auth: { user: emailUser, pass: emailPass },
        tls: { rejectUnauthorized: false },
      });

      await transporter.sendMail({
        from: `"Student Eval System Admin" <${emailUser}>`,
        to: feedback.user.email,
        subject: `Re: Your ${feedback.type} - Student Evaluation System`,
        html: `
          <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
            <h2 style="color: #2563EB;">Response from Administration</h2>
            <p>Hi ${feedback.user.name.split(' ')[0]},</p>
            <div style="background: #f9f9f9; padding: 15px; border-left: 4px solid #2563EB; margin: 20px 0;">
              <p style="white-space: pre-wrap; margin: 0;">${replyMessage}</p>
            </div>
            <hr />
            <p style="color: #666; font-size: 12px;">Regarding your original message from ${new Date(feedback.createdAt).toLocaleDateString()}:</p>
            <p style="font-style: italic; color: #666; border-left: 2px solid #ddd; padding-left: 10px;">"${feedback.message}"</p>
            <hr />
            <p>Best regards,<br />Student Eval System Admin Team</p>
          </div>
        `,
      });
    }

    // Delete feedback after successful email send
    await Feedback.findByIdAndDelete(req.params.id);

    res.json({ success: true, message: 'Reply sent and feedback removed' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
