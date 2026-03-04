import { useMemo, useState } from 'react';
import { MOCK_ENTROPY } from '@/lib/mockData';
import { useFileStore } from '@/store/fileStore';
import { cn } from '@/lib/utils';

export default function EntropyGraph() {
  const activeTabId = useFileStore((s) => s.activeTabId);
  const fileData = useFileStore((s) => (activeTabId ? s.fileDataCache[activeTabId] : null));
  const [hoveredBlock, setHoveredBlock] = useState<number | null>(null);

  const entropyData = useMemo(() => {
    if (fileData?.entropy && fileData.entropy.length > 0) {
      return fileData.entropy;
    }
    return MOCK_ENTROPY.map((e) => (typeof e === 'number' ? e : e.value));
  }, [fileData]);

  const max = Math.max(...entropyData, 0.01);
  const barWidth = 100 / entropyData.length;

  // Compute average and classification
  const avgEntropy = entropyData.reduce((a, b) => a + b, 0) / entropyData.length;
  const classification =
    avgEntropy > 0.8 ? 'Likely encrypted/compressed' : avgEntropy > 0.5 ? 'Mixed content' : 'Structured data';

  return (
    <div className="bg-card border-t border-border">
      <div className="px-3 py-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider border-b border-border flex items-center justify-between">
        <span>Entropy Analysis</span>
        <div className="flex gap-3 text-[9px] font-normal">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-sm bg-accent" /> High (&gt;0.8)
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-sm bg-primary" /> Medium
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-sm bg-muted-foreground" /> Low (&lt;0.5)
          </span>
        </div>
      </div>
      <div className="h-24 px-3 py-2 flex items-end gap-[1px] relative">
        {entropyData.map((val, i) => {
          const height = (val / max) * 100;
          const color = val > 0.8 ? 'bg-accent' : val > 0.5 ? 'bg-primary' : 'bg-muted-foreground/50';
          const isHovered = hoveredBlock === i;
          return (
            <div
              key={i}
              className={cn(
                color,
                'rounded-t-sm transition-all cursor-crosshair',
                isHovered && 'opacity-100 ring-1 ring-white/30'
              )}
              style={{ width: `${barWidth}%`, height: `${height}%` }}
              onMouseEnter={() => setHoveredBlock(i)}
              onMouseLeave={() => setHoveredBlock(null)}
              title={`Block ${i}: entropy ${val.toFixed(4)}`}
            />
          );
        })}

        {/* Threshold line at 0.8 */}
        <div
          className="absolute left-3 right-3 border-t border-dashed border-yellow-500/30"
          style={{ bottom: `${(0.8 / max) * 100}%` }}
        />
      </div>

      {/* Info bar */}
      <div className="px-3 py-1 border-t border-border/50 flex items-center justify-between text-[10px] text-muted-foreground">
        <span>
          {entropyData.length} blocks | Avg: <span className="text-foreground font-mono">{avgEntropy.toFixed(3)}</span> | {classification}
        </span>
        {hoveredBlock !== null && (
          <span className="font-mono">
            Block {hoveredBlock}: <span className="text-foreground">{entropyData[hoveredBlock].toFixed(4)}</span>
          </span>
        )}
      </div>
    </div>
  );
}
