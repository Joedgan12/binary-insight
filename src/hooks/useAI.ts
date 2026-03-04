import { useState, useCallback, useRef } from 'react';
import { tauriCommands } from '@/lib/tauri';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface AIMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
}

export interface AISuggestion {
  fieldName: string;
  confidence: number;
  description: string;
  offset: number;
  length: number;
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useAI() {
  const [messages, setMessages] = useState<AIMessage[]>([
    {
      id: 'system-1',
      role: 'system',
      content:
        'Binary Insight AI Assistant — I can help analyze binary files, detect formats, label fields, and answer questions about your data.',
      timestamp: new Date(),
    },
  ]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [suggestions, setSuggestions] = useState<AISuggestion[]>([]);
  const [modelStatus, setModelStatus] = useState<'connected' | 'disconnected' | 'loading'>('disconnected');
  const abortRef = useRef<AbortController | null>(null);

  const sendMessage = useCallback(
    async (content: string, context?: { bytes?: number[]; format?: string; regions?: any[] }) => {
      const userMsg: AIMessage = {
        id: `msg-${Date.now()}`,
        role: 'user',
        content,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMsg]);
      setIsProcessing(true);

      const assistantId = `msg-${Date.now() + 1}`;
      const streamingMsg: AIMessage = {
        id: assistantId,
        role: 'assistant',
        content: '',
        timestamp: new Date(),
        isStreaming: true,
      };
      setMessages((prev) => [...prev, streamingMsg]);

      try {
        if (tauriCommands.isAvailable()) {
          abortRef.current = new AbortController();
          const response = await tauriCommands.queryAI(content, context);
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId
                ? { ...m, content: response, isStreaming: false }
                : m
            )
          );
        } else {
          // Fallback: simulate AI response
          const response = generateMockResponse(content, context);
          await new Promise((r) => setTimeout(r, 800 + Math.random() * 1200));
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId
                ? { ...m, content: response, isStreaming: false }
                : m
            )
          );
        }
      } catch (err) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? { ...m, content: `Error: ${err}`, isStreaming: false }
              : m
          )
        );
      } finally {
        setIsProcessing(false);
      }
    },
    []
  );

  const analyzeBinary = useCallback(
    async (bytes: number[], offset: number, length: number) => {
      setIsProcessing(true);
      try {
        if (tauriCommands.isAvailable()) {
          const result = await tauriCommands.analyzeBytes(bytes, offset, length);
          if (result?.suggestions) {
            setSuggestions(result.suggestions);
          }
          return result;
        }
        // Mock
        const mockSuggestions: AISuggestion[] = [
          {
            fieldName: 'Magic Number',
            confidence: 0.95,
            description: 'File format signature bytes',
            offset,
            length: Math.min(4, length),
          },
          {
            fieldName: 'Length Field',
            confidence: 0.72,
            description: 'Possible 32-bit big-endian length',
            offset: offset + 4,
            length: 4,
          },
        ];
        setSuggestions(mockSuggestions);
        return { suggestions: mockSuggestions };
      } finally {
        setIsProcessing(false);
      }
    },
    []
  );

  const clearMessages = useCallback(() => {
    setMessages([
      {
        id: 'system-1',
        role: 'system',
        content:
          'Binary Insight AI Assistant — I can help analyze binary files, detect formats, label fields, and answer questions about your data.',
        timestamp: new Date(),
      },
    ]);
    setSuggestions([]);
  }, []);

  const cancelRequest = useCallback(() => {
    abortRef.current?.abort();
    setIsProcessing(false);
  }, []);

  return {
    messages,
    isProcessing,
    suggestions,
    modelStatus,
    sendMessage,
    analyzeBinary,
    clearMessages,
    cancelRequest,
    setModelStatus,
  };
}

// ─── Mock Response Generator ─────────────────────────────────────────────────

function generateMockResponse(
  query: string,
  context?: { bytes?: number[]; format?: string; regions?: any[] }
): string {
  const q = query.toLowerCase();

  if (q.includes('format') || q.includes('type') || q.includes('what is')) {
    return `Based on the magic bytes analysis, this appears to be a **${context?.format || 'PNG'}** file.\n\n**Signature:** \`89 50 4E 47 0D 0A 1A 0A\`\n\nThe first 8 bytes match the standard PNG file signature. The file contains an IHDR chunk defining image dimensions, followed by IDAT compressed image data.`;
  }

  if (q.includes('entropy') || q.includes('encrypted') || q.includes('compressed')) {
    return `The entropy analysis shows:\n\n- **Blocks 0-3:** Low entropy (0.2-0.4) — structured header data\n- **Blocks 4-48:** High entropy (0.85-0.98) — compressed/encrypted content\n- **Blocks 49-63:** Medium entropy (0.5-0.7) — metadata/padding\n\nThe high-entropy region is consistent with **zlib-compressed** image data (IDAT chunks in PNG).`;
  }

  if (q.includes('packet') || q.includes('port') || q.includes('network')) {
    return `I found **23 packets** matching your criteria:\n\n- 15 TCP packets to port 443 (TLS/HTTPS)\n- 5 DNS queries to 8.8.8.8\n- 3 HTTP requests to 192.168.1.1\n\nThe TCP session to port 443 appears to be a TLS 1.3 handshake followed by encrypted application data.`;
  }

  if (q.includes('checksum') || q.includes('crc')) {
    return `I detected a **CRC-32** checksum at offset \`0xB4\` (4 bytes).\n\nComputed CRC-32: \`0x2E3F1A89\`\nStored value: \`0x2E3F1A89\` ✅\n\nThe checksum covers bytes from offset \`0x0C\` to \`0xB0\` and **validates correctly**.`;
  }

  return `I've analyzed the binary data at the selected region.\n\n**Key observations:**\n1. The data structure appears to follow a **TLV (Type-Length-Value)** pattern\n2. Field boundaries align on 4-byte boundaries suggesting 32-bit architecture\n3. Several ASCII strings detected between offsets 0x40-0x80\n\nWould you like me to generate a struct definition or investigate a specific region?`;
}
