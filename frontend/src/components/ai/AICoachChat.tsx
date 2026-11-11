import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, Shield, User, Bot, RefreshCw, MessageSquare, ArrowRight, Zap, Target } from 'lucide-react';
import { api } from '../../services/api';

interface Message {
  id: string;
  sender: 'USER' | 'COACH';
  text: string;
  timestamp: string;
  metrics?: Record<string, any>;
  followups?: string[];
}

interface AICoachChatProps {
  matchId?: number;
  matchTitle?: string;
  defaultOpen?: boolean;
}

const DEFAULT_SUGGESTIONS = [
  "⚡ How can I increase my jump smash speed?",
  "🛡️ Why was my central base recovery low?",
  "🏸 What tactical drills should I practice this week?",
  "🎯 How do I escape when pinned to the deep backhand?",
  "🫀 How does fatigue affect my shots in extended rallies?"
];

export const AICoachChat: React.FC<AICoachChatProps> = ({
  matchId,
  matchTitle,
  defaultOpen = true
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'COACH',
      text: matchTitle
        ? `Hello! I am **RallyCoach AI**, your autonomous badminton sports science coach. I have loaded the telemetry and kinematics for **${matchTitle}**. Ask me about your smash velocity, footwork recovery, stamina decay, or opponent tactics!`
        : `Hello! I am **RallyCoach AI**, your autonomous badminton tactical coach. Ask me anything about stroke mechanics, footwork drills, BWF rules, or match strategy!`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      followups: DEFAULT_SUGGESTIONS
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSend = async (queryText?: string) => {
    const textToSend = (queryText || inputText).trim();
    if (!textToSend || loading) return;

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      sender: 'USER',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setLoading(true);

    try {
      const res = await api.askAICoach(textToSend, matchId);
      const coachMsg: Message = {
        id: `coach-${Date.now()}`,
        sender: 'COACH',
        text: res.answer,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        metrics: res.grounded_metrics,
        followups: res.suggested_followups
      };
      setMessages((prev) => [...prev, coachMsg]);
    } catch (err: any) {
      const errorMsg: Message = {
        id: `error-${Date.now()}`,
        sender: 'COACH',
        text: `⚠️ **Unable to complete analysis:** ${err.message || 'Please check your connection and try again.'}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  // Simple clean markdown text renderer for bullets, bold, and headers
  const renderFormattedText = (text: string) => {
    const lines = text.split('\n');
    return lines.map((line, idx) => {
      // Clean headers
      if (line.startsWith('### ')) {
        return (
          <h4 key={idx} className="text-sm font-black text-cyan-300 mt-2.5 mb-1 flex items-center gap-1.5">
            {line.replace('### ', '')}
          </h4>
        );
      }
      if (line.startsWith('**') && line.endsWith('**')) {
        return (
          <div key={idx} className="text-xs font-bold text-white mt-1.5 mb-0.5">
            {line.replace(/\*\*/g, '')}
          </div>
        );
      }
      if (line.startsWith('• ') || line.startsWith('- ')) {
        return (
          <div key={idx} className="text-xs text-slate-200 ml-2.5 my-0.5 flex items-start gap-1.5">
            <span className="text-cyan-400 font-bold shrink-0">•</span>
            <span dangerouslySetInnerHTML={{ __html: formatInlineMarkdown(line.substring(2)) }} />
          </div>
        );
      }
      if (line.match(/^\d+\.\s/)) {
        return (
          <div key={idx} className="text-xs text-slate-200 ml-2.5 my-1 flex items-start gap-1.5">
            <span className="text-amber-400 font-bold shrink-0">{line.match(/^\d+\./)?.[0]}</span>
            <span dangerouslySetInnerHTML={{ __html: formatInlineMarkdown(line.replace(/^\d+\.\s/, '')) }} />
          </div>
        );
      }
      if (line.trim() === '') {
        return <div key={idx} className="h-1" />;
      }
      return (
        <p
          key={idx}
          className="text-xs text-slate-300 leading-relaxed my-0.5"
          dangerouslySetInnerHTML={{ __html: formatInlineMarkdown(line) }}
        />
      );
    });
  };

  const formatInlineMarkdown = (str: string) => {
    return str
      .replace(/\*\*(.*?)\*\*/g, '<strong class="text-white font-bold">$1</strong>')
      .replace(/\*(.*?)\*/g, '<em class="text-cyan-200">$1</em>')
      .replace(/`([^`]+)`/g, '<code class="bg-[#040817] px-1.5 py-0.5 rounded text-cyan-300 font-mono text-[11px] border border-cyan-500/30">$1</code>');
  };

  return (
    <div className="glass-panel bg-[#091129]/95 border border-cyan-500/35 rounded-3xl overflow-hidden shadow-2xl flex flex-col h-[580px] max-h-[85vh] w-full">
      {/* Top Header */}
      <div className="p-4 bg-gradient-to-r from-[#070e24] via-[#0b173d] to-[#0d1d4d] border-b border-cyan-500/25 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <Sparkles className="w-5 h-5 text-cyan-400 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-black text-white">RallyCoach AI</h3>
              <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 border border-cyan-400/40 text-[9px] font-bold text-cyan-300 uppercase tracking-wider">
                Autonomous
              </span>
            </div>
            <p className="text-[11px] text-slate-300">
              Sports science coaching & tactical analysis
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {matchTitle && (
            <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-cyan-950/60 border border-cyan-500/30 text-[10px] text-cyan-300 font-medium max-w-[180px] truncate">
              <Target className="w-3 h-3 text-cyan-400 shrink-0" />
              {matchTitle}
            </span>
          )}
          <span className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-emerald-950/60 border border-emerald-500/30 text-[10px] text-emerald-300 font-medium">
            <Shield className="w-3 h-3 text-emerald-400" />
            Isolated Session
          </span>
        </div>
      </div>

      {/* Messages Stream */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4 text-xs select-text">
        {messages.map((m) => {
          const isCoach = m.sender === 'COACH';
          return (
            <div
              key={m.id}
              className={`flex flex-col ${isCoach ? 'items-start' : 'items-end'} animate-in fade-in duration-200`}
            >
              <div className="flex items-center gap-1.5 mb-1 px-1 text-[10px] text-slate-400">
                {isCoach ? (
                  <>
                    <Bot className="w-3 h-3 text-cyan-400" />
                    <span className="font-bold text-cyan-300">RallyCoach AI</span>
                  </>
                ) : (
                  <>
                    <User className="w-3 h-3 text-slate-400" />
                    <span className="font-semibold text-slate-300">You</span>
                  </>
                )}
                <span>• {m.timestamp}</span>
              </div>

              <div
                className={`max-w-[92%] sm:max-w-[85%] p-3.5 rounded-2xl ${
                  isCoach
                    ? 'bg-[#050b1d] border border-cyan-500/25 text-slate-200 shadow-md'
                    : 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-medium shadow-lg shadow-cyan-600/20'
                }`}
              >
                {renderFormattedText(m.text)}

                {/* Suggested Followups */}
                {m.followups && m.followups.length > 0 && isCoach && (
                  <div className="mt-3 pt-2.5 border-t border-cyan-500/20 flex flex-wrap gap-1.5">
                    {m.followups.map((q, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSend(q)}
                        disabled={loading}
                        className="text-[11px] px-2.5 py-1 rounded-lg bg-[#0a1638] hover:bg-cyan-500/20 text-cyan-300 hover:text-white border border-cyan-500/30 transition-all flex items-center gap-1 text-left"
                      >
                        <span>{q}</span>
                        <ArrowRight className="w-2.5 h-2.5 opacity-60 shrink-0" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {loading && (
          <div className="flex items-center gap-2 text-cyan-300 text-xs p-3 rounded-2xl bg-[#050b1d] border border-cyan-500/25 max-w-[200px]">
            <RefreshCw className="w-4 h-4 animate-spin text-cyan-400" />
            <span>Analyzing telemetry...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Prompt Bar (Top of Input) */}
      <div className="px-3 py-1.5 bg-[#050a1c] border-t border-cyan-500/20 flex items-center gap-1.5 overflow-x-auto text-[11px] scrollbar-none">
        <span className="text-[10px] uppercase font-bold text-slate-400 shrink-0 flex items-center gap-1">
          <Zap className="w-3 h-3 text-amber-400" />
          Quick Ask:
        </span>
        {DEFAULT_SUGGESTIONS.slice(0, 3).map((prompt, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(prompt)}
            disabled={loading}
            className="px-2.5 py-0.5 rounded-full bg-[#0a1433] hover:bg-cyan-500/20 text-cyan-300/90 border border-cyan-500/25 whitespace-nowrap text-[10px] transition-colors shrink-0"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Input Action Bar */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="p-3 bg-[#060c22] border-t border-cyan-500/20 flex items-center gap-2"
      >
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder={
            matchTitle
              ? `Ask about smash speed, footwork, or tactics for ${matchTitle}...`
              : "Ask anything about badminton technique, drills, or rules..."
          }
          disabled={loading}
          className="flex-1 bg-[#09122c] border border-cyan-500/30 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
        />

        <button
          type="submit"
          disabled={!inputText.trim() || loading}
          className="px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 font-black flex items-center gap-1.5 transition-all shadow-md shadow-cyan-500/20"
        >
          <Send className="w-3.5 h-3.5 fill-current" />
          <span className="hidden sm:inline text-xs">Ask</span>
        </button>
      </form>
    </div>
  );
};
