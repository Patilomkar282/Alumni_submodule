import React, { useState, useEffect, useRef } from 'react';
import { X, Send, Paperclip, Mic, FileText, Check, CheckCheck, Square, Play, Pause, Trash2 } from 'lucide-react';

export default function ChatBox({ mentor, onClose }) {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'mentor',
      text: `Hi! I'm happy to connect and help you with your career journey. What would you like to discuss?`,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'read',
      reactions: [],
      type: 'text'
    }
  ]);
  
  const [isTyping, setIsTyping] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [audioChunks, setAudioChunks] = useState([]);
  
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  useEffect(scrollToBottom, [messages, isTyping]);

  // Handle Recording Timer
  useEffect(() => {
    let interval;
    if (isRecording) {
      interval = setInterval(() => setRecordingTime(prev => prev + 1), 1000);
    } else {
      setRecordingTime(0);
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  const handleSendText = () => {
    if (message.trim()) {
      sendMessageObject({ type: 'text', text: message });
      setMessage('');
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
        sendMessageObject({
            type: 'file',
            text: '',
            fileName: file.name,
            fileUrl: reader.result // Base64 encoding
        });
    };
    reader.readAsDataURL(file);
  };

  const startRecording = async () => {
      try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          const recorder = new MediaRecorder(stream);
          const chunks = [];
          
          recorder.ondataavailable = (e) => chunks.push(e.data);
          recorder.onstop = () => {
              const audioBlob = new Blob(chunks, { type: 'audio/webm' });
              const reader = new FileReader();
              reader.onloadend = () => {
                  sendMessageObject({
                      type: 'audio',
                      text: '',
                      fileUrl: reader.result
                  });
              };
              reader.readAsDataURL(audioBlob);
          };

          recorder.start();
          setMediaRecorder(recorder);
          setIsRecording(true);
      } catch (err) {
          console.error("Audio recording failed", err);
          alert("Microphone permission denied or not available.");
      }
  };

  const stopRecording = () => {
      if (mediaRecorder && mediaRecorder.state !== 'inactive') {
          mediaRecorder.stop();
          mediaRecorder.stream.getTracks().forEach(track => track.stop());
      }
      setIsRecording(false);
  };

  const sendMessageObject = (msgData) => {
    const newMessage = {
      id: Date.now(),
      sender: 'user',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'sent', // sent -> delivered -> read
      reactions: [],
      ...msgData
    };
    
    setMessages(prev => [...prev, newMessage]);

    // Simulate sending flow (Sent -> Delivered -> Read)
    setTimeout(() => updateMessageStatus(newMessage.id, 'delivered'), 800);
    setTimeout(() => {
        updateMessageStatus(newMessage.id, 'read');
        // Trigger Mentor Typing Simulation
        setIsTyping(true);
        setTimeout(() => {
            setIsTyping(false);
            setMessages(prev => [...prev, {
                id: Date.now() + 1,
                sender: 'mentor',
                text: "That sounds great! I'll review and get back to you.",
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                status: 'read',
                reactions: [],
                type: 'text'
            }]);
        }, 2000);
    }, 1500);
  };

  const updateMessageStatus = (id, newStatus) => {
      setMessages(prev => prev.map(m => m.id === id ? { ...m, status: newStatus } : m));
  };

  const toggleReaction = (msgId, emoji) => {
      setMessages(prev => prev.map(m => {
          if (m.id === msgId) {
              const existing = m.reactions.find(r => r.emoji === emoji);
              if (existing) {
                  return { ...m, reactions: m.reactions.filter(r => r.emoji !== emoji) };
              }
              return { ...m, reactions: [...m.reactions, { emoji, count: 1 }] };
          }
          return m;
      }));
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 w-[400px] h-[600px] bg-white rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.2)] flex flex-col animate-slideInRight overflow-hidden border border-gray-100">
      {/* Header */}
      <div className="bg-white/90 backdrop-blur-md border-b border-gray-100 px-5 py-4 flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <div className="relative">
              <img src={mentor.image} alt={mentor.name} className="w-12 h-12 rounded-full object-cover shadow-sm" />
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
          </div>
          <div>
            <h3 className="text-gray-900 font-bold text-base">{mentor.name}</h3>
            {isTyping ? (
                <p className="text-indigo-600 text-xs font-semibold animate-pulse">typing...</p>
            ) : (
                <p className="text-gray-500 text-xs font-medium">Online</p>
            )}
          </div>
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full p-2 transition-all">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-5 space-y-6 bg-[#f8fafc] bg-[url('https://www.transparenttextures.com/patterns/cream-paper.png')]">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'} group relative`}>
            
            <div className={`relative max-w-[80%] rounded-2xl px-4 py-3 shadow-sm ${
                msg.sender === 'user'
                  ? 'bg-gradient-to-br from-indigo-500 to-blue-600 text-white rounded-br-none'
                  : 'bg-white text-gray-800 border border-gray-100 rounded-bl-none'
              }`}
            >
              {/* Message Content Base */}
              {msg.type === 'text' && <p className="text-[15px] leading-relaxed break-words">{msg.text}</p>}
              
              {msg.type === 'file' && (
                  <div className="flex items-center gap-3 bg-black/10 p-3 rounded-xl border border-white/20">
                      <div className="p-2 bg-white text-indigo-600 rounded-lg"><FileText className="w-6 h-6" /></div>
                      <div className="truncate flex-1">
                          <p className="text-sm font-bold truncate max-w-[150px]">{msg.fileName}</p>
                          <p className="text-xs opacity-80">Document • PDF</p>
                      </div>
                  </div>
              )}

              {msg.type === 'audio' && (
                  <div className="flex items-center gap-3 bg-black/10 p-2 rounded-full pr-4">
                      <button className="p-2 bg-white text-indigo-600 rounded-full"><Play className="w-4 h-4 ml-0.5" /></button>
                      <div className="w-24 h-1 bg-white/30 rounded-full overflow-hidden">
                          <div className="w-1/3 h-full bg-white rounded-full"></div>
                      </div>
                      <span className="text-xs font-medium">0:12</span>
                  </div>
              )}

              {/* Meta information row (Time and Status) */}
              <div className={`flex items-center justify-end gap-1.5 mt-1.5 ${msg.sender === 'user' ? 'text-blue-100' : 'text-gray-400'}`}>
                <p className="text-[10px] font-medium">{msg.time}</p>
                {msg.sender === 'user' && (
                    <span className="flex items-center">
                        {msg.status === 'sent' && <Check className="w-3.5 h-3.5 text-blue-200" />}
                        {msg.status === 'delivered' && <CheckCheck className="w-3.5 h-3.5 text-blue-200" />}
                        {msg.status === 'read' && <CheckCheck className="w-3.5 h-3.5 text-cyan-300" />}
                    </span>
                )}
              </div>

              {/* Reactions Bar Overlay */}
              <div className={`absolute -top-4 ${msg.sender === 'user' ? 'left-0' : 'right-0'} bg-white shadow-xl rounded-full px-2 py-1 flex items-center gap-1 border border-gray-100 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10`}>
                  {['👍', '🔥', '👏', '❤️'].map(emoji => (
                      <button key={emoji} onClick={() => toggleReaction(msg.id, emoji)} className="hover:scale-125 transition-transform text-lg leading-none cursor-pointer">{emoji}</button>
                  ))}
              </div>

              {/* Rendered Reactions */}
              {msg.reactions.length > 0 && (
                  <div className={`absolute -bottom-3 ${msg.sender === 'user' ? 'left-2' : 'right-2'} flex gap-0.5`}>
                      {msg.reactions.map((r, i) => (
                          <div key={i} className="bg-white border border-gray-200 shadow-sm rounded-full px-1.5 py-0.5 text-xs flex items-center">
                              {r.emoji}
                          </div>
                      ))}
                  </div>
              )}

            </div>
          </div>
        ))}
        
        {/* Typing indicator bubble */}
        {isTyping && (
            <div className="flex justify-start">
               <div className="bg-white border border-gray-100 shadow-sm rounded-2xl rounded-bl-none px-4 py-3 flex gap-1.5">
                   <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                   <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                   <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
               </div>
            </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white border-t border-gray-100 z-10">
        
        {/* Hidden File Input */}
        <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept=".pdf,.doc,.docx,image/*" />

        {isRecording ? (
            <div className="flex items-center gap-3 bg-red-50 p-2 rounded-full border border-red-100 animate-pulse">
                <div className="w-3 h-3 rounded-full bg-red-500 ml-3"></div>
                <span className="text-red-500 font-bold flex-1">{formatTime(recordingTime)}</span>
                <button onClick={stopRecording} className="bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-all shadow-md">
                    <Send className="w-5 h-5" />
                </button>
                <button onClick={() => { stopRecording(); /* Cancel logic could go here */ }} className="text-gray-400 p-2 hover:text-red-500">
                    <Trash2 className="w-5 h-5" />
                </button>
            </div>
        ) : (
            <div className="flex items-end gap-2">
                <button onClick={() => fileInputRef.current.click()} className="text-gray-400 hover:text-indigo-600 transition-colors p-2.5 bg-gray-50 hover:bg-indigo-50 rounded-full">
                    <Paperclip className="w-5 h-5" />
                </button>
                
                <div className="flex-1 bg-gray-50 border border-gray-200 rounded-3xl flex items-end overflow-hidden focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-transparent transition-all">
                    <textarea
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        onKeyPress={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendText(); } }}
                        placeholder="Type a message..."
                        className="w-full bg-transparent px-4 py-3 text-sm focus:outline-none resize-none max-h-32 min-h-[44px]"
                        rows={1}
                    />
                </div>

                {message.trim() ? (
                    <button onClick={handleSendText} className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white p-3 rounded-full hover:from-indigo-700 hover:to-blue-700 transition-all shadow-md transform hover:scale-105">
                        <Send className="w-5 h-5 ml-0.5" />
                    </button>
                ) : (
                    <button onClick={startRecording} className="bg-gray-50 text-gray-500 p-3 rounded-full hover:bg-gray-100 hover:text-indigo-600 transition-all">
                        <Mic className="w-5 h-5" />
                    </button>
                )}
            </div>
        )}
      </div>

      <style>{`
        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(100%) scale(0.95); }
          to { opacity: 1; transform: translateX(0) scale(1); }
        }
        .animate-slideInRight {
          animation: slideInRight 0.35s cubic-bezier(0.16, 1, 0.3, 1);
        }
      `}</style>
    </div>
  );
}