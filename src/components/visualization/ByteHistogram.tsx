import { useMemo, useRef, useEffect, useState } from 'react';
import { useFileStore } from '@/store/fileStore';
import { MOCK_HEX_DATA } from '@/lib/mockData';
import { byteFrequency } from '@/lib/formatters';
import { cn } from '@/lib/utils';

export default function ByteHistogram() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoveredByte, setHoveredByte] = useState<number | null>(null);

  const activeTabId = useFileStore((s) => s.activeTabId);
  const fileData = useFileStore((s) => (activeTabId ? s.fileDataCache[activeTabId] : null));

  const bytes = useMemo(
    () => fileData?.bytes ?? new Uint8Array(MOCK_HEX_DATA),
    [fileData]
  );

  const freq = useMemo(() => byteFrequency(bytes), [bytes]);
  const maxFreq = useMemo(() => Math.max(...freq, 1), [freq]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = container.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;
    ctx.scale(dpr, dpr);

    const w = rect.width;
    const h = rect.height;
    const padding = { top: 20, right: 10, bottom: 30, left: 40 };
    const chartW = w - padding.left - padding.right;
    const chartH = h - padding.top - padding.bottom;
    const barWidth = chartW / 256;

    // Clear
    ctx.clearRect(0, 0, w, h);

    // Background grid
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= 4; i++) {
      const y = padding.top + (chartH / 4) * i;
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(w - padding.right, y);
      ctx.stroke();
    }

    // Bars
    for (let i = 0; i < 256; i++) {
      const x = padding.left + i * barWidth;
      const barH = (freq[i] / maxFreq) * chartH;
      const y = padding.top + chartH - barH;

      // Color based on byte type
      let color: string;
      if (i === 0) color = '#ef4444'; // null byte
      else if (i >= 0x20 && i <= 0x7e) color = '#22c55e'; // printable ASCII
      else if (i === 0xff) color = '#f59e0b'; // 0xFF
      else color = '#3b82f6'; // other

      if (hoveredByte === i) {
        color = '#ffffff';
      }

      ctx.fillStyle = color;
      ctx.fillRect(x, y, Math.max(barWidth - 0.5, 1), barH);
    }

    // X-axis labels
    ctx.fillStyle = '#64748b';
    ctx.font = '9px JetBrains Mono, monospace';
    ctx.textAlign = 'center';
    for (let i = 0; i <= 255; i += 32) {
      const x = padding.left + i * barWidth + barWidth / 2;
      ctx.fillText(`0x${i.toString(16).toUpperCase().padStart(2, '0')}`, x, h - 10);
    }

    // Y-axis labels
    ctx.textAlign = 'right';
    for (let i = 0; i <= 4; i++) {
      const y = padding.top + (chartH / 4) * i;
      const val = Math.round(maxFreq * (1 - i / 4));
      ctx.fillText(String(val), padding.left - 5, y + 4);
    }

    // Title
    ctx.fillStyle = '#94a3b8';
    ctx.font = '10px Inter, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('Byte Frequency Distribution', padding.left, 12);
  }, [freq, maxFreq, hoveredByte]);

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const padding = 40;
    const chartW = rect.width - padding - 10;
    const barWidth = chartW / 256;
    const byteIdx = Math.floor((x - padding) / barWidth);
    setHoveredByte(byteIdx >= 0 && byteIdx < 256 ? byteIdx : null);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="px-3 py-1.5 border-b border-border text-[10px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center justify-between">
        <span>Byte Frequency Histogram</span>
        <span className="font-mono normal-case">{bytes.length} bytes analyzed</span>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 px-3 py-1 text-[10px]">
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-[#22c55e]" /> Printable ASCII</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-[#3b82f6]" /> Non-printable</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-[#ef4444]" /> Null (0x00)</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-[#f59e0b]" /> 0xFF</span>
      </div>

      {/* Canvas */}
      <div ref={containerRef} className="flex-1 min-h-[200px]">
        <canvas
          ref={canvasRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setHoveredByte(null)}
          className="cursor-crosshair"
        />
      </div>

      {/* Hover info */}
      {hoveredByte !== null && (
        <div className="px-3 py-1 border-t border-border text-xs font-mono text-muted-foreground">
          Byte 0x{hoveredByte.toString(16).toUpperCase().padStart(2, '0')} ({hoveredByte}): {freq[hoveredByte]} occurrences
          ({((freq[hoveredByte] / bytes.length) * 100).toFixed(2)}%)
        </div>
      )}
    </div>
  );
}
