import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AnalyzerSidebar from "@/components/layout/AnalyzerSidebar";
import TabBar from "@/components/layout/TabBar";
import StatusBar from "@/components/layout/StatusBar";
import HexViewer from "@/components/hex/HexViewer";
import StructureTree from "@/components/structure/StructureTree";
import PacketList from "@/components/network/PacketList";
import EntropyGraph from "@/components/visualization/EntropyGraph";
import AIPanel from "@/components/ai/AIPanel";
import { FileText, Globe, BarChart3, Code } from "lucide-react";

const Index = () => {
  const [activeTab, setActiveTab] = useState("hex");

  return (
    <div className="flex h-screen overflow-hidden">
      <AnalyzerSidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <TabBar />

        <div className="flex flex-1 min-h-0">
          <div className="flex-1 flex flex-col min-w-0">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col flex-1 min-h-0">
              <TabsList className="h-8 bg-card border-b border-border rounded-none justify-start px-2 gap-0">
                <TabsTrigger
                  value="hex"
                  className="text-[11px] font-mono rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-foreground h-full px-3 gap-1.5"
                >
                  <FileText className="w-3 h-3" /> Hex View
                </TabsTrigger>
                <TabsTrigger
                  value="network"
                  className="text-[11px] font-mono rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-foreground h-full px-3 gap-1.5"
                >
                  <Globe className="w-3 h-3" /> Network
                </TabsTrigger>
                <TabsTrigger
                  value="entropy"
                  className="text-[11px] font-mono rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-foreground h-full px-3 gap-1.5"
                >
                  <BarChart3 className="w-3 h-3" /> Visualization
                </TabsTrigger>
                <TabsTrigger
                  value="script"
                  className="text-[11px] font-mono rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-foreground h-full px-3 gap-1.5"
                >
                  <Code className="w-3 h-3" /> Script
                </TabsTrigger>
              </TabsList>

              <TabsContent value="hex" className="flex-1 flex flex-col m-0 min-h-0">
                <HexViewer />
                <StructureTree />
              </TabsContent>

              <TabsContent value="network" className="flex-1 m-0 min-h-0">
                <PacketList />
              </TabsContent>

              <TabsContent value="entropy" className="flex-1 flex flex-col m-0 min-h-0">
                <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
                  <EntropyGraph />
                </div>
                <EntropyGraph />
              </TabsContent>

              <TabsContent value="script" className="flex-1 m-0 min-h-0">
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                  <Code className="w-10 h-10 text-muted-foreground/30 mb-3" />
                  <p className="text-sm text-muted-foreground">Lua Script Editor</p>
                  <p className="text-xs text-muted-foreground/60 mt-1">Write custom format templates and decoders</p>
                  <div className="mt-4 bg-secondary/30 rounded-lg p-4 font-mono text-xs text-muted-foreground text-left max-w-md w-full">
                    <div className="text-hex-header">-- PNG Format Template</div>
                    <div><span className="text-hex-metadata">local</span> sig = read_bytes(8)</div>
                    <div><span className="text-hex-metadata">assert</span>(sig == <span className="text-hex-string">"\x89PNG\r\n\x1a\n"</span>)</div>
                    <div className="mt-2"><span className="text-hex-metadata">while</span> <span className="text-hex-metadata">not</span> eof() <span className="text-hex-metadata">do</span></div>
                    <div>{"  "}<span className="text-hex-metadata">local</span> len = read_u32_be()</div>
                    <div>{"  "}<span className="text-hex-metadata">local</span> type = read_string(4)</div>
                    <div>{"  "}label(type, len, <span className="text-hex-string">"chunk"</span>)</div>
                    <div><span className="text-hex-metadata">end</span></div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          <AIPanel />
        </div>

        <StatusBar />
      </div>
    </div>
  );
};

export default Index;
