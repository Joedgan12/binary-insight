import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { FieldRegion } from '@/lib/mockData';
import { tauriCommands } from '@/lib/tauri';

// ─── Types ───────────────────────────────────────────────────────────────────

export type FileEncoding = 'utf8' | 'utf16le' | 'utf16be' | 'ascii' | 'latin1';

export interface FileTab {
  id: string;
  name: string;
  path: string;
  size: number;
  format: string | null;
  modified: boolean;
  encoding: FileEncoding;
  tags: string[];
  lastAccessedAt: number;
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
  note: string;
  createdAt: number;
}

export interface HexSelection {
  start: number;
  end: number;
}

// Single byte edit within an undo frame
export interface EditRecord {
  offset: number;
  oldValue: number;
  newValue: number;
}

// One undoable action (may consist of multiple byte edits)
export interface UndoFrame {
  description: string;
  edits: EditRecord[];
}

// A region from a binary diff operation
export interface DiffRegion {
  kind: 'equal' | 'modified' | 'only_a' | 'only_b';
  start_a: number;
  end_a: number;
  start_b: number;
  end_b: number;
}

export interface DiffResult {
  regions: DiffRegion[];
  changedBytes: number;
  sizeA: number;
  sizeB: number;
}

export interface RecentFile {
  id: string;
  name: string;
  path: string;
  size: number;
  format: string | null;
  openedAt: number;
}

const MAX_UNDO_DEPTH = 100;
const MAX_RECENT_FILES = 20;
const MAX_SEARCH_HISTORY = 50;

export interface FileState {
  // ── Open files ────────────────────────────────────────────────────────────
  tabs: FileTab[];
  activeTabId: string | null;

  // ── File data cache (keyed by tab id) ─────────────────────────────────────
  fileDataCache: Record<string, FileData>;

  // ── Selection ─────────────────────────────────────────────────────────────
  selection: HexSelection | null;
  hoveredOffset: number | null;

  // ── Bookmarks (keyed by tab id) ───────────────────────────────────────────
  bookmarks: Record<string, Bookmark[]>;

  // ── Per-file encoding ─────────────────────────────────────────────────────
  fileEncoding: Record<string, FileEncoding>;

  // ── Undo / Redo (keyed by tab id) ────────────────────────────────────────
  undoStack: Record<string, UndoFrame[]>;
  redoStack: Record<string, UndoFrame[]>;

  // ── Diff ──────────────────────────────────────────────────────────────────
  diffMode: boolean;
  diffFileId: string | null;
  diffResult: DiffResult | null;
  isDiffLoading: boolean;

  // ── Recent files ──────────────────────────────────────────────────────────
  recentFiles: RecentFile[];

  // ── Search history ────────────────────────────────────────────────────────
  searchHistory: string[];

  // ── Auto-save ─────────────────────────────────────────────────────────────
  autoSaveEnabled: boolean;
  autoSaveIntervalMs: number;

  // ── Actions — File lifecycle ───────────────────────────────────────────────
  openFile: (
    file: Omit<FileTab, 'encoding' | 'tags' | 'lastAccessedAt'>,
    data?: FileData
  ) => void;
  closeFile: (tabId: string) => void;
  setActiveTab: (tabId: string) => void;
  setFileData: (tabId: string, data: FileData) => void;
  updateRegions: (tabId: string, regions: FieldRegion[]) => void;
  saveFileToDisk: (tabId: string) => Promise<void>;

  // ── Actions — Selection ───────────────────────────────────────────────────
  setSelection: (selection: HexSelection | null) => void;
  setHoveredOffset: (offset: number | null) => void;

  // ── Actions — Hex editing ─────────────────────────────────────────────────
  /** Edit a single byte. Pushes one UndoFrame onto the undo stack. */
  editByte: (tabId: string, offset: number, value: number) => void;
  /** Edit multiple bytes atomically as a single undoable action. */
  editBytes: (
    tabId: string,
    edits: Array<{ offset: number; value: number }>,
    description?: string
  ) => void;
  undo: (tabId: string) => void;
  redo: (tabId: string) => void;
  canUndo: (tabId: string) => boolean;
  canRedo: (tabId: string) => boolean;

