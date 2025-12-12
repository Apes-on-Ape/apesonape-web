import fs from 'fs/promises';
import path from 'path';
import { CreationType } from './types';
import { getSupabaseServiceClient } from '../supabase';

type Skill = CreationType;

export type SkillProgress = {
	xp: number;
	level: number;
	progress: number; // 0-1 within current level
};

export type CreatorSkills = Record<Skill, SkillProgress>;

type StoreRecord = {
	address: string; // lowercased
	xp: Record<Skill, number>;
};

const DATA_PATH = path.join(process.cwd(), 'data', 'studio-xp.json');
const SKILLS: Skill[] = ['sound', 'visual', 'interactive', 'code'];
const XP_PER_PUBLISH = 25;
const XP_PER_LEVEL = 50;
const BADGE_INTERVAL = 5;
const BADGE_TITLES: Record<Skill, string[]> = {
	sound: ['Rhythm Rookie', 'Beat Master', 'Audio Alchemist', 'Sound Sorcerer', 'Sonic Legend'],
	visual: ['Pixel Pioneer', 'Art Adept', 'Visual Virtuoso', 'Creative Catalyst', 'Digital Demigod'],
	interactive: ['Code Cadet', 'Interaction Innovator', 'Experience Expert', 'Digital Dynamo', 'Interactive Icon'],
	code: ['Script Novice', 'Code Craftsman', 'Algorithm Artist', 'Programming Prodigy', 'Code Grandmaster'],
};

function dbClient() {
	const svc = getSupabaseServiceClient();
	if (!svc) throw new Error('Supabase is not configured; studio XP requires DB.');
	return svc;
}

async function ensureStore() {
	const dir = path.dirname(DATA_PATH);
	await fs.mkdir(dir, { recursive: true });
	try {
		await fs.access(DATA_PATH);
	} catch {
		const initial = { creators: [] as StoreRecord[] };
		await fs.writeFile(DATA_PATH, JSON.stringify(initial, null, 2), 'utf8');
	}
}

async function readStore(): Promise<StoreRecord[]> {
	await ensureStore();
	const raw = await fs.readFile(DATA_PATH, 'utf8');
	try {
		const parsed = JSON.parse(raw) as { creators?: StoreRecord[] };
		return parsed.creators || [];
	} catch {
		return [];
	}
}

async function writeStore(creators: StoreRecord[]) {
	await ensureStore();
	await fs.writeFile(DATA_PATH, JSON.stringify({ creators }, null, 2), 'utf8');
}

function emptyXp(): Record<Skill, number> {
	return {
		sound: 0,
		visual: 0,
		interactive: 0,
		code: 0,
	};
}

export function xpToProgress(xp: number): SkillProgress {
	const level = Math.floor(xp / XP_PER_LEVEL) + 1;
	const intoLevel = xp % XP_PER_LEVEL;
	return {
		xp,
		level,
		progress: Math.min(1, intoLevel / XP_PER_LEVEL),
	};
}

async function dbAddExperience(address: string, skill: Skill, amount: number) {
	const svc = dbClient();
	const addr = address.toLowerCase();
	// upsert xp
	const { error } = await svc
		.from('studio_xp')
		.upsert({ address: addr, skill, xp: amount }, { onConflict: 'address,skill', ignoreDuplicates: false })
		.select();
	if (error) throw new Error(error.message);
	// increment to avoid overwrite; ignore if RPC missing
	try {
		const rpc = (svc as any).rpc?.bind?.(svc);
		if (rpc) {
			await rpc('increment_studio_xp', { p_address: addr, p_skill: skill, p_amount: amount });
		}
	} catch {
		// ignore
	}
}

async function dbGetSkills(address: string): Promise<CreatorSkills> {
	const svc = dbClient();
	const addr = address.toLowerCase();
	const { data, error } = await svc.from('studio_xp').select('*').eq('address', addr);
	if (error) throw new Error(error.message);
	const xpMap = emptyXp();
	for (const row of data || []) {
		const skill = row.skill as Skill;
		xpMap[skill] = row.xp || 0;
	}
	return Object.fromEntries(SKILLS.map((s) => [s, xpToProgress(xpMap[s] || 0)])) as CreatorSkills;
}

export async function addExperience(address: string, skill: Skill, amount = XP_PER_PUBLISH) {
	if (!address) return;
	await dbAddExperience(address, skill, amount);
}

export async function getCreatorSkills(address: string): Promise<CreatorSkills> {
	if (!address) {
		return Object.fromEntries(SKILLS.map((s) => [s, xpToProgress(0)])) as CreatorSkills;
	}
	return dbGetSkills(address);
}

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

