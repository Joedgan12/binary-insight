import { ChevronRight, ChevronDown, FileCode2 } from 'lucide-react';
import { useState, useMemo, useCallback } from 'react';
import { MOCK_REGIONS, FieldRegion } from '@/lib/mockData';
import { useFileStore } from '@/store/fileStore';
import { fieldTypeColors, fieldTypeDotColors } from '@/lib/colorMap';
import { formatOffset } from '@/lib/formatters';
import FormatSelector from './FormatSelector';
import { motion, AnimatePresence } from 'framer-motion';

export default function StructureTree() {
  const activeTabId = useFileStore((s) => s.activeTabId);
  const fileData = useFileStore((s) => (activeTabId ? s.fileDataCache[activeTabId] : null));
  const activeTab = useFileStore((s) => s.tabs.find((t) => t.id === s.activeTabId));
  const setSelection = useFileStore((s) => s.setSelection);

  const regions = useMemo(() => (fileData?.regions ?? MOCK_REGIONS) as FieldRegion[], [fileData]);
  const format = fileData?.format ?? activeTab?.format ?? 'PNG';

  const [expanded, setExpanded] = useState<Set<number>>(new Set([0, 1, 2]));
  const [selectedRegion, setSelectedRegion] = useState<number | null>(null);

  const toggle = (idx: number) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(idx) ? next.delete(idx) : next.add(idx);
      return next;
    });
  };

  const handleRegionClick = useCallback(
    (region: FieldRegion, idx: number) => {
      setSelectedRegion(idx);
      // Highlight the region in hex viewer
      setSelection({ start: region.start, end: region.start + region.size - 1 });
    },
    [setSelection]
  );

  const handleFormatChange = useCallback((newFormat: string) => {
    // TODO: Trigger re-decode with new format via Tauri
    console.log('Format changed to:', newFormat);
  }, []);

  return (
    <div className="border-t border-border bg-card flex flex-col">
      <div className="px-3 py-1.5 flex items-center justify-between border-b border-border">
        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
          Structure — {format}
        </span>
        <FormatSelector currentFormat={format} onFormatChange={handleFormatChange} />
      </div>
      <div className="flex-1 overflow-y-auto">
        {regions.length === 0 ? (
          <div className="px-3 py-8 text-center text-xs text-muted-foreground">
            <FileCode2 className="w-8 h-8 mx-auto mb-2 opacity-40" />
            <p>No structure detected</p>
            <p className="text-[10px] mt-1">Open a file or select a format decoder</p>
          </div>
        ) : (
          regions.map((region, i) => {
            const isOpen = expanded.has(i);
            const isSelected = selectedRegion === i;
            const colors = fieldTypeColors[region.type];
            const dotColor = fieldTypeDotColors[region.type];
            return (
              <div key={i}>
                <button
                  onClick={() => {
                    toggle(i);
                    handleRegionClick(region, i);
                  }}
                  className={`w-full flex items-center gap-1.5 px-3 py-1 text-xs hover:bg-secondary/30 transition-colors ${colors} ${
                    isSelected ? 'bg-blue-500/10 ring-1 ring-blue-400/30' : ''
                  }`}
                >
                  {isOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                  <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
                  <span className="font-medium">{region.name}</span>
                  <span className="ml-auto text-[10px] text-muted-foreground font-mono">
                    0x{formatOffset(region.start, 4)}–0x{formatOffset(region.start + region.size - 1, 4)}
                  </span>
                </button>
                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.1 }}
                      className="overflow-hidden"
                    >
                      <div className="px-8 py-1 text-[10px] text-muted-foreground space-y-0.5">
                        <div>{region.description}</div>
                        {region.value && (
                          <div>
                            Value: <span className="text-foreground">{region.value}</span>
                          </div>
                        )}
                        <div>
                          Size: <span className="text-foreground">{region.size} bytes</span>
                        </div>
                        <div>
                          Type: <span className="text-foreground capitalize">{region.type}</span>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
