import { MOCK_ENTROPY } from "@/lib/mockData";

export default function EntropyGraph() {
  const max = Math.max(...MOCK_ENTROPY);
  const barWidth = 100 / MOCK_ENTROPY.length;

  return (
    <div className="bg-card border-t border-border">
      <div className="px-3 py-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider border-b border-border flex items-center justify-between">
        <span>Entropy Analysis</span>
        <div className="flex gap-3 text-[9px] font-normal">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-sm bg-accent" /> High (compressed/encrypted)
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-sm bg-primary" /> Medium
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-sm bg-muted-foreground" /> Low (structured)
          </span>
        </div>
      </div>
      <div className="h-20 px-3 py-2 flex items-end gap-[1px]">
        {MOCK_ENTROPY.map((val, i) => {
          const height = (val / max) * 100;
          const color = val > 0.8 ? "bg-accent" : val > 0.5 ? "bg-primary" : "bg-muted-foreground/50";
          return (
            <div
              key={i}
              className={`${color} rounded-t-sm transition-all hover:opacity-80`}
              style={{ width: `${barWidth}%`, height: `${height}%` }}
              title={`Block ${i}: entropy ${val.toFixed(3)}`}
            />
          );
        })}
      </div>
    </div>
  );
}
