import { X, FileText, Globe, Image, Database, Archive, Binary } from 'lucide-react';
import { useFileStore } from '@/store/fileStore';
import { cn } from '@/lib/utils';

const FORMAT_ICON: Record<string, any> = {
  png: Image,
  jpg: Image,
  jpeg: Image,
  gif: Image,
  bmp: Image,
  pcap: Globe,
  pcapng: Globe,
  sqlite: Database,
  db: Database,
  zip: Archive,
  gz: Archive,
  tar: Archive,
};

function getIcon(name: string) {
  const ext = name.split('.').pop()?.toLowerCase() || '';
  return FORMAT_ICON[ext] || FileText;
}

export default function TabBar() {
  const tabs = useFileStore((s) => s.tabs);
  const activeTabId = useFileStore((s) => s.activeTabId);
  const setActiveTab = useFileStore((s) => s.setActiveTab);
  const closeFile = useFileStore((s) => s.closeFile);

  if (tabs.length === 0) {
    return (
      <div className="h-9 bg-card border-b border-border flex items-center px-3">
        <span className="text-xs text-muted-foreground font-mono flex items-center gap-1.5">
          <Binary className="w-3 h-3" /> No files open
        </span>
      </div>
    );
  }

  return (
    <div className="h-9 bg-card border-b border-border flex items-center overflow-x-auto">
      {tabs.map((tab) => {
        const Icon = getIcon(tab.name);
        const isActive = tab.id === activeTabId;
        return (
          <div
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'flex items-center gap-1.5 px-3 h-full text-xs font-mono border-r border-border cursor-pointer transition-colors group',
              isActive
                ? 'bg-background text-foreground border-b-2 border-b-primary'
                : 'text-muted-foreground hover:text-foreground hover:bg-secondary/30'
            )}
          >
            <Icon className="w-3 h-3 flex-shrink-0" />
            <span className="truncate max-w-[140px]">{tab.name}</span>
            {tab.modified && <span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />}
            <button
              onClick={(e) => {
                e.stopPropagation();
                closeFile(tab.id);
              }}
              className="w-3 h-3 opacity-0 group-hover:opacity-60 hover:!opacity-100 ml-1 flex-shrink-0 transition-opacity"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
