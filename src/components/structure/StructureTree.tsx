import { ChevronRight, ChevronDown } from "lucide-react";
import { useState } from "react";
import { MOCK_REGIONS } from "@/lib/mockData";
import { fieldTypeColors, fieldTypeDotColors } from "@/lib/colorMap";
import { motion, AnimatePresence } from "framer-motion";

export default function StructureTree() {
  const [expanded, setExpanded] = useState<Set<number>>(new Set([0, 1, 2]));

  const toggle = (idx: number) => {
    setExpanded(prev => {
      const next = new Set(prev);
      next.has(idx) ? next.delete(idx) : next.add(idx);
      return next;
    });
  };

  return (
    <div className="border-t border-border bg-card">
      <div className="px-3 py-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider border-b border-border">
        Structure — PNG Image
      </div>
      <div className="max-h-52 overflow-y-auto">
        {MOCK_REGIONS.map((region, i) => {
          const isOpen = expanded.has(i);
          const colors = fieldTypeColors[region.type];
          const dotColor = fieldTypeDotColors[region.type];
          return (
            <div key={i}>
              <button
                onClick={() => toggle(i)}
                className={`w-full flex items-center gap-1.5 px-3 py-1 text-xs hover:bg-secondary/30 transition-colors ${colors}`}
              >
                {isOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
                <span className="font-medium">{region.name}</span>
                <span className="ml-auto text-[10px] text-muted-foreground font-mono">
                  0x{region.start.toString(16).toUpperCase()}–0x{region.end.toString(16).toUpperCase()}
                </span>
              </button>
              <AnimatePresence>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.1 }}
                    className="overflow-hidden"
                  >
                    <div className="px-8 py-1 text-[10px] text-muted-foreground space-y-0.5">
                      <div>{region.description}</div>
                      {region.value && <div>Value: <span className="text-foreground">{region.value}</span></div>}
                      <div>Size: <span className="text-foreground">{region.end - region.start + 1} bytes</span></div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
}
