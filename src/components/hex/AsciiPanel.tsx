import { memo } from 'react';
import { cn } from '@/lib/utils';
import { toAscii } from '@/lib/formatters';
import type { FieldRegion } from '@/lib/mockData';
import { fieldTypeColors } from '@/lib/colorMap';

interface AsciiPanelProps {
  bytes: Uint8Array;
  startOffset: number;
  selectedStart: number | null;
  selectedEnd: number | null;
  hoveredOffset: number | null;
  regions: FieldRegion[];
  onByteMouseDown: (offset: number, shiftKey: boolean) => void;
  onByteMouseEnter: (offset: number) => void;
}

function getRegionForOffset(offset: number, regions: FieldRegion[]): FieldRegion | null {
  for (const r of regions) {
    if (offset >= r.start && offset < r.start + r.size) {
      return r;
    }
  }
  return null;
}

export const AsciiPanel = memo(function AsciiPanel({
  bytes,
  startOffset,
  selectedStart,
  selectedEnd,
  hoveredOffset,
  regions,
  onByteMouseDown,
  onByteMouseEnter,
}: AsciiPanelProps) {
  const COLS = 16;
  const rows = Math.ceil(bytes.length / COLS);

  return (
    <div className="font-mono text-xs select-none">
      {Array.from({ length: rows }, (_, rowIdx) => {
        const rowStart = rowIdx * COLS;
        const rowEnd = Math.min(rowStart + COLS, bytes.length);

        return (
          <div key={rowIdx} className="flex h-5 leading-5">
            {Array.from({ length: rowEnd - rowStart }, (_, colIdx) => {
              const localIdx = rowStart + colIdx;
              const globalOffset = startOffset + localIdx;
              const byte = bytes[localIdx];
              const region = getRegionForOffset(globalOffset, regions);
              const isSelected =
                selectedStart !== null &&
                selectedEnd !== null &&
                globalOffset >= selectedStart &&
                globalOffset <= selectedEnd;
              const isHovered = hoveredOffset === globalOffset;
              const char = toAscii(byte);
              const bgColor = region ? fieldTypeColors[region.type] || '' : '';

              return (
                <span
                  key={colIdx}
                  className={cn(
                    'inline-block w-[9px] text-center cursor-pointer transition-colors duration-75',
                    bgColor,
                    isSelected && 'ring-1 ring-blue-400 bg-blue-500/30 text-white',
                    isHovered && !isSelected && 'bg-white/10',
                    !region && !isSelected && char === '.' && 'text-muted-foreground/50',
                    !region && !isSelected && char !== '.' && 'text-muted-foreground'
                  )}
                  onMouseDown={(e) => onByteMouseDown(globalOffset, e.shiftKey)}
                  onMouseEnter={() => onByteMouseEnter(globalOffset)}
                >
                  {char}
                </span>
              );
            })}
          </div>
        );
      })}
    </div>
  );
});
