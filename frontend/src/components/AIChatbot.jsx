import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { X, Send, Bot, User, Loader2, Sparkles, Trash2, ChevronDown } from 'lucide-react';

// Markdown-like renderer for AI responses
function MessageContent({ content }) {
  const parts = content.split(/```([\s\S]*?)```/g);
  return (
    <div className="text-sm leading-relaxed space-y-2">
      {parts.map((part, i) => {
        if (i % 2 === 1) {
          // Code block
          return (
            <pre key={i} className="bg-gray-900 text-green-400 rounded-lg p-3 text-xs overflow-x-auto font-mono">
              {part}
            </pre>
          );
        }
        // Regular text - render bold, line breaks
        const lines = part.split('\n').filter(l => l.trim() !== '');
        return (
          <div key={i} className="space-y-1">
            {lines.map((line, j) => {
              const boldLine = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
              if (line.startsWith('### ')) return <p key={j} className="font-bold text-gray-800 mt-2" dangerouslySetInnerHTML={{ __html: boldLine.replace('### ', '') }} />;
              if (line.startsWith('## ')) return <p key={j} className="font-bold text-gray-800 text-base mt-2" dangerouslySetInnerHTML={{ __html: boldLine.replace('## ', '') }} />;
              if (line.startsWith('# ')) return <p key={j} className="font-bold text-gray-900 text-lg mt-2" dangerouslySetInnerHTML={{ __html: boldLine.replace('# ', '') }} />;
              if (line.match(/^[\-\*] /)) return <p key={j} className="flex gap-2"><span className="text-blue-500 mt-0.5">•</span><span dangerouslySetInnerHTML={{ __html: boldLine.replace(/^[\-\*] /, '') }} /></p>;
              if (line.match(/^\d+\. /)) return <p key={j} className="flex gap-2"><span className="text-blue-500 font-bold min-w-[1.2rem]">{line.match(/^\d+/)[0]}.</span><span dangerouslySetInnerHTML={{ __html: boldLine.replace(/^\d+\. /, '') }} /></p>;
              return <p key={j} dangerouslySetInnerHTML={{ __html: boldLine }} />;
            })}
          </div>
        );
      })}
    </div>
  );
}

const WELCOME_MESSAGES = {
  faculty: "Hello, Professor! 👋 I'm your AI academic assistant powered by **Llama 3.1**. I can help you create questions, design assignments, explain concepts, debug code, and much more. How can I assist you today?",
  student: "Hello! 👋 I'm your AI study buddy powered by **Llama 3.1**. I can help you understand concepts, solve problems, write code, and prepare for exams. What would you like to learn today?"
};

const QUICK_PROMPTS_BY_ROLE = {
  faculty: [
    "Generate 5 MCQ questions on Data Structures",
    "Create a rubric for a programming assignment",
    "Explain how to teach recursion effectively",
    "Suggest topics for a 30-mark exam on OOP",
  ],
  student: [
    "Explain sorting algorithms with examples",
    "Help me debug my Python code",
    "What is the difference between stack and queue?",
    "Explain OOP concepts in simple words",
  ]
};

