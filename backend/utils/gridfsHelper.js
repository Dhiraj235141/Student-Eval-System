const { GridFSBucket } = require('mongodb');
const mongoose = require('mongoose');
const { Readable } = require('stream');

/**
 * Upload a buffer to MongoDB GridFS
 * @param {Buffer} buffer - File buffer
 * @param {string} filename - Original filename
 * @param {string} mimetype - MIME type (e.g. 'application/pdf')
 * @param {string} bucketName - GridFS bucket: 'assignments' | 'profiles' | 'syllabi'
 * @returns {Promise<ObjectId>} - GridFS file ID
 */
const uploadToGridFS = (buffer, filename, mimetype, bucketName) => {
  return new Promise((resolve, reject) => {
    const db = mongoose.connection.db;
    const bucket = new GridFSBucket(db, { bucketName });

    const uploadStream = bucket.openUploadStream(filename, {
      contentType: mimetype
    });

    // Pipe the buffer into the GridFS upload stream
    const readable = Readable.from(buffer);
    readable.pipe(uploadStream);

    uploadStream.on('finish', () => resolve(uploadStream.id));
    uploadStream.on('error', reject);
  });
};

module.exports = { uploadToGridFS };
