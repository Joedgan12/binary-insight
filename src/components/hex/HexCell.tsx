import { memo } from 'react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { toHex, toAscii } from '@/lib/formatters';
import type { FieldRegion } from '@/lib/mockData';
import { fieldTypeColors } from '@/lib/colorMap';

interface HexCellProps {
  byte: number;
  offset: number;
  isSelected: boolean;
  isHovered: boolean;
  region: FieldRegion | null;
  onMouseDown: (offset: number, shiftKey: boolean) => void;
  onMouseEnter: (offset: number) => void;
}

export const HexCell = memo(function HexCell({
  byte,
  offset,
  isSelected,
  isHovered,
  region,
  onMouseDown,
  onMouseEnter,
}: HexCellProps) {
  const bgColor = region ? fieldTypeColors[region.type] || '' : '';
  const hexValue = toHex(byte);

  return (
    <Tooltip delayDuration={300}>
      <TooltipTrigger asChild>
        <span
          className={cn(
            'inline-block w-[22px] text-center font-mono text-xs cursor-pointer transition-colors duration-75 rounded-sm leading-5',
            bgColor,
            isSelected && 'ring-1 ring-blue-400 bg-blue-500/30 text-white',
            isHovered && !isSelected && 'bg-white/10',
            !region && !isSelected && !isHovered && 'text-muted-foreground'
          )}
          onMouseDown={(e) => onMouseDown(offset, e.shiftKey)}
          onMouseEnter={() => onMouseEnter(offset)}
        >
          {hexValue}
        </span>
      </TooltipTrigger>
      <TooltipContent
        side="top"
        className="bg-surface-3 border-border/50 text-xs font-mono"
      >
        <div className="space-y-0.5">
          <div>
            Offset: <span className="text-blue-400">0x{offset.toString(16).padStart(4, '0')}</span>
          </div>
          <div>
            Hex: <span className="text-green-400">{hexValue}</span> | Dec:{' '}
            <span className="text-yellow-400">{byte}</span> | ASCII:{' '}
            <span className="text-purple-400">{toAscii(byte)}</span>
          </div>
          {region && (
            <div>
              Field: <span className="text-orange-400">{region.name}</span> ({region.type})
            </div>
          )}
        </div>
      </TooltipContent>
    </Tooltip>
  );
});