export default function AIChatbot() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showQuickPrompts, setShowQuickPrompts] = useState(true);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const role = user?.role || 'student';
  const quickPrompts = QUICK_PROMPTS_BY_ROLE[role] || QUICK_PROMPTS_BY_ROLE.student;

  // Auto-scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen && !isMinimized) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, isMinimized]);

  const openChat = () => {
    setIsOpen(true);
    setIsMinimized(false);
    // Set welcome message if first time
    if (messages.length === 0) {
      setMessages([{
        role: 'assistant',
        content: WELCOME_MESSAGES[role] || WELCOME_MESSAGES.student,
        timestamp: new Date()
      }]);
    }
  };

  const sendMessage = async (text) => {
    const msgText = (text || input).trim();
    if (!msgText || loading) return;

    setInput('');
    setShowQuickPrompts(false);

    const userMsg = { role: 'user', content: msgText, timestamp: new Date() };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setLoading(true);

    try {
      const res = await axios.post('/ai/chat', {
        messages: updatedMessages.map(m => ({ role: m.role, content: m.content })),
        role: user?.role
      });

      const assistantMsg = {
        role: 'assistant',
        content: res.data.reply,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, assistantMsg]);
    } catch (err) {
      const errorMsg = {
        role: 'assistant',
        content: "I'm sorry, I encountered an error. Please try again in a moment. 🔄",
        timestamp: new Date(),
        isError: true
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearChat = () => {
    setMessages([{
      role: 'assistant',
      content: WELCOME_MESSAGES[role] || WELCOME_MESSAGES.student,
      timestamp: new Date()
    }]);
    setShowQuickPrompts(true);
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <button
          onClick={openChat}
          className="fixed bottom-6 right-6 z-50 group"
          aria-label="Open AI Chatbot"
        >
          <div className="relative">
            {/* Pulse ring */}
            <div className="absolute inset-0 rounded-full bg-blue-500 animate-ping opacity-30 scale-110" />
            <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-full flex items-center justify-center shadow-2xl shadow-blue-500/40 group-hover:scale-110 transition-transform duration-200">
              <Sparkles size={24} className="text-white" />
            </div>
            {/* Tooltip */}
            <div className="absolute bottom-full right-0 mb-2 bg-gray-900 text-white text-xs px-3 py-1.5 rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity shadow-lg">
              AI Study Assistant
              <div className="absolute top-full right-4 border-4 border-transparent border-t-gray-900" />
            </div>
          </div>
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className={`fixed bottom-6 right-6 z-50 w-[370px] bg-white rounded-2xl shadow-2xl border border-gray-100 flex flex-col overflow-hidden transition-all duration-300 ${isMinimized ? 'h-14' : 'h-[580px]'}`}>

          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-4 py-3 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">
                <Sparkles size={18} className="text-white" />
              </div>
              <div>
                <p className="text-white font-bold text-sm">AI Study Assistant</p>
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                  <p className="text-blue-100 text-xs">Llama 3.1 · Online</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={clearChat}
                className="w-8 h-8 bg-white/10 hover:bg-white/20 rounded-lg flex items-center justify-center transition-colors"
                title="Clear chat"
              >
                <Trash2 size={14} className="text-white" />
              </button>
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                className="w-8 h-8 bg-white/10 hover:bg-white/20 rounded-lg flex items-center justify-center transition-colors"
              >
                <ChevronDown size={14} className={`text-white transition-transform ${isMinimized ? 'rotate-180' : ''}`} />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 bg-white/10 hover:bg-red-400/40 rounded-lg flex items-center justify-center transition-colors"
              >
                <X size={14} className="text-white" />
              </button>
            </div>
          </div>

          {!isMinimized && (
            <>
              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">

                {/* Messages */}
                {messages.map((msg, i) => (
                  <div key={i} className={`flex gap-2.5 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                    {/* Avatar */}
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === 'user' ? 'bg-blue-600' : 'bg-gradient-to-br from-indigo-500 to-blue-600'}`}>
                      {msg.role === 'user'
                        ? <User size={14} className="text-white" />
                        : <Bot size={14} className="text-white" />
                      }
                    </div>
                    <div className={`max-w-[80%] ${msg.role === 'user' ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                      <div className={`rounded-2xl px-4 py-3 ${
                        msg.role === 'user'
                          ? 'bg-blue-600 text-white rounded-tr-sm'
                          : msg.isError
                            ? 'bg-red-50 border border-red-100 rounded-tl-sm'
                            : 'bg-white shadow-sm border border-gray-100 rounded-tl-sm'
                      }`}>
                        {msg.role === 'user'
                          ? <p className="text-sm text-white leading-relaxed">{msg.content}</p>
                          : <MessageContent content={msg.content} />
                        }
                      </div>
                      <span className="text-[10px] text-gray-400 px-1">{formatTime(msg.timestamp)}</span>
                    </div>
                  </div>
                ))}

                {/* Typing Indicator */}
                {loading && (
                  <div className="flex gap-2.5">
                    <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                      <Bot size={14} className="text-white" />
                    </div>
                    <div className="bg-white shadow-sm border border-gray-100 rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-1.5">
                      <Loader2 size={14} className="text-blue-500 animate-spin" />
                      <span className="text-xs text-gray-400">AI is thinking...</span>
                    </div>
                  </div>
                )}

                {/* Quick Prompts */}
                {showQuickPrompts && messages.length <= 1 && (
                  <div className="space-y-1.5">
                    <p className="text-xs text-gray-400 font-medium px-1">💡 Try asking:</p>
                    {quickPrompts.map((prompt, i) => (
                      <button
                        key={i}
                        onClick={() => sendMessage(prompt)}
                        className="w-full text-left text-xs bg-white border border-gray-100 hover:border-blue-300 hover:bg-blue-50 rounded-xl px-3 py-2.5 text-gray-600 transition-colors shadow-sm"
                      >
                        {prompt}
                      </button>
                    ))}
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <div className="border-t border-gray-100 p-3 bg-white flex-shrink-0">
                <div className="flex items-end gap-2">
                  <textarea
                    ref={inputRef}
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask anything academic..."
                    rows={1}
                    className="flex-1 resize-none border-2 border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-400 transition-colors max-h-28 overflow-y-auto"
                    style={{ lineHeight: '1.4' }}
                    disabled={loading}
                  />
                  <button
                    onClick={() => sendMessage()}
                    disabled={!input.trim() || loading}
                    className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl flex items-center justify-center flex-shrink-0 transition-all shadow-md"
                  >
                    <Send size={16} className="text-white" />
                  </button>
                </div>
                <p className="text-center text-[10px] text-gray-300 mt-2">Enter to send · Shift+Enter for new line</p>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}