  // ── Actions — Bookmarks ───────────────────────────────────────────────────
  addBookmark: (tabId: string, bookmark: Omit<Bookmark, 'createdAt'>) => void;
  removeBookmark: (tabId: string, bookmarkId: string) => void;
  updateBookmark: (tabId: string, bookmarkId: string, patch: Partial<Bookmark>) => void;
  syncBookmarksToBackend: (tabId: string) => Promise<void>;

  // ── Actions — Encoding ────────────────────────────────────────────────────
  setEncoding: (tabId: string, encoding: FileEncoding) => void;

  // ── Actions — Tags ────────────────────────────────────────────────────────
  addTag: (tabId: string, tag: string) => void;
  removeTag: (tabId: string, tag: string) => void;

  // ── Actions — Diff ────────────────────────────────────────────────────────
  setDiffMode: (enabled: boolean, fileId?: string) => void;
  computeDiff: (tabIdA: string, tabIdB: string) => Promise<void>;
  clearDiff: () => void;

  // ── Actions — Recent files ────────────────────────────────────────────────
  addRecentFile: (file: RecentFile) => void;
  clearRecentFiles: () => void;

  // ── Actions — Search history ──────────────────────────────────────────────
  addSearchHistory: (query: string) => void;
  clearSearchHistory: () => void;

  // ── Actions — Auto-save ───────────────────────────────────────────────────
  setAutoSave: (enabled: boolean, intervalMs?: number) => void;

  // ── Actions — Session persistence ────────────────────────────────────────
  saveSession: (name: string) => Promise<string | null>;
  loadSession: (sessionId: string) => Promise<void>;
}

// ─── Store ───────────────────────────────────────────────────────────────────

