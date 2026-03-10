export function AdSense({ className = '' }: { className?: string }) {
  return (
    <div className={`my-8 flex w-full flex-col items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-zinc-900/50 p-4 text-center ${className}`}>
      <span className="text-xs font-medium uppercase tracking-widest text-zinc-500">Advertisement</span>
      <div className="mt-2 flex h-[90px] w-full max-w-[728px] items-center justify-center rounded bg-zinc-800/50">
        <span className="text-sm text-zinc-600">Google AdSense Placeholder</span>
      </div>
    </div>
  );
}
