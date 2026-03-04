import { useState } from "react";
import { ChevronRight, ChevronDown, FileText, Folder, FolderOpen, Search, Plus, Settings } from "lucide-react";
import { MOCK_FILE_TREE, FileEntry } from "@/lib/mockData";
import { motion, AnimatePresence } from "framer-motion";

function FileTreeItem({ entry, depth = 0 }: { entry: FileEntry; depth?: number }) {
  const [open, setOpen] = useState(true);
  const isFolder = entry.type === "folder";

  return (
    <div>
      <button
        onClick={() => isFolder && setOpen(!open)}
        className={`w-full flex items-center gap-1.5 px-2 py-1 text-xs font-mono hover:bg-secondary/60 rounded-sm transition-colors ${
          !isFolder ? "text-foreground/80" : "text-foreground/90 font-medium"
        }`}
        style={{ paddingLeft: `${depth * 12 + 8}px` }}
      >
        {isFolder ? (
          <>
            {open ? <ChevronDown className="w-3 h-3 text-muted-foreground" /> : <ChevronRight className="w-3 h-3 text-muted-foreground" />}
            {open ? <FolderOpen className="w-3.5 h-3.5 text-primary" /> : <Folder className="w-3.5 h-3.5 text-primary" />}
          </>
        ) : (
          <>
            <span className="w-3" />
            <FileText className="w-3.5 h-3.5 text-muted-foreground" />
          </>
        )}
        <span className="truncate">{entry.name}</span>
        {entry.format && (
          <span className="ml-auto text-[10px] text-muted-foreground bg-secondary px-1.5 rounded">{entry.format}</span>
        )}
      </button>
      <AnimatePresence>
        {isFolder && open && entry.children && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            {entry.children.map((child, i) => (
              <FileTreeItem key={i} entry={child} depth={depth + 1} />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function AnalyzerSidebar() {
  return (
    <div className="w-56 bg-card border-r border-border flex flex-col h-full">
      <div className="p-3 border-b border-border flex items-center gap-2">
        <div className="w-5 h-5 rounded bg-primary flex items-center justify-center">
          <span className="text-[10px] font-bold text-primary-foreground font-mono">BA</span>
        </div>
        <span className="text-xs font-semibold tracking-wide text-foreground">BINARY ANALYZER</span>
      </div>

      <div className="p-2">
        <div className="flex items-center gap-1.5 bg-secondary/50 rounded-md px-2 py-1.5">
          <Search className="w-3 h-3 text-muted-foreground" />
          <input
            className="bg-transparent text-xs outline-none placeholder:text-muted-foreground flex-1 text-foreground"
            placeholder="Search files..."
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-1">
        {MOCK_FILE_TREE.map((entry, i) => (
          <FileTreeItem key={i} entry={entry} />
        ))}
      </div>

      <div className="border-t border-border p-2 flex gap-1">
        <button className="flex-1 flex items-center justify-center gap-1 text-[10px] text-muted-foreground hover:text-foreground py-1 rounded hover:bg-secondary/50 transition-colors">
          <Plus className="w-3 h-3" /> Open
        </button>
        <button className="flex-1 flex items-center justify-center gap-1 text-[10px] text-muted-foreground hover:text-foreground py-1 rounded hover:bg-secondary/50 transition-colors">
          <Settings className="w-3 h-3" /> Settings
        </button>
      </div>
    </div>
  );
}
