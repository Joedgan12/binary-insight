import { useFileStore } from '@/store/fileStore';
import { useUIStore } from '@/store/uiStore';
import { formatSize, toHex, calculateEntropy } from '@/lib/formatters';
import { useMemo } from 'react';

export default function StatusBar() {
  const selection = useFileStore((s) => s.selection);
  const hoveredOffset = useFileStore((s) => s.hoveredOffset);
  const activeTabId = useFileStore((s) => s.activeTabId);
  const fileData = useFileStore((s) => (activeTabId ? s.fileDataCache[activeTabId] : null));
  const tabs = useFileStore((s) => s.tabs);
  const isLoading = useUIStore((s) => s.isLoading);
  const statusMessage = useUIStore((s) => s.statusMessage);

  const activeTab = tabs.find((t) => t.id === activeTabId);
  const offset = hoveredOffset ?? selection?.start ?? null;
  const selLen = selection ? selection.end - selection.start + 1 : 0;

  const entropy = useMemo(() => {
    if (!fileData?.data || fileData.data.length === 0) return null;
    return calculateEntropy(fileData.data).toFixed(3);
  }, [fileData?.data]);

  const valueAtOffset = useMemo(() => {
    if (offset === null || !fileData?.data || offset >= fileData.data.length) return null;
    const d = fileData.data;
    const u8 = d[offset];
    let info = `UInt8=${u8}`;
    if (offset + 1 < d.length) {
      info += ` U16LE=${d[offset] | (d[offset + 1] << 8)}`;
    }
    if (offset + 3 < d.length) {
      const u32 = d[offset] | (d[offset + 1] << 8) | (d[offset + 2] << 16) | (d[offset + 3] << 24);
      info += ` U32LE=${u32 >>> 0}`;
    }
    return info;
  }, [offset, fileData?.data]);

  return (
    <div className="h-6 bg-card border-t border-border flex items-center px-3 text-[10px] font-mono text-muted-foreground gap-4">
      {isLoading && (
        <span className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
          Loading...
        </span>
      )}

      {statusMessage && <span className="text-primary">{statusMessage}</span>}

      {offset !== null && (
        <span>
          Offset: <span className="text-foreground">0x{toHex(offset, 8)}</span>
        </span>
      )}

      {selLen > 1 && (
        <span>
          Selection: <span className="text-foreground">{selLen} bytes</span>
        </span>
      )}

      {valueAtOffset && (
        <span>
          Value: <span className="text-hex-metadata">{valueAtOffset}</span>
        </span>
      )}

      <span className="ml-auto" />

      {activeTab?.format && (
        <span>
          Format: <span className="text-hex-header">{activeTab.format.toUpperCase()}</span>
        </span>
      )}

      {fileData?.data && (
        <span>
          Size: <span className="text-foreground">{formatSize(fileData.data.length)}</span>
        </span>
      )}

      {entropy !== null && (
        <span>
          Entropy: <span className="text-hex-payload">{entropy}</span>
        </span>
      )}
    </div>
  );
}
