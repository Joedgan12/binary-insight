import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import AnalyzerSidebar from '@/components/layout/AnalyzerSidebar';
import TabBar from '@/components/layout/TabBar';
import StatusBar from '@/components/layout/StatusBar';
import HexViewer from '@/components/hex/HexViewer';
import StructureTree from '@/components/structure/StructureTree';
import PacketList from '@/components/network/PacketList';
import FlowDiagram from '@/components/network/FlowDiagram';
import EntropyGraph from '@/components/visualization/EntropyGraph';
import ByteHistogram from '@/components/visualization/ByteHistogram';
import DiffView from '@/components/visualization/DiffView';
import AIPanel from '@/components/ai/AIPanel';
import ScriptEditor from '@/components/scripting/ScriptEditor';
import TemplateLibrary from '@/components/scripting/TemplateLibrary';
import { useUIStore, type MainTab } from '@/store/uiStore';
import { useFileStore } from '@/store/fileStore';
import {
  FileText,
  Globe,
  BarChart3,
  Code,
  Binary,
  PanelRight,
  Bot,
  GitCompareArrows,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const MAIN_TABS: { id: MainTab; icon: any; label: string }[] = [
  { id: 'hex', icon: FileText, label: 'Hex View' },
  { id: 'network', icon: Globe, label: 'Network' },
  { id: 'visualization', icon: BarChart3, label: 'Visualization' },
  { id: 'script', icon: Code, label: 'Script' },
];

function EmptyState() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
      <div className="w-20 h-20 rounded-xl bg-primary/5 flex items-center justify-center mb-4">
        <Binary className="w-10 h-10 text-primary/30" />
      </div>
      <h2 className="text-lg font-semibold text-foreground/80 mb-1">Binary Insight</h2>
      <p className="text-sm text-muted-foreground max-w-md">
        Open a binary file to begin analysis, or import a PCAP for network traffic inspection. Use the sidebar to
        browse recent files and sessions.
      </p>
      <div className="flex gap-3 mt-6 text-xs text-muted-foreground">
        <kbd className="px-2 py-1 bg-secondary/60 rounded border border-border">Ctrl+O</kbd>
        <span>Open File</span>
        <kbd className="px-2 py-1 bg-secondary/60 rounded border border-border">Ctrl+I</kbd>
        <span>Import PCAP</span>
      </div>
    </div>
  );
}

const Index = () => {
  const activeMainTab = useUIStore((s) => s.activeMainTab);
  const setActiveMainTab = useUIStore((s) => s.setActiveMainTab);
  const rightPanelCollapsed = useUIStore((s) => s.layout.aiPanelCollapsed);
  const toggleRightPanel = useUIStore((s) => s.toggleAIPanel);
  const sidebarCollapsed = useUIStore((s) => s.layout.sidebarCollapsed);
  const activeTabId = useFileStore((s) => s.activeTabId);
  const diffMode = useFileStore((s) => s.diffMode);

  const hasFile = !!activeTabId;

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar */}
      {!sidebarCollapsed && <AnalyzerSidebar />}

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* File tabs */}
        <TabBar />

        {/* Content area */}
        <div className="flex-1 flex min-h-0">
          <ResizablePanelGroup direction="horizontal">
            {/* Main content panel */}
            <ResizablePanel defaultSize={rightPanelCollapsed ? 100 : 75} minSize={40}>
              <div className="flex flex-col h-full min-w-0">
                {/* View tabs */}
                <Tabs
                  value={activeMainTab}
                  onValueChange={(v) => setActiveMainTab(v as MainTab)}
                  className="flex flex-col flex-1 min-h-0"
                >
                  <div className="flex items-center border-b border-border bg-card">
                    <TabsList className="h-8 bg-transparent rounded-none justify-start px-2 gap-0">
                      {MAIN_TABS.map((tab) => (
                        <TabsTrigger
                          key={tab.id}
                          value={tab.id}
                          className="text-[11px] font-mono rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-foreground h-full px-3 gap-1.5"
                        >
                          <tab.icon className="w-3 h-3" /> {tab.label}
                        </TabsTrigger>
                      ))}
                    </TabsList>

                    <div className="ml-auto flex items-center gap-1 pr-2">
                      {diffMode.enabled && (
                        <span className="text-[10px] text-primary font-mono flex items-center gap-1 px-2">
                          <GitCompareArrows className="w-3 h-3" /> DIFF
                        </span>
                      )}
                      <button
                        onClick={() => toggleRightPanel('right')}
                        className={cn(
                          'p-1 rounded transition-colors',
                          rightPanelCollapsed
                            ? 'text-muted-foreground hover:text-foreground'
                            : 'text-primary bg-primary/10'
                        )}
                        title="Toggle AI Panel"
                      >
                        <Bot className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Hex View */}
                  <TabsContent value="hex" className="flex-1 flex flex-col m-0 min-h-0">
                    {hasFile || true /* show mock data */? (
                      <ResizablePanelGroup direction="vertical">
                        <ResizablePanel defaultSize={65} minSize={30}>
                          {diffMode.enabled ? <DiffView /> : <HexViewer />}
                        </ResizablePanel>
                        <ResizableHandle withHandle />
                        <ResizablePanel defaultSize={35} minSize={15}>
                          <StructureTree />
                        </ResizablePanel>
                      </ResizablePanelGroup>
                    ) : (
                      <EmptyState />
                    )}
                  </TabsContent>

                  {/* Network */}
                  <TabsContent value="network" className="flex-1 flex flex-col m-0 min-h-0">
                    <ResizablePanelGroup direction="vertical">
                      <ResizablePanel defaultSize={60} minSize={30}>
                        <PacketList />
                      </ResizablePanel>
                      <ResizableHandle withHandle />
                      <ResizablePanel defaultSize={40} minSize={20}>
                        <FlowDiagram />
                      </ResizablePanel>
                    </ResizablePanelGroup>
                  </TabsContent>

                  {/* Visualization */}
                  <TabsContent value="visualization" className="flex-1 flex flex-col m-0 min-h-0 overflow-y-auto">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 flex-1 min-h-0">
                      <div className="border-r border-b border-border min-h-[250px]">
                        <EntropyGraph />
                      </div>
                      <div className="border-b border-border min-h-[250px]">
                        <ByteHistogram />
                      </div>
                      <div className="col-span-full min-h-[300px]">
                        <DiffView />
                      </div>
                    </div>
                  </TabsContent>

                  {/* Script */}
                  <TabsContent value="script" className="flex-1 flex flex-col m-0 min-h-0">
                    <ResizablePanelGroup direction="horizontal">
                      <ResizablePanel defaultSize={70} minSize={40}>
                        <ScriptEditor />
                      </ResizablePanel>
                      <ResizableHandle withHandle />
                      <ResizablePanel defaultSize={30} minSize={20}>
                        <TemplateLibrary />
                      </ResizablePanel>
                    </ResizablePanelGroup>
                  </TabsContent>
                </Tabs>
              </div>
            </ResizablePanel>

            {/* AI Panel */}
            {!rightPanelCollapsed && (
              <>
                <ResizableHandle />
                <ResizablePanel defaultSize={25} minSize={15} maxSize={40}>
                  <AIPanel />
                </ResizablePanel>
              </>
            )}
          </ResizablePanelGroup>
        </div>

        {/* Status bar */}
        <StatusBar />
      </div>
    </div>
  );
};

export default Index;
