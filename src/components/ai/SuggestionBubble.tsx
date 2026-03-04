import { motion } from 'framer-motion';
import { Sparkles, Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AISuggestion } from '@/hooks/useAI';
import { formatOffset } from '@/lib/formatters';

interface SuggestionBubbleProps {
  suggestion: AISuggestion;
  onAccept: (suggestion: AISuggestion) => void;
  onDismiss: (suggestion: AISuggestion) => void;
}

export default function SuggestionBubble({ suggestion, onAccept, onDismiss }: SuggestionBubbleProps) {
  const confidenceColor =
    suggestion.confidence > 0.8
      ? 'text-green-400 bg-green-500/10'
      : suggestion.confidence > 0.5
        ? 'text-yellow-400 bg-yellow-500/10'
        : 'text-red-400 bg-red-500/10';

  return (
    <motion.div
      initial={{ opacity: 0, y: -8, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -4, scale: 0.95 }}
      className="bg-surface-2 border border-border/50 rounded-lg p-2 shadow-lg"
    >
      <div className="flex items-start gap-2">
        <Sparkles className="w-3.5 h-3.5 text-purple-400 mt-0.5 shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-foreground">{suggestion.fieldName}</span>
            <span className={cn('text-[9px] px-1.5 py-0.5 rounded-full font-mono', confidenceColor)}>
              {(suggestion.confidence * 100).toFixed(0)}%
            </span>
          </div>
          <p className="text-[10px] text-muted-foreground mt-0.5">{suggestion.description}</p>
          <div className="text-[10px] font-mono text-muted-foreground/70 mt-0.5">
            Offset: 0x{formatOffset(suggestion.offset, 4)} | {suggestion.length} bytes
          </div>
        </div>
        <div className="flex gap-1 shrink-0">
          <button
            onClick={() => onAccept(suggestion)}
            className="p-1 rounded hover:bg-green-500/20 text-green-400 transition-colors"
            title="Accept suggestion"
          >
            <Check className="w-3 h-3" />
          </button>
          <button
            onClick={() => onDismiss(suggestion)}
            className="p-1 rounded hover:bg-red-500/20 text-red-400 transition-colors"
            title="Dismiss"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
