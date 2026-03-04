import { useState } from 'react';
import { ChevronRight, ChevronDown, Layers, Globe, Network, Wifi } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { toHex, toAscii } from '@/lib/formatters';

interface PacketLayer {
  name: string;
  fields: { name: string; value: string; offset: number; length: number; description?: string }[];
}

interface PacketDetailProps {
  packet: {
    id: number;
    timestamp: string;
    source: string;
    destination: string;
    protocol: string;
    length: number;
    info: string;
    rawHex?: string;
    layers?: PacketLayer[];
  } | null;
}

const LAYER_ICONS: Record<string, any> = {
  Ethernet: Wifi,
  IPv4: Globe,
  IPv6: Globe,
  TCP: Network,
  UDP: Network,
  HTTP: Layers,
  DNS: Layers,
  TLS: Layers,
};

// Generate mock layers if not provided
function getMockLayers(protocol: string): PacketLayer[] {
  const layers: PacketLayer[] = [
    {
      name: 'Ethernet II',
      fields: [
        { name: 'Destination', value: 'ff:ff:ff:ff:ff:ff', offset: 0, length: 6 },
        { name: 'Source', value: '00:1a:2b:3c:4d:5e', offset: 6, length: 6 },
        { name: 'Type', value: '0x0800 (IPv4)', offset: 12, length: 2 },
      ],
    },
    {
      name: 'IPv4',
      fields: [
        { name: 'Version', value: '4', offset: 14, length: 1 },
        { name: 'Header Length', value: '20 bytes', offset: 14, length: 1 },
        { name: 'Total Length', value: '128', offset: 16, length: 2 },
        { name: 'TTL', value: '64', offset: 22, length: 1 },
        { name: 'Protocol', value: protocol === 'TCP' ? '6 (TCP)' : '17 (UDP)', offset: 23, length: 1 },
        { name: 'Source', value: '192.168.1.100', offset: 26, length: 4 },
        { name: 'Destination', value: '142.250.80.46', offset: 30, length: 4 },
      ],
    },
  ];

  if (protocol === 'TCP' || protocol === 'HTTP' || protocol === 'TLS' || protocol === 'HTTPS') {
    layers.push({
      name: 'TCP',
      fields: [
        { name: 'Source Port', value: '54321', offset: 34, length: 2 },
        { name: 'Destination Port', value: '443', offset: 36, length: 2 },
        { name: 'Sequence Number', value: '1234567890', offset: 38, length: 4 },
        { name: 'Flags', value: '[SYN, ACK]', offset: 47, length: 1 },
        { name: 'Window Size', value: '65535', offset: 48, length: 2 },
      ],
    });
  } else if (protocol === 'UDP' || protocol === 'DNS') {
    layers.push({
      name: 'UDP',
      fields: [
        { name: 'Source Port', value: '12345', offset: 34, length: 2 },
        { name: 'Destination Port', value: protocol === 'DNS' ? '53' : '8080', offset: 36, length: 2 },
        { name: 'Length', value: '48', offset: 38, length: 2 },
        { name: 'Checksum', value: '0xABCD', offset: 40, length: 2 },
      ],
    });
  }

  if (protocol === 'HTTP') {
    layers.push({
      name: 'HTTP',
      fields: [
        { name: 'Method', value: 'GET', offset: 54, length: 3 },
        { name: 'URI', value: '/api/data', offset: 58, length: 9 },
        { name: 'Version', value: 'HTTP/1.1', offset: 68, length: 8 },
        { name: 'Host', value: 'example.com', offset: 78, length: 11 },
      ],
    });
  } else if (protocol === 'DNS') {
    layers.push({
      name: 'DNS',
      fields: [
        { name: 'Transaction ID', value: '0x1234', offset: 42, length: 2 },
        { name: 'Flags', value: 'Standard query', offset: 44, length: 2 },
        { name: 'Questions', value: '1', offset: 46, length: 2 },
        { name: 'Query', value: 'example.com', offset: 54, length: 11, description: 'A record query' },
      ],
    });
  } else if (protocol === 'TLS' || protocol === 'HTTPS') {
    layers.push({
      name: 'TLS',
      fields: [
        { name: 'Content Type', value: 'Handshake (22)', offset: 54, length: 1 },
        { name: 'Version', value: 'TLS 1.3', offset: 55, length: 2 },
        { name: 'Length', value: '512', offset: 57, length: 2 },
        { name: 'Handshake Type', value: 'Client Hello', offset: 59, length: 1 },
      ],
    });
  }

  return layers;
}

