import { useState, useCallback } from 'react';
import { Search, Sparkles, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface QueryBarProps {
  onQuery: (query: string) => void;
  isProcessing: boolean;
}

const SUGGESTIONS = [
  'What format is this file?',
  'Find all packets to port 443',
  'Detect encrypted regions',
  'Show checksum fields',
  'Generate C struct for this format',
  'Find strings in the binary',
  'Explain this header',
];

export default function QueryBar({ onQuery, isProcessing }: QueryBarProps) {
  const [query, setQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);

  const handleSubmit = useCallback(() => {
    if (query.trim() && !isProcessing) {
      onQuery(query.trim());
      setQuery('');
      setShowSuggestions(false);
    }
  }, [query, isProcessing, onQuery]);

  const handleSuggestionClick = useCallback(
    (suggestion: string) => {
      onQuery(suggestion);
      setQuery('');
      setShowSuggestions(false);
    },
    [onQuery]
  );

  return (
    <div className="relative">
      <div className="flex items-center gap-2 px-3 py-2 bg-surface-1 border-t border-border">
        {isProcessing ? (
          <Loader2 className="w-3.5 h-3.5 text-purple-400 animate-spin shrink-0" />
        ) : (
          <Sparkles className="w-3.5 h-3.5 text-purple-400 shrink-0" />
        )}
        <input
          type="text"
          placeholder='Ask AI: "What format is this?" or "Find all DNS packets"'
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSubmit();
            if (e.key === 'Escape') {
              setShowSuggestions(false);
              setQuery('');
            }
          }}
          disabled={isProcessing}
          className="flex-1 bg-surface-2 border border-border/50 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-purple-400/50 disabled:opacity-50"
        />
        <button
          onClick={handleSubmit}
          disabled={!query.trim() || isProcessing}
          className={cn(
            'px-2 py-1 rounded text-xs font-medium transition-colors',
            query.trim() && !isProcessing
              ? 'bg-purple-500/20 text-purple-400 hover:bg-purple-500/30'
              : 'text-muted-foreground opacity-50 cursor-not-allowed'
          )}
        >
          Ask
        </button>
      </div>

      {/* Suggestions dropdown */}
      {showSuggestions && !query && (
        <div className="absolute bottom-full left-0 right-0 bg-surface-2 border border-border rounded-t shadow-lg mb-[-1px] z-20 max-h-48 overflow-y-auto">
          <div className="px-3 py-1 text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">
            Suggestions
          </div>
          {SUGGESTIONS.map((s, i) => (
            <button
              key={i}
              onMouseDown={() => handleSuggestionClick(s)}
              className="w-full text-left px-3 py-1.5 text-xs hover:bg-secondary/30 transition-colors flex items-center gap-2"
            >
              <Search className="w-3 h-3 text-muted-foreground shrink-0" />
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
