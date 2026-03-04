import { useState } from 'react';
import { FileCode2, ChevronDown, Search, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

interface FormatOption {
  name: string;
  extension: string;
  description: string;
}

const BUILT_IN_FORMATS: FormatOption[] = [
  { name: 'Auto-detect', extension: '*', description: 'Detect format from magic bytes' },
  { name: 'PNG', extension: 'png', description: 'Portable Network Graphics' },
  { name: 'JPEG', extension: 'jpg', description: 'JPEG Image' },
  { name: 'GIF', extension: 'gif', description: 'Graphics Interchange Format' },
  { name: 'BMP', extension: 'bmp', description: 'Bitmap Image' },
  { name: 'PDF', extension: 'pdf', description: 'Portable Document Format' },
  { name: 'ZIP', extension: 'zip', description: 'ZIP Archive' },
  { name: 'GZIP', extension: 'gz', description: 'GZIP Compressed' },
  { name: 'TAR', extension: 'tar', description: 'Tape Archive' },
  { name: 'PE/COFF', extension: 'exe', description: 'Windows Executable (PE32/PE32+)' },
  { name: 'ELF', extension: 'elf', description: 'Linux Executable (ELF32/ELF64)' },
  { name: 'Mach-O', extension: 'macho', description: 'macOS Executable' },
  { name: 'SQLite', extension: 'sqlite', description: 'SQLite Database' },
  { name: 'PCAP', extension: 'pcap', description: 'Packet Capture (libpcap)' },
  { name: 'PCAPNG', extension: 'pcapng', description: 'Packet Capture Next Gen' },
  { name: 'MP4/MOV', extension: 'mp4', description: 'MPEG-4 Video Container' },
  { name: 'WebAssembly', extension: 'wasm', description: 'WebAssembly Binary' },
  { name: 'DEX', extension: 'dex', description: 'Android Dalvik Executable' },
  { name: 'Java Class', extension: 'class', description: 'Java Bytecode' },
  { name: 'Raw/Hex', extension: 'bin', description: 'Raw binary view (no decoder)' },
];

interface FormatSelectorProps {
  currentFormat: string | null;
  onFormatChange: (format: string) => void;
}

export default function FormatSelector({ currentFormat, onFormatChange }: FormatSelectorProps) {
  const [search, setSearch] = useState('');
  const filtered = search
    ? BUILT_IN_FORMATS.filter(
        (f) =>
          f.name.toLowerCase().includes(search.toLowerCase()) ||
          f.extension.toLowerCase().includes(search.toLowerCase())
      )
    : BUILT_IN_FORMATS;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="h-7 gap-1.5 text-xs">
          <FileCode2 className="w-3 h-3" />
          {currentFormat || 'Auto-detect'}
          <ChevronDown className="w-3 h-3 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64 max-h-80 overflow-y-auto">
        <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
          Format Decoder
        </DropdownMenuLabel>
        <div className="px-2 pb-1">
          <div className="flex items-center gap-1 bg-surface-2 rounded px-2 py-1">
            <Search className="w-3 h-3 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search formats..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-transparent text-xs flex-1 outline-none"
            />
          </div>
        </div>
        <DropdownMenuSeparator />
        {filtered.map((format) => (
          <DropdownMenuItem
            key={format.extension}
            onClick={() => onFormatChange(format.name)}
            className="flex items-center gap-2 text-xs"
          >
            <span className={cn('w-4', currentFormat === format.name ? 'text-green-400' : 'text-transparent')}>
              <Check className="w-3 h-3" />
            </span>
            <span className="font-medium">{format.name}</span>
            <span className="ml-auto text-muted-foreground">.{format.extension}</span>
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem className="text-xs text-muted-foreground">
          Load custom template...
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
