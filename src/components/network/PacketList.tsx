import { MOCK_PACKETS } from "@/lib/mockData";
import { protocolColors } from "@/lib/colorMap";
import { useState } from "react";
import { Filter, Play, Pause, Download } from "lucide-react";

export default function PacketList() {
  const [selected, setSelected] = useState(3);

  return (
    <div className="flex flex-col h-full bg-card">
      <div className="flex items-center gap-2 px-3 py-1.5 border-b border-border">
        <Filter className="w-3 h-3 text-muted-foreground" />
        <input
          className="flex-1 bg-secondary/40 text-xs font-mono px-2 py-1 rounded outline-none placeholder:text-muted-foreground text-foreground"
          placeholder="ip.addr == 192.168.1.105 && tcp.port == 443"
        />
        <button className="p-1 hover:bg-secondary/50 rounded transition-colors">
          <Play className="w-3 h-3 text-accent" />
        </button>
        <button className="p-1 hover:bg-secondary/50 rounded transition-colors">
          <Pause className="w-3 h-3 text-muted-foreground" />
        </button>
        <button className="p-1 hover:bg-secondary/50 rounded transition-colors">
          <Download className="w-3 h-3 text-muted-foreground" />
        </button>
      </div>

      <div className="overflow-auto flex-1">
        <table className="w-full text-[11px] font-mono">
          <thead className="sticky top-0 bg-card/95 backdrop-blur-sm">
            <tr className="text-muted-foreground text-left">
              <th className="px-2 py-1 w-8">#</th>
              <th className="px-2 py-1 w-20">Time</th>
              <th className="px-2 py-1">Source</th>
              <th className="px-2 py-1">Destination</th>
              <th className="px-2 py-1 w-14">Proto</th>
              <th className="px-2 py-1 w-12">Len</th>
              <th className="px-2 py-1">Info</th>
            </tr>
          </thead>
          <tbody>
            {MOCK_PACKETS.map((pkt) => (
              <tr
                key={pkt.id}
                onClick={() => setSelected(pkt.id)}
                className={`cursor-pointer transition-colors ${
                  selected === pkt.id
                    ? "bg-primary/10 text-foreground"
                    : "hover:bg-secondary/20 text-foreground/80"
                }`}
              >
                <td className="px-2 py-0.5 text-muted-foreground">{pkt.id}</td>
                <td className="px-2 py-0.5">{pkt.time}</td>
                <td className="px-2 py-0.5">{pkt.source}</td>
                <td className="px-2 py-0.5">{pkt.destination}</td>
                <td className={`px-2 py-0.5 font-semibold ${protocolColors[pkt.protocol] || "text-foreground"}`}>
                  {pkt.protocol}
                </td>
                <td className="px-2 py-0.5">{pkt.length}</td>
                <td className="px-2 py-0.5 truncate max-w-[300px]">{pkt.info}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
