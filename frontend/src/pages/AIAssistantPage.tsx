import React, { useState, useEffect, useRef } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  Bot,
  Send,
  User,
  Sparkles,
  Copy,
  Check,
  PlusCircle,
  FileText,
  HelpCircle,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Terminal,
  ShieldAlert
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  metadata?: Record<string, any>;
  created_at: string;
}

export const AIAssistantPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: `Hello ${user?.full_name || 'there'}! I am your enterprise IT Support Assistant powered by Google Gemini.\n\nI can assist you with:\n• Guided self-service troubleshooting\n• Drafting and formatting incident reports\n• Exploring Service Catalogue items & approvals\n• Ticket status and SLA tracking inquiries`,
      created_at: new Date().toISOString(),
    },
  ]);

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSend = async (textToSend?: string) => {
    const query = textToSend || input;
    if (!query.trim() || loading) return;

    const userMsg: Message = {
      id: `usr-${Date.now()}`,
      role: 'user',
      content: query,
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInput('');
    setLoading(true);

    try {
      const res = await api.ai.chat(query, conversationId || undefined);
      if (res.conversation_id) setConversationId(res.conversation_id);

      const assistantMsg: Message = {
        id: res.message.id || `ast-${Date.now()}`,
        role: 'assistant',
        content: res.message.content,
        metadata: res.message.metadata,
        created_at: res.message.created_at,
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      console.error('AI chat failed:', err);
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: 'system',
          content: 'Unable to reach the Gemini service assistant. Please try again or use direct navigation.',
          created_at: new Date().toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleNewSession = () => {
    setConversationId(null);
    setMessages([
      {
        id: `welcome-${Date.now()}`,
        role: 'assistant',
        content: `New session started. How can I assist with your IT services today?`,
        created_at: new Date().toISOString(),
      },
    ]);
  };

  const quickPrompts = [
    'How do I configure Corporate VPN on my laptop?',
    'My monitor keeps flickering when connected to dock',
    'How do I request software license approval?',
    'What are the response SLA targets for Critical tickets?',
  ];

  return (
    <div className="h-[calc(100vh-8.5rem)] flex flex-col bg-white border border-slate-200 rounded-lg overflow-hidden shadow-xs">
      {/* Top Session Bar */}
      <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold shadow-xs">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <span>Google Gemini ITSM Assistant</span>
              <span className="text-[9px] font-mono px-1.5 py-0.2 bg-blue-100 text-blue-800 rounded font-bold">
                ENTERPRISE TIER
              </span>
            </h2>
            <p className="text-[11px] text-slate-500">
              Role-authorized intelligence grounded on approved Knowledge Base records.
            </p>
          </div>
        </div>

        <button
          onClick={handleNewSession}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded text-xs font-semibold shadow-2xs transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5 text-slate-400" />
          <span>New Session</span>
        </button>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex gap-3 max-w-2xl ${
              m.role === 'user' ? 'ml-auto flex-row-reverse' : ''
            }`}
          >
            {/* Avatar */}
            <div
              className={`w-7 h-7 rounded flex items-center justify-center shrink-0 text-xs font-bold ${
                m.role === 'user'
                  ? 'bg-slate-800 text-white'
                  : m.role === 'system'
                  ? 'bg-rose-100 text-rose-700'
                  : 'bg-blue-600 text-white'
              }`}
            >
              {m.role === 'user' ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
            </div>

            {/* Bubble */}
            <div
              className={`rounded-lg p-3.5 text-xs space-y-2 relative group leading-relaxed ${
                m.role === 'user'
                  ? 'bg-blue-600 text-white font-medium'
                  : m.role === 'system'
                  ? 'bg-rose-50 text-rose-800 border border-rose-200'
                  : 'bg-slate-50 text-slate-800 border border-slate-200/80'
              }`}
            >
              <div className="whitespace-pre-wrap">{m.content}</div>

              {/* Suggested Incident Confirmation Action */}
              {m.metadata?.suggested_incident && (
                <div className="mt-3 p-3 bg-white border border-blue-200 rounded-md shadow-2xs space-y-2">
                  <div className="flex items-center gap-1.5 font-bold text-blue-900">
                    <FileText className="w-3.5 h-3.5 text-blue-600" />
                    <span>Structured Incident Draft Prepared</span>
                  </div>
                  <div className="text-[11px] text-slate-600 space-y-0.5">
                    <div><span className="font-semibold text-slate-700">Subject:</span> {m.metadata.suggested_incident.subject}</div>
                    <div><span className="font-semibold text-slate-700">Category:</span> {m.metadata.suggested_incident.category} Desk</div>
                  </div>
                  <button
                    onClick={() => navigate('/create-ticket')}
                    className="flex items-center gap-1 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-[11px] font-semibold"
                  >
                    <span>Confirm & File Ticket in Portal</span>
                    <span>→</span>
                  </button>
                </div>
              )}

              {/* Copy action */}
              {m.role === 'assistant' && (
                <button
                  onClick={() => handleCopy(m.id, m.content)}
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 text-slate-400 hover:text-slate-600 transition-opacity p-1"
                >
                  {copiedId === m.id ? (
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex gap-3 max-w-2xl">
            <div className="w-7 h-7 rounded bg-blue-600 text-white flex items-center justify-center shrink-0">
              <Bot className="w-3.5 h-3.5" />
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 text-xs text-slate-500 flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-blue-500 animate-spin" />
              <span>Analyzing diagnostic telemetry & knowledge context...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Quick Prompts */}
      <div className="px-4 py-2 border-t border-slate-100 bg-slate-50/50 flex flex-wrap gap-1.5">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider self-center mr-1">
          Suggestions:
        </span>
        {quickPrompts.map((q) => (
          <button
            key={q}
            onClick={() => handleSend(q)}
            className="text-[11px] text-slate-600 hover:text-blue-700 bg-white border border-slate-200 rounded-full px-2.5 py-0.5 hover:border-blue-300 transition-colors"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Input Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="p-3.5 border-t border-slate-200 bg-white flex items-center gap-2"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about troubleshooting steps, ticket status, or describe an IT problem..."
          className="flex-1 bg-slate-50 border border-slate-200 rounded-md px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white"
        />
        <button
          type="submit"
          disabled={!input.trim() || loading}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-semibold flex items-center gap-1.5 shadow-xs disabled:opacity-50 transition-colors"
        >
          <span>Send</span>
          <Send className="w-3 h-3" />
        </button>
      </form>
    </div>
  );
};

