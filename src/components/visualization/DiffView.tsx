import { useMemo, useState } from 'react';
import { cn } from '@/lib/utils';
import { toHex, toAscii, formatOffset } from '@/lib/formatters';
import { ArrowLeftRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface DiffResult {
  offset: number;
  byteA: number;
  byteB: number;
}

interface DiffViewProps {
  bytesA: Uint8Array | null;
  bytesB: Uint8Array | null;
  nameA?: string;
  nameB?: string;
}

export default function DiffView({ bytesA, bytesB, nameA = 'File A', nameB = 'File B' }: DiffViewProps) {
  const [currentDiff, setCurrentDiff] = useState(0);

  // If no files, show placeholder
  if (!bytesA || !bytesB) {
    return (
      <div className="flex-1 flex items-center justify-center text-xs text-muted-foreground p-8">
        <div className="text-center">
          <ArrowLeftRight className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="font-medium">Binary Diff Viewer</p>
          <p className="text-[10px] mt-1">Open two files to compare them byte-by-byte</p>
        </div>
      </div>
    );
  }

  // Calculate diffs
  const diffs = useMemo(() => {
    const result: DiffResult[] = [];
    const maxLen = Math.max(bytesA.length, bytesB.length);
    for (let i = 0; i < maxLen; i++) {
      const a = i < bytesA.length ? bytesA[i] : -1;
      const b = i < bytesB.length ? bytesB[i] : -1;
      if (a !== b) {
        result.push({ offset: i, byteA: a, byteB: b });
      }
    }
    return result;
  }, [bytesA, bytesB]);

  const diffSet = useMemo(() => new Set(diffs.map((d) => d.offset)), [diffs]);

  const BYTES_PER_ROW = 16;
  const maxLen = Math.max(bytesA.length, bytesB.length);
  const totalRows = Math.ceil(maxLen / BYTES_PER_ROW);

  // Show rows around current diff
  const currentDiffOffset = diffs[currentDiff]?.offset ?? 0;
  const startRow = Math.max(0, Math.floor(currentDiffOffset / BYTES_PER_ROW) - 5);
  const visibleRows = Math.min(20, totalRows - startRow);

  const goNext = () => setCurrentDiff((prev) => Math.min(prev + 1, diffs.length - 1));
  const goPrev = () => setCurrentDiff((prev) => Math.max(prev - 1, 0));

  const renderRow = (rowIdx: number, bytes: Uint8Array, side: 'a' | 'b') => {
    const rowOffset = rowIdx * BYTES_PER_ROW;
    return (
      <div className="flex items-center h-5 font-mono text-[11px] px-1">
        <span className="w-16 text-muted-foreground/60 text-right pr-2 shrink-0 select-none text-[10px]">
          {formatOffset(rowOffset, 6)}
        </span>
        <div className="flex gap-0 shrink-0">
          {Array.from({ length: BYTES_PER_ROW }, (_, i) => {
            const offset = rowOffset + i;
            const byte = offset < bytes.length ? bytes[offset] : -1;
            const isDiff = diffSet.has(offset);
            const isCurrent = diffs[currentDiff]?.offset === offset;

            return (
              <span
                key={i}
                className={cn(
                  'w-6 text-center transition-colors',
                  byte === -1 && 'text-muted-foreground/20',
                  isDiff && side === 'a' && 'bg-red-500/20 text-red-400',
                  isDiff && side === 'b' && 'bg-green-500/20 text-green-400',
                  isCurrent && 'ring-1 ring-yellow-400 font-bold'
                )}
              >
                {byte >= 0 ? toHex(byte) : '--'}
              </span>
            );
          })}
        </div>
        <div className="w-px h-3 bg-border/30 mx-1 shrink-0" />
        <div className="flex shrink-0">
          {Array.from({ length: BYTES_PER_ROW }, (_, i) => {
            const offset = rowOffset + i;
            const byte = offset < bytes.length ? bytes[offset] : -1;
            const isDiff = diffSet.has(offset);

            return (
              <span
                key={i}
                className={cn(
                  'w-[8px] text-center text-[10px]',
                  byte === -1 && 'text-muted-foreground/20',
                  isDiff && side === 'a' && 'text-red-400',
                  isDiff && side === 'b' && 'text-green-400',
                  !isDiff && 'text-muted-foreground/50'
                )}
              >
                {byte >= 0 ? toAscii(byte) : ' '}
              </span>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-border">
        <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
          Binary Diff — {diffs.length} differences
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="h-5 w-5 p-0" onClick={goPrev} disabled={currentDiff === 0}>
            <ChevronLeft className="w-3 h-3" />
          </Button>
          <span className="text-[10px] text-muted-foreground">
            {diffs.length > 0 ? `${currentDiff + 1}/${diffs.length}` : '0/0'}
          </span>
          <Button variant="ghost" size="sm" className="h-5 w-5 p-0" onClick={goNext} disabled={currentDiff >= diffs.length - 1}>
            <ChevronRight className="w-3 h-3" />
          </Button>
        </div>
      </div>

      {/* Side-by-side diff */}
      <div className="flex-1 flex overflow-hidden">
        {/* File A */}
        <div className="flex-1 border-r border-border overflow-y-auto">
          <div className="px-2 py-1 bg-red-500/5 text-[10px] text-red-400 font-medium border-b border-border/50 sticky top-0">
            {nameA} ({bytesA.length} bytes)
          </div>
          {Array.from({ length: visibleRows }, (_, i) => (
            <div key={startRow + i}>{renderRow(startRow + i, bytesA, 'a')}</div>
          ))}
        </div>

        {/* File B */}
        <div className="flex-1 overflow-y-auto">
          <div className="px-2 py-1 bg-green-500/5 text-[10px] text-green-400 font-medium border-b border-border/50 sticky top-0">
            {nameB} ({bytesB.length} bytes)
          </div>
          {Array.from({ length: visibleRows }, (_, i) => (
            <div key={startRow + i}>{renderRow(startRow + i, bytesB, 'b')}</div>
          ))}
        </div>
      </div>

      {/* Summary */}
      <div className="px-3 py-1 border-t border-border text-[10px] text-muted-foreground flex items-center gap-4">
        <span>
          <span className="text-red-400">■</span> Removed/Changed in {nameA}
        </span>
        <span>
          <span className="text-green-400">■</span> Added/Changed in {nameB}
        </span>
        <span className="ml-auto">
          Similarity: {((1 - diffs.length / Math.max(maxLen, 1)) * 100).toFixed(1)}%
        </span>
      </div>
    </div>
  );
}
