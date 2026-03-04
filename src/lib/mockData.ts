// Mock hex data for demo
export const MOCK_HEX_DATA: number[] = [
  0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52,
  0x00, 0x00, 0x04, 0x00, 0x00, 0x00, 0x03, 0x00, 0x08, 0x02, 0x00, 0x00, 0x00, 0xD5, 0x52, 0x38,
  0xA0, 0x00, 0x00, 0x00, 0x09, 0x70, 0x48, 0x59, 0x73, 0x00, 0x00, 0x0E, 0xC3, 0x00, 0x00, 0x0E,
  0xC3, 0x01, 0xC7, 0x6F, 0xA8, 0x64, 0x00, 0x00, 0x20, 0x00, 0x49, 0x44, 0x41, 0x54, 0x78, 0x9C,
  0xEC, 0xBD, 0x09, 0x98, 0x5C, 0x55, 0x99, 0xF7, 0x7F, 0xCF, 0xB9, 0x4B, 0x55, 0x75, 0x75, 0x77,
  0x25, 0xE9, 0x24, 0x9D, 0x7D, 0x23, 0x21, 0x09, 0x84, 0x4D, 0x36, 0xD9, 0x14, 0x41, 0x10, 0x15,
  0x71, 0x19, 0x1D, 0x77, 0xDC, 0x75, 0x74, 0x1C, 0x67, 0x74, 0x46, 0x47, 0xC7, 0x71, 0x1C, 0x75,
  0x70, 0x1C, 0x47, 0x1D, 0x17, 0xD4, 0x51, 0x14, 0x05, 0x15, 0x44, 0x50, 0x90, 0x45, 0x76, 0x42,
  0x08, 0x21, 0x24, 0x21, 0x6B, 0x27, 0xBD, 0x57, 0x57, 0xD7, 0x72, 0xF7, 0x73, 0xFE, 0xFF, 0x53,
  0xDD, 0x49, 0xBA, 0x93, 0x4E, 0x42, 0x08, 0xCE, 0xCC, 0x7B, 0xBF, 0xEF, 0xAA, 0x5B, 0xE7, 0x9E,
  0x7B, 0xCE, 0x39, 0xE7, 0xB7, 0x9C, 0x73, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
  0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
];

export type FieldRegion = {
  name: string;
  start: number;
  end: number;
  type: 'header' | 'metadata' | 'payload' | 'checksum' | 'string' | 'unknown';
  description: string;
  value?: string;
};

export const MOCK_REGIONS: FieldRegion[] = [
  { name: "PNG Signature", start: 0, end: 7, type: "header", description: "Magic bytes identifying PNG format", value: "89 50 4E 47 0D 0A 1A 0A" },
  { name: "IHDR Length", start: 8, end: 11, type: "metadata", description: "Length of IHDR chunk data", value: "13 bytes" },
  { name: "IHDR Type", start: 12, end: 15, type: "header", description: "Chunk type identifier", value: "IHDR" },
  { name: "Width", start: 16, end: 19, type: "metadata", description: "Image width in pixels", value: "1024" },
  { name: "Height", start: 20, end: 23, type: "metadata", description: "Image height in pixels", value: "768" },
  { name: "Bit Depth", start: 24, end: 24, type: "metadata", description: "Bits per sample", value: "8" },
  { name: "Color Type", start: 25, end: 25, type: "metadata", description: "PNG color type", value: "RGB (2)" },
  { name: "CRC32", start: 29, end: 32, type: "checksum", description: "IHDR chunk checksum", value: "0xD55238A0" },
  { name: "pHYs Length", start: 33, end: 36, type: "metadata", description: "Length of pHYs chunk", value: "9 bytes" },
  { name: "pHYs Type", start: 37, end: 40, type: "header", description: "Physical pixel dimensions", value: "pHYs" },
  { name: "IDAT Marker", start: 57, end: 60, type: "header", description: "Image data chunk", value: "IDAT" },
  { name: "Compressed Data", start: 61, end: 191, type: "payload", description: "Deflate-compressed image data" },
];

