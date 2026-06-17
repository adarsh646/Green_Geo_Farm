import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, X, Send, Bot, User, Minus } from 'lucide-react';
import './Chatbot.css';

const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { id: 1, text: "Hello! I am AgroAI. How can I assist with your herd management today?", sender: 'bot' }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const responses = [
    "I've analyzed the latest biometrics. Tag TX-402 shows optimal rumination levels.",
    "The genetic potential for the Angus herd is currently at 92% efficiency.",
    "Would you like me to generate a health diagnostic report for Unit 01?",
    "Weather sensors indicate a drop in temperature. I recommend checking the shelter ventilation.",
    "Feed stock for 'Corn Silage' is at 24%. Should I notify the procurement team?",
    "Live monitoring is active. All head counts are verified in the North Pasture."
  ];

  const handleSend = () => {
    if (!input.trim()) return;

    const userMsg = { id: Date.now(), text: input, sender: 'user' };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    // Dummy Bot response logic
    setTimeout(() => {
      const randomResponse = responses[Math.floor(Math.random() * responses.length)];
      const botMsg = { id: Date.now() + 1, text: randomResponse, sender: 'bot' };
      setMessages(prev => [...prev, botMsg]);
      setIsTyping(false);
    }, 1200);
  };

  return (
    <div className="agro-chatbot-wrapper">
      {/* ── Trigger ── */}
      <button className="chatbot-trigger" onClick={() => setIsOpen(!isOpen)}>
        {isOpen ? <X size={28} /> : <MessageSquare size={28} />}
      </button>

      {/* ── Chat Window ── */}
      {isOpen && (
        <div className="chat-window">
          <div className="chat-header">
            <div className="chat-header-info">
              <div className="bot-avatar">
                <Bot size={20} color="white" />
              </div>
              <div className="chat-header-text">
                <h4>AgroAI Assistant</h4>
                <span><div style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e' }}></div> Online</span>
              </div>
            </div>
            <button style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }} onClick={() => setIsOpen(false)}>
              <Minus size={20} />
            </button>
          </div>

          <div className="chat-messages" ref={scrollRef}>
            {messages.map(msg => (
              <div key={msg.id} className={`message ${msg.sender}`}>
                {msg.text}
              </div>
            ))}
            {isTyping && (
              <div className="typing-indicator">AgroAI is thinking...</div>
            )}
          </div>

          <div className="chat-input-area">
            <input 
              type="text" 
              placeholder="Ask about herd biometrics..." 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            />
            <button className="btn-send" onClick={handleSend}>
              <Send size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Chatbot;
