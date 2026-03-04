import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, Trash2, Loader2, StopCircle, Settings } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAI } from '@/hooks/useAI';
import { useFileStore } from '@/store/fileStore';
import SuggestionBubble from './SuggestionBubble';
import { cn } from '@/lib/utils';

export default function AIPanel() {
  const {
    messages,
    isProcessing,
    suggestions,
    modelStatus,
    sendMessage,
    clearMessages,
    cancelRequest,
  } = useAI();

  const activeTabId = useFileStore((s) => s.activeTabId);
  const fileData = useFileStore((s) => (activeTabId ? s.fileDataCache[activeTabId] : null));
  const selection = useFileStore((s) => s.selection);

  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = () => {
    if (!input.trim() || isProcessing) return;

    // Build context from current file/selection
    const context: any = {};
    if (fileData) {
      context.format = fileData.format;
      if (selection) {
        context.bytes = Array.from(fileData.bytes.slice(selection.start, selection.end + 1));
      }
    }

    sendMessage(input.trim(), context);
    setInput('');
  };

  const statusColor =
    modelStatus === 'connected'
      ? 'text-accent bg-accent/10'
      : modelStatus === 'loading'
        ? 'text-yellow-400 bg-yellow-400/10'
        : 'text-muted-foreground bg-muted-foreground/10';

  const statusLabel =
    modelStatus === 'connected' ? 'Online' : modelStatus === 'loading' ? 'Loading...' : 'Local';

  return (
    <div className="w-72 bg-card border-l border-border flex flex-col h-full">
      {/* Header */}
      <div className="px-3 py-2 border-b border-border flex items-center gap-2">
        <Sparkles className="w-3.5 h-3.5 text-primary" />
        <span className="text-xs font-semibold text-foreground">AI Assistant</span>
        <span className={cn('text-[9px] px-1.5 py-0.5 rounded-full ml-auto', statusColor)}>{statusLabel}</span>
        <button onClick={clearMessages} className="p-0.5 rounded hover:bg-secondary/50" title="Clear chat">
          <Trash2 className="w-3 h-3 text-muted-foreground" />
        </button>
      </div>

      {/* AI Suggestions */}
      {suggestions.length > 0 && (
        <div className="px-2 py-1.5 border-b border-border/50 space-y-1.5 max-h-40 overflow-y-auto">
          <div className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider px-1">
            Field Suggestions
          </div>
          <AnimatePresence>
            {suggestions.map((s, i) => (
              <SuggestionBubble
                key={`${s.offset}-${i}`}
                suggestion={s}
                onAccept={(sug) => console.log('Accepted:', sug)}
                onDismiss={(sug) => console.log('Dismissed:', sug)}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-3">
        {messages.map((msg, i) => (
          <motion.div
            key={msg.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i === messages.length - 1 ? 0.1 : 0 }}
            className={cn('flex gap-2', msg.role === 'user' ? 'justify-end' : '')}
          >
            {msg.role === 'assistant' && (
              <div className="w-5 h-5 rounded bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Bot className="w-3 h-3 text-primary" />
              </div>
            )}
            {msg.role === 'system' && (
              <div className="w-5 h-5 rounded bg-yellow-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Settings className="w-3 h-3 text-yellow-400" />
              </div>
            )}
            <div
              className={cn(
                'text-[11px] leading-relaxed rounded-lg px-2.5 py-1.5 max-w-[220px]',
                msg.role === 'user' && 'bg-primary/15 text-foreground',
                msg.role === 'assistant' && 'bg-secondary/50 text-foreground/90',
                msg.role === 'system' && 'bg-yellow-500/5 text-muted-foreground italic text-[10px]'
              )}
            >
              {msg.isStreaming ? (
                <span className="flex items-center gap-1">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Thinking...
                </span>
              ) : (
                <span className="whitespace-pre-wrap">{msg.content}</span>
              )}
            </div>
            {msg.role === 'user' && (
              <div className="w-5 h-5 rounded bg-secondary flex items-center justify-center flex-shrink-0 mt-0.5">
                <User className="w-3 h-3 text-muted-foreground" />
              </div>
            )}
          </motion.div>
        ))}
      </div>

      {/* Input */}
      <div className="p-2 border-t border-border">
        {isProcessing && (
          <button
            onClick={cancelRequest}
            className="w-full mb-1.5 flex items-center justify-center gap-1 text-[10px] text-red-400 hover:bg-red-500/10 rounded py-0.5 transition-colors"
          >
            <StopCircle className="w-3 h-3" /> Stop generating
          </button>
        )}
        <div className="flex items-center gap-1.5 bg-secondary/40 rounded-lg px-2 py-1.5">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            className="flex-1 bg-transparent text-xs outline-none placeholder:text-muted-foreground text-foreground"
            placeholder={
              selection
                ? `Ask about selection (${selection.end - selection.start + 1} bytes)...`
                : 'Ask about this binary...'
            }
            disabled={isProcessing}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isProcessing}
            className={cn(
              'p-1 rounded transition-colors',
              input.trim() && !isProcessing ? 'hover:bg-secondary text-primary' : 'text-muted-foreground opacity-50'
            )}
          >
            <Send className="w-3 h-3" />
          </button>
        </div>
        <div className="mt-1 text-[9px] text-muted-foreground/60 text-center">
          Powered by local LLM (Ollama) — your data stays private
        </div>
      </div>
    </div>
  );
}
