import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import {
  ArrowLeft, Shield, Info, MessageSquare, Mail, Phone, MapPin,
  FileText, Lock, Cookie, Bell, Activity, Cpu, Users,
  BarChart2, CalendarCheck, ClipboardCheck,
  Send, HelpCircle, Bug, AlertTriangle, Heart, Lightbulb, Loader2, CheckCircle2, ChevronDown, Rocket, X
} from 'lucide-react';
import BlobSidebar from '../components/layout/BlobSidebar';
import Footer from '../components/layout/Footer';

const InfoPage = ({ type }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [feedbackForm, setFeedbackForm] = useState({ name: '', email: '', type: 'Suggestion', message: '' });
  const [contactForm, setContactForm] = useState({ name: '', phone: '', email: '', company: '', subject: '', message: '' });
  const [submitted, setSubmitted] = useState(false);

  const feedbackTypes = [
    { id: 'Suggestion', label: 'Suggestion', icon: Lightbulb, color: 'blue' },
    { id: 'Bug Report', label: 'Bug Report', icon: Bug, color: 'red' },
    { id: 'Complaint', label: 'Complaint', icon: AlertTriangle, color: 'amber' },
    { id: 'Compliment', label: 'Compliment', icon: Heart, color: 'emerald' },
  ];

  useEffect(() => {
    if (user) {
      setFeedbackForm(prev => ({ ...prev, name: user.name || '', email: user.email || '' }));
      setContactForm(prev => ({ ...prev, name: user.name || '', email: user.email || '' }));
    }
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const isContact = type === 'contact';
    const currentForm = isContact ? contactForm : feedbackForm;

    const isVisitor = !user;
    if ((isVisitor && (!currentForm.name || !currentForm.email)) || !currentForm.message) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      await axios.post('/feedback', isContact ? { ...contactForm, type: 'Contact' } : feedbackForm);
      toast.success(isContact ? 'Message sent successfully! 🚀' : 'Feedback sent successfully! 🚀');
      setSubmitted(true);

      if (isContact) {
        setContactForm({ name: '', phone: '', email: '', company: '', subject: '', message: '' });
      } else {
        setFeedbackForm({ name: '', email: '', type: 'Suggestion', message: '' });
      }

      setTimeout(() => setSubmitted(false), 3000);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send submission');
    } finally {
      setLoading(false);
    }
  };

  const content = {
    about: {
      title: 'About Us',
      icon: Info,
      color: 'blue',
      description: 'Empowering education through a smart, secure, and efficient student evaluation system.',
      text: 'Student Evaluation System (SES) is a state-of-the-art educational platform designed to streamline the evaluation process using AI. Developed at Government Polytechnic Nashik, our mission is to provide educators and students with powerful tools for performance tracking, automated testing, and comprehensive analytics.'
    },
    policies: {
      title: 'Our Policies',
      icon: Shield,
      color: 'blue',
      description: 'Our commitment to security, transparency, and integrity across the SES ecosystem.',
      text: 'Our policies are designed to ensure a fair and secure environment for all users. This includes our Privacy Policy, which protects your data, and our Terms of Service, which outlines the rules for using our AI-powered evaluation tools. We prioritize academic integrity and data security.'
    },
    privacy: {
      title: 'Privacy Policy',
      icon: Shield,
      color: 'blue',
      description: 'Your privacy is our priority. Learn how we collect, use, and protect your data with complete transparency.',
      sections: [
        {
          icon: Info,
          title: 'Overview',
          content: 'The Student Evaluation System is designed to support academic activities such as attendance tracking, assessments, and performance monitoring. We are committed to protecting the privacy and confidentiality of all users, including students, faculty, and administrators. By using this system, you agree to the collection and use of information in accordance with this policy.'
        },
        {
          icon: FileText,
          title: 'Information We Collect',
          subsections: [
            {
              subtitle: 'Account Information',
              items: ['Name', 'Enrollment Number / Employee ID', 'Email Address', 'Password (stored securely in encrypted form)']
            },
            {
              subtitle: 'Academic Information',
              items: ['Attendance records', 'Test and assignment data', 'Marks, results, and feedback', 'Performance reports and analytics']
            },
            {
              subtitle: 'System Usage Data',
              items: ['Login activity (date & time)', 'Device and browser information', 'IP address (for security monitoring)', 'Interaction logs within the system']
            }
          ]
        },
        {
          icon: Activity,
          title: 'Purpose of Data Usage',
          content: 'We use collected data only for educational and system-related purposes:',
          items: [
            'To manage user accounts and authentication',
            'To conduct tests, assignments, and attendance',
            'To generate academic reports and analytics',
            'To send important notifications and updates',
            'To improve system performance and usability',
            'To ensure system security and prevent misuse'
          ]
        },
        {
          icon: Users,
          title: 'Access Control & Data Visibility',
          items: [
            'Students can access only their own data',
            'Faculty can access data of assigned students/subjects',
            'Admin has controlled access for system management'
          ],
          footer: 'Strict role-based access ensures data privacy and integrity.'
        },
        {
          icon: Lock,
          title: 'Data Security Measures',
          content: 'We implement appropriate technical safeguards:',
          items: [
            'Secure login and authentication system',
            'Encrypted password storage',
            'Role-based authorization',
            'Protection against unauthorized access',
            'Regular monitoring of system activity'
          ]
        },
        {
          icon: Shield,
          title: 'Data Sharing Policy',
          content: 'We do not sell, rent, or share personal data with external parties. Data may only be shared:',
          items: [
            'With authorized faculty and administrators',
            'When required by institutional rules',
            'When legally required by authorities'
          ]
        },
        {
          icon: CalendarCheck,
          title: 'Data Retention',
          content: 'User data is stored only as long as necessary for academic and administrative purposes. After completion of the academic period:',
          items: [
            'Data may be archived securely, or',
            'Permanently removed as per institutional policy'
          ]
        },
        {
          icon: ClipboardCheck,
          title: 'User Rights',
          content: 'Users have the right to:',
          items: [
            'View their personal and academic data',
            'Request correction of incorrect information',
            'Report issues related to privacy or misuse',
            'Contact the administrator for support'
          ]
        },
        {
          icon: Cookie,
          title: 'Cookies & Session Handling',
          content: 'The system uses session-based tracking to maintain login sessions and improve user experience. No third-party advertising or tracking cookies are used.'
        },
        {
          icon: Cpu,
          title: 'Third-Party Services',
          content: 'If external services (such as cloud hosting or storage) are used, they are selected based on security standards. However, their independent privacy policies may apply.'
        },
        {
          icon: Bell,
          title: 'Limitation of Responsibility',
          content: 'The system ensures strong security measures, but users are responsible for keeping login credentials confidential and avoiding unauthorized sharing of accounts. We are not responsible for breaches caused by user negligence.'
        },
        {
          icon: BarChart2,
          title: 'Policy Updates',
          content: 'This Privacy Policy may be updated periodically to reflect system improvements or legal requirements. Updates will be reflected with a revised "Last Updated" date.'
        },

      ]
    },
    terms: {
      title: 'Terms of Service',
      icon: FileText,
      color: 'blue',
      description: 'Lear and fair usage guidelines to ensure a secure, reliable, and responsible experience for all users.',
      sections: [
        {
          icon: Info,
          title: 'Acceptance of Terms',
          content: 'By accessing or using the Student Evaluation System (“the System”), you agree to comply with these Terms of Service. If you do not agree with any part of these terms, you must discontinue use of the System.'
        },
        {
          icon: Rocket,
          title: 'Purpose of the Service',
          content: 'The System is designed to support academic activities within an educational institution, including:',
          items: [
            'Attendance management',
            'Test and assessment handling',
            'Assignment submission and evaluation',
            'Performance tracking and reporting'
          ],
          footer: 'The platform must be used strictly for academic and authorized institutional purposes.'
        },
        {
          icon: Users,
          title: 'User Accounts and Responsibilities',
          content: 'Users are fully responsible for all activities conducted through their accounts and are required to:',
          items: [
            'Provide accurate and complete information during registration',
            'Maintain the confidentiality of login credentials',
            'Ensure that their account is not accessed by unauthorized individuals'
          ]
        },
        {
          icon: AlertTriangle,
          title: 'Acceptable Use',
          content: 'Users agree to use the System responsibly and must not:',
          items: [
            'Attempt to gain unauthorized access to data or system resources',
            'Modify, manipulate, or falsify academic records',
            'Upload harmful, malicious, or irrelevant content',
            'Disrupt or interfere with the normal functioning of the System'
          ],
          footer: 'Any violation may result in restricted access or disciplinary action.'
        },
        {
          icon: Shield,
          title: 'Academic Integrity',
          content: 'The System promotes fair academic practices. Users must:',
          items: [
            'Submit original work for assignments and assessments',
            'Avoid cheating, plagiarism, or misuse of system features',
            'Follow institutional academic guidelines'
          ],
          footer: 'Violations may lead to penalties as per institutional policies.'
        },
        {
          icon: Lock,
          title: 'Access Control',
          content: 'The System operates on role-based access:',
          items: [
            'Students can access their own academic data',
            'Faculty can manage and evaluate assigned students',
            'Administrators have system-level control'
          ],
          footer: 'Unauthorized access to restricted data is strictly prohibited.'
        },
        {
          icon: Activity,
          title: 'System Availability and Maintenance',
          content: 'While the System aims to provide reliable service, temporary downtime may occur due to maintenance or updates. Performance may vary depending on network or technical conditions. We do not guarantee uninterrupted or error-free operation at all times.'
        },
        {
          icon: Shield,
          title: 'Data Usage and Privacy',
          content: 'User data is collected and processed solely for academic and administrative purposes. All data handling follows the guidelines defined in the Privacy Policy.'
        },
        {
          icon: FileText,
          title: 'Limitation of Liability',
          content: 'The System and its administrators shall not be held liable for loss of data due to unforeseen technical issues, errors resulting from incorrect user input, or temporary service interruptions or delays.'
        },
        {
          icon: Cpu,
          title: 'Modifications to Service',
          content: 'We reserve the right to modify or enhance system features and update these Terms of Service at any time. Continued use of the System after updates indicates acceptance of the revised terms.'
        },
        {
          icon: X,
          title: 'Termination of Access',
          content: 'Access to the System may be suspended or terminated if these terms are violated, unauthorized or suspicious activities are detected, or as required by institutional policies.'
        },
        {
          icon: HelpCircle,
          title: 'Governing Rules',
          content: 'These Terms of Service are governed by the rules and regulations of the respective educational institution.'
        },
        {
          icon: Mail,
          title: 'Contact Information',
          content: 'For any queries or support related to the System, please reach out to us:',
          footer: 'Mail Us: studentevalsystem@gmail.com\n\nCall Us: +91 9021766366, +91 7972815280\n\nVisit Us: Government Polytechnic Nashik'
        }
      ]
    },
    feedback: {
      title: 'Feedback',
      icon: MessageSquare,
      color: 'cyan',
      description: 'We value your input and suggestions.',
      text: 'Whether you are a student, faculty member, or visitor, your feedback helps us improve. Please let us know your thoughts, suggestions, or any issues you encounter while using our system. We are constantly evolving to better serve the educational community.'
    },
    contact: {
      title: 'Contact Us',
      icon: Mail,
      color: 'indigo',
      description: 'Get in touch with the SES team.',
      text: 'Have questions or need assistance? Our team is here to help. Reach out to us via email, phone, or visit our department at GP Nashik.'
    }
  }[type];

  if (!content) return null;

  const Icon = content.icon;

  // Custom layout for About Us
  if (type === 'about') {
    return (
      <div className="min-h-screen bg-[#F8FAFC] font-inter pb-12 overflow-x-hidden">
        <BlobSidebar />

        {/* Header - Professional Blue Theme with Mobile Clearance */}
        <div className="bg-gradient-to-br from-[#2563EB] to-[#1E40AF] pt-24 pb-32 px-6 md:pt-16 md:pb-24 md:rounded-b-[80px] rounded-b-[40px] shadow-lg relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-white/10 rounded-full blur-3xl animate-pulse" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-900/20 rounded-full blur-3xl" />
          </div>

          <button
            onClick={() => navigate('/')}
            className="absolute top-8 left-8 flex items-center gap-2 text-white/80 hover:text-white transition-colors font-semibold text-sm bg-white/10 backdrop-blur-md px-4 py-2 rounded-xl border border-white/20 z-30"
          >
            <ArrowLeft size={16} /> Back
          </button>

          <div className="max-w-6xl mx-auto relative z-10 flex flex-col items-center text-center">
            <div className="w-20 h-20 bg-white/20 backdrop-blur-xl rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl border border-white/30 rotate-3 mt-8 md:mt-4">
              <Icon size={40} className="text-white" />
            </div>
            <h1 className="text-white text-3xl md:text-5xl font-black tracking-tight uppercase">{content.title}</h1>
            <p className="text-white/90 max-w-2xl mx-auto text-lg leading-relaxed font-medium mt-4">
              {content.description}
            </p>
            <div className="h-1.5 w-24 bg-white/30 mt-6 rounded-full" />
          </div>
        </div>

        <div className="max-w-md md:max-w-5xl mx-auto px-6 -mt-16 md:-mt-20 space-y-8 relative z-20">
          {/* Intro Section - Responsive layout */}
          <div className="bg-white rounded-[40px] md:rounded-[56px] p-8 md:p-12 shadow-2xl shadow-blue-900/5 border border-gray-100 flex flex-col md:flex-row items-center md:items-start gap-8 md:gap-12 group transition-all duration-500">
            <div className="w-24 h-24 md:w-40 md:h-40 bg-gradient-to-br from-blue-600 to-blue-400 rounded-[32px] md:rounded-[48px] flex items-center justify-center shrink-0 shadow-xl shadow-blue-500/30 rotate-3 group-hover:rotate-0 transition-all duration-500">
              <Shield className="text-white" size={64} />
            </div>
            <div className="text-center md:text-left space-y-4">
              <div className="space-y-1">
                <h2 className="text-3xl md:text-4xl font-black text-[#1E293B]">Student Evaluation System</h2>
                <p className="text-[#2563EB] font-bold text-base md:text-lg">
                  Enhancing academic performance through smart digital evaluation
                </p>
              </div>
              <div className="pt-4 border-t border-gray-100">
                <h3 className="text-xs uppercase tracking-widest font-bold text-gray-400 mb-2"></h3>
                <p className="text-gray-500 leading-relaxed text-sm md:text-base">
                  The Student Evaluation System is a modern web-based platform designed to simplify and automate academic processes such as attendance, assessments, assignments, and performance tracking. It ensures transparency, efficiency, and real-time insights for students, faculty, and administrators.
                </p>
              </div>
            </div>
          </div>

          {/* Mission Section */}
          <div className="bg-white rounded-[40px] p-8 md:p-12 shadow-lg border border-gray-100 flex flex-col md:flex-row items-center gap-8 group">
            <div className="w-20 h-20 bg-blue-600 rounded-3xl flex items-center justify-center shadow-xl shadow-blue-600/20 shrink-0 transform group-hover:rotate-6 transition-transform duration-500">
              <Info className="text-white" size={32} />
            </div>
            <div className="space-y-4 text-center md:text-left">
              <h3 className="text-2xl md:text-3xl font-black text-[#1E293B]">Our Mission</h3>
              <p className="text-gray-500 leading-relaxed text-base md:text-lg">
                We are committed to building a smart and efficient academic evaluation system that improves the overall learning experience. Our goal is to provide a platform that ensures accurate performance tracking and continuous improvement in education.
              </p>
            </div>
          </div>

          {/* Team Section - Now Full Width */}
          <div className="space-y-12 pt-8">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-16 h-1 w-24 bg-purple-600 rounded-full" />
              <h3 className="text-3xl md:text-5xl font-black text-[#1E293B] tracking-tight">Meet Our Team</h3>
              <p className="text-gray-500 font-medium max-w-2xl text-lg">
                The brilliant minds behind the Student Evaluation System, dedicated to educational excellence.
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-8 md:gap-12 max-w-6xl mx-auto">
              {[
                { id: 1, name: 'Vishal Misal', role: 'Lead Developer', image: '/team/member1.png', theme: 'blue', linkedin: 'https://www.linkedin.com/in/vishal-misal-2285803a7?utm_source=share_via&utm_content=profile&utm_medium=member_android', instagram: 'https://www.instagram.com/misal_vishal7?igsh=MXZnMnlxMjU2NzlyMw==' },
                { id: 2, name: 'Dhiraj Patil', role: 'Project Lead', image: '/team/member2.png', theme: 'purple', linkedin: 'https://www.linkedin.com/in/dhiraj-patil-a570a5329?utm_source=share_via&utm_content=profile&utm_medium=member_android', instagram: 'https://www.instagram.com/dhiraj_ptl__001?igsh=eHBhZXJmZGp1Z2p5' },
                { id: 3, name: 'Kunal Patil', role: 'DataBase Administrator', image: '/team/member3.jpeg', theme: 'emerald', linkedin: 'https://www.linkedin.com/in/kunal-patil-8b3a443a6?utm_source=share_via&utm_content=profile&utm_medium=member_android', instagram: 'https://www.instagram.com/kunalptl_018?utm_source=qr&igsh=MjRxa2kwbHJncHkw' },
                { id: 4, name: 'Mansi Patil', role: 'UI/UX Designer', image: '/team/member4.png', theme: 'amber', linkedin: 'https://www.linkedin.com/in/mansi-patil-187b17407/', instagram: 'https://www.instagram.com/mansipatil.24?igsh=MXRjNTU2N253MWltbw==' },
                { id: 5, name: 'Janhavi Nandan', role: 'FrontEnd Developer', image: '/team/member6.png', theme: 'rose', linkedin: 'https://www.linkedin.com/in/janhavi-nandan-35b409350?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=android_app', instagram: 'https://www.instagram.com/janvy_9923?utm_source=qr&igsh=MThzd2M2OHl1ZW5lOA==' },
                { id: 6, name: 'Rakshanda Kakade', role: 'Quality Analyst', image: '/team/member7.png', theme: 'indigo', linkedin: 'https://in.linkedin.com/in/rakshanda-kakade-5b487b28a', instagram: '#' },
              ].map((member, index) => {
                const colorMap = {
                  blue: 'bg-blue-500 text-blue-600 border-blue-100 shadow-blue-500/20',
                  purple: 'bg-purple-500 text-purple-600 border-purple-100 shadow-purple-500/20',
                  emerald: 'bg-emerald-500 text-emerald-600 border-emerald-100 shadow-emerald-500/20',
                  amber: 'bg-amber-500 text-amber-600 border-amber-100 shadow-amber-500/20',
                  rose: 'bg-rose-500 text-rose-600 border-rose-100 shadow-rose-500/20',
                  indigo: 'bg-indigo-500 text-indigo-600 border-indigo-100 shadow-indigo-500/20',
                };
                const theme = colorMap[member.theme].split(' ');

                return (
                  <div
                    key={member.id}
                    className="group flex flex-col items-center text-center space-y-4"
                  >
                    {/* Compact Circular Image Container - Smaller Size */}
                    <div className="relative w-24 h-24 md:w-40 md:h-40 lg:w-52 lg:h-52 transition-transform duration-500 group-hover:scale-105">
                      <div className={`absolute inset-0 ${theme[0]} rounded-full scale-0 group-hover:scale-125 transition-transform duration-500 opacity-15 blur-lg`} />
                      <div
                        onClick={() => member.linkedin && member.linkedin !== '#' && window.open(member.linkedin, '_blank')}
                        className={`w-full h-full rounded-full overflow-hidden border-4 border-white shadow-lg group-hover:shadow-2xl group-hover:${theme[2]} transition-all duration-500 relative z-10 ${member.linkedin && member.linkedin !== '#' ? 'cursor-pointer' : ''}`}
                      >
                        <img
                          src={member.image}
                          alt={member.name}
                          className={`w-full h-full object-cover transition-all duration-700 ${member.id === 2 ? 'object-[center_20%]' : [1, 3].includes(member.id) ? 'object-[center_37%]' : 'object-center'}`}
                          onError={(e) => {
                            e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name)}&background=random&color=fff&size=512&bold=true`;
                          }}
                        />
                      </div>
                      {/* Floating Badge (Instagram Link) */}
                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          if (member.instagram && member.instagram !== '#') {
                            window.open(member.instagram, '_blank');
                          }
                        }}
                        className={`absolute -bottom-1 -right-1 w-9 h-9 md:w-12 md:h-12 bg-white rounded-full shadow-md flex items-center justify-center z-20 scale-0 group-hover:scale-110 transition-all duration-500 delay-75 border border-gray-50 cursor-pointer hover:rotate-12`}
                      >
                        <Rocket className={`${theme[1]} w-4 h-4 md:w-5 md:h-5`} />
                      </div>
                    </div>

                    {/* Minimalist Text Info */}
                    <div className="space-y-1">
                      <h4 className="text-base md:text-lg font-black text-[#1E293B] group-hover:text-blue-600 transition-colors duration-300">
                        {member.name}
                      </h4>
                      <p className={`${theme[1]} text-[10px] md:text-xs font-black uppercase tracking-[0.2em] opacity-80`}>
                        {member.role}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Features Section */}
          <div className="space-y-6">
            <h3 className="text-2xl font-black text-[#1E293B] px-2 flex items-center gap-3">
              <span className="w-8 h-1 bg-blue-600 rounded-full"></span>
              Core Features
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                {
                  title: 'Performance Analytics',
                  desc: 'Track student progress with detailed dashboards showing marks, trends, strengths, and weak areas for better academic insights.',
                  icon: BarChart2,
                  bg: 'bg-blue-50',
                  color: 'text-blue-600',
                  emoji: ''
                },
                {
                  title: 'Smart Attendance System',
                  desc: 'Secure code-based attendance marking with time validation to ensure only real-time classroom participation.',
                  icon: CalendarCheck,
                  bg: 'bg-emerald-50',
                  color: 'text-emerald-600',
                  emoji: ''
                },
                {
                  title: 'Test & Assignment System',
                  desc: 'Create, manage, and evaluate tests and assignments with instant results and feedback for students.',
                  icon: ClipboardCheck,
                  bg: 'bg-indigo-50',
                  color: 'text-indigo-600',
                  emoji: ''
                },
                {
                  title: 'Real-time Notifications',
                  desc: 'Get instant alerts for tests, submissions, results, and attendance warnings to stay updated at all times.',
                  icon: Bell,
                  bg: 'bg-rose-50',
                  color: 'text-rose-600',
                  emoji: ''
                }
              ].map((feature, i) => (
                <div key={i} className="group bg-white p-8 rounded-[32px] shadow-lg border border-gray-100 flex flex-col gap-5 hover:scale-[1.03] active:scale-[0.98] hover:shadow-2xl hover:shadow-blue-900/10 transition-all duration-500 cursor-default relative overflow-hidden">
                  {/* Background decoration */}
                  <div className={`absolute top-0 right-0 w-32 h-32 ${feature.bg} opacity-0 group-hover:opacity-40 rounded-full -translate-y-16 translate-x-16 blur-2xl transition-opacity duration-500`} />

                  <div className="flex items-center gap-4">
                    <div className={`w-14 h-14 ${feature.bg} rounded-2xl flex items-center justify-center transition-all duration-500 group-hover:rotate-12 group-hover:scale-110 shadow-inner`}>
                      <feature.icon className={feature.color} size={28} />
                    </div>
                    <h4 className="text-lg md:text-xl font-black text-[#1E293B] group-hover:text-blue-600 transition-colors">
                      {feature.emoji} {feature.title}
                    </h4>
                  </div>
                  <p className="text-gray-500 leading-relaxed text-sm md:text-base">
                    {feature.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-12">
          <Footer />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-inter">
      <BlobSidebar />

      {/* Hero Section - Professional Blue Gradient */}
      <div className={`bg-gradient-to-br from-[#2563EB] to-[#1E40AF] pt-24 pb-32 px-6 md:pt-16 md:pb-24 text-white text-center relative overflow-hidden md:rounded-b-[80px] rounded-b-[40px] shadow-lg`}>
        <div className="absolute top-0 left-0 w-full h-full">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-white/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-900/20 rounded-full blur-3xl" />
        </div>

        <button
          onClick={() => navigate('/')}
          className="absolute top-8 left-8 flex items-center gap-2 text-white/80 hover:text-white transition-colors font-semibold text-sm bg-white/10 backdrop-blur-md px-4 py-2 rounded-xl border border-white/20 z-30"
        >
          <ArrowLeft size={16} /> Back
        </button>

        <div className="relative z-10 flex flex-col items-center text-center">
          <div className="w-20 h-20 bg-white/20 backdrop-blur-xl rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl border border-white/30 rotate-3 mt-8 md:mt-4">
            <Icon size={40} className="text-white" />
          </div>
          <h1 className="text-4xl md:text-6xl font-black mb-4 tracking-tight uppercase text-white">{content.title}</h1>
          <p className="text-white/90 max-w-2xl mx-auto text-lg leading-relaxed font-medium mt-4">
            {content.description}
          </p>
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-6 pb-20 -mt-16 relative z-20">
        <div className={`bg-white rounded-[40px] shadow-2xl overflow-hidden border border-gray-100`}>
          {type === 'feedback' ? (
            <div className="animate-fade-in p-8 md:p-12">
              <div className="space-y-12">
                <div className="border-b border-gray-100 pb-10">
                  <h2 className="text-3xl font-black text-gray-900 mb-4 uppercase tracking-tighter flex items-center gap-4">
                    <span className="w-3 h-10 bg-blue-600 rounded-full" />
                    Share Your Thoughts
                  </h2>
                  <p className="text-gray-500 text-lg leading-relaxed max-w-2xl">
                    We're committed to making <span className="text-blue-600 font-bold uppercase">SES</span> the best academic platform. Your feedback is crucial.
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-12">
                  {!user && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-3">
                        <label className="text-sm font-black text-gray-900 uppercase tracking-widest">Your Name *</label>
                        <input
                          type="text"
                          placeholder="Full Name"
                          className="w-full px-8 py-5 bg-gray-50 border-gray-100 border-2 rounded-[28px] focus:bg-white focus:border-blue-600 transition-all outline-none font-bold"
                          value={feedbackForm.name}
                          onChange={e => setFeedbackForm({ ...feedbackForm, name: e.target.value })}
                          required
                        />
                      </div>
                      <div className="space-y-3">
                        <label className="text-sm font-black text-gray-900 uppercase tracking-widest">Email Address *</label>
                        <input
                          type="email"
                          placeholder="Email"
                          className="w-full px-8 py-5 bg-gray-50 border-gray-100 border-2 rounded-[28px] focus:bg-white focus:border-blue-600 transition-all outline-none font-bold"
                          value={feedbackForm.email}
                          onChange={e => setFeedbackForm({ ...feedbackForm, email: e.target.value })}
                          required
                        />
                      </div>
                    </div>
                  )}

                  <div className="space-y-6">
                    <label className="text-sm font-black text-gray-900 uppercase tracking-widest">Feedback Type *</label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                      {feedbackTypes.map((t) => (
                        <button
                          type="button"
                          key={t.id}
                          onClick={() => setFeedbackForm({ ...feedbackForm, type: t.id })}
                          className={`flex flex-col items-center justify-center p-8 rounded-[36px] border-2 transition-all duration-300 relative group
                            ${feedbackForm.type === t.id ? 'border-blue-600 bg-blue-50 ring-8 ring-blue-600/5' : 'border-gray-50 bg-gray-50/50 hover:border-gray-200'}`}
                        >
                          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 transition-transform group-hover:rotate-6 shadow-lg ${feedbackForm.type === t.id ? 'bg-blue-600 text-white' : 'bg-white text-gray-400 border border-gray-100'}`}>
                            <t.icon size={32} />
                          </div>
                          <span className={`text-xs font-black uppercase tracking-widest ${feedbackForm.type === t.id ? 'text-blue-700' : 'text-gray-500'}`}>{t.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-sm font-black text-gray-900 uppercase tracking-widest">Message *</label>
                    <textarea
                      rows={6}
                      placeholder="Share your thoughts..."
                      className="w-full p-8 bg-gray-50 border-gray-100 border-2 rounded-[40px] focus:bg-white focus:border-blue-600 transition-all outline-none font-bold resize-none"
                      value={feedbackForm.message}
                      onChange={e => setFeedbackForm({ ...feedbackForm, message: e.target.value })}
                      required
                    />
                  </div>

                  <div className="flex justify-center pt-6">
                    <button
                      type="submit"
                      disabled={loading}
                      className={`w-full sm:w-auto min-w-[240px] py-6 rounded-[32px] font-black uppercase tracking-widest transition-all shadow-2xl active:scale-[0.98] flex items-center justify-center gap-4 ${submitted ? 'bg-emerald-500 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/40'}`}
                    >
                      {loading ? <Loader2 className="animate-spin" /> : submitted ? <CheckCircle2 /> : <Send />}
                      <span className="text-lg">{loading ? 'Sending...' : submitted ? 'Sent!' : 'Submit'}</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          ) : type === 'contact' ? (
            <div className="animate-fade-in pt-24 pb-20 px-6 space-y-12">
              {/* Message Card (Primary Focus) */}
              <div className="max-w-3xl mx-auto">
                <div className="bg-white rounded-[40px] shadow-2xl border border-gray-100 overflow-hidden">
                  <div className="p-8 md:p-14 space-y-10">
                    <div className="border-b border-gray-100 pb-6 flex items-center justify-between">
                      <h2 className="text-xl md:text-2xl font-black text-gray-900 tracking-tight uppercase">Send a Message</h2>
                      <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-300">
                        <Mail size={20} />
                      </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-8">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                        {!user && (
                          <>
                            <div className="space-y-1.5">
                              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Your Name</label>
                              <input
                                type="text"
                                placeholder="Full Name"
                                className="w-full border-b border-gray-200 py-2.5 focus:border-[#2563EB] outline-none transition-colors text-gray-800 font-bold bg-transparent text-base"
                                value={contactForm.name}
                                onChange={e => setContactForm({ ...contactForm, name: e.target.value })}
                                required
                              />
                            </div>
                            <div className="space-y-1.5">
                              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Email Address</label>
                              <input
                                type="email"
                                placeholder="name@email.com"
                                className="w-full border-b border-gray-200 py-2.5 focus:border-[#2563EB] outline-none transition-colors text-gray-800 font-bold bg-transparent text-base"
                                value={contactForm.email}
                                onChange={e => setContactForm({ ...contactForm, email: e.target.value })}
                                required
                              />
                            </div>
                          </>
                        )}
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Phone</label>
                          <input
                            type="tel"
                            placeholder="+91 00000 00000"
                            className="w-full border-b border-gray-200 py-2.5 focus:border-[#2563EB] outline-none transition-colors text-gray-800 font-bold bg-transparent text-base"
                            value={contactForm.phone}
                            onChange={e => setContactForm({ ...contactForm, phone: e.target.value })}
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Subject</label>
                          <div className="relative group">
                            <select
                              className="w-full border-b border-gray-200 py-2.5 focus:border-[#2563EB] outline-none transition-colors text-gray-800 font-bold bg-transparent appearance-none cursor-pointer text-base pr-8"
                              value={contactForm.subject}
                              onChange={e => setContactForm({ ...contactForm, subject: e.target.value })}
                              required
                            >
                              <option value="" disabled>Select a subject</option>
                              <option value="Technical Issue">Technical Issue</option>
                              <option value="General Inquiry">General Inquiry</option>
                              <option value="Support Request">Support Request</option>
                              <option value="Academic Issue">Academic Issue</option>
                              <option value="Other">Other</option>
                            </select>
                            <ChevronDown className="absolute right-0 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none group-focus-within:text-[#2563EB] transition-colors" size={18} />
                          </div>
                        </div>
                        <div className="md:col-span-2 space-y-1.5">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Message</label>
                          <textarea
                            rows={2}
                            placeholder="Tell us about your inquiry..."
                            className="w-full border-b border-gray-200 py-2.5 focus:border-[#2563EB] outline-none transition-colors text-gray-800 font-bold bg-transparent resize-none text-base"
                            value={contactForm.message}
                            onChange={e => setContactForm({ ...contactForm, message: e.target.value })}
                            required
                          />
                        </div>
                      </div>

                      <div className="flex justify-center pt-4">
                        <button
                          type="submit"
                          disabled={loading}
                          className={`w-full md:w-auto min-w-[240px] py-5 rounded-[24px] font-black uppercase tracking-widest transition-all shadow-xl active:scale-[0.98] group flex items-center justify-center gap-3 ${submitted ? 'bg-emerald-500 text-white' : 'bg-[#2563EB] text-white shadow-[#2563EB]/20'}`}
                        >
                          {loading ? <Loader2 className="animate-spin" size={20} /> : submitted ? <CheckCircle2 size={20} /> : <Send size={20} />}
                          <span className="text-lg">{loading ? 'Sending...' : submitted ? 'Sent!' : 'Submit Message'}</span>
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>

              {/* Minimalist Footer-Style Info exactly like the image */}
              <div className="max-w-xl mx-auto text-center pt-8 pb-4 space-y-8">
                <div className="space-y-3">
                  <h1 className="text-3xl font-black text-[#1E293B] tracking-tight uppercase">Get In Touch</h1>
                  <p className="text-gray-500 text-base font-medium leading-relaxed max-w-xs mx-auto">
                    Have questions or need support? We're here to help you.
                  </p>
                </div>

                <div className="flex flex-col items-center space-y-6 pt-2">
                  <div className="flex items-center gap-4 w-full max-w-[300px]">
                    <div className="w-8 h-8 flex items-center justify-center text-blue-600">
                      <Mail size={22} fill="currentColor" fillOpacity={0.1} />
                    </div>
                    <a href="mailto:studentevalsystem@gmail.com" className="text-[#1E293B] font-bold text-base hover:text-blue-600 transition-colors">studentevalsystem@gmail.com</a>
                  </div>
                  <div className="flex items-start gap-4 w-full max-w-[300px]">
                    <div className="w-8 h-8 flex items-center justify-center text-blue-600 mt-0.5">
                      <Phone size={22} fill="currentColor" fillOpacity={0.1} />
                    </div>
                    <div className="flex flex-col text-left">
                      <a href="tel:+919579970183" className="text-[#1E293B] font-bold text-base hover:text-blue-600 transition-colors">+91 9579970183</a>
                      <a href="tel:+917972815280" className="text-[#1E293B] font-bold text-base hover:text-blue-600 transition-colors">+91 7972815280</a>
                    </div>
                  </div>
                  <div className="flex items-start gap-4 w-full max-w-[300px] text-left">
                    <div className="w-8 h-8 flex items-center justify-center text-blue-600 flex-shrink-0">
                      <MapPin size={22} fill="currentColor" fillOpacity={0.1} />
                    </div>
                    <p className="text-[#1E293B] font-bold text-base leading-tight">Government Polytechnic, Nashik</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (type === 'privacy' || type === 'terms') && content.sections ? (
            <div className="animate-fade-in p-8 md:p-12 space-y-12">
              {content.sections.map((section, idx) => (
                <div key={idx} className="relative group">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="flex-shrink-0 w-12 h-12 bg-blue-50 text-[#2563EB] rounded-2xl flex items-center justify-center border border-blue-100 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-sm shadow-blue-500/10">
                      <section.icon size={24} />
                    </div>
                    <h2 className="text-2xl font-black text-gray-900 tracking-tight">{section.title}</h2>
                    <div className="flex-grow h-[1px] bg-gradient-to-r from-blue-100 to-transparent hidden sm:block"></div>
                  </div>

                  <div className="pl-0 sm:pl-16 space-y-6">
                    {section.content && (
                      <p className="text-gray-600 text-base md:text-lg leading-relaxed">
                        {section.content}
                      </p>
                    )}

                    {section.items && (
                      <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {section.items.map((item, i) => (
                          <li key={i} className="flex items-start gap-3 bg-blue-50/20 p-4 rounded-2xl border border-blue-50 group/item hover:border-blue-200 hover:bg-white hover:shadow-lg hover:shadow-blue-500/5 transition-all">
                            <div className="w-5 h-5 rounded-full bg-[#2563EB]/10 flex items-center justify-center mt-0.5 group-hover/item:bg-[#2563EB] transition-colors">
                              <div className="w-1.5 h-1.5 rounded-full bg-[#2563EB] group-hover/item:bg-white" />
                            </div>
                            <span className="text-gray-700 font-medium text-sm md:text-base">{item}</span>
                          </li>
                        ))}
                      </ul>
                    )}

                    {section.subsections && (
                      <div className="space-y-8 mt-4">
                        {section.subsections.map((sub, i) => (
                          <div key={i} className="bg-white rounded-[32px] p-6 border border-blue-50 shadow-sm hover:shadow-md transition-shadow">
                            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                              <span className="w-1.5 h-6 bg-[#2563EB] rounded-full" />
                              {sub.subtitle}
                            </h3>
                            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              {sub.items.map((item, j) => (
                                <li key={j} className="text-gray-600 text-sm flex items-center gap-2">
                                  <div className="w-1.5 h-1.5 rounded-full bg-blue-300" />
                                  {item}
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    )}

                    {section.footer && (
                      <p className="text-gray-500 italic text-sm mt-4 p-4 bg-blue-50/30 rounded-2xl border-l-4 border-[#2563EB] whitespace-pre-line">
                        {section.footer}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 md:p-12">
              <h2 className="text-2xl font-black text-gray-900 mb-8 flex items-center gap-3">
                <span className={`w-2 h-8 bg-[#2563EB] rounded-full`} />
                Details
              </h2>
              <p className="text-gray-600 text-lg leading-relaxed mb-12">
                {content.text}
              </p>
            </div>
          )}
        </div>
      </main>

      <div className="mt-12">
        <Footer />
      </div>
    </div>
  );
};

export default InfoPage;
