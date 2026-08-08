import type { LeadersCategorySetting } from "@/features/settings/application/leadersSettings";
import type { StatKey } from "@/features/stats/domain/entities/leaders-v2";

export type ConfiguredLeaderCategory = LeadersCategorySetting & { key: StatKey };

const STAT_KEYS: StatKey[] = ["Points", "Rebounds", "Assists", "Steals", "Blocks", "3-Pointers"];

const preferredStatKey = (name: string): StatKey | null => {
	const normalized = name.toLowerCase().replace(/[^a-z0-9]/g, "");
	if (normalized.startsWith("point") || normalized.startsWith("scor")) return "Points";
	if (normalized.startsWith("rebound") || normalized.startsWith("board")) return "Rebounds";
	if (normalized.startsWith("assist")) return "Assists";
	if (normalized.startsWith("steal")) return "Steals";
	if (normalized.startsWith("block")) return "Blocks";
	if (normalized.includes("3") || normalized.includes("three")) return "3-Pointers";
	return null;
};

/**
 * Maps editable labels to the six statistics the data source can calculate.
 * Known labels keep their semantic statistic; custom labels use the next
 * unused statistic so renaming and reordering rows never makes a pill vanish.
 */
export function resolveConfiguredLeaderCategories(categories: LeadersCategorySetting[]): ConfiguredLeaderCategory[] {
	const unused = [...STAT_KEYS];
	const resolved: ConfiguredLeaderCategory[] = [];

	for (const category of categories) {
		const preferred = preferredStatKey(category.name);
		const key = preferred && unused.includes(preferred) ? preferred : unused[0];
		if (!key) break;
		resolved.push({ ...category, key });
		unused.splice(unused.indexOf(key), 1);
	}

	return resolved;
}
