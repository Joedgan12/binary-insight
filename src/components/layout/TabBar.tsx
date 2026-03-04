import { X, FileText, Globe } from "lucide-react";

const tabs = [
  { name: "screenshot.png", icon: FileText, active: true },
  { name: "capture_2026-03-04.pcap", icon: Globe, active: false },
];

export default function TabBar() {
  return (
    <div className="h-9 bg-card border-b border-border flex items-center overflow-x-auto">
      {tabs.map((tab, i) => (
        <div
          key={i}
          className={`flex items-center gap-1.5 px-3 h-full text-xs font-mono border-r border-border cursor-pointer transition-colors ${
            tab.active
              ? "bg-background text-foreground border-b-2 border-b-primary"
              : "text-muted-foreground hover:text-foreground hover:bg-secondary/30"
          }`}
        >
          <tab.icon className="w-3 h-3" />
          <span className="truncate max-w-[140px]">{tab.name}</span>
          <X className="w-3 h-3 opacity-40 hover:opacity-100 ml-1" />
        </div>
      ))}
    </div>
  );
}
