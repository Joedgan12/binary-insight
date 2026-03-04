import { useMemo, useCallback, useRef, useEffect, useState } from 'react';
import { useFileStore } from '@/store/fileStore';
import { useHexSelection } from '@/hooks/useHexSelection';
import { MOCK_HEX_DATA, MOCK_REGIONS, FieldRegion } from '@/lib/mockData';
import { toHex, toAscii, formatOffset } from '@/lib/formatters';
import { fieldTypeColors } from '@/lib/colorMap';
import { cn } from '@/lib/utils';
import { Virtuoso } from 'react-virtuoso';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

const BYTES_PER_ROW = 16;

function getRegionForByte(index: number, regions: FieldRegion[]): FieldRegion | undefined {
  return regions.find((r) => index >= r.start && index < r.start + r.size);
}

interface HexRowProps {
  rowIndex: number;
  bytes: Uint8Array;
  regions: FieldRegion[];
  selectedStart: number | null;
  selectedEnd: number | null;
  hoveredOffset: number | null;
  onByteMouseDown: (offset: number, shiftKey: boolean) => void;
  onByteMouseEnter: (offset: number) => void;
}

function HexRow({
  rowIndex,
  bytes,
  regions,
  selectedStart,
  selectedEnd,
  hoveredOffset,
  onByteMouseDown,
  onByteMouseEnter,
}: HexRowProps) {
  const rowOffset = rowIndex * BYTES_PER_ROW;
  const rowEnd = Math.min(rowOffset + BYTES_PER_ROW, bytes.length);
  const rowBytes = bytes.slice(rowOffset, rowEnd);

  return (
    <div className="flex px-3 hover:bg-secondary/20 transition-colors h-5 items-center">
      {/* Offset column */}
      <span className="w-20 text-muted-foreground/70 select-none shrink-0 font-mono text-xs">
        {formatOffset(rowOffset)}
      </span>

      {/* Hex bytes */}
      <div className="flex gap-0 shrink-0">
        {Array.from(rowBytes).map((byte, colIdx) => {
          const absIdx = rowOffset + colIdx;
          const region = getRegionForByte(absIdx, regions);
          const bgColor = region ? fieldTypeColors[region.type] || '' : '';
          const isSelected =
            selectedStart !== null &&
            selectedEnd !== null &&
            absIdx >= selectedStart &&
            absIdx <= selectedEnd;
          const isHovered = hoveredOffset === absIdx;

          return (
            <Tooltip key={colIdx} delayDuration={400}>
              <TooltipTrigger asChild>
                <span
                  className={cn(
                    'w-7 text-center cursor-pointer rounded-sm font-mono text-xs leading-5 transition-colors duration-75',
                    bgColor,
                    isSelected && 'ring-1 ring-blue-400 bg-blue-500/30 text-white',
                    isHovered && !isSelected && 'bg-white/10',
                    !region && !isSelected && !isHovered && 'text-muted-foreground'
                  )}
                  onMouseDown={(e) => onByteMouseDown(absIdx, e.shiftKey)}
                  onMouseEnter={() => onByteMouseEnter(absIdx)}
                >
                  {toHex(byte)}
                </span>
              </TooltipTrigger>
              <TooltipContent side="top" className="bg-surface-3 border-border/50 text-xs font-mono">
                <div className="space-y-0.5">
                  <div>Offset: <span className="text-blue-400">0x{absIdx.toString(16).padStart(4, '0')}</span></div>
                  <div>Hex: <span className="text-green-400">{toHex(byte)}</span> | Dec: <span className="text-yellow-400">{byte}</span> | ASCII: <span className="text-purple-400">{toAscii(byte)}</span></div>
                  {region && <div>Field: <span className="text-orange-400">{region.name}</span> ({region.type})</div>}
                </div>
              </TooltipContent>
            </Tooltip>
          );
        })}
        {/* Pad if last row incomplete */}
        {rowBytes.length < BYTES_PER_ROW &&
          Array.from({ length: BYTES_PER_ROW - rowBytes.length }, (_, i) => (
            <span key={`pad-${i}`} className="w-7 text-center" />
          ))}
      </div>

      {/* Separator */}
      <div className="w-px h-4 bg-border/30 mx-2 shrink-0" />

      {/* ASCII column */}
      <div className="flex shrink-0">
        {Array.from(rowBytes).map((byte, colIdx) => {
          const absIdx = rowOffset + colIdx;
          const region = getRegionForByte(absIdx, regions);
          const bgColor = region ? fieldTypeColors[region.type] || '' : '';
          const isSelected =
            selectedStart !== null &&
            selectedEnd !== null &&
            absIdx >= selectedStart &&
            absIdx <= selectedEnd;
          const isHovered = hoveredOffset === absIdx;
          const char = toAscii(byte);

          return (
            <span
              key={colIdx}
              className={cn(
                'w-[9px] text-center cursor-pointer font-mono text-xs leading-5 transition-colors duration-75',
                bgColor,
                isSelected && 'bg-blue-500/30 text-white',
                isHovered && !isSelected && 'bg-white/10',
                !region && !isSelected && char === '.' && 'text-muted-foreground/40',
                !region && !isSelected && char !== '.' && 'text-muted-foreground/70'
              )}
              onMouseDown={(e) => onByteMouseDown(absIdx, e.shiftKey)}
              onMouseEnter={() => onByteMouseEnter(absIdx)}
            >
              {char}
            </span>
          );
        })}
      </div>
    </div>
  );
}

