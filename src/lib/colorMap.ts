export const fieldTypeColors: Record<string, string> = {
  header: 'bg-hex-header/20 text-hex-header border-hex-header/30',
  metadata: 'bg-hex-metadata/20 text-hex-metadata border-hex-metadata/30',
  payload: 'bg-hex-payload/20 text-hex-payload border-hex-payload/30',
  checksum: 'bg-hex-checksum/20 text-hex-checksum border-hex-checksum/30',
  string: 'bg-hex-string/20 text-hex-string border-hex-string/30',
  unknown: 'bg-hex-unknown/20 text-hex-unknown border-hex-unknown/30',
};

export const fieldTypeDotColors: Record<string, string> = {
  header: 'bg-hex-header',
  metadata: 'bg-hex-metadata',
  payload: 'bg-hex-payload',
  checksum: 'bg-hex-checksum',
  string: 'bg-hex-string',
  unknown: 'bg-hex-unknown',
};

export const protocolColors: Record<string, string> = {
  TCP: 'text-hex-metadata',
  TLS: 'text-hex-checksum',
  HTTP: 'text-hex-payload',
  DNS: 'text-hex-header',
  UDP: 'text-hex-string',
};

export function toHex(byte: number): string {
  return byte.toString(16).toUpperCase().padStart(2, '0');
}

export function toAscii(byte: number): string {
  return byte >= 32 && byte <= 126 ? String.fromCharCode(byte) : '·';
}

export function formatOffset(offset: number): string {
  return offset.toString(16).toUpperCase().padStart(8, '0');
}
