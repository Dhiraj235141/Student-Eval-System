const multer = require('multer');

// Use memory storage — files arrive as req.file.buffer
// We then manually upload to GridFS in each controller using gridfsHelper.js
const memoryStorage = multer.memoryStorage();

// ─── Assignment PDF upload ─────────────────────────────────────────────────────
const uploadPDF = multer({
  storage: memoryStorage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'), false);
    }
  },
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});

// ─── Profile Image upload ──────────────────────────────────────────────────────
const uploadImage = multer({
  storage: memoryStorage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  },
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

// ─── Syllabus PDF upload ───────────────────────────────────────────────────────
const uploadSyllabus = multer({
  storage: memoryStorage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'), false);
    }
  },
  limits: { fileSize: 20 * 1024 * 1024 } // 20MB
});

module.exports = { uploadPDF, uploadImage, uploadSyllabus };
