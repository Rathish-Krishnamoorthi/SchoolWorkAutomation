import { useState, useRef, useEffect } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { cn } from '@/lib/utils';
import { Bot, Send, Loader2, User, Lightbulb, ArrowRight } from 'lucide-react';
import { aiService } from '@/services/aiService';
import { useNavigate } from 'react-router-dom';
import type { AIMessage } from '@/types';

const SUGGESTIONS = [
  'Which students have attendance below 75%?',
  'Show today\'s timetable conflicts',
  'Which teachers are overloaded?',
  'How many documents are waiting for approval?',
  'Which classrooms are unused today?',
  'What requires my attention today?',
];

export default function AIAssistantPage() {
  const user = useAppStore(s => s.user);
  const navigate = useNavigate();
  const [messages, setMessages] = useState<AIMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: 'Hello! I\'m your school AI assistant. I can answer questions about students, teachers, attendance, timetables, and more. What would you like to know?',
      timestamp: new Date().toISOString(),
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function sendMessage(query: string) {
    if (!query.trim() || loading) return;
    const userMsg: AIMessage = {
      id: `u-${Date.now()}`, role: 'user', content: query, timestamp: new Date().toISOString()
    };
    setMessages(p => [...p, userMsg]);
    setInput('');
    setLoading(true);
    try {
      const response = await aiService.askAssistant(query);
      const aiMsg: AIMessage = {
        id: `a-${Date.now()}`, role: 'assistant',
        content: response.content, timestamp: new Date().toISOString(),
        structured: response.structured,
      };
      setMessages(p => [...p, aiMsg]);
    } catch {
      setMessages(p => [...p, {
        id: `a-${Date.now()}`, role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date().toISOString(),
      }]);
    }
    setLoading(false);
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] animate-fade-in">
      <div className="mb-4">
        <h1 className="text-xl font-bold flex items-center gap-2"><Bot size={20} className="text-primary" /> AI Assistant</h1>
        <p className="text-sm text-muted-foreground">Ask natural-language questions about school operations</p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 mb-4 scrollbar-thin pr-1">
        {messages.map(msg => (
          <div key={msg.id} className={cn('flex gap-3', msg.role === 'user' ? 'flex-row-reverse' : '')}>
            <div className={cn(
              'w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5',
              msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted',
            )}>
              {msg.role === 'user' ? <User size={13} /> : <Bot size={13} />}
            </div>
            <div className={cn('max-w-[80%] space-y-2', msg.role === 'user' ? 'items-end' : '')}>
              <div className={cn(
                'px-4 py-3 rounded-xl text-sm leading-relaxed',
                msg.role === 'user'
                  ? 'bg-primary text-primary-foreground rounded-tr-sm'
                  : 'bg-card border border-border rounded-tl-sm',
              )}>
                {msg.content}
              </div>
              {msg.structured?.items && (
                <div className="bg-card border border-border rounded-xl p-3 space-y-2">
                  {msg.structured.items.map((item, i) => (
                    <div key={i} className="flex items-center justify-between text-sm gap-2 py-1 border-b border-border/50 last:border-0">
                      <div className="font-medium truncate">{item.label}</div>
                      <div className="text-muted-foreground text-xs truncate">{item.value}</div>
                      {item.extra && <div className="text-xs font-medium text-primary flex-shrink-0">{item.extra}</div>}
                    </div>
                  ))}
                </div>
              )}
              {msg.structured?.recommendation && (
                <div className="flex items-start gap-2 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-2.5">
                  <Lightbulb size={12} className="text-amber-600 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-amber-800 dark:text-amber-300">{msg.structured.recommendation}</p>
                </div>
              )}
              <div className="text-[10px] text-muted-foreground px-1">
                {new Date(msg.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex gap-3">
            <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
              <Bot size={13} />
            </div>
            <div className="px-4 py-3 rounded-xl rounded-tl-sm bg-card border border-border text-sm flex items-center gap-2">
              <Loader2 size={13} className="animate-spin text-primary" /> Thinking…
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Suggestions */}
      {messages.length <= 2 && (
        <div className="mb-3">
          <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1"><Lightbulb size={11} />Suggested queries</p>
          <div className="flex flex-wrap gap-1.5">
            {SUGGESTIONS.map(s => (
              <button
                key={s}
                onClick={() => sendMessage(s)}
                className="text-xs px-2.5 py-1 border border-border rounded-full hover:bg-muted hover:border-primary/30 transition-colors"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="flex gap-2">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage(input)}
          placeholder="Ask about students, timetable, attendance, resources…"
          disabled={loading}
          className="flex-1 h-10 px-4 text-sm rounded-xl border border-border bg-card focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-60"
        />
        <button
          onClick={() => sendMessage(input)}
          disabled={!input.trim() || loading}
          className="w-10 h-10 bg-primary text-primary-foreground rounded-xl flex items-center justify-center hover:bg-primary/90 disabled:opacity-60 transition-colors flex-shrink-0"
          aria-label="Send"
        >
          <Send size={14} />
        </button>
      </div>
    </div>
  );
}
