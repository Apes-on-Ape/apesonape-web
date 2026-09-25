export default function SettingsToggle({
	checked,
	disabled,
	label,
	onChange,
}: {
	checked: boolean;
	disabled?: boolean;
	label: string;
	onChange: (next: boolean) => void;
}) {
	return (
		<button
			type="button"
			role="switch"
			aria-checked={checked}
			aria-label={label}
			aria-disabled={disabled || undefined}
			disabled={disabled}
			onClick={() => onChange(!checked)}
			className="inline-flex h-11 min-w-12 shrink-0 items-center justify-center rounded-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--signal)] disabled:cursor-not-allowed disabled:opacity-40"
		>
			<span className="sr-only">{checked ? 'On' : 'Off'}</span>
			<span
				className={`relative h-[26px] w-12 overflow-hidden rounded-full border transition-colors ${checked ? 'border-[var(--signal)] bg-[var(--signal)]' : 'border-white/30 bg-black hover:border-white/50'}`}
			>
				<span
					className={`absolute top-[3px] left-[3px] h-5 w-5 rounded-full bg-[var(--ink)] transition-transform ${checked ? 'translate-x-[22px]' : 'translate-x-0'}`}
				/>
			</span>
		</button>
	);
}
