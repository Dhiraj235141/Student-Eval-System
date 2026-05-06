const mongoose = require('mongoose');
const { exec } = require('child_process');
const path = require('path');

const connectDB = async () => {
  const connOptions = {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    family: 4,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
    heartbeatFrequencyMS: 10000,
  };

  const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/student_eval_system';

  console.log(`⏳ Connecting to MongoDB at ${MONGO_URI}...`);

  const connectWithRetry = () => {
    mongoose.connect(MONGO_URI, connOptions)
      .then(() => {
        console.log('✅ MongoDB Connected Successfully');
      })
      .catch((err) => {
        console.error('❌ MongoDB Connection Error:', err.message);

        // Auto-Repair for Localhost only
        if (err.message.includes('ECONNREFUSED') && (MONGO_URI.includes('127.0.0.1') || MONGO_URI.includes('localhost'))) {
          console.log('🤖 AUTO-REPAIR: Local Database is OFF. Attempting to start MongoDB...');
          
          const scriptPath = path.join(__dirname, '../../start-db.bat');
          exec(`"${scriptPath}"`, (error) => {
            if (error) {
              console.error('❌ Auto-Repair Error:', error.message);
              console.log('💡 TIP: Please manually run "start-db.bat" as Administrator.');
            } else {
              console.log('⚡ Repair script triggered in background.');
            }
          });
        }

        console.log('🔄 Retrying connection in 5 seconds...');
        setTimeout(connectWithRetry, 5000);
      });
  };

  connectWithRetry();
};

// Handle connection events
mongoose.connection.on('disconnected', () => {
  console.log('⚠️ MongoDB Disconnected. Attempting to reconnect...');
});

mongoose.connection.on('reconnected', () => {
  console.log('♻️ MongoDB Reconnected!');
});

mongoose.connection.on('error', (err) => {
  console.error('❌ MongoDB Runtime Error:', err);
});

module.exports = connectDB;
