import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

// ─── Types ───────────────────────────────────────────────────────────────────

export type Theme = 'dark' | 'light';
export type MainTab = 'hex' | 'network' | 'visualization' | 'script';
export type SidePanel = 'files' | 'structure' | 'bookmarks' | 'sessions';

export interface PanelLayout {
  sidebarWidth: number;
  aiPanelWidth: number;
  sidebarCollapsed: boolean;
  aiPanelCollapsed: boolean;
  bottomPanelHeight: number;
  bottomPanelCollapsed: boolean;
}

export interface UIState {
  // Theme
  theme: Theme;

  // Active views
  activeMainTab: MainTab;
  activeSidePanel: SidePanel;

  // Panel layout
  layout: PanelLayout;

  // Modal states
  showCommandPalette: boolean;
  showSettings: boolean;
  showExportDialog: boolean;
  showAbout: boolean;
  showGoToOffset: boolean;

  // Search
  searchQuery: string;
  searchResults: number[];

  // Status bar
  statusMessage: string;

  // Loading states
  isLoading: boolean;
  loadingMessage: string;

  // Actions
  setTheme: (theme: Theme) => void;
  setActiveMainTab: (tab: MainTab) => void;
  setActiveSidePanel: (panel: SidePanel) => void;
  toggleSidebar: () => void;
  toggleAIPanel: () => void;
  toggleBottomPanel: () => void;
  setSidebarWidth: (width: number) => void;
  setAIPanelWidth: (width: number) => void;
  setBottomPanelHeight: (height: number) => void;
  setShowCommandPalette: (show: boolean) => void;
  setShowSettings: (show: boolean) => void;
  setShowExportDialog: (show: boolean) => void;
  setShowAbout: (show: boolean) => void;
  setShowGoToOffset: (show: boolean) => void;
  setSearchQuery: (query: string) => void;
  setSearchResults: (results: number[]) => void;
  setStatusMessage: (message: string) => void;
  setLoading: (loading: boolean, message?: string) => void;
}

// ─── Store ───────────────────────────────────────────────────────────────────

export const useUIStore = create<UIState>()(
  immer((set) => ({
    theme: 'dark',
    activeMainTab: 'hex',
    activeSidePanel: 'files',
    layout: {
      sidebarWidth: 260,
      aiPanelWidth: 320,
      sidebarCollapsed: false,
      aiPanelCollapsed: true,
      bottomPanelHeight: 200,
      bottomPanelCollapsed: true,
    },
    showCommandPalette: false,
    showSettings: false,
    showExportDialog: false,
    showAbout: false,
    showGoToOffset: false,
    searchQuery: '',
    searchResults: [],
    statusMessage: 'Ready',
    isLoading: false,
    loadingMessage: '',

    setTheme: (theme) =>
      set((state) => {
        state.theme = theme;
        document.documentElement.classList.toggle('dark', theme === 'dark');
        document.documentElement.classList.toggle('light', theme === 'light');
      }),

    setActiveMainTab: (tab) =>
      set((state) => {
        state.activeMainTab = tab;
      }),

    setActiveSidePanel: (panel) =>
      set((state) => {
        state.activeSidePanel = panel;
      }),

    toggleSidebar: () =>
      set((state) => {
        state.layout.sidebarCollapsed = !state.layout.sidebarCollapsed;
      }),

    toggleAIPanel: () =>
      set((state) => {
        state.layout.aiPanelCollapsed = !state.layout.aiPanelCollapsed;
      }),

    toggleBottomPanel: () =>
      set((state) => {
        state.layout.bottomPanelCollapsed = !state.layout.bottomPanelCollapsed;
      }),

    setSidebarWidth: (width) =>
      set((state) => {
        state.layout.sidebarWidth = width;
      }),

    setAIPanelWidth: (width) =>
      set((state) => {
        state.layout.aiPanelWidth = width;
      }),

    setBottomPanelHeight: (height) =>
      set((state) => {
        state.layout.bottomPanelHeight = height;
      }),

    setShowCommandPalette: (show) =>
      set((state) => {
        state.showCommandPalette = show;
      }),

    setShowSettings: (show) =>
      set((state) => {
        state.showSettings = show;
      }),

    setShowExportDialog: (show) =>
      set((state) => {
        state.showExportDialog = show;
      }),

    setShowAbout: (show) =>
      set((state) => {
        state.showAbout = show;
      }),

    setShowGoToOffset: (show) =>
      set((state) => {
        state.showGoToOffset = show;
      }),

    setSearchQuery: (query) =>
      set((state) => {
        state.searchQuery = query;
      }),

    setSearchResults: (results) =>
      set((state) => {
        state.searchResults = results;
      }),

    setStatusMessage: (message) =>
      set((state) => {
        state.statusMessage = message;
      }),

    setLoading: (loading, message) =>
      set((state) => {
        state.isLoading = loading;
        state.loadingMessage = message ?? '';
      }),
  }))
);
