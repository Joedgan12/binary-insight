import { useState } from 'react';
import { ChevronRight, ChevronDown, Hash, Type, FileCode2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { fieldTypeDotColors } from '@/lib/colorMap';
import { formatOffset, toHex } from '@/lib/formatters';
import type { FieldRegion } from '@/lib/mockData';

interface FieldRowProps {
  region: FieldRegion;
  bytes: Uint8Array | null;
  isSelected: boolean;
  onSelect: (region: FieldRegion) => void;
  depth?: number;
}

export default function FieldRow({ region, bytes, isSelected, onSelect, depth = 0 }: FieldRowProps) {
  const [expanded, setExpanded] = useState(false);
  const dotColor = fieldTypeDotColors[region.type] || 'bg-gray-400';

  // Read the raw value from bytes
  const rawValue = bytes
    ? Array.from(bytes.slice(region.start, region.start + Math.min(region.size, 8)))
        .map((b) => toHex(b))
        .join(' ')
    : '—';

  const hasChildren = region.children && region.children.length > 0;

  return (
    <div>
      <div
        className={cn(
          'flex items-center gap-2 px-2 py-1 cursor-pointer transition-colors hover:bg-secondary/30 text-xs',
          isSelected && 'bg-blue-500/15 text-white',
        )}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
        onClick={() => onSelect(region)}
      >
        {/* Expand toggle */}
        {hasChildren ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setExpanded(!expanded);
            }}
            className="w-4 h-4 flex items-center justify-center text-muted-foreground hover:text-foreground"
          >
            {expanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
          </button>
        ) : (
          <span className="w-4" />
        )}

        {/* Type indicator dot */}
        <span className={cn('w-2 h-2 rounded-full shrink-0', dotColor)} />

        {/* Icon based on type */}
        {region.type === 'header' && <FileCode2 className="w-3 h-3 text-hex-header shrink-0" />}
        {region.type === 'metadata' && <Hash className="w-3 h-3 text-hex-metadata shrink-0" />}
        {region.type === 'string' && <Type className="w-3 h-3 text-hex-string shrink-0" />}

        {/* Field name */}
        <span className="font-medium truncate">{region.name}</span>

        {/* Value */}
        <span className="ml-auto font-mono text-muted-foreground truncate max-w-[120px]">
          {region.value || rawValue}
        </span>
      </div>

      {/* Sub-details shown on select */}
      {isSelected && (
        <div className="px-4 py-1 text-xs text-muted-foreground bg-blue-500/5" style={{ paddingLeft: `${depth * 16 + 28}px` }}>
          <div className="flex gap-4 flex-wrap">
            <span>Type: <span className="text-foreground">{region.type}</span></span>
            <span>Offset: <span className="text-blue-400 font-mono">0x{formatOffset(region.start, 4)}</span></span>
            <span>Size: <span className="text-foreground">{region.size} bytes</span></span>
            {region.description && <span>Desc: <span className="text-foreground">{region.description}</span></span>}
          </div>
        </div>
      )}

      {/* Children */}
      <AnimatePresence>
        {expanded && hasChildren && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            {region.children!.map((child, i) => (
              <FieldRow
                key={`${child.name}-${i}`}
                region={child}
                bytes={bytes}
                isSelected={false}
                onSelect={onSelect}
                depth={depth + 1}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
