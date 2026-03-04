import { useState } from "react";
import { Send, Bot, User, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

const INITIAL_MESSAGES = [
  {
    role: "assistant" as const,
    content: "I've detected this file as a **PNG image** (89 50 4E 47 signature). The IHDR chunk indicates a 1024×768 RGB image with 8-bit depth. I can see pHYs and IDAT chunks. Would you like me to analyze the compressed data regions?",
  },
  {
    role: "user" as const,
    content: "Find any unusual patterns in the entropy distribution",
  },
  {
    role: "assistant" as const,
    content: "The entropy analysis shows a sharp transition at offset **0x3D** from structured data (entropy ~0.35) to highly random data (entropy ~0.94). This is consistent with the start of the **IDAT deflate-compressed** payload. No anomalous low-entropy regions detected within the compressed stream — this appears to be a normal PNG compression pattern.",
  },
];

export default function AIPanel() {
  const [messages] = useState(INITIAL_MESSAGES);
  const [input, setInput] = useState("");

  return (
    <div className="w-72 bg-card border-l border-border flex flex-col h-full">
      <div className="px-3 py-2 border-b border-border flex items-center gap-2">
        <Sparkles className="w-3.5 h-3.5 text-primary" />
        <span className="text-xs font-semibold text-foreground">AI Assistant</span>
        <span className="text-[9px] text-accent bg-accent/10 px-1.5 py-0.5 rounded-full ml-auto">Online</span>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {messages.map((msg, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className={`flex gap-2 ${msg.role === "user" ? "justify-end" : ""}`}
          >
            {msg.role === "assistant" && (
              <div className="w-5 h-5 rounded bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Bot className="w-3 h-3 text-primary" />
              </div>
            )}
            <div
              className={`text-[11px] leading-relaxed rounded-lg px-2.5 py-1.5 max-w-[200px] ${
                msg.role === "user"
                  ? "bg-primary/15 text-foreground"
                  : "bg-secondary/50 text-foreground/90"
              }`}
            >
              {msg.content}
            </div>
            {msg.role === "user" && (
              <div className="w-5 h-5 rounded bg-secondary flex items-center justify-center flex-shrink-0 mt-0.5">
                <User className="w-3 h-3 text-muted-foreground" />
              </div>
            )}
          </motion.div>
        ))}
      </div>

      <div className="p-2 border-t border-border">
        <div className="flex items-center gap-1.5 bg-secondary/40 rounded-lg px-2 py-1.5">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            className="flex-1 bg-transparent text-xs outline-none placeholder:text-muted-foreground text-foreground"
            placeholder="Ask about this binary..."
          />
          <button className="p-1 rounded hover:bg-secondary transition-colors">
            <Send className="w-3 h-3 text-primary" />
          </button>
        </div>
      </div>
    </div>
  );
}
