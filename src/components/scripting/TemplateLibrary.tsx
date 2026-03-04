import { useState, useEffect } from 'react';
import { Search, Download, Star, Clock, FileCode2, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { tauriCommands } from '@/lib/tauri';
import { cn } from '@/lib/utils';

interface Template {
  name: string;
  format: string;
  description: string;
  author: string;
  downloads: number;
  rating: number;
  updatedAt: string;
  category: string;
}

const MOCK_TEMPLATES: Template[] = [
  { name: 'PNG Image', format: 'png', description: 'Full PNG chunk parser with IHDR, IDAT, tEXt support', author: 'binary-insight', downloads: 12500, rating: 4.9, updatedAt: '2026-02-15', category: 'Images' },
  { name: 'PE Executable', format: 'pe32', description: 'Windows PE32/PE32+ with imports, exports, sections', author: 'binary-insight', downloads: 9800, rating: 4.8, updatedAt: '2026-03-01', category: 'Executables' },
  { name: 'ELF Binary', format: 'elf64', description: 'Linux ELF32/ELF64 with sections, symbols, dynamic', author: 'binary-insight', downloads: 8200, rating: 4.7, updatedAt: '2026-02-20', category: 'Executables' },
  { name: 'ZIP Archive', format: 'zip', description: 'ZIP with local files, central directory, EOCD', author: 'binary-insight', downloads: 7600, rating: 4.6, updatedAt: '2026-01-10', category: 'Archives' },
  { name: 'MP4 Container', format: 'mp4', description: 'MPEG-4 Part 14 with atoms/boxes parser', author: 'community', downloads: 5400, rating: 4.5, updatedAt: '2026-02-28', category: 'Media' },
  { name: 'SQLite Database', format: 'sqlite', description: 'SQLite3 header, pages, cells, B-tree parser', author: 'community', downloads: 4200, rating: 4.4, updatedAt: '2025-12-15', category: 'Databases' },
  { name: 'PDF Document', format: 'pdf', description: 'PDF cross-ref, objects, streams parser', author: 'community', downloads: 3800, rating: 4.3, updatedAt: '2026-01-25', category: 'Documents' },
  { name: 'PCAP Capture', format: 'pcap', description: 'Packet capture with Ethernet/IP/TCP/UDP layers', author: 'binary-insight', downloads: 3200, rating: 4.6, updatedAt: '2026-03-02', category: 'Network' },
  { name: 'Mach-O Binary', format: 'macho', description: 'macOS Mach-O with load commands, segments', author: 'community', downloads: 2100, rating: 4.2, updatedAt: '2025-11-30', category: 'Executables' },
  { name: 'DEX Bytecode', format: 'dex', description: 'Android DEX with class defs, methods, strings', author: 'community', downloads: 1800, rating: 4.1, updatedAt: '2026-01-05', category: 'Executables' },
  { name: 'WASM Module', format: 'wasm', description: 'WebAssembly binary with sections, types, functions', author: 'community', downloads: 1500, rating: 4.0, updatedAt: '2026-02-10', category: 'Executables' },
  { name: 'GZIP', format: 'gzip', description: 'GZIP compressed file with members and CRC', author: 'binary-insight', downloads: 2800, rating: 4.4, updatedAt: '2026-02-05', category: 'Archives' },
];

const CATEGORIES = ['All', 'Images', 'Executables', 'Archives', 'Media', 'Databases', 'Documents', 'Network'];

interface TemplateLibraryProps {
  onLoadTemplate: (script: string) => void;
}

export default function TemplateLibrary({ onLoadTemplate }: TemplateLibraryProps) {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [templates, setTemplates] = useState<Template[]>(MOCK_TEMPLATES);

  const filtered = templates.filter((t) => {
    const matchesSearch =
      !search ||
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.format.toLowerCase().includes(search.toLowerCase()) ||
      t.description.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = category === 'All' || t.category === category;
    return matchesSearch && matchesCategory;
  });

  const handleLoad = async (template: Template) => {
    try {
      if (tauriCommands.isAvailable()) {
        const script = await tauriCommands.loadTemplate(template.format);
        if (script) {
          onLoadTemplate(script);
          return;
        }
      }
      // Mock
      onLoadTemplate(`-- ${template.name} Template\n-- Auto-loaded from template library\n\nTemplate = {\n    name = "${template.name}",\n    extensions = { "${template.format}" },\n}\n\nfunction decode(buffer)\n    -- TODO: Implement ${template.name} decoder\n    return 0\nend\n`);
    } catch (err) {
      console.error('Failed to load template:', err);
    }
  };

  return (
    <div className="flex flex-col h-full bg-card">
      {/* Header */}
      <div className="px-3 py-2 border-b border-border">
        <div className="text-xs font-semibold text-foreground mb-2">Template Library</div>
        <div className="flex items-center gap-2">
          <div className="flex-1 relative">
            <Search className="w-3 h-3 absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search templates..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-surface-2 border border-border/50 rounded pl-7 pr-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-primary/50"
            />
          </div>
        </div>
        {/* Category tabs */}
        <div className="flex gap-1 mt-2 flex-wrap">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={cn(
                'px-2 py-0.5 rounded text-[10px] transition-colors',
                category === cat
                  ? 'bg-primary/20 text-primary font-medium'
                  : 'text-muted-foreground hover:bg-secondary/30'
              )}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Template list */}
      <div className="flex-1 overflow-y-auto">
        {filtered.map((template) => (
          <div
            key={template.format}
            className="px-3 py-2 border-b border-border/30 hover:bg-secondary/10 transition-colors"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <FileCode2 className="w-4 h-4 text-blue-400 shrink-0" />
                <div>
                  <div className="text-xs font-medium text-foreground">{template.name}</div>
                  <div className="text-[10px] text-muted-foreground">{template.description}</div>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 text-[10px] gap-1 shrink-0"
                onClick={() => handleLoad(template)}
              >
                <Download className="w-3 h-3" />
                Load
              </Button>
            </div>
            <div className="flex items-center gap-3 mt-1 text-[9px] text-muted-foreground ml-6">
              <span className="flex items-center gap-0.5">
                <Star className="w-2.5 h-2.5 text-yellow-400" />
                {template.rating}
              </span>
              <span className="flex items-center gap-0.5">
                <Download className="w-2.5 h-2.5" />
                {template.downloads.toLocaleString()}
              </span>
              <span className="flex items-center gap-0.5">
                <Clock className="w-2.5 h-2.5" />
                {template.updatedAt}
              </span>
              <span>by {template.author}</span>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="px-3 py-8 text-center text-xs text-muted-foreground">
            No templates found matching "{search}"
          </div>
        )}
      </div>
    </div>
  );
}
