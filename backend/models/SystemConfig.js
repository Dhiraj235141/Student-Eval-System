const mongoose = require('mongoose');

const systemConfigSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  value: { type: String, required: true },
}, { timestamps: true });

// Helper to get active semester (returns 'ODD' or 'EVEN')
systemConfigSchema.statics.getActiveSemester = async function () {
  const config = await this.findOne({ key: 'activeSemester' });
  return config ? config.value : 'ODD'; // Default to ODD
};

// Helper to set active semester
systemConfigSchema.statics.setActiveSemester = async function (value) {
  await this.findOneAndUpdate(
    { key: 'activeSemester' },
    { value },
    { upsert: true, new: true }
  );
};

module.exports = mongoose.model('SystemConfig', systemConfigSchema);
