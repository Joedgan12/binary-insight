import { useMemo, useRef, useEffect } from 'react';
import { useNetworkStore } from '@/store/networkStore';
import { MOCK_PACKETS } from '@/lib/mockData';

interface FlowNode {
  id: string;
  label: string;
  x: number;
  y: number;
}

interface FlowArrow {
  from: string;
  to: string;
  protocol: string;
  info: string;
  timestamp: string;
}

const PROTOCOL_COLORS: Record<string, string> = {
  TCP: '#3b82f6',
  UDP: '#a855f7',
  HTTP: '#22c55e',
  HTTPS: '#14b8a6',
  DNS: '#f59e0b',
  TLS: '#06b6d4',
  ICMP: '#ef4444',
  ARP: '#ec4899',
  WebSocket: '#8b5cf6',
};

export default function FlowDiagram() {
  const packets = useNetworkStore((s) => (s.packets.length ? s.packets : MOCK_PACKETS));
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Build flow data
  const flowData = useMemo(() => {
    const nodeSet = new Set<string>();
    const arrows: FlowArrow[] = [];

    for (const pkt of packets) {
      const src = pkt.source.split(':')[0];
      const dst = pkt.destination.split(':')[0];
      nodeSet.add(src);
      nodeSet.add(dst);
      arrows.push({
        from: src,
        to: dst,
        protocol: pkt.protocol,
        info: pkt.info,
        timestamp: pkt.timestamp,
      });
    }

    const uniqueNodes = Array.from(nodeSet);
    const nodes: FlowNode[] = uniqueNodes.map((id, i) => ({
      id,
      label: id,
      x: 80 + i * 180,
      y: 30,
    }));

    return { nodes, arrows };
  }, [packets]);

  // Draw on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    // Clear
    ctx.clearRect(0, 0, rect.width, rect.height);

    const { nodes, arrows } = flowData;
    if (nodes.length === 0) return;

    // Scale nodes to fit
    const nodeSpacing = Math.min(180, (rect.width - 100) / Math.max(nodes.length - 1, 1));
    const scaledNodes = nodes.map((n, i) => ({
      ...n,
      x: 60 + i * nodeSpacing,
    }));

    // Draw vertical timelines
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    for (const node of scaledNodes) {
      ctx.beginPath();
      ctx.moveTo(node.x, 50);
      ctx.lineTo(node.x, rect.height - 10);
      ctx.stroke();
    }
    ctx.setLineDash([]);

    // Draw node labels
    ctx.fillStyle = '#e2e8f0';
    ctx.font = '11px JetBrains Mono, monospace';
    ctx.textAlign = 'center';
    for (const node of scaledNodes) {
      // Draw box
      const tw = ctx.measureText(node.label).width + 16;
      ctx.fillStyle = '#1e293b';
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(node.x - tw / 2, 8, tw, 24, 4);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#e2e8f0';
      ctx.fillText(node.label, node.x, 25);
    }

    // Draw arrows
    const rowHeight = Math.max(18, (rect.height - 80) / Math.max(arrows.length, 1));
    arrows.forEach((arrow, i) => {
      const fromNode = scaledNodes.find((n) => n.id === arrow.from);
      const toNode = scaledNodes.find((n) => n.id === arrow.to);
      if (!fromNode || !toNode) return;

      const y = 60 + i * rowHeight;
      if (y > rect.height - 20) return;

      const color = PROTOCOL_COLORS[arrow.protocol] || '#64748b';

      // Arrow line
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(fromNode.x, y);
      ctx.lineTo(toNode.x, y);
      ctx.stroke();

      // Arrow head
      const direction = toNode.x > fromNode.x ? 1 : -1;
      const headX = toNode.x - direction * 8;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(toNode.x, y);
      ctx.lineTo(headX, y - 4);
      ctx.lineTo(headX, y + 4);
      ctx.closePath();
      ctx.fill();

      // Label
      const midX = (fromNode.x + toNode.x) / 2;
      ctx.fillStyle = color;
      ctx.font = '9px JetBrains Mono, monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`${arrow.protocol}`, midX, y - 4);

      // Timestamp on left
      ctx.fillStyle = '#64748b';
      ctx.textAlign = 'right';
      ctx.font = '8px JetBrains Mono, monospace';
      ctx.fillText(arrow.timestamp, 50, y + 3);
    });
  }, [flowData]);

  return (
    <div className="flex-1 bg-surface-1 rounded overflow-hidden">
      <div className="px-3 py-1.5 border-b border-border text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
        Session Flow Diagram
      </div>
      <canvas
        ref={canvasRef}
        className="w-full h-full min-h-[300px]"
        style={{ display: 'block' }}
      />
    </div>
  );
}