export const useFileStore = create<FileState>()(
  immer((set, get) => ({
    // ── Initial state ──────────────────────────────────────────────────────
    tabs: [],
    activeTabId: null,
    fileDataCache: {},
    selection: null,
    hoveredOffset: null,
    bookmarks: {},
    fileEncoding: {},
    undoStack: {},
    redoStack: {},
    diffMode: false,
    diffFileId: null,
    diffResult: null,
    isDiffLoading: false,
    recentFiles: [],
    searchHistory: [],
    autoSaveEnabled: false,
    autoSaveIntervalMs: 30_000,

    // ── File lifecycle ─────────────────────────────────────────────────────
    openFile: (file, data) =>
      set((state) => {
        const exists = state.tabs.find((t) => t.id === file.id);
        if (!exists) {
          state.tabs.push({
            ...file,
            encoding: 'utf8',
            tags: [],
            lastAccessedAt: Date.now(),
          });
        } else {
          exists.lastAccessedAt = Date.now();
        }
        state.activeTabId = file.id;
        if (data) {
          state.fileDataCache[file.id] = data;
        }
        // Add to recent files
        const recent: RecentFile = {
          id: file.id,
          name: file.name,
          path: file.path,
          size: file.size,
          format: file.format,
          openedAt: Date.now(),
        };
        state.recentFiles = [
          recent,
          ...state.recentFiles.filter((r) => r.path !== file.path),
        ].slice(0, MAX_RECENT_FILES);
      }),

    closeFile: (tabId) =>
      set((state) => {
        const idx = state.tabs.findIndex((t) => t.id === tabId);
        if (idx !== -1) {
          state.tabs.splice(idx, 1);
          delete state.fileDataCache[tabId];
          delete state.bookmarks[tabId];
          delete state.fileEncoding[tabId];
          delete state.undoStack[tabId];
          delete state.redoStack[tabId];
        }
        if (state.activeTabId === tabId) {
          state.activeTabId = state.tabs[Math.max(0, idx - 1)]?.id ?? null;
        }
      }),

    setActiveTab: (tabId) =>
      set((state) => {
        state.activeTabId = tabId;
        const tab = state.tabs.find((t) => t.id === tabId);
        if (tab) tab.lastAccessedAt = Date.now();
      }),

    setFileData: (tabId, data) =>
      set((state) => {
        state.fileDataCache[tabId] = data;
        const tab = state.tabs.find((t) => t.id === tabId);
        if (tab && data.format) tab.format = data.format;
      }),

    updateRegions: (tabId, regions) =>
      set((state) => {
        if (state.fileDataCache[tabId]) {
          state.fileDataCache[tabId].regions = regions;
        }
      }),

    saveFileToDisk: async (tabId) => {
      const { fileDataCache, tabs } = get();
      const data = fileDataCache[tabId];
      const tab = tabs.find((t) => t.id === tabId);
      if (!data || !tab) return;
      await tauriCommands.saveFile(tabId, Array.from(data.bytes), tab.path);
      set((state) => {
        const t = state.tabs.find((t) => t.id === tabId);
        if (t) t.modified = false;
      });
    },

    // ── Selection ──────────────────────────────────────────────────────────
    setSelection: (selection) =>
      set((state) => {
        state.selection = selection;
      }),

    setHoveredOffset: (offset) =>
      set((state) => {
        state.hoveredOffset = offset;
      }),

    // ── Hex editing ────────────────────────────────────────────────────────
    editByte: (tabId, offset, value) =>
      set((state) => {
        const data = state.fileDataCache[tabId];
        if (!data || offset >= data.bytes.length) return;
        const oldValue = data.bytes[offset];
        if (oldValue === value) return;

        // Apply the edit
        data.bytes[offset] = value;

        // Push onto undo stack
        if (!state.undoStack[tabId]) state.undoStack[tabId] = [];
        state.undoStack[tabId].push({
          description: `Edit byte at 0x${offset.toString(16).toUpperCase()}`,
          edits: [{ offset, oldValue, newValue: value }],
        });
        if (state.undoStack[tabId].length > MAX_UNDO_DEPTH) {
          state.undoStack[tabId].shift();
        }
        // Clear redo on new edit
        state.redoStack[tabId] = [];

        // Mark tab as modified
        const tab = state.tabs.find((t) => t.id === tabId);
        if (tab) tab.modified = true;
      }),

    editBytes: (tabId, edits, description) =>
      set((state) => {
        const data = state.fileDataCache[tabId];
        if (!data) return;
        const records: EditRecord[] = [];
        for (const { offset, value } of edits) {
          if (offset >= data.bytes.length) continue;
          records.push({ offset, oldValue: data.bytes[offset], newValue: value });
          data.bytes[offset] = value;
        }
        if (records.length === 0) return;

        if (!state.undoStack[tabId]) state.undoStack[tabId] = [];
        state.undoStack[tabId].push({
          description: description ?? `Edit ${records.length} byte(s)`,
          edits: records,
        });
        if (state.undoStack[tabId].length > MAX_UNDO_DEPTH) {
          state.undoStack[tabId].shift();
        }
        state.redoStack[tabId] = [];

        const tab = state.tabs.find((t) => t.id === tabId);
        if (tab) tab.modified = true;
      }),

    undo: (tabId) =>
      set((state) => {
        const stack = state.undoStack[tabId];
        const data = state.fileDataCache[tabId];
        if (!stack?.length || !data) return;

        const frame = stack.pop()!;
        // Restore old values in reverse order
        for (const rec of [...frame.edits].reverse()) {
          data.bytes[rec.offset] = rec.oldValue;
        }

        if (!state.redoStack[tabId]) state.redoStack[tabId] = [];
        state.redoStack[tabId].push(frame);

        // Clear modified flag if undo stack is now empty
        const tab = state.tabs.find((t) => t.id === tabId);
        if (tab && !stack.length) tab.modified = false;
      }),

    redo: (tabId) =>
      set((state) => {
        const stack = state.redoStack[tabId];
        const data = state.fileDataCache[tabId];
        if (!stack?.length || !data) return;

        const frame = stack.pop()!;
        for (const rec of frame.edits) {
          data.bytes[rec.offset] = rec.newValue;
        }

        if (!state.undoStack[tabId]) state.undoStack[tabId] = [];
        state.undoStack[tabId].push(frame);

        const tab = state.tabs.find((t) => t.id === tabId);
        if (tab) tab.modified = true;
      }),

    canUndo: (tabId) => (get().undoStack[tabId]?.length ?? 0) > 0,
    canRedo: (tabId) => (get().redoStack[tabId]?.length ?? 0) > 0,

    // ── Bookmarks ──────────────────────────────────────────────────────────
    addBookmark: (tabId, bookmark) =>
      set((state) => {
        if (!state.bookmarks[tabId]) state.bookmarks[tabId] = [];
        state.bookmarks[tabId].push({ ...bookmark, createdAt: Date.now() });
      }),

    removeBookmark: (tabId, bookmarkId) =>
      set((state) => {
        if (state.bookmarks[tabId]) {
          state.bookmarks[tabId] = state.bookmarks[tabId].filter(
            (b) => b.id !== bookmarkId
          );
        }
      }),

    updateBookmark: (tabId, bookmarkId, patch) =>
      set((state) => {
        const bm = state.bookmarks[tabId]?.find((b) => b.id === bookmarkId);
        if (bm) Object.assign(bm, patch);
      }),

    syncBookmarksToBackend: async (tabId) => {
      const bookmarks = get().bookmarks[tabId] ?? [];
      for (const bm of bookmarks) {
        await tauriCommands.addBookmark(tabId, bm);
      }
    },

    // ── Encoding ───────────────────────────────────────────────────────────
    setEncoding: (tabId, encoding) =>
      set((state) => {
        state.fileEncoding[tabId] = encoding;
        const tab = state.tabs.find((t) => t.id === tabId);
        if (tab) tab.encoding = encoding;
      }),

    // ── Tags ───────────────────────────────────────────────────────────────
    addTag: (tabId, tag) =>
      set((state) => {
        const tab = state.tabs.find((t) => t.id === tabId);
        if (tab && !tab.tags.includes(tag)) tab.tags.push(tag);
      }),

    removeTag: (tabId, tag) =>
      set((state) => {
        const tab = state.tabs.find((t) => t.id === tabId);
        if (tab) tab.tags = tab.tags.filter((t) => t !== tag);
      }),

    // ── Diff ───────────────────────────────────────────────────────────────
    setDiffMode: (enabled, fileId) =>
      set((state) => {
        state.diffMode = enabled;
        state.diffFileId = fileId ?? null;
        if (!enabled) {
          state.diffResult = null;
        }
      }),

    computeDiff: async (tabIdA, tabIdB) => {
      set((state) => { state.isDiffLoading = true; });
      try {
        const result = await tauriCommands.diffFiles(tabIdA, tabIdB);
        set((state) => {
          state.diffResult = result as DiffResult ?? null;
          state.isDiffLoading = false;
        });
      } catch {
        set((state) => { state.isDiffLoading = false; });
      }
    },

    clearDiff: () =>
      set((state) => {
        state.diffMode = false;
        state.diffFileId = null;
        state.diffResult = null;
      }),

    // ── Recent files ───────────────────────────────────────────────────────
    addRecentFile: (file) =>
      set((state) => {
        state.recentFiles = [
          file,
          ...state.recentFiles.filter((r) => r.path !== file.path),
        ].slice(0, MAX_RECENT_FILES);
      }),

    clearRecentFiles: () =>
      set((state) => {
        state.recentFiles = [];
      }),

    // ── Search history ─────────────────────────────────────────────────────
    addSearchHistory: (query) =>
      set((state) => {
        if (!query.trim()) return;
        state.searchHistory = [
          query,
          ...state.searchHistory.filter((q) => q !== query),
        ].slice(0, MAX_SEARCH_HISTORY);
      }),

    clearSearchHistory: () =>
      set((state) => {
        state.searchHistory = [];
      }),

    // ── Auto-save ──────────────────────────────────────────────────────────
    setAutoSave: (enabled, intervalMs) =>
      set((state) => {
        state.autoSaveEnabled = enabled;
        if (intervalMs !== undefined) state.autoSaveIntervalMs = intervalMs;
      }),

    // ── Session persistence ────────────────────────────────────────────────
    saveSession: async (name) => {
      const { tabs, bookmarks, fileEncoding } = get();
      const sessionData = {
        name,
        savedAt: Date.now(),
        tabs: tabs.map(({ id, name, path, size, format, encoding, tags }) => ({
          id, name, path, size, format, encoding, tags,
        })),
        bookmarks,
        fileEncoding,
      };
      return tauriCommands.saveSession(sessionData);
    },

    loadSession: async (sessionId) => {
      const session = await tauriCommands.loadSession(sessionId);
      if (!session) return;
      set((state) => {
        // Restore tabs (without file data — user re-opens files)
        for (const tab of session.tabs ?? []) {
          if (!state.tabs.find((t) => t.id === tab.id)) {
            state.tabs.push({
              ...tab,
              modified: false,
              lastAccessedAt: Date.now(),
            });
          }
        }
        // Restore bookmarks
        if (session.bookmarks) {
          Object.assign(state.bookmarks, session.bookmarks);
        }
        // Restore per-file encoding
        if (session.fileEncoding) {
          Object.assign(state.fileEncoding, session.fileEncoding);
        }
      });
    },
  }))
);