export default function HexViewer() {
  const activeTabId = useFileStore((s) => s.activeTabId);
  const fileData = useFileStore((s) => activeTabId ? s.fileDataCache[activeTabId] : null);
  const {
    selection,
    hoveredOffset,
    handleByteMouseDown,
    handleByteMouseEnter,
    handleMouseUp,
    handleMouseLeave,
  } = useHexSelection();

  // Use fileData or fallback to mock
  const bytes = useMemo(
    () => fileData?.bytes ?? new Uint8Array(MOCK_HEX_DATA),
    [fileData]
  );
  const regions = useMemo(
    () => (fileData?.regions ?? MOCK_REGIONS) as FieldRegion[],
    [fileData]
  );

  const totalRows = Math.ceil(bytes.length / BYTES_PER_ROW);

  const [goToOffset, setGoToOffset] = useState('');
  const virtuosoRef = useRef<any>(null);

  const handleGoToOffset = useCallback(() => {
    const offset = parseInt(goToOffset, 16);
    if (!isNaN(offset) && offset >= 0 && offset < bytes.length) {
      const row = Math.floor(offset / BYTES_PER_ROW);
      virtuosoRef.current?.scrollToIndex({ index: row, align: 'center' });
    }
  }, [goToOffset, bytes.length]);

  return (
    <div
      className="flex-1 flex flex-col overflow-hidden"
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
    >
      {/* Column header */}
      <div className="sticky top-0 bg-card/95 backdrop-blur-sm z-10 border-b border-border px-3 py-1 flex items-center">
        <span className="w-20 text-muted-foreground text-xs font-mono">Offset</span>
        <div className="flex gap-0">
          {Array.from({ length: BYTES_PER_ROW }, (_, i) => (
            <span key={i} className="w-7 text-center text-muted-foreground text-xs font-mono">
              {toHex(i)}
            </span>
          ))}
        </div>
        <div className="w-px h-4 bg-border/30 mx-2" />
        <span className="text-muted-foreground text-xs font-mono">ASCII</span>

        {/* Go to offset */}
        <div className="ml-auto flex items-center gap-1">
          <input
            type="text"
            placeholder="Go to offset (hex)"
            value={goToOffset}
            onChange={(e) => setGoToOffset(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleGoToOffset()}
            className="bg-surface-2 border border-border/50 rounded px-2 py-0.5 text-xs font-mono w-32 focus:outline-none focus:ring-1 focus:ring-primary/50"
          />
        </div>
      </div>

      {/* Virtualized hex rows */}
      <Virtuoso
        ref={virtuosoRef}
        totalCount={totalRows}
        itemContent={(index) => (
          <HexRow
            rowIndex={index}
            bytes={bytes}
            regions={regions}
            selectedStart={selection?.start ?? null}
            selectedEnd={selection?.end ?? null}
            hoveredOffset={hoveredOffset}
            onByteMouseDown={handleByteMouseDown}
            onByteMouseEnter={handleByteMouseEnter}
          />
        )}
        className="flex-1"
        style={{ height: '100%' }}
        overscan={20}
      />

      {/* Selection info bar */}
      {selection && (
        <div className="bg-surface-2 border-t border-border/50 px-3 py-1 flex items-center gap-4 text-xs font-mono text-muted-foreground">
          <span>
            Selection: 0x{selection.start.toString(16).padStart(4, '0')} - 0x{selection.end.toString(16).padStart(4, '0')}
          </span>
          <span>Length: {selection.end - selection.start + 1} bytes</span>
          {selection.start === selection.end && (
            <>
              <span>Value: {bytes[selection.start]} (0x{toHex(bytes[selection.start])})</span>
              <span>Char: {toAscii(bytes[selection.start])}</span>
            </>
          )}
        </div>
      )}
    </div>
  );
}
