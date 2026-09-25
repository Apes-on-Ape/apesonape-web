export type ProfileTab = 'apes' | 'creations' | 'arcade';

const TABS: Array<{ id: ProfileTab; label: string }> = [
	{ id: 'apes', label: 'My Apes' },
	{ id: 'creations', label: 'Transmissions' },
	{ id: 'arcade', label: 'Arcade record' },
];

export default function ProfileTabs({
	value,
	onChange,
	apesLabel = 'My Apes',
}: {
	value: ProfileTab;
	onChange: (tab: ProfileTab) => void;
	apesLabel?: string;
}) {
	return (
		<div className="mt-12 flex flex-wrap gap-6 border-t border-white/10 pt-6" role="tablist" aria-label="Profile record">
			{TABS.map((tab) => (
				<button
					key={tab.id}
					type="button"
					role="tab"
					aria-selected={value === tab.id}
					onClick={() => onChange(tab.id)}
					className={`font-[family-name:var(--font-signal-display)] text-xl uppercase tracking-tight sm:text-2xl ${
						value === tab.id ? 'border-b border-[var(--signal)] text-[var(--ink)]' : 'text-[var(--ink-mute)] hover:text-[var(--ink)]'
					}`}
				>
					{tab.id === 'apes' ? apesLabel : tab.label}
				</button>
			))}
		</div>
	);
}
