export default function Loading() {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-white/80 backdrop-blur-sm dark:bg-[#0a0a14]/80">
      <div className="h-9 w-9 animate-spin rounded-full border-2 border-foreground/20 border-t-foreground" />
    </div>
  );
}