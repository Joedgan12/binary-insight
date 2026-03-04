/**
 * Formatters — hex, decimal, binary, base64 conversion utilities
 */

// ─── Byte → String Conversions ──────────────────────────────────────────────

export function toHex(byte: number): string {
  return byte.toString(16).padStart(2, '0').toUpperCase();
}

export function toDec(byte: number): string {
  return byte.toString(10);
}

export function toBin(byte: number): string {
  return byte.toString(2).padStart(8, '0');
}

export function toOct(byte: number): string {
  return byte.toString(8).padStart(3, '0');
}

export function toAscii(byte: number): string {
  return byte >= 0x20 && byte <= 0x7e ? String.fromCharCode(byte) : '.';
}

// ─── Offset Formatting ──────────────────────────────────────────────────────

export function formatOffset(offset: number, width: number = 8): string {
  return offset.toString(16).padStart(width, '0').toUpperCase();
}

export function formatSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const k = 1024;
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const val = bytes / Math.pow(k, i);
  return `${val.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

// ─── Multi-byte Readers ─────────────────────────────────────────────────────

export function readUint16BE(bytes: Uint8Array, offset: number): number {
  return (bytes[offset] << 8) | bytes[offset + 1];
}

export function readUint16LE(bytes: Uint8Array, offset: number): number {
  return bytes[offset] | (bytes[offset + 1] << 8);
}

export function readUint32BE(bytes: Uint8Array, offset: number): number {
  return (
    ((bytes[offset] << 24) |
      (bytes[offset + 1] << 16) |
      (bytes[offset + 2] << 8) |
      bytes[offset + 3]) >>>
    0
  );
}

export function readUint32LE(bytes: Uint8Array, offset: number): number {
  return (
    (bytes[offset] |
      (bytes[offset + 1] << 8) |
      (bytes[offset + 2] << 16) |
      (bytes[offset + 3] << 24)) >>>
    0
  );
}

export function readInt32BE(bytes: Uint8Array, offset: number): number {
  return (
    (bytes[offset] << 24) |
    (bytes[offset + 1] << 16) |
    (bytes[offset + 2] << 8) |
    bytes[offset + 3]
  );
}

export function readFloat32BE(bytes: Uint8Array, offset: number): number {
  const view = new DataView(bytes.buffer, bytes.byteOffset + offset, 4);
  return view.getFloat32(0, false);
}

export function readFloat64BE(bytes: Uint8Array, offset: number): number {
  const view = new DataView(bytes.buffer, bytes.byteOffset + offset, 8);
  return view.getFloat64(0, false);
}

// ─── String Extraction ──────────────────────────────────────────────────────

export function readCString(bytes: Uint8Array, offset: number, maxLen: number = 256): string {
  let end = offset;
  while (end < bytes.length && end - offset < maxLen && bytes[end] !== 0) {
    end++;
  }
  return new TextDecoder('utf-8', { fatal: false }).decode(bytes.slice(offset, end));
}

export function readUtf16String(bytes: Uint8Array, offset: number, length: number, le: boolean = true): string {
  const decoder = new TextDecoder(le ? 'utf-16le' : 'utf-16be');
  return decoder.decode(bytes.slice(offset, offset + length));
}

// ─── Byte Array Conversions ─────────────────────────────────────────────────

export function bytesToHexString(bytes: Uint8Array, separator: string = ' '): string {
  return Array.from(bytes).map(toHex).join(separator);
}

export function hexStringToBytes(hex: string): Uint8Array {
  const clean = hex.replace(/[\s:-]/g, '');
  const bytes = new Uint8Array(clean.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(clean.substr(i * 2, 2), 16);
  }
  return bytes;
}

export function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary);
}

export function base64ToBytes(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

// ─── Entropy Calculation ────────────────────────────────────────────────────

export function calculateEntropy(bytes: Uint8Array): number {
  if (bytes.length === 0) return 0;
  const freq = new Array(256).fill(0);
  for (const b of bytes) {
    freq[b]++;
  }
  let entropy = 0;
  const len = bytes.length;
  for (const f of freq) {
    if (f > 0) {
      const p = f / len;
      entropy -= p * Math.log2(p);
    }
  }
  return entropy / 8; // Normalize to 0-1
}

export function calculateBlockEntropy(bytes: Uint8Array, blockSize: number = 256): number[] {
  const blocks: number[] = [];
  for (let i = 0; i < bytes.length; i += blockSize) {
    const block = bytes.slice(i, Math.min(i + blockSize, bytes.length));
    blocks.push(calculateEntropy(block));
  }
  return blocks;
}

// ─── Byte Frequency Histogram ───────────────────────────────────────────────

export function byteFrequency(bytes: Uint8Array): number[] {
  const freq = new Array(256).fill(0);
  for (const b of bytes) {
    freq[b]++;
  }
  return freq;
}

// ─── Pattern Detection ──────────────────────────────────────────────────────

export function findPattern(bytes: Uint8Array, pattern: Uint8Array): number[] {
  const results: number[] = [];
  for (let i = 0; i <= bytes.length - pattern.length; i++) {
    let match = true;
    for (let j = 0; j < pattern.length; j++) {
      if (bytes[i + j] !== pattern[j]) {
        match = false;
        break;
      }
    }
    if (match) results.push(i);
  }
  return results;
}

export function findStrings(bytes: Uint8Array, minLength: number = 4): { offset: number; value: string }[] {
  const results: { offset: number; value: string }[] = [];
  let current = '';
  let start = 0;

  for (let i = 0; i < bytes.length; i++) {
    const b = bytes[i];
    if (b >= 0x20 && b <= 0x7e) {
      if (current === '') start = i;
      current += String.fromCharCode(b);
    } else {
      if (current.length >= minLength) {
        results.push({ offset: start, value: current });
      }
      current = '';
    }
  }
  if (current.length >= minLength) {
    results.push({ offset: start, value: current });
  }
  return results;
}

// ─── Magic Bytes Detection ──────────────────────────────────────────────────

export interface MagicSignature {
  name: string;
  extension: string;
  bytes: number[];
  offset: number;
}

export const MAGIC_SIGNATURES: MagicSignature[] = [
  { name: 'PNG', extension: 'png', bytes: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a], offset: 0 },
  { name: 'JPEG', extension: 'jpg', bytes: [0xff, 0xd8, 0xff], offset: 0 },
  { name: 'GIF87a', extension: 'gif', bytes: [0x47, 0x49, 0x46, 0x38, 0x37, 0x61], offset: 0 },
  { name: 'GIF89a', extension: 'gif', bytes: [0x47, 0x49, 0x46, 0x38, 0x39, 0x61], offset: 0 },
  { name: 'BMP', extension: 'bmp', bytes: [0x42, 0x4d], offset: 0 },
  { name: 'PDF', extension: 'pdf', bytes: [0x25, 0x50, 0x44, 0x46], offset: 0 },
  { name: 'ZIP', extension: 'zip', bytes: [0x50, 0x4b, 0x03, 0x04], offset: 0 },
  { name: 'GZIP', extension: 'gz', bytes: [0x1f, 0x8b], offset: 0 },
  { name: 'RAR', extension: 'rar', bytes: [0x52, 0x61, 0x72, 0x21, 0x1a, 0x07], offset: 0 },
  { name: '7z', extension: '7z', bytes: [0x37, 0x7a, 0xbc, 0xaf, 0x27, 0x1c], offset: 0 },
  { name: 'ELF', extension: 'elf', bytes: [0x7f, 0x45, 0x4c, 0x46], offset: 0 },
  { name: 'PE/COFF', extension: 'exe', bytes: [0x4d, 0x5a], offset: 0 },
  { name: 'SQLite', extension: 'sqlite', bytes: [0x53, 0x51, 0x4c, 0x69, 0x74, 0x65, 0x20, 0x66, 0x6f, 0x72, 0x6d, 0x61, 0x74], offset: 0 },
  { name: 'PCAP', extension: 'pcap', bytes: [0xa1, 0xb2, 0xc3, 0xd4], offset: 0 },
  { name: 'PCAPNG', extension: 'pcapng', bytes: [0x0a, 0x0d, 0x0d, 0x0a], offset: 0 },
  { name: 'WASM', extension: 'wasm', bytes: [0x00, 0x61, 0x73, 0x6d], offset: 0 },
  { name: 'MP4/MOV', extension: 'mp4', bytes: [0x66, 0x74, 0x79, 0x70], offset: 4 },
  { name: 'OGG', extension: 'ogg', bytes: [0x4f, 0x67, 0x67, 0x53], offset: 0 },
  { name: 'FLAC', extension: 'flac', bytes: [0x66, 0x4c, 0x61, 0x43], offset: 0 },
  { name: 'WAV', extension: 'wav', bytes: [0x52, 0x49, 0x46, 0x46], offset: 0 },
  { name: 'TIFF-LE', extension: 'tiff', bytes: [0x49, 0x49, 0x2a, 0x00], offset: 0 },
  { name: 'TIFF-BE', extension: 'tiff', bytes: [0x4d, 0x4d, 0x00, 0x2a], offset: 0 },
  { name: 'Mach-O 32', extension: 'macho', bytes: [0xfe, 0xed, 0xfa, 0xce], offset: 0 },
  { name: 'Mach-O 64', extension: 'macho', bytes: [0xfe, 0xed, 0xfa, 0xcf], offset: 0 },
  { name: 'DEX', extension: 'dex', bytes: [0x64, 0x65, 0x78, 0x0a], offset: 0 },
  { name: 'Class', extension: 'class', bytes: [0xca, 0xfe, 0xba, 0xbe], offset: 0 },
];

export function detectFormat(bytes: Uint8Array): MagicSignature | null {
  for (const sig of MAGIC_SIGNATURES) {
    if (bytes.length < sig.offset + sig.bytes.length) continue;
    let match = true;
    for (let i = 0; i < sig.bytes.length; i++) {
      if (bytes[sig.offset + i] !== sig.bytes[i]) {
        match = false;
        break;
      }
    }
    if (match) return sig;
  }
  return null;
}

// ─── Struct Generation ──────────────────────────────────────────────────────

export interface FieldDef {
  name: string;
  type: string;
  offset: number;
  size: number;
}

export function generateCStruct(name: string, fields: FieldDef[]): string {
  const lines = [`typedef struct __attribute__((packed)) {`];
  for (const f of fields) {
    const cType = sizeToType(f.size, 'c');
    lines.push(`    ${cType} ${f.name}; /* offset: 0x${f.offset.toString(16)}, size: ${f.size} */`);
  }
  lines.push(`} ${name};`);
  return lines.join('\n');
}

export function generateRustStruct(name: string, fields: FieldDef[]): string {
  const lines = [`#[repr(C, packed)]`, `pub struct ${name} {`];
  for (const f of fields) {
    const rustType = sizeToType(f.size, 'rust');
    lines.push(`    pub ${f.name}: ${rustType}, // offset: 0x${f.offset.toString(16)}, size: ${f.size}`);
  }
  lines.push(`}`);
  return lines.join('\n');
}

function sizeToType(size: number, lang: 'c' | 'rust'): string {
  if (lang === 'c') {
    switch (size) {
      case 1: return 'uint8_t';
      case 2: return 'uint16_t';
      case 4: return 'uint32_t';
      case 8: return 'uint64_t';
      default: return `uint8_t[${size}]`;
    }
  } else {
    switch (size) {
      case 1: return 'u8';
      case 2: return 'u16';
      case 4: return 'u32';
      case 8: return 'u64';
      default: return `[u8; ${size}]`;
    }
  }
}
