import { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { chatApi, type ChatResponse } from '../../api/chat';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: string[];
  grounded?: boolean;
}

export function CopilotWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const location = useLocation();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSend = async () => {
    if (!inputValue.trim()) return;
    
    const userMsg = inputValue.trim();
    setInputValue('');
    
    const newMsg: Message = { id: Date.now().toString(), role: 'user', content: userMsg };
    setMessages(prev => [...prev, newMsg]);
    setIsTyping(true);

    try {
      // Determine if we're on an asset page
      let assetId;
      const match = location.pathname.match(/\/assets\/([^/]+)/);
      if (match) assetId = match[1];

      const res = await chatApi.sendMessage({
        message: userMsg,
        asset_id: assetId,
        current_page: location.pathname
      });
      
      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: res.answer,
        sources: res.sources,
        grounded: res.grounded
      };
      setMessages(prev => [...prev, assistantMsg]);
    } catch (err) {
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Error communicating with AI Copilot. Please try again.',
        grounded: false
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 9999 }}>
      {isOpen ? (
        <div style={{
          width: 380,
          height: 500,
          backgroundColor: 'var(--surface-sunken)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 12,
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 8px 32px rgba(0,0,0,0.5)'
        }}>
          {/* Header */}
          <div style={{
            padding: '16px',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            backgroundColor: 'var(--surface-raised)',
            borderTopLeftRadius: 12,
            borderTopRightRadius: 12
          }}>
            <div>
              <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>FleetIQ Copilot</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Grounded AI Assistant</div>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
            >
              ✕
            </button>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {messages.length === 0 && (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 13, marginTop: 40 }}>
                Ask me about your fleet, asset utilization, or risk alerts.
              </div>
            )}
            {messages.map(msg => (
              <div key={msg.id} style={{
                alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                maxWidth: '85%'
              }}>
                <div style={{
                  backgroundColor: msg.role === 'user' ? 'var(--accent-primary)' : 'var(--surface-raised)',
                  color: msg.role === 'user' ? '#fff' : 'var(--text-primary)',
                  padding: '10px 14px',
                  borderRadius: '12px',
                  borderBottomRightRadius: msg.role === 'user' ? 4 : 12,
                  borderBottomLeftRadius: msg.role === 'assistant' ? 4 : 12,
                  fontSize: 13,
                  lineHeight: 1.5
                }}>
                  {msg.content}
                </div>
                {msg.role === 'assistant' && msg.grounded && (
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4, marginLeft: 4 }}>
                    ✓ Grounded in FleetIQ Data
                  </div>
                )}
              </div>
            ))}
            {isTyping && (
              <div style={{ alignSelf: 'flex-start', color: 'var(--text-muted)', fontSize: 12 }}>
                Typing...
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div style={{ padding: '12px', borderTop: '1px solid var(--border-subtle)', backgroundColor: 'var(--surface-raised)', borderBottomLeftRadius: 12, borderBottomRightRadius: 12 }}>
            <div style={{ display: 'flex', gap: 8 }}>
              <input 
                type="text"
                value={inputValue}
                onChange={e => setInputValue(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSend()}
                placeholder="Ask a question..."
                style={{
                  flex: 1,
                  background: 'var(--surface-sunken)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 20,
                  padding: '8px 16px',
                  color: 'var(--text-primary)',
                  outline: 'none'
                }}
              />
              <button 
                onClick={handleSend}
                disabled={!inputValue.trim() || isTyping}
                style={{
                  background: 'var(--accent-primary)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '50%',
                  width: 36,
                  height: 36,
                  cursor: inputValue.trim() && !isTyping ? 'pointer' : 'not-allowed',
                  opacity: inputValue.trim() && !isTyping ? 1 : 0.5
                }}
              >
                ↑
              </button>
            </div>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setIsOpen(true)}
          style={{
            background: 'var(--accent-primary)',
            color: 'white',
            border: 'none',
            borderRadius: '50%',
            width: 56,
            height: 56,
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 24
          }}
        >
          ✨
        </button>
      )}
    </div>
  );
}
