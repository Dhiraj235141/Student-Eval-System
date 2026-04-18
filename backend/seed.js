/**
 * SEED SCRIPT — Creates default Admin, Teacher, and Student users
 * 
 * HOW TO RUN:
 *   cd backend
 *   node seed.js
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  role: String,
  rollNo: String,
  subjects: Array,
  enrolledSubjects: Array,
  class: String,
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

const users = [
  {
    name: 'Admin User',
    email: 'admin@school.com',
    password: 'admin123',
    role: 'admin'
  },
  {
    name: 'Prof. Ramesh Kumar',
    email: 'kunal@123.com',
    password: 'teacher123',
    role: 'teacher'
  },
  {
    name: 'Rahul Sharma',
    email: 'mansi@123.com',
    password: 'student123',
    role: 'student',
    rollNo: 'CS001',
    class: 'SE-A'
  }
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB Connected');

    for (const u of users) {
      const existing = await User.findOne({ email: u.email });
      if (existing) {
        console.log(`⚠️  User already exists: ${u.email} — skipping`);
        continue;
      }
      const hashed = await bcrypt.hash(u.password, 12);
      await User.create({ ...u, password: hashed });
      console.log(`✅ Created ${u.role}: ${u.email} / password: ${u.password}`);
    }

    console.log('\n🎉 Seed complete! Login credentials:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('👤 Admin    → admin@school.com   / admin123');
    console.log('👨‍🏫 Teacher  → teacher@school.com / teacher123');
    console.log('👨‍🎓 Student  → student@school.com / student123');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    process.exit(0);
  } catch (err) {
    console.error('❌ Seed failed:', err.message);
    process.exit(1);
  }
}

seed();
