import { useCallback, useMemo } from 'react';
import { useNetworkStore } from '@/store/networkStore';

/**
 * Hook for packet filtering logic with expression parsing
 */
export function usePacketFilter() {
  const {
    packets,
    filteredPackets,
    filter,
    filterExpression,
    protocolStats,
    setFilter,
    setFilterExpression,
    applyFilter,
    clearFilter,
  } = useNetworkStore();

  /**
   * Parse a BPF-like filter expression into structured filter
   * Supports: "tcp", "ip 192.168.1.1", "port 443", "http", etc.
   */
  const parseExpression = useCallback(
    (expr: string) => {
      const parts = expr.trim().toLowerCase().split(/\s+/);
      const newFilter: Record<string, any> = {
        protocol: null,
        sourceIp: null,
        destIp: null,
        port: null,
        keyword: null,
        bpfExpression: expr,
      };

      for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        const next = parts[i + 1];

        if (['tcp', 'udp', 'http', 'https', 'dns', 'tls', 'icmp', 'arp', 'websocket'].includes(part)) {
          newFilter.protocol = part.toUpperCase();
        } else if (part === 'src' && next) {
          newFilter.sourceIp = next;
          i++;
        } else if (part === 'dst' && next) {
          newFilter.destIp = next;
          i++;
        } else if (part === 'port' && next) {
          newFilter.port = parseInt(next, 10) || null;
          i++;
        } else if (part === 'ip' && next) {
          // Apply to both src and dst
          newFilter.sourceIp = next;
          newFilter.destIp = next;
          i++;
        } else if (part === 'contains' && next) {
          newFilter.keyword = parts.slice(i + 1).join(' ');
          break;
        } else if (!newFilter.keyword) {
          newFilter.keyword = part;
        }
      }

      setFilter(newFilter);
      setFilterExpression(expr);
      applyFilter();
    },
    [setFilter, setFilterExpression, applyFilter]
  );

  const handleFilterChange = useCallback(
    (expr: string) => {
      setFilterExpression(expr);
      if (expr.trim() === '') {
        clearFilter();
      } else {
        parseExpression(expr);
      }
    },
    [setFilterExpression, clearFilter, parseExpression]
  );

  const summary = useMemo(() => {
    const total = packets.length;
    const filtered = filteredPackets.length;
    const hidden = total - filtered;
    return { total, filtered, hidden };
  }, [packets.length, filteredPackets.length]);

  const topProtocols = useMemo(() => {
    return Object.entries(protocolStats)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10);
  }, [protocolStats]);

  return {
    filter,
    filterExpression,
    filteredPackets,
    packets,
    summary,
    topProtocols,
    protocolStats,
    handleFilterChange,
    parseExpression,
    clearFilter,
  };
}
