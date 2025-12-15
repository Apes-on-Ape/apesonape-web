import { CreationType } from './types';

type Skill = CreationType;

const BADGE_INTERVAL = 5;

const BADGE_TITLES: Record<Skill, string[]> = {
	sound: ['Sound Scout', 'Sound Artisan', 'Sound Maestro', 'Sound Virtuoso', 'Sound Legend'],
	visual: ['Visual Scout', 'Visual Artisan', 'Visual Maestro', 'Visual Virtuoso', 'Visual Legend'],
	interactive: ['Interactive Tinkerer', 'Interactive Builder', 'Interactive Architect', 'Interactive Virtuoso', 'Interactive Legend'],
	code: ['Code Scripter', 'Code Crafter', 'Code Architect', 'Code Virtuoso', 'Code Legend'],
};

export function getSkillBadges(skill: Skill, level: number): { title: string; level: number }[] {
	if (level < BADGE_INTERVAL) return [];
	const badges: { title: string; level: number }[] = [];
	const titles = BADGE_TITLES[skill] || [];
	const badgeCount = Math.floor(level / BADGE_INTERVAL);
	for (let i = 1; i <= badgeCount; i++) {
		const title = titles[i - 1] || `${skill} Badge ${i}`;
		badges.push({ title, level: i * BADGE_INTERVAL });
	}
	return badges;
}

