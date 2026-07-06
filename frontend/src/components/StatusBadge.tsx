export default function StatusBadge({ status }: { status: string }) {
  const colors = {
    MASTERED: 'text-blue-500',
    PRACTICING: 'text-amber-600',
    NEW: 'text-gray-400'
  };
  return (
    <span className={`text-xs uppercase tracking-wide ${colors[status as keyof typeof colors]}`}>
      {status}
    </span>
  );
}
