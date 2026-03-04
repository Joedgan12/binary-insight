import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface PacketData {
  id: number;
  timestamp: string;
  source: string;
  destination: string;
  protocol: string;
  length: number;
  info: string;
  layers: PacketLayer[];
  rawHex: string;
}

export interface PacketLayer {
  name: string;
  fields: PacketField[];
}

export interface PacketField {
  name: string;
  value: string;
  offset: number;
  length: number;
  description?: string;
}

export interface CaptureSession {
  id: string;
  name: string;
  startTime: string;
  packetCount: number;
  isLive: boolean;
}

export interface PacketFilter {
  protocol: string | null;
  sourceIp: string | null;
  destIp: string | null;
  port: number | null;
  keyword: string | null;
  bpfExpression: string | null;
}

export interface NetworkState {
  // Sessions
  sessions: CaptureSession[];
  activeSessionId: string | null;

  // Packets
  packets: PacketData[];
  selectedPacketId: number | null;
  filteredPackets: PacketData[];

  // Filter
  filter: PacketFilter;
  filterExpression: string;

  // Capture
  isCapturing: boolean;
  captureInterface: string | null;

  // Stats
  protocolStats: Record<string, number>;

  // Actions
  loadPcap: (sessionId: string, packets: PacketData[]) => void;
  setPackets: (packets: PacketData[]) => void;
  selectPacket: (packetId: number | null) => void;
  setFilter: (filter: Partial<PacketFilter>) => void;
  setFilterExpression: (expr: string) => void;
  applyFilter: () => void;
  clearFilter: () => void;
  startCapture: (iface: string) => void;
  stopCapture: () => void;
  addPacket: (packet: PacketData) => void;
  addSession: (session: CaptureSession) => void;
  setActiveSession: (sessionId: string) => void;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function matchesFilter(packet: PacketData, filter: PacketFilter): boolean {
  if (filter.protocol && packet.protocol.toLowerCase() !== filter.protocol.toLowerCase()) {
    return false;
  }
  if (filter.sourceIp && !packet.source.includes(filter.sourceIp)) {
    return false;
  }
  if (filter.destIp && !packet.destination.includes(filter.destIp)) {
    return false;
  }
  if (filter.port) {
    const portStr = String(filter.port);
    if (!packet.source.includes(`:${portStr}`) && !packet.destination.includes(`:${portStr}`) && !packet.info.includes(portStr)) {
      return false;
    }
  }
  if (filter.keyword) {
    const kw = filter.keyword.toLowerCase();
    if (
      !packet.info.toLowerCase().includes(kw) &&
      !packet.source.toLowerCase().includes(kw) &&
      !packet.destination.toLowerCase().includes(kw) &&
      !packet.protocol.toLowerCase().includes(kw)
    ) {
      return false;
    }
  }
  return true;
}

function computeProtocolStats(packets: PacketData[]): Record<string, number> {
  const stats: Record<string, number> = {};
  for (const p of packets) {
    stats[p.protocol] = (stats[p.protocol] || 0) + 1;
  }
  return stats;
}

// ─── Store ───────────────────────────────────────────────────────────────────

export const useNetworkStore = create<NetworkState>()(
  immer((set, get) => ({
    sessions: [],
    activeSessionId: null,
    packets: [],
    selectedPacketId: null,
    filteredPackets: [],
    filter: {
      protocol: null,
      sourceIp: null,
      destIp: null,
      port: null,
      keyword: null,
      bpfExpression: null,
    },
    filterExpression: '',
    isCapturing: false,
    captureInterface: null,
    protocolStats: {},

    loadPcap: (sessionId, packets) =>
      set((state) => {
        state.activeSessionId = sessionId;
        state.packets = packets;
        state.filteredPackets = packets;
        state.selectedPacketId = null;
        state.protocolStats = computeProtocolStats(packets);
      }),

    setPackets: (packets) =>
      set((state) => {
        state.packets = packets;
        state.filteredPackets = packets.filter((p) => matchesFilter(p, state.filter));
        state.protocolStats = computeProtocolStats(packets);
      }),

    selectPacket: (packetId) =>
      set((state) => {
        state.selectedPacketId = packetId;
      }),

    setFilter: (filter) =>
      set((state) => {
        Object.assign(state.filter, filter);
      }),

    setFilterExpression: (expr) =>
      set((state) => {
        state.filterExpression = expr;
      }),

    applyFilter: () =>
      set((state) => {
        state.filteredPackets = state.packets.filter((p) =>
          matchesFilter(p, state.filter)
        );
      }),

    clearFilter: () =>
      set((state) => {
        state.filter = {
          protocol: null,
          sourceIp: null,
          destIp: null,
          port: null,
          keyword: null,
          bpfExpression: null,
        };
        state.filterExpression = '';
        state.filteredPackets = [...state.packets];
      }),

    startCapture: (iface) =>
      set((state) => {
        state.isCapturing = true;
        state.captureInterface = iface;
      }),

    stopCapture: () =>
      set((state) => {
        state.isCapturing = false;
        state.captureInterface = null;
      }),

    addPacket: (packet) =>
      set((state) => {
        state.packets.push(packet);
        if (matchesFilter(packet, state.filter)) {
          state.filteredPackets.push(packet);
        }
        state.protocolStats[packet.protocol] =
          (state.protocolStats[packet.protocol] || 0) + 1;
      }),

    addSession: (session) =>
      set((state) => {
        state.sessions.push(session);
      }),

    setActiveSession: (sessionId) =>
      set((state) => {
        state.activeSessionId = sessionId;
      }),
  }))
);
