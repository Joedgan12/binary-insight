import { MOCK_PACKETS } from '@/lib/mockData';
import { protocolColors } from '@/lib/colorMap';
import { useMemo, useCallback } from 'react';
import { Play, Pause, Download, Upload, RotateCcw } from 'lucide-react';
import { useNetworkStore } from '@/store/networkStore';
import { usePacketFilter } from '@/hooks/usePacketFilter';
import FilterBar from './FilterBar';
import PacketDetail from './PacketDetail';
import { Virtuoso } from 'react-virtuoso';
import { cn } from '@/lib/utils';

export default function PacketList() {
  const { filteredPackets, summary } = usePacketFilter();
  const selectedPacketId = useNetworkStore((s) => s.selectedPacketId);
  const selectPacket = useNetworkStore((s) => s.selectPacket);
  const isCapturing = useNetworkStore((s) => s.isCapturing);
  const storePackets = useNetworkStore((s) => s.packets);

  // Use store packets or fallback to mock
  const displayPackets = useMemo(() => {
    if (filteredPackets.length > 0) return filteredPackets;
    if (storePackets.length > 0) return storePackets;
    return MOCK_PACKETS.map((p) => ({
      ...p,
      timestamp: p.time,
      layers: [],
      rawHex: '',
    }));
  }, [filteredPackets, storePackets]);

  const selectedPacket = useMemo(
    () => displayPackets.find((p) => p.id === selectedPacketId) ?? null,
    [displayPackets, selectedPacketId]
  );

  const handleRowClick = useCallback(
    (packetId: number) => {
      selectPacket(packetId === selectedPacketId ? null : packetId);
    },
    [selectPacket, selectedPacketId]
  );

  return (
    <div className="flex flex-col h-full bg-card">
      {/* Filter bar */}
      <FilterBar />

      {/* Toolbar */}
      <div className="flex items-center gap-1 px-3 py-1 border-b border-border/50">
        <button
          className={cn(
            'p-1 rounded transition-colors',
            isCapturing ? 'bg-red-500/20 text-red-400' : 'hover:bg-secondary/50 text-accent'
          )}
          title={isCapturing ? 'Stop Capture' : 'Start Capture'}
        >
          {isCapturing ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
        </button>
        <button className="p-1 hover:bg-secondary/50 rounded transition-colors" title="Import PCAP">
          <Upload className="w-3.5 h-3.5 text-muted-foreground" />
        </button>
        <button className="p-1 hover:bg-secondary/50 rounded transition-colors" title="Export">
          <Download className="w-3.5 h-3.5 text-muted-foreground" />
        </button>
        <button className="p-1 hover:bg-secondary/50 rounded transition-colors" title="Reset">
          <RotateCcw className="w-3.5 h-3.5 text-muted-foreground" />
        </button>
        <div className="ml-auto text-[10px] text-muted-foreground">
          {summary.total > 0
            ? `${summary.filtered} of ${summary.total} packets`
            : `${displayPackets.length} packets (demo)`}
        </div>
      </div>

      {/* Packet table + detail split */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Table header */}
        <div className="flex text-[10px] text-muted-foreground font-semibold uppercase tracking-wider bg-surface-1 border-b border-border/50 px-2">
          <span className="w-10 py-1 shrink-0">#</span>
          <span className="w-24 py-1 shrink-0">Time</span>
          <span className="flex-1 py-1 min-w-[100px]">Source</span>
          <span className="flex-1 py-1 min-w-[100px]">Destination</span>
          <span className="w-16 py-1 shrink-0">Proto</span>
          <span className="w-12 py-1 shrink-0">Len</span>
          <span className="flex-[2] py-1 min-w-[150px]">Info</span>
        </div>

        {/* Virtualized packet list */}
        <div className="flex-1 overflow-hidden">
          <Virtuoso
            totalCount={displayPackets.length}
            itemContent={(index) => {
              const pkt = displayPackets[index];
              const isSelected = selectedPacketId === pkt.id;
              const time = (pkt as any).timestamp || (pkt as any).time || '';

              return (
                <div
                  onClick={() => handleRowClick(pkt.id)}
                  className={cn(
                    'flex items-center px-2 text-[11px] font-mono cursor-pointer transition-colors border-b border-border/10',
                    isSelected
                      ? 'bg-primary/10 text-foreground'
                      : 'hover:bg-secondary/20 text-foreground/80'
                  )}
                >
                  <span className="w-10 py-0.5 text-muted-foreground shrink-0">{pkt.id}</span>
                  <span className="w-24 py-0.5 shrink-0">{time}</span>
                  <span className="flex-1 py-0.5 truncate min-w-[100px]">{pkt.source}</span>
                  <span className="flex-1 py-0.5 truncate min-w-[100px]">{pkt.destination}</span>
                  <span
                    className={cn(
                      'w-16 py-0.5 font-semibold shrink-0',
                      protocolColors[pkt.protocol] || 'text-foreground'
                    )}
                  >
                    {pkt.protocol}
                  </span>
                  <span className="w-12 py-0.5 shrink-0">{pkt.length}</span>
                  <span className="flex-[2] py-0.5 truncate min-w-[150px]">{pkt.info}</span>
                </div>
              );
            }}
            style={{ height: '100%' }}
            overscan={30}
          />
        </div>

        {/* Packet detail panel */}
        {selectedPacket && (
          <div className="h-64 border-t border-border overflow-hidden">
            <PacketDetail packet={selectedPacket as any} />
          </div>
        )}
      </div>
    </div>
  );
}
