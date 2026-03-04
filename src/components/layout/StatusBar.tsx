export default function StatusBar() {
  return (
    <div className="h-6 bg-card border-t border-border flex items-center px-3 text-[10px] font-mono text-muted-foreground gap-4">
      <span>Offset: <span className="text-foreground">0x00000010</span></span>
      <span>Selection: <span className="text-foreground">4 bytes</span></span>
      <span>Value: <span className="text-hex-metadata">UInt32 = 1024</span></span>
      <span className="ml-auto">Format: <span className="text-hex-header">PNG</span></span>
      <span>Size: <span className="text-foreground">847 KB</span></span>
      <span>Entropy: <span className="text-hex-payload">0.89</span></span>
    </div>
  );
}
