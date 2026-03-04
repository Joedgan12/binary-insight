import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { FieldRegion } from '@/lib/mockData';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface FileTab {
  id: string;
  name: string;
  path: string;
  size: number;
  format: string | null;
  modified: boolean;
}

export interface FileData {
  bytes: Uint8Array;
  regions: FieldRegion[];
  format: string | null;
  entropy: number[];
}

export interface Bookmark {
  id: string;
  offset: number;
  length: number;
  label: string;
  color: string;
}

export interface HexSelection {
  start: number;
  end: number;
}

export interface FileState {
  // Open files
  tabs: FileTab[];
  activeTabId: string | null;

  // File data cache (keyed by tab id)
  fileDataCache: Record<string, FileData>;

  // Selection state
  selection: HexSelection | null;
  hoveredOffset: number | null;

  // Bookmarks
  bookmarks: Record<string, Bookmark[]>;

  // Diff mode
  diffMode: boolean;
  diffFileId: string | null;

  // Actions
  openFile: (file: FileTab, data?: FileData) => void;
  closeFile: (tabId: string) => void;
  setActiveTab: (tabId: string) => void;
  setFileData: (tabId: string, data: FileData) => void;
  setSelection: (selection: HexSelection | null) => void;
  setHoveredOffset: (offset: number | null) => void;
  addBookmark: (tabId: string, bookmark: Bookmark) => void;
  removeBookmark: (tabId: string, bookmarkId: string) => void;
  setDiffMode: (enabled: boolean, fileId?: string) => void;
  updateRegions: (tabId: string, regions: FieldRegion[]) => void;
}

// ─── Store ───────────────────────────────────────────────────────────────────

export const useFileStore = create<FileState>()(
  immer((set) => ({
    tabs: [],
    activeTabId: null,
    fileDataCache: {},
    selection: null,
    hoveredOffset: null,
    bookmarks: {},
    diffMode: false,
    diffFileId: null,

    openFile: (file, data) =>
      set((state) => {
        // Don't open duplicates
        if (!state.tabs.find((t) => t.id === file.id)) {
          state.tabs.push(file);
        }
        state.activeTabId = file.id;
        if (data) {
          state.fileDataCache[file.id] = data;
        }
      }),

    closeFile: (tabId) =>
      set((state) => {
        const idx = state.tabs.findIndex((t) => t.id === tabId);
        if (idx !== -1) {
          state.tabs.splice(idx, 1);
          delete state.fileDataCache[tabId];
          delete state.bookmarks[tabId];
        }
        if (state.activeTabId === tabId) {
          state.activeTabId = state.tabs[Math.max(0, idx - 1)]?.id ?? null;
        }
      }),

    setActiveTab: (tabId) =>
      set((state) => {
        state.activeTabId = tabId;
      }),

    setFileData: (tabId, data) =>
      set((state) => {
        state.fileDataCache[tabId] = data;
        // Update format on tab
        const tab = state.tabs.find((t) => t.id === tabId);
        if (tab && data.format) {
          tab.format = data.format;
        }
      }),

    setSelection: (selection) =>
      set((state) => {
        state.selection = selection;
      }),

    setHoveredOffset: (offset) =>
      set((state) => {
        state.hoveredOffset = offset;
      }),

    addBookmark: (tabId, bookmark) =>
      set((state) => {
        if (!state.bookmarks[tabId]) {
          state.bookmarks[tabId] = [];
        }
        state.bookmarks[tabId].push(bookmark);
      }),

    removeBookmark: (tabId, bookmarkId) =>
      set((state) => {
        if (state.bookmarks[tabId]) {
          state.bookmarks[tabId] = state.bookmarks[tabId].filter(
            (b) => b.id !== bookmarkId
          );
        }
      }),

    setDiffMode: (enabled, fileId) =>
      set((state) => {
        state.diffMode = enabled;
        state.diffFileId = fileId ?? null;
      }),

    updateRegions: (tabId, regions) =>
      set((state) => {
        if (state.fileDataCache[tabId]) {
          state.fileDataCache[tabId].regions = regions;
        }
      }),
  }))
);
