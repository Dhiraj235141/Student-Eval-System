const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const app = express();

// Middleware
app.use(cors({ origin: "https://student-eval-system-3.onrender.com", credentials: true }));
app.use(express.json({ limit: '10mb' }));

// Serve files from GridFS (MongoDB)
app.use('/api/files', require('./routes/fileRoutes'));

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/faculty', require('./routes/facultyRoutes'));
app.use('/api/student', require('./routes/studentRoutes'));
app.use('/api/reports', require('./routes/reportRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/feedback', require('./routes/feedbackRoutes'));
app.use('/api/ai', require('./routes/aiRoutes'));


// Health check
app.get('/', (req, res) => res.json({ message: 'Student Evaluation System API Running! 🎓' }));

// Connect to MongoDB
const connectDB = require('./utils/db');
connectDB();

app.listen(process.env.PORT || 5000, () => {
  console.log(`🚀 Server running on port ${process.env.PORT || 5000}`);
});
