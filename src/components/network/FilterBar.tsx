import { useState, useCallback } from 'react';
import { Search, X, Filter, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePacketFilter } from '@/hooks/usePacketFilter';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

const QUICK_FILTERS = [
  { label: 'TCP', value: 'tcp' },
  { label: 'UDP', value: 'udp' },
  { label: 'HTTP', value: 'http' },
  { label: 'HTTPS/TLS', value: 'tls' },
  { label: 'DNS', value: 'dns' },
  { label: 'ICMP', value: 'icmp' },
  { label: 'ARP', value: 'arp' },
  { label: 'WebSocket', value: 'websocket' },
];

export default function FilterBar() {
  const { filterExpression, handleFilterChange, clearFilter, summary, topProtocols } = usePacketFilter();
  const [isFocused, setIsFocused] = useState(false);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Escape') {
        clearFilter();
      }
    },
    [clearFilter]
  );

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 border-b border-border bg-surface-1">
      {/* Filter icon */}
      <Filter className="w-3.5 h-3.5 text-muted-foreground shrink-0" />

      {/* Filter input */}
      <div className="flex-1 relative">
        <input
          type="text"
          placeholder="Filter: tcp port 443, ip 192.168.1.1, dns, contains login..."
          value={filterExpression}
          onChange={(e) => handleFilterChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setTimeout(() => setIsFocused(false), 200)}
          className="w-full bg-surface-2 border border-border/50 rounded px-2 py-1 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-primary/50 pr-8"
        />
        {filterExpression && (
          <button
            onClick={clearFilter}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* Quick filters dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="h-6 gap-1 text-[10px]">
            Quick
            <ChevronDown className="w-3 h-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          {QUICK_FILTERS.map((qf) => (
            <DropdownMenuItem
              key={qf.value}
              onClick={() => handleFilterChange(qf.value)}
              className="text-xs"
            >
              {qf.label}
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          {topProtocols.slice(0, 5).map(([proto, count]) => (
            <DropdownMenuItem
              key={proto}
              onClick={() => handleFilterChange(proto.toLowerCase())}
              className="text-xs"
            >
              {proto} <span className="ml-auto text-muted-foreground">({count})</span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Summary */}
      <span className="text-[10px] text-muted-foreground whitespace-nowrap">
        {summary.filtered}/{summary.total} packets
        {summary.hidden > 0 && ` (${summary.hidden} hidden)`}
      </span>
    </div>
  );
}
