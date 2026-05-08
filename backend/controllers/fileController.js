const mongoose = require('mongoose');
const { GridFSBucket, ObjectId } = require('mongodb');

/**
 * @desc    Stream a file from GridFS by its ObjectId
 * @route   GET /api/files/:id
 */
exports.getFile = async (req, res) => {
  try {
    const fileId = new ObjectId(req.params.id);
    const db = mongoose.connection.db;

    // Try each bucket until we find the file
    const buckets = ['assignments', 'profiles', 'syllabi'];
    let found = false;

    for (const bucketName of buckets) {
      const bucket = new GridFSBucket(db, { bucketName });

      // Check if file exists in this bucket
      const files = await bucket.find({ _id: fileId }).toArray();
      if (files.length === 0) continue;

      const file = files[0];
      found = true;

      // Set appropriate content-type header
      res.set('Content-Type', file.contentType || 'application/octet-stream');
      res.set('Content-Disposition', `inline; filename="${file.filename}"`);

      // Stream file to response
      const downloadStream = bucket.openDownloadStream(fileId);
      downloadStream.on('error', () => {
        res.status(404).json({ success: false, message: 'File not found in storage' });
      });
      downloadStream.pipe(res);
      break;
    }

    if (!found) {
      res.status(404).json({ success: false, message: 'File not found' });
    }
  } catch (err) {
    if (err.message && err.message.includes('BSONTypeError')) {
      return res.status(400).json({ success: false, message: 'Invalid file ID' });
    }
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * @desc    Download a file from GridFS (forces download dialog)
 * @route   GET /api/files/:id/download
 */
exports.downloadFile = async (req, res) => {
  try {
    const fileId = new ObjectId(req.params.id);
    const db = mongoose.connection.db;

    const buckets = ['assignments', 'profiles', 'syllabi'];

    for (const bucketName of buckets) {
      const bucket = new GridFSBucket(db, { bucketName });
      const files = await bucket.find({ _id: fileId }).toArray();
      if (files.length === 0) continue;

      const file = files[0];

      res.set('Content-Type', file.contentType || 'application/octet-stream');
      res.set('Content-Disposition', `attachment; filename="${file.filename}"`);

      const downloadStream = bucket.openDownloadStream(fileId);
      downloadStream.on('error', () => {
        res.status(404).json({ success: false, message: 'File not found in storage' });
      });
      downloadStream.pipe(res);
      return;
    }

    res.status(404).json({ success: false, message: 'File not found' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
