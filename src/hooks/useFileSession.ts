import { useCallback } from 'react';
import { useFileStore, type FileTab, type FileData } from '@/store/fileStore';
import { useUIStore } from '@/store/uiStore';
import { tauriCommands } from '@/lib/tauri';
import { MOCK_HEX_DATA, MOCK_REGIONS, MOCK_ENTROPY } from '@/lib/mockData';

/**
 * Hook for managing file sessions — open, close, switch between files
 */
export function useFileSession() {
  const { tabs, activeTabId, openFile, closeFile, setActiveTab, setFileData } =
    useFileStore();
  const { setLoading, setStatusMessage, setActiveMainTab } = useUIStore();

  const activeTab = tabs.find((t) => t.id === activeTabId) ?? null;
  const activeFileData = useFileStore(
    (s) => (activeTabId ? s.fileDataCache[activeTabId] : null) ?? null
  );

  const handleOpenFile = useCallback(
    async (filePath?: string) => {
      setLoading(true, 'Opening file...');
      try {
        // Try Tauri backend first
        if (tauriCommands.isAvailable()) {
          const result = await tauriCommands.openFile(filePath);
          if (result) {
            const tab: FileTab = {
              id: result.id,
              name: result.name,
              path: result.path,
              size: result.size,
              format: result.format,
              modified: false,
            };
            const data: FileData = {
              bytes: new Uint8Array(result.bytes),
              regions: result.regions || [],
              format: result.format,
              entropy: result.entropy || [],
            };
            openFile(tab, data);
            setActiveMainTab('hex');
            setStatusMessage(`Opened: ${result.name}`);
            return;
          }
        }

        // Fallback: use mock data for development
        const mockId = `file-${Date.now()}`;
        const mockName = filePath?.split(/[\\/]/).pop() || 'sample.png';
        const tab: FileTab = {
          id: mockId,
          name: mockName,
          path: filePath || '/mock/sample.png',
          size: MOCK_HEX_DATA.length,
          format: 'PNG',
          modified: false,
        };
        const data: FileData = {
          bytes: new Uint8Array(MOCK_HEX_DATA),
          regions: [...MOCK_REGIONS],
          format: 'PNG',
          entropy: [...MOCK_ENTROPY.map((e) => e.value)],
        };
        openFile(tab, data);
        setActiveMainTab('hex');
        setStatusMessage(`Opened: ${mockName} (mock data)`);
      } catch (err) {
        console.error('Failed to open file:', err);
        setStatusMessage(`Error opening file: ${err}`);
      } finally {
        setLoading(false);
      }
    },
    [openFile, setLoading, setStatusMessage, setActiveMainTab]
  );

  const handleCloseFile = useCallback(
    (tabId: string) => {
      closeFile(tabId);
      setStatusMessage('File closed');
    },
    [closeFile, setStatusMessage]
  );

  const handleSwitchTab = useCallback(
    (tabId: string) => {
      setActiveTab(tabId);
      const tab = tabs.find((t) => t.id === tabId);
      if (tab) {
        setStatusMessage(`Active: ${tab.name}`);
      }
    },
    [tabs, setActiveTab, setStatusMessage]
  );

  const handleLoadPcap = useCallback(
    async (filePath?: string) => {
      setLoading(true, 'Loading PCAP...');
      try {
        if (tauriCommands.isAvailable()) {
          const result = await tauriCommands.loadPcap(filePath);
          if (result) {
            setStatusMessage(`Loaded ${result.packetCount} packets`);
            setActiveMainTab('network');
            return result;
          }
        }
        // Fallback
        setStatusMessage('PCAP loaded (mock)');
        setActiveMainTab('network');
      } catch (err) {
        console.error('Failed to load PCAP:', err);
        setStatusMessage(`Error: ${err}`);
      } finally {
        setLoading(false);
      }
    },
    [setLoading, setStatusMessage, setActiveMainTab]
  );

  return {
    tabs,
    activeTab,
    activeTabId,
    activeFileData,
    handleOpenFile,
    handleCloseFile,
    handleSwitchTab,
    handleLoadPcap,
  };
}
