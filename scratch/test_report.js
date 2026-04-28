
const report = [
  { student: { name: 'Vishal Misal', rollNo: 'IF235134' }, testsGiven: 0, averageScore: '0.0', attendancePercentage: '90.0', grade: 'Poor' }
];

const classAverage = report && report.length > 0 
  ? (report.reduce((sum, r) => sum + parseFloat(r.averageScore), 0) / report.length).toFixed(1) 
  : 0;

const classAttendance = report && report.length > 0
  ? (report.reduce((sum, r) => sum + parseFloat(r.attendancePercentage), 0) / report.length).toFixed(1)
  : 0;

console.log('Class Average:', classAverage);
console.log('Class Attendance:', classAttendance);
