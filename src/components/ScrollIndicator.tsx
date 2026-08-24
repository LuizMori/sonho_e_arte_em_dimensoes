export function ScrollIndicator() {
  return (
    <div className="flex flex-col items-center gap-3 text-cream-light/70">
      <span className="label-caps">Role</span>
      <span className="w-px h-10 bg-cream-light/40 relative overflow-hidden">
        <span className="absolute inset-x-0 top-0 h-4 bg-orange animate-[fade-in_1.6s_ease-in-out_infinite_alternate]" />
      </span>
    </div>
  );
}
