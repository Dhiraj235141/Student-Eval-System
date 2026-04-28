const PDFDocument = require('pdfkit');

// Color palette
const COLORS = {
  primary: '#2563EB',
  primaryLight: '#DBEAFE',
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  dark: '#1F2937',
  gray: '#6B7280',
  lightGray: '#F9FAFB',
  border: '#E5E7EB',
  white: '#FFFFFF'
};

const hexToRgb = (hex) => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return [r, g, b];
};

const setColor = (doc, hex) => doc.fillColor(hex);
const setStroke = (doc, hex) => doc.strokeColor(hex);

// Draw header with gradient-like effect
const drawHeader = (doc, title, subtitle) => {
  // Background
  doc.rect(0, 0, doc.page.width, 100).fill(COLORS.primary);
  // Accent bar
  doc.rect(0, 95, doc.page.width, 5).fill('#1D4ED8');
  // Logo
  try {
    const logoPath = require('path').join(__dirname, '../../frontend/public/logo.png');
    doc.image(logoPath, 35, 25, { width: 40 });
  } catch (e) {
    // Fallback if image not found
    doc.circle(50, 50, 22).fill('#1D4ED8');
    doc.fontSize(14).fillColor(COLORS.white).font('Helvetica-Bold').text('SES', 39, 43);
  }
  // Title
  doc.fontSize(20).fillColor(COLORS.white).font('Helvetica-Bold').text(title, 85, 28);
  doc.fontSize(10).fillColor('#BFDBFE').font('Helvetica').text(subtitle, 85, 54);
  // Date
  const now = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });
  doc.fontSize(9).fillColor('#BFDBFE').text(`Generated: ${now}`, doc.page.width - 200, 54, { width: 180, align: 'right' });
  doc.moveDown(0);
  doc.y = 120;
};

// Draw section title
const drawSectionTitle = (doc, title, icon = '■') => {
  doc.moveDown(0.5);
  const y = doc.y;
  doc.rect(40, y, 4, 18).fill(COLORS.primary);
  doc.fontSize(12).fillColor(COLORS.dark).font('Helvetica-Bold').text(`  ${title}`, 50, y + 2);
  doc.moveDown(0.8);
};

// Draw stat cards row
const drawStatCards = (doc, stats) => {
  const cardW = (doc.page.width - 80 - (stats.length - 1) * 10) / stats.length;
  const y = doc.y;
  stats.forEach((stat, i) => {
    const x = 40 + i * (cardW + 10);
    // Card background
    doc.roundedRect(x, y, cardW, 60, 6).fill(COLORS.lightGray);
    doc.roundedRect(x, y, cardW, 60, 6).stroke(COLORS.border);
    // Color accent bar
    doc.rect(x, y, cardW, 4).fill(stat.color || COLORS.primary);
    // Value
    doc.fontSize(18).fillColor(COLORS.dark).font('Helvetica-Bold').text(String(stat.value), x, y + 14, { width: cardW, align: 'center' });
    // Label
    doc.fontSize(8).fillColor(COLORS.gray).font('Helvetica').text(stat.label, x, y + 38, { width: cardW, align: 'center' });
  });
  doc.y = y + 75;
};

// Draw table
const drawTable = (doc, headers, rows, colWidths) => {
  const tableW = colWidths.reduce((a, b) => a + b, 0);
  const x = 40;
  let y = doc.y;
  const rowH = 24;

  // Header row
  doc.rect(x, y, tableW, rowH).fill(COLORS.primary);
  let cx = x;
  headers.forEach((h, i) => {
    doc.fontSize(9).fillColor(COLORS.white).font('Helvetica-Bold').text(h, cx + 6, y + 7, { width: colWidths[i] - 10, align: i > 1 ? 'center' : 'left' });
    cx += colWidths[i];
  });
  y += rowH;

  // Data rows
  rows.forEach((row, ri) => {
    if (y + rowH > doc.page.height - 60) {
      doc.addPage();
      y = 60;
      // Repeat header
      doc.rect(x, y, tableW, rowH).fill(COLORS.primary);
      let hx = x;
      headers.forEach((h, i) => {
        doc.fontSize(9).fillColor(COLORS.white).font('Helvetica-Bold').text(h, hx + 6, y + 7, { width: colWidths[i] - 10, align: i > 1 ? 'center' : 'left' });
        hx += colWidths[i];
      });
      y += rowH;
    }
    const bg = ri % 2 === 0 ? COLORS.white : COLORS.lightGray;
    doc.rect(x, y, tableW, rowH).fill(bg).stroke(COLORS.border);
    let rx = x;
    row.forEach((cell, ci) => {
      const cellStr = String(cell ?? '-');
      // Color-code score column (index 3 for score tables)
      let color = COLORS.dark;
      if (ci === 3 && !isNaN(parseFloat(cellStr))) {
        const v = parseFloat(cellStr);
        if (v >= 7) color = COLORS.success;
        else if (v >= 5) color = COLORS.warning;
        else color = COLORS.danger;
      }
      if (ci === 4 && ['Excellent', 'Good', 'Average', 'Below Average', 'Poor'].includes(cellStr)) {
        if (cellStr === 'Excellent') color = COLORS.success;
        else if (cellStr === 'Good') color = '#059669';
        else if (cellStr === 'Average') color = COLORS.warning;
        else color = COLORS.danger;
      }
      doc.fontSize(9).fillColor(color).font(ci === 0 ? 'Helvetica-Bold' : 'Helvetica')
        .text(cellStr, rx + 6, y + 7, { width: colWidths[ci] - 10, align: ci > 1 ? 'center' : 'left' });
      rx += colWidths[ci];
    });
    y += rowH;
  });

  doc.y = y + 10;
};

