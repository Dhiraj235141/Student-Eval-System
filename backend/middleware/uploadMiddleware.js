const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure upload directories exist
const assignmentDir = path.join(__dirname, '../uploads/assignments');
if (!fs.existsSync(assignmentDir)) {
  fs.mkdirSync(assignmentDir, { recursive: true });
}

const profileDir = path.join(__dirname, '../uploads/profiles');
if (!fs.existsSync(profileDir)) {
  fs.mkdirSync(profileDir, { recursive: true });
}

const syllabusDir = path.join(__dirname, '../uploads/syllabi');
if (!fs.existsSync(syllabusDir)) {
  fs.mkdirSync(syllabusDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, assignmentDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `assignment-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new Error('Only PDF files are allowed'), false);
  }
};

const uploadPDF = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});

const profileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, profileDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `profile-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const imageFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only images are allowed'), false);
  }
};

const uploadImage = multer({
  storage: profileStorage,
  fileFilter: imageFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

// Syllabus PDF upload
const syllabusStorage = multer.diskStorage({
  destination: (req, file, cb) => { cb(null, syllabusDir); },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `syllabus-${uniqueSuffix}.pdf`);
  }
});

const uploadSyllabus = multer({
  storage: syllabusStorage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') cb(null, true);
    else cb(new Error('Only PDF allowed'), false);
  },
  limits: { fileSize: 20 * 1024 * 1024 } // 20MB
});

module.exports = { uploadPDF, uploadImage, uploadSyllabus };
