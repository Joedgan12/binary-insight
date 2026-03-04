import { useState, useCallback, useRef } from 'react';
import Editor, { OnMount } from '@monaco-editor/react';
import { Play, Save, FileText, RotateCcw, Download, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { tauriCommands } from '@/lib/tauri';

const DEFAULT_SCRIPT = `-- Binary Insight Format Template
-- Language: Lua
-- Define your custom binary format decoder here

-- Template metadata
Template = {
    name = "Custom Format",
    description = "User-defined binary format",
    extensions = { "bin", "dat" },
}

-- Main decode function
function decode(buffer)
    local offset = 0

    -- Read magic number (4 bytes)
    local magic = buffer:read_uint32_be(offset)
    add_field("Magic Number", offset, 4, "header", string.format("0x%08X", magic))
    offset = offset + 4

    -- Read version (2 bytes)
    local version = buffer:read_uint16_le(offset)
    add_field("Version", offset, 2, "metadata", string.format("%d.%d", version >> 8, version & 0xFF))
    offset = offset + 2

    -- Read payload length (4 bytes)
    local payload_len = buffer:read_uint32_le(offset)
    add_field("Payload Length", offset, 4, "metadata", tostring(payload_len))
    offset = offset + 4

    -- Read payload
    if payload_len > 0 then
        add_field("Payload Data", offset, payload_len, "payload", "[binary data]")
        offset = offset + payload_len
    end

    -- Read checksum (4 bytes)
    local checksum = buffer:read_uint32_be(offset)
    add_field("CRC-32 Checksum", offset, 4, "checksum", string.format("0x%08X", checksum))
    offset = offset + 4

    return offset  -- Total bytes consumed
end

-- Helper: Validate checksum
function validate_checksum(buffer, start, length, expected)
    local computed = crc32(buffer, start, length)
    return computed == expected
end
`;

interface ScriptEditorProps {
  className?: string;
}

export default function ScriptEditor({ className }: ScriptEditorProps) {
  const [script, setScript] = useState(DEFAULT_SCRIPT);
  const [output, setOutput] = useState<string>('');
  const [isRunning, setIsRunning] = useState(false);
  const [fileName, setFileName] = useState('custom_template.lua');
  const editorRef = useRef<any>(null);

  const handleEditorMount: OnMount = (editor) => {
    editorRef.current = editor;
  };

  const handleRun = useCallback(async () => {
    setIsRunning(true);
    setOutput('Running script...\n');
    try {
      if (tauriCommands.isAvailable()) {
        const result = await tauriCommands.runScript(script);
        setOutput(JSON.stringify(result, null, 2));
      } else {
        // Mock execution
        await new Promise((r) => setTimeout(r, 500));
        setOutput(
          `[Mock Execution] Script parsed successfully.\n\n` +
          `Template: Custom Format\n` +
          `Fields decoded: 5\n` +
          `  - Magic Number: 0x89504E47 (header, 4 bytes @ 0x0000)\n` +
          `  - Version: 1.0 (metadata, 2 bytes @ 0x0004)\n` +
          `  - Payload Length: 1024 (metadata, 4 bytes @ 0x0006)\n` +
          `  - Payload Data: [binary data] (payload, 1024 bytes @ 0x000A)\n` +
          `  - CRC-32 Checksum: 0x2E3F1A89 (checksum, 4 bytes @ 0x040A)\n` +
          `\nTotal: 1038 bytes consumed\nExecution time: 0.23ms`
        );
      }
    } catch (err) {
      setOutput(`Error: ${err}`);
    } finally {
      setIsRunning(false);
    }
  }, [script]);

  const handleSave = useCallback(() => {
    // In Tauri, would save to disk
    console.log('Saving script:', fileName);
  }, [fileName]);

  const handleReset = useCallback(() => {
    setScript(DEFAULT_SCRIPT);
    setOutput('');
  }, []);

  return (
    <div className={`flex flex-col h-full bg-card ${className || ''}`}>
      {/* Toolbar */}
      <div className="flex items-center gap-2 px-3 py-1.5 border-b border-border">
        <FileText className="w-3.5 h-3.5 text-muted-foreground" />
        <input
          type="text"
          value={fileName}
          onChange={(e) => setFileName(e.target.value)}
          className="bg-surface-2 border border-border/50 rounded px-2 py-0.5 text-xs font-mono w-48 focus:outline-none focus:ring-1 focus:ring-primary/50"
        />
        <div className="ml-auto flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-6 gap-1 text-[10px]"
            onClick={handleRun}
            disabled={isRunning}
          >
            <Play className="w-3 h-3" />
            Run
          </Button>
          <Button variant="ghost" size="sm" className="h-6 gap-1 text-[10px]" onClick={handleSave}>
            <Save className="w-3 h-3" />
            Save
          </Button>
          <Button variant="ghost" size="sm" className="h-6 gap-1 text-[10px]" onClick={handleReset}>
            <RotateCcw className="w-3 h-3" />
          </Button>
          <Button variant="ghost" size="sm" className="h-6 gap-1 text-[10px]">
            <Upload className="w-3 h-3" />
          </Button>
          <Button variant="ghost" size="sm" className="h-6 gap-1 text-[10px]">
            <Download className="w-3 h-3" />
          </Button>
        </div>
      </div>

      {/* Editor + Output split */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Monaco Editor */}
        <div className="flex-1 min-h-0">
          <Editor
            height="100%"
            defaultLanguage="lua"
            theme="vs-dark"
            value={script}
            onChange={(value) => setScript(value ?? '')}
            onMount={handleEditorMount}
            options={{
              minimap: { enabled: false },
              fontSize: 12,
              fontFamily: 'JetBrains Mono, monospace',
              lineNumbers: 'on',
              renderWhitespace: 'selection',
              scrollBeyondLastLine: false,
              wordWrap: 'on',
              tabSize: 4,
              padding: { top: 8 },
              bracketPairColorization: { enabled: true },
              suggest: { showKeywords: true },
            }}
          />
        </div>

        {/* Output panel */}
        <div className="h-40 border-t border-border flex flex-col">
          <div className="px-3 py-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider border-b border-border/50 flex items-center justify-between">
            <span>Output</span>
            {isRunning && (
              <span className="text-yellow-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse" />
                Running
              </span>
            )}
          </div>
          <pre className="flex-1 overflow-auto p-2 text-[11px] font-mono text-muted-foreground whitespace-pre-wrap">
            {output || 'Press Run to execute the script...'}
          </pre>
        </div>
      </div>
    </div>
  );
}
