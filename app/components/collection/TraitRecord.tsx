export default function TraitRecord({
  name,
  value,
  note,
}: {
  name: string;
  value: string;
  note?: string;
}) {
  return (
    <div className="min-w-0 border border-[rgba(243,238,228,0.12)] px-3 py-2">
      <p className="aoa-meta">{name}</p>
      <p className="mt-1 break-words text-sm font-semibold text-[var(--ink)]">{value}</p>
      {note ? <p className="aoa-meta mt-1">{note}</p> : null}
    </div>
  );
}
