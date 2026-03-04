import { useState, useCallback } from 'react';
import {
  ChevronRight,
  ChevronDown,
  FileText,
  Folder,
  FolderOpen,
  Search,
  Plus,
  Settings,
  Network,
  BookOpen,
  Bookmark,
  Upload,
  Database,
  Binary,
} from 'lucide-react';
import { MOCK_FILE_TREE, FileEntry } from '@/lib/mockData';
import { useUIStore, type SidePanel } from '@/store/uiStore';
import { useFileStore } from '@/store/fileStore';
import { useFileSession } from '@/hooks/useFileSession';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

function FileTreeItem({
  entry,
  depth = 0,
  onFileClick,
}: {
  entry: FileEntry;
  depth?: number;
  onFileClick: (entry: FileEntry) => void;
}) {
  const [open, setOpen] = useState(true);
  const isFolder = entry.type === 'folder';

  return (
    <div>
      <button
        onClick={() => {
          if (isFolder) {
            setOpen(!open);
          } else {
            onFileClick(entry);
          }
        }}
        className={cn(
          'w-full flex items-center gap-1.5 px-2 py-1 text-xs font-mono hover:bg-secondary/60 rounded-sm transition-colors',
          !isFolder ? 'text-foreground/80' : 'text-foreground/90 font-medium'
        )}
        style={{ paddingLeft: `${depth * 12 + 8}px` }}
      >
        {isFolder ? (
          <>
            {open ? (
              <ChevronDown className="w-3 h-3 text-muted-foreground" />
            ) : (
              <ChevronRight className="w-3 h-3 text-muted-foreground" />
            )}
            {open ? (
              <FolderOpen className="w-3.5 h-3.5 text-primary" />
            ) : (
              <Folder className="w-3.5 h-3.5 text-primary" />
            )}
          </>
        ) : (
          <>
            <span className="w-3" />
            <FileText className="w-3.5 h-3.5 text-muted-foreground" />
          </>
        )}
        <span className="truncate">{entry.name}</span>
        {entry.format && (
          <span className="ml-auto text-[10px] text-muted-foreground bg-secondary px-1.5 rounded">
            {entry.format}
          </span>
        )}
      </button>
      <AnimatePresence>
        {isFolder && open && entry.children && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            {entry.children.map((child, i) => (
              <FileTreeItem key={i} entry={child} depth={depth + 1} onFileClick={onFileClick} />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const SIDE_PANELS: { id: SidePanel; icon: any; label: string }[] = [
  { id: 'files', icon: Folder, label: 'Files' },
  { id: 'structure', icon: Database, label: 'Sessions' },
  { id: 'bookmarks', icon: Bookmark, label: 'Bookmarks' },
];

export default function AnalyzerSidebar() {
  const activeSidePanel = useUIStore((s) => s.activeSidePanel);
  const setActiveSidePanel = useUIStore((s) => s.setActiveSidePanel);
  const setShowSettings = useUIStore((s) => s.setShowSettings);
  const { handleOpenFile, handleLoadPcap } = useFileSession();
  const bookmarks = useFileStore((s) => s.bookmarks);
  const activeTabId = useFileStore((s) => s.activeTabId);
  const [searchQuery, setSearchQuery] = useState('');

  const handleFileClick = useCallback(
    (entry: FileEntry) => {
      if (entry.name.endsWith('.pcap') || entry.name.endsWith('.pcapng')) {
        handleLoadPcap(entry.name);
      } else {
        handleOpenFile(entry.name);
      }
    },
    [handleOpenFile, handleLoadPcap]
  );

  const currentBookmarks = activeTabId ? bookmarks[activeTabId] || [] : [];

  return (
    <div className="w-56 bg-card border-r border-border flex flex-col h-full">
      {/* Brand header */}
      <div className="p-3 border-b border-border flex items-center gap-2">
        <div className="w-6 h-6 rounded bg-primary flex items-center justify-center">
          <Binary className="w-3.5 h-3.5 text-primary-foreground" />
        </div>
        <div>
          <span className="text-xs font-bold tracking-wide text-foreground">BINARY INSIGHT</span>
          <span className="text-[8px] text-muted-foreground ml-1">v1.0</span>
        </div>
      </div>

      {/* Panel tabs */}
      <div className="flex border-b border-border">
        {SIDE_PANELS.map((panel) => (
          <button
            key={panel.id}
            onClick={() => setActiveSidePanel(panel.id)}
            className={cn(
              'flex-1 flex items-center justify-center gap-1 py-1.5 text-[10px] transition-colors',
              activeSidePanel === panel.id
                ? 'text-primary border-b-2 border-primary bg-primary/5'
                : 'text-muted-foreground hover:text-foreground hover:bg-secondary/20'
            )}
          >
            <panel.icon className="w-3 h-3" />
            {panel.label}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="p-2">
        <div className="flex items-center gap-1.5 bg-secondary/50 rounded-md px-2 py-1.5">
          <Search className="w-3 h-3 text-muted-foreground" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent text-xs outline-none placeholder:text-muted-foreground flex-1 text-foreground"
            placeholder={`Search ${activeSidePanel}...`}
          />
        </div>
      </div>

      {/* Panel content */}
      <div className="flex-1 overflow-y-auto py-1">
        {activeSidePanel === 'files' && (
          <>
            {MOCK_FILE_TREE.map((entry, i) => (
              <FileTreeItem key={i} entry={entry} onFileClick={handleFileClick} />
            ))}
          </>
        )}

        {activeSidePanel === 'structure' && (
          <div className="px-2 space-y-1">
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold px-2 py-1">
              Recent Sessions
            </div>
            {['Analysis #1 — sample.png', 'Capture — 2026-03-04', 'Diff — file_a vs file_b'].map((s, i) => (
              <button
                key={i}
                className="w-full text-left px-2 py-1.5 rounded text-xs hover:bg-secondary/40 transition-colors flex items-center gap-2"
              >
                <BookOpen className="w-3 h-3 text-muted-foreground" />
                <span className="truncate">{s}</span>
              </button>
            ))}
          </div>
        )}

        {activeSidePanel === 'bookmarks' && (
          <div className="px-2 space-y-1">
            {currentBookmarks.length === 0 ? (
              <div className="text-xs text-muted-foreground text-center py-8">
                <Bookmark className="w-6 h-6 mx-auto mb-2 opacity-40" />
                No bookmarks yet
              </div>
            ) : (
              currentBookmarks.map((bm) => (
                <button
                  key={bm.id}
                  className="w-full text-left px-2 py-1.5 rounded text-xs hover:bg-secondary/40 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: bm.color }} />
                    <span className="font-medium">{bm.label}</span>
                    <span className="ml-auto font-mono text-muted-foreground">
                      0x{bm.offset.toString(16).padStart(4, '0')}
                    </span>
                  </div>
                </button>
              ))
            )}
          </div>
        )}
      </div>

      {/* Bottom actions */}
      <div className="border-t border-border p-2 space-y-1">
        <button
          onClick={() => handleOpenFile()}
          className="w-full flex items-center justify-center gap-1.5 text-[10px] text-muted-foreground hover:text-foreground py-1.5 rounded hover:bg-secondary/50 transition-colors"
        >
          <Plus className="w-3 h-3" /> Open File
        </button>
        <button
          onClick={() => handleLoadPcap()}
          className="w-full flex items-center justify-center gap-1.5 text-[10px] text-muted-foreground hover:text-foreground py-1.5 rounded hover:bg-secondary/50 transition-colors"
        >
          <Upload className="w-3 h-3" /> Import PCAP
        </button>
        <button
          onClick={() => setShowSettings(true)}
          className="w-full flex items-center justify-center gap-1.5 text-[10px] text-muted-foreground hover:text-foreground py-1.5 rounded hover:bg-secondary/50 transition-colors"
        >
          <Settings className="w-3 h-3" /> Settings
        </button>
      </div>
    </div>
  );
}