// Draw footer
const drawFooter = (doc) => {
  const y = doc.page.height - 40;
  doc.rect(0, y, doc.page.width, 40).fill(COLORS.lightGray);
  doc.rect(0, y, doc.page.width, 2).fill(COLORS.primary);
  doc.fontSize(8).fillColor(COLORS.gray).font('Helvetica')
    .text('Student Evaluation System • Confidential Report', 40, y + 14, { align: 'left' })
    .text(`Page ${doc.bufferedPageRange().start + 1}`, 40, y + 14, { align: 'right', width: doc.page.width - 80 });
};

// ─────────────────────────────────────────
// MAIN EXPORT FUNCTIONS
// ─────────────────────────────────────────

// Generate Attendance Report PDF
exports.generateAttendanceReport = (data) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 40, size: 'A4' });
      const buffers = [];
      doc.on('data', d => buffers.push(d));
      doc.on('end', () => resolve(Buffer.concat(buffers)));

      drawHeader(doc, 'Attendance Report', `${data.subjectName} • ${data.month} ${data.year}`);

      // Stats
      drawStatCards(doc, [
        { label: 'Total Students', value: data.summary.length, color: COLORS.primary },
        { label: 'Total Sessions', value: data.totalSessions || '-', color: '#7C3AED' },
        { label: 'Avg Attendance', value: data.summary.length ? (data.summary.reduce((a, b) => a + parseFloat(b.percentage), 0) / data.summary.length).toFixed(1) + '%' : '0%', color: COLORS.success }
      ]);

      drawSectionTitle(doc, 'Student Attendance Details');
      const headers = ['Roll No', 'Student Name', 'Present', 'Total', 'Percentage', 'Status'];
      const colWidths = [70, 160, 70, 70, 80, 75];
      const rows = data.summary.map(s => [
        s.student.rollNo || '-',
        s.student.name,
        s.present,
        s.total,
        s.percentage + '%',
        parseFloat(s.percentage) >= 75 ? '✓ Regular' : '⚠ Low'
      ]);
      drawTable(doc, headers, rows, colWidths);

      const range = doc.bufferedPageRange();
      for (let i = range.start; i < range.start + range.count; i++) {
        doc.switchToPage(i);
        drawFooter(doc);
      }
      doc.end();
    } catch (err) { reject(err); }
  });
};