export type PacketData = {
  id: number;
  time: string;
  source: string;
  destination: string;
  protocol: string;
  length: number;
  info: string;
};

export const MOCK_PACKETS: PacketData[] = [
  { id: 1, time: "0.000000", source: "192.168.1.105", destination: "142.250.80.46", protocol: "TCP", length: 74, info: "54312 → 443 [SYN] Seq=0 Win=64240" },
  { id: 2, time: "0.012453", source: "142.250.80.46", destination: "192.168.1.105", protocol: "TCP", length: 74, info: "443 → 54312 [SYN, ACK] Seq=0 Ack=1" },
  { id: 3, time: "0.012621", source: "192.168.1.105", destination: "142.250.80.46", protocol: "TCP", length: 66, info: "54312 → 443 [ACK] Seq=1 Ack=1" },
  { id: 4, time: "0.013102", source: "192.168.1.105", destination: "142.250.80.46", protocol: "TLS", length: 571, info: "Client Hello" },
  { id: 5, time: "0.025891", source: "142.250.80.46", destination: "192.168.1.105", protocol: "TLS", length: 3843, info: "Server Hello, Certificate, Server Key Exchange" },
  { id: 6, time: "0.026012", source: "192.168.1.105", destination: "142.250.80.46", protocol: "TLS", length: 192, info: "Client Key Exchange, Change Cipher Spec" },
  { id: 7, time: "0.038445", source: "142.250.80.46", destination: "192.168.1.105", protocol: "TLS", length: 99, info: "Change Cipher Spec, Encrypted Handshake" },
  { id: 8, time: "0.039001", source: "192.168.1.105", destination: "142.250.80.46", protocol: "HTTP", length: 412, info: "GET /search?q=binary+analyzer HTTP/2" },
  { id: 9, time: "0.051234", source: "142.250.80.46", destination: "192.168.1.105", protocol: "HTTP", length: 15234, info: "HTTP/2 200 OK (text/html)" },
  { id: 10, time: "0.055102", source: "192.168.1.105", destination: "8.8.8.8", protocol: "DNS", length: 72, info: "Standard query A fonts.googleapis.com" },
  { id: 11, time: "0.067891", source: "8.8.8.8", destination: "192.168.1.105", protocol: "DNS", length: 104, info: "Standard query response A 142.250.80.10" },
  { id: 12, time: "0.068102", source: "192.168.1.105", destination: "142.250.80.10", protocol: "TCP", length: 74, info: "54320 → 443 [SYN] Seq=0 Win=64240" },
];

export type FileEntry = {
  name: string;
  type: 'file' | 'folder';
  size?: string;
  format?: string;
  children?: FileEntry[];
};

export const MOCK_FILE_TREE: FileEntry[] = [
  {
    name: "Sessions", type: "folder", children: [
      { name: "capture_2026-03-04.pcap", type: "file", size: "2.4 MB", format: "PCAP" },
      { name: "malware_sample.bin", type: "file", size: "156 KB", format: "PE32" },
    ]
  },
  {
    name: "Recent Files", type: "folder", children: [
      { name: "screenshot.png", type: "file", size: "847 KB", format: "PNG" },
      { name: "database.sqlite", type: "file", size: "12.1 MB", format: "SQLite" },
      { name: "archive.zip", type: "file", size: "3.2 MB", format: "ZIP" },
      { name: "firmware.bin", type: "file", size: "4.0 MB", format: "Unknown" },
    ]
  },
  {
    name: "Templates", type: "folder", children: [
      { name: "png.lua", type: "file", size: "4.2 KB" },
      { name: "pe32.lua", type: "file", size: "12.8 KB" },
      { name: "elf64.lua", type: "file", size: "9.1 KB" },
    ]
  },
];

export const MOCK_ENTROPY: number[] = Array.from({ length: 64 }, (_, i) => {
  if (i < 4) return 0.2 + Math.random() * 0.3;
  if (i < 8) return 0.4 + Math.random() * 0.2;
  if (i >= 12 && i <= 55) return 0.85 + Math.random() * 0.14;
  return 0.3 + Math.random() * 0.4;
});
