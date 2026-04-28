'use client'

import Link from 'next/link';
import { useState, useRef, useEffect } from 'react';
import { logoutAction } from '@/actions/authActions';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  ticker?: string;
  hasLiveData?: boolean;
}

const SUGGESTIONS = [
  "What is Apple's current valuation and P/E ratio?",
  "Show me Tesla's revenue and profit margins",
  "Compare Microsoft vs Google financially",
  "What is NVIDIA's free cash flow and debt levels?",
  "Give me Amazon's balance sheet highlights",
  "What is the analyst recommendation for Meta?",
];

export default function FinancialChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: `## Welcome to FinAn AI 🤖\n\nI am your AI-powered financial analyst, connected to **live Yahoo Finance data**.\n\nYou can ask me about:\n- 📊 Revenue, EBITDA, Free Cash Flow for any public company\n- 📈 Valuation metrics (P/E, P/B, EV/EBITDA)\n- 🏦 Balance sheet — debt, cash, assets\n- 📉 Stock price, 52-week range, market cap\n- 🔍 Analyst recommendations and price targets\n\nJust mention a company name or ticker symbol (e.g. AAPL, MSFT, TSLA) in your question!`,
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [ticker, setTicker] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function sendMessage(text?: string) {
    const userMessage = text || input.trim();
    if (!userMessage || loading) return;

    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);

    try {
      const history = messages
        .filter(m => m.role !== 'assistant' || messages.indexOf(m) !== 0)
        .map(m => ({
          role: m.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: m.content }],
        }));

      const res = await fetch('/api/financial-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage, ticker: ticker || undefined, history }),
      });

      const data = await res.json();

      if (data.error) {
        setMessages(prev => [...prev, { role: 'assistant', content: `❌ Error: ${data.error}` }]);
      } else {
        if (data.ticker) setTicker(data.ticker);
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: data.response,
          ticker: data.ticker,
          hasLiveData: data.hasLiveData,
        }]);
      }
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', content: '❌ Network error. Please try again.' }]);
    }
    setLoading(false);
  }

  function renderContent(content: string) {
    const lines = content.split('\n');
    const elements: JSX.Element[] = [];
    let i = 0;

    while (i < lines.length) {
      const line = lines[i];
      if (line.startsWith('## ')) {
        elements.push(<h3 key={i} style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px', marginTop: elements.length > 0 ? '12px' : 0 }}>{line.slice(3)}</h3>);
      } else if (line.startsWith('### ')) {
        elements.push(<h4 key={i} style={{ fontSize: '13px', fontWeight: 600, color: 'var(--accent-primary)', marginBottom: '6px', marginTop: '10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{line.slice(4)}</h4>);
      } else if (line.startsWith('- ') || line.startsWith('• ')) {
        elements.push(<div key={i} style={{ display: 'flex', gap: '8px', marginBottom: '4px', fontSize: '13px', color: 'var(--text-secondary)' }}><span style={{ color: 'var(--accent-primary)', flexShrink: 0 }}>▸</span><span>{line.slice(2)}</span></div>);
      } else if (line.startsWith('**') && line.endsWith('**')) {
        elements.push(<p key={i} style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>{line.slice(2, -2)}</p>);
      } else if (line.trim() === '') {
        if (elements.length > 0) elements.push(<div key={i} style={{ height: '6px' }} />);
      } else {
        // Handle inline bold
        const parts = line.split(/(\*\*[^*]+\*\*)/g);
        const rendered = parts.map((p, j) =>
          p.startsWith('**') && p.endsWith('**')
            ? <strong key={j} style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{p.slice(2, -2)}</strong>
            : p
        );
        elements.push(<p key={i} style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '4px', lineHeight: '1.6' }}>{rendered}</p>);
      }
      i++;
    }
    return elements;
  }

  return (
    <div className="dashboard-layout">
      {/* ── Sidebar ── */}
      <aside className="sidebar">
        <div className="sidebar-brand">
          <h2><span className="text-gradient-blue">FinAn</span></h2>
          <p>Analyst Workspace</p>
        </div>
        <nav className="sidebar-nav">
          <Link href="/analyst" className="sidebar-link">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
            New Analysis
          </Link>
          <Link href="/analyst/chat" className="sidebar-link active">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            AI Financial Assistant
          </Link>
        </nav>
        <div className="sidebar-footer">
          <form action={logoutAction}>
            <button className="btn btn-secondary" style={{ width: '100%', fontSize: '13px' }}>Sign Out</button>
          </form>
        </div>
      </aside>

      {/* ── Main Content ── */}
      <main className="main-content" style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
        {/* Header */}
        <div className="page-header animate-fade-in" style={{ flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '40px', height: '40px', borderRadius: '10px',
              background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-purple))',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px'
            }}>🤖</div>
            <div>
              <h1 className="text-gradient" style={{ fontSize: '22px' }}>AI Financial Assistant</h1>
              <p style={{ margin: 0, fontSize: '13px' }}>
                Powered by <strong>Gemini Flash</strong> + <strong>Yahoo Finance</strong> (Live Data) · 100% Free
              </p>
            </div>
          </div>
          {ticker && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              background: 'rgba(41, 151, 255, 0.08)', border: '1px solid rgba(41,151,255,0.2)',
              borderRadius: '20px', padding: '6px 14px', fontSize: '12px', fontWeight: 600,
              color: 'var(--accent-primary)'
            }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent-success)', animation: 'pulse 2s infinite' }} />
              Tracking: {ticker}
              <button onClick={() => setTicker('')} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '14px' }}>×</button>
            </div>
          )}
        </div>

        {/* Messages */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 0 12px 0', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {messages.map((msg, i) => (
            <div key={i} className="animate-fade-in" style={{
              display: 'flex', gap: '12px',
              justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
            }}>
              {msg.role === 'assistant' && (
                <div style={{
                  width: '32px', height: '32px', borderRadius: '8px', flexShrink: 0,
                  background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-purple))',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', marginTop: '2px'
                }}>🤖</div>
              )}
              <div style={{
                maxWidth: '75%',
                padding: '14px 18px',
                borderRadius: msg.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                background: msg.role === 'user'
                  ? 'linear-gradient(135deg, var(--accent-primary), rgba(41,151,255,0.8))'
                  : 'var(--surface-secondary)',
                border: msg.role === 'user' ? 'none' : '1px solid var(--border-subtle)',
                color: msg.role === 'user' ? '#fff' : 'var(--text-primary)',
              }}>
                {msg.role === 'user'
                  ? <p style={{ margin: 0, fontSize: '14px', lineHeight: '1.5' }}>{msg.content}</p>
                  : <div>{renderContent(msg.content)}</div>
                }
                {msg.hasLiveData && (
                  <div style={{ marginTop: '10px', paddingTop: '8px', borderTop: '1px solid var(--border-subtle)', display: 'flex', gap: '6px', alignItems: 'center' }}>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent-success)' }} />
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 500 }}>Live data via Yahoo Finance</span>
                  </div>
                )}
              </div>
              {msg.role === 'user' && (
                <div style={{
                  width: '32px', height: '32px', borderRadius: '8px', flexShrink: 0,
                  background: 'var(--surface-secondary)', border: '1px solid var(--border-subtle)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', marginTop: '2px'
                }}>👤</div>
              )}
            </div>
          ))}
          {loading && (
            <div style={{ display: 'flex', gap: '12px' }}>
              <div style={{
                width: '32px', height: '32px', borderRadius: '8px', flexShrink: 0,
                background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-purple))',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px'
              }}>🤖</div>
              <div style={{
                padding: '14px 18px', borderRadius: '16px 16px 16px 4px',
                background: 'var(--surface-secondary)', border: '1px solid var(--border-subtle)',
                display: 'flex', gap: '6px', alignItems: 'center'
              }}>
                {[0, 1, 2].map(j => (
                  <div key={j} style={{
                    width: '7px', height: '7px', borderRadius: '50%',
                    background: 'var(--accent-primary)', opacity: 0.4,
                    animation: `bounce 1.2s ease-in-out ${j * 0.2}s infinite`,
                  }} />
                ))}
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Suggestions */}
        {messages.length <= 1 && (
          <div style={{ flexShrink: 0, marginBottom: '12px' }}>
            <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '8px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Suggested questions</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {SUGGESTIONS.map((s, i) => (
                <button key={i} onClick={() => sendMessage(s)} style={{
                  padding: '7px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: 500,
                  background: 'var(--surface-secondary)', border: '1px solid var(--border-subtle)',
                  color: 'var(--text-secondary)', cursor: 'pointer', transition: 'all 0.2s',
                }}
                  onMouseEnter={e => { (e.target as HTMLElement).style.borderColor = 'var(--accent-primary)'; (e.target as HTMLElement).style.color = 'var(--accent-primary)'; }}
                  onMouseLeave={e => { (e.target as HTMLElement).style.borderColor = 'var(--border-subtle)'; (e.target as HTMLElement).style.color = 'var(--text-secondary)'; }}
                >{s}</button>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <div style={{ flexShrink: 0 }} className="glass-panel" >
          <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end' }}>
            <div style={{ flex: 1 }}>
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                placeholder="Ask about any company — e.g. 'What is Tesla's revenue and P/E ratio?'"
                className="input-field"
                style={{ width: '100%', marginBottom: 0 }}
                disabled={loading}
              />
            </div>
            <button
              onClick={() => sendMessage()}
              disabled={!input.trim() || loading}
              className="btn btn-accent"
              style={{ padding: '12px 24px', flexShrink: 0 }}
            >
              {loading ? '...' : 'Send →'}
            </button>
          </div>
          <p style={{ margin: '8px 0 0', fontSize: '11px', color: 'var(--text-muted)' }}>
            Press Enter to send. Data sourced from Yahoo Finance in real-time. Requires GEMINI_API_KEY in .env
          </p>
        </div>
      </main>

      <style>{`
        @keyframes bounce { 0%, 60%, 100% { transform: translateY(0); opacity: 0.4; } 30% { transform: translateY(-6px); opacity: 1; } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
      `}</style>
    </div>
  );
}
