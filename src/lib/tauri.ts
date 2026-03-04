/**
 * Typed Tauri command wrappers
 *
 * This module provides a typed interface to the Tauri IPC commands.
 * When running in the browser (dev mode without Tauri), all calls
 * return null so the app can fall back to mock data gracefully.
 */

// Check if we're running inside Tauri
function isTauri(): boolean {
  return typeof window !== 'undefined' && '__TAURI__' in window;
}

async function invoke<T>(command: string, args?: Record<string, unknown>): Promise<T | null> {
  if (!isTauri()) return null;
  try {
    const { invoke: tauriInvoke } = await import('@tauri-apps/api/tauri');
    return await tauriInvoke<T>(command, args);
  } catch (err) {
    console.error(`Tauri command "${command}" failed:`, err);
    throw err;
  }
}

// ─── File Commands ───────────────────────────────────────────────────────────

export interface OpenFileResult {
  id: string;
  name: string;
  path: string;
  size: number;
  format: string | null;
  bytes: number[];
  regions: any[];
  entropy: number[];
}

export interface ExportOptions {
  format: 'json' | 'csv' | 'xml' | 'c_struct' | 'rust_struct';
  includeHex: boolean;
  includeDecoded: boolean;
}

// ─── Network Commands ────────────────────────────────────────────────────────

export interface PcapResult {
  sessionId: string;
  packetCount: number;
  packets: any[];
  duration: number;
}

export interface CaptureConfig {
  interface: string;
  filter?: string;
  snapLen?: number;
}

// ─── AI Commands ─────────────────────────────────────────────────────────────

export interface AnalyzeResult {
  format: string | null;
  suggestions: any[];
  confidence: number;
}

// ─── Command Wrappers ────────────────────────────────────────────────────────

export const tauriCommands = {
  isAvailable: isTauri,

  // File commands
  openFile: (path?: string) =>
    invoke<OpenFileResult>('open_file', { path }),

  readBytes: (fileId: string, offset: number, length: number) =>
    invoke<number[]>('read_bytes', { fileId, offset, length }),

  detectFormat: (fileId: string) =>
    invoke<{ format: string; confidence: number }>('detect_format', { fileId }),

  getEntropy: (fileId: string, blockSize?: number) =>
    invoke<number[]>('get_entropy', { fileId, blockSize: blockSize ?? 256 }),

  getRegions: (fileId: string) =>
    invoke<any[]>('get_regions', { fileId }),

  diffFiles: (fileIdA: string, fileIdB: string) =>
    invoke<any[]>('diff_files', { fileIdA, fileIdB }),

  exportData: (fileId: string, options: ExportOptions) =>
    invoke<string>('export_data', { fileId, options }),

  generateStruct: (fileId: string, language: 'c' | 'rust') =>
    invoke<string>('generate_struct', { fileId, language }),

  // Network commands
  loadPcap: (path?: string) =>
    invoke<PcapResult>('load_pcap', { path }),

  startCapture: (config: CaptureConfig) =>
    invoke<string>('start_capture', { config }),

  stopCapture: (sessionId: string) =>
    invoke<void>('stop_capture', { sessionId }),

  getPacketDetail: (sessionId: string, packetId: number) =>
    invoke<any>('get_packet_detail', { sessionId, packetId }),

  reconstructSession: (sessionId: string, streamId: number) =>
    invoke<any>('reconstruct_session', { sessionId, streamId }),

  // AI commands
  queryAI: (query: string, context?: any) =>
    invoke<string>('query_ai', { query, context }),

  analyzeBytes: (bytes: number[], offset: number, length: number) =>
    invoke<AnalyzeResult>('analyze_bytes', { bytes, offset, length }),

  suggestFieldName: (bytes: number[], offset: number, format?: string) =>
    invoke<{ name: string; confidence: number }>('suggest_field_name', { bytes, offset, format }),

  // Scripting commands
  runScript: (script: string, fileId?: string) =>
    invoke<any>('run_script', { script, fileId }),

  loadTemplate: (name: string) =>
    invoke<string>('load_template', { name }),

  listTemplates: () =>
    invoke<{ name: string; description: string; format: string }[]>('list_templates'),

  // Storage commands
  saveSession: (sessionData: any) =>
    invoke<string>('save_session', { sessionData }),

  loadSession: (sessionId: string) =>
    invoke<any>('load_session', { sessionId }),

  listSessions: () =>
    invoke<{ id: string; name: string; date: string }[]>('list_sessions'),

  addBookmark: (fileId: string, bookmark: any) =>
    invoke<void>('add_bookmark', { fileId, bookmark }),

  getBookmarks: (fileId: string) =>
    invoke<any[]>('get_bookmarks', { fileId }),
};

// ─── File Dialog ─────────────────────────────────────────────────────────────

export async function openFileDialog(filters?: { name: string; extensions: string[] }[]): Promise<string | null> {
  if (!isTauri()) return null;
  try {
    const { open } = await import('@tauri-apps/api/dialog');
    const result = await open({
      multiple: false,
      filters: filters ?? [
        { name: 'All Files', extensions: ['*'] },
        { name: 'Binary Files', extensions: ['bin', 'dat', 'exe', 'dll', 'so', 'elf'] },
        { name: 'Image Files', extensions: ['png', 'jpg', 'gif', 'bmp', 'ico'] },
        { name: 'Archive Files', extensions: ['zip', 'gz', 'tar', '7z', 'rar'] },
        { name: 'Capture Files', extensions: ['pcap', 'pcapng', 'cap'] },
        { name: 'Database Files', extensions: ['db', 'sqlite', 'sqlite3'] },
      ],
    });
    return result as string | null;
  } catch {
    return null;
  }
}

export async function saveFileDialog(defaultName?: string): Promise<string | null> {
  if (!isTauri()) return null;
  try {
    const { save } = await import('@tauri-apps/api/dialog');
    const result = await save({
      defaultPath: defaultName,
      filters: [
        { name: 'JSON', extensions: ['json'] },
        { name: 'CSV', extensions: ['csv'] },
        { name: 'XML', extensions: ['xml'] },
        { name: 'All Files', extensions: ['*'] },
      ],
    });
    return result;
  } catch {
    return null;
  }
}
