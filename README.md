hiii guy's

# 🎓 Student Evaluation System

An AI-powered student evaluation platform with tests, assignments, attendance tracking, and smart weak-topic suggestions.

---

## 🚀 HOW TO RUN ON YOUR SYSTEM

### STEP 1 — Install Required Software

| Software | Download | Purpose |
|----------|----------|---------|
| Node.js (v18+) | https://nodejs.org | Run backend & frontend |
| MongoDB | https://www.mongodb.com/try/download/community | Database |
| VS Code | https://code.visualstudio.com | Code editor |

After installing, open terminal and verify:
```bash
node --version    # Should show v18+
npm --version     # Should show 9+
```

---

### STEP 2 — Setup Backend

```bash
# 1. Go to backend folder
cd student-eval-system/backend

# 2. Install packages
npm install

# 3. Open .env file and set your config
# (default config is already set, just update JWT_SECRET)

# 4. Start backend server
npm run dev
```

✅ Backend runs on: **http://localhost:5000**

---

### STEP 3 — Setup Frontend

Open a NEW terminal window:

```bash
# 1. Go to frontend folder
cd student-eval-system/frontend

# 2. Install packages
npm install

# 3. Start frontend
npm start
```

✅ Frontend runs on: **http://localhost:3000**

---

### STEP 4 — Create First Admin User

Open MongoDB Compass or run this in terminal:

```bash
# Connect to MongoDB
mongosh

# Switch to database
use student_eval_system

# Create admin user (password will be hashed by the app)
# Use Postman or Thunder Client to call:
# POST http://localhost:5000/api/auth/login
# But first create admin directly in DB:

db.users.insertOne({
  name: "Admin User",
  email: "studentevalsystem@gmail.com",
  password: "$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/VK.YXKGne", // "password123"
  role: "admin",
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date()
})
```

Then login at **http://localhost:3000/login** with:
- Email: studentevalsystem@gmail.com
- Password: password123

---

## 📁 Project Structure

```
student-eval-system/
├── backend/
│   ├── server.js          ← Main server entry
│   ├── .env               ← Environment config
│   ├── models/            ← MongoDB models
│   │   ├── User.js
│   │   ├── Subject.js
│   │   ├── Test.js
│   │   ├── TestResult.js
│   │   ├── Attendance.js
│   │   └── Assignment.js
│   ├── controllers/       ← Business logic
│   │   ├── authController.js
│   │   ├── adminController.js
│   │   ├── teacherController.js
│   │   └── studentController.js
│   ├── routes/            ← API routes
│   │   ├── authRoutes.js
│   │   ├── adminRoutes.js
│   │   ├── teacherRoutes.js
│   │   └── studentRoutes.js
│   └── middleware/
│       └── auth.js        ← JWT middleware
│
└── frontend/
    └── src/
        ├── App.jsx         ← Main app with routing
        ├── context/
        │   └── AuthContext.jsx   ← Auth state
        ├── pages/
        │   ├── auth/Login.jsx
        │   ├── admin/Dashboard.jsx
        │   ├── teacher/Dashboard.jsx
        │   ├── teacher/CreateTest.jsx
        │   ├── student/Dashboard.jsx
        │   └── student/TakeTest.jsx
        └── components/
            └── layout/Sidebar.jsx
```

---

## 🔑 API Endpoints

### Auth
- POST `/api/auth/login` — Login
- GET `/api/auth/me` — Get current user

### Admin
- POST `/api/admin/users` — Create teacher/student
- GET `/api/admin/users?role=teacher` — Get all users
- PUT `/api/admin/users/:id/toggle` — Activate/deactivate user
- POST `/api/admin/subjects` — Create subject
- POST `/api/admin/enroll` — Enroll student in subject
- GET `/api/admin/stats` — Dashboard stats

### Teacher
- GET `/api/teacher/subjects` — Get my subjects
- PUT `/api/teacher/subjects/:id/syllabus` — Upload syllabus
- POST `/api/teacher/tests` — Create test
- GET `/api/teacher/results` — View student results
- GET `/api/teacher/attendance` — View attendance
- GET `/api/teacher/monthly-report` — Monthly report
- POST `/api/teacher/assignments` — Create assignment
- PUT `/api/teacher/assignments/:id/publish` — Publish assignment

### Student
- POST `/api/student/validate-code` — Validate secret code
- POST `/api/student/submit-test` — Submit test
- GET `/api/student/results` — My results
- GET `/api/student/attendance` — My attendance
- GET `/api/student/assignments` — My assignments
- POST `/api/student/assignments/:id/submit` — Submit assignment
- GET `/api/student/weak-topics` — AI weak topics
- GET `/api/student/monthly-progress` — Monthly progress

---

## ✅ Features Built

### Module 1 — Auth ✅
- Login for Admin, Teacher, Student
- JWT authentication
- Role-based routing

### Module 2 — AI Test System ✅
- Syllabus upload by teacher
- AI generates 4 Easy + 4 Medium + 2 Hard MCQs
- Secret code (expires in 10 min)
- Anti-cheat: tab switch detection (2 warnings → auto submit)
- Attendance auto-marked on submission

### Module 3 — Assignments ✅
- AI generates assignment questions
- Teacher reviews and publishes
- Deadline with late submission flag
- Student submits online

### Module 4 — Reports ✅
- Subject-wise performance
- Monthly reports
- Attendance percentage

### Module 5 — AI Weak Topics ✅
- Tracks wrong answers per topic
- Suggests focus areas to students
- Shows teachers which students need help

### Module 7 — PDF Reports ✅
- Attendance PDF (name, roll no, present, %, status)
- Monthly Performance PDF (class summary + weak students)
- Individual Student Report PDF (scores + weak topics + attendance)
- Color-coded professional layout with school branding

### Module 8 — Notifications ✅
- Real-time bell icon with unread badge count
- Notifications for: new assignment, test result, deadline, late submission
- Mark as read / mark all read
- Delete individual notifications
- Auto-polls every 30 seconds for new notifications

---

## 🎨 Tech Stack

- **Frontend:** React.js, Tailwind CSS, Recharts
- **Backend:** Node.js, Express.js
- **Database:** MongoDB with Mongoose
- **Auth:** JWT (JSON Web Tokens)
- **AI:** Claude API (Anthropic)
- **Design:** Blue & White theme, mobile responsive

---

## 📞 Need Help?

Come back to Claude and say "let's continue Module X" to add more features!

Next modules planned:
- Module 7: Downloadable PDF reports
- Module 8: Notifications system
- Module 9: Parent login
- Module 10: Leaderboard
"# StudentEvaluationSystem" 