// Generate Monthly Performance Report PDF
exports.generateMonthlyReport = (data) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 40, size: 'A4' });
      const buffers = [];
      doc.on('data', d => buffers.push(d));
      doc.on('end', () => resolve(Buffer.concat(buffers)));

      drawHeader(doc, 'Monthly Performance Report', `${data.subjectName} • ${data.month}/${data.year}`);

      const avgScore = data.report.length
        ? (data.report.reduce((a, b) => a + parseFloat(b.averageScore), 0) / data.report.length).toFixed(1)
        : 0;
      const excellentCount = data.report.filter(r => r.grade === 'Excellent' || r.grade === 'Good').length;

      drawStatCards(doc, [
        { label: 'Total Students', value: data.report.length, color: COLORS.primary },
        { label: 'Class Avg Score', value: `${avgScore}/10`, color: '#7C3AED' },
        { label: 'Good & Above', value: excellentCount, color: COLORS.success },
        { label: 'Need Attention', value: data.report.length - excellentCount, color: COLORS.danger }
      ]);

      drawSectionTitle(doc, 'Student Performance Summary');
      const headers = ['Roll No', 'Student Name', 'Tests', 'Avg Score', 'Grade', 'Attendance%'];
      const colWidths = [60, 155, 55, 75, 80, 90];
      const rows = data.report.map(r => [
        r.student.rollNo || '-',
        r.student.name,
        r.testsGiven,
        r.averageScore + '/10',
        r.grade,
        r.attendancePercentage + '%'
      ]);
      drawTable(doc, headers, rows, colWidths);

      // Weak students section
      const weakStudents = data.report.filter(r => parseFloat(r.averageScore) < 5);
      if (weakStudents.length > 0) {
        drawSectionTitle(doc, '⚠ Students Needing Extra Attention');
        doc.rect(40, doc.y, doc.page.width - 80, weakStudents.length * 22 + 16).fill('#FFF7ED').stroke('#FED7AA');
        weakStudents.forEach((s, i) => {
          doc.fontSize(10).fillColor(COLORS.danger).font('Helvetica-Bold')
            .text(`• ${s.student.name} (${s.student.rollNo || 'N/A'}) — Avg: ${s.averageScore}/10`, 55, doc.y + 8 + i * 22);
        });
        doc.y += weakStudents.length * 22 + 24;
      }

      const range = doc.bufferedPageRange();
      for (let i = range.start; i < range.start + range.count; i++) {
        doc.switchToPage(i);
        drawFooter(doc);
      }
      doc.end();
    } catch (err) { reject(err); }
  });
};

// Generate Individual Student Report
exports.generateStudentReport = (data) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 40, size: 'A4' });
      const buffers = [];
      doc.on('data', d => buffers.push(d));
      doc.on('end', () => resolve(Buffer.concat(buffers)));

      drawHeader(doc, 'Student Progress Report', `${data.student.name} • ${data.period}`);

      // Student info card
      const infoY = doc.y;
      doc.roundedRect(40, infoY, doc.page.width - 80, 70, 8).fill(COLORS.lightGray).stroke(COLORS.border);
      doc.circle(75, infoY + 35, 22).fill(COLORS.primary);
      doc.fontSize(14).fillColor(COLORS.white).font('Helvetica-Bold')
        .text(data.student.name.charAt(0).toUpperCase(), 65, infoY + 27);
      doc.fontSize(13).fillColor(COLORS.dark).font('Helvetica-Bold').text(data.student.name, 110, infoY + 14);
      doc.fontSize(10).fillColor(COLORS.gray).font('Helvetica')
        .text(`Roll No: ${data.student.rollNo || 'N/A'}  •  Class: ${data.student.class || 'N/A'}`, 110, infoY + 34)
        .text(`Report Period: ${data.period}`, 110, infoY + 50);
      doc.y = infoY + 85;

      // Stats
      drawStatCards(doc, [
        { label: 'Tests Taken', value: data.results.length, color: COLORS.primary },
        { label: 'Average Score', value: data.avgScore + '/10', color: '#7C3AED' },
        { label: 'Attendance', value: data.attendancePercentage + '%', color: COLORS.success },
        { label: 'Overall Grade', value: data.overallGrade, color: data.overallGrade === 'Excellent' ? COLORS.success : data.overallGrade === 'Good' ? '#059669' : COLORS.warning }
      ]);

      // Test results
      if (data.results.length > 0) {
        drawSectionTitle(doc, 'Test Results');
        const headers = ['Date', 'Subject', 'Topic', 'Score', 'Grade'];
        const colWidths = [80, 120, 170, 65, 80];
        const rows = data.results.map(r => [
          new Date(r.createdAt).toLocaleDateString('en-IN'),
          r.subject?.name || '-',
          r.test?.topic || '-',
          r.score + '/10',
          r.grade
        ]);
        drawTable(doc, headers, rows, colWidths);
      }

      // Weak topics
      if (data.weakTopics && data.weakTopics.length > 0) {
        drawSectionTitle(doc, '🎯 AI Suggested Focus Areas');
        const wY = doc.y;
        doc.roundedRect(40, wY, doc.page.width - 80, 20 + data.weakTopics.slice(0, 5).length * 20, 6).fill('#FFF7ED').stroke('#FED7AA');
        data.weakTopics.slice(0, 5).forEach((t, i) => {
          doc.fontSize(10).fillColor('#92400E').font('Helvetica')
            .text(`${i + 1}. ${t.topic}  (missed ${t.failCount} time${t.failCount > 1 ? 's' : ''})`, 55, wY + 10 + i * 20);
        });
        doc.y = wY + 20 + data.weakTopics.slice(0, 5).length * 20 + 10;
      }

      const range = doc.bufferedPageRange();
      for (let i = range.start; i < range.start + range.count; i++) {
        doc.switchToPage(i);
        drawFooter(doc);
      }
      doc.end();
    } catch (err) { reject(err); }
  });
};