export default function PacketDetail({ packet }: PacketDetailProps) {
  const [expandedLayers, setExpandedLayers] = useState<Set<string>>(new Set(['IPv4', 'TCP']));
  const [showRawHex, setShowRawHex] = useState(false);

  if (!packet) {
    return (
      <div className="flex-1 flex items-center justify-center text-xs text-muted-foreground p-4">
        <div className="text-center">
          <Layers className="w-8 h-8 mx-auto mb-2 opacity-40" />
          <p>Select a packet to view details</p>
        </div>
      </div>
    );
  }

  const layers = packet.layers?.length ? packet.layers : getMockLayers(packet.protocol);

  const toggleLayer = (name: string) => {
    setExpandedLayers((prev) => {
      const next = new Set(prev);
      next.has(name) ? next.delete(name) : next.add(name);
      return next;
    });
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Packet header info */}
      <div className="px-3 py-1.5 border-b border-border bg-surface-1 text-xs flex items-center gap-4">
        <span className="font-medium">Packet #{packet.id}</span>
        <span className="text-muted-foreground">{packet.timestamp}</span>
        <span className="font-mono">
          {packet.source} → {packet.destination}
        </span>
        <span className="ml-auto text-muted-foreground">{packet.length} bytes</span>
      </div>

      {/* Protocol layers */}
      <div className="flex-1 overflow-y-auto">
        {layers.map((layer) => {
          const isOpen = expandedLayers.has(layer.name);
          const Icon = LAYER_ICONS[layer.name] || Layers;

          return (
            <div key={layer.name} className="border-b border-border/30">
              <button
                onClick={() => toggleLayer(layer.name)}
                className="w-full flex items-center gap-2 px-3 py-1.5 text-xs hover:bg-secondary/20 transition-colors"
              >
                {isOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                <Icon className="w-3.5 h-3.5 text-blue-400" />
                <span className="font-medium">{layer.name}</span>
              </button>
              <AnimatePresence>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.12 }}
                    className="overflow-hidden"
                  >
                    <div className="pb-1">
                      {layer.fields.map((field, fi) => (
                        <div
                          key={fi}
                          className="flex items-center gap-2 px-6 py-0.5 text-[11px] hover:bg-secondary/10 cursor-default"
                        >
                          <span className="text-muted-foreground w-32 shrink-0 truncate">{field.name}:</span>
                          <span className="font-mono text-foreground">{field.value}</span>
                          {field.description && (
                            <span className="ml-2 text-muted-foreground/60 italic">{field.description}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

      {/* Raw hex toggle */}
      <div className="border-t border-border">
        <button
          onClick={() => setShowRawHex(!showRawHex)}
          className="w-full px-3 py-1 text-[10px] text-muted-foreground hover:bg-secondary/20 flex items-center gap-1"
        >
          {showRawHex ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
          Raw Hex Data
        </button>
        <AnimatePresence>
          {showRawHex && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="px-3 py-2 font-mono text-[10px] text-muted-foreground bg-surface-2 max-h-32 overflow-y-auto">
                {packet.rawHex ||
                  'AB CD EF 01 23 45 67 89 AB CD EF 01 23 45 67 89 AB CD EF 01 23 45 67 89 AB CD EF 01 23 45 67 89 AB CD EF 01 23 45 67 89 AB CD EF 01 23 45 67 89 AB CD EF 01 23 45 67 89 AB CD EF 01 23 45 67 89'}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
