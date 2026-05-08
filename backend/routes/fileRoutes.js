const express = require('express');
const router = express.Router();
const { getFile, downloadFile } = require('../controllers/fileController');

// GET /api/files/:id        → inline view (for images, PDFs in browser)
router.get('/:id', getFile);

// GET /api/files/:id/download → force download
router.get('/:id/download', downloadFile);

module.exports = router;
