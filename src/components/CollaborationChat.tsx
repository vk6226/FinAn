'use client'

import { useState } from 'react';
import { sendCollaborationMessage } from '@/actions/collaborationActions';

interface CollaborationChatProps {
  reportId: string;
  userId: string;
  role: string;
  userName: string;
  initialMessages: any[];
}

export default function CollaborationChat({ reportId, userId, role, userName, initialMessages }: CollaborationChatProps) {
  const [messages, setMessages] = useState(initialMessages);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSend() {
    if (!text.trim() || loading) return;
    setLoading(true);
    
    // Optimistic update
    const newMsg = {
      id: Math.random().toString(),
      text,
      role,
      user: { name: userName },
      createdAt: new Date().toISOString()
    };
    setMessages([...messages, newMsg]);
    const originalText = text;
    setText('');

    const res = await sendCollaborationMessage(reportId, userId, originalText, role);
    if (!res.success) {
      alert("Error sending message");
      setMessages(messages); // Rollback
    }
    setLoading(false);
  }

  return (
    <div className="chat-container glass-panel" style={{ marginTop: '24px', padding: '20px' }}>
      <h4 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent-purple)' }} />
        Collaboration Thread
      </h4>
      
      <div style={{ height: '200px', overflowY: 'auto', marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '8px', padding: '8px' }}>
        {messages.map((m) => (
          <div key={m.id} style={{
            alignSelf: m.role === role ? 'flex-end' : 'flex-start',
            maxWidth: '80%',
            padding: '8px 12px',
            borderRadius: '12px',
            fontSize: '13px',
            background: m.role === role ? 'rgba(191,90,242,0.1)' : 'var(--surface-secondary)',
            border: `1px solid ${m.role === role ? 'rgba(191,90,242,0.2)' : 'var(--border-subtle)'}`
          }}>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '2px', fontWeight: 600 }}>
              {m.user.name} ({m.role})
            </div>
            {m.text}
          </div>
        ))}
        {messages.length === 0 && <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px', marginTop: '60px' }}>No collaboration messages yet.</p>}
      </div>

      <div style={{ display: 'flex', gap: '8px' }}>
        <input 
          className="input-field" 
          style={{ marginBottom: 0, fontSize: '13px' }} 
          placeholder="Message analyst..." 
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
        />
        <button onClick={handleSend} className="btn btn-accent" style={{ padding: '8px 16px', fontSize: '12px' }} disabled={loading}>
          {loading ? '...' : 'Send'}
        </button>
      </div>
    </div>
  );
}
