export default function LoadingBar({ label = 'Loading' }: { label?: string }) {
	return (
		<div className="mt-4 max-w-xl" role="status" aria-live="polite">
			<p className="aoa-meta text-[var(--ink-mute)]">{label}</p>
			<div className="aoa-load-track mt-2">
				<span className="aoa-load-bar" />
			</div>
		</div>
	);
}
