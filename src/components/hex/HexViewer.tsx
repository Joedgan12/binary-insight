import { useMemo } from "react";
import { MOCK_HEX_DATA, MOCK_REGIONS, FieldRegion } from "@/lib/mockData";
import { toHex, toAscii, formatOffset } from "@/lib/colorMap";

function getRegionForByte(index: number, regions: FieldRegion[]): FieldRegion | undefined {
  return regions.find(r => index >= r.start && index <= r.end);
}

const typeColorMap: Record<string, string> = {
  header: "text-hex-header bg-hex-header/10",
  metadata: "text-hex-metadata bg-hex-metadata/10",
  payload: "text-hex-payload bg-hex-payload/10",
  checksum: "text-hex-checksum bg-hex-checksum/10",
  string: "text-hex-string bg-hex-string/10",
  unknown: "",
};

export default function HexViewer() {
  const rows = useMemo(() => {
    const result: number[][] = [];
    for (let i = 0; i < MOCK_HEX_DATA.length; i += 16) {
      result.push(MOCK_HEX_DATA.slice(i, i + 16));
    }
    return result;
  }, []);

  return (
    <div className="flex-1 overflow-auto font-mono text-xs leading-5">
      <div className="sticky top-0 bg-card/95 backdrop-blur-sm z-10 border-b border-border px-3 py-1 flex">
        <span className="w-20 text-muted-foreground">Offset</span>
        <div className="flex gap-0">
          {Array.from({ length: 16 }, (_, i) => (
            <span key={i} className="w-7 text-center text-muted-foreground">{toHex(i)}</span>
          ))}
        </div>
        <span className="ml-4 text-muted-foreground">ASCII</span>
      </div>

      {rows.map((row, rowIdx) => {
        const offset = rowIdx * 16;
        return (
          <div key={rowIdx} className="flex px-3 hover:bg-secondary/20 transition-colors">
            <span className="w-20 text-muted-foreground select-none">{formatOffset(offset)}</span>
            <div className="flex gap-0">
              {row.map((byte, colIdx) => {
                const absIdx = offset + colIdx;
                const region = getRegionForByte(absIdx, MOCK_REGIONS);
                const colorClass = region ? typeColorMap[region.type] : "";
                return (
                  <span
                    key={colIdx}
                    className={`w-7 text-center cursor-pointer rounded-sm hover:ring-1 hover:ring-primary/50 transition-all ${colorClass}`}
                    title={region ? `${region.name}: ${region.description}` : `Offset 0x${formatOffset(absIdx)}`}
                  >
                    {toHex(byte)}
                  </span>
                );
              })}
            </div>
            <div className="ml-4 flex text-muted-foreground/70">
              {row.map((byte, colIdx) => {
                const absIdx = offset + colIdx;
                const region = getRegionForByte(absIdx, MOCK_REGIONS);
                const colorClass = region ? typeColorMap[region.type] : "";
                return (
                  <span key={colIdx} className={`w-[8px] text-center ${colorClass}`}>
                    {toAscii(byte)}
                  </span>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
