export function shortAddress(address: string) {
	if (!address) return '';
	return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

export function prettyReference(id: string | null | undefined) {
	if (!id) return '';
	if (/^[0-9a-f]{8}-[0-9a-f-]{20,}$/i.test(id)) return '';
	return id
		.replace(/[_-]+/g, ' ')
		.replace(/\b\w/g, (char) => char.toUpperCase());
}

export function activityTitle(event: {
	source: string;
	action: string;
	label: string;
	referenceId?: string | null;
}) {
	const name = prettyReference(event.referenceId);
	if (event.source === 'arcade' && (event.action === 'personal-best' || event.action === 'personal_best')) {
		return name ? `New personal best // ${name}` : 'New personal best';
	}
	if (event.source === 'arcade' && (event.action === 'run' || event.action === 'run_completed')) {
		return name ? `Arcade run // ${name}` : 'Arcade run';
	}
	if (event.source === 'achievement') {
		return name ? `Achievement unlocked // ${name}` : 'Achievement unlocked';
	}
	if (event.source === 'studio' && (event.action === 'publish' || event.action === 'transmission_published')) return 'Transmission published';
	if (event.source === 'studio' && (event.action === 'remix' || event.action === 'transmission_remixed')) return 'Transmission remixed';
	if (event.source === 'streak') return 'Daily activity';
	return event.label || 'Progress';
}

export function relativeTime(iso: string) {
	const then = new Date(iso).getTime();
	if (!Number.isFinite(then)) return '';
	const minutes = Math.round((Date.now() - then) / 60000);
	if (minutes < 1) return 'Just now';
	if (minutes < 60) return `${minutes}m ago`;
	const hours = Math.round(minutes / 60);
	if (hours < 24) return `${hours}h ago`;
	const days = Math.round(hours / 24);
	if (days === 1) return 'Yesterday';
	if (days < 14) return `${days}d ago`;
	return new Date(iso).toLocaleDateString();
}
