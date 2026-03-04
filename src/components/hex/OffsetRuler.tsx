import { memo } from 'react';
import { formatOffset } from '@/lib/formatters';

interface OffsetRulerProps {
  totalBytes: number;
  startOffset: number;
  bytesPerRow: number;
  visibleRows: number;
}

export const OffsetRuler = memo(function OffsetRuler({
  totalBytes,
  startOffset,
  bytesPerRow,
  visibleRows,
}: OffsetRulerProps) {
  const rows = Math.min(
    visibleRows,
    Math.ceil((totalBytes - startOffset) / bytesPerRow)
  );

  return (
    <div className="font-mono text-xs text-muted-foreground/70 select-none pr-3 border-r border-border/30">
      {Array.from({ length: rows }, (_, i) => {
        const offset = startOffset + i * bytesPerRow;
        return (
          <div key={i} className="h-5 leading-5 text-right">
            {formatOffset(offset)}
          </div>
        );
      })}
    </div>
  );
});
